import { useParams, useNavigate, Link } from 'react-router-dom';
import { useIndex, useRound } from '@/hooks/queries';

export default function Guild() {
  const { id: paramId } = useParams();
  const navigate = useNavigate();
  const { data: index } = useIndex();

  const activeRoundId = paramId ?? index?.latestRoundId;
  const { data: round } = useRound(activeRoundId);

  const allRounds =
    index?.seasons.flatMap((s) =>
      s.rounds.map((r) => ({ ...r, seasonName: s.name, seasonId: s.id })),
    ) ?? [];

  return (
    <div className="p-6 md:p-8 lg:p-10 space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">
            토벌전 기록
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            라운드별 길드원 기록
          </p>
        </div>
        <select
          value={activeRoundId ?? ''}
          onChange={(e) => navigate(`/raid/round/${e.target.value}`)}
          className="rounded-md border border-border bg-card px-3 py-2 text-sm"
        >
          {allRounds.map((r) => (
            <option key={r.id} value={r.id}>
              {r.seasonName} · {r.name}
            </option>
          ))}
        </select>
      </header>

      {round && (
        <div className="rounded-xl border border-border bg-card p-5 space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">
              {round.season.name} · {round.round.name}
            </p>
            <Link
              to={`/raid/season/${round.season.id}`}
              className="text-xs text-muted-foreground hover:text-foreground underline-offset-2 hover:underline"
            >
              시즌 전체 보기 →
            </Link>
          </div>
          <p className="text-xs text-muted-foreground">
            활성 보스: {round.round.activeBosses.join(', ')} · 참여자{' '}
            {round.records.length}명
          </p>
          <p className="pt-3 text-xs text-muted-foreground">
            (Phase 3에서 구현: 반응형 테이블/카드, 정렬·검색·필터, 차트)
          </p>
        </div>
      )}
    </div>
  );
}
