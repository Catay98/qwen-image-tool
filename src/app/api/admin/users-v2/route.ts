import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { supabase } from '@/lib/supabase';

export async function GET() {
  // 验证管理员权限
  const cookieStore = await cookies();
  const token = cookieStore.get('admin-token');
  
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // 1. 获取所有认证用户
    const { data: authData, error: authError } = await supabase.auth.admin.listUsers();
    
    if (authError) {
      console.error('Error fetching auth users:', authError);
      return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 });
    }
    
    const authUsers = authData?.users || [];
    
    // 2. 批量获取所有相关数据
    const [
      usersResult,
      pointsResult,
      subscriptionsResult,
      imageHistoryResult,
      usageResult,
      paymentsResult
    ] = await Promise.all([
      // 用户基础信息
      supabase.from('users').select('*'),
      
      // 积分信息
      supabase.from('user_points').select('*'),
      
      // 订阅信息（所有状态）
      supabase.from('subscriptions').select('*').order('created_at', { ascending: false }),
      
      // 图片历史（仅统计）
      supabase.from('image_history').select('user_id, id'),
      
      // 使用统计
      supabase.from('user_usage').select('*').order('date', { ascending: false }),
      
      // 支付记录
      supabase.from('payment_records').select('user_id, amount, created_at').order('created_at', { ascending: false })
    ]);
    
    // 3. 创建数据映射
    const usersMap = new Map(usersResult.data?.map(u => [u.id, u]) || []);
    const pointsMap = new Map(pointsResult.data?.map(p => [p.user_id, p]) || []);
    
    // 订阅映射（每个用户最新的订阅）
    const subscriptionsMap = new Map();
    subscriptionsResult.data?.forEach(sub => {
      if (!subscriptionsMap.has(sub.user_id)) {
        subscriptionsMap.set(sub.user_id, sub);
      }
    });
    
    // 图片统计
    const imageCountMap = new Map();
    imageHistoryResult.data?.forEach(img => {
      const count = imageCountMap.get(img.user_id) || 0;
      imageCountMap.set(img.user_id, count + 1);
    });
    
    // 使用统计（最近的记录）
    const usageMap = new Map();
    const today = new Date().toISOString().split('T')[0];
    usageResult.data?.forEach(usage => {
      if (!usageMap.has(usage.user_id)) {
        usageMap.set(usage.user_id, {
          total: usage.total_uses || 0,
          today: usage.date === today ? usage.total_uses : 0,
          lastUse: usage.updated_at
        });
      }
    });
    
    // 支付统计
    const paymentMap = new Map();
    paymentsResult.data?.forEach(payment => {
      const existing = paymentMap.get(payment.user_id) || { total: 0, count: 0, lastPayment: null };
      paymentMap.set(payment.user_id, {
        total: existing.total + (payment.amount || 0),
        count: existing.count + 1,
        lastPayment: existing.lastPayment || payment.created_at
      });
    });
    
    // 4. 构建完整的用户列表
    const users = authUsers.map(authUser => {
      const userData = usersMap.get(authUser.id);
      const points = pointsMap.get(authUser.id);
      const subscription = subscriptionsMap.get(authUser.id);
      const imageCount = imageCountMap.get(authUser.id) || 0;
      const usage = usageMap.get(authUser.id) || { total: 0, today: 0, lastUse: null };
      const payment = paymentMap.get(authUser.id) || { total: 0, count: 0, lastPayment: null };
      
      return {
        id: authUser.id,
        email: authUser.email || userData?.email || '',
        phone: authUser.phone || '',
        created_at: authUser.created_at,
        last_sign_in_at: authUser.last_sign_in_at,
        
        // 用户信息
        metadata: authUser.user_metadata || {},
        
        // 积分信息
        points: {
          total: points?.total_points || 0,
          available: points?.available_points || 0,
          used: points?.used_points || 0,
          totalRecharge: points?.total_recharge || 0
        },
        
        // 订阅信息
        subscription: subscription ? {
          id: subscription.id,
          planName: subscription.plan_name,
          status: subscription.status,
          startDate: subscription.start_date,
          endDate: subscription.end_date,
          cancelledAt: subscription.cancelled_at,
          cancelAtPeriodEnd: subscription.cancel_at_period_end,
          stripeSubscriptionId: subscription.stripe_subscription_id
        } : null,
        
        // 使用统计
        usage: {
          totalImages: imageCount,
          totalUsage: usage.total,
          todayUsage: usage.today,
          lastUse: usage.lastUse
        },
        
        // 支付信息
        payment: {
          totalAmount: payment.total,
          paymentCount: payment.count,
          lastPayment: payment.lastPayment
        }
      };
    });
    
    // 5. 统计总数
    const stats = {
      totalUsers: users.length,
      activeSubscriptions: users.filter(u => u.subscription?.status === 'active').length,
      totalRevenue: users.reduce((sum, u) => sum + u.payment.totalAmount, 0),
      totalImages: users.reduce((sum, u) => sum + u.usage.totalImages, 0),
      todayActiveUsers: users.filter(u => u.usage.todayUsage > 0).length,
      usersWithPoints: users.filter(u => u.points.available > 0).length
    };
    
    return NextResponse.json({
      users,
      stats,
      success: true
    });
    
  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json(
      { error: "Failed to fetch users", details: error },
      { status: 500 }
    );
  }
}