import { create } from 'zustand';
import { persist, createJSONStorage, type StateStorage } from 'zustand/middleware';
import Cookies from 'js-cookie';

interface NicknameState {
  nickname: string | null;
  setNickname: (n: string | null) => void;
  clearNickname: () => void;
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

export const useNicknameStore = create<NicknameState>()(
  persist(
    (set) => ({
      nickname: null,
      setNickname: (n) => set({ nickname: n }),
      clearNickname: () => set({ nickname: null }),
    }),
    {
      name: 'cookiefriends_nickname',
      storage: createJSONStorage(() => cookieStorage),
    },
  ),
);
