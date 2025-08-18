import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { supabase } from '@/lib/supabase';

const stripeSecretKey = process.env.STRIPE_SECRET_KEY || '';

const stripe = new Stripe(stripeSecretKey, {
  apiVersion: '2024-12-18.acacia',
});

export async function POST(request: NextRequest) {
  try {
    const { sessionId } = await request.json();
    console.log('Handle-success called with sessionId:', sessionId);

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID required' },
        { status: 400 }
      );
    }

    // 获取Stripe会话信息
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    console.log('Stripe session payment_status:', session.payment_status);

    if (session.payment_status !== 'paid') {
      return NextResponse.json(
        { error: 'Payment not completed' },
        { status: 400 }
      );
    }

    const { userId, type, planId, planName, packageId, packageName, points, bonusPoints, totalPoints, billingPeriod } = session.metadata || {};

    if (!userId) {
      return NextResponse.json(
        { error: 'Invalid session metadata: missing userId' },
        { status: 400 }
      );
    }

    // 判断是订阅还是积分包购买
    if (type === 'points_package') {
      // 处理积分包购买
      return handlePointsPackagePurchase({
        userId,
        packageId,
        packageName,
        points: parseInt(points || '0'),
        bonusPoints: parseInt(bonusPoints || '0'),
        totalPoints: parseInt(totalPoints || '0'),
        amount: session.amount_total ? session.amount_total / 100 : 0,
        sessionId
      });
    } else if (type === 'subscription') {
      // 处理订阅创建
      return handleSubscriptionCreation({
        userId,
        planId,
        planName,
        points: parseInt(points || '0'),
        billingPeriod: billingPeriod || 'monthly',
        amount: session.amount_total ? session.amount_total / 100 : 0,
        sessionId,
        stripeCustomerId: session.customer as string,
        stripeSubscriptionId: session.subscription as string
      });
    } else if (type === 'subscription_upgrade') {
      // 处理订阅升级
      return handleSubscriptionUpgrade({
        userId,
        currentSubscriptionId: session.metadata?.currentSubscriptionId,
        newPlanId: session.metadata?.newPlanId,
        newPlanName: session.metadata?.newPlanName,
        points: parseInt(session.metadata?.points || '0'),
        billingPeriod: session.metadata?.billingPeriod || 'monthly',
        amount: session.amount_total ? session.amount_total / 100 : 0,
        sessionId,
        stripeCustomerId: session.customer as string,
        stripeSubscriptionId: session.subscription as string
      });
    }

    // 默认处理（兼容旧代码）
    if (!planId) {
      return NextResponse.json(
        { error: 'Invalid session metadata: missing planId' },
        { status: 400 }
      );
    }

    // 获取套餐信息以确定积分数量
    const { data: plan, error: planError } = await supabase
      .from('subscription_plans')
      .select('*')
      .eq('id', planId)
      .single();

    if (planError || !plan) {
      console.error('Error fetching plan:', planError);
      return NextResponse.json(
        { error: 'Plan not found' },
        { status: 404 }
      );
    }

    // 计算积分数量
    let pointsToAdd = 0;
    if (plan.points) {
      pointsToAdd = plan.points;
    } else if (plan.features?.points) {
      pointsToAdd = plan.features.points;
    } else {
      // 根据价格计算积分
      if (plan.price === 16.9) {
        pointsToAdd = 680;
      } else if (plan.price === 118.8) {
        pointsToAdd = 8000;
      } else if (plan.price <= 10) {
        pointsToAdd = 100;
      } else {
        pointsToAdd = Math.floor(plan.price * 40);
      }
    }

    // 给用户添加积分
    const { data: pointsResult, error: pointsError } = await supabase
      .rpc('add_user_points', {
        p_user_id: userId,
        p_points: pointsToAdd,
        p_amount: plan.price,
        p_payment_method: 'stripe',
        p_transaction_id: sessionId
      });

    if (pointsError) {
      console.error('Error adding points:', pointsError);
      
      // 如果函数不存在，尝试直接操作
      const { data: userPoints, error: fetchError } = await supabase
        .from('user_points')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (fetchError && fetchError.code === 'PGRST116') {
        // 用户积分记录不存在，创建新记录
        const { error: insertError } = await supabase
          .from('user_points')
          .insert({
            user_id: userId,
            total_points: pointsToAdd,
            available_points: pointsToAdd,
            used_points: 0
          });

        if (insertError) {
          console.error('Error creating user points:', insertError);
          return NextResponse.json(
            { error: 'Failed to add points' },
            { status: 500 }
          );
        }
      } else if (!fetchError && userPoints) {
        // 更新现有积分
        const { error: updateError } = await supabase
          .from('user_points')
          .update({
            total_points: userPoints.total_points + pointsToAdd,
            available_points: userPoints.available_points + pointsToAdd
          })
          .eq('user_id', userId);

        if (updateError) {
          console.error('Error updating user points:', updateError);
          return NextResponse.json(
            { error: 'Failed to update points' },
            { status: 500 }
          );
        }
      }
    }

    // 创建支付记录（只在支付成功后创建）
    const { error: paymentError } = await supabase
      .from('payment_records')
      .insert({
        user_id: userId,
        amount: plan.price,
        currency: 'USD',
        payment_method: 'stripe',
        payment_status: 'completed',
        transaction_id: sessionId,
        payment_details: {
          session_id: sessionId,
          customer_id: session.customer,
          plan_name: planName || plan.name,
          plan_id: planId,
          points_added: pointsToAdd
        },
        created_at: new Date().toISOString()
      });

    if (paymentError) {
      console.error('Error creating payment record:', paymentError);
      // 不影响积分添加的成功
    }

    // 记录到payment_history表（如果存在）
    await supabase
      .from('payment_history')
      .insert({
        user_id: userId,
        amount: plan.price,
        points_added: pointsToAdd,
        payment_method: 'stripe',
        status: 'completed',
        transaction_id: sessionId,
        stripe_session_id: sessionId,
        metadata: {
          plan_name: planName,
          plan_id: planId
        }
      })
      .catch(err => console.log('payment_history table may not exist:', err));

    return NextResponse.json({
      success: true,
      pointsAdded: pointsToAdd,
      message: `成功充值 ${pointsToAdd} 积分`
    });
  } catch (error) {
    console.error('Error handling payment success:', error);
    return NextResponse.json(
      { error: 'Failed to process payment success' },
      { status: 500 }
    );
  }
}

// 处理订阅创建
async function handleSubscriptionCreation(params: {
  userId: string;
  planId: string;
  planName: string;
  points: number;
  billingPeriod: string;
  amount: number;
  sessionId: string;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
}) {
  const { userId, planId, planName, points, billingPeriod, amount, sessionId, stripeCustomerId, stripeSubscriptionId } = params;

  try {
    // 计算订阅结束日期
    const startDate = new Date();
    const endDate = new Date();
    if (billingPeriod === 'month') {
      endDate.setMonth(endDate.getMonth() + 1);
    } else if (billingPeriod === 'year') {
      endDate.setFullYear(endDate.getFullYear() + 1);
    }

    // 先检查是否已有活跃订阅
    const { data: existingSubscription } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'active')
      .single();

    if (existingSubscription) {
      // 如果有活跃订阅，更新它
      const { error: updateError } = await supabase
        .from('subscriptions')
        .update({
          plan_id: planId,
          plan_name: planName,
          start_date: startDate.toISOString(),
          end_date: endDate.toISOString(),
          stripe_subscription_id: stripeSubscriptionId,
          stripe_customer_id: stripeCustomerId,
          updated_at: new Date().toISOString(),
          metadata: {
            session_id: sessionId,
            points_granted: points,
            billing_period: billingPeriod
          }
        })
        .eq('id', existingSubscription.id);

      if (updateError) {
        console.error('Error updating subscription:', updateError);
        return NextResponse.json(
          { error: 'Failed to update subscription' },
          { status: 500 }
        );
      }
    } else {
      // 创建新订阅记录
      const { error: subscriptionError } = await supabase
        .from('subscriptions')
        .insert({
          user_id: userId,
          plan_id: planId,
          plan_name: planName,
          status: 'active',
          start_date: startDate.toISOString(),
          end_date: endDate.toISOString(),
          stripe_subscription_id: stripeSubscriptionId,
          stripe_customer_id: stripeCustomerId,
          metadata: {
            session_id: sessionId,
            points_granted: points,
            billing_period: billingPeriod
          }
        });

      if (subscriptionError) {
        console.error('Error creating subscription:', subscriptionError);
        return NextResponse.json(
          { error: 'Failed to create subscription' },
          { status: 500 }
        );
      }
    }

    // 给用户添加初始积分
    const { data: userPoints, error: fetchError } = await supabase
      .from('user_points')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (fetchError && fetchError.code === 'PGRST116') {
      // 用户积分记录不存在，创建新记录
      const { error: insertError } = await supabase
        .from('user_points')
        .insert({
          user_id: userId,
          total_points: points,
          available_points: points,
          used_points: 0,
          total_recharge: amount
        });

      if (insertError) {
        console.error('Error creating user points:', insertError);
      }
    } else if (!fetchError && userPoints) {
      // 更新现有积分
      const { error: updateError } = await supabase
        .from('user_points')
        .update({
          total_points: userPoints.total_points + points,
          available_points: userPoints.available_points + points,
          total_recharge: userPoints.total_recharge + amount
        })
        .eq('user_id', userId);

      if (updateError) {
        console.error('Error updating user points:', updateError);
      }
    }

    // 创建支付记录
    const { error: paymentError } = await supabase
      .from('payment_records')
      .insert({
        user_id: userId,
        amount: amount,
        currency: 'USD',
        payment_method: 'stripe',
        payment_status: 'completed',
        transaction_id: sessionId,
        payment_details: {
          type: 'subscription',
          session_id: sessionId,
          customer_id: stripeCustomerId,
          subscription_id: stripeSubscriptionId,
          plan_name: planName,
          plan_id: planId,
          points_granted: points,
          billing_period: billingPeriod
        }
      });

    if (paymentError) {
      console.error('Error creating payment record:', paymentError);
    }

    return NextResponse.json({
      success: true,
      type: 'subscription',
      message: `成功订阅 ${planName}，获得 ${points} 积分`
    });
  } catch (error) {
    console.error('Error handling subscription creation:', error);
    return NextResponse.json(
      { error: 'Failed to process subscription' },
      { status: 500 }
    );
  }
}

// 处理积分包购买
async function handlePointsPackagePurchase(params: {
  userId: string;
  packageId?: string;
  packageName?: string;
  points: number;
  bonusPoints: number;
  totalPoints: number;
  amount: number;
  sessionId: string;
}) {
  const { userId, packageId, packageName, points, bonusPoints, totalPoints, amount, sessionId } = params;

  try {
    // 添加积分到用户账户
    const { data: userPoints, error: fetchError } = await supabase
      .from('user_points')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (fetchError && fetchError.code === 'PGRST116') {
      // 用户积分记录不存在，创建新记录
      const { error: insertError } = await supabase
        .from('user_points')
        .insert({
          user_id: userId,
          total_points: totalPoints,
          available_points: totalPoints,
          used_points: 0,
          total_recharge: amount
        });

      if (insertError) {
        console.error('Error creating user points:', insertError);
        return NextResponse.json(
          { error: 'Failed to add points' },
          { status: 500 }
        );
      }
    } else if (!fetchError && userPoints) {
      // 更新现有积分
      const { error: updateError } = await supabase
        .from('user_points')
        .update({
          total_points: userPoints.total_points + totalPoints,
          available_points: userPoints.available_points + totalPoints,
          total_recharge: userPoints.total_recharge + amount
        })
        .eq('user_id', userId);

      if (updateError) {
        console.error('Error updating user points:', updateError);
        return NextResponse.json(
          { error: 'Failed to update points' },
          { status: 500 }
        );
      }
    }

    // 创建积分购买记录
    const { error: purchaseError } = await supabase
      .from('points_purchase_records')
      .insert({
        user_id: userId,
        package_id: packageId,
        package_name: packageName,
        price: amount,
        points: points,
        bonus_points: bonusPoints,
        total_points: totalPoints,
        payment_method: 'stripe',
        payment_status: 'completed',
        transaction_id: sessionId,
        payment_details: {
          session_id: sessionId
        }
      });

    if (purchaseError) {
      console.error('Error creating purchase record:', purchaseError);
    }

    // 创建积分日志
    await supabase
      .from('points_logs')
      .insert({
        user_id: userId,
        points_change: totalPoints,
        change_type: 'recharge',
        reason: `购买积分包: ${packageName || '积分充值'}`,
        balance_after: (userPoints?.available_points || 0) + totalPoints,
        metadata: {
          package_id: packageId,
          package_name: packageName,
          points: points,
          bonus_points: bonusPoints,
          transaction_id: sessionId
        }
      });

    return NextResponse.json({
      success: true,
      type: 'points_package',
      pointsAdded: totalPoints,
      message: `成功购买 ${totalPoints} 积分`
    });
  } catch (error) {
    console.error('Error handling points package purchase:', error);
    return NextResponse.json(
      { error: 'Failed to process points package purchase' },
      { status: 500 }
    );
  }
}

// 处理订阅升级
async function handleSubscriptionUpgrade(params: {
  userId: string;
  currentSubscriptionId?: string;
  newPlanId?: string;
  newPlanName?: string;
  points: number;
  billingPeriod: string;
  amount: number;
  sessionId: string;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
}) {
  const { 
    userId, 
    currentSubscriptionId, 
    newPlanId, 
    newPlanName, 
    points, 
    billingPeriod, 
    amount, 
    sessionId, 
    stripeCustomerId, 
    stripeSubscriptionId 
  } = params;

  try {
    // 取消旧的Stripe订阅
    if (currentSubscriptionId) {
      const { data: oldSub } = await supabase
        .from('subscriptions')
        .select('stripe_subscription_id')
        .eq('id', currentSubscriptionId)
        .single();

      if (oldSub?.stripe_subscription_id) {
        try {
          const stripe = new Stripe(stripeSecretKey, {
            apiVersion: '2024-12-18.acacia',
          });
          await stripe.subscriptions.cancel(oldSub.stripe_subscription_id);
        } catch (error) {
          console.error('Error canceling old Stripe subscription:', error);
        }
      }

      // 更新旧订阅状态
      await supabase
        .from('subscriptions')
        .update({
          status: 'canceled',
          updated_at: new Date().toISOString(),
          metadata: {
            upgraded_to: newPlanId,
            upgraded_at: new Date().toISOString()
          }
        })
        .eq('id', currentSubscriptionId);
    }

    // 计算新订阅的结束日期
    const startDate = new Date();
    const endDate = new Date();
    if (billingPeriod === 'month') {
      endDate.setMonth(endDate.getMonth() + 1);
    } else if (billingPeriod === 'year') {
      endDate.setFullYear(endDate.getFullYear() + 1);
    }

    // 创建新订阅记录
    const { error: subscriptionError } = await supabase
      .from('subscriptions')
      .insert({
        user_id: userId,
        plan_id: newPlanId,
        plan_name: newPlanName,
        status: 'active',
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString(),
        stripe_subscription_id: stripeSubscriptionId,
        stripe_customer_id: stripeCustomerId,
        metadata: {
          session_id: sessionId,
          points_granted: points,
          billing_period: billingPeriod,
          upgraded_from: currentSubscriptionId
        }
      });

    if (subscriptionError) {
      console.error('Error creating new subscription:', subscriptionError);
      return NextResponse.json(
        { error: 'Failed to create new subscription' },
        { status: 500 }
      );
    }

    // 添加积分差额（如果新套餐积分更多）
    if (points > 0) {
      const { data: userPoints, error: fetchError } = await supabase
        .from('user_points')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (fetchError && fetchError.code === 'PGRST116') {
        // 创建新记录
        await supabase
          .from('user_points')
          .insert({
            user_id: userId,
            total_points: points,
            available_points: points,
            used_points: 0,
            total_recharge: amount
          });
      } else if (!fetchError && userPoints) {
        // 更新现有积分（添加差额）
        await supabase
          .from('user_points')
          .update({
            total_points: userPoints.total_points + points,
            available_points: userPoints.available_points + points,
            total_recharge: userPoints.total_recharge + amount
          })
          .eq('user_id', userId);
      }
    }

    // 记录支付记录
    await supabase
      .from('payment_records')
      .insert({
        user_id: userId,
        amount: amount,
        currency: 'USD',
        payment_method: 'stripe',
        payment_status: 'completed',
        transaction_id: sessionId,
        payment_details: {
          type: 'subscription_upgrade',
          session_id: sessionId,
          customer_id: stripeCustomerId,
          subscription_id: stripeSubscriptionId,
          new_plan_name: newPlanName,
          new_plan_id: newPlanId,
          points_granted: points,
          billing_period: billingPeriod
        }
      });

    return NextResponse.json({
      success: true,
      type: 'subscription_upgrade',
      message: `成功升级到 ${newPlanName}`
    });
  } catch (error) {
    console.error('Error handling subscription upgrade:', error);
    return NextResponse.json(
      { error: 'Failed to process subscription upgrade' },
      { status: 500 }
    );
  }
}