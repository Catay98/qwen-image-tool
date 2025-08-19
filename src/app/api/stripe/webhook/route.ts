import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { supabase } from '@/lib/supabase';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2024-12-18.acacia' as any,
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || '';

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get('stripe-signature');

    if (!signature) {
      return NextResponse.json(
        { error: 'Missing stripe signature' },
        { status: 400 }
      );
    }

    // 验证webhook签名
    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err) {
      console.error('Webhook signature verification failed:', err);
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 400 }
      );
    }

    // 处理不同的事件类型
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        await handleCheckoutSessionCompleted(session);
        break;
      }
      
      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionUpdate(subscription);
        break;
      }
      
      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionCanceled(subscription);
        break;
      }
      
      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice;
        await handleInvoicePaymentSucceeded(invoice);
        break;
      }
      
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}

// 处理checkout会话完成
async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
  const { metadata } = session;
  
  if (!metadata?.userId) {
    console.error('No userId in session metadata');
    return;
  }

  // 处理积分包购买
  if (metadata.type === 'points_package') {
    await handlePointsPackagePurchase(session);
    return;
  }

  // 更新订单状态
  const { error: orderError } = await supabase
    .from('orders')
    .update({
      status: 'completed',
      completed_at: new Date().toISOString(),
      payment_intent_id: session.payment_intent as string
    })
    .eq('session_id', session.id);

  if (orderError) {
    console.error('Error updating order:', orderError);
  }

  // 获取订阅信息
  if (session.subscription) {
    const subscription = await stripe.subscriptions.retrieve(session.subscription as string);
    
    // 创建或更新订阅记录
    const { error: subError } = await supabase
      .from('subscriptions')
      .upsert({
        user_id: metadata.userId,
        product_id: metadata.productId || '',
        tier: metadata.tier || 'basic',
        status: 'active',
        stripe_subscription_id: subscription.id,
        stripe_customer_id: subscription.customer as string,
        current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
        current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id'
      });

    if (subError) {
      console.error('Error creating subscription:', subError);
    }
  }
}

// 处理订阅更新
async function handleSubscriptionUpdate(subscription: Stripe.Subscription) {
  const { error } = await supabase
    .from('subscriptions')
    .update({
      status: subscription.status,
      current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
      current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
      updated_at: new Date().toISOString()
    })
    .eq('stripe_subscription_id', subscription.id);

  if (error) {
    console.error('Error updating subscription:', error);
  }
}

// 处理订阅取消
async function handleSubscriptionCanceled(subscription: Stripe.Subscription) {
  const { error } = await supabase
    .from('subscriptions')
    .update({
      status: 'canceled',
      canceled_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .eq('stripe_subscription_id', subscription.id);

  if (error) {
    console.error('Error canceling subscription:', error);
  }
}

// 处理积分包购买
async function handlePointsPackagePurchase(session: Stripe.Checkout.Session) {
  console.log('[Webhook] handlePointsPackagePurchase called with session:', session.id);
  const { metadata } = session;
  const userId = metadata.userId;
  const packageId = metadata.packageId;
  const packageName = metadata.packageName;
  const points = parseInt(metadata.points || '0');
  const bonusPoints = parseInt(metadata.bonusPoints || '0');
  const totalPoints = parseInt(metadata.totalPoints || '0');
  
  console.log('[Webhook] Points package purchase metadata:', {
    userId,
    packageId,
    packageName,
    points,
    bonusPoints,
    totalPoints,
    sessionAmount: session.amount_total
  });

  // 获取积分包的有效期设置
  const { data: pointsPackage } = await supabase
    .from('points_packages')
    .select('validity_days')
    .eq('id', packageId)
    .single();

  const validityDays = pointsPackage?.validity_days || 60; // 默认60天
  const expireDate = new Date();
  expireDate.setDate(expireDate.getDate() + validityDays);

  // 1. 记录积分购买记录
  const purchaseData: any = {
    user_id: userId,
    package_name: packageName,
    price: session.amount_total ? session.amount_total / 100 : 0,
    points: points,
    bonus_points: bonusPoints,
    total_points: totalPoints,
    payment_method: 'stripe',
    payment_status: 'completed',
    transaction_id: session.payment_intent as string,
    expire_at: expireDate.toISOString(), // 添加到期时间
    payment_details: {
      session_id: session.id,
      customer_email: session.customer_email,
      validity_days: validityDays,
      expire_at: expireDate.toISOString()
    }
  };
  
  // 只有当packageId是有效的UUID时才添加
  if (packageId && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(packageId)) {
    purchaseData.package_id = packageId;
  }
  
  console.log('[Webhook] Attempting to insert purchase record:', purchaseData);
  
  const { data: purchaseRecord, error: purchaseError } = await supabase
    .from('points_purchase_records')
    .insert(purchaseData)
    .select()
    .single();

  if (purchaseError) {
    console.error('[Webhook] Error creating purchase record:', purchaseError);
    console.error('[Webhook] Error details:', {
      code: purchaseError.code,
      message: purchaseError.message,
      details: purchaseError.details,
      hint: purchaseError.hint
    });
    return;
  } else {
    console.log('[Webhook] Purchase record created successfully:', purchaseRecord);
  }

  // 2. 创建用户积分包记录（带有效期）
  const { error: packageRecordError } = await supabase
    .from('user_points_packages')
    .insert({
      user_id: userId,
      package_id: packageId,
      package_name: packageName,
      points: totalPoints,
      remaining_points: totalPoints,
      purchase_date: new Date().toISOString(),
      expire_date: expireDate.toISOString(),
      is_expired: false,
      purchase_record_id: purchaseRecord.id
    });

  if (packageRecordError) {
    console.error('Error creating user points package:', packageRecordError);
  }

  // 3. 更新用户积分余额
  const { data: currentPoints } = await supabase
    .from('user_points')
    .select('available_points, total_points')
    .eq('user_id', userId)
    .single();

  if (currentPoints) {
    const { error: updateError } = await supabase
      .from('user_points')
      .update({
        available_points: currentPoints.available_points + totalPoints,
        total_points: currentPoints.total_points + totalPoints,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId);

    if (updateError) {
      console.error('Error updating user points:', updateError);
    }
  } else {
    // 如果用户还没有积分记录，创建新记录
    const { error: insertError } = await supabase
      .from('user_points')
      .insert({
        user_id: userId,
        total_points: totalPoints,
        available_points: totalPoints,
        used_points: 0,
        total_recharge: session.amount_total ? session.amount_total / 100 : 0
      });

    if (insertError) {
      console.error('Error inserting user points:', insertError);
    }
  }

  // 4. 记录积分变动日志
  const { error: logError } = await supabase
    .from('points_logs')
    .insert({
      user_id: userId,
      points_change: totalPoints,
      change_type: 'recharge',
      reason: `购买积分包: ${packageName}`,
      balance_after: (currentPoints?.available_points || 0) + totalPoints,
      metadata: {
        package_id: packageId,
        package_name: packageName,
        expire_date: expireDate.toISOString(),
        validity_days: validityDays
      }
    });

  if (logError) {
    console.error('Error creating points log:', logError);
  }
}

// 处理发票支付成功
async function handleInvoicePaymentSucceeded(invoice: Stripe.Invoice) {
  if (!invoice.subscription) return;

  // 记录支付记录
  const { error } = await supabase
    .from('payment_records')
    .insert({
      stripe_invoice_id: invoice.id,
      stripe_subscription_id: invoice.subscription as string,
      amount: invoice.amount_paid / 100, // 转换为元
      currency: invoice.currency?.toUpperCase() || 'USD',
      status: 'completed',
      payment_intent_id: invoice.payment_intent as string,
      created_at: new Date().toISOString()
    });

  if (error) {
    console.error('Error recording payment:', error);
  }
}