# 쿠키프렌즈 백로그

1차 오픈 범위와 이후 구현할 기능 정리.

## 1차 오픈 범위 (현재)

- ✅ **토벌전 기록 페이지** (`/`) — 시즌 선택, 보스별 딜량, 총합, 직전 시즌 대비 증감률, 티켓당 평균, 정렬(3단계)·검색, 닉네임 클릭 시 상세 패널, 라이트/다크 테마, 반응형(PC 테이블 / 모바일 카드)
- ✅ **설정 페이지** (`/settings`) — 라이트/다크/시스템 테마
- ✅ **배포** — GitHub Actions 수동 trigger, branch 기반, 공사중 페이지

## 1차 오픈에서 일시 제거한 것

UI/라우트에서 제거됨. 파일은 아직 `src/pages/`에 남아있을 수 있으니 정리 필요.

### 홈 대시보드 (`/`) — **1차 오픈 후 최우선**
- 쿠키 닉네임 등록되어 있으면 개인 대시보드 (내 최신 시즌 성적, 시즌별 추이, 길드 내 순위)
- 없으면 길드 요약 (Top N, 최근 시즌 차트) + 닉네임 설정 유도
- 현재는 토벌전 기록(`/guild` → `/`)이 홈 역할

### 닉네임 개인화
- `Setup` 페이지 (닉네임 선택 → 쿠키 저장)
- `nickname` zustand store (쿠키 persist)
- 홈 대시보드 / 내 기록 강조 등에 사용
- 홈과 함께 재도입

### 플레이어 상세
- 현재: 토벌전 페이지에서 닉네임 클릭 시 패널 (그 시즌 총합 + 보스별만)
- 추가 예정: 시즌별 추이 라인차트, 보스별 비중, 길드 내 순위 변화

### 시즌 상세 (`/season/:id`)
- 큰 시즌 전체 통계 (모든 작은 시즌 합산)
- 보스별 분석, 시즌 내 추이 비교

### 차트 (Recharts)
- 시즌별 딜량 추이
- 보스별 비중
- 플레이어/길드 단위

### 길드 활동 (장기)
- 공지사항 (`/notice`)
- 쿠폰 (`/coupon`)
- 카페 글 공유 (`/cafe`)

## 별도 트랙

### OCR 데이터 입력 도구 (진행 예정)
- Python (PyQt6 + PaddleOCR + mss)
- 게임 결과 화면 캡처 → OCR → 검수 → `data-source/records/{시즌ID}.json` 출력
- 사이트와 분리된 데스크탑 도구

## 정리 필요 (dead 파일)

다음 파일들은 라우트/import에서 제거됨. 물리 삭제 권장:
```
src/pages/Home.tsx
src/pages/Setup.tsx
src/pages/Season.tsx
src/pages/Player.tsx
src/pages/Notice.tsx
src/pages/Coupon.tsx
src/pages/Cafe.tsx
src/stores/nickname.ts
```
