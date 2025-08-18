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
    // 获取所有用户的auth信息
    const { data: { users: authUsers }, error: authError } = await supabase.auth.admin.listUsers();
    
    // 获取所有用户扩展信息
    const { data: usersData } = await supabase
      .from('users')
      .select('*');
    
    // 获取所有用户的图片历史记录统计
    const { data: imageStats } = await supabase
      .from('image_history')
      .select('user_id');
    
    // 获取用户积分信息
    const { data: pointsData } = await supabase
      .from('user_points')
      .select('*');
    
    // 获取订阅信息
    const { data: subscriptionsData } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('status', 'active');
    
    // 获取今日使用统计
    const today = new Date().toISOString().split('T')[0];
    const { data: todayUsageData } = await supabase
      .from('user_usage')
      .select('*')
      .eq('date', today);
    
    // 统计每个用户的图片数量
    const userImageCounts: Record<string, number> = {};
    if (imageStats) {
      imageStats.forEach(record => {
        if (record.user_id) {
          userImageCounts[record.user_id] = (userImageCounts[record.user_id] || 0) + 1;
        }
      });
    }
    
    // 创建用户映射
    const pointsMap = new Map(pointsData?.map(p => [p.user_id, p]) || []);
    const subscriptionsMap = new Map(subscriptionsData?.map(s => [s.user_id, s]) || []);
    const todayUsageMap = new Map(todayUsageData?.map(u => [u.user_id, u]) || []);
    const usersDataMap = new Map(usersData?.map(u => [u.id, u]) || []);
    
    // 构建完整的用户列表
    const users = authUsers?.map(authUser => {
      const userData = usersDataMap.get(authUser.id);
      const userPoints = pointsMap.get(authUser.id);
      const userSubscription = subscriptionsMap.get(authUser.id);
      const userTodayUsage = todayUsageMap.get(authUser.id);
      
      return {
        id: authUser.id,
        email: authUser.email || userData?.email || '',
        created_at: authUser.created_at,
        last_sign_in_at: authUser.last_sign_in_at,
        imageCount: userImageCounts[authUser.id] || 0,
        totalPoints: userPoints?.total_points || 0,
        availablePoints: userPoints?.available_points || 0,
        subscription: userSubscription ? {
          plan_name: userSubscription.plan_name || '订阅',
          status: userSubscription.status,
          end_date: userSubscription.end_date
        } : null,
        todayUsage: userTodayUsage?.total_uses || 0,
        freeUsesRemaining: userTodayUsage?.free_uses_remaining
      };
    }) || [];
    
    // 如果没有auth用户，从其他表构建用户列表
    if (users.length === 0) {
      // 从图片历史中获取唯一用户
      const uniqueUserIds = new Set<string>();
      
      imageStats?.forEach(record => {
        if (record.user_id) uniqueUserIds.add(record.user_id);
      });
      pointsData?.forEach(record => {
        if (record.user_id) uniqueUserIds.add(record.user_id);
      });
      subscriptionsData?.forEach(record => {
        if (record.user_id) uniqueUserIds.add(record.user_id);
      });
      
      Array.from(uniqueUserIds).forEach(userId => {
        const userData = usersDataMap.get(userId);
        const userPoints = pointsMap.get(userId);
        const userSubscription = subscriptionsMap.get(userId);
        const userTodayUsage = todayUsageMap.get(userId);
        
        users.push({
          id: userId,
          email: userData?.email || `user_${userId.substring(0, 8)}@example.com`,
          created_at: userData?.created_at || new Date().toISOString(),
          last_sign_in_at: null,
          imageCount: userImageCounts[userId] || 0,
          totalPoints: userPoints?.total_points || 0,
          availablePoints: userPoints?.available_points || 0,
          subscription: userSubscription ? {
            plan_name: userSubscription.plan_name || '订阅',
            status: userSubscription.status,
            end_date: userSubscription.end_date
          } : null,
          todayUsage: userTodayUsage?.total_uses || 0,
          freeUsesRemaining: userTodayUsage?.free_uses_remaining
        });
      });
    }
    
    // 按创建时间倒序排序
    users.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    return NextResponse.json({ users });
  } catch (error) {
    console.error("Error fetching users:", error);
    // 如果auth.admin不可用，使用备用方法
    try {
      // 备用方法：从各个表收集用户信息
      const { data: usersData } = await supabase.from('users').select('*');
      const { data: imageStats } = await supabase.from('image_history').select('user_id');
      const { data: pointsData } = await supabase.from('user_points').select('*');
      const { data: subscriptionsData } = await supabase.from('subscriptions').select('*').eq('status', 'active');
      const today = new Date().toISOString().split('T')[0];
      const { data: todayUsageData } = await supabase.from('user_usage').select('*').eq('date', today);
      
      // 统计图片数量
      const userImageCounts: Record<string, number> = {};
      imageStats?.forEach(record => {
        if (record.user_id) {
          userImageCounts[record.user_id] = (userImageCounts[record.user_id] || 0) + 1;
        }
      });
      
      // 创建映射
      const pointsMap = new Map(pointsData?.map(p => [p.user_id, p]) || []);
      const subscriptionsMap = new Map(subscriptionsData?.map(s => [s.user_id, s]) || []);
      const todayUsageMap = new Map(todayUsageData?.map(u => [u.user_id, u]) || []);
      
      // 构建用户列表
      const users = (usersData || []).map(userData => ({
        id: userData.id,
        email: userData.email || `user_${userData.id.substring(0, 8)}@example.com`,
        created_at: userData.created_at,
        last_sign_in_at: null,
        imageCount: userImageCounts[userData.id] || 0,
        totalPoints: pointsMap.get(userData.id)?.total_points || 0,
        availablePoints: pointsMap.get(userData.id)?.available_points || 0,
        subscription: subscriptionsMap.get(userData.id) ? {
          plan_name: subscriptionsMap.get(userData.id)?.plan_name || '订阅',
          status: subscriptionsMap.get(userData.id)?.status,
          end_date: subscriptionsMap.get(userData.id)?.end_date
        } : null,
        todayUsage: todayUsageMap.get(userData.id)?.total_uses || 0,
        freeUsesRemaining: todayUsageMap.get(userData.id)?.free_uses_remaining
      }));
      
      return NextResponse.json({ users });
    } catch (fallbackError) {
      console.error("Fallback error:", fallbackError);
      return NextResponse.json({ users: [] });
    }
  }
}