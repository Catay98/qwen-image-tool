'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import NavBar from '@/components/NavBar';
import { supabase } from '@/lib/supabase';
import { useTranslation } from 'react-i18next';
import SubscriptionManagement from '@/components/SubscriptionManagement';

interface Plan {
  id: string;
  name: string;
  duration_type: string;
  price: number;
  description: string;
  features: any;
  points?: number;  // 数据库中存储的积分数量
}

export default function RechargePage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [currentPoints, setCurrentPoints] = useState(0);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [fetchingPlans, setFetchingPlans] = useState(true);
  const [hasSubscription, setHasSubscription] = useState(false);
  const [hasCancelledSubscription, setHasCancelledSubscription] = useState(false);
  const [checkingSubscription, setCheckingSubscription] = useState(true);

  useEffect(() => {
    // 等待auth加载完成
    if (authLoading) return;
    
    if (!user) {
      router.push('/');
      return;
    }
    checkUserSubscription();
    fetchUserPoints();
    fetchPlans();
  }, [user, authLoading, router]);

  const checkUserSubscription = async () => {
    if (!user) return;
    
    setCheckingSubscription(true);
    try {
      const { data: subscription } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .single();
      
      // 如果用户已取消续费（但订阅仍有效），允许他们看到订阅选项
      if (subscription) {
        // 检查是否取消了续费或Stripe已取消
        const cancelAtPeriodEnd = subscription.cancel_at_period_end || 
                                  subscription.metadata?.cancel_at_period_end || 
                                  false;
        const stripeCancelled = subscription.metadata?.stripe_cancelled || false;
        
        // 如果Stripe已取消或设置了期末取消，显示订阅选项让用户可以重新订阅
        if (stripeCancelled || cancelAtPeriodEnd) {
          setHasSubscription(false);  // 显示订阅选项
          setHasCancelledSubscription(true);  // 显示已取消提示
        } else {
          setHasSubscription(true);  // 显示订阅管理
          setHasCancelledSubscription(false);
        }
      } else {
        setHasSubscription(false);
        setHasCancelledSubscription(false);
      }
    } catch (error) {
      console.error('Error checking subscription:', error);
      setHasSubscription(false);
    } finally {
      setCheckingSubscription(false);
    }
  };

  const fetchUserPoints = async () => {
    if (!user) return;
    
    try {
      const { data: points } = await supabase
        .from('user_points')
        .select('available_points')
        .eq('user_id', user.id)
        .single();
      
      if (points) {
        setCurrentPoints(points.available_points || 0);
      }
    } catch (error) {
      console.error('Error fetching user points:', error);
    }
  };

  const fetchPlans = async () => {
    try {
      setFetchingPlans(true);
      const response = await fetch('/api/subscription/plans', {
        headers: {
          'Accept-Language': localStorage.getItem('i18nextLng') || 'zh'
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

  const handleRecharge = async () => {
    if (!user || !selectedPlan) {
      alert(t('recharge.selectPlan'));
      return;
    }

    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        alert(t('recharge.loginFirst'));
        router.push('/');
        return;
      }

      // 创建Stripe Checkout会话进行真实支付
      const response = await fetch('/api/stripe/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user.id
        },
        body: JSON.stringify({
          planId: selectedPlan,
          successUrl: `${window.location.origin}/checkout?success=true&session_id={CHECKOUT_SESSION_ID}`,
          cancelUrl: `${window.location.origin}/recharge?canceled=true`
        })
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || t('pointsShop.createPaymentFailed'));
      }

      // 重定向到Stripe支付页面
      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error('Payment link not received');
      }
    } catch (error) {
      console.error('Checkout error:', error);
      alert(error instanceof Error ? error.message : t('recharge.paymentFailed'));
    } finally {
      setLoading(false);
    }
  };

  // 计算积分数量（基于实际的套餐规则）
  const calculatePoints = (plan: Plan) => {
    // 优先使用数据库中的points字段
    if (plan.points) return plan.points;
    
    // 如果features中有points信息，使用它
    if (plan.features?.points) return plan.features.points;
    
    // 根据数据库中的实际规则作为后备方案：
    // 月订阅16.9元 = 680积分
    // 年订阅118.8元 = 8000积分
    // 每次生成消耗10积分
    
    // 根据价格或名称判断
    if (plan.name === '月订阅' || plan.price === 16.9) {
      return 680;
    } else if (plan.name === '年订阅' || plan.price === 118.8) {
      return 8000;
    } else if (plan.name === '周订阅' || plan.price <= 10) {
      return 100;  // 基础套餐
    } else if (plan.price <= 50) {
      return 680;  // 月订阅级别
    } else if (plan.price <= 100) {
      return 2000; // 季度级别
    } else {
      return 8000; // 年订阅级别
    }
  };

  // 计算节省金额
  const calculateSavings = (plan: Plan) => {
    const points = calculatePoints(plan);
    // 基础价格按最贵的单价计算（约0.1元/积分）
    const basePrice = points * 0.1;
    const savings = basePrice - plan.price;
    return Math.max(0, Math.floor(savings));
  };

  // 如果认证还在加载，显示加载界面
  if (authLoading) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="container mx-auto px-4 py-8 max-w-6xl">
          <NavBar />
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <p className="mt-4 text-gray-600">{t('common.loading')}</p>
          </div>
        </div>
      </main>
    );
  }

  if (!user) {
    return null;
  }

  // 如果还在检查订阅状态，显示加载中
  if (checkingSubscription) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="container mx-auto px-4 py-8 max-w-6xl">
          <NavBar />
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <p className="mt-4 text-gray-600">{t('common.loading')}</p>
          </div>
        </div>
      </main>
    );
  }

  // 如果有订阅，显示订阅管理页面
  if (hasSubscription) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="container mx-auto px-4 py-8 max-w-6xl">
          <NavBar />
          <SubscriptionManagement />
        </div>
      </main>
    );
  }

  // 如果没有订阅，显示充值页面
  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <NavBar />
        
        <div className="mt-8">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">{t('recharge.title')}</h1>
            <p className="text-lg text-gray-600">{t('recharge.subtitle')}</p>
            {hasCancelledSubscription && (
              <div className="mt-4 inline-flex items-center bg-yellow-50 px-6 py-3 rounded-full border border-yellow-200">
                <svg className="w-5 h-5 text-yellow-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="text-yellow-800">{t('recharge.cancelledSubscriptionNote')}</span>
              </div>
            )}
            {!hasCancelledSubscription && (
              <div className="mt-4 inline-flex items-center bg-blue-50 px-6 py-3 rounded-full">
                <span className="text-gray-700">{t('recharge.subscriptionNote')}</span>
              </div>
            )}
          </div>

          {/* 积分套餐 */}
          {fetchingPlans ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              <p className="mt-4 text-gray-600">{t('recharge.loadingPlans')}</p>
            </div>
          ) : plans.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
              {plans.map((plan) => {
                const points = calculatePoints(plan);
                const savings = calculateSavings(plan);
                const isPopular = plan.name === '月订阅' || plan.name === '标准套餐';
                
                return (
                  <div
                    key={plan.id}
                    className={`relative bg-white rounded-2xl p-6 cursor-pointer transition-all transform hover:scale-105 ${
                      selectedPlan === plan.id
                        ? 'ring-4 ring-blue-500 shadow-xl'
                        : 'shadow-lg hover:shadow-xl'
                    }`}
                    onClick={() => setSelectedPlan(plan.id)}
                  >
                    {/* 推荐徽章 */}
                    {isPopular && (
                      <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                        <span className="bg-gradient-to-r from-orange-500 to-pink-500 text-white text-xs px-3 py-1 rounded-full font-medium">
                          {t('recharge.mostPopular')}
                        </span>
                      </div>
                    )}
                    
                    {/* 节省金额 */}
                    {savings > 0 && (
                      <div className="absolute -top-3 right-3">
                        <span className="bg-green-500 text-white text-xs px-2 py-1 rounded-full font-medium">
                          {t('recharge.save')}${savings}
                        </span>
                      </div>
                    )}
                    
                    <div className="text-center">
                      <h3 className="text-xl font-bold mb-3 text-gray-900">
                        {typeof plan.name === 'object' ? (plan.name.zh || plan.name.en || '') : plan.name}
                      </h3>
                      <div className="mb-4">
                        <span className="text-5xl font-bold text-blue-600">{points}</span>
                        <span className="text-gray-500 ml-2">积分</span>
                      </div>
                      <div className="text-3xl font-bold text-gray-900 mb-3">
                        ${plan.price}
                      </div>
                      <p className="text-gray-600 mb-4">
                        {typeof plan.description === 'object' ? (plan.description.zh || plan.description.en || '') : plan.description}
                      </p>
                      <div className="text-sm text-gray-500 bg-gray-50 rounded-lg py-2">
                        {t('recharge.canGenerate')} <span className="font-bold text-gray-700">{Math.floor(points / 10)}</span> {t('recharge.images')}
                      </div>
                      <div className="text-xs text-gray-400 mt-2">
                        {t('recharge.unitPrice')} ${(plan.price / points * 10).toFixed(2)}{t('recharge.per')}
                      </div>
                    </div>
                    
                    {/* 选中标记 */}
                    {selectedPlan === plan.id && (
                      <div className="absolute top-4 right-4">
                        <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
            <div className="text-center py-12 bg-white rounded-2xl shadow-lg">
              <p className="text-gray-600">{t('recharge.noPlans')}</p>
            </div>
          )}

          {/* 功能说明 */}
          <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">{t('recharge.whySubscribe')}</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">{t('recharge.flexibleUsage')}</h3>
                <p className="text-sm text-gray-600">{t('recharge.flexibleUsageDesc')}</p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">{t('recharge.hdQuality')}</h3>
                <p className="text-sm text-gray-600">{t('recharge.hdQualityDesc')}</p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">{t('recharge.priorityProcessing')}</h3>
                <p className="text-sm text-gray-600">{t('recharge.priorityProcessingDesc')}</p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                  </svg>
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">{t('recharge.bulkDiscount')}</h3>
                <p className="text-sm text-gray-600">{t('recharge.bulkDiscount')}</p>
              </div>
            </div>
          </div>

          {/* 充值按钮 */}
          {plans.length > 0 && selectedPlan && (
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 mb-2">{t('recharge.selectedPlan', '已选择的套餐')}</p>
                  <div className="flex items-baseline">
                    <span className="text-2xl font-bold text-gray-900">
                      {(() => {
                        const plan = plans.find(p => p.id === selectedPlan);
                        if (!plan) return '';
                        return typeof plan.name === 'object' ? (plan.name.zh || plan.name.en || '') : plan.name;
                      })()}
                    </span>
                    <span className="ml-4 text-3xl font-bold text-blue-600">
                      ${plans.find(p => p.id === selectedPlan)?.price}
                    </span>
                  </div>
                </div>
                <button
                  onClick={handleRecharge}
                  disabled={loading || !selectedPlan}
                  className={`px-12 py-4 rounded-xl text-white font-bold text-lg transition-all ${
                    !loading && selectedPlan
                      ? 'bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 transform hover:scale-105 shadow-lg'
                      : 'bg-gray-400 cursor-not-allowed'
                  }`}
                >
                  {loading ? t('pointsShop.processing') : t('nav.subscribe')}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}