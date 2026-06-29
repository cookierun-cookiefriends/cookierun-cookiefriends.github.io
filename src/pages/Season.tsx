import { useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQueries } from '@tanstack/react-query';
import { ArrowLeft } from 'lucide-react';
import { useIndex, useMeta } from '@/hooks/queries';
import { fetchRound, type BossId, type RoundData } from '@/lib/data';
import { formatDamage, totalDamage, cn } from '@/lib/utils';
import { BossDot } from '@/components/BossDot';

export default function Season() {
  const { id } = useParams<{ id: string }>();
  const { data: index } = useIndex();
  const { data: meta } = useMeta();

  const season = index?.seasons.find((s) => s.id === id);
  const rounds = useMemo(() => season?.rounds ?? [], [season]);

  const results = useQueries({
    queries: rounds.map((r) => ({
      queryKey: ['round', r.id],
      queryFn: () => fetchRound(r.id),
    })),
  });

  const roundData = results
    .map((r) => r.data)
    .filter((d): d is RoundData => !!d);

  // 길드원별 시즌 종합 (세부 시즌별 딜량 + 합)
  const rows = useMemo(() => {
    const nicks = new Set<string>();
    roundData.forEach((rd) => rd.records.forEach((r) => nicks.add(r.nickname)));
    return [...nicks]
      .map((nick) => {
        const perRound: Record<string, number> = {};
        let total = 0;
        for (const rd of roundData) {
          const rec = rd.records.find((r) => r.nickname === nick);
          const d = rec ? totalDamage(rec) : 0;
          perRound[rd.round.id] = d;
          total += d;
        }
        return { nick, perRound, total };
      })
      .sort((a, b) => b.total - a.total);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roundData.length, rounds]);

  // 보스별 시즌 종합 (모든 세부 시즌·전원 합산)
  const bossTotals = useMemo(() => {
    const acc: Partial<Record<BossId, number>> = {};
    for (const rd of roundData) {
      for (const rec of rd.records) {
        for (const bid of rd.season.activeBosses) {
          acc[bid] = (acc[bid] ?? 0) + rec.bosses[bid].damage;
        }
      }
    }
    return acc;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roundData.length]);

  if (!season) {
    return (
      <div className="p-8 text-muted-foreground">시즌을 찾을 수 없습니다.</div>
    );
  }

  const guildTotal = rows.reduce((s, r) => s + r.total, 0);
  const seasonBosses = season.activeBosses ?? [];

  return (
    <div className="p-6 md:p-10 lg:p-12 space-y-7 max-w-[1400px]">
      <header>
        <Link
          to="/guild"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> 토벌전
        </Link>
        <h1 className="mt-2 text-3xl md:text-4xl font-bold tracking-tight">
          {season.name}
        </h1>
        <p className="mt-2 text-base text-muted-foreground">
          시즌 종합 · 세부 시즌 {rounds.length}개 합산
        </p>
      </header>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <SummaryCard label="시즌 총딜 (길드)" value={formatDamage(guildTotal)} />
        <SummaryCard label="참여 인원" value={`${rows.length}명`} />
        <SummaryCard
          label="세부 시즌"
          value={`${rounds.length}개`}
          sub={rounds.map((r) => r.id).join(' · ')}
        />
      </div>

      {seasonBosses.length > 0 && meta && (
        <section className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          <h2 className="text-sm font-semibold text-muted-foreground">
            보스별 시즌 종합
          </h2>
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {seasonBosses.map((bid) => (
              <div
                key={bid}
                className="rounded-xl border border-border bg-background p-3"
              >
                <div className="flex items-center gap-1.5">
                  <BossDot bid={bid} />
                  <span className="text-xs text-muted-foreground">
                    {meta.bosses[bid].name}
                  </span>
                </div>
                <p className="mt-1 text-sm font-semibold tabular-nums">
                  {formatDamage(bossTotals[bid] ?? 0)}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
        <div className="border-b border-border px-5 py-4">
          <h2 className="font-semibold tracking-tight">시즌 종합 순위</h2>
        </div>

        {/* PC: 표 */}
        <div className="hidden overflow-x-auto md:block">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs text-muted-foreground">
                <th className="w-12 px-4 py-3">#</th>
                <th className="px-4 py-3">닉네임</th>
                {rounds.map((r) => (
                  <th key={r.id} className="px-4 py-3 text-right">
                    {r.id}
                  </th>
                ))}
                <th className="px-4 py-3 text-right">시즌 합계</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <tr
                  key={row.nick}
                  className="border-b border-border/50 transition-colors hover:bg-secondary/30"
                >
                  <td className="px-4 py-3">
                    <RankNum rank={i + 1} />
                  </td>
                  <td className="px-4 py-3 font-medium">{row.nick}</td>
                  {rounds.map((r) => (
                    <td
                      key={r.id}
                      className="px-4 py-3 text-right tabular-nums text-muted-foreground"
                    >
                      {row.perRound[r.id]
                        ? formatDamage(row.perRound[r.id])
                        : '-'}
                    </td>
                  ))}
                  <td className="px-4 py-3 text-right font-semibold tabular-nums">
                    {formatDamage(row.total)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* 모바일: 카드 */}
        <div className="divide-y divide-border md:hidden">
          {rows.map((row, i) => (
            <div key={row.nick} className="px-4 py-3">
              <div className="flex items-center gap-3">
                <RankNum rank={i + 1} />
                <span className="flex-1 font-medium">{row.nick}</span>
                <span className="font-semibold tabular-nums">
                  {formatDamage(row.total)}
                </span>
              </div>
              <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 pl-10 text-xs text-muted-foreground">
                {rounds.map((r) => (
                  <span key={r.id} className="tabular-nums">
                    {r.id}{' '}
                    {row.perRound[r.id] ? formatDamage(row.perRound[r.id]) : '-'}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function SummaryCard({
  label,
  value,
  sub,
}: {
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-2 text-2xl font-bold tabular-nums">{value}</p>
      {sub && <p className="mt-0.5 text-xs text-muted-foreground">{sub}</p>}
    </div>
  );
}

function RankNum({ rank }: { rank: number }) {
  return (
    <span
      className={cn(
        'inline-flex size-7 items-center justify-center rounded-full text-xs font-bold tabular-nums',
        rank === 1 && 'bg-yellow-400/20 text-yellow-600 dark:text-yellow-400',
        rank === 2 && 'bg-slate-300/30 text-slate-500 dark:text-slate-300',
        rank === 3 && 'bg-amber-600/20 text-amber-700 dark:text-amber-500',
        rank > 3 && 'bg-secondary text-muted-foreground',
      )}
    >
      {rank}
    </span>
  );
}
