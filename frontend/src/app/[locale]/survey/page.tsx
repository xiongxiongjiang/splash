'use client';

import React, { useEffect } from 'react';

import { ChevronDownIcon, ChevronUpIcon, X } from 'lucide-react';
import { useRouter } from 'next/navigation';

import Header from '@/components/Header';
import LandingPageBg from '@/components/LandingPageBg';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';

import { useSurvey } from '@/hooks/useSurvey';

// 内部组件定义
interface SurveySubmitButtonProps {
  type?: 'submit' | 'button';
  disabled?: boolean;
  onClick?: () => void;
  className?: string;
  children?: React.ReactNode;
}

const SurveySubmitButton: React.FC<SurveySubmitButtonProps> = ({
  type = 'submit',
  disabled = false,
  onClick,
  className = '',
  children = 'SUBMIT',
}) => {
  const baseClassName = `
    rounded-[16px] web:h-[43px] web:font-heavy web:text-base tablet:h-[64px] tablet:px-20 tablet:text-[20px] h-[43px] px-10 w-auto font-bold text-base tracking-wide
    active:bg-black
    text-white
    bg-black
    hover:bg-gray-800
    disabled:bg-[rgba(0,0,0,0.1)]
    disabled:text-white
    disabled:cursor-not-allowed
    flex-1 tablet:flex-none
  `;

  return (
    <button type={type} disabled={disabled} onClick={onClick} className={`${baseClassName} ${className}`}>
      {children}
    </button>
  );
};

// 步骤配置接口
interface StepConfig {
  title: string;
  description: string;
  placeholder: string;
  fieldName: 'email' | 'linkedin';
  inputType: 'email' | 'url';
  onSubmit: (values: any) => Promise<void>;
  form: any;
  watchField: string;
  showError?: boolean;
  error?: string | null;
  buttonText?: string;
}

export default function SurveyPage() {
  const router = useRouter();
  const {
    isSubmitting,
    isTransitioning,
    error,
    currentStep,
    emailForm,
    linkedinForm,
    submitEmail,
    submitLinkedin,
    handleStepTransition,
    storeEmail,
    reset,
  } = useSurvey();

  // Handle exit functionality
  const handleExit = () => {
    reset();
    router.back();
  };

  // ESC key handler
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        handleExit();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);
  // 初始化表单数据
  React.useEffect(() => {
    if (storeEmail) {
      emailForm.reset({ email: storeEmail });
    }
  }, [storeEmail, emailForm]);

  // 通用步骤渲染函数
  const renderStep = (config: StepConfig) => (
    <div
      className={`transition-all flex-1 h-full duration-300 flex flex-col justify-center ${
        isTransitioning ? 'opacity-0 translate-y-4' : 'opacity-100 translate-y-0'
      }`}
    >
      <div className="flex-1 justify-center tablet:justify-end tablet:pb-[50px] flex flex-col gap-[50px]">
        <div className="space-y-4">
          <h2 className="tablet:text-[32px] text-[24px] font-medium tablet:font-semibold text-[rgba(0,0,0,0.8)]">
            {config.title}
          </h2>
          <p className="text-[rgba(0,0,0,0.4)] text-base font-medium tablet:font-normal tablet:text-[20px]">
            {config.description}
          </p>
        </div>

        {config.showError && config.error && <div className="text-red-500 text-sm mt-2">{config.error}</div>}

        <Form {...config.form} key={`${config.fieldName}-form`}>
          <form onSubmit={config.form.handleSubmit(config.onSubmit)} className=" flex flex-col justify-center">
            <FormField
              control={config.form.control}
              name={config.fieldName}
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input
                      type={config.inputType}
                      placeholder={config.placeholder}
                      className="border-0 border-b-2 !border-b-[rgba(0,0,0,0.2)] px-0
                                !text-semibold !text-[18px] tablet:!text-2xl
                                focus:!border-b-[rgba(0,0,0,0.8)]
                                focus:outline-none focus:shadow-none
                                focus-visible:!ring-0 focus-visible:!ring-transparent
                                rounded-none bg-transparent transition-colors
                                text-[rgba(0,0,0,0.8)] placeholder:text-[rgba(0,0,0,0.2)]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </form>
        </Form>
      </div>
      <div className="flex justify-center items-center tablet:flex-2 tablet:flex tablet:flex-col tablet:justify-between tablet:items-center gap-2">
        <SurveySubmitButton
          key={`desktop-${config.fieldName}-submit`}
          disabled={isSubmitting || !config.form.watch(config.watchField)}
          onClick={config.form.handleSubmit(config.onSubmit)}
        >
          {config.buttonText}
        </SurveySubmitButton>
        {storeEmail && (
          <Button
            key={`mobile-${config.fieldName}-next`}
            variant="secondary"
            onClick={() => handleStepTransition(config.fieldName === 'email' ? 2 : 1)}
            size="icon"
            className="tablet:px-10 bg-[rgba(255,255,255,0.6)]"
          >
            {config.fieldName === 'email' ? (
              <ChevronDownIcon color="rgba(0,0,0,0.2)" />
            ) : (
              <ChevronUpIcon color="rgba(0,0,0,0.2)" />
            )}
          </Button>
        )}
      </div>
    </div>
  );

  const renderStep1 = () => {
    const step1Config: StepConfig = {
      title: 'What Is Your Email Address?',
      description: 'When The Product Is Launched, We Will Push It To Your Email Address As Soon As Possible',
      placeholder: 'name@example.com',
      fieldName: 'email',
      inputType: 'email',
      onSubmit: submitEmail,
      form: emailForm,
      watchField: 'email',
      showError: false,
      buttonText: 'JOIN WAITLIST',
    };

    return renderStep(step1Config);
  };

  const renderStep2 = () => {
    const step2Config: StepConfig = {
      title: 'Import your Linkedin URL.',
      description: 'Get A Unique Analytics Experience In The Future.',
      placeholder: 'https://linkedin.com/in/',
      fieldName: 'linkedin',
      inputType: 'url',
      onSubmit: submitLinkedin,
      form: linkedinForm,
      watchField: 'linkedin',
      showError: true,
      error: error,
    };

    return renderStep(step2Config);
  };

  const renderStep3 = () => (
    <div
      className={`transition-all duration-300 ${
        isTransitioning ? 'opacity-0 translate-x-4' : 'opacity-100 translate-x-0'
      }`}
    >
      <div className="space-y-2 flex flex-col items-center">
        <h2 className="text-[24px] font-semibold text-[rgba(0,0,0,0.8)] tablet:text-[32px]">
          <span className="tablet:hidden">{`Thank You For Your Attention.`}</span>
          <span className="mobile:hidden tablet:block">{`You're All Set.`}</span>
        </h2>
        <p className="text-[rgba(0,0,0,0.4)] text-base font-medium tablet:text-[20px] tablet:font-normal">
          <span className="tablet:hidden">{`We'll Be In Touch As Soon As We're Ready.`}</span>
          <span className="mobile:hidden tablet:block">{`We'll Let You Know Once You Have Access.Stay Tuned.`}</span>
        </p>
      </div>
    </div>
  );

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 1:
        return renderStep1();
      case 2:
        return renderStep2();
      case 3:
        return renderStep3();
      default:
        return renderStep1();
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center transparent">
      <LandingPageBg />
      
      {/* Exit button - top left */}
      <button
        onClick={handleExit}
        className="absolute top-4 left-4 z-50 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors backdrop-blur-sm"
        aria-label="Exit survey"
      >
        <X size={24} className="text-gray-700" />
      </button>

      <div className="w-full">
        <Header />
      </div>
      <div className="w-full flex-1 flex flex-col justify-center max-w-xl p-[38.5px]">{renderCurrentStep()}</div>
    </div>
  );
}
