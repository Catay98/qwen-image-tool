import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import Stripe from 'stripe';

const stripeSecretKey = process.env.STRIPE_SECRET_KEY || '';

const stripe = new Stripe(stripeSecretKey, {
  apiVersion: '2024-12-18.acacia',
});

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

    // 获取用户当前的订阅
    const { data: subscription, error: subError } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'active')
      .single();

    if (subError || !subscription) {
      return NextResponse.json(
        { error: '未找到活跃的订阅' },
        { status: 404 }
      );
    }

    // 如果有Stripe订阅ID，设置为期末取消（不立即取消）
    if (subscription.stripe_subscription_id && stripeSecretKey) {
      try {
        await stripe.subscriptions.update(subscription.stripe_subscription_id, {
          cancel_at_period_end: true
        });
      } catch (stripeError) {
        console.error('Stripe取消订阅失败:', stripeError);
        // 即使Stripe取消失败，也继续处理本地数据库
      }
    }

    // 更新数据库中的订阅状态（保持active，但标记为期末取消）
    const { error: updateError } = await supabase
      .from('subscriptions')
      .update({
        status: 'active',  // 保持active状态
        cancel_at_period_end: true,  // 标记为期末取消
        cancelled_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        metadata: {
          ...subscription.metadata,
          canceled_at: new Date().toISOString(),
          canceled_by: userId
        }
      })
      .eq('id', subscription.id);

    if (updateError) {
      console.error('更新订阅状态失败:', updateError);
      return NextResponse.json(
        { error: '取消订阅失败' },
        { status: 500 }
      );
    }

    // 记录取消事件到支付记录
    await supabase
      .from('payment_records')
      .insert({
        user_id: userId,
        amount: 0,
        currency: 'USD',
        payment_method: 'cancellation',
        payment_status: 'completed',
        transaction_id: `cancel_${subscription.id}`,
        payment_details: {
          type: 'subscription_cancellation',
          subscription_id: subscription.id,
          plan_name: subscription.plan_name,
          canceled_at: new Date().toISOString()
        },
        created_at: new Date().toISOString()
      });

    return NextResponse.json({
      success: true,
      message: '自动续费已取消，您可以继续使用订阅直到到期日',
      canceledAt: new Date().toISOString(),
      expiresAt: subscription.end_date
    });

  } catch (error) {
    console.error('取消订阅失败:', error);
    return NextResponse.json(
      { error: '取消订阅失败，请稍后重试' },
      { status: 500 }
    );
  }
}