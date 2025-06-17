// src/store/useSurveyStore.ts
import { produce } from 'immer';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface SurveyState {
  email: string;
  linkedin: string;
  setEmail: (email: string) => void;
  setLinkedin: (linkedin: string) => void;
  reset: () => void;
}

export const useSurveyStore = create<SurveyState>()(
  persist(
    (set) => ({
      email: '',
      linkedin: '',
      setEmail: (email) =>
        set(
          produce((state: SurveyState) => {
            state.email = email;
          }),
        ),
      setLinkedin: (linkedin) =>
        set(
          produce((state: SurveyState) => {
            state.linkedin = linkedin;
          }),
        ),
      reset: () =>
        set(
          produce((state: SurveyState) => {
            state.email = '';
            state.linkedin = '';
          }),
        ),
    }),
    {
      name: 'survey-storage', // 本地 localStorage 中的 key
    },
  ),
);
