'use client';

import React, { useEffect, useState, useRef } from 'react';

import { Alert, ConfigProvider } from 'antd';
import gsap from 'gsap';
import { ChevronDownIcon, ChevronUpIcon } from 'lucide-react';
import { CircleCheck } from 'lucide-react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

import Header from '@/components/Header';
import LandingPageBg from '@/components/LandingPageBg';
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';

import ErrorIcon from '@/assets/images/icon_erro_info.svg';
import IconLoading from '@/assets/images/icon_loading.svg';
import TallyLogo from '@/assets/logos/tally_logo.svg';
import { useSurvey } from '@/hooks/useSurvey';

interface SurveySubmitButtonProps {
  type?: 'submit' | 'button';
  disabled?: boolean;
  isLoading?: boolean;
  onClick?: () => void;
  className?: string;
  children?: React.ReactNode;
}

const SurveySubmitButton: React.FC<SurveySubmitButtonProps> = ({
  type = 'submit',
  disabled = false,
  isLoading = false,
  onClick,
  className = '',
  children = 'SUBMIT',
}) => {
  const baseClassName = `
    rounded-[16px] text-base px-10 w-auto font-bold tracking-wide
    !h-[44px]
    !max-h-[44px]
    !min-h-[44px]
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
    <button
      type={type}
      disabled={disabled || isLoading}
      onClick={onClick}
      className={`${baseClassName} ${isLoading ? '!bg-black' : ''} ${className}`}
    >
      <span className="flex gap-2 justify-center">
        {isLoading ? <Image src={IconLoading} className="animate-spin rounded-full" alt="loading" /> : ''}
        {children}
      </span>
    </button>
  );
};

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
  onTransition: (nextStep: number) => void;
  btnLoading?: boolean;
  setBtnLoading?: React.Dispatch<React.SetStateAction<boolean>>;
}

export default function SurveyPage() {
  const router = useRouter();
  const {
    isSubmitting,
    isTransitioning, // 我们将用它来防止动画期间的重复点击
    error,
    currentStep,
    emailForm,
    linkedinForm,
    submitEmail,
    submitLinkedin,
    handleStepTransition: originalHandleStepTransition,
    storeEmail,
  } = useSurvey();

  const [loading, setLoading] = useState(true);
  const errorRef = useRef<HTMLDivElement>(null);
  const [emailBtnLoading, setEmailBtnLoading] = useState(false);
  const [linkedinBtnLoading, setLinkedinBtnLoading] = useState(false);
  // 添加状态用于控制 LandingPageBg 的显示
  const [showBg, setShowBg] = useState(true);

  // 新增：一个 ref 用于指向动画容器
  const stepContainerRef = useRef<HTMLDivElement>(null);
  // 新增：一个 ref 用于跟踪上一步，以判断动画方向
  const prevStepRef = useRef(0);
  // 动画移动距离，使用具体的像素值
  const animationDistance = '142px';

  useEffect(() => {
    if (storeEmail) {
      emailForm.reset({ email: storeEmail });
    }
    const timeout = setTimeout(() => {
      setLoading(false);
    }, 1000);
    return () => clearTimeout(timeout);
  }, [storeEmail, emailForm]);

  useEffect(() => {
    if (error && errorRef.current) {
      gsap.fromTo(errorRef.current, { y: -80, opacity: 0 }, { y: 0, opacity: 1, duration: 0.6, ease: 'power2.out' });
    } else if (!error && errorRef.current) {
      gsap.to(errorRef.current, { y: -80, opacity: 0, duration: 0.6, ease: 'power2.in' });
    }
  }, [error]);

  // **核心动画逻辑**
  // 1. 入场动画: 每当 currentStep 变化后执行
  useEffect(() => {
    const container = stepContainerRef.current;
    if (container) {
      // 首次加载动画
      if (prevStepRef.current === 0) {
        gsap.fromTo(
          container,
          { y: animationDistance, opacity: 0 },
          { y: '0%', opacity: 1, duration: 0.4, ease: 'ease.in' },
        );
      } else {
        // 后续切换的入场动画
        // 当步骤增加时（如1->2），新元素从下方进入（正值）
        // 当步骤减少时（如2->1），新元素从上方进入（负值）
        const direction = currentStep > prevStepRef.current ? 'forward' : 'backward';
        const startY = direction === 'forward' ? animationDistance : `-${animationDistance}`;
        gsap.fromTo(container, { y: startY, opacity: 0 }, { y: '0%', opacity: 1, duration: 0.4, ease: 'ease.out' });
      }
    }
  }, [currentStep]); // 依赖 currentStep

  // 2. 出场动画: 点击按钮时触发
  const handleTransition = (nextStep: number) => {
    if (isTransitioning || !stepContainerRef.current) return;
    // 当步骤增加时（如1->2），当前元素向上退出（负值）
    // 当步骤减少时（如2->1），当前元素向下退出（正值）
    const direction = nextStep > currentStep ? 'forward' : 'backward';
    const exitY = direction === 'forward' ? `-${animationDistance}` : animationDistance;

    // 在动画开始前隐藏背景，减少页面卡顿
    setShowBg(false);

    // 执行出场动画
    gsap.to(stepContainerRef.current, {
      y: exitY,
      opacity: 0,
      duration: 0.4, // 缩短出场动画时间，使过渡更快
      ease: 'ease.in',
      onComplete: () => {
        // 动画结束后，更新 prevStep 并切换真正的 state
        prevStepRef.current = currentStep;
        originalHandleStepTransition(nextStep);

        // 动画完成后，延迟一小段时间再显示背景
        setTimeout(() => {
          setShowBg(true);
        }, 400);
      },
    });
  };

  if (loading) {
    return (
      <>
        {showBg && <LandingPageBg />}
        <div className="min-h-screen w-full flex items-center justify-center gap-2">
          <Image src={TallyLogo} alt="Tally Logo" width={24} height={24} />
          <span className="font-bold text-[28px] chroma-animate-once">Tally AI</span>
        </div>
      </>
    );
  }

  // renderStep 函数现在接收 onTransition prop
  const renderStep = (config: StepConfig) => (
    // 您原有的布局class，移除了所有动画相关的class
    <div className={`flex-1 h-full flex flex-col justify-center`}>
      <div className="flex-1 justify-start tablet:pt-0 tablet:justify-center flex flex-col gap-[50px]">
        <div className="space-y-4">
          <h2 className="tablet:text-[32px] text-[24px] font-medium tablet:font-semibold text-[rgba(0,0,0,0.8)]">
            {config.title}
          </h2>
          <p className="text-[rgba(0,0,0,0.4)] text-base font-medium tablet:font-normal tablet:text-[20px]">
            {config.description}
          </p>
        </div>
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
                      className="shadow-none border-0 border-b-2 !border-b-[rgba(0,0,0,0.2)] px-0 !text-semibold !text-[18px] tablet:!text-2xl focus:!border-b-[rgba(0,0,0,0.8)] focus:outline-none focus:shadow-none focus-visible:!ring-0 focus-visible:!ring-transparent rounded-none bg-transparent transition-colors text-[rgba(0,0,0,0.8)] placeholder:text-[rgba(0,0,0,0.2)]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage className="text-[#FF6767] font-medium !text-base" />
                </FormItem>
              )}
            />
          </form>
        </Form>
        <div className="flex justify-center items-center mt-8">
          <SurveySubmitButton
            isLoading={config.fieldName === 'email' ? emailBtnLoading : linkedinBtnLoading}
            key={`desktop-${config.fieldName}-submit`}
            disabled={isSubmitting || !config.form.watch(config.watchField)}
            className="h-[44px]"
            onClick={async () => {
              const setLoading = config.fieldName === 'email' ? setEmailBtnLoading : setLinkedinBtnLoading;
              setLoading(true);
              try {
                await config.form.handleSubmit(config.onSubmit)();
              } finally {
                setLoading(false);
              }
            }}
          >
            {config.buttonText}
          </SurveySubmitButton>
        </div>
      </div>
    </div>
  );

  // renderStep1, renderStep2, renderStep3 定义保持不变，但要传入 onTransition
  const renderStep1 = () => {
    return renderStep({
      title: 'What Is Your Email?',
      description: "We're rolling out early access. You will receive an email notification.",
      placeholder: 'name@example.com',
      fieldName: 'email',
      inputType: 'email',
      onSubmit: async (values: any) => {
        try {
          await submitEmail(values);
          // 只有在成功提交后才触发动画切换
          handleTransition(2);
        } catch (error) {
          // 错误处理已经在 submitEmail 中完成
          console.error('Submit email error:', error);
        }
      },
      form: emailForm,
      watchField: 'email',
      buttonText: 'JOIN WAITLIST',
      btnLoading: emailBtnLoading,
      setBtnLoading: setEmailBtnLoading,
      onTransition: handleTransition, // 传入动画函数
    });
  };

  const renderStep2 = () => {
    return renderStep({
      title: "✓ You're on the waitlist, What's your LinkedIn?",
      description: "Optional. We'll use this information to tailor your career guidance.",
      placeholder: 'https://linkedin.com/in/',
      fieldName: 'linkedin',
      inputType: 'url',
      onSubmit: async (values: any) => {
        try {
          await submitLinkedin(values);
          handleTransition(3);
        } catch (error) {
          console.error('Submit linkedin error:', error);
        }
      },
      form: linkedinForm,
      watchField: 'linkedin',
      error: error,
      buttonText: 'CONTINUE',
      btnLoading: linkedinBtnLoading,
      setBtnLoading: setLinkedinBtnLoading,
      onTransition: () => handleTransition(3),
    });
  };

  const renderStep3 = () => (
    <div
      className={`transition-all duration-300 mb-[35%] ${
        isTransitioning ? 'opacity-0 translate-x-4' : 'opacity-100 translate-x-0'
      }`}
    >
      <div className="space-y-2 flex flex-col items-center">
        <h2 className="text-[24px] font-semibold text-[rgba(0,0,0,0.8)] tablet:text-[32px] flex items-center gap-2">
          <CircleCheck size={32} color="#00b900" />
          <span>{`You're All Set.`}</span>
        </h2>
        <p className="text-[rgba(0,0,0,0.4)] text-base font-medium tablet:text-[20px] tablet:font-normal">
          <span>{`Check your email for a confirmation.`}</span>
        </p>
      </div>
      <div className="flex justify-center items-center mt-8">
        <SurveySubmitButton onClick={() => router.push('/')} className="!px-5">
          <span>{`DONE`}</span>
        </SurveySubmitButton>
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
      {showBg && <LandingPageBg />}
      <div className="w-full">
        <Header showBackButton={true} fixed={true} />
      </div>
      <div className="absolute top-4  backdrop-blur-sm z-50 ">
        {error && (
          <div ref={errorRef}>
            <ConfigProvider
              theme={{
                components: {
                  Alert: {
                    colorText: '#FF6767',
                    colorErrorBg: 'rgba(255,103,103,0.2)',
                    colorErrorBorder: 'rgba(255,103,103,0.4)',
                    colorIcon: '#FF6767',
                    lineWidth: 2,
                    fontWeightStrong: 600,
                  },
                },
              }}
            >
              <Alert message={error} type="error" closable showIcon icon={<Image src={ErrorIcon} alt="error" />} />
            </ConfigProvider>
          </div>
        )}
      </div>
      <div className="w-full flex-1 flex flex-col justify-center max-w-xl p-[38.5px] overflow-hidden">
        <div key={currentStep} className="flex-1 flex-col flex justify-center">
          <div ref={stepContainerRef} className="step-anim-container">
            {renderCurrentStep()}
          </div>
        </div>

        {/* Navigation buttons - show after user has entered email in current session */}
        {storeEmail && currentStep < 3 && (
          <div className="flex justify-center mt-4">
            <button
              onClick={() => handleTransition(currentStep === 1 ? 2 : 1)}
              className="flex justify-center items-center w-[49px] h-[43px] tablet:w-[80px] tablet:h-[40px] tablet:rounded-[8px] rounded-[12px] bg-[rgba(255,255,255,0.6)]"
            >
              {currentStep === 1 ? (
                <ChevronDownIcon strokeWidth={3} color="rgba(0,0,0,0.6)" />
              ) : (
                <ChevronUpIcon strokeWidth={3} absoluteStrokeWidth color="rgba(0,0,0,0.6)" />
              )}
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
