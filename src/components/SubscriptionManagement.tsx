'use client';

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';

interface SubscriptionInfo {
  id: string;
  plan_name: string;
  status: string;
  start_date: string;
  end_date: string;
  stripe_subscription_id?: string;
  cancel_at_period_end?: boolean;
  cancelled_at?: string;
}

interface UpgradePlan {
  id: string;
  name: string;
  price: number;
  points: number;
  duration_type: string;
  description: string;
}

export default function SubscriptionManagement() {
  const { t, i18n } = useTranslation();
  const language = i18n.language;
  const { user } = useAuth();
  const [subscription, setSubscription] = useState<SubscriptionInfo | null>(null);
  const [upgradePlans, setUpgradePlans] = useState<UpgradePlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancelLoading, setCancelLoading] = useState(false);
  const [upgradeLoading, setUpgradeLoading] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchSubscriptionInfo();
    }
  }, [user]);

  const fetchSubscriptionInfo = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      // 获取订阅信息（包括已过期的）
      const { data: sub } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .in('status', ['active', 'cancelled', 'expired'])
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      // 检查是否已过期
      if (sub && sub.end_date) {
        const now = new Date();
        const endDate = new Date(sub.end_date);
        if (endDate < now && sub.status === 'active') {
          // 订阅已过期但状态还是active，更新为expired
          await supabase
            .from('subscriptions')
            .update({ status: 'expired' })
            .eq('id', sub.id);
          sub.status = 'expired';
        }
        
        // 如果字段不存在，从metadata中读取
        if (sub.cancel_at_period_end === undefined && sub.metadata?.cancel_at_period_end) {
          sub.cancel_at_period_end = sub.metadata.cancel_at_period_end;
        }
        if (sub.cancelled_at === undefined && sub.metadata?.canceled_at) {
          sub.cancelled_at = sub.metadata.canceled_at;
        }
      }

      setSubscription(sub);

      // 如果有订阅，获取可升级的套餐
      if (sub) {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          const response = await fetch('/api/subscription/upgrade', {
            headers: {
              'Authorization': `Bearer ${session.access_token}`
            }
          });
          
          if (response.ok) {
            const data = await response.json();
            setUpgradePlans(data.availableUpgrades || []);
          }
        }
      }
    } catch (error) {
      console.error('Error fetching subscription:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelSubscription = async () => {
    if (!user || !subscription) return;
    
    setCancelLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        alert(t('common.loginRequired'));
        return;
      }

      const response = await fetch('/api/subscription/cancel', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      
      if (response.ok) {
        alert(t('subscriptionManagement.cancelSuccess'));
        setShowCancelConfirm(false);
        // 更新订阅状态而不是删除
        await fetchSubscriptionInfo();
      } else {
        alert(data.error || t('common.cancelFailed'));
      }
    } catch (error) {
      console.error('Error canceling subscription:', error);
      alert(t('common.cancelFailed'));
    } finally {
      setCancelLoading(false);
    }
  };

  const handleUpgradeSubscription = async () => {
    if (!user || !selectedPlan) return;
    
    setUpgradeLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        alert(t('common.loginRequired'));
        return;
      }

      const response = await fetch('/api/subscription/upgrade', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          newPlanId: selectedPlan
        })
      });

      const data = await response.json();
      
      if (response.ok && data.url) {
        // 跳转到Stripe支付页面
        window.location.href = data.url;
      } else {
        alert(data.error || t('common.upgradeFailed'));
      }
    } catch (error) {
      console.error('Error upgrading subscription:', error);
      alert(t('common.upgradeFailed'));
    } finally {
      setUpgradeLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('zh-CN');
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-8 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  if (!subscription) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('subscriptionManagement.title')}</h3>
        <p className="text-gray-600">{t('subscriptionManagement.noSubscription')}</p>
      </div>
    );
  }

  return (
    <>
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">{t('subscriptionManagement.title')}</h3>
        
        {/* 当前订阅信息 */}
        <div className="mb-6 p-4 bg-blue-50 rounded-lg">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm text-gray-600 mb-1">{t('subscriptionManagement.currentPlan')}</p>
              <p className="text-xl font-bold text-gray-900">
                {subscription.plan_name === 'Monthly' ? (language === 'zh' ? '月度会员' : 'Monthly') :
                 subscription.plan_name === 'Yearly' ? (language === 'zh' ? '年度会员' : 'Yearly') :
                 subscription.plan_name}
              </p>
              <p className="text-sm text-gray-600 mt-2">
                {t('subscriptionManagement.startDate')}: {formatDate(subscription.start_date)}
              </p>
              <p className="text-sm text-gray-600">
                {t('subscriptionManagement.endDate')}: {formatDate(subscription.end_date)}
              </p>
            </div>
            <div className="flex flex-col items-end">
              {subscription.status === 'expired' ? (
                <span className="px-3 py-1 bg-red-100 text-red-800 text-sm rounded-full">
                  {t('subscriptionManagement.expired')}
                </span>
              ) : subscription.cancel_at_period_end ? (
                <span className="px-3 py-1 bg-yellow-100 text-yellow-800 text-sm rounded-full">
                  {t('subscriptionManagement.cancelledButActive')}
                </span>
              ) : (
                <span className="px-3 py-1 bg-green-100 text-green-800 text-sm rounded-full">
                  {t('subscriptionManagement.active')}
                </span>
              )}
              {(subscription.cancel_at_period_end || subscription.status === 'expired') && (
                <p className="text-xs text-gray-500 mt-1">
                  {subscription.status === 'expired' ? t('subscriptionManagement.expiredOn') : t('subscriptionManagement.accessUntil')}: {formatDate(subscription.end_date)}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* 操作按钮 */}
        <div className="flex space-x-4">
          {subscription.status === 'expired' ? (
            <button
              onClick={() => window.location.href = '/recharge'}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              {t('subscriptionManagement.renewSubscription')}
            </button>
          ) : (
            <>
              {upgradePlans.length > 0 && !subscription.cancel_at_period_end && (
                <button
                  onClick={() => setShowUpgradeModal(true)}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  {t('subscriptionManagement.upgradePlan')}
                </button>
              )}
              {!subscription.cancel_at_period_end ? (
                <button
                  onClick={() => setShowCancelConfirm(true)}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  {t('subscriptionManagement.cancelSubscription')}
                </button>
              ) : (
                <button
                  onClick={() => window.location.href = '/recharge'}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  {t('subscriptionManagement.resubscribe')}
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {/* 取消确认对话框 */}
      {showCancelConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('subscriptionManagement.confirmCancel')}</h3>
            <p className="text-gray-600 mb-6">
              {t('subscriptionManagement.cancelWarning')}
            </p>
            <div className="flex space-x-4">
              <button
                onClick={() => setShowCancelConfirm(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                {t('subscriptionManagement.notNow')}
              </button>
              <button
                onClick={handleCancelSubscription}
                disabled={cancelLoading}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
              >
                {cancelLoading ? t('common.processing') : t('common.confirm')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 升级套餐对话框 */}
      {showUpgradeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">{t('subscriptionManagement.upgradePlan')}</h3>
            
            {upgradePlans.length > 0 ? (
              <>
                <div className="grid gap-4 mb-6">
                  {upgradePlans.map((plan) => (
                    <div
                      key={plan.id}
                      className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                        selectedPlan === plan.id
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => setSelectedPlan(plan.id)}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-semibold text-gray-900">
                            {plan.display_name || plan.name}
                          </h4>
                          <p className="text-sm text-gray-600 mt-1">
                            {plan.description || ''}
                          </p>
                          <p className="text-sm text-gray-500 mt-2">
                            {plan.points} {t('subscriptionManagement.points')} / {plan.duration_type === 'month' ? t('common.month') : t('common.year')}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold text-gray-900">${plan.price}</p>
                          <p className="text-xs text-gray-500">
                            /{plan.duration_type === 'month' ? t('common.month') : t('common.year')}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex space-x-4">
                  <button
                    onClick={() => {
                      setShowUpgradeModal(false);
                      setSelectedPlan(null);
                    }}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    {t('common.cancel')}
                  </button>
                  <button
                    onClick={handleUpgradeSubscription}
                    disabled={!selectedPlan || upgradeLoading}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                  >
                    {upgradeLoading ? t('common.processing') : t('common.confirm')}
                  </button>
                </div>
              </>
            ) : (
              <p className="text-gray-600">{t('subscriptionManagement.noUpgradesAvailable')}</p>
            )}
          </div>
        </div>
      )}
    </>
  );
}