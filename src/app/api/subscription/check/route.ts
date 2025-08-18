import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    // 从请求头获取认证信息
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      // 没有认证信息时返回默认值
      return NextResponse.json({
        hasSubscription: false,
        subscriptionType: null,
        subscriptionEndDate: null,
        hasPoints: false,
        availablePoints: 0,
        totalPoints: 0,
        freeUsesRemaining: 10,
        canGenerate: true,
        canPurchasePoints: false
      });
    }

    const token = authHeader.replace('Bearer ', '');
    
    // 验证用户
    let user;
    try {
      const { data: userData, error: authError } = await supabase.auth.getUser(token);
      if (authError || !userData.user) {
        console.error('Auth error:', authError);
        // 认证失败时返回默认值
        return NextResponse.json({
          hasSubscription: false,
          subscriptionType: null,
          subscriptionEndDate: null,
          hasPoints: false,
          availablePoints: 0,
          totalPoints: 0,
          freeUsesRemaining: 10,
          canGenerate: true,
          canPurchasePoints: false
        });
      }
      user = userData.user;
    } catch (error) {
      console.error('Auth verification error:', error);
      return NextResponse.json({
        hasSubscription: false,
        subscriptionType: null,
        subscriptionEndDate: null,
        hasPoints: false,
        availablePoints: 0,
        totalPoints: 0,
        freeUsesRemaining: 10,
        canGenerate: true,
        canPurchasePoints: false
      });
    }

    // 获取用户订阅信息
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single();

    // 获取用户积分信息
    const { data: userPoints, error: pointsError } = await supabase
      .from('user_points')
      .select('available_points, total_points')
      .eq('user_id', user.id)
      .single();

    let availablePoints = 0;
    let totalPoints = 0;

    if (!pointsError && userPoints) {
      availablePoints = userPoints.available_points || 0;
      totalPoints = userPoints.total_points || 0;
    }

    // 获取今日免费使用量
    const today = new Date().toISOString().split('T')[0];
    const { data: usage } = await supabase
      .from('user_usage')
      .select('free_uses_remaining')
      .eq('user_id', user.id)
      .eq('date', today)
      .single();

    const hasSubscription = !!subscription;
    const subscriptionType = subscription?.plan_name || null;
    const subscriptionEndDate = subscription?.end_date || null;

    return NextResponse.json({
      userId: user.id,
      email: user.email,
      hasSubscription,
      subscriptionType,
      subscriptionEndDate,
      hasPoints: availablePoints > 0,
      availablePoints,
      totalPoints,
      freeUsesRemaining: usage?.free_uses_remaining ?? 10,
      canGenerate: availablePoints >= 10 || (usage?.free_uses_remaining ?? 10) > 0,
      canPurchasePoints: hasSubscription // 只有订阅用户才能购买积分
    });
  } catch (error) {
    console.error('User status check error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}