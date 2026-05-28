import { useState } from 'react';
import { useIndex, useSeason } from '@/hooks/queries';

export default function Guild() {
  const { data: index } = useIndex();
  const [seasonId, setSeasonId] = useState<string | undefined>(undefined);
  const activeSeasonId = seasonId ?? index?.latestSeasonId;
  const { data: season } = useSeason(activeSeasonId);

  return (
    <div className="p-6 md:p-8 lg:p-10 space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">
            길드 전체
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            시즌별 길드원 기록
          </p>
        </div>
        <select
          value={activeSeasonId ?? ''}
          onChange={(e) => setSeasonId(e.target.value)}
          className="rounded-md border border-border bg-card px-3 py-2 text-sm"
        >
          {index?.seasons.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
      </header>

      <div className="rounded-xl border border-border bg-card p-5">
        <p className="text-sm text-muted-foreground">
          (Phase 3에서 구현: 반응형 테이블/카드, 정렬/검색, 차트)
        </p>
        {season && (
          <p className="mt-2 text-xs text-muted-foreground">
            현재 로드됨: {season.records.length}명
          </p>
        )}
      </div>
    </div>
  );
}
