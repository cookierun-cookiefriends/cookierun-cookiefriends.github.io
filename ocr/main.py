"""쿠키프렌즈 토벌전 OCR 도구.

게임 "토벌전 참여 현황" 화면에서 첫 줄의 셀(닉네임 / 보스별 횟수·딜량)을 한 번 지정하면,
'행 간격'으로 아래 줄을 자동 복제하여 한 화면의 모든 인원을 셀별 OCR한다.
결과를 data-source/records/{시즌ID}.json 형태로 내보낸다.

실행: 프로젝트 루트에서  py ocr/main.py   (또는 ocr 폴더에서  py main.py)
설치: pip install -r ocr/requirements.txt   (UI만 보려면 pip install PyQt6)

흐름:
  1) 시즌 ID/이름, 활성 보스 체크
  2) "영역 설정" → 게임 화면 위에서 표(리스트) 영역을 통으로 감싸기 → S 저장
  3) "캡처 & 인식" → 표 안에서 줄·보스칸·9회·딜량 자동 검출 → 검수
  4) JSON 내보내기 (스크롤 후 다시 캡처하면 새 인원만 추가)
"""

import sys
import re
import json
import time
import difflib
from pathlib import Path

from PyQt6.QtWidgets import (
    QApplication,
    QMainWindow,
    QWidget,
    QVBoxLayout,
    QHBoxLayout,
    QFormLayout,
    QLabel,
    QLineEdit,
    QCheckBox,
    QPushButton,
    QSlider,
    QTableWidget,
    QTableWidgetItem,
    QGroupBox,
    QHeaderView,
    QMessageBox,
    QFrame,
)
from PyQt6.QtCore import Qt, QRect, QPoint, QThread
from PyQt6.QtGui import QGuiApplication, QPainter, QColor, QPen

# 순서는 data-source/meta.json 의 bossOrder 와 일치해야 함 (내보낸 컬럼 순서 = 사이트 표시 순서)
BOSSES = [
    ("dragon", "드래곤"),
    ("angel", "대천사"),
    ("machine", "기계신"),
    ("licorice", "감초"),
]
BOSS_NAME = dict(BOSSES)
MAX_ATTEMPTS = 9  # 보스당 최대 도전 횟수 (meta.json 의 maxAttempts 와 동일)

OCR_DIR = Path(__file__).resolve().parent          # ocr/
REPO_ROOT = OCR_DIR.parent                          # 프로젝트 루트
RECORDS_DIR = REPO_ROOT / "data-source" / "records"  # 출력은 프로젝트 데이터로
REGIONS_PATH = OCR_DIR / "ocr_regions.json"          # 로컬 설정은 ocr/ 안에
NICKNAMES_PATH = OCR_DIR / "ocr_nicknames.txt"



def cells_for(boss_ids):
    """영역 박스 정의 [(key, 표시명)] — 표(리스트) 영역 통으로 1박스.

    캡처 시 이 박스 안에서 보스 영역(가로)·줄(세로)을 자동 검출하고, 보스 영역을
    보스 수로 균등 분할 → 각 칸 상(9회)/하(딜량) OCR. 닉네임은 보스 영역 왼쪽을 읽음.
    스크롤 위치·참여 여부와 무관. 박스 하나만 표 전체에 맞추면 된다.
    """
    return [("table", "표 영역 (리스트 전체)")]


# ---------- 캡처 / OCR ----------
def capture_region(rect: QRect, sct):
    import numpy as np

    raw = sct.grab(
        {
            "left": rect.x(),
            "top": rect.y(),
            "width": rect.width(),
            "height": rect.height(),
        }
    )
    return np.array(raw)[:, :, :3]


def _scroll_at(x, y, notches):
    """(x, y) 위치로 커서를 옮기고 마우스 휠 스크롤. notches<0 = 아래로."""
    import ctypes

    user32 = ctypes.windll.user32
    user32.SetCursorPos(int(x), int(y))
    time.sleep(0.05)                       # 커서 이동 후 게임이 hover 인식할 시간
    user32.mouse_event(0x0800, 0, 0, ctypes.c_int(int(notches * 120)), 0)  # WHEEL


def _preprocess(img):
    import cv2

    h, w = img.shape[:2]
    return cv2.resize(img, (w * 4, h * 4), interpolation=cv2.INTER_CUBIC)


_rec_engine = None
_nick_engine = None


def get_nick(img):
    """닉네임 셀 → 텍스트. PaddleOCR korean rec(검출 생략) — 빠르고 한글 인식."""
    global _nick_engine
    if _nick_engine is None:
        from paddleocr import TextRecognition

        _nick_engine = TextRecognition(model_name="korean_PP-OCRv5_mobile_rec")
    result = _nick_engine.predict(_preprocess(img))
    return " ".join(x.get("rec_text", "") for x in result).strip()


def get_numbers(img):
    """딜량 셀 → 숫자 문자열. PaddleOCR rec 전용(검출 생략) — 빠르고 콤마 포함 정확."""
    global _rec_engine
    if _rec_engine is None:
        from paddleocr import TextRecognition

        _rec_engine = TextRecognition(model_name="en_PP-OCRv5_mobile_rec")
    result = _rec_engine.predict(_preprocess(img))
    return " ".join(x.get("rec_text", "") for x in result)


def _digits(text):
    """OCR 텍스트에서 숫자만 추출. '미참여' 등 '참여' 포함 시 빈 문자열."""
    return "" if "참여" in text else re.sub(r"\D", "", text)


def parse_count(text):
    """횟수 문자열 → 0~MAX_ATTEMPTS. '미참여'/숫자 없음 → 0."""
    digits = _digits(text)
    return min(int(digits), MAX_ATTEMPTS) if digits else 0


def parse_damage(text):
    """딜량 문자열 → 정수. '미참여'·공란·노이즈(100만 미만)는 0."""
    digits = _digits(text)
    val = int(digits) if digits else 0
    return val if val >= 1_000_000 else 0


def load_known_nicknames():
    """ocr_nicknames.txt(한 줄당 한 닉)에서 등록 닉 목록 로드. 없으면 빈 리스트."""
    if NICKNAMES_PATH.exists():
        return [
            ln.strip()
            for ln in NICKNAMES_PATH.read_text(encoding="utf-8").splitlines()
            if ln.strip()
        ]
    return []


_CHO = "ㄱㄲㄴㄷㄸㄹㅁㅂㅃㅅㅆㅇㅈㅉㅊㅋㅌㅍㅎ"
_JUNG = "ㅏㅐㅑㅒㅓㅔㅕㅖㅗㅘㅙㅚㅛㅜㅝㅞㅟㅠㅡㅢㅣ"
_JONG = [
    "", "ㄱ", "ㄲ", "ㄳ", "ㄴ", "ㄵ", "ㄶ", "ㄷ", "ㄹ", "ㄺ", "ㄻ", "ㄼ", "ㄽ",
    "ㄾ", "ㄿ", "ㅀ", "ㅁ", "ㅂ", "ㅄ", "ㅅ", "ㅆ", "ㅇ", "ㅈ", "ㅊ", "ㅋ",
    "ㅌ", "ㅍ", "ㅎ",
]


def _decompose(s):
    """한글을 자모로 분해 (영문/숫자는 소문자). 한글 유사도 비교용."""
    out = []
    for ch in s:
        if "가" <= ch <= "힣":
            code = ord(ch) - 0xAC00
            out.append(_CHO[code // 588])
            out.append(_JUNG[(code % 588) // 28])
            out.append(_JONG[code % 28])
        else:
            out.append(ch.lower())
    return "".join(out)


def match_nickname(nick, known):
    """OCR 닉을 등록 길드원 목록과 자모 단위로 비교해 가장 비슷한 닉으로 무조건 치환.

    목록(ocr_nicknames.txt)이 있으면 OCR이 깨져 읽어도 항상 목록 안의 닉이 들어간다.
    목록에 없는 신규 길드원은 엉뚱하게 매칭될 수 있으니 목록에 미리 등록해 둘 것.
    """
    if not nick or not known:
        return nick
    target = _decompose(nick)
    best, best_score = nick, -1.0
    for k in known:
        score = difflib.SequenceMatcher(None, target, _decompose(k)).ratio()
        if score > best_score:
            best_score, best = score, k
    return best


def _shift(box, dy, pad_x=0):
    # pad_x: 좌우 여백 — 박스 가장자리 숫자가 잘리는 것 방지
    return QRect(box[0] - pad_x, box[1] + dy, box[2] + 2 * pad_x, box[3])


def _empty_bosses():
    """모든 보스 0/0 으로 초기화한 기록 골격."""
    return {bid: {"attempts": 0, "damage": 0} for bid, _ in BOSSES}


def _detect_grid(table_box, n, sct):
    """표 영역 1박스 안에서 보스 영역(가로)·줄(세로)을 자동 검출.

    1) 세로 전체 평균 가로 프로파일 → 가장 넓은 회색칸 = 보스 영역(가로 위치).
       (여러 줄 평균하면 닉네임 글자는 흐려지고 고정된 회색 점수칸만 남는다.)
    2) 보스 영역 첫 칸 컬럼의 세로 프로파일 → 흰 간격(>236)으로 나뉜 칸 = 각 줄.
    참여·미참여·스크롤 무관. 반환 (boss_x0, cell_w, [row_cy...], row_h) 또는 None.
    """
    import cv2

    tx, ty, tw, th = table_box
    gray = cv2.cvtColor(
        capture_region(QRect(tx, ty, tw, th), sct), cv2.COLOR_BGR2GRAY
    )

    # 1) 가로: 세로 전체 평균 → 회색칸들 중 가장 넓은 것 = 보스 영역
    hwhite = gray.mean(axis=0) > 236
    runs = []
    in_r = False
    s = 0
    for x in range(tw):
        cell = not hwhite[x]
        if cell and not in_r:
            s, in_r = x, True
        elif not cell and in_r:
            runs.append((s, x))
            in_r = False
    if in_r:
        runs.append((s, tw))
    runs = [r for r in runs if r[1] - r[0] >= tw * 0.12]
    if not runs:
        return None
    bx0, bx1 = max(runs, key=lambda r: r[1] - r[0])      # 가장 넓음 = 보스 영역
    cell_w = (bx1 - bx0) // max(1, n)

    # 2) 세로: 보스 영역 첫 칸 중앙 컬럼 → 흰 간격으로 나뉜 온전한 칸 = 줄
    cxl, cxr = bx0 + cell_w // 4, bx0 + cell_w * 3 // 4
    vwhite = gray[:, cxl:cxr].mean(axis=1) > 236
    cells = []
    in_c = False
    s = 0
    for y in range(th):
        cell = not vwhite[y]
        if cell and not in_c:
            s, in_c = y, True
        elif not cell and in_c:
            if y - s >= 40:                  # 칸 경계선(1~4px) 노이즈 제외
                cells.append((s, y))
            in_c = False
    if in_c and th - s >= 40:
        cells.append((s, th))
    if not cells:
        return None
    heights = sorted(e - s for s, e in cells)
    med = heights[len(heights) // 2]                     # 온전한 칸 높이(중앙값)
    rows = [ty + (s + e) // 2 for s, e in cells if med * 0.7 <= e - s <= med * 1.3]
    if not rows:
        return None
    return (tx + bx0, cell_w, rows, med)


def capture_with_regions(data, boss_ids, auto_align=True):
    """표 영역 1박스 + 완전 자동 검출로 모든 줄을 셀별 OCR → 레코드 리스트.

    표 영역 안에서 보스 영역(가로)·줄(세로)을 자동 검출하고, 보스 영역을 보스 수로
    균등 분할 → 각 칸 상(9회)/하(딜량) OCR. 닉네임은 보스 영역 왼쪽을 읽어 매칭.
    스크롤·참여 여부 무관. (auto_align 인자는 호환용; 항상 자동 검출)
    """
    import mss

    boxes = data["boxes"]
    known = load_known_nicknames()
    tb = boxes.get("table")
    n = len(boss_ids)
    records = []
    if not tb or not n:
        return records
    with mss.mss() as sct:  # 캡처당 mss 인스턴스 1개만 만들어 모든 셀에 재사용
        grid = _detect_grid(tb, n, sct)
        if not grid:
            return records
        boss_x0, cell_w, rows, row_h = grid
        nick_w = max(40, boss_x0 - tb[0] - 8)            # 표 왼쪽 ~ 보스 영역 = 닉 영역
        for cy in rows:
            top = cy - row_h // 2
            # 닉네임은 칸 하단(42~95%)만 읽는다 — 위쪽 칭호가 섞이면 짧은 닉이 오매칭됨
            ny, nh = top + int(row_h * 0.42), int(row_h * 0.53)
            nick = get_nick(capture_region(QRect(tb[0], ny, nick_w, nh), sct))
            nick = match_nickname(nick, known)
            if not nick:
                continue
            boss_data = _empty_bosses()
            for i, bid in enumerate(boss_ids):
                cx = boss_x0 + cell_w * i
                # 칸을 상(9회)/하(딜량)로 나눠 각각 OCR
                # 횟수 "9회"는 한글이 붙어 korean rec가 정확, 딜량은 순수 숫자라 en rec
                # 9회는 칸 상단 ~20~54% 위치(위 여백 제외해야 인식 안정), 딜량은 하반부
                att_box = [cx, top + int(row_h * 0.20), cell_w, int(row_h * 0.34)]
                dmg_box = [cx, cy, cell_w, row_h - row_h // 2]
                att = parse_count(get_nick(capture_region(_shift(att_box, 0, 4), sct)))
                dmg = parse_damage(get_numbers(capture_region(_shift(dmg_box, 0, 6), sct)))
                # 한쪽이라도 0이면 인식 오류 → 둘 다 0 (횟수·딜량은 항상 함께 0/0)
                if not att or not dmg:
                    att = dmg = 0
                boss_data[bid] = {"attempts": att, "damage": dmg}
            records.append({"nickname": nick, "bosses": boss_data})
    return records


def save_regions(data):
    REGIONS_PATH.write_text(
        json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8"
    )


def load_regions():
    if REGIONS_PATH.exists():
        try:
            return json.loads(REGIONS_PATH.read_text(encoding="utf-8"))
        except Exception:
            return None
    return None


# ---------- 영역 편집 오버레이 ----------
class RegionEditor(QWidget):
    """전체화면 오버레이 — 첫 줄 셀 박스를 드래그/리사이즈하고 휠로 행 간격 조절."""

    HANDLE = 16

    def __init__(self, cells, initial, rows, row_height, on_save):
        super().__init__()
        self.cells = cells
        self.rows = rows
        self.row_height = row_height or 110
        self.on_save = on_save
        self.active = None
        self.offset = QPoint()

        self.setWindowFlags(
            Qt.WindowType.FramelessWindowHint | Qt.WindowType.WindowStaysOnTopHint
        )
        self.setAttribute(Qt.WidgetAttribute.WA_TranslucentBackground)
        screen = QGuiApplication.primaryScreen().geometry()
        self.setGeometry(screen)
        self.setMouseTracking(True)

        # 첫 줄 박스: 저장값 우선, 없으면 가로로 기본 배치
        self.boxes = {}
        W, H = screen.width(), screen.height()
        x = int(W * 0.1)
        for key, _name in cells:
            if initial and key in initial:
                self.boxes[key] = QRect(*initial[key])
            else:
                w, h = 820, 480                       # 표(리스트) 영역 — 여러 줄 통으로
                self.boxes[key] = QRect(x, int(H * 0.16), w, h)
                x += w + 24

    def _handle(self, rect: QRect) -> QRect:
        return QRect(
            rect.right() - self.HANDLE, rect.bottom() - self.HANDLE, self.HANDLE, self.HANDLE
        )

    def paintEvent(self, _e):
        p = QPainter(self)
        p.fillRect(self.rect(), QColor(20, 16, 30, 110))
        for key, name in self.cells:
            rect = self.boxes[key]
            # 아래 줄 미리보기 — 밝은 하늘색 + 채움으로 잘 보이게
            for r in range(1, self.rows):
                rr = QRect(
                    rect.x(), rect.y() + self.row_height * r, rect.width(), rect.height()
                )
                p.fillRect(rr, QColor(120, 220, 255, 40))
                p.setPen(QPen(QColor(140, 225, 255), 2, Qt.PenStyle.DashLine))
                p.drawRect(rr)
            # 첫 줄 (진하게)
            p.fillRect(rect, QColor(232, 146, 58, 35))
            p.setPen(QPen(QColor("#e8923a"), 2))
            p.drawRect(rect)
            p.setPen(QColor("#ffffff"))
            p.drawText(rect.x() + 2, rect.y() - 5, name)
            p.fillRect(self._handle(rect), QColor("#e8923a"))
        p.setPen(QColor("#ffffff"))
        p.drawText(
            self.rect().adjusted(0, 16, -16, 0),
            Qt.AlignmentFlag.AlignTop | Qt.AlignmentFlag.AlignHCenter,
            "표 영역(줄이 다 들어가게)을 감싸세요  ·  S: 저장  ·  Esc: 취소",
        )

    def wheelEvent(self, e):
        step = 5 if e.angleDelta().y() > 0 else -5
        self.row_height = max(20, self.row_height + step)
        self.update()

    def mousePressEvent(self, e):
        pos = e.position().toPoint()
        for key, _name in reversed(self.cells):
            rect = self.boxes[key]
            if self._handle(rect).contains(pos):
                self.active = (key, "resize")
                return
            if rect.contains(pos):
                self.active = (key, "move")
                self.offset = pos - rect.topLeft()
                return

    def mouseMoveEvent(self, e):
        if not self.active:
            return
        key, mode = self.active
        rect = self.boxes[key]
        pos = e.position().toPoint()
        if mode == "move":
            rect.moveTopLeft(pos - self.offset)
        else:
            rect.setRight(max(pos.x(), rect.x() + 30))
            rect.setBottom(max(pos.y(), rect.y() + 24))
        self.update()

    def mouseReleaseEvent(self, _e):
        self.active = None

    def keyPressEvent(self, e):
        if e.key() == Qt.Key.Key_S:
            self.on_save(
                {
                    "rows": self.rows,
                    "row_height": self.row_height,
                    "boxes": {
                        k: [r.x(), r.y(), r.width(), r.height()]
                        for k, r in self.boxes.items()
                    },
                }
            )
            self.close()
        elif e.key() == Qt.Key.Key_Escape:
            self.close()


class _WarmupThread(QThread):
    """앱 시작 시 OCR 엔진을 백그라운드로 미리 로드 → 첫 캡처 지연 제거."""

    def run(self):
        import numpy as np

        dummy = np.full((40, 200, 3), 255, np.uint8)
        for fn in (get_numbers, get_nick):
            try:
                fn(dummy)
            except Exception:
                pass


# ---------- 메인 윈도우 ----------
class MainWindow(QMainWindow):
    def __init__(self):
        super().__init__()
        self.setWindowTitle("쿠키프렌즈 토벌전 OCR")
        self.resize(1440, 760)
        self.boss_checks: dict[str, QCheckBox] = {}
        self._build_ui()
        self.boss_checks["machine"].setChecked(True)
        self.boss_checks["licorice"].setChecked(True)
        self._rebuild_columns()
        # OCR 엔진 백그라운드 워밍업 (완료 전까지 캡처 비활성)
        self.status.setText("OCR 엔진 준비 중...")
        self.btn_capture.setEnabled(False)
        self.btn_auto.setEnabled(False)
        self._warmup = _WarmupThread()
        self._warmup.finished.connect(
            lambda: (
                self.status.setText("준비됨"),
                self.btn_capture.setEnabled(True),
                self.btn_auto.setEnabled(True),
            )
        )
        self._warmup.start()

    def _build_ui(self):
        central = QWidget()
        self.setCentralWidget(central)
        root = QHBoxLayout(central)
        root.setContentsMargins(16, 16, 16, 16)
        root.setSpacing(16)
        main = self._build_main()
        side = self._build_sidebar()
        root.addWidget(side, 0)
        root.addWidget(main, 1)

    def _build_sidebar(self) -> QWidget:
        side = QWidget()
        side.setObjectName("sidebar")
        side.setFixedWidth(360)
        lay = QVBoxLayout(side)
        lay.setContentsMargins(18, 18, 18, 18)
        lay.setSpacing(14)

        lay.addWidget(self._brand("쿠키프렌즈", "brand"))
        lay.addWidget(self._brand("토벌전 OCR 입력 도구", "brandSub"))
        lay.addWidget(self._hline())

        season_box = QGroupBox("시즌 정보")
        form = QFormLayout(season_box)
        form.setSpacing(8)
        self.season_id = QLineEdit()
        self.season_id.setPlaceholderText("예: 30-4")
        self.season_name = QLineEdit()
        self.season_name.setPlaceholderText("예: 비상하는 운명의 시즌 30-4")
        form.addRow("시즌 ID", self.season_id)
        form.addRow("시즌 이름", self.season_name)
        lay.addWidget(season_box)

        boss_box = QGroupBox("활성 보스 (이 시즌)")
        bl = QVBoxLayout(boss_box)
        bl.setSpacing(4)
        for bid, name in BOSSES:
            cb = QCheckBox(f"{name}  ({bid})")
            cb.toggled.connect(self._rebuild_columns)
            self.boss_checks[bid] = cb
            bl.addWidget(cb)
        lay.addWidget(boss_box)

        self.btn_regions = QPushButton("영역 설정")
        self.btn_regions.clicked.connect(self._on_set_regions)
        self.btn_capture = QPushButton("캡처 인식")
        self.btn_capture.setObjectName("primary")
        self.btn_capture.clicked.connect(self._on_capture)
        self.btn_auto = QPushButton("자동 캡처 (스크롤)")
        self.btn_auto.setObjectName("primary")
        self.btn_auto.clicked.connect(self._on_auto_capture)

        srow = QHBoxLayout()
        srow.addWidget(QLabel("스크롤 양"))
        self.scroll_slider = QSlider(Qt.Orientation.Horizontal)
        self.scroll_slider.setRange(4, 40)
        self.scroll_slider.setValue(16)
        self.scroll_val = QLabel("16")
        self.scroll_slider.valueChanged.connect(lambda v: self.scroll_val.setText(str(v)))
        srow.addWidget(self.scroll_slider, 1)
        srow.addWidget(self.scroll_val)

        lay.addWidget(self.btn_regions)
        lay.addWidget(self.btn_capture)
        lay.addWidget(self.btn_auto)
        lay.addLayout(srow)
        lay.addStretch(1)

        self.status = QLabel("준비됨")
        self.status.setObjectName("status")
        self.status.setWordWrap(True)
        lay.addWidget(self.status)
        return side

    def _build_main(self) -> QWidget:
        main = QWidget()
        lay = QVBoxLayout(main)
        lay.setContentsMargins(0, 0, 0, 0)
        lay.setSpacing(12)

        header_row = QHBoxLayout()
        header = QLabel("토벌전 기록 입력")
        header.setObjectName("pageTitle")
        header_row.addWidget(header)
        header_row.addStretch(1)
        self.btn_add = QPushButton("＋")
        self.btn_add.setObjectName("iconBtn")
        self.btn_add.setToolTip("행 추가")
        self.btn_add.clicked.connect(lambda: self._add_row())
        btn_del = QPushButton("🗑")
        btn_del.setObjectName("iconBtn")
        btn_del.setToolTip("선택 행 삭제")
        btn_del.clicked.connect(self._delete_selected)
        btn_clear = QPushButton("🧹")
        btn_clear.setObjectName("iconBtn")
        btn_clear.setToolTip("전체 비우기")
        btn_clear.clicked.connect(self._clear_rows)
        for b in (self.btn_add, btn_del, btn_clear):
            header_row.addWidget(b)
        lay.addLayout(header_row)

        self.table = QTableWidget(0, 1)
        self.table.verticalHeader().setVisible(False)
        self.table.verticalHeader().setDefaultSectionSize(40)
        # 셀 직접 편집·선택 변경도 하단 카운트에 실시간 반영
        self.table.itemChanged.connect(self._on_item_changed)
        self.table.itemSelectionChanged.connect(self._update_count)
        lay.addWidget(self.table, 1)

        bottom = QHBoxLayout()
        self.count_label = QLabel("0명 입력됨")
        self.count_label.setObjectName("status")
        bottom.addWidget(self.count_label)
        bottom.addStretch(1)
        btn_export = QPushButton("JSON 내보내기")
        btn_export.setObjectName("primary")
        btn_export.clicked.connect(self._export)
        bottom.addWidget(btn_export)
        lay.addLayout(bottom)
        return main

    def _brand(self, text, obj) -> QLabel:
        lb = QLabel(text)
        lb.setObjectName(obj)
        return lb

    def _hline(self) -> QFrame:
        line = QFrame()
        line.setFrameShape(QFrame.Shape.HLine)
        line.setObjectName("hline")
        return line

    # ----- 동작 -----
    def active_bosses(self) -> list[str]:
        return [bid for bid, _ in BOSSES if self.boss_checks[bid].isChecked()]

    def _rebuild_columns(self):
        if not hasattr(self, "table"):
            return
        bosses = self.active_bosses()
        headers = ["닉네임"]
        for bid in bosses:
            headers.append(f"{BOSS_NAME[bid]} 횟수")
            headers.append(f"{BOSS_NAME[bid]} 딜량")
        headers.append("시즌 종합 딜량")          # 보스 딜량 합 (읽기전용)
        self.table.setColumnCount(len(headers))
        self.table.setHorizontalHeaderLabels(headers)
        header = self.table.horizontalHeader()
        Mode = QHeaderView.ResizeMode
        header.setSectionResizeMode(0, Mode.Interactive)
        self.table.setColumnWidth(0, 150)
        col = 1
        for _ in bosses:
            header.setSectionResizeMode(col, Mode.ResizeToContents)
            header.setSectionResizeMode(col + 1, Mode.Stretch)
            col += 2
        header.setSectionResizeMode(col, Mode.Stretch)   # 시즌 종합 딜량

    def _add_row(self, nickname: str = "", values: dict | None = None):
        bosses = self.active_bosses()
        row = self.table.rowCount()
        self.table.blockSignals(True)        # 행 채우는 동안 itemChanged 억제
        self.table.insertRow(row)
        self.table.setItem(row, 0, QTableWidgetItem(nickname))
        col = 1
        total = 0
        for bid in bosses:
            v = (values or {}).get(bid, {})
            self.table.setItem(row, col, QTableWidgetItem(str(v.get("attempts", ""))))
            dmg = v.get("damage", "")
            self.table.setItem(row, col + 1, QTableWidgetItem(str(dmg)))
            total += int(dmg) if str(dmg).isdigit() else 0
            col += 2
        self.table.setItem(row, col, self._readonly_item(f"{total:,}"))   # 시즌 종합 딜량
        self.table.blockSignals(False)
        self._update_count()

    def _delete_selected(self):
        rows = sorted({i.row() for i in self.table.selectedIndexes()}, reverse=True)
        for r in rows:
            self.table.removeRow(r)
        self._update_count()

    def _clear_rows(self):
        self.table.setRowCount(0)
        self._update_count()

    def _update_count(self):
        n = sum(
            1
            for r in range(self.table.rowCount())
            if (self.table.item(r, 0) and self.table.item(r, 0).text().strip())
        )
        sel = len({i.row() for i in self.table.selectedIndexes()})
        text = f"{n}명 입력됨"
        if sel:
            text += f"  ·  {sel}명 선택됨"
        self.count_label.setText(text)

    def _readonly_item(self, text: str) -> QTableWidgetItem:
        item = QTableWidgetItem(text)
        item.setFlags(item.flags() & ~Qt.ItemFlag.ItemIsEditable)
        return item

    def _on_item_changed(self, item):
        self._update_count()
        col = item.column()
        if col >= 2 and col % 2 == 0:        # 딜량 컬럼(2,4,…) 수정 → 그 행 종합 갱신
            self._update_total(item.row())

    def _update_total(self, row: int):
        """그 행의 보스 딜량 합을 '시즌 종합 딜량' 칸에 다시 쓴다(읽기전용)."""
        bosses = self.active_bosses()
        total = 0
        col = 1
        for _ in bosses:
            total += self._cell_int(row, col + 1)
            col += 2
        self.table.blockSignals(True)
        cell = self.table.item(row, col)
        if cell is None:
            self.table.setItem(row, col, self._readonly_item(f"{total:,}"))
        else:
            cell.setText(f"{total:,}")
        self.table.blockSignals(False)

    def _verify_order(self):
        """보스 합 딜량이 위→아래 내림차순인지 검증(게임 정렬과 일치해야 정상)."""
        ncol = 1 + len(self.active_bosses()) * 2     # 시즌 종합 딜량 컬럼
        totals = []
        for r in range(self.table.rowCount()):
            item = self.table.item(r, 0)
            nick = item.text().strip() if item else ""
            if nick:
                totals.append((nick, self._cell_int(r, ncol)))
        bad = [
            f"{totals[i][0]}({totals[i][1]:,}) < 아래 {totals[i + 1][0]}({totals[i + 1][1]:,})"
            for i in range(len(totals) - 1)
            if totals[i][1] < totals[i + 1][1]
        ]
        if bad:
            QMessageBox.warning(
                self,
                "인식 오류 의심",
                "합 딜량이 위→아래 내림차순이 아닙니다 — 잘못 인식된 줄이 있을 수 있어요.\n"
                "딜량을 확인하거나 다시 캡처해 주세요.\n\n어긋난 곳:\n" + "\n".join(bad[:8]),
            )
        else:
            QMessageBox.information(
                self,
                "정상",
                f"합 딜량이 내림차순으로 잘 정렬되어 있습니다. ({len(totals)}명)",
            )

    def keyPressEvent(self, e):
        if e.key() == Qt.Key.Key_Delete and self.table.hasFocus():
            self._delete_selected()
        else:
            super().keyPressEvent(e)

    # ----- 영역 설정 / 캡처 -----
    def _on_set_regions(self):
        if not self.active_bosses():
            QMessageBox.warning(self, "확인", "활성 보스를 먼저 체크하세요.")
            return
        saved = load_regions()
        initial = saved["boxes"] if saved else None
        rh = saved.get("row_height") if saved else None
        self._editor = RegionEditor(
            cells_for(self.active_bosses()),
            initial,
            1,  # 표 1박스 — 줄 미리보기 불필요(캡처 시 자동 검출)
            rh,
            self._on_regions_saved,
        )
        self._editor.show()

    def _on_regions_saved(self, data):
        save_regions(data)
        self.status.setText("표 영역 저장됨 — 캡처 시 줄·보스칸 자동 검출")

    def _on_capture(self):
        saved = load_regions()
        if not saved:
            QMessageBox.warning(self, "확인", "먼저 '영역 설정'으로 캡처 영역을 지정하세요.")
            return
        self.status.setText("인식 중... (첫 실행은 모델 로딩으로 느릴 수 있음)")
        QApplication.processEvents()
        try:
            records = capture_with_regions(saved, self.active_bosses())
        except ImportError:
            QMessageBox.critical(
                self, "설치 필요", "OCR 라이브러리 미설치\npip install -r requirements.txt"
            )
            return
        except Exception as ex:  # noqa: BLE001
            QMessageBox.critical(self, "오류", f"캡처 실패:\n{ex}")
            return
        existing = {
            self.table.item(r, 0).text().strip()
            for r in range(self.table.rowCount())
            if self.table.item(r, 0)
        }
        added = 0
        for rec in records:
            nick = rec["nickname"]
            if not nick or nick in existing:
                continue
            self._add_row(nick, rec["bosses"])
            existing.add(nick)
            added += 1
        self.status.setText(f"인식 완료: {added}명 추가됨 — 표에서 검수/수정하세요")

    def _on_auto_capture(self):
        """표 영역을 자동으로 스크롤하며 끝까지 캡처. 스크롤이 멈추면(픽셀 동일) 종료."""
        saved = load_regions()
        if not saved or "table" not in saved.get("boxes", {}):
            QMessageBox.warning(self, "확인", "먼저 '영역 설정'으로 표 영역을 지정하세요.")
            return
        import numpy as np

        tb = saved["boxes"]["table"]
        bosses = self.active_bosses()
        existing = {
            self.table.item(r, 0).text().strip()
            for r in range(self.table.rowCount())
            if self.table.item(r, 0)
        }
        cx, cy = tb[0] + tb[2] // 2, tb[1] + tb[3] // 2
        prev = None
        stale = 0
        added = 0
        self.btn_auto.setEnabled(False)
        self.btn_capture.setEnabled(False)
        try:
            import mss

            with mss.mss() as sct:
                for it in range(50):                  # 안전 상한
                    self.status.setText(f"자동 캡처 중... (화면 {it + 1}, {added}명)")
                    QApplication.processEvents()
                    cur = np.asarray(capture_region(QRect(*tb), sct), dtype=np.int16)
                    changed = prev is None or float(np.abs(cur - prev).mean()) >= 3.0
                    prev = cur
                    if changed:
                        stale = 0
                        for rec in capture_with_regions(saved, bosses):
                            nick = rec["nickname"]
                            if nick and nick not in existing:
                                self._add_row(nick, rec["bosses"])
                                existing.add(nick)
                                added += 1
                    else:
                        stale += 1
                        if stale >= 2:                # 2회 연속 안 변함 = 끝
                            break
                    QApplication.processEvents()
                    _scroll_at(cx, cy, -self.scroll_slider.value())  # 슬라이더 양만큼 아래로
                    time.sleep(1.0)                   # 스크롤 내려가는 시간 대기
        except ImportError:
            QMessageBox.critical(
                self, "설치 필요", "OCR 라이브러리 미설치\npip install -r requirements.txt"
            )
            return
        except Exception as ex:  # noqa: BLE001
            QMessageBox.critical(self, "오류", f"자동 캡처 실패:\n{ex}")
        finally:
            self.btn_auto.setEnabled(True)
            self.btn_capture.setEnabled(True)
        self.status.setText(f"자동 캡처 완료: 총 {added}명 추가됨 (스크롤 끝까지)")
        self._verify_order()

    # ----- 내보내기 -----
    def _collect_records(self) -> list[dict]:
        bosses = self.active_bosses()
        records = []
        for r in range(self.table.rowCount()):
            nick_item = self.table.item(r, 0)
            nick = nick_item.text().strip() if nick_item else ""
            if not nick:
                continue
            boss_data = _empty_bosses()
            col = 1
            for bid in bosses:
                boss_data[bid] = {
                    "attempts": self._cell_int(r, col),
                    "damage": self._cell_int(r, col + 1),
                }
                col += 2
            records.append({"nickname": nick, "bosses": boss_data})
        return records

    def _cell_int(self, row: int, col: int) -> int:
        item = self.table.item(row, col)
        if not item:
            return 0
        text = item.text().strip().replace(",", "")
        try:
            return int(text)
        except ValueError:
            return 0

    def _export(self):
        sid = self.season_id.text().strip()
        if not sid:
            QMessageBox.warning(self, "확인", "시즌 ID를 입력해주세요 (예: 30-4).")
            return
        records = self._collect_records()
        if not records:
            QMessageBox.warning(self, "확인", "입력된 데이터가 없습니다.")
            return
        RECORDS_DIR.mkdir(parents=True, exist_ok=True)
        out = RECORDS_DIR / f"{sid}.json"
        out.write_text(
            json.dumps(records, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
        )
        self.status.setText(f"저장됨: {out.name} ({len(records)}명)")
        QMessageBox.information(
            self,
            "완료",
            f"{out}\n\n{len(records)}명 저장됨.\n"
            f"seasons.json 에 시즌 메타 추가 후 build:data 실행하세요.",
        )


QSS = """
QMainWindow, QWidget { background: #2a2036; color: #f5ecf5; font-size: 13px; }
QLabel { background: transparent; }
#sidebar { background: #342843; border: 1px solid #463655; border-radius: 14px; }
#brand { font-size: 18px; font-weight: 700; color: #f5ecf5; }
#brandSub { font-size: 11px; color: #cbbdd6; }
#pageTitle { font-size: 22px; font-weight: 700; }
#status { font-size: 11px; color: #cbbdd6; }
#hline { color: #463655; }
QGroupBox {
    border: 1px solid #463655; border-radius: 10px; margin-top: 10px;
    padding: 12px 10px 10px 10px; font-weight: 600;
}
QGroupBox::title { subcontrol-origin: margin; left: 10px; padding: 0 4px; color: #cbbdd6; }
QLineEdit, QSpinBox {
    background: #241b2e; border: 1px solid #463655; border-radius: 8px;
    padding: 6px 8px; color: #f5ecf5;
}
QLineEdit:focus, QSpinBox:focus { border-color: #e8923a; }
QCheckBox { padding: 3px 0; }
QPushButton {
    background: #423152; border: 1px solid #463655; border-radius: 9px;
    padding: 9px 12px; color: #f5ecf5; font-weight: 600;
}
QPushButton:hover { background: #503c63; }
QPushButton#primary { background: #e8923a; border: none; color: #241b2e; }
QPushButton#primary:hover { background: #f0a352; }
QPushButton#iconBtn {
    padding: 0; font-size: 15px; border-radius: 8px;
    min-width: 34px; max-width: 34px; min-height: 34px; max-height: 34px;
}
QTableWidget {
    background: #342843; border: 1px solid #463655; border-radius: 12px;
    gridline-color: #463655;
}
QHeaderView::section {
    background: #423152; color: #cbbdd6; padding: 8px;
    border: none; border-bottom: 1px solid #463655; font-weight: 600;
}
QTableWidget::item { padding: 6px; }
QTableWidget::item:selected { background: #e8923a; color: #241b2e; }
QTableWidget QLineEdit {
    background: #ffffff; color: #1a1420; border: 2px solid #e8923a;
    border-radius: 4px; padding: 2px 6px;
    selection-background-color: #e8923a; selection-color: #ffffff;
}
QSlider::groove:horizontal { height: 4px; background: #463655; border-radius: 2px; }
QSlider::sub-page:horizontal { background: #e8923a; border-radius: 2px; }
QSlider::handle:horizontal {
    width: 16px; background: #e8923a; border-radius: 8px; margin: -6px 0;
}
QSlider::handle:horizontal:hover { background: #f0a352; }
"""


def main():
    app = QApplication(sys.argv)
    app.setStyleSheet(QSS)
    win = MainWindow()
    win.show()
    sys.exit(app.exec())


if __name__ == "__main__":
    main()
