import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json();
    
    if (!userId) {
      return NextResponse.json(
        { error: 'User ID required' },
        { status: 400 }
      );
    }
    
    const now = new Date().toISOString();
    
    // 1. 查找所有过期的积分购买记录
    const { data: expiredRecords, error: expiredError } = await supabase
      .from('points_purchase_records')
      .select('*')
      .eq('user_id', userId)
      .lt('expire_at', now)
      .eq('payment_status', 'completed')
      .is('expired_processed', null); // 只处理未处理过的过期记录
    
    if (expiredError) {
      console.error('Error fetching expired records:', expiredError);
      return NextResponse.json(
        { error: 'Failed to check expired points' },
        { status: 500 }
      );
    }
    
    if (expiredRecords && expiredRecords.length > 0) {
      // 2. 计算总的过期积分
      const totalExpiredPoints = expiredRecords.reduce((sum, record) => {
        return sum + (record.total_points || record.points || 0);
      }, 0);
      
      console.log(`Found ${expiredRecords.length} expired records with total ${totalExpiredPoints} points`);
      
      // 3. 获取用户当前积分
      const { data: userPoints, error: pointsError } = await supabase
        .from('user_points')
        .select('*')
        .eq('user_id', userId)
        .single();
      
      if (pointsError) {
        console.error('Error fetching user points:', pointsError);
        return NextResponse.json(
          { error: 'Failed to fetch user points' },
          { status: 500 }
        );
      }
      
      if (userPoints) {
        // 4. 扣除过期的积分
        const newAvailablePoints = Math.max(0, userPoints.available_points - totalExpiredPoints);
        
        const { error: updateError } = await supabase
          .from('user_points')
          .update({
            available_points: newAvailablePoints,
            updated_at: now
          })
          .eq('user_id', userId);
        
        if (updateError) {
          console.error('Error updating user points:', updateError);
          return NextResponse.json(
            { error: 'Failed to update user points' },
            { status: 500 }
          );
        }
        
        // 5. 标记这些记录为已处理
        const recordIds = expiredRecords.map(r => r.id);
        const { error: markError } = await supabase
          .from('points_purchase_records')
          .update({
            expired_processed: true,
            expired_at: now
          })
          .in('id', recordIds);
        
        if (markError) {
          console.error('Error marking records as processed:', markError);
        }
        
        // 6. 记录积分变动日志
        const { error: logError } = await supabase
          .from('points_logs')
          .insert({
            user_id: userId,
            points_change: -totalExpiredPoints,
            change_type: 'expire',
            reason: `积分包到期，共 ${expiredRecords.length} 个包`,
            balance_after: newAvailablePoints,
            metadata: {
              expired_records: recordIds,
              expired_count: expiredRecords.length,
              expired_points: totalExpiredPoints
            }
          });
        
        if (logError) {
          console.error('Error creating points log:', logError);
        }
        
        return NextResponse.json({
          success: true,
          expiredCount: expiredRecords.length,
          expiredPoints: totalExpiredPoints,
          newBalance: newAvailablePoints,
          message: `已清理 ${totalExpiredPoints} 个过期积分`
        });
      }
    }
    
    // 7. 查找即将过期的积分（7天内）
    const sevenDaysLater = new Date();
    sevenDaysLater.setDate(sevenDaysLater.getDate() + 7);
    
    const { data: soonExpiring, error: soonError } = await supabase
      .from('points_purchase_records')
      .select('*')
      .eq('user_id', userId)
      .gt('expire_at', now)
      .lt('expire_at', sevenDaysLater.toISOString())
      .eq('payment_status', 'completed');
    
    if (soonError) {
      console.error('Error fetching soon expiring records:', soonError);
    }
    
    const soonExpiringPoints = soonExpiring?.reduce((sum, record) => {
      return sum + (record.total_points || record.points || 0);
    }, 0) || 0;
    
    return NextResponse.json({
      success: true,
      expiredCount: 0,
      expiredPoints: 0,
      soonExpiring: {
        count: soonExpiring?.length || 0,
        points: soonExpiringPoints,
        records: soonExpiring?.map(r => ({
          package_name: r.package_name,
          points: r.total_points || r.points,
          expire_at: r.expire_at
        }))
      },
      message: '没有过期的积分'
    });
    
  } catch (error) {
    console.error('Error checking points expiry:', error);
    return NextResponse.json(
      { error: 'Failed to check points expiry' },
      { status: 500 }
    );
  }
}