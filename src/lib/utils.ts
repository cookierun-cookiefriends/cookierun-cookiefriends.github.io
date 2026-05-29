import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import type { PlayerRecord } from '@/lib/data';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** 한 플레이어의 모든 보스 딜량 합. */
export function totalDamage(r: PlayerRecord): number {
  return Object.values(r.bosses).reduce((sum, b) => sum + b.damage, 0);
}

export interface ChangeInfo {
  pct: number;
  /** 직전 값이 0보다 커서 증감률을 계산할 수 있었는지 (false면 표시 생략). */
  hasPrev: boolean;
}

/** 직전 값 대비 증감률(%). prev가 0이면 비교 불가로 간주. */
export function calcChange(curr: number, prev: number): ChangeInfo {
  if (prev === 0) return { pct: 0, hasPrev: false };
  return { pct: ((curr - prev) / prev) * 100, hasPrev: true };
}

export function formatDamage(value: number, mode: 'korean' | 'comma' = 'korean'): string {
  if (!value) return '0';
  if (mode === 'comma') return value.toLocaleString('en-US');

  let remaining = Math.floor(value);
  let result = '';

  if (remaining >= 100_000_000) {
    const eok = Math.floor(remaining / 100_000_000);
    result += eok.toLocaleString('en-US') + '억';
    remaining = remaining % 100_000_000;
  }
  if (remaining >= 10_000) {
    const man = Math.floor(remaining / 10_000);
    result += (result ? ' ' : '') + man.toLocaleString('en-US') + '만';
    remaining = remaining % 10_000;
  }
  if (remaining > 0 && result === '') {
    result = remaining.toLocaleString('en-US');
  }
  return result || '0';
}
