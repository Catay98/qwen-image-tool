import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import Stripe from 'stripe';

const stripeSecretKey = process.env.STRIPE_SECRET_KEY || '';

const stripe = new Stripe(stripeSecretKey, {
  apiVersion: '2024-12-18.acacia' as any,
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
    
    // 检查是否是管理员操作
    const isAdminOverride = request.headers.get('x-admin-override') === 'true';
    const targetUserId = request.headers.get('x-target-user');
    
    let userId: string;
    
    if (isAdminOverride && targetUserId) {
      // 管理员操作，使用目标用户ID
      userId = targetUserId;
    } else {
      // 普通用户操作，验证token
      const { data: userData, error: authError } = await supabase.auth.getUser(token);
      if (authError || !userData.user) {
        return NextResponse.json(
          { error: '认证失败' },
          { status: 401 }
        );
      }
      userId = userData.user.id;
    }
    
    // 获取请求体中的选项（可选）
    const body = await request.json().catch(() => ({}));
    const immediateCancel = body.immediateCancel || false;

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

    // 如果有Stripe订阅ID，立即取消Stripe订阅（避免"您已订阅"问题）
    // 但在系统内保持访问权限直到到期
    let stripeSuccess = false;
    if (subscription.stripe_subscription_id && stripeSecretKey) {
      try {
        // 总是立即取消Stripe订阅，这样用户可以重新订阅
        // 但在我们的系统中，保持订阅有效直到end_date
        console.log('正在取消Stripe订阅:', subscription.stripe_subscription_id);
        await stripe.subscriptions.cancel(subscription.stripe_subscription_id);
        stripeSuccess = true;
        console.log('Stripe订阅已成功取消');
      } catch (stripeError: any) {
        console.error('Stripe取消订阅失败:', stripeError);
        // 如果订阅已经被取消或不存在，视为成功
        if (stripeError.code === 'resource_missing' || 
            stripeError.message?.includes('No such subscription') ||
            stripeError.message?.includes('already been canceled')) {
          stripeSuccess = true;
          console.log('Stripe订阅已经被取消或不存在');
        }
      }
    }

    // 准备更新数据
    // 在系统中保持active状态直到end_date，这样用户可以继续使用
    let updateData: any = {
      status: 'active',  // 保持active状态，让用户继续使用直到到期
      updated_at: new Date().toISOString(),
      metadata: {
        ...subscription.metadata,
        canceled_at: new Date().toISOString(),
        canceled_by: userId,
        cancel_at_period_end: true,  // 标记为期末取消
        stripe_cancelled: true,  // 标记Stripe已取消
        stripe_cancel_success: stripeSuccess
      }
    };

    // 尝试更新新字段
    const { error: updateError } = await supabase
      .from('subscriptions')
      .update({
        ...updateData,
        cancel_at_period_end: true,  // 尝试设置新字段
        cancelled_at: new Date().toISOString()
      })
      .eq('id', subscription.id);
    
    // 如果新字段不存在，只更新metadata
    if (updateError && updateError.message?.includes('cancel_at_period_end')) {
      const { error: fallbackError } = await supabase
        .from('subscriptions')
        .update(updateData)
        .eq('id', subscription.id);
      
      if (fallbackError) {
        console.error('更新订阅状态失败:', fallbackError);
        return NextResponse.json(
          { error: '取消订阅失败' },
          { status: 500 }
        );
      }
    } else if (updateError) {
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