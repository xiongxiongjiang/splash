'use client';

import type React from 'react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form';

const formSchema = z.object({
  email: z
    .string()
    .nonempty({
      message: 'Email is required',
    })
    .email({
      message: 'Please enter a valid email address',
    }),
});

export default function SurveyPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasInput, setHasInput] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
    },
    mode: 'onSubmit',
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      setIsSubmitting(true);
      console.log('Email submitted:', values.email);
      form.reset();
      setHasInput(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-white to-[#f5ede3] p-6">
      <div className="w-full max-w-xl p-6">
        <div className="space-y-6">
          <div className="space-y-2">
            <h2 className="text-2xl font-semibold text-[rgba(0,0,0,0.8)]">What Is Your Email Address?</h2>
            <p className="text-[rgba(0,0,0,0.3)] text-[20px]">
              When The Product Is Launched, We Will Push It To Your Email Address As Soon As Possible
            </p>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="Rico@gmail.com"
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
    </div>
  );
}
