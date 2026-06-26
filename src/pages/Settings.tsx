import { useState } from 'react';
import { useThemeStore } from '@/stores/theme';
import { useNicknameStore } from '@/stores/nickname';
import { useIndex } from '@/hooks/queries';
import { THEME_OPTIONS } from '@/components/theme-toggle';
import { cn } from '@/lib/utils';

export default function Settings() {
  const theme = useThemeStore((s) => s.theme);
  const setTheme = useThemeStore((s) => s.setTheme);

  return (
    <div className="p-6 md:p-8 lg:p-10 space-y-6 max-w-2xl">
      <header>
        <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">
          설정
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          닉네임과 화면 모양을 바꿀 수 있습니다
        </p>
      </header>

      <NicknameSection />

      <section className="rounded-2xl border border-border bg-card p-5 md:p-6 space-y-4 shadow-sm">
        <div>
          <h2 className="text-sm font-semibold tracking-tight">화면 테마</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            현재: {THEME_OPTIONS.find((o) => o.value === theme)?.label}
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {THEME_OPTIONS.map(({ value, icon: Icon, label, desc }) => {
            const active = theme === value;
            return (
              <button
                key={value}
                type="button"
                onClick={() => setTheme(value)}
                aria-pressed={active}
                className={cn(
                  'flex flex-col items-start gap-2 rounded-xl border p-3.5 text-left transition-all',
                  active
                    ? 'border-primary bg-primary/10 shadow-sm'
                    : 'border-border bg-background hover:bg-secondary/60',
                )}
              >
                <div
                  className={cn(
                    'flex items-center justify-center size-8 rounded-lg',
                    active
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground',
                  )}
                >
                  <Icon className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-sm font-medium">{label}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>
                </div>
              </button>
            );
          })}
        </div>
      </section>
    </div>
  );
}

function NicknameSection() {
  const nickname = useNicknameStore((s) => s.nickname);
  const setNickname = useNicknameStore((s) => s.setNickname);
  const { data: index } = useIndex();
  const [input, setInput] = useState(nickname ?? '');

  const players = index?.players ?? [];
  const trimmed = input.trim();
  const valid = players.includes(trimmed);

  return (
    <section className="rounded-2xl border border-border bg-card p-5 md:p-6 space-y-4 shadow-sm">
      <div>
        <h2 className="text-sm font-semibold tracking-tight">내 닉네임</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {nickname
            ? `현재: ${nickname}`
            : '등록하면 홈에서 내 기록·순위·추이를 볼 수 있어요'}
        </p>
      </div>
      <div className="flex flex-col sm:flex-row gap-2">
        <input
          list="cf-settings-players"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="닉네임 입력"
          className="flex-1 rounded-xl border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring/40"
        />
        <datalist id="cf-settings-players">
          {players.map((p) => (
            <option key={p} value={p} />
          ))}
        </datalist>
        <button
          type="button"
          disabled={!valid || trimmed === nickname}
          onClick={() => setNickname(trimmed)}
          className="rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-40"
        >
          저장
        </button>
        {nickname && (
          <button
            type="button"
            onClick={() => {
              setNickname(null);
              setInput('');
            }}
            className="rounded-xl border border-border px-4 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary/60 hover:text-foreground"
          >
            해제
          </button>
        )}
      </div>
    </section>
  );
}
