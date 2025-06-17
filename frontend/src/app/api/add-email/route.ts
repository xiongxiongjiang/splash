import { NextResponse } from 'next/server';

import { supabase } from '@/lib/supabase';

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (!email || typeof email !== 'string') {
      return NextResponse.json({ error: 'Invalid email' }, { status: 400 });
    }

    // 当前时间
    const now = new Date().toISOString();

    // upsert: 有则更新 updated_at，无则插入 email 和 created_at
    const { data, error } = await supabase
      .from('user_emails')
      .upsert(
        { email, updated_at: now }, // 需要有 updated_at 字段
        { onConflict: 'email' }, // 基于 email 去重
      )
      .select();

    if (error) {
      return NextResponse.json({ error: error.message, success: false }, { status: 500 });
    }

    return NextResponse.json({ message: 'Email saved or updated', data, success: true });
  } catch (err) {
    return NextResponse.json({ error: err }, { status: 500 });
  }
}
