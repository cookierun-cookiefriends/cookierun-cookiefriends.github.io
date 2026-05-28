import { useParams } from 'react-router-dom';
import { useSeason } from '@/hooks/queries';

export default function Season() {
  const { id } = useParams();
  const { data: season, isLoading } = useSeason(id);

  if (isLoading) {
    return <div className="p-8 text-muted-foreground">로딩중...</div>;
  }

  return (
    <div className="p-6 md:p-8 lg:p-10 space-y-6">
      <header>
        <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">
          {season?.season.name}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          활성 보스: {season?.season.activeBosses.join(', ')}
        </p>
      </header>

      <div className="rounded-xl border border-border bg-card p-5">
        <p className="text-sm text-muted-foreground">
          (Phase 3에서 구현: 시즌 통계, 보스별 분석, 랭킹)
        </p>
      </div>
    </div>
  );
}
