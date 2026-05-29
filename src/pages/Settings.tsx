import { useThemeStore } from '@/stores/theme';
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
          화면 모양을 바꿀 수 있습니다
        </p>
      </header>

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
