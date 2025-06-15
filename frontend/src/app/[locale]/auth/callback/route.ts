import { createServerActionClient } from '@/lib/ServerActionClient';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');

  if (code) {
    const supabase = await createServerActionClient();

    try {
      // Exchange code for session
      const { data, error } = await supabase.auth.exchangeCodeForSession(code);

      if (error) {
        console.error('OAuth callback error:', error);
        return NextResponse.redirect(new URL('/login?error=auth_failed', request.url));
      }

      // If we have a user and session, sync with backend
      if (data.user && data.session) {
        console.log('✅ OAuth successful, user:', data.user.email);

        // The user sync will happen on the frontend dashboard page
        // We don't do it here to avoid server-side API calls
        console.log('🔄 User will be synced with backend on dashboard load');
      }
    } catch (error) {
      console.error('Unexpected error in OAuth callback:', error);
      return NextResponse.redirect(new URL('/login?error=unexpected', request.url));
    }
  }

  // URL to redirect to after sign in process completes
  // return NextResponse.redirect(new URL('/en/dashboard', request.url))
  return NextResponse.redirect(new URL('/en', request.url));
}
