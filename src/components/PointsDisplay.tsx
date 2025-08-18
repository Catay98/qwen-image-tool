'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { useTranslation } from 'react-i18next';

export default function PointsDisplay() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [points, setPoints] = useState<number>(0);
  const [freeUsesRemaining, setFreeUsesRemaining] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchPoints();
      // 设置定时刷新积分
      const interval = setInterval(fetchPoints, 30000); // 每30秒刷新一次
      return () => clearInterval(interval);
    }
  }, [user]);

  const fetchPoints = async () => {
    if (!user) return;
    
    try {
      // 获取积分
      const { data, error } = await supabase
        .rpc('get_user_points_info', { p_user_id: user.id });
      
      if (!error && data) {
        setPoints(data.available_points || 0);
      } else {
        // 如果函数不存在或出错，尝试直接查询
        const { data: pointsData } = await supabase
          .from('user_points')
          .select('available_points')
          .eq('user_id', user.id)
          .single();
        
        if (pointsData) {
          setPoints(pointsData.available_points || 0);
        }
      }
      
      // 获取总免费使用次数（不是今天的，是累计剩余的）
      const { data: usageData } = await supabase
        .from('user_usage')
        .select('free_uses_remaining')
        .eq('user_id', user.id)
        .order('date', { ascending: false })
        .limit(1)
        .single();
      
      if (usageData) {
        setFreeUsesRemaining(usageData.free_uses_remaining || 0);
      } else {
        // 新用户默认10次
        setFreeUsesRemaining(10);
      }
    } catch (error) {
      console.error('Error fetching points:', error);
      // 新用户可能没有记录，设置默认值
      setFreeUsesRemaining(10);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <span className="bg-gray-100 text-gray-600 px-3 py-1 rounded-full font-medium text-sm animate-pulse">
        {t('common.loading', 'Loading...')}
      </span>
    );
  }

  const getPointsColor = () => {
    if (points >= 100) return 'bg-green-100 text-green-800';
    if (points >= 50) return 'bg-yellow-100 text-yellow-800';
    if (points >= 10) return 'bg-orange-100 text-orange-800';
    return 'bg-red-100 text-red-800';
  };

  const canGenerate = points >= 10;

  return (
    <div className="flex items-center space-x-3">
      {/* 免费次数 */}
      {freeUsesRemaining > 0 && (
        <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full font-medium text-sm">
          🎁 {t('nav.freeUses', 'Free')} {freeUsesRemaining}
        </span>
      )}
      
      {/* 积分显示 */}
      <span className={`${getPointsColor()} px-3 py-1 rounded-full font-medium text-sm`}>
        💎 {points} {t('nav.points', 'Points')}
      </span>
      
      {/* 可生成次数提示 */}
      {points >= 10 && (
        <span className="text-xs text-gray-500">
          {t('common.canGenerate', 'Can generate')} {Math.floor(points / 10)} {t('common.times', 'times')}
        </span>
      )}
    </div>
  );
}