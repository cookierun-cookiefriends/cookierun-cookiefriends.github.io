import { useParams, Link } from 'react-router-dom';
import { usePlayer } from '@/hooks/queries';

export default function Player() {
  const { nickname } = useParams();
  const { data: player, isLoading } = usePlayer(nickname);

  if (isLoading) {
    return <div className="p-8 text-muted-foreground">로딩중...</div>;
  }

  if (!player) {
    return (
      <div className="p-8 text-muted-foreground">
        해당 닉네임의 기록을 찾을 수 없습니다.
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 lg:p-10 space-y-6">
      <header>
        <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">
          {player.nickname}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          참여 라운드 {player.history.length}개
        </p>
      </header>

      <section className="rounded-xl border border-border bg-card p-5 space-y-3">
        <h2 className="text-sm font-medium">최근 라운드</h2>
        <ul className="flex flex-col gap-2">
          {player.history.slice(-5).reverse().map((h) => (
            <li key={h.roundId}>
              <Link
                to={`/raid/round/${h.roundId}`}
                className="flex items-center justify-between rounded-md border border-border/50 px-3 py-2 text-sm hover:bg-secondary/50 transition-colors"
              >
                <span className="font-medium">
                  {h.seasonName} · {h.roundName}
                </span>
                <span className="text-xs text-muted-foreground">
                  {h.activeBosses.join(' · ')}
                </span>
              </Link>
            </li>
          ))}
        </ul>
        <p className="pt-2 text-xs text-muted-foreground">
          (Phase 3에서 구현: 라운드별 추이 라인 차트, 보스별 비중, 길드 내 순위)
        </p>
      </section>
    </div>
  );
}
