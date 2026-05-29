import { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useIndex, useRound, useMeta } from '@/hooks/queries';
import type { BossId, BossRecord, PlayerRecord, Meta } from '@/lib/data';
import {
  Search,
  ArrowUpDown,
  ArrowDown,
  ArrowUp,
  TrendingUp,
  TrendingDown,
  Minus,
  X,
  ChevronDown,
} from 'lucide-react';
import { cn, formatDamage, totalDamage, calcChange, type ChangeInfo } from '@/lib/utils';
import { BossDot } from '@/components/BossDot';

type SortKey = 'total' | BossId | 'name';
type SortDir = 'asc' | 'desc';

const EMPTY_BOSSES: BossId[] = [];

const defaultDir = (key: SortKey): SortDir => (key === 'name' ? 'asc' : 'desc');

interface DisplayRow {
  record: PlayerRecord;
  rank: number;
  total: number;
  totalChange: ChangeInfo;
  prevRecord?: PlayerRecord;
}

export default function Guild() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { data: index } = useIndex();
  const { data: meta } = useMeta();

  const activeRoundId = searchParams.get('round') ?? index?.latestRoundId;
  const { data: round, isLoading } = useRound(activeRoundId);

  const allRounds = useMemo(
    () =>
      index?.seasons.flatMap((s) =>
        s.rounds.map((r) => ({ id: r.id, name: r.name, seasonName: s.name })),
      ) ?? [],
    [index],
  );
  const allRoundsReversed = useMemo(() => [...allRounds].reverse(), [allRounds]);

  const currentIdx = allRounds.findIndex((r) => r.id === activeRoundId);
  const prevRoundId = currentIdx > 0 ? allRounds[currentIdx - 1].id : undefined;
  const { data: prevRound } = useRound(prevRoundId);

  const prevByNickname = useMemo(() => {
    const map = new Map<string, PlayerRecord>();
    prevRound?.records.forEach((r) => map.set(r.nickname, r));
    return map;
  }, [prevRound]);

  const byNickname = useMemo(() => {
    const map = new Map<string, PlayerRecord>();
    round?.records.forEach((r) => map.set(r.nickname, r));
    return map;
  }, [round]);

  const [search, setSearch] = useState('');
  // 3단계 정렬: key 선택 → 반대방향 → 해제(null)
  const [sortKey, setSortKey] = useState<SortKey | null>('total');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [damageMode, setDamageMode] = useState<'korean' | 'comma'>('korean');
  const [selected, setSelected] = useState<string | null>(null);

  // Esc로 패널 닫기
  useEffect(() => {
    if (!selected) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSelected(null);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [selected]);

  const activeBosses = round?.round.activeBosses ?? EMPTY_BOSSES;

  // 총합을 한 번만 계산해 순위·필터·정렬·표시가 모두 공유.
  const rows = useMemo<DisplayRow[]>(() => {
    if (!round) return [];
    const withTotal = round.records.map((record) => ({
      record,
      total: totalDamage(record),
    }));

    const rankMap = new Map<string, number>();
    [...withTotal]
      .sort((a, b) => b.total - a.total)
      .forEach((x, i) => rankMap.set(x.record.nickname, i + 1));

    const q = search.toLowerCase();
    const filtered = withTotal.filter((x) =>
      x.record.nickname.toLowerCase().includes(q),
    );

    const dir = sortDir === 'asc' ? 1 : -1;
    const sorted =
      sortKey === null
        ? filtered
        : [...filtered].sort((a, b) => {
            if (sortKey === 'name')
              return a.record.nickname.localeCompare(b.record.nickname, 'ko') * dir;
            if (sortKey === 'total') return (a.total - b.total) * dir;
            return (
              (a.record.bosses[sortKey].damage - b.record.bosses[sortKey].damage) *
              dir
            );
          });

    return sorted.map(({ record, total }) => {
      const prevRecord = prevByNickname.get(record.nickname);
      const prevTotal = prevRecord ? totalDamage(prevRecord) : 0;
      return {
        record,
        rank: rankMap.get(record.nickname) ?? 0,
        total,
        totalChange: calcChange(total, prevTotal),
        prevRecord,
      };
    });
  }, [round, search, sortKey, sortDir, prevByNickname]);

  const handleSort = (key: SortKey) => {
    const first = defaultDir(key);
    if (sortKey !== key) {
      setSortKey(key);
      setSortDir(first);
    } else if (sortDir === first) {
      setSortDir(first === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(null);
    }
  };

  if (isLoading) {
    return <div className="p-8 text-muted-foreground">로딩중...</div>;
  }

  const selectedRecord = selected ? byNickname.get(selected) : undefined;
  const selectedPrev = selected ? prevByNickname.get(selected) : undefined;

  return (
    <div className="p-6 md:p-10 lg:p-12 space-y-7 max-w-[1400px]">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
            토벌전 기록
          </h1>
          <p className="mt-2 text-base text-muted-foreground">
            시즌별 길드원 딜량 기록 · 직전 시즌 대비 증감률
          </p>
        </div>
        <div className="relative">
          <select
            value={activeRoundId ?? ''}
            onChange={(e) => setSearchParams({ round: e.target.value })}
            className="appearance-none rounded-xl border border-border bg-card pl-4 pr-12 py-2.5 text-sm md:text-base font-medium shadow-sm focus:outline-none focus:ring-2 focus:ring-ring/40 cursor-pointer"
          >
            {allRoundsReversed.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        </div>
      </header>

      {round && (
        <section className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          <p className="text-base md:text-lg font-semibold">
            {round.round.name}
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            {activeBosses.map((bid) => (
              <span
                key={bid}
                className="inline-flex items-center gap-2 rounded-full bg-secondary/60 px-3 py-1.5 text-sm font-medium"
              >
                <BossDot bid={bid} size="lg" />
                {meta?.bosses[bid]?.name}
              </span>
            ))}
            {prevRound && (
              <span className="ml-2 text-xs text-muted-foreground">
                비교 기준: {prevRound.round.name}
              </span>
            )}
          </div>
        </section>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex-1 min-w-[200px] relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="닉네임 검색"
            className="w-full rounded-xl border border-border bg-card pl-11 pr-3 py-2.5 text-sm md:text-base shadow-sm focus:outline-none focus:ring-2 focus:ring-ring/40"
          />
        </div>
        <div className="inline-flex items-center gap-0.5 rounded-full border border-border bg-card p-1 shadow-sm">
          {(['korean', 'comma'] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setDamageMode(m)}
              className={cn(
                'rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors',
                damageMode === m
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              {m === 'korean' ? '만/억' : '천 단위'}
            </button>
          ))}
        </div>
      </div>

      {/* PC: 테이블 */}
      <section className="hidden md:block rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/40 text-sm uppercase tracking-wider text-muted-foreground">
                <th className="text-center px-5 py-4 font-semibold w-20">#</th>
                <th
                  className="text-left px-5 py-4 font-semibold cursor-pointer select-none hover:text-foreground transition-colors"
                  onClick={() => handleSort('name')}
                >
                  <SortLabel label="닉네임" active={sortKey === 'name'} dir={sortDir} />
                </th>
                {activeBosses.map((bid) => (
                  <th
                    key={bid}
                    className="text-right px-5 py-4 font-semibold cursor-pointer select-none hover:text-foreground transition-colors"
                    onClick={() => handleSort(bid)}
                  >
                    <div className="inline-flex items-center gap-2">
                      <BossDot bid={bid} />
                      <SortLabel
                        label={meta?.bosses[bid]?.name ?? bid}
                        active={sortKey === bid}
                        dir={sortDir}
                      />
                    </div>
                  </th>
                ))}
                <th
                  className="text-right px-5 py-4 font-semibold cursor-pointer select-none hover:text-foreground transition-colors"
                  onClick={() => handleSort('total')}
                >
                  <SortLabel label="총합" active={sortKey === 'total'} dir={sortDir} />
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map(({ record: r, rank, total, totalChange, prevRecord }) => (
                <tr
                  key={r.nickname}
                  onClick={() => setSelected(r.nickname)}
                  className="group border-b border-border last:border-0 hover:bg-secondary/30 transition-colors cursor-pointer"
                >
                  <td className="text-center px-5 py-5 align-top">
                    <RankBadge rank={rank} />
                  </td>
                  <td className="px-5 py-5 align-top">
                    <span className="text-base font-semibold group-hover:text-primary transition-colors">
                      {r.nickname}
                    </span>
                  </td>
                  {activeBosses.map((bid) => (
                    <td key={bid} className="text-right px-5 py-5 align-top">
                      <BossCell
                        bid={bid}
                        meta={meta}
                        attempts={r.bosses[bid].attempts}
                        damage={r.bosses[bid].damage}
                        prev={prevRecord?.bosses[bid]}
                        mode={damageMode}
                      />
                    </td>
                  ))}
                  <td className="text-right px-5 py-5 align-top">
                    {total > 0 ? (
                      <div className="inline-block text-right">
                        <div className="text-base font-bold tabular-nums">
                          {formatDamage(total, damageMode)}
                        </div>
                        {totalChange.hasPrev && (
                          <div className="mt-0.5 flex justify-end">
                            <ChangeIndicator change={totalChange} />
                          </div>
                        )}
                      </div>
                    ) : (
                      <span className="text-muted-foreground/60">-</span>
                    )}
                  </td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td
                    colSpan={2 + activeBosses.length + 1}
                    className="text-center px-5 py-16 text-base text-muted-foreground"
                  >
                    검색 결과가 없습니다
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* 모바일: 카드 */}
      <section className="md:hidden space-y-3">
        {rows.map(({ record: r, rank, total, totalChange, prevRecord }) => (
          <button
            key={r.nickname}
            type="button"
            onClick={() => setSelected(r.nickname)}
            className="block w-full text-left rounded-2xl border border-border bg-card p-4 shadow-sm hover:bg-secondary/30 transition-colors"
          >
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <RankBadge rank={rank} />
                <span className="font-semibold truncate">{r.nickname}</span>
              </div>
              <div className="text-right">
                <div className="text-base font-bold tabular-nums">
                  {total > 0 ? formatDamage(total, damageMode) : '-'}
                </div>
                {totalChange.hasPrev && (
                  <div className="mt-0.5">
                    <ChangeIndicator change={totalChange} />
                  </div>
                )}
              </div>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2">
              {activeBosses.map((bid) => (
                <div key={bid} className="rounded-xl bg-muted/40 px-3 py-2.5">
                  <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-muted-foreground">
                    <BossDot bid={bid} size="sm" />
                    {meta?.bosses[bid]?.name}
                  </div>
                  <div className="mt-1.5">
                    <BossCell
                      bid={bid}
                      meta={meta}
                      attempts={r.bosses[bid].attempts}
                      damage={r.bosses[bid].damage}
                      prev={prevRecord?.bosses[bid]}
                      mode={damageMode}
                      compact
                    />
                  </div>
                </div>
              ))}
            </div>
          </button>
        ))}
        {rows.length === 0 && (
          <div className="rounded-2xl border border-border bg-card p-10 text-center text-sm text-muted-foreground">
            검색 결과가 없습니다
          </div>
        )}
      </section>

      {/* 플레이어 상세 패널 */}
      <PlayerPanel
        open={!!selected}
        nickname={selected ?? ''}
        record={selectedRecord}
        prev={selectedPrev}
        roundName={round ? round.round.name : ''}
        activeBosses={activeBosses}
        meta={meta}
        mode={damageMode}
        onClose={() => setSelected(null)}
      />
    </div>
  );
}

function SortLabel({
  label,
  active,
  dir,
}: {
  label: string;
  active: boolean;
  dir: SortDir;
}) {
  return (
    <span className="inline-flex items-center gap-1.5">
      {label}
      {active ? (
        dir === 'asc' ? (
          <ArrowUp className="h-3.5 w-3.5" />
        ) : (
          <ArrowDown className="h-3.5 w-3.5" />
        )
      ) : (
        <ArrowUpDown className="h-3.5 w-3.5 opacity-30" />
      )}
    </span>
  );
}

function RankBadge({ rank }: { rank: number }) {
  if (rank === 0) return <span className="text-muted-foreground">-</span>;
  const styles = cn(
    'inline-flex items-center justify-center size-8 rounded-full text-sm font-bold tabular-nums',
    rank === 1 &&
      'bg-[hsl(42_95%_55%/0.2)] text-[hsl(42_95%_30%)] dark:text-[hsl(42_95%_70%)]',
    rank === 2 && 'bg-secondary text-foreground',
    rank === 3 &&
      'bg-[hsl(28_60%_55%/0.18)] text-[hsl(28_60%_30%)] dark:text-[hsl(28_60%_70%)]',
    rank > 3 && 'text-muted-foreground bg-muted/40',
  );
  return <span className={styles}>{rank}</span>;
}

function ChangeIndicator({ change }: { change: ChangeInfo }) {
  if (!change.hasPrev) return null;
  const pct = change.pct;
  const positive = pct > 0.05;
  const negative = pct < -0.05;
  const Icon = positive ? TrendingUp : negative ? TrendingDown : Minus;
  return (
    <span
      className={cn(
        'inline-flex items-center gap-0.5 text-xs font-medium tabular-nums',
        positive && 'text-emerald-600 dark:text-emerald-400',
        negative && 'text-rose-600 dark:text-rose-400',
        !positive && !negative && 'text-muted-foreground',
      )}
      title={`직전 시즌 대비 ${pct.toFixed(1)}%`}
    >
      <Icon className="h-3 w-3" />
      {pct >= 0 ? '+' : ''}
      {pct.toFixed(1)}%
    </span>
  );
}

function BossCell({
  bid,
  meta,
  attempts,
  damage,
  prev,
  mode,
  compact,
}: {
  bid: BossId;
  meta?: Meta;
  attempts: number;
  damage: number;
  prev?: BossRecord;
  mode: 'korean' | 'comma';
  compact?: boolean;
}) {
  if (attempts === 0 && damage === 0) {
    return <span className="text-muted-foreground/60">-</span>;
  }

  const max = meta?.bosses[bid]?.maxAttempts ?? 9;
  const change = calcChange(damage, prev?.damage ?? 0);
  const perTicket = attempts > 0 ? Math.floor(damage / attempts) : 0;
  const prevPerTicket =
    prev && prev.attempts > 0 ? Math.floor(prev.damage / prev.attempts) : 0;
  const perTicketChange = calcChange(perTicket, prevPerTicket);

  return (
    <div className={compact ? 'space-y-2' : 'inline-block text-right space-y-2'}>
      {/* 총 딜량 */}
      <div>
        <div className="text-base font-bold tabular-nums">
          <span className="text-muted-foreground text-xs mr-1.5 font-normal">
            {attempts}/{max}
          </span>
          {formatDamage(damage, mode)}
        </div>
        {change.hasPrev && (
          <div className={cn('mt-0.5', compact ? '' : 'flex justify-end')}>
            <ChangeIndicator change={change} />
          </div>
        )}
      </div>

      {/* 티켓당 — 강조 */}
      {attempts > 0 && (
        <div
          className={cn(
            'pt-2 border-t border-border/50',
            compact ? '' : 'text-right',
          )}
        >
          <div
            className={cn(
              'flex items-center gap-1.5 tabular-nums',
              compact ? '' : 'justify-end',
            )}
          >
            <span className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground">
              티켓당
            </span>
            <span className="text-sm font-bold text-foreground">
              {formatDamage(perTicket, mode)}
            </span>
          </div>
          {perTicketChange.hasPrev && (
            <div className={cn('mt-0.5', compact ? '' : 'flex justify-end')}>
              <ChangeIndicator change={perTicketChange} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function PlayerPanel({
  open,
  nickname,
  record,
  prev,
  roundName,
  activeBosses,
  meta,
  mode,
  onClose,
}: {
  open: boolean;
  nickname: string;
  record?: PlayerRecord;
  prev?: PlayerRecord;
  roundName: string;
  activeBosses: BossId[];
  meta?: Meta;
  mode: 'korean' | 'comma';
  onClose: () => void;
}) {
  const total = record ? totalDamage(record) : 0;
  const prevTotal = prev ? totalDamage(prev) : 0;
  const totalChange = calcChange(total, prevTotal);

  const inner = (
    <PanelInner
      nickname={nickname}
      roundName={roundName}
      record={record}
      prev={prev}
      activeBosses={activeBosses}
      meta={meta}
      mode={mode}
      total={total}
      totalChange={totalChange}
      onClose={onClose}
    />
  );

  return (
    <>
      {/* Overlay */}
      <div
        onClick={onClose}
        className={cn(
          'fixed inset-0 z-[55] bg-background/70 backdrop-blur-sm transition-opacity duration-200',
          open ? 'opacity-100' : 'pointer-events-none opacity-0',
        )}
      />

      {/* PC: 오른쪽 슬라이드 */}
      <aside
        className={cn(
          'hidden md:flex md:flex-col fixed z-[60] top-0 right-0 h-full w-[420px] border-l border-border bg-card shadow-2xl transition-transform duration-300 ease-out',
          open ? 'translate-x-0' : 'translate-x-full',
        )}
        aria-hidden={!open}
      >
        {inner}
      </aside>

      {/* 모바일: 중앙 모달 */}
      <div
        className={cn(
          'md:hidden fixed z-[60] left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[calc(100%-2rem)] max-w-md max-h-[85vh] flex flex-col rounded-2xl border border-border bg-card shadow-2xl transition-all duration-200 ease-out',
          open ? 'opacity-100 scale-100' : 'pointer-events-none opacity-0 scale-95',
        )}
        aria-hidden={!open}
      >
        {inner}
      </div>
    </>
  );
}

function PanelInner({
  nickname,
  roundName,
  record,
  prev,
  activeBosses,
  meta,
  mode,
  total,
  totalChange,
  onClose,
}: {
  nickname: string;
  roundName: string;
  record?: PlayerRecord;
  prev?: PlayerRecord;
  activeBosses: BossId[];
  meta?: Meta;
  mode: 'korean' | 'comma';
  total: number;
  totalChange: ChangeInfo;
  onClose: () => void;
}) {
  return (
    <>
      <header className="flex items-start justify-between gap-3 px-6 py-5 border-b border-border">
        <div className="min-w-0">
          <p className="text-xs text-muted-foreground">{roundName}</p>
          <h2 className="mt-0.5 text-2xl font-bold tracking-tight truncate">
            {nickname}
          </h2>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="닫기"
          className="shrink-0 inline-flex items-center justify-center size-9 rounded-full text-muted-foreground hover:text-foreground hover:bg-secondary/60 transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      </header>

      <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
        {/* 총합 */}
        <section className="rounded-2xl bg-muted/40 p-4">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">
            총합
          </p>
          <div className="mt-1 flex items-end gap-2">
            <span className="text-2xl font-bold tabular-nums">
              {total > 0 ? formatDamage(total, mode) : '-'}
            </span>
            {totalChange.hasPrev && <ChangeIndicator change={totalChange} />}
          </div>
        </section>

        {/* 보스별 */}
        {record && (
          <section className="space-y-2">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">
              보스별 기록
            </p>
            <div className="space-y-2">
              {activeBosses.map((bid) => (
                <div
                  key={bid}
                  className="rounded-xl border border-border/60 bg-background p-3"
                >
                  <div className="flex items-center gap-2">
                    <BossDot bid={bid} />
                    <span className="text-sm font-medium">
                      {meta?.bosses[bid]?.name}
                    </span>
                  </div>
                  <div className="mt-2">
                    <BossCell
                      bid={bid}
                      meta={meta}
                      attempts={record.bosses[bid].attempts}
                      damage={record.bosses[bid].damage}
                      prev={prev?.bosses[bid]}
                      mode={mode}
                      compact
                    />
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </>
  );
}
