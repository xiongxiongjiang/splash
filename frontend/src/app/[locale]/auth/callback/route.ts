import { NextResponse } from 'next/server';

import { createServerActionClient } from '@/lib/ServerActionClient';

import type { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const error = requestUrl.searchParams.get('error');
  const errorDescription = requestUrl.searchParams.get('error_description');
  
  // Extract locale from the URL path
  const pathSegments = requestUrl.pathname.split('/');
  const locale = pathSegments[1] || 'en';

  console.log('OAuth callback called with:', { code: !!code, error, errorDescription, locale });

  // Handle OAuth errors first
  if (error) {
    console.error('OAuth error received:', error, errorDescription);
    return NextResponse.redirect(new URL(`/${locale}/login?error=oauth_error&details=${error}`, request.url));
  }

  // Handle missing code
  if (!code) {
    console.error('No authorization code received in OAuth callback');
    return NextResponse.redirect(new URL(`/${locale}/login?error=no_code`, request.url));
  }

  try {
    // Check environment variables
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    console.log('Environment check:', { 
      hasUrl: !!supabaseUrl, 
      hasKey: !!supabaseAnonKey,
      url: supabaseUrl?.substring(0, 30) + '...' 
    });

    if (!supabaseUrl || !supabaseAnonKey) {
      console.error('Missing Supabase environment variables');
      return NextResponse.redirect(new URL(`/${locale}/login?error=env_missing`, request.url));
    }

    // Process the authorization code
    console.log('Creating Supabase client...');
    const supabase = await createServerActionClient();
    console.log('Supabase client created successfully');

    // Exchange code for session
    console.log('Exchanging code for session...');
    const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
    console.log('Exchange result:', { hasData: !!data, hasUser: !!data?.user, hasSession: !!data?.session, error: exchangeError });

    if (exchangeError) {
      console.error('OAuth code exchange error:', exchangeError);
      return NextResponse.redirect(new URL(`/${locale}/login?error=exchange_failed&details=${exchangeError.message}`, request.url));
    }

    // Verify we have valid user and session data
    if (!data.user || !data.session) {
      console.error('OAuth exchange succeeded but no user/session data received');
      return NextResponse.redirect(new URL(`/${locale}/login?error=invalid_session`, request.url));
    }

    console.log('✅ OAuth successful, user:', data.user.email);
    
    // Only redirect to dashboard on complete success
    return NextResponse.redirect(new URL(`/${locale}/dashboard`, request.url));
    
  } catch (error) {
    console.error('Unexpected error in OAuth callback:', error);
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    return NextResponse.redirect(new URL(`/${locale}/login?error=unexpected&details=${error instanceof Error ? error.message : 'Unknown error'}`, request.url));
  }
}
