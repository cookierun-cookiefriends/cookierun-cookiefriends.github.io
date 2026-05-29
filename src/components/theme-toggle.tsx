import { Sun, Moon, Laptop, type LucideIcon } from 'lucide-react';
import { useThemeStore, type Theme } from '@/stores/theme';
import { cn } from '@/lib/utils';

export interface ThemeOption {
  value: Theme;
  icon: LucideIcon;
  label: string;
  desc: string;
}

// 테마 옵션 단일 정의 — ThemeToggle(사이드바)과 Settings 페이지가 공유.
export const THEME_OPTIONS: ThemeOption[] = [
  { value: 'light', icon: Sun, label: '라이트', desc: '항상 밝은 화면' },
  { value: 'dark', icon: Moon, label: '다크', desc: '항상 어두운 화면' },
  { value: 'system', icon: Laptop, label: '시스템', desc: 'OS 설정 따라감' },
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
      {THEME_OPTIONS.map(({ value, icon: Icon, label }) => {
        const active = theme === value;
        return (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={active}
            aria-label={`${label} 모드`}
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
