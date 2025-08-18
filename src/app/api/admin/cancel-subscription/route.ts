import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import Stripe from 'stripe';

const stripeSecretKey = process.env.STRIPE_SECRET_KEY || '';
const stripe = new Stripe(stripeSecretKey, {
  apiVersion: '2024-12-18.acacia' as any,
});

// 管理员API - 手动取消特定用户的订阅
export async function POST(request: NextRequest) {
  try {
    const { email, immediateCancel = true } = await request.json();
    
    if (!email) {
      return NextResponse.json(
        { error: '请提供用户邮箱' },
        { status: 400 }
      );
    }

    // 根据邮箱查找用户
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single();

    if (userError || !user) {
      // 尝试从auth表查找
      const { data: authUsers } = await supabase.auth.admin.listUsers();
      const authUser = authUsers?.users?.find(u => u.email === email);
      
      if (!authUser) {
        return NextResponse.json(
          { error: '未找到该用户' },
          { status: 404 }
        );
      }
      
      user.id = authUser.id;
    }

    // 获取用户的活跃订阅
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .in('status', ['active', 'cancelled'])
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (!subscription) {
      return NextResponse.json(
        { error: '该用户没有活跃的订阅' },
        { status: 404 }
      );
    }

    // 取消Stripe订阅
    let stripeResult = { success: false, message: '' };
    if (subscription.stripe_subscription_id && stripeSecretKey) {
      try {
        // 先尝试获取订阅信息
        const stripeSubscription = await stripe.subscriptions.retrieve(
          subscription.stripe_subscription_id
        ).catch(() => null);

        if (stripeSubscription) {
          if (immediateCancel) {
            // 立即取消
            await stripe.subscriptions.cancel(subscription.stripe_subscription_id);
            stripeResult = { success: true, message: 'Stripe订阅已立即取消' };
          } else {
            // 期末取消
            await stripe.subscriptions.update(subscription.stripe_subscription_id, {
              cancel_at_period_end: true
            });
            stripeResult = { success: true, message: 'Stripe订阅已设置为期末取消' };
          }
        } else {
          stripeResult = { success: false, message: 'Stripe订阅不存在或已取消' };
        }
      } catch (error: any) {
        stripeResult = { 
          success: false, 
          message: `Stripe错误: ${error.message || '未知错误'}` 
        };
      }
    }

    // 更新数据库中的订阅状态
    const updateData = {
      status: immediateCancel ? 'cancelled' : 'active',
      cancel_at_period_end: !immediateCancel,
      cancelled_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      metadata: {
        ...subscription.metadata,
        admin_cancelled: true,
        cancelled_by_admin_at: new Date().toISOString(),
        stripe_cancel_result: stripeResult
      }
    };

    const { error: updateError } = await supabase
      .from('subscriptions')
      .update(updateData)
      .eq('id', subscription.id);

    if (updateError) {
      return NextResponse.json(
        { error: '更新订阅状态失败', details: updateError },
        { status: 500 }
      );
    }

    // 如果是立即取消，清零积分
    if (immediateCancel) {
      const { data: userPoints } = await supabase
        .from('user_points')
        .select('available_points')
        .eq('user_id', user.id)
        .single();

      if (userPoints && userPoints.available_points > 0) {
        await supabase
          .from('user_points')
          .update({
            available_points: 0,
            expired_points: (userPoints.expired_points || 0) + userPoints.available_points,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', user.id);

        // 记录积分清零
        await supabase
          .from('points_transactions')
          .insert({
            user_id: user.id,
            amount: -userPoints.available_points,
            type: 'admin_cancel',
            description: '管理员取消订阅，积分清零',
            balance_after: 0,
            created_at: new Date().toISOString()
          });
      }
    }

    return NextResponse.json({
      success: true,
      message: immediateCancel ? '订阅已立即取消' : '订阅已设置为期末取消',
      user: email,
      subscription: {
        id: subscription.id,
        plan_name: subscription.plan_name,
        status: updateData.status,
        stripe_result: stripeResult
      }
    });

  } catch (error) {
    console.error('管理员取消订阅失败:', error);
    return NextResponse.json(
      { error: '操作失败', details: error },
      { status: 500 }
    );
  }
}

// 获取用户订阅信息
export async function GET(request: NextRequest) {
  const email = request.nextUrl.searchParams.get('email');
  
  if (!email) {
    return NextResponse.json(
      { error: '请提供用户邮箱' },
      { status: 400 }
    );
  }

  try {
    // 查找用户和订阅信息
    const { data: user } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single();

    if (!user) {
      return NextResponse.json(
        { error: '未找到该用户' },
        { status: 404 }
      );
    }

    const { data: subscriptions } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    const { data: points } = await supabase
      .from('user_points')
      .select('*')
      .eq('user_id', user.id)
      .single();

    return NextResponse.json({
      user: { email, id: user.id },
      subscriptions: subscriptions || [],
      points: points || { available_points: 0, expired_points: 0 }
    });

  } catch (error) {
    return NextResponse.json(
      { error: '查询失败', details: error },
      { status: 500 }
    );
  }
}