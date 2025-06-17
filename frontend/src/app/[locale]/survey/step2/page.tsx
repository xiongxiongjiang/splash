'use client';

import type React from 'react';
import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';

import { zodResolver } from '@hookform/resolvers/zod';
import { ChevronUpIcon } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { z } from 'zod';

import Header from '@/components/Header';
import LandingPageBg from '@/components/LandingPageBg';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';

import { useSurveyStore } from '@/store/survey';

const formSchema = z.object({
  linkedin: z
    .string()
    .nonempty({ message: 'Linkedin is required' })
    .url({ message: 'Must be a valid URL' })
    .refine((url) => url.includes('linkedin.com'), {
      message: 'Must be a LinkedIn URL',
    }),
});

export default function SurveyPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasInput, setHasInput] = useState(false);
  const router = useRouter();
  const { email, linkedin, setLinkedin, reset } = useSurveyStore();
  console.log('email', email);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      linkedin: linkedin || '',
    },
    mode: 'onSubmit',
  });

  useEffect(() => {
    if (linkedin) {
      setHasInput(true);
      form.reset({
        linkedin: linkedin,
      });
    }
  }, [linkedin, form]);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      setIsSubmitting(true);
      console.log('linkedin submitted:', values.linkedin);
      const res = await fetch('/api/add-linkedin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ linkedin: values.linkedin }),
      });
      if (res.ok) {
        setLinkedin(values.linkedin);
        router.push('step3');
        // 重置store
        reset();
      }
      form.reset();
      setHasInput(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center transparent">
      <LandingPageBg />
      <div className="w-full">
        <Header />
      </div>
      <div className="w-full flex-1 flex flex-col justify-center max-w-xl p-6">
        <div className="space-y-6">
          <div className="space-y-2">
            <h2 className="text-2xl font-semibold text-[rgba(0,0,0,0.8)]">Import your Linkedin URL.</h2>
            <p className="text-[rgba(0,0,0,0.3)] text-[20px]">get a unique analytics experience in the future.</p>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="linkedin"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Input
                        type="url"
                        placeholder="https://linkedin.com/in/"
                        className="border-0 border-b-2 !border-b-[rgba(0,0,0,0.2)]
                                    !text-semibold !text-2xl
                                    focus:!border-b-[rgba(0,0,0,0.8)]
                                    focus:outline-none focus:shadow-none
                                    focus-visible:!ring-0 focus-visible:!ring-transparent
                                    rounded-none bg-transparent transition-colors
                                    text-[rgba(0,0,0,0.8)] placeholder:text-[rgba(0,0,0,0.2)]"
                        {...field}
                        onChange={(e) => {
                          field.onChange(e);
                          setHasInput(e.target.value.length > 0);
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                disabled={!hasInput || isSubmitting}
                className={`
                            hidden md:inline
                            rounded-[16px] px-8 py-2 w-auto font-bold text-sm tracking-wide
                            text-white
                            bg-black
                            hover:bg-gray-800
                            disabled:bg-[rgba(0,0,0,0.1)]
                            disabled:text-white
                            disabled:cursor-not-allowed
                        `}
              >
                {isSubmitting ? 'SUBMITTING...' : 'SUBMIT'}
              </Button>
            </form>
          </Form>
        </div>
      </div>
      <div className="py-10 w-full px-10 flex justify-center gap-4">
        <Button
          type="button"
          disabled={!hasInput || isSubmitting}
          onClick={form.handleSubmit(onSubmit)}
          className={`      md:hidden
                            rounded-[16px] px-8 !py-3 flex-1 font-bold text-sm tracking-wide
                            text-white
                            bg-black
                            hover:bg-gray-800
                            disabled:bg-[rgba(0,0,0,0.1)]
                            disabled:text-white
                            disabled:cursor-not-allowed
                        `}
        >
          {isSubmitting ? 'SUBMITTING...' : 'SUBMIT'}
        </Button>
        {email && (
          <Button
            variant="secondary"
            onClick={() => router.push('step1')}
            size="icon"
            className="md:px-10 bg-[rgba(255,255,255,0.6)]"
          >
            <ChevronUpIcon color="rgba(0,0,0,0.2)" />
          </Button>
        )}
      </div>
    </div>
  );
}
