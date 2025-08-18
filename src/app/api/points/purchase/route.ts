import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { supabase } from '@/lib/supabase';

const stripeSecretKey = process.env.STRIPE_SECRET_KEY || '';

const stripe = new Stripe(stripeSecretKey, {
  apiVersion: '2024-12-18.acacia' as any,
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { packageId, successUrl, cancelUrl } = body;

    // 从请求头获取用户ID
    const userId = request.headers.get('x-user-id');
    
    if (!userId) {
      return NextResponse.json(
        { error: '未授权访问' },
        { status: 401 }
      );
    }

    // 检查用户是否有有效订阅（未过期）
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'active')
      .single();

    if (!subscription) {
      return NextResponse.json(
        { error: '您需要先订阅才能购买积分包' },
        { status: 403 }
      );
    }

    // 检查订阅是否已过期
    const now = new Date();
    const endDate = new Date(subscription.end_date);
    
    if (endDate < now) {
      // 订阅已过期，更新状态
      await supabase
        .from('subscriptions')
        .update({ status: 'expired' })
        .eq('id', subscription.id);
      
      return NextResponse.json(
        { error: '订阅已过期，请续费后才能购买积分包' },
        { status: 403 }
      );
    }

    // 获取积分包信息
    const { data: pointsPackage, error: packageError } = await supabase
      .from('points_packages')
      .select('*')
      .eq('id', packageId)
      .eq('is_active', true)
      .single();

    if (packageError || !pointsPackage) {
      return NextResponse.json(
        { error: '积分包不存在或已下架' },
        { status: 404 }
      );
    }

    const totalPoints = pointsPackage.points + (pointsPackage.bonus_points || 0);

    // 获取用户邮箱
    const { data: userData } = await supabase
      .from('users')
      .select('email')
      .eq('id', userId)
      .single();

    // 创建Stripe Checkout会话 - 积分包购买
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: pointsPackage.name,
              description: pointsPackage.description || `购买 ${totalPoints} 积分`,
            },
            unit_amount: Math.round(pointsPackage.price * 100),
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: successUrl || `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/checkout?success=true&type=points&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: cancelUrl || `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/points-shop?canceled=true`,
      metadata: {
        userId,
        type: 'points_package',
        packageId: pointsPackage.id,
        packageName: pointsPackage.name,
        points: pointsPackage.points.toString(),
        bonusPoints: (pointsPackage.bonus_points || 0).toString(),
        totalPoints: totalPoints.toString()
      },
      customer_email: userData?.email || undefined,
    });

    if (!session.url) {
      throw new Error('Failed to create checkout session URL');
    }

    return NextResponse.json({
      sessionId: session.id,
      url: session.url
    });
  } catch (error) {
    console.error('创建积分包购买会话失败:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '创建支付会话失败' },
      { status: 500 }
    );
  }
}