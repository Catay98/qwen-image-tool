'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import NavBar from '@/components/NavBar';
import { supabase } from '@/lib/supabase';
import { useTranslation } from 'react-i18next';

interface PaymentRecord {
  id: string;
  amount: number;
  currency?: string;
  payment_method?: string;
  payment_status: string;
  created_at: string;
  transaction_id?: string;
  payment_details?: any;
  subscription_id?: string;
  payment_type?: string; // 'subscription' or 'points'
  plan_name?: string;
  points_received?: number;
}

export default function BillingPage() {
  const { user } = useAuth();
  const router = useRouter();
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [subscriptionPayments, setSubscriptionPayments] = useState<PaymentRecord[]>([]);
  const [pointsPayments, setPointsPayments] = useState<PaymentRecord[]>([]);
  const [activeTab, setActiveTab] = useState<'subscription' | 'points'>('subscription');
  const [totalSpent, setTotalSpent] = useState(0);
  const [totalPoints, setTotalPoints] = useState(0);

  useEffect(() => {
    if (!user) {
      router.push('/');
      return;
    }
    fetchBillingHistory();
  }, [user, router]);

  const fetchBillingHistory = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      
      // 获取订阅支付记录
      const { data: subscriptionHistory, error: subError } = await supabase
        .from('payment_records')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      
      // 获取积分购买记录
      const { data: pointsPurchaseHistory, error: pointsError } = await supabase
        .from('points_purchase_records')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      
      console.log('Points purchase history:', pointsPurchaseHistory);
      console.log('Subscription history:', subscriptionHistory);
      
      if (subError) {
        console.error('Error fetching subscription history:', subError);
      }
      if (pointsError) {
        console.error('Error fetching points purchase history:', pointsError);
      }
      
      // 处理订阅记录
      const subscriptions: PaymentRecord[] = (subscriptionHistory || []).map(payment => ({
        ...payment,
        payment_type: 'subscription',
        plan_name: (payment.amount === 16.9) ? '月订阅' : 
                   (payment.amount === 118.8) ? '年订阅' : '订阅套餐',
        points_received: calculatePoints(payment.amount)
      }));
      
      // 处理积分购买记录
      const points: PaymentRecord[] = (pointsPurchaseHistory || []).map(purchase => {
        // 检查可能的金额字段名
        const purchaseAmount = purchase.amount || purchase.price || purchase.total_amount || purchase.payment_amount || 0;
        const purchasePoints = purchase.points || purchase.points_amount || calculatePoints(purchaseAmount);
        
        return {
          ...purchase,
          amount: purchaseAmount, // 确保有amount字段
          payment_type: 'points',
          plan_name: `${purchasePoints}积分包`,
          points_received: purchasePoints
        };
      });
      
      setSubscriptionPayments(subscriptions);
      setPointsPayments(points);
      
      console.log('Processed subscriptions:', subscriptions);
      console.log('Processed points:', points);
      
      // 计算总消费
      const totalSub = subscriptions.reduce((sum, p) => sum + (p.amount || 0), 0);
      const totalPointsAmount = points.reduce((sum, p) => sum + (p.amount || 0), 0);
      setTotalSpent(totalSub + totalPointsAmount);
      
      // 计算总积分
      const totalPointsReceived = [...subscriptions, ...points].reduce((sum, p) => {
        return sum + (p.points_received || 0);
      }, 0);
      setTotalPoints(totalPointsReceived);
      
    } catch (error) {
      console.error('Error fetching billing data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
      case 'success':
        return <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">{t('billing.paymentStatus.success')}</span>;
      case 'pending':
        return <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full">{t('billing.paymentStatus.pending')}</span>;
      case 'failed':
        return <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full">{t('billing.paymentStatus.failed')}</span>;
      case 'refunded':
        return <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full">{t('billing.paymentStatus.refunded')}</span>;
      default:
        return <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded-full">{status}</span>;
    }
  };
  
  // 根据金额计算积分
  const calculatePoints = (amount: number | undefined) => {
    if (!amount || isNaN(amount)) return 0;
    if (amount === 16.9) return 680;
    if (amount === 118.8) return 8000;
    if (amount <= 10) return 100;
    return Math.floor(amount * 40);
  };

  if (!user) {
    return null;
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <NavBar />
        
        <div className="mt-8">
          {/* 页面标题 */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{t('billing.title')}</h1>
            <p className="text-gray-600">{t('billing.subtitle')}</p>
          </div>

          {/* 统计卡片 */}
          <div className="grid md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">{t('billing.totalRecharge')}</p>
                  <p className="text-2xl font-bold text-gray-900">${totalSpent.toFixed(2)}</p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">{t('billing.subscriptionPayments')}</p>
                  <p className="text-2xl font-bold text-orange-600">{subscriptionPayments.length}</p>
                </div>
                <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">{t('billing.pointsPayments')}</p>
                  <p className="text-2xl font-bold text-purple-600">{pointsPayments.length}</p>
                </div>
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">{t('billing.pointsReceived')}</p>
                  <p className="text-2xl font-bold text-green-600">{totalPoints}</p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          {/* 支付记录表格 */}
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            {/* 标签页导航 */}
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">{t('billing.paymentRecords')}</h2>
              </div>
              <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setActiveTab('subscription')}
                  className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${
                    activeTab === 'subscription'
                      ? 'bg-white text-blue-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  📋 {t('billing.subscriptionRecords')} ({subscriptionPayments.length})
                </button>
                <button
                  onClick={() => setActiveTab('points')}
                  className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${
                    activeTab === 'points'
                      ? 'bg-white text-purple-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  💎 {t('billing.pointsRecords')} ({pointsPayments.length})
                </button>
              </div>
            </div>
            
            {loading ? (
              <div className="p-12 text-center">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                <p className="mt-4 text-gray-600">{t('common.loading')}</p>
              </div>
            ) : (
              <>
                {/* 订阅支付记录 */}
                {activeTab === 'subscription' && (
                  <>
                    {subscriptionPayments.length > 0 ? (
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                {t('billing.time')}
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                {t('billing.plan')}
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                {t('billing.amount')}
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                {t('billing.paymentMethod')}
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                {t('billing.status')}
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                {t('billing.transactionId')}
                              </th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-200">
                            {subscriptionPayments.map((payment) => (
                              <tr key={payment.id} className="hover:bg-gray-50">
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                  {formatDate(payment.created_at)}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                                    📋 {payment.plan_name}
                                  </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <span className="text-lg font-semibold text-gray-900">${(payment.amount || 0).toFixed(2)}</span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                  {payment.payment_method === 'stripe' ? 'Stripe' : 
                                   payment.payment_method === 'test' ? t('billing.test') : 
                                   payment.payment_method || t('billing.unknown')}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  {getStatusBadge(payment.payment_status)}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-500 font-mono">
                                  {payment.transaction_id ? 
                                    payment.transaction_id.slice(0, 12) + '...' : 
                                    '-'}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="p-12 text-center">
                        <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        <p className="text-gray-500 mb-4">{t('billing.noSubscriptionRecords')}</p>
                        <button
                          onClick={() => router.push('/pricing')}
                          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          {t('nav.subscribe')}
                        </button>
                      </div>
                    )}
                  </>
                )}

                {/* 积分支付记录 */}
                {activeTab === 'points' && (
                  <>
                    {pointsPayments.length > 0 ? (
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                {t('billing.time')}
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                {t('billing.package')}
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                {t('billing.amount')}
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                {t('billing.points')}
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                {t('billing.paymentMethod')}
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                {t('billing.status')}
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                {t('billing.transactionId')}
                              </th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-200">
                            {pointsPayments.map((payment) => (
                              <tr key={payment.id} className="hover:bg-gray-50">
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                  {formatDate(payment.created_at)}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-800">
                                    💎 {payment.plan_name}
                                  </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <span className="text-lg font-semibold text-gray-900">${(payment.amount || 0).toFixed(2)}</span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <span className="text-lg font-semibold text-purple-600">+{payment.points_received}</span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                  {payment.payment_method === 'stripe' ? 'Stripe' : 
                                   payment.payment_method === 'test' ? t('billing.test') : 
                                   payment.payment_method || t('billing.unknown')}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  {getStatusBadge(payment.payment_status)}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-500 font-mono">
                                  {payment.transaction_id ? 
                                    payment.transaction_id.slice(0, 12) + '...' : 
                                    '-'}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="p-12 text-center">
                        <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                        </svg>
                        <p className="text-gray-500 mb-4">{t('billing.noPointsRecords')}</p>
                        <button
                          onClick={() => router.push('/points-shop')}
                          className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                        >
                          {t('nav.pointsShop')}
                        </button>
                      </div>
                    )}
                  </>
                )}
              </>
            )}
          </div>

          {/* 操作按钮 */}
          <div className="mt-6 flex justify-center">
            <button
              onClick={() => router.push('/recharge')}
              className="px-8 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg font-medium hover:from-blue-600 hover:to-purple-700 transition-all transform hover:scale-105 shadow-lg"
            >
              {t('nav.recharge')}
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}