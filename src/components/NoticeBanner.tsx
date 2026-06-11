import { useEffect, useState } from 'react';
import { X, Megaphone, ExternalLink, AlertTriangle } from 'lucide-react';
import { useNotice } from '@/hooks/queries';

const DISMISS_KEY = 'cf-notice-dismiss';

/**
 * 사이트 진입 시 공지 모달.
 * - "확인"/X: 이번만 닫음(새로고침하면 다시 뜸) — 테스트·임시 닫기용.
 * - "하루 동안 안 보기": 24시간 안 뜸(localStorage에 만료시각 저장).
 * id가 바뀌면(새 공지) 하루 안 보기도 무시하고 다시 뜸.
 */
export function NoticeBanner() {
  const { data } = useNotice();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!data?.active) return;
    const raw = localStorage.getItem(DISMISS_KEY);
    if (raw) {
      try {
        const { id, until } = JSON.parse(raw) as { id: string; until: number };
        if (id === data.id && until > Date.now()) return; // 하루 안 보기 유효
      } catch {
        /* 무시하고 표시 */
      }
    }
    setOpen(true);
  }, [data]);

  if (!open || !data) return null;

  // 이번만 닫기 — 저장하지 않아 새로고침 시 다시 뜬다.
  const close = () => setOpen(false);

  // 하루 동안 안 보기 — 24시간 만료시각 저장.
  const dismissDay = () => {
    localStorage.setItem(
      DISMISS_KEY,
      JSON.stringify({ id: data.id, until: Date.now() + 24 * 60 * 60 * 1000 }),
    );
    setOpen(false);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-background/70 backdrop-blur-sm"
        onClick={close}
        aria-hidden="true"
      />
      <div className="relative w-full max-w-sm overflow-hidden rounded-2xl border border-border bg-card shadow-2xl">
        <button
          type="button"
          onClick={close}
          aria-label="닫기"
          className="absolute right-3 top-3 z-10 inline-flex size-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-black/10 hover:text-foreground dark:hover:bg-white/10"
        >
          <X className="h-4 w-4" />
        </button>

        {/* 헤더 */}
        <div className="bg-primary/10 px-6 pb-5 pt-6">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-primary px-2.5 py-1 text-xs font-bold text-primary-foreground">
            <Megaphone className="h-3.5 w-3.5" />
            공지
          </span>
          <div className="mt-3 flex items-baseline gap-2">
            <h2 className="text-2xl font-bold tracking-tight">{data.title}</h2>
            {data.date && (
              <span className="text-sm font-semibold text-primary">{data.date}</span>
            )}
          </div>
        </div>

        {/* 본문 */}
        <div className="space-y-4 px-6 pb-6 pt-5">
          {data.body && (
            <p className="whitespace-pre-line text-[15px] leading-relaxed text-foreground/90">
              {data.body}
            </p>
          )}

          {data.warning && (
            <div className="flex items-start gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3.5 py-3 text-sm">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
              <span className="font-medium text-amber-700 dark:text-amber-300">
                {data.warning}
              </span>
            </div>
          )}

          {data.link && (
            <a
              href={data.link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#FEE500] px-4 py-3 text-sm font-bold text-[#191919] transition-opacity hover:opacity-90"
            >
              {data.link.label}
              <ExternalLink className="h-4 w-4" />
            </a>
          )}

          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={dismissDay}
              className="flex-1 rounded-xl border border-border px-4 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary/40 hover:text-foreground"
            >
              하루 동안 안 보기
            </button>
            <button
              type="button"
              onClick={close}
              className="flex-1 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
            >
              확인
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
