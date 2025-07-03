// src/store/useSurveyStore.ts
import { produce } from 'immer';
import { create } from 'zustand';

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

export const useSurveyStore = create<SurveyState>()((set, get) => ({
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
    // 重置内存中的状态 (no localStorage cleanup needed anymore)
    set(
      produce((state: SurveyState) => {
        state.email = '';
        state.linkedin = '';
        state.currentStep = 1;
        state.isCompleted = false;
      }),
    );
  },

  getProgress: () => {
    const state = get();
    if (state.isCompleted) return 100;
    if (state.currentStep === 1) return 33;
    if (state.currentStep === 2) return 66;
    return 100;
  },
}));
