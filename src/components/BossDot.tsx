import { cn } from '@/lib/utils';
import type { BossId } from '@/lib/data';

// 동적 `size-${n}` 은 Tailwind JIT가 못 잡으므로 고정 클래스로 매핑.
const sizeClasses = {
  sm: 'size-1.5',
  md: 'size-2',
  lg: 'size-2.5',
} as const;

/** 보스 색 도트. 색의 출처(--boss-* CSS 변수)를 이 한 곳에서만 결정. */
export function BossDot({
  bid,
  size = 'md',
  className,
}: {
  bid: BossId;
  size?: keyof typeof sizeClasses;
  className?: string;
}) {
  return (
    <span
      className={cn('shrink-0 rounded-full', sizeClasses[size], className)}
      style={{ backgroundColor: `hsl(var(--boss-${bid}))` }}
    />
  );
}
