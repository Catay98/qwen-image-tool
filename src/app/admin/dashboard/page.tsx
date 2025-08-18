"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import AdminLayout from "@/components/AdminLayout";

interface DashboardStats {
  totalUsers: number;
  totalImages: number;
  todayImages: number;
  activeUsers: number;
  totalSubscriptions: number;
  activeSubscriptions: number;
  todayRevenue: number;
  monthlyRevenue: number;
  totalPoints: number;
  pointsConsumedToday: number;
  freeUsersToday: number;
  paidUsersToday: number;
  avgImagesPerUser: number;
  conversionRate: number;
}

interface RecentImage {
  id: string;
  prompt: string;
  image_url: string;
  created_at: string;
  user_email?: string;
}

export default function AdminDashboard() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    totalImages: 0,
    todayImages: 0,
    activeUsers: 0,
    totalSubscriptions: 0,
    activeSubscriptions: 0,
    todayRevenue: 0,
    monthlyRevenue: 0,
    totalPoints: 0,
    pointsConsumedToday: 0,
    freeUsersToday: 0,
    paidUsersToday: 0,
    avgImagesPerUser: 0,
    conversionRate: 0,
  });
  const [recentImages, setRecentImages] = useState<RecentImage[]>([]);

  useEffect(() => {
    checkAuth();
    loadDashboardData();
  }, []);

  const checkAuth = async () => {
    try {
      const response = await fetch("/api/admin/verify");
      if (!response.ok) {
        router.push("/admin/login");
      }
    } catch (error) {
      console.error("Auth check error:", error);
      router.push("/admin/login");
    }
  };

  const loadDashboardData = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/admin/stats');
      const data = await response.json();
      
      if (data.stats) {
        setStats(data.stats);
      }
      
      if (data.recentImages) {
        setRecentImages(data.recentImages);
      }
    } catch (error) {
      console.error("Failed to load dashboard data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AdminLayout>
      <div className="p-6">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-slate-900">仪表板</h1>
          <button
            onClick={loadDashboardData}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            刷新数据
          </button>
        </div>

        {/* 统计卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-lg p-6 border border-slate-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-600 text-sm font-medium">总用户数</p>
                <p className="text-2xl font-bold text-slate-900 mt-2">
                  {stats.totalUsers}
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-500 bg-opacity-10 rounded-lg flex items-center justify-center">
                <span className="text-2xl">👥</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 border border-slate-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-600 text-sm font-medium">总生成图片</p>
                <p className="text-2xl font-bold text-slate-900 mt-2">
                  {stats.totalImages}
                </p>
              </div>
              <div className="w-12 h-12 bg-green-500 bg-opacity-10 rounded-lg flex items-center justify-center">
                <span className="text-2xl">🎨</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 border border-slate-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-600 text-sm font-medium">今日生成</p>
                <p className="text-2xl font-bold text-slate-900 mt-2">
                  {stats.todayImages}
                </p>
              </div>
              <div className="w-12 h-12 bg-purple-500 bg-opacity-10 rounded-lg flex items-center justify-center">
                <span className="text-2xl">📈</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 border border-slate-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-600 text-sm font-medium">活跃用户</p>
                <p className="text-2xl font-bold text-gray-800 mt-2">
                  {stats.activeUsers}
                </p>
              </div>
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <span className="text-2xl">⚡</span>
              </div>
            </div>
          </div>
        </div>

        {/* 积分和转化统计 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">总积分消耗</p>
                <p className="text-2xl font-bold text-gray-800 mt-2">
                  {stats.totalPoints}
                </p>
              </div>
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <span className="text-2xl">🎆</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">今日积分消耗</p>
                <p className="text-2xl font-bold text-gray-800 mt-2">
                  {stats.pointsConsumedToday}
                </p>
              </div>
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                <span className="text-2xl">🔥</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">人均生成量</p>
                <p className="text-2xl font-bold text-gray-800 mt-2">
                  {stats.avgImagesPerUser.toFixed(1)}
                </p>
              </div>
              <div className="w-12 h-12 bg-teal-100 rounded-lg flex items-center justify-center">
                <span className="text-2xl">📈</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">付费转化率</p>
                <p className="text-2xl font-bold text-gray-800 mt-2">
                  {stats.conversionRate.toFixed(1)}%
                </p>
              </div>
              <div className="w-12 h-12 bg-cyan-100 rounded-lg flex items-center justify-center">
                <span className="text-2xl">🎯</span>
              </div>
            </div>
          </div>
        </div>

        {/* 订阅统计 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">总订阅数</p>
                <p className="text-2xl font-bold text-gray-800 mt-2">
                  {stats.totalSubscriptions}
                </p>
              </div>
              <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center">
                <span className="text-2xl">📊</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">活跃订阅</p>
                <p className="text-2xl font-bold text-gray-800 mt-2">
                  {stats.activeSubscriptions}
                </p>
              </div>
              <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center">
                <span className="text-2xl">✅</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">今日收入</p>
                <p className="text-2xl font-bold text-gray-800 mt-2">
                  ${stats.todayRevenue.toFixed(2)}
                </p>
              </div>
              <div className="w-12 h-12 bg-rose-100 rounded-lg flex items-center justify-center">
                <span className="text-2xl">💰</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">本月收入</p>
                <p className="text-2xl font-bold text-gray-800 mt-2">
                  ${stats.monthlyRevenue.toFixed(2)}
                </p>
              </div>
              <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center">
                <span className="text-2xl">📈</span>
              </div>
            </div>
          </div>
        </div>

        {/* 最近生成的图片 */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">最近生成的图片</h2>
          {isLoading ? (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            </div>
          ) : recentImages.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {recentImages.map((image) => (
                <div key={image.id} className="group cursor-pointer">
                  <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
                    <img
                      src={image.image_url}
                      alt={image.prompt}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform"
                    />
                  </div>
                  <p className="text-xs text-gray-600 mt-2 truncate">
                    {image.prompt}
                  </p>
                  <p className="text-xs text-gray-400">
                    {new Date(image.created_at).toLocaleDateString()}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-400">
              暂无图片数据
            </div>
          )}
        </div>

        {/* 快捷操作 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-8">
          <button
            onClick={() => router.push("/admin/users")}
            className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow"
          >
            <div className="flex items-center">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mr-4">
                <span className="text-2xl">👤</span>
              </div>
              <div className="text-left">
                <h3 className="font-semibold text-gray-800">用户管理</h3>
                <p className="text-sm text-gray-500">查看和管理所有用户</p>
              </div>
            </div>
          </button>

          <button
            onClick={() => router.push("/admin/images")}
            className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow"
          >
            <div className="flex items-center">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mr-4">
                <span className="text-2xl">🖼️</span>
              </div>
              <div className="text-left">
                <h3 className="font-semibold text-gray-800">图片管理</h3>
                <p className="text-sm text-gray-500">管理所有生成的图片</p>
              </div>
            </div>
          </button>

          <button
            onClick={() => router.push("/admin/subscriptions")}
            className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow"
          >
            <div className="flex items-center">
              <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center mr-4">
                <span className="text-2xl">💳</span>
              </div>
              <div className="text-left">
                <h3 className="font-semibold text-gray-800">订阅管理</h3>
                <p className="text-sm text-gray-500">管理订阅计划和价格</p>
              </div>
            </div>
          </button>

          <button
            onClick={() => router.push("/admin/settings")}
            className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow"
          >
            <div className="flex items-center">
              <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center mr-4">
                <span className="text-2xl">⚙️</span>
              </div>
              <div className="text-left">
                <h3 className="font-semibold text-gray-800">系统设置</h3>
                <p className="text-sm text-gray-500">配置API和系统参数</p>
              </div>
            </div>
          </button>
        </div>
      </div>
    </AdminLayout>
  );
}