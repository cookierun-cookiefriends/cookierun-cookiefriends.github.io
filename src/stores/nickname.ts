import { create } from 'zustand';
import { persist, createJSONStorage, type StateStorage } from 'zustand/middleware';
import Cookies from 'js-cookie';

interface NicknameState {
  /** 내 닉네임 (쿠키 저장). 미설정이면 null. */
  nickname: string | null;
  setNickname: (n: string | null) => void;
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
      setNickname: (nickname) => set({ nickname }),
    }),
    {
      name: 'cookiefriends_nickname',
      storage: createJSONStorage(() => cookieStorage),
    },
  ),
);
