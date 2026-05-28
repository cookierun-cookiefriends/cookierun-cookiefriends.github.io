import { useNavigate } from 'react-router-dom';
import { useNicknameStore } from '@/stores/nickname';
import { useThemeStore, type Theme } from '@/stores/theme';
import { Sun, Moon, Laptop, type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

const themeOptions: { value: Theme; icon: LucideIcon; label: string; desc: string }[] = [
  { value: 'light', icon: Sun, label: '라이트', desc: '항상 밝은 화면' },
  { value: 'dark', icon: Moon, label: '다크', desc: '항상 어두운 화면' },
  { value: 'system', icon: Laptop, label: '시스템', desc: 'OS 설정 따라감' },
];

export default function Settings() {
  const navigate = useNavigate();
  const nickname = useNicknameStore((s) => s.nickname);
  const clearNickname = useNicknameStore((s) => s.clearNickname);
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

      {/* 닉네임 */}
      <section className="rounded-2xl border border-border bg-card p-5 md:p-6 space-y-4 shadow-sm">
        <div>
          <h2 className="text-sm font-semibold tracking-tight">내 닉네임</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {nickname ?? '설정되지 않음'}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => navigate('/setup')}
            className="rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors shadow-sm"
          >
            {nickname ? '변경' : '설정'}
          </button>
          {nickname && (
            <button
              onClick={() => clearNickname()}
              className="rounded-xl border border-border px-4 py-2 text-sm font-medium hover:bg-secondary/60 transition-colors"
            >
              초기화
            </button>
          )}
        </div>
      </section>

      {/* 테마 */}
      <section className="rounded-2xl border border-border bg-card p-5 md:p-6 space-y-4 shadow-sm">
        <div>
          <h2 className="text-sm font-semibold tracking-tight">화면 테마</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            현재: {themeOptions.find((o) => o.value === theme)?.label}
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {themeOptions.map(({ value, icon: Icon, label, desc }) => {
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
                    : 'border-border bg-background hover:bg-secondary/60 hover:border-border',
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
