import { useParams, Link } from 'react-router-dom';
import { useIndex } from '@/hooks/queries';

export default function Season() {
  const { id } = useParams();
  const { data: index, isLoading } = useIndex();

  if (isLoading) {
    return <div className="p-8 text-muted-foreground">로딩중...</div>;
  }

  const season = index?.seasons.find((s) => s.id === id);

  if (!season) {
    return (
      <div className="p-8 text-muted-foreground">시즌을 찾을 수 없습니다.</div>
    );
  }

  return (
    <div className="p-6 md:p-8 lg:p-10 space-y-6">
      <header>
        <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">
          {season.name}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          큰 시즌 활성 보스: {season.activeBosses.join(', ')} · 라운드{' '}
          {season.rounds.length}개
        </p>
      </header>

      <section className="rounded-xl border border-border bg-card p-5 space-y-3">
        <h2 className="text-sm font-medium">라운드 목록</h2>
        <ul className="flex flex-col gap-2">
          {season.rounds.map((r) => (
            <li key={r.id}>
              <Link
                to={`/raid/round/${r.id}`}
                className="flex items-center justify-between rounded-md border border-border/50 px-3 py-2 text-sm hover:bg-secondary/50 transition-colors"
              >
                <span className="font-medium">{r.name}</span>
                <span className="text-xs text-muted-foreground">
                  {r.activeBosses.join(' · ')}
                </span>
              </Link>
            </li>
          ))}
        </ul>
        <p className="pt-2 text-xs text-muted-foreground">
          (Phase 3에서 구현: 시즌 통계, 보스별 합산 분석, 라운드 비교 차트)
        </p>
      </section>
    </div>
  );
}
