'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import { message } from 'antd';
import { useTranslations } from 'next-intl';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';

import { supabase } from '@/lib/supabase';
import useUserStore from '@/store/user';

const AuthForm: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const { updateUserInfo, updateToken } = useUserStore();
  const router = useRouter();
  const t = useTranslations('Auth');
  const LoginSchema = z.object({
    email: z
      .string()
      .nonempty({
        message: t('authForm.emailPlaceholder') + t('authForm.isRequired'),
      })
      .email({
        message: t('authForm.emailError'),
      }),
    password: z
      .string()
      .nonempty({
        message: t('authForm.passwordPlaceholder') + t('authForm.isRequired'),
      })
      .min(8, {
        message: t('authForm.passwordError'),
      }),
  });
  const RegisterSchema = z.object({
    firstName: z
      .string()
      .nonempty({
        message: t('authForm.firstNamePlaceholder') + t('authForm.isRequired'),
      })
      .min(2, {
        message: t('authForm.firstNameError'),
      }),
    lastName: z
      .string()
      .nonempty({
        message: t('authForm.lastNamePlaceholder') + t('authForm.isRequired'),
      })
      .min(2, {
        message: t('authForm.lastNameError'),
      }),
    email: z
      .string()
      .nonempty({
        message: t('authForm.emailPlaceholder') + t('authForm.isRequired'),
      })
      .email({
        message: t('authForm.emailError'),
      }),
    password: z
      .string()
      .nonempty({
        message: t('authForm.passwordPlaceholder') + t('authForm.isRequired'),
      })
      .min(8, {
        message: t('authForm.passwordError'),
      }),
  });

  const loginForm = useForm<z.infer<typeof LoginSchema>>({
    resolver: zodResolver(LoginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const registerForm = useForm<z.infer<typeof RegisterSchema>>({
    resolver: zodResolver(RegisterSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      password: '',
    },
  });
  const toggleForm = () => {
    if (isLogin) {
      loginForm.reset();
    } else {
      registerForm.reset();
    }
    setIsLogin(!isLogin);
  };
  const savaUserInfo = async () => {
    try {
      const {
        data: { session },
      } = (await supabase.auth.getSession()) as any;

      updateUserInfo(session?.user);

      updateToken({
        access_token: session.access_token,
        refresh_token: session.refresh_token,
        expires_at: session.expires_at,
      });
    } catch (error) {}
  };
  const onLoginSubmit = async (param: z.infer<typeof LoginSchema>) => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase.auth.signInWithPassword({
        email: param.email,
        password: param.password,
      });
      if (error) throw error;
      savaUserInfo();
      message.success(t('login.success') + data.user.user_metadata.first_name);
      router.push('/');
    } catch (error: any) {
      message.error(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const onRegisterSubmit = async (data: z.infer<typeof RegisterSchema>) => {
    try {
      setIsLoading(true);
      const { error } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            first_name: data.firstName,
            last_name: data.lastName,
          },
        },
      });

      if (error) throw error;
      message.success(t('registration.verifyEmail.standard'));
    } catch (error: any) {
      message.error(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      setIsLoading(true);
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) throw error;
    } catch (error: any) {
      message.error(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLinkedInLogin = async () => {
    try {
      setIsLoading(true);
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'linkedin_oidc',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          scopes: 'openid profile email',
        },
      });
      if (error) throw error;
    } catch (error: any) {
      message.error(error.message || 'LinkedIn 登录失败');
    } finally {
      setIsLoading(false);
    }
  };

  const SocialButton = ({ icon, text, onClick }: { icon: React.ReactNode; text: string; onClick: () => void }) => (
    <Button
      variant="outline"
      className="w-full h-12 flex items-center auth-form-social-button"
      type="button"
      onClick={onClick}
    >
      <div className="w-[26px] h-[26px] flex items-center justify-center">{icon}</div>
      <span className="flex-1 pr-[26px] text-base font-medium text-gray-900">{text}</span>
    </Button>
  );

  return (
    <div className="flex items-center justify-center">
      <div className={`w-full ${isLoading ? 'streamer-border' : ''} min-w-[420px] bg-white rounded-[30px]`}>
        <div className="p-8">
          <div className="text-center mb-8">
            <div className="text-[32px] font-semibold text-[rgba(0,0,0,0.8)] mb-2">
              {isLogin ? t('authForm.loginTitle') : t('authForm.registerTitle')}
            </div>
            {isLogin ? <p className="text-gray-500">{t('authForm.loginSubtitle')}</p> : ''}
          </div>
          <div className="space-y-4 mb-6">
            <SocialButton
              icon={
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
              }
              text={t('authForm.continueWithGoogle')}
              onClick={handleGoogleLogin}
            />
            <SocialButton
              icon={
                <svg className="w-5 h-5" fill="#0A66C2" viewBox="0 0 24 24">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                </svg>
              }
              text={t('authForm.continueWithLinkedIn')}
              onClick={handleLinkedInLogin}
            />
          </div>
          <div className="relative mb-6">
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">{t('authForm.separator')}</span>
            </div>
          </div>
          {isLogin ? (
            <>
              <Form {...loginForm} key="login-form">
                <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-4">
                  <FormField
                    control={loginForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Input type="email" placeholder="Email" className="h-12 auth-form-input" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={loginForm.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Input type="password" placeholder="Password" className="h-12 auth-form-input" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" className="w-full h-12 auth-form-bottom-button">
                    {t('authForm.loginSubmitButton')}
                  </Button>
                </form>
              </Form>

              <div className="text-center mt-6">
                <button type="button" className="auth-form-sub-text">
                  {t('authForm.forgotPasswordLink')}
                </button>
              </div>

              <div className="text-center mt-4">
                <span className="auth-form-sub-text">{t('authForm.loginBottomText')}</span>
                <Button variant="link" onClick={toggleForm} className="auth-form-sub-bottom-button">
                  {t('authForm.registerText')}
                </Button>
              </div>
            </>
          ) : (
            <>
              <Form {...registerForm} key="register-form">
                <form onSubmit={registerForm.handleSubmit(onRegisterSubmit)} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={registerForm.control}
                      name="firstName"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Input
                              type="text"
                              placeholder={t('authForm.firstNamePlaceholder')}
                              className="h-12 auth-form-input"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={registerForm.control}
                      name="lastName"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Input
                              type="text"
                              placeholder={t('authForm.lastNamePlaceholder')}
                              className="h-12 auth-form-input"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <FormField
                    control={registerForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Input
                            type="email"
                            placeholder={t('authForm.emailPlaceholder')}
                            className="h-12 auth-form-input"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={registerForm.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Input
                            type="password"
                            placeholder={t('authForm.passwordPlaceholder')}
                            className="h-12 auth-form-input"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" className="w-full h-12 auth-form-bottom-button">
                    {t('authForm.registerText')}
                  </Button>
                </form>
              </Form>

              <div className="text-center mt-6">
                <span className="auth-form-sub-text">{t('authForm.alreadyHaveAccount')} </span>
                <Button variant="link" onClick={toggleForm} className="auth-form-sub-bottom-button">
                  {t('authForm.loginBottomSubText')}
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default AuthForm;
