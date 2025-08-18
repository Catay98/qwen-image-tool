import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    // 从请求头获取用户信息
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json(
        { error: '未授权访问' },
        { status: 401 }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    
    // 验证用户
    const { data: userData, error: authError } = await supabase.auth.getUser(token);
    if (authError || !userData.user) {
      return NextResponse.json(
        { error: '认证失败' },
        { status: 401 }
      );
    }

    const userId = userData.user.id;

    // 获取用户的订阅
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .in('status', ['active', 'cancelled'])
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (!subscription) {
      return NextResponse.json({
        hasValidSubscription: false,
        message: '无订阅'
      });
    }

    // 检查订阅是否过期
    const now = new Date();
    const endDate = new Date(subscription.end_date);
    const isExpired = endDate < now;

    if (isExpired && subscription.status !== 'expired') {
      // 订阅已过期，执行清理操作
      
      // 1. 更新订阅状态为expired
      await supabase
        .from('subscriptions')
        .update({ 
          status: 'expired',
          updated_at: new Date().toISOString()
        })
        .eq('id', subscription.id);

      // 2. 清零用户积分
      const { data: userPoints } = await supabase
        .from('user_points')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (userPoints && userPoints.available_points > 0) {
        // 记录积分清零
        await supabase
          .from('points_transactions')
          .insert({
            user_id: userId,
            amount: -userPoints.available_points,
            type: 'expired',
            description: '订阅到期，积分清零',
            balance_after: 0,
            created_at: new Date().toISOString()
          });

        // 更新积分余额为0
        await supabase
          .from('user_points')
          .update({
            available_points: 0,
            expired_points: (userPoints.expired_points || 0) + userPoints.available_points,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', userId);
      }

      return NextResponse.json({
        hasValidSubscription: false,
        message: '订阅已过期，积分已清零',
        expired: true,
        expiredAt: subscription.end_date
      });
    }

    return NextResponse.json({
      hasValidSubscription: !isExpired,
      subscription: {
        id: subscription.id,
        plan_name: subscription.plan_name,
        end_date: subscription.end_date,
        cancel_at_period_end: subscription.cancel_at_period_end || subscription.metadata?.cancel_at_period_end || false
      }
    });

  } catch (error) {
    console.error('检查订阅过期失败:', error);
    return NextResponse.json(
      { error: '检查失败，请稍后重试' },
      { status: 500 }
    );
  }
}