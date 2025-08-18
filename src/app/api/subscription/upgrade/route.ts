import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import Stripe from 'stripe';

const stripeSecretKey = process.env.STRIPE_SECRET_KEY || '';

const stripe = new Stripe(stripeSecretKey, {
  apiVersion: '2024-12-18.acacia' as Stripe.LatestApiVersion,
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { newPlanId } = body;

    if (!newPlanId) {
      return NextResponse.json(
        { error: '请选择要升级的套餐' },
        { status: 400 }
      );
    }

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
    const { data: currentSubscription, error: subError } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'active')
      .single();

    if (subError || !currentSubscription) {
      return NextResponse.json(
        { error: '未找到活跃的订阅' },
        { status: 404 }
      );
    }

    // 获取新套餐信息
    const { data: newPlan, error: planError } = await supabase
      .from('subscription_plans')
      .select('*')
      .eq('id', newPlanId)
      .eq('is_active', true)
      .single();

    if (planError || !newPlan) {
      return NextResponse.json(
        { error: '套餐不存在或已下架' },
        { status: 404 }
      );
    }

    // 检查是否是升级（价格必须更高）
    const { data: currentPlan } = await supabase
      .from('subscription_plans')
      .select('*')
      .eq('id', currentSubscription.plan_id)
      .single();

    if (currentPlan && newPlan.price <= currentPlan.price) {
      return NextResponse.json(
        { error: '只能升级到更高级的套餐' },
        { status: 400 }
      );
    }

    // 创建新的Stripe Checkout会话用于升级
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `升级到 ${newPlan.name}`,
              description: `从 ${currentSubscription.plan_name} 升级到 ${newPlan.name}`,
            },
            unit_amount: Math.round(newPlan.price * 100),
            recurring: {
              interval: newPlan.duration_type === 'month' ? 'month' : 'year',
              interval_count: 1
            }
          },
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/checkout?success=true&type=upgrade&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/profile?canceled=true`,
      metadata: {
        userId,
        type: 'subscription_upgrade',
        currentSubscriptionId: currentSubscription.id,
        currentPlanId: currentSubscription.plan_id,
        currentPlanName: currentSubscription.plan_name,
        newPlanId: newPlan.id,
        newPlanName: newPlan.name,
        points: newPlan.points?.toString() || '0',
        billingPeriod: newPlan.duration_type
      },
      customer_email: userData.user.email || undefined,
      allow_promotion_codes: true,
      billing_address_collection: 'auto',
    });

    if (!session.url) {
      throw new Error('Failed to create checkout session URL');
    }

    return NextResponse.json({
      sessionId: session.id,
      url: session.url,
      message: '正在跳转到支付页面...'
    });

  } catch (error) {
    console.error('升级订阅失败:', error);
    return NextResponse.json(
      { error: '升级订阅失败，请稍后重试' },
      { status: 500 }
    );
  }
}

// 获取可升级的套餐列表
export async function GET(request: NextRequest) {
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
    const { data: currentSubscription } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'active')
      .single();

    if (!currentSubscription) {
      return NextResponse.json({
        currentPlan: null,
        availableUpgrades: []
      });
    }

    // 获取当前套餐信息
    const { data: currentPlan } = await supabase
      .from('subscription_plans')
      .select('*')
      .eq('id', currentSubscription.plan_id)
      .single();

    // 获取所有可升级的套餐（价格更高的）
    const { data: availablePlans } = await supabase
      .from('subscription_plans')
      .select('*')
      .eq('is_active', true)
      .gt('price', currentPlan?.price || 0)
      .order('price', { ascending: true });

    return NextResponse.json({
      currentPlan: {
        ...currentPlan,
        subscriptionId: currentSubscription.id,
        endDate: currentSubscription.end_date
      },
      availableUpgrades: availablePlans || []
    });

  } catch (error) {
    console.error('获取升级选项失败:', error);
    return NextResponse.json(
      { error: '获取升级选项失败' },
      { status: 500 }
    );
  }
}