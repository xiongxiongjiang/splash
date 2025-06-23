import { useState, useCallback } from 'react';
import { useForm } from 'react-hook-form';

import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

import { useSurveyStore } from '@/store/survey';
import { apiClient } from '@/lib/api';

const emailFormSchema = z.object({
  email: z
    .string()
    .nonempty({
      message: 'Email is required',
    })
    .email({
      message: 'Please enter a valid email address',
    }),
});

const linkedinFormSchema = z.object({
  linkedin: z
    .string()
    .nonempty({ message: 'Linkedin is required' })
    .url({ message: 'Must be a valid URL' })
    .refine((url) => url.includes('linkedin.com'), {
      message: 'Must be a LinkedIn URL',
    }),
});

export const useSurvey = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    email: storeEmail,
    linkedin,
    currentStep,
    isCompleted,
    setEmail,
    setLinkedin,
    setCurrentStep,
    markAsCompleted,
    reset,
    getProgress,
  } = useSurveyStore();

  const emailForm = useForm<z.infer<typeof emailFormSchema>>({
    resolver: zodResolver(emailFormSchema),
    defaultValues: {
      email: storeEmail || '',
    },
    mode: 'onSubmit',
  });

  const linkedinForm = useForm<z.infer<typeof linkedinFormSchema>>({
    resolver: zodResolver(linkedinFormSchema),
    defaultValues: {
      linkedin: linkedin || '',
    },
    mode: 'onSubmit',
  });

  const handleStepTransition = useCallback(
    (nextStep: number) => {
      setIsTransitioning(true);
      setError(null);
      setTimeout(() => {
        setCurrentStep(nextStep);
        setIsTransitioning(false);
      }, 1000);
    },
    [setCurrentStep],
  );

  const handleApiError = useCallback((error: any) => {
    console.error('API Error:', error);
    setError(error.message || '提交失败，请重试');
  }, []);

  const submitEmail = useCallback(
    async (values: z.infer<typeof emailFormSchema>) => {
      try {
        setIsSubmitting(true);
        setError(null);

        // Call the waitlist API with email and initial info
        await apiClient.addToWaitlist(values.email, {
          source: 'frontend_form',
          step: 'email_collection'
        });

        setEmail(values.email);
        handleStepTransition(2);
      } catch (err: any) {
        handleApiError(err);
      } finally {
        setIsSubmitting(false);
      }
    },
    [setEmail, handleStepTransition, handleApiError],
  );

  const submitLinkedin = useCallback(
    async (values: z.infer<typeof linkedinFormSchema>) => {
      try {
        setIsSubmitting(true);
        setError(null);

        // Update waitlist info with LinkedIn profile
        if (!storeEmail) {
          throw new Error('Email is required');
        }

        await apiClient.updateWaitlistInfo(storeEmail, {
          linkedin_profile: values.linkedin,
          step: 'linkedin_collection',
          completed_at: new Date().toISOString()
        });

        setLinkedin(values.linkedin);
        markAsCompleted();
        handleStepTransition(3);
      } catch (err: any) {
        handleApiError(err);
      } finally {
        setIsSubmitting(false);
      }
    },
    [storeEmail, setLinkedin, markAsCompleted, handleStepTransition, handleApiError],
  );

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    // 状态
    isSubmitting,
    isTransitioning,
    error,
    currentStep,
    isCompleted,
    progress: getProgress(),

    // 表单
    emailForm,
    linkedinForm,

    // 方法
    submitEmail,
    submitLinkedin,
    handleStepTransition,
    clearError,
    reset,

    // Store数据
    storeEmail,
    linkedin,
  };
};
