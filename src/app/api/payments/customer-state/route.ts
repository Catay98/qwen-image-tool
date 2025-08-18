import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    // 从请求头获取用户ID
    const userId = request.headers.get('x-user-id');
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // 查询用户信息
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (userError) {
      console.error('Error fetching user:', userError);
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // 查询用户的所有订阅
    const { data: subscriptions, error: subError } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId);

    if (subError) {
      console.error('Error fetching subscriptions:', subError);
    }

    // 返回客户状态
    return NextResponse.json({
      id: user.id,
      email: user.email,
      created_at: user.created_at,
      subscriptions: subscriptions || [],
      has_active_subscription: subscriptions?.some(sub => sub.status === 'active') || false,
      subscription_tier: subscriptions?.find(sub => sub.status === 'active')?.tier || 'free'
    });
  } catch (error) {
    console.error('Error in customer-state API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}