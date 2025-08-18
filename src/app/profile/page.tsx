"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import Image from "next/image";
import SubscriptionManagement from "@/components/SubscriptionManagement";
import { useTranslation } from 'react-i18next';

interface UserProfile {
  email: string;
  created_at: string;
}

interface SubscriptionInfo {
  has_subscription: boolean;
  subscription_type: string | null;
  end_date: string | null;
  free_uses_remaining: number;
}

interface PointsInfo {
  total_points: number;
  available_points: number;
  used_points: number;
  total_recharge: number;
}

interface UsageStats {
  today_uses: number;
  total_uses: number;
  last_use: string | null;
}

export default function ProfilePage() {
  const router = useRouter();
  const { user, signOut } = useAuth();
  const { t } = useTranslation();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [subscription, setSubscription] = useState<SubscriptionInfo | null>(
    null
  );
  const [points, setPoints] = useState<PointsInfo | null>(null);
  const [usage, setUsage] = useState<UsageStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    if (!user) {
      router.push("/?auth=signin");
      return;
    }
    fetchAllData();
  }, [user]);

  const fetchAllData = async () => {
    if (!user) return;

    setLoading(true);
    try {
      await Promise.all([
        fetchProfile(),
        fetchSubscription(),
        fetchPoints(),
        fetchUsage(),
      ]);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchProfile = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from("users")
      .select("email, created_at")
      .eq("id", user.id)
      .single();

    if (!error && data) {
      setProfile(data);
    } else {
      // 如果users表不存在或没有数据，使用auth信息
      setProfile({
        email: user.email || "",
        created_at: user.created_at || new Date().toISOString(),
      });
    }
  };

  const fetchSubscription = async () => {
    if (!user) return;

    // 获取订阅信息
    const { data: sub } = await supabase
      .from("subscriptions")
      .select("*")
      .eq("user_id", user.id)
      .eq("status", "active")
      .single();

    // 获取今日免费使用次数
    const today = new Date().toISOString().split("T")[0];
    const { data: usage } = await supabase
      .from("user_usage")
      .select("free_uses_remaining")
      .eq("user_id", user.id)
      .eq("date", today)
      .single();

    setSubscription({
      has_subscription: !!sub,
      subscription_type: sub?.plan_name || null,
      end_date: sub?.end_date || null,
      free_uses_remaining: usage?.free_uses_remaining ?? 10,
    });
  };

  const fetchPoints = async () => {
    if (!user) return;

    // 先尝试使用函数
    const { data, error } = await supabase.rpc("get_user_points_info", {
      p_user_id: user.id,
    });

    if (!error && data) {
      setPoints(data);
    } else {
      // 如果函数不存在，直接查询表
      const { data: pointsData } = await supabase
        .from("user_points")
        .select("total_points, available_points, used_points, total_recharge")
        .eq("user_id", user.id)
        .single();

      if (pointsData) {
        setPoints(pointsData);
      } else {
        setPoints({
          total_points: 0,
          available_points: 0,
          used_points: 0,
          total_recharge: 0,
        });
      }
    }
  };

  const fetchUsage = async () => {
    if (!user) return;

    const today = new Date().toISOString().split("T")[0];

    // 获取今日使用量
    const { data: todayData } = await supabase
      .from("user_usage")
      .select("total_uses, api_calls")
      .eq("user_id", user.id)
      .eq("date", today)
      .single();

    // 获取总使用量
    const { data: totalData } = await supabase
      .from("user_usage")
      .select("total_uses, updated_at")
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false });

    const totalUses =
      totalData?.reduce((sum, record) => sum + (record.total_uses || 0), 0) ||
      0;
    const lastUse = totalData?.[0]?.updated_at || null;

    setUsage({
      today_uses: todayData?.total_uses || 0,
      total_uses: totalUses,
      last_use: lastUse,
    });
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "—";
    return new Date(dateString).toLocaleDateString("zh-CN");
  };

  const formatDateTime = (dateString: string | null) => {
    if (!dateString) return "—";
    return new Date(dateString).toLocaleString("zh-CN");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">{t('profile.loading')}</p>
        </div>
      </div>
    );
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
              {t('profile.backToHome')}
            </button>
            <h1 className="text-xl font-semibold text-gray-900">{t('profile.title')}</h1>
            <button
              onClick={async () => {
                await signOut();
              }}
              className="text-red-600 hover:text-red-700 font-medium"
            >
              {t('profile.logout')}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 用户信息卡片 */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
          <div className="flex items-center">
            <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-2xl font-bold">
              {user?.email?.charAt(0).toUpperCase() || "U"}
            </div>
            <div className="ml-6 flex-1">
              <h2 className="text-2xl font-bold text-gray-900">
                {user?.email}
              </h2>
              <div className="flex items-center mt-2 space-x-4">
                {subscription?.has_subscription && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                    {subscription.subscription_type}
                  </span>
                )}
                <span className="text-gray-500 text-sm">
                  {t('profile.registeredAt')} {formatDate(profile?.created_at || "")}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* 选项卡 */}
        <div className="bg-white rounded-t-xl shadow-sm border-b">
          <div className="flex space-x-8 px-6">
            {["overview", "points", "usage", "subscription"].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`py-4 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                {tab === "overview" && t('profile.overview')}
                {tab === "points" && t('profile.points')}
                {tab === "usage" && t('profile.usage')}
                {tab === "subscription" && t('profile.subscription')}
              </button>
            ))}
          </div>
        </div>

        {/* 内容区域 */}
        <div className="bg-white rounded-b-xl shadow-lg p-6">
          {/* 概览 */}
          {activeTab === "overview" && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-blue-600 text-sm font-medium">
                      {t('profile.subscriptionStatus')}
                    </p>
                    <p className="text-2xl font-bold text-gray-900 mt-2">
                      {subscription?.has_subscription ? t('profile.active') : t('profile.notSubscribed')}
                    </p>
                    {subscription?.end_date && (
                      <p className="text-xs text-gray-600 mt-1">
                        {t('profile.until')} {formatDate(subscription.end_date)}
                      </p>
                    )}
                  </div>
                  <div className="w-12 h-12 bg-blue-500 bg-opacity-20 rounded-lg flex items-center justify-center">
                    <svg
                      className="w-6 h-6 text-blue-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-green-600 text-sm font-medium">
                      {t('profile.availablePoints')}
                    </p>
                    <p className="text-2xl font-bold text-gray-900 mt-2">
                      {points?.available_points || 0}
                    </p>
                    <p className="text-xs text-gray-600 mt-1">
                      {t('profile.total')} {points?.total_points || 0} {t('profile.points').toLowerCase()}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-green-500 bg-opacity-20 rounded-lg flex items-center justify-center">
                    <svg
                      className="w-6 h-6 text-green-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-purple-600 text-sm font-medium">
                      {t('profile.todayUsage')}
                    </p>
                    <p className="text-2xl font-bold text-gray-900 mt-2">
                      {usage?.today_uses || 0}
                    </p>
                    <p className="text-xs text-gray-600 mt-1">
                      {t('profile.total')} {usage?.total_uses || 0} {t('common.times')}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-purple-500 bg-opacity-20 rounded-lg flex items-center justify-center">
                    <svg
                      className="w-6 h-6 text-purple-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13 10V3L4 14h7v7l9-11h-7z"
                      />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-orange-600 text-sm font-medium">
                      {t('profile.totalRecharge')}
                    </p>
                    <p className="text-2xl font-bold text-gray-900 mt-2">
                      ${points?.total_recharge || 0}
                    </p>
                    <p className="text-xs text-gray-600 mt-1">{t('profile.historicalRecharge')}</p>
                  </div>
                  <div className="w-12 h-12 bg-orange-500 bg-opacity-20 rounded-lg flex items-center justify-center">
                    <svg
                      className="w-6 h-6 text-orange-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"
                      />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 积分详情 */}
          {activeTab === "points" && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                {t('profile.points')} Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <div className="bg-gray-50 rounded-lg p-4 mb-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-gray-600">Total {t('profile.points')}</span>
                      <span className="font-semibold">
                        {points?.total_points || 0}
                      </span>
                    </div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-gray-600">{t('profile.availablePoints')}</span>
                      <span className="font-semibold text-green-600">
                        {points?.available_points || 0}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Used {t('profile.points')}</span>
                      <span className="font-semibold text-gray-500">
                        {points?.used_points || 0}
                      </span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    {subscription?.has_subscription ? (
                      <button
                        onClick={() => router.push("/points-shop")}
                        className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        {t('nav.pointsShop')}
                      </button>
                    ) : (
                      <button
                        onClick={() => router.push("/recharge")}
                        className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                      >
                        {t('nav.subscribe')}
                      </button>
                    )}
                  </div>
                </div>
                <div>
                  <div className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-lg p-4">
                    <h4 className="font-medium text-gray-900 mb-2">
                      {t('subscriptionModal.pointsUsageNote')}
                    </h4>
                    <div className="text-sm text-gray-600 space-y-2">
                      <p>• 每次生成图片消耗 10 积分</p>
                      <p>• 充值可获得积分，可用于生成图片</p>
                      <p>• 充值后，积分立即生效</p>
                      <p>• 支持多次充值，积分累加</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 使用统计 */}
          {activeTab === "usage" && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                {t('profile.usage')}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-gray-600 text-sm">{t('profile.todayUsage')}</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">
                    {usage?.today_uses || 0}
                  </p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-gray-600 text-sm">Total Usage Count</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">
                    {usage?.total_uses || 0}
                  </p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-gray-600 text-sm">Last Use Time</p>
                  <p className="text-sm font-medium text-gray-900 mt-1">
                    {formatDateTime(usage?.last_use)}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* 订阅管理 */}
          {activeTab === "subscription" && <SubscriptionManagement />}
        </div>
      </div>
    </div>
  );
}
