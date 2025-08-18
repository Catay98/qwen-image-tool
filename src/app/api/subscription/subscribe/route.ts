import { NextRequest, NextResponse } from 'next/server';

import { supabase } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  // 此端点已废弃 - 订阅必须通过Stripe支付完成
  // 保留此端点仅用于向后兼容，但不再允许直接创建订阅
  return NextResponse.json(
    { 
      error: '此端点已废弃。请使用 /api/stripe/create-checkout-session 创建支付会话，完成支付后会自动创建订阅。',
      deprecated: true,
      redirectTo: '/api/stripe/create-checkout-session'
    }, 
    { status: 410 } // 410 Gone - 表示此资源已不可用
  );
}