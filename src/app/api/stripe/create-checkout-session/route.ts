import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { supabase } from '@/lib/supabase';

// 初始化Stripe - 使用环境变量中的密钥
const stripeSecretKey = process.env.STRIPE_SECRET_KEY || '';

const stripe = new Stripe(stripeSecretKey, {
  apiVersion: '2024-12-18.acacia' as any,
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { planId, successUrl, cancelUrl } = body;

    // 验证Stripe配置
    if (!stripeSecretKey) {
      return NextResponse.json(
        { error: 'Stripe未配置，请联系管理员' },
        { status: 503 }
      );
    }

    // 从请求头获取用户ID
    const userId = request.headers.get('x-user-id');
    
    if (!userId) {
      return NextResponse.json(
        { error: '未授权访问' },
        { status: 401 }
      );
    }

    // 从数据库获取套餐信息
    const { data: plan, error: planError } = await supabase
      .from('subscription_plans')
      .select('*')
      .eq('id', planId)
      .eq('is_active', true)
      .single();

    if (planError || !plan) {
      console.error('Plan not found:', planError);
      return NextResponse.json(
        { error: '套餐不存在或已下架' },
        { status: 404 }
      );
    }

    const amount = parseFloat(plan.price);
    
    // 计算积分数量
    let points = 0;
    if (plan.points) {
      points = plan.points;
    } else if (plan.features?.points) {
      points = plan.features.points;
    } else {
      // 根据价格计算积分
      if (plan.price === 16.9) {
        points = 680;
      } else if (plan.price === 118.8) {
        points = 8000;
      } else if (plan.price <= 10) {
        points = 100;
      } else {
        points = Math.floor(plan.price * 40);
      }
    }

    // 获取用户邮箱（优先从users表，如果没有则从auth获取）
    let userEmail = null;
    const { data: userData } = await supabase
      .from('users')
      .select('email')
      .eq('id', userId)
      .single();
    
    if (userData?.email) {
      userEmail = userData.email;
    } else {
      // 如果users表没有邮箱，从auth获取
      const { data: authData } = await supabase.auth.getUser(token);
      if (authData?.user?.email) {
        userEmail = authData.user.email;
      }
    }

    // 检查用户是否已有Stripe客户ID
    let stripeCustomerId = null;
    
    // 获取用户的现有订阅，看是否有stripe_customer_id
    const { data: existingSubscription } = await supabase
      .from('subscriptions')
      .select('stripe_customer_id')
      .eq('user_id', userId)
      .not('stripe_customer_id', 'is', null)
      .limit(1)
      .single();
    
    if (existingSubscription?.stripe_customer_id) {
      stripeCustomerId = existingSubscription.stripe_customer_id;
      
      // 检查该客户是否有活跃订阅
      try {
        const subscriptions = await stripe.subscriptions.list({
          customer: stripeCustomerId,
          status: 'active',
          limit: 1
        });
        
        // 如果有活跃订阅，创建新客户
        if (subscriptions.data.length > 0) {
          console.log('Customer has active subscription, creating new customer');
          stripeCustomerId = null; // 强制创建新客户
        }
      } catch (error) {
        console.error('Error checking existing subscriptions:', error);
      }
    }

    // 判断是订阅还是一次性支付
    // 根据duration_type判断：month/year 是订阅，其他是一次性支付
    const isSubscription = plan.duration_type === 'month' || plan.duration_type === 'year';
    
    console.log('Plan details:', {
      id: plan.id,
      name: plan.name,
      duration_type: plan.duration_type,
      price: plan.price,
      isSubscription
    });
    
    let session;
    
    if (isSubscription) {
      // 订阅模式
      const priceData = {
        currency: 'usd',
        product_data: {
          name: plan.name,
          description: `${plan.name} - 获得 ${points} 积分`,
        },
        unit_amount: Math.round(amount * 100),
        recurring: {
          interval: plan.duration_type === 'month' ? 'month' : 'year',
          interval_count: 1
        }
      };
      
      const sessionOptions: any = {
        payment_method_types: ['card'],
        line_items: [
          {
            price_data: priceData,
            quantity: 1,
          },
        ],
        mode: 'subscription', // 订阅模式
        success_url: successUrl || `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/checkout?success=true&type=subscription&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: cancelUrl || `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/recharge?canceled=true`,
        metadata: {
          userId,
          type: 'subscription',
          planId: plan.id,
          planName: plan.name,
          points: points.toString(),
          billingPeriod: plan.duration_type,
          userEmail: userEmail || '' // 在metadata中保存邮箱
        },
        allow_promotion_codes: true,
        billing_address_collection: 'auto',
        // 传递当前登录用户的邮箱
        customer_email: userEmail || undefined,
      };
      
      session = await stripe.checkout.sessions.create(sessionOptions);
    } else {
      // 一次性支付模式（积分包）
      session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [
          {
            price_data: {
              currency: 'usd',
              product_data: {
                name: `${points} 积分充值套餐`,
                description: `充值 ${points} 积分，可生成约 ${Math.floor(points / 10)} 张图片`,
              },
              unit_amount: Math.round(amount * 100),
            },
            quantity: 1,
          },
        ],
        mode: 'payment', // 一次性支付模式
        success_url: successUrl || `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/checkout?success=true&type=points&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: cancelUrl || `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/recharge?canceled=true`,
        metadata: {
          userId,
          type: 'points_package',  // 改为points_package以匹配handle-success
          packageId: plan.id,  // 使用packageId而不是planId
          packageName: plan.name,
          points: points.toString(),
          bonusPoints: '0',  // 可以从plan中获取
          totalPoints: points.toString()  // 总积分
        },
        // 传递当前登录用户的邮箱
        customer_email: userEmail || undefined,
        allow_promotion_codes: true,
        billing_address_collection: 'auto',
      });
    }

    if (!session.url) {
      throw new Error('Failed to create checkout session URL');
    }

    // 不再在这里记录支付，改为在支付成功后记录

    return NextResponse.json({
      sessionId: session.id,
      url: session.url
    });
  } catch (error) {
    console.error('创建Checkout会话失败:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '创建支付会话失败' },
      { status: 500 }
    );
  }
}