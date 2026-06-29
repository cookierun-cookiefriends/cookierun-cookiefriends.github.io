import { useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Trophy, TrendingUp, UserCog, Search, ChevronRight } from 'lucide-react';
import { BossTrendChart } from '@/components/BossTrendChart';
import { useNicknameStore } from '@/stores/nickname';
import { useIndex, useMeta, usePlayer, useRound } from '@/hooks/queries';
import { formatDamage, totalDamage, cn } from '@/lib/utils';
import type { PlayerBosses } from '@/lib/data';

const bossesTotal = (bosses: PlayerBosses) =>
  Object.values(bosses).reduce((s, b) => s + b.damage, 0);

export default function Home() {
  const nickname = useNicknameStore((s) => s.nickname);
  return nickname ? <MemberHome nickname={nickname} /> : <GuestHome />;
}

/* ─────────────────────────── 미등록: 닉 설정 + 길드 요약 ─────────────────────────── */

function GuestHome() {
  const setNickname = useNicknameStore((s) => s.setNickname);
  const { data: index } = useIndex();
  const { data: round } = useRound(index?.latestRoundId);
  const [input, setInput] = useState('');

  const players = index?.players ?? [];
  const trimmed = input.trim();
  const valid = players.includes(trimmed);

  const top = (round?.records ?? [])
    .map((r) => ({ nickname: r.nickname, total: totalDamage(r) }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 5);

  return (
    <div className="p-6 md:p-10 lg:p-12 space-y-8 max-w-4xl">
      <section className="rounded-2xl border border-border bg-gradient-to-br from-primary/10 to-card p-7 md:p-9 shadow-sm">
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
          내 토벌전 기록을 한눈에
        </h1>
        <p className="mt-2 text-muted-foreground">
          닉네임을 등록하면 내 성적·길드 순위·시즌 추이를 모아서 보여드려요.
        </p>
        <div className="mt-5 flex flex-col sm:flex-row gap-2 max-w-md">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              list="cf-player-list"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && valid) setNickname(trimmed);
              }}
              placeholder="닉네임 입력"
              className="w-full rounded-xl border border-border bg-background pl-9 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring/40"
            />
            <datalist id="cf-player-list">
              {players.map((p) => (
                <option key={p} value={p} />
              ))}
            </datalist>
          </div>
          <button
            type="button"
            disabled={!valid}
            onClick={() => setNickname(trimmed)}
            className="rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-40"
          >
            시작하기
          </button>
        </div>
        {trimmed && !valid && (
          <p className="mt-2 text-xs text-muted-foreground">
            길드원 목록에 없는 닉네임이에요. 자동완성에서 골라주세요.
          </p>
        )}
      </section>

      {round && top.length > 0 && (
        <section className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold tracking-tight">
              {round.round.name}
              <span className="ml-2 text-sm font-normal text-muted-foreground">
                TOP 5
              </span>
            </h2>
            <Link
              to="/guild"
              className="inline-flex items-center gap-0.5 text-sm text-primary hover:underline"
            >
              전체 보기 <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
          <ul className="mt-4 space-y-1.5">
            {top.map(({ nickname, total }, i) => (
              <li
                key={nickname}
                className="flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors hover:bg-secondary/40"
              >
                <RankNum rank={i + 1} />
                <span className="flex-1 font-medium">{nickname}</span>
                <span className="text-sm tabular-nums text-muted-foreground">
                  {formatDamage(total)}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

/* ─────────────────────────── 등록: 개인 대시보드 ─────────────────────────── */

function MemberHome({ nickname }: { nickname: string }) {
  const { data: player } = usePlayer(nickname);
  const { data: index } = useIndex();
  const { data: meta } = useMeta();
  const { data: round } = useRound(index?.latestRoundId);

  const history = player?.history ?? [];
  const latest = history[history.length - 1];
  const latestTotal = latest ? bossesTotal(latest.bosses) : 0;

  const ranked = (round?.records ?? [])
    .map((r) => ({ nickname: r.nickname, total: totalDamage(r) }))
    .sort((a, b) => b.total - a.total);
  const myRank = ranked.findIndex((r) => r.nickname === nickname) + 1;
  const guildSize = ranked.length;

  // 한 번이라도 활성이었던 보스만 (보스별 추이 차트 대상)
  const activeBossIds = (meta?.bossOrder ?? []).filter((bid) =>
    history.some((h) => h.activeBosses.includes(bid)),
  );

  return (
    <div className="p-6 md:p-10 lg:p-12 space-y-7 max-w-5xl">
      <header className="flex items-end justify-between gap-4">
        <div>
          <p className="text-sm text-muted-foreground">반가워요</p>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
            {nickname}
            <span className="text-muted-foreground">님</span>
          </h1>
        </div>
        <Link
          to="/settings"
          className="inline-flex items-center gap-1.5 rounded-xl border border-border px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-secondary/60 hover:text-foreground"
        >
          <UserCog className="h-4 w-4" /> 닉네임 변경
        </Link>
      </header>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          label="최신 시즌 딜량"
          value={formatDamage(latestTotal)}
          sub={latest?.roundName}
        />
        <StatCard
          label="길드 내 순위"
          value={myRank ? `${myRank}위` : '–'}
          sub={guildSize ? `${guildSize}명 중` : undefined}
          icon={<Trophy className="h-5 w-5" />}
        />
        <StatCard label="기록된 시즌" value={`${history.length}개`} sub="누적 참여" />
      </div>

      {latest && meta && (
        <section className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          <h2 className="text-sm font-semibold text-muted-foreground">
            {latest.roundName} · 보스별
          </h2>
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {meta.bossOrder
              .filter((bid) => latest.activeBosses.includes(bid))
              .map((bid) => (
                <div
                  key={bid}
                  className="rounded-xl border border-border bg-background p-3"
                >
                  <div className="flex items-center gap-1.5">
                    <span
                      className="size-2 rounded-full"
                      style={{ background: meta.bosses[bid].color }}
                    />
                    <span className="text-xs text-muted-foreground">
                      {meta.bosses[bid].name}
                    </span>
                  </div>
                  <p className="mt-1 text-sm font-semibold tabular-nums">
                    {formatDamage(latest.bosses[bid].damage)}
                  </p>
                </div>
              ))}
          </div>
        </section>
      )}

      {meta && activeBossIds.length > 0 && history.length > 1 && (
        <section className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          <h2 className="flex items-center gap-1.5 text-sm font-semibold">
            <TrendingUp className="h-4 w-4 text-primary" /> 시즌별 딜량 추이
            <span className="font-normal text-muted-foreground">· 보스별</span>
          </h2>
          <div className="mt-4 grid grid-cols-1 gap-5 sm:grid-cols-2">
            {activeBossIds.map((bid) => {
              const data = history
                .filter((h) => h.activeBosses.includes(bid))
                .map((h) => ({ name: h.roundId, 딜량: h.bosses[bid].damage }));
              return (
                <BossTrendChart
                  key={bid}
                  name={meta.bosses[bid].name}
                  color={meta.bosses[bid].color}
                  data={data}
                />
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}

/* ─────────────────────────── 작은 컴포넌트 ─────────────────────────── */

function StatCard({
  label,
  value,
  sub,
  icon,
}: {
  label: string;
  value: string;
  sub?: string;
  icon?: ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{label}</p>
        {icon && <span className="text-primary">{icon}</span>}
      </div>
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
