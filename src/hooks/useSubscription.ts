import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';

interface SubscriptionStatus {
  hasSubscription: boolean;
  subscriptionType: string | null;
  endDate: string | null;
  freeUsesRemaining: number;
  availablePoints?: number;
  canPurchasePoints?: boolean;
  loading: boolean;
  error: string | null;
}

export function useSubscription() {
  const { user } = useAuth();
  const [status, setStatus] = useState<SubscriptionStatus>({
    hasSubscription: false,
    subscriptionType: null,
    endDate: null,
    freeUsesRemaining: 10,
    loading: true,
    error: null
  });

  useEffect(() => {
    if (!user) {
      setStatus(prev => ({ ...prev, loading: false }));
      return;
    }

    checkSubscription();
  }, [user]);

  const checkSubscription = async () => {
    if (!user) {
      // 用户未登录时的默认状态
      setStatus({
        hasSubscription: false,
        subscriptionType: null,
        endDate: null,
        freeUsesRemaining: 10,
        loading: false,
        error: null
      });
      return;
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        // 没有session时设置默认值，不抛出错误
        setStatus({
          hasSubscription: false,
          subscriptionType: null,
          endDate: null,
          freeUsesRemaining: 10,
          loading: false,
          error: null
        });
        return;
      }

      const response = await fetch('/api/subscription/check', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });

      if (!response.ok) {
        // 如果API调用失败，使用默认值而不是抛出错误
        console.error('Subscription check failed with status:', response.status);
        setStatus({
          hasSubscription: false,
          subscriptionType: null,
          endDate: null,
          freeUsesRemaining: 10,
          loading: false,
          error: null
        });
        return;
      }

      const data = await response.json();
      setStatus({
        hasSubscription: data.hasSubscription || false,
        subscriptionType: data.subscriptionType || null,
        endDate: data.endDate || null,
        freeUsesRemaining: data.freeUsesRemaining ?? 10,
        availablePoints: data.availablePoints || 0,
        canPurchasePoints: data.canPurchasePoints || false,
        loading: false,
        error: null
      });
    } catch (error) {
      console.error('Error checking subscription:', error);
      // 错误时也使用默认值，不显示错误给用户
      setStatus({
        hasSubscription: false,
        subscriptionType: null,
        endDate: null,
        freeUsesRemaining: 10,
        loading: false,
        error: null
      });
    }
  };

  const recordUsage = async (endpoint?: string, details?: any) => {
    if (!user) return { success: false, message: 'Not authenticated' };

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        return { success: false, message: 'No session' };
      }

      const { data, error } = await supabase
        .rpc('record_api_usage', {
          p_user_id: user.id,
          p_api_endpoint: endpoint,
          p_details: details
        });

      if (error) {
        console.error('Error recording usage:', error);
        return { success: false, message: error.message };
      }

      // 更新本地状态
      if (!data.has_subscription && data.free_uses_remaining !== undefined) {
        setStatus(prev => ({
          ...prev,
          freeUsesRemaining: data.free_uses_remaining
        }));
      }

      return data;
    } catch (error) {
      console.error('Error recording usage:', error);
      return { success: false, message: 'Failed to record usage' };
    }
  };

  const canUseAPI = () => {
    return status.hasSubscription || status.freeUsesRemaining > 0;
  };

  return {
    ...status,
    checkSubscription,
    recordUsage,
    canUseAPI,
    isAuthenticated: !!user
  };
}