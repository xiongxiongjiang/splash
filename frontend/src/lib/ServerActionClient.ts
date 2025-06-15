import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';

export const createServerActionClient = async () => {
  const cookieStore = await cookies();

  return createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: {
      getAll: () => {
        const cookies: { name: string; value: string }[] = [];
        cookieStore.getAll().forEach((cookie) => {
          cookies.push({
            name: cookie.name,
            value: cookie.value,
          });
        });
        return cookies;
      },
      setAll: (cookies: { name: string; value: string; options?: CookieOptions }[]) => {
        try {
          cookies.forEach((cookie) => {
            cookieStore.set(cookie.name, cookie.value, cookie.options);
          });
        } catch (error) {
          console.error('Error setting cookies:', error);
        }
      },
    },
  });
};
