import { supabase } from './supabase';

interface Subscription {
  id: string;
  user_id: string;
  product_id: string;
  tier: string;
  status: string;
  created_at: string;
  expires_at?: string;
}

interface Order {
  id: string;
  user_id: string;
  session_id: string;
  amount: number;
  product_name: string;
  status: string;
}

/**
 * 获取用户的所有订阅
 */
export async function getUserSubscriptions(userId: string): Promise<Subscription[]> {
  const { data, error } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching subscriptions:', error);
    return [];
  }

  return data || [];
}

/**
 * 检查用户是否有活跃订阅
 */
export async function hasActiveSubscription(userId: string): Promise<boolean> {
  const subscriptions = await getUserSubscriptions(userId);
  return subscriptions.some(sub => sub.status === 'active');
}

/**
 * 获取用户当前的订阅等级
 */
export async function getUserTier(userId: string): Promise<string> {
  const subscriptions = await getUserSubscriptions(userId);
  const activeSubscription = subscriptions.find(sub => sub.status === 'active');
  return activeSubscription?.tier || 'free';
}

/**
 * 创建新订阅
 */
export async function createSubscription(
  userId: string,
  productId: string,
  tier: string
): Promise<{ success: boolean; subscription?: Subscription; error?: string }> {
  try {
    // 先取消之前的订阅
    await cancelUserSubscriptions(userId);

    // 创建新订阅
    const { data, error } = await supabase
      .from('subscriptions')
      .insert({
        user_id: userId,
        product_id: productId,
        tier,
        status: 'active',
        created_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30天
      })
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, subscription: data };
  } catch (error) {
    console.error('Error creating subscription:', error);
    return { success: false, error: '创建订阅失败' };
  }
}

/**
 * 取消用户的所有活跃订阅
 */
export async function cancelUserSubscriptions(userId: string): Promise<void> {
  const { error } = await supabase
    .from('subscriptions')
    .update({ 
      status: 'canceled',
      canceled_at: new Date().toISOString()
    })
    .eq('user_id', userId)
    .eq('status', 'active');

  if (error) {
    console.error('Error canceling subscriptions:', error);
  }
}

/**
 * 更新订阅状态
 */
export async function updateSubscriptionStatus(
  subscriptionId: string,
  status: string
): Promise<boolean> {
  const { error } = await supabase
    .from('subscriptions')
    .update({ 
      status,
      updated_at: new Date().toISOString()
    })
    .eq('id', subscriptionId);

  if (error) {
    console.error('Error updating subscription:', error);
    return false;
  }

  return true;
}

/**
 * 获取订单信息
 */
export async function getOrder(sessionId: string): Promise<Order | null> {
  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .eq('session_id', sessionId)
    .single();

  if (error) {
    console.error('Error fetching order:', error);
    return null;
  }

  return data;
}

/**
 * 创建支付记录
 */
export async function createPaymentRecord(
  userId: string,
  orderId: string,
  subscriptionId: string,
  amount: number,
  paymentIntentId?: string
): Promise<boolean> {
  const { error } = await supabase
    .from('payment_records')
    .insert({
      user_id: userId,
      order_id: orderId,
      subscription_id: subscriptionId,
      amount,
      payment_intent_id: paymentIntentId,
      payment_method: 'card',
      status: 'completed',
      created_at: new Date().toISOString()
    });

  if (error) {
    console.error('Error creating payment record:', error);
    return false;
  }

  return true;
}

/**
 * 检查订阅是否过期并更新状态
 */
export async function checkAndUpdateExpiredSubscriptions(): Promise<void> {
  const { error } = await supabase
    .from('subscriptions')
    .update({ status: 'expired' })
    .eq('status', 'active')
    .lt('expires_at', new Date().toISOString());

  if (error) {
    console.error('Error updating expired subscriptions:', error);
  }
}

/**
 * 获取用户的支付限制
 */
export async function getUserLimits(userId: string): Promise<{
  tier: string;
  dailyLimit: number;
  monthlyLimit: number;
  priority: number;
}> {
  const tier = await getUserTier(userId);
  
  const limits = {
    free: { dailyLimit: 5, monthlyLimit: 50, priority: 0 },
    basic: { dailyLimit: 20, monthlyLimit: 100, priority: 1 },
    pro: { dailyLimit: 100, monthlyLimit: 500, priority: 2 },
    premium: { dailyLimit: -1, monthlyLimit: -1, priority: 3 } // -1 表示无限
  };

  return {
    tier,
    ...(limits[tier as keyof typeof limits] || limits.free)
  };
}