import { create } from 'zustand';
import { persist, createJSONStorage, type StateStorage } from 'zustand/middleware';
import Cookies from 'js-cookie';

export type Theme = 'light' | 'dark' | 'system';

interface ThemeState {
  theme: Theme;
  setTheme: (t: Theme) => void;
}

const cookieStorage: StateStorage = {
  getItem: (name) => Cookies.get(name) ?? null,
  setItem: (name, value) => {
    Cookies.set(name, value, { expires: 365, sameSite: 'lax' });
  },
  removeItem: (name) => {
    Cookies.remove(name);
  },
};

function resolveSystem(): 'light' | 'dark' {
  if (typeof window === 'undefined') return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light';
}

function applyTheme(t: 'light' | 'dark') {
  if (typeof document === 'undefined') return;
  document.documentElement.classList.toggle('dark', t === 'dark');
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      theme: 'system',
      setTheme: (theme) => {
        const resolved = theme === 'system' ? resolveSystem() : theme;
        applyTheme(resolved);
        set({ theme });
      },
    }),
    {
      name: 'cookiefriends_theme',
      storage: createJSONStorage(() => cookieStorage),
    },
  ),
);

// 시스템 prefer-color-scheme 변경 감지 (theme === 'system'일 때 자동 반영)
if (typeof window !== 'undefined') {
  window
    .matchMedia('(prefers-color-scheme: dark)')
    .addEventListener('change', () => {
      const { theme } = useThemeStore.getState();
      if (theme === 'system') {
        applyTheme(resolveSystem());
      }
    });
}
