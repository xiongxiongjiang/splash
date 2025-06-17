import { NextResponse } from 'next/server';

import { supabase } from '@/lib/supabase';

export async function POST(req: Request) {
  const { linkedin } = await req.json();

  if (!linkedin || typeof linkedin !== 'string') {
    return NextResponse.json({ error: 'Invalid LinkedIn link' }, { status: 400 });
  }

  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from('user_linkedin')
    .upsert({ linkedin, updated_at: now }, { onConflict: 'linkedin' })
    .select();

  if (error) {
    return NextResponse.json({ error: error.message, success: false }, { status: 500 });
  }

  return NextResponse.json({ message: 'LinkedIn saved or updated', data, success: true });
}
