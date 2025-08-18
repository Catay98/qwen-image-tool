'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useTranslation } from 'react-i18next';
import { useDebugRender } from '@/hooks/useDebugRender';

interface Plan {
  id: string;
  name: string;
  duration_type: string;
  price: number;
  description: string;
  features: Record<string, unknown>;
  points?: number;
}

interface SubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubscribe: () => void;
}

export default function SubscriptionModal({ isOpen, onClose }: SubscriptionModalProps) {
  const { user } = useAuth();
  const router = useRouter();
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [fetchingPlans, setFetchingPlans] = useState(false);
  const [hasSubscription, setHasSubscription] = useState(false);
  
  // 调试：检查plans数据
  useDebugRender('SubscriptionModal', { plans, selectedPlan });

  const checkSubscription = async () => {
    if (!user) return;
    
    try {
      const session = await supabase.auth.getSession();
      if (!session.data.session) return;
      
      const { data, error } = await supabase
        .from('subscription')
        .select('*')
        .eq('user_id', user.id)
        .single();
      
      if (data && !error) {
        setHasSubscription(true);
      }
    } catch (error) {
      console.error('Error checking subscription:', error);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchPlans();
      if (user) {
        checkSubscription();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, user]);


  const fetchPlans = async () => {
    try {
      setFetchingPlans(true);
      const response = await fetch(`/api/subscription/plans?t=${Date.now()}`, {
        headers: {
          'Accept-Language': localStorage.getItem('i18nextLng') || 'zh',
          'Cache-Control': 'no-cache'
        }
      });
      const data = await response.json();
      
      if (Array.isArray(data)) {
        setPlans(data);
        // 默认选中第二个套餐（如果存在）
        if (data.length > 1) {
          setSelectedPlan(data[1].id);
        } else if (data.length > 0) {
          setSelectedPlan(data[0].id);
        }
      }
    } catch (error) {
      console.error('Error fetching plans:', error);
    } finally {
      setFetchingPlans(false);
    }
  };

  const calculatePoints = (plan: Plan): number => {
    if (plan.points) return plan.points;
    if (plan.features?.points && typeof plan.features.points === 'number') {
      return plan.features.points;
    }
    
    // 根据实际规则
    if (plan.name === '月订阅' || plan.price === 16.9) {
      return 680;
    } else if (plan.name === '年订阅' || plan.price === 118.8) {
      return 8000;
    } else if (plan.price <= 10) {
      return 100;
    } else {
      return 680;
    }
  };

  const handlePurchase = async () => {
    if (!user) {
      // Not logged in, prompt login
      alert(t('subscriptionModal.loginRequired'));
      onClose();
      return;
    }

    setLoading(true);
    try {
      if (hasSubscription) {
        // Already subscribed, go to points shop
        router.push('/points-shop');
      } else {
        // Not subscribed, go to subscription page
        router.push('/recharge');
      }
      onClose();
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-5xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="p-8">
          {/* 标题区域 */}
          <div className="flex justify-between items-center mb-8">
            <div>
              <h2 className="text-3xl font-bold text-gray-900">{hasSubscription ? t('subscriptionModal.buyPoints') : t('subscriptionModal.title')}</h2>
              <p className="text-gray-600 mt-2">
                {hasSubscription 
                  ? t('subscriptionModal.pointsSubtitle') 
                  : t('subscriptionModal.subscribeSubtitle')}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 transition-colors"
            >
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* 未登录提示 */}
          {!user && (
            <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <svg className="w-5 h-5 text-amber-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <p className="text-amber-800">{t('subscriptionModal.loginRequired')}</p>
                </div>
                <button
                  onClick={() => {
                    onClose();
                    // 触发登录弹窗
                    window.location.href = '/?auth=signin';
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  {t('subscriptionModal.loginNow')}
                </button>
              </div>
            </div>
          )}
          
          {/* 已订阅提示 */}
          {user && hasSubscription && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <svg className="w-5 h-5 text-green-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-green-800">{t('subscriptionModal.alreadySubscribed')}</p>
                </div>
                <button
                  onClick={() => {
                    onClose();
                    router.push('/points-shop');
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  {t('subscriptionModal.buyPointsPackage')}
                </button>
              </div>
            </div>
          )}

          {/* 套餐网格（订阅或积分） */}
          {fetchingPlans ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              <p className="mt-4 text-gray-600">{t('subscriptionModal.loading')}</p>
            </div>
          ) : plans.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              {plans.map((plan) => {
                const points = calculatePoints(plan);
                const isPopular = plan.name === '月订阅';
                
                return (
                  <div
                    key={plan.id}
                    className={`relative border-2 rounded-xl p-6 cursor-pointer transition-all transform hover:scale-105 ${
                      selectedPlan === plan.id
                        ? 'border-blue-500 bg-gradient-to-br from-blue-50 to-indigo-50 shadow-lg'
                        : 'border-gray-200 hover:border-gray-300 bg-white'
                    }`}
                    onClick={() => setSelectedPlan(plan.id)}
                  >
                    {/* 徽章 */}
                    {isPopular && (
                      <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                        <span className="bg-gradient-to-r from-orange-500 to-pink-500 text-white text-xs px-3 py-1 rounded-full font-medium">
                          {t('subscriptionModal.mostPopular')}
                        </span>
                      </div>
                    )}
                    
                    <div className="text-center">
                      <h3 className="text-lg font-semibold mb-2 text-gray-900">
                        {plan.display_name || plan.name}
                      </h3>
                      <div className="text-4xl font-bold text-blue-600 mb-1">
                        {points}
                        <span className="text-sm text-gray-500 ml-1">{t('subscriptionModal.points')}</span>
                      </div>
                      <div className="text-2xl font-bold text-gray-900 mb-3">
                        ${plan.price}
                      </div>
                      <p className="text-sm text-gray-600 mb-3">
                        {plan.description || ''}
                      </p>
                      <div className="text-xs text-gray-500">
                        {t('subscriptionModal.generations', { count: Math.floor(points / 10) })}
                      </div>
                    </div>
                    
                    {/* 选中标记 */}
                    {selectedPlan === plan.id && (
                      <div className="absolute top-2 right-2">
                        <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12 bg-gray-50 rounded-xl">
              <p className="text-gray-600">{t('subscriptionModal.noPlans')}</p>
            </div>
          )}

          {/* 功能说明 */}
          <div className="bg-gray-50 rounded-lg p-6 mb-6">
            <h3 className="font-semibold text-gray-900 mb-3">{t('subscriptionModal.pointsUsageNote')}</h3>
            <div className="grid md:grid-cols-2 gap-4 text-sm text-gray-700">
              <div className="flex items-start">
                <svg className="w-5 h-5 text-green-500 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <div>
                  <strong>{t('recharge.flexibleUsage')}:</strong> {t('recharge.flexibleUsageDesc')}
                </div>
              </div>
              <div className="flex items-start">
                <svg className="w-5 h-5 text-green-500 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <div>
                  <strong>{t('recharge.hdQuality')}:</strong> {t('recharge.hdQualityDesc')}
                </div>
              </div>
              <div className="flex items-start">
                <svg className="w-5 h-5 text-green-500 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <div>
                  <strong>{t('recharge.priorityProcessing')}:</strong> {t('recharge.priorityProcessingDesc')}
                </div>
              </div>
              <div className="flex items-start">
                <svg className="w-5 h-5 text-green-500 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <div>
                  <strong>{t('recharge.bulkDiscount')}:</strong> {t('recharge.bulkDiscountDesc')}
                </div>
              </div>
            </div>
          </div>

          {/* 操作按钮 */}
          {plans.length > 0 && (
            <div className="flex justify-between items-center">
              <div className="text-sm text-gray-600">
                <span>{t('subscriptionModal.selected', '已选择')}：</span>
                <span className="font-semibold text-gray-900">
                  {plans.find(p => p.id === selectedPlan)?.display_name || plans.find(p => p.id === selectedPlan)?.name || ''}
                </span>
                <span className="ml-2 text-blue-600 font-bold">
                  ${plans.find(p => p.id === selectedPlan)?.price}
                </span>
              </div>
              <div className="flex space-x-4">
                <button
                  onClick={onClose}
                  className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                >
                  {t('subscriptionModal.notNow', '暂不需要')}
                </button>
                <button
                  onClick={handlePurchase}
                  disabled={loading}
                  className={`px-8 py-3 rounded-lg text-white font-medium transition-all ${
                    !loading
                      ? 'bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 transform hover:scale-105'
                      : 'bg-gray-400 cursor-not-allowed'
                  }`}
                >
                  {loading ? t('pointsShop.processing') : user ? (hasSubscription ? t('subscriptionModal.buyPointsPackage') : t('nav.subscribe')) : t('subscriptionModal.loginToSubscribe', '登录后订阅')}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}