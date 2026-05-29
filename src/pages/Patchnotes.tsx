import { Fragment } from 'react';
import { usePatchnotes } from '@/hooks/queries';
import type { PatchVersion } from '@/lib/data';
import { cn } from '@/lib/utils';

// 패치노트 타입별 용도 — JSON의 "type"에 아래 한국어를 그대로 적으면 색이 자동 적용됩니다.
//   신규   — 새 기능 추가
//   개선   — 기존 기능 향상 / 변경
//   수정   — 버그·오류 수정
//   성능   — 성능 최적화
//   디자인 — UI·스타일 변경
//   삭제   — 기능 제거
// 위 6종 외 다른 단어를 적으면 회색으로 그대로 표시됩니다.
const typeStyles: Record<string, string> = {
  '신규': 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400',
  '개선': 'bg-blue-500/15 text-blue-600 dark:text-blue-400',
  '수정': 'bg-amber-500/15 text-amber-600 dark:text-amber-400',
  '성능': 'bg-teal-500/15 text-teal-600 dark:text-teal-400',
  '디자인': 'bg-pink-500/15 text-pink-600 dark:text-pink-400',
  '삭제': 'bg-rose-500/15 text-rose-600 dark:text-rose-400',
};
const defaultTypeStyle = 'bg-muted text-muted-foreground';

function parseVersion(v: string): number[] {
  return v.split('.').map((n) => Number(n) || 0);
}

// 내림차순 (최신이 앞)
function compareDesc(a: string, b: string): number {
  const pa = parseVersion(a);
  const pb = parseVersion(b);
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const d = (pb[i] ?? 0) - (pa[i] ?? 0);
    if (d !== 0) return d;
  }
  return 0;
}

// 가운데 자리 (minor)
function minorOf(v: string): number {
  return parseVersion(v)[1] ?? 0;
}

function TypeBadge({ type }: { type: string }) {
  return (
    <span
      className={cn(
        'shrink-0 inline-flex items-center h-6 rounded-md px-2 text-xs font-semibold',
        typeStyles[type] ?? defaultTypeStyle,
      )}
    >
      {type}
    </span>
  );
}

function VersionCard({ v, latest }: { v: PatchVersion; latest: boolean }) {
  return (
    <article className="rounded-2xl border border-border bg-card p-5 md:p-6 shadow-sm">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <h2 className="text-xl md:text-2xl font-bold tracking-tight">
          {v.version}
        </h2>
        {latest && (
          <span className="inline-flex items-center rounded-full bg-primary px-2.5 py-0.5 text-xs font-semibold text-primary-foreground">
            최신
          </span>
        )}
      </div>

      {v.title && (
        <p className="mt-1.5 text-sm font-medium text-muted-foreground">
          {v.title}
        </p>
      )}

      <ul className="mt-4 space-y-2.5">
        {v.changes.map((c, i) => (
          <li key={i} className="flex items-start gap-2.5">
            <TypeBadge type={c.type} />
            <span className="text-sm leading-6">{c.text}</span>
          </li>
        ))}
      </ul>
    </article>
  );
}

export default function Patchnotes() {
  const { data, isLoading } = usePatchnotes();

  if (isLoading) {
    return <div className="p-8 text-muted-foreground">로딩중...</div>;
  }

  const versions = [...(data?.versions ?? [])].sort((a, b) =>
    compareDesc(a.version, b.version),
  );

  return (
    <div className="p-6 md:p-10 lg:p-12 max-w-3xl space-y-6">
      <header>
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
          패치노트
        </h1>
        <p className="mt-2 text-base text-muted-foreground">
          쿠키프렌즈 길드 대시보드 업데이트 내역
        </p>
      </header>

      <div className="space-y-4">
        {versions.map((v, i) => {
          const showDivider =
            i > 0 && minorOf(versions[i - 1].version) !== minorOf(v.version);
          return (
            <Fragment key={v.version}>
              {showDivider && (
                <div
                  className="flex items-center gap-3 py-1"
                  aria-hidden="true"
                >
                  <div className="h-px flex-1 bg-border" />
                  <span className="text-xs font-medium text-muted-foreground/70">
                    {parseVersion(v.version)[0]}.{minorOf(v.version)}
                  </span>
                  <div className="h-px flex-1 bg-border" />
                </div>
              )}
              <VersionCard v={v} latest={i === 0} />
            </Fragment>
          );
        })}

        {versions.length === 0 && (
          <div className="rounded-2xl border border-border bg-card p-10 text-center text-sm text-muted-foreground">
            아직 패치노트가 없습니다.
          </div>
        )}
      </div>
    </div>
  );
}
