import { Sun, Moon, Laptop, type LucideIcon } from 'lucide-react';
import { useThemeStore, type Theme } from '@/stores/theme';
import { cn } from '@/lib/utils';

interface Option {
  value: Theme;
  icon: LucideIcon;
  label: string;
}

const options: Option[] = [
  { value: 'light', icon: Sun, label: '라이트 모드' },
  { value: 'system', icon: Laptop, label: '시스템 설정' },
  { value: 'dark', icon: Moon, label: '다크 모드' },
];

export function ThemeToggle({ className }: { className?: string }) {
  const theme = useThemeStore((s) => s.theme);
  const setTheme = useThemeStore((s) => s.setTheme);

  return (
    <div
      className={cn(
        'inline-flex items-center gap-0.5 rounded-full border border-border bg-card p-1 shadow-sm',
        className,
      )}
      role="radiogroup"
      aria-label="테마 선택"
    >
      {options.map(({ value, icon: Icon, label }) => {
        const active = theme === value;
        return (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={active}
            aria-label={label}
            onClick={() => setTheme(value)}
            className={cn(
              'inline-flex items-center justify-center rounded-full p-1.5 transition-all',
              active
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground hover:bg-secondary/60',
            )}
          >
            <Icon className="h-3.5 w-3.5" />
          </button>
        );
      })}
    </div>
  );
}
