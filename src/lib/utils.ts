import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
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
