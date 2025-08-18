"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { useTranslation } from 'react-i18next';

interface PointsPackage {
  id: string;
  name: string;
  description: string;
  price: number;
  points: number;
  bonus_points: number;
  sort_order: number;
}

export default function PointsShopPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { t } = useTranslation();
  const [packages, setPackages] = useState<PointsPackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState<string | null>(null);
  const [hasSubscription, setHasSubscription] = useState(false);
  const [currentPoints, setCurrentPoints] = useState(0);

  useEffect(() => {
    if (!user) {
      router.push("/?auth=signin");
      return;
    }
    checkSubscriptionAndFetchData();
  }, [user]);

  const checkSubscriptionAndFetchData = async () => {
    if (!user) return;

    try {
      // 检查订阅状态（不再限制必须有订阅才能购买积分）
      const { data: subscription } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .single();

      setHasSubscription(!!subscription);

      // 获取当前积分
      const { data: userPoints } = await supabase
        .from('user_points')
        .select('available_points')
        .eq('user_id', user.id)
        .single();

      setCurrentPoints(userPoints?.available_points || 0);

      // 获取积分包列表
      const { data: packagesData, error } = await supabase
        .from('points_packages')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true });

      if (!error && packagesData) {
        setPackages(packagesData);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePurchase = async (packageItem: PointsPackage) => {
    if (!user || purchasing) return;

    setPurchasing(packageItem.id);

    try {
      const response = await fetch('/api/points/purchase', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user.id,
        },
        body: JSON.stringify({
          packageId: packageItem.id,
        }),
      });

      const data = await response.json();

      if (response.ok && data.url) {
        // 跳转到Stripe支付页面
        window.location.href = data.url;
      } else {
        alert(data.error || t('pointsShop.createPaymentFailed'));
      }
    } catch (error) {
      console.error('Purchase error:', error);
      alert(t('pointsShop.purchaseFailed'));
    } finally {
      setPurchasing(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">{t('pointsShop.loading')}</p>
        </div>
      </div>
    );
  }

  if (!hasSubscription) {
    return null; // 会被重定向
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* 顶部导航 */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <button
              onClick={() => router.push("/")}
              className="flex items-center text-gray-700 hover:text-gray-900"
            >
              <svg
                className="w-5 h-5 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 19l-7-7m0 0l7-7m-7 7h18"
                />
              </svg>
              {t('pointsShop.backToHome')}
            </button>
            <h1 className="text-xl font-semibold text-gray-900">{t('pointsShop.title')}</h1>
            <div className="text-right">
              <p className="text-sm text-gray-600">{t('pointsShop.currentPoints')}</p>
              <p className="text-lg font-bold text-blue-600">{currentPoints}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 说明 */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-800">{t('subscriptionModal.pointsUsageNote')}</h3>
              <p className="mt-1 text-sm text-blue-700">
                {t('pointsShop.pointsUsageNote')}
              </p>
            </div>
          </div>
        </div>

        {/* 积分包列表 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {packages.map((pkg) => {
            const totalPoints = pkg.points + (pkg.bonus_points || 0);
            const unitPrice = (pkg.price / totalPoints * 10).toFixed(2);
            const hasBonus = pkg.bonus_points > 0;

            return (
              <div
                key={pkg.id}
                className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow"
              >
                <div className="p-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    {pkg.name}
                  </h3>
                  
                  {hasBonus && (
                    <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 mb-3">
                      {t('pointsShop.bonus')} {pkg.bonus_points} {t('pointsShop.points')}
                    </div>
                  )}

                  <div className="mb-4">
                    <p className="text-3xl font-bold text-gray-900">
                      {totalPoints}
                      <span className="text-sm font-normal text-gray-600 ml-1">{t('pointsShop.points')}</span>
                    </p>
                    {hasBonus && (
                      <p className="text-sm text-gray-600 mt-1">
                        {pkg.points} + {pkg.bonus_points} {t('pointsShop.bonus')}
                      </p>
                    )}
                  </div>

                  <p className="text-gray-600 text-sm mb-4">
                    {pkg.description || t('pointsShop.canGenerate', { count: Math.floor(totalPoints / 10) })}
                  </p>

                  <div className="border-t pt-4">
                    <div className="flex justify-between items-center mb-4">
                      <div>
                        <p className="text-2xl font-bold text-gray-900">
                          ${pkg.price}
                        </p>
                        <p className="text-xs text-gray-500">
                          {t('pointsShop.unitPrice')} ${unitPrice}{t('pointsShop.per')}
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => handlePurchase(pkg)}
                      disabled={purchasing === pkg.id}
                      className={`w-full py-3 px-4 rounded-lg font-medium transition-colors ${
                        purchasing === pkg.id
                          ? 'bg-gray-400 text-white cursor-not-allowed'
                          : 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700'
                      }`}
                    >
                      {purchasing === pkg.id ? (
                        <span className="flex items-center justify-center">
                          <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          {t('pointsShop.processing')}
                        </span>
                      ) : t('pointsShop.buyNow')}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* 购买历史链接 */}
        <div className="mt-8 text-center">
          <button
            onClick={() => router.push('/billing')}
            className="text-blue-600 hover:text-blue-700 font-medium"
          >
            {t('pointsShop.viewHistory')} →
          </button>
        </div>
      </div>
    </div>
  );
}