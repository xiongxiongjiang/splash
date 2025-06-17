import { produce } from 'immer';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import type { User } from '@supabase/auth-js';


interface UserState {
  userInfo: User | null;
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
  updateUserInfo: (userInfo: User) => void;
  updateToken: (token: { access_token: string; refresh_token: string; expires_at: number }) => void;
  clearUser: () => void;
}

const useUserStore = create<UserState>()(
  persist(
    (set) => ({
      userInfo: null,
      accessToken: '',
      refreshToken: '',
      expiresAt: 0,

      updateUserInfo: (userInfo) =>
        set(
          produce((state: UserState) => {
            state.userInfo = userInfo;
          }),
        ),

      updateToken: ({ access_token, refresh_token, expires_at }) =>
        set(
          produce((state: UserState) => {
            state.accessToken = access_token;
            state.refreshToken = refresh_token;
            state.expiresAt = expires_at;
          }),
        ),

      clearUser: () =>
        set({
          userInfo: null,
          accessToken: '',
          refreshToken: '',
          expiresAt: 0,
        }),
    }),
    {
      name: 'user-storage', // localStorage key
      partialize: (state) => ({
        userInfo: state.userInfo,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        expiresAt: state.expiresAt,
      }),
    },
  ),
);

export default useUserStore;
