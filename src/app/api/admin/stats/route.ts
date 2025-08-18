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

  // 创建新的supabase客户端实例
  // Using imported supabase client

  try {
    // 获取所有表的数据，不使用count来避免RLS问题
    
    // 尝试获取users表数据
    const { data: usersData, error: usersError } = await supabase
      .from('users')
      .select('*');
    
    // 获取image_history表数据
    const { data: imagesData, error: imagesError } = await supabase
      .from('image_history')
      .select('*')
      .order('created_at', { ascending: false });
    
    // 获取订阅数据 - 使用正确的表名
    const { data: subscriptionsData } = await supabase
      .from('subscriptions')
      .select('*');
    
    // 获取支付记录
    const { data: paymentsData } = await supabase
      .from('payment_records')
      .select('*')
      .eq('payment_status', 'completed');
    
    // 获取积分数据
    const { data: pointsData } = await supabase
      .from('user_points')
      .select('*');
    
    // 获取积分日志
    const { data: pointsLogsData } = await supabase
      .from('points_logs')
      .select('*')
      .order('created_at', { ascending: false });
    
    // 获取用户使用统计
    const { data: usageData } = await supabase
      .from('user_usage')
      .select('*');
    
    // 计算统计数据
    const totalUsers = usersData ? usersData.length : 0;
    const totalImages = imagesData ? imagesData.length : 0;
    
    // 计算今日图片数
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayImages = imagesData ? imagesData.filter(img => 
      new Date(img.created_at) >= today
    ).length : 0;
    
    // 计算订阅统计
    const totalSubscriptions = subscriptionsData ? subscriptionsData.length : 0;
    const activeSubscriptions = subscriptionsData ? subscriptionsData.filter(sub => 
      sub.status === 'active' && new Date(sub.end_date) > new Date()
    ).length : 0;
    
    // 计算收入
    const todayRevenue = paymentsData ? paymentsData
      .filter(payment => new Date(payment.created_at) >= today)
      .reduce((sum, payment) => sum + Number(payment.amount), 0) : 0;
    
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const monthlyRevenue = paymentsData ? paymentsData
      .filter(payment => new Date(payment.created_at) >= firstDayOfMonth)
      .reduce((sum, payment) => sum + Number(payment.amount), 0) : 0;
    
    // 获取最近6张图片
    const recentImages = imagesData ? imagesData.slice(0, 6) : [];
    
    // 如果没有users表数据但有图片，从图片中提取唯一用户
    let uniqueUserCount = totalUsers;
    if (totalUsers === 0 && imagesData) {
      const uniqueUserIds = new Set(imagesData.map(img => img.user_id).filter(id => id));
      uniqueUserCount = uniqueUserIds.size;
    }
    
    // 计算积分相关统计
    const totalPoints = pointsData ? pointsData.reduce((sum, user) => sum + (user.used_points || 0), 0) : 0;
    
    // 今日积分消耗 (使用已定义的today变量)
    const pointsConsumedToday = pointsLogsData ? pointsLogsData
      .filter(log => log.change_type === 'consume' && new Date(log.created_at) >= today)
      .reduce((sum, log) => sum + Math.abs(log.points_change), 0) : 0;
    
    // 今日活跃用户（有使用记录的用户）
    const todayActiveUsers = usageData ? usageData
      .filter(usage => new Date(usage.date).toDateString() === today.toDateString())
      .length : 0;
    
    // 免费用户vs付费用户统计
    const freeUsersToday = usageData ? usageData
      .filter(usage => new Date(usage.date).toDateString() === today.toDateString() && usage.free_uses_remaining > 0)
      .length : 0;
    
    const paidUsersToday = todayActiveUsers - freeUsersToday;
    
    // 人均生成量
    const avgImagesPerUser = uniqueUserCount > 0 ? totalImages / uniqueUserCount : 0;
    
    // 付费转化率
    const paidUsers = subscriptionsData ? new Set(subscriptionsData.map(sub => sub.user_id)).size : 0;
    const conversionRate = uniqueUserCount > 0 ? (paidUsers / uniqueUserCount) * 100 : 0;

    return NextResponse.json({
      stats: {
        totalUsers: uniqueUserCount,
        totalImages: totalImages,
        todayImages: todayImages,
        activeUsers: todayActiveUsers,
        totalSubscriptions: totalSubscriptions,
        activeSubscriptions: activeSubscriptions,
        todayRevenue: todayRevenue,
        monthlyRevenue: monthlyRevenue,
        totalPoints: totalPoints,
        pointsConsumedToday: pointsConsumedToday,
        freeUsersToday: freeUsersToday,
        paidUsersToday: paidUsersToday,
        avgImagesPerUser: avgImagesPerUser,
        conversionRate: conversionRate,
      },
      recentImages: recentImages
    });
  } catch (error) {
    console.error("Error fetching stats:", error);
    return NextResponse.json({
      stats: {
        totalUsers: 0,
        totalImages: 0,
        todayImages: 0,
        activeUsers: 0,
        totalSubscriptions: 0,
        activeSubscriptions: 0,
        todayRevenue: 0,
        monthlyRevenue: 0,
        totalPoints: 0,
        pointsConsumedToday: 0,
        freeUsersToday: 0,
        paidUsersToday: 0,
        avgImagesPerUser: 0,
        conversionRate: 0,
      },
      recentImages: []
    });
  }
}