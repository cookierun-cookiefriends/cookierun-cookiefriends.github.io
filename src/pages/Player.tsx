import { useParams } from 'react-router-dom';
import { usePlayer } from '@/hooks/queries';

export default function Player() {
  const { nickname } = useParams();
  const { data: player, isLoading } = usePlayer(nickname);

  if (isLoading) {
    return <div className="p-8 text-muted-foreground">로딩중...</div>;
  }

  return (
    <div className="p-6 md:p-8 lg:p-10 space-y-6">
      <header>
        <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">
          {player?.nickname}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          참여 시즌: {player?.history.length}개
        </p>
      </header>

      <div className="rounded-xl border border-border bg-card p-5">
        <p className="text-sm text-muted-foreground">
          (Phase 3에서 구현: 시즌별 추이, 보스별 차트, 랭킹 변화)
        </p>
      </div>
    </div>
  );
}
