"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";

interface AdminLayoutProps {
  children: React.ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  
  useEffect(() => {
    // 设置浏览器标题
    document.title = "Qwen管理后台";
  }, []);

  const handleLogout = async () => {
    try {
      await fetch("/api/admin/logout", { method: "POST" });
      router.push("/admin/login");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const menuItems = [
    { path: "/admin/dashboard", label: "仪表板", icon: "📊" },
    { path: "/admin/users", label: "用户管理", icon: "👥" },
    { path: "/admin/images", label: "图片管理", icon: "🖼️" },
    { path: "/admin/plans", label: "套餐管理", icon: "📦" },
    { path: "/admin/billing", label: "账单管理", icon: "💰" },
    { path: "/admin/subscriptions", label: "订阅管理", icon: "💳" },
    { path: "/admin/cancel-subscription", label: "取消订阅", icon: "🚫" },
    { path: "/admin/stripe-records", label: "Stripe记录", icon: "💎" },
    { path: "/admin/usage", label: "使用统计", icon: "📈" },
    { path: "/admin/settings", label: "系统设置", icon: "⚙️" },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      {/* 顶部导航栏 - 深色背景提高对比度 */}
      <nav className="bg-gradient-to-r from-slate-900 to-slate-800 shadow-xl">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <button
                onClick={() => setShowMobileMenu(!showMobileMenu)}
                className="lg:hidden p-2 rounded-md text-slate-300 hover:text-white hover:bg-slate-700 transition-colors"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
              <div className="flex items-center ml-4">
                <span className="text-2xl mr-2">🔐</span>
                <span className="text-xl font-bold text-white">
                  Qwen管理后台
                </span>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-slate-300 font-medium">管理员</span>
              <button
                onClick={handleLogout}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all hover:shadow-lg font-medium"
              >
                退出登录
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="flex">
        {/* 侧边栏 - 深色背景 */}
        <aside className="hidden lg:block w-64 bg-slate-800 shadow-2xl min-h-screen">
          <nav className="mt-5 px-3">
            {menuItems.map((item) => (
              <button
                key={item.path}
                onClick={() => router.push(item.path)}
                className={`group flex items-center w-full px-4 py-3 text-sm font-medium rounded-lg mb-2 transition-all text-left ${
                  pathname === item.path
                    ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg"
                    : "text-slate-300 hover:bg-slate-700 hover:text-white"
                }`}
              >
                <span className="mr-3 text-lg">{item.icon}</span>
                {item.label}
              </button>
            ))}
          </nav>
        </aside>

        {/* 移动端菜单 */}
        {showMobileMenu && (
          <div className="lg:hidden fixed inset-0 z-40 flex">
            <div className="fixed inset-0 bg-black bg-opacity-50" onClick={() => setShowMobileMenu(false)}></div>
            <div className="relative flex-1 flex flex-col max-w-xs w-full bg-slate-800">
              <div className="flex-1 h-0 pt-5 pb-4 overflow-y-auto">
                <nav className="mt-5 px-3 space-y-1">
                  {menuItems.map((item) => (
                    <button
                      key={item.path}
                      onClick={() => {
                        router.push(item.path);
                        setShowMobileMenu(false);
                      }}
                      className={`group flex items-center w-full px-4 py-3 text-sm font-medium rounded-lg mb-2 text-left ${
                        pathname === item.path
                          ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg"
                          : "text-slate-300 hover:bg-slate-700 hover:text-white"
                      }`}
                    >
                      <span className="mr-3 text-lg">{item.icon}</span>
                      {item.label}
                    </button>
                  ))}
                </nav>
              </div>
            </div>
          </div>
        )}

        {/* 主内容区域 */}
        <main className="flex-1">
          {children}
        </main>
      </div>
    </div>
  );
}