"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminLogin() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (data.success) {
        router.push("/admin/dashboard");
      } else {
        setError(data.message || "登录失败");
        // 如果返回了SQL脚本，在控制台显示
        if (data.sql) {
          console.log("请在Supabase SQL Editor中执行以下脚本：");
          console.log(data.sql);
        }
      }
    } catch (err) {
      setError("登录失败，请重试");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full mb-4">
              <span className="text-2xl">🔐</span>
            </div>
            <h1 className="text-2xl font-bold text-slate-900">管理员登录</h1>
            <p className="text-slate-700 mt-2 font-medium">请输入管理员账号密码</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                用户名
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-4 py-3 border-2 border-slate-300 rounded-lg focus:outline-none focus:border-blue-500 transition-all text-slate-900 bg-white font-medium"
                placeholder="请输入用户名"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                密码
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 border-2 border-slate-300 rounded-lg focus:outline-none focus:border-blue-500 transition-all text-slate-900 bg-white font-medium"
                placeholder="请输入密码"
                required
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className={`w-full py-3 px-4 rounded-lg font-medium transition-all ${
                isLoading
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:shadow-lg transform hover:scale-105"
              }`}
            >
              {isLoading ? "登录中..." : "登录"}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => router.push('/')}
              className="text-sm text-gray-600 hover:text-blue-600 transition-colors"
            >
              ← 返回首页
            </button>
          </div>

          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            <p className="text-xs text-gray-500 text-center">
              默认账号：admin / 密码：admin
            </p>
            <button
              type="button"
              onClick={async () => {
                try {
                  const response = await fetch('/api/admin/init');
                  const data = await response.json();
                  if (data.success) {
                    alert(`初始化成功！\n用户名: ${data.credentials.username}\n密码: ${data.credentials.password}`);
                  } else {
                    if (data.sql) {
                      console.log('请执行以下SQL：', data.sql);
                      alert(`${data.message}\n\n请查看控制台获取SQL脚本`);
                    } else {
                      alert(data.message || '初始化失败');
                    }
                  }
                } catch (err) {
                  alert('初始化失败');
                  console.error(err);
                }
              }}
              className="mt-2 text-xs text-blue-600 hover:text-blue-800 underline"
            >
              初始化管理员账号
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
