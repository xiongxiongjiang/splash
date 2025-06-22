// src/store/useSurveyStore.ts
import { produce } from 'immer';
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface SurveyState {
  email: string;
  linkedin: string;
  currentStep: number;
  isCompleted: boolean;
  setEmail: (email: string) => void;
  setLinkedin: (linkedin: string) => void;
  setCurrentStep: (step: number) => void;
  markAsCompleted: () => void;
  reset: () => void;
  getProgress: () => number;
}

export const useSurveyStore = create<SurveyState>()(
  persist(
    (set, get) => ({
      email: '',
      linkedin: '',
      currentStep: 1,
      isCompleted: false,

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

      setCurrentStep: (step) =>
        set(
          produce((state: SurveyState) => {
            state.currentStep = step;
          }),
        ),

      markAsCompleted: () =>
        set(
          produce((state: SurveyState) => {
            state.isCompleted = true;
          }),
        ),

      reset: () => {
        // 重置内存中的状态
        set(
          produce((state: SurveyState) => {
            state.email = '';
            state.linkedin = '';
            state.currentStep = 1;
            state.isCompleted = false;
          }),
        );
        // 清除 localStorage 中的持久化数据
        localStorage.removeItem('survey-storage');
      },

      getProgress: () => {
        const state = get();
        if (state.isCompleted) return 100;
        if (state.currentStep === 1) return 33;
        if (state.currentStep === 2) return 66;
        return 100;
      },
    }),
    {
      name: 'survey-storage', // 本地 localStorage 中的 key
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        email: state.email,
        linkedin: state.linkedin,
        currentStep: state.currentStep,
        isCompleted: state.isCompleted,
      }),
    },
  ),
);
