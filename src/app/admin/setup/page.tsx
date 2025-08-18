"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminSetup() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [sqlScript, setSqlScript] = useState("");

  const handleInit = async () => {
    setIsLoading(true);
    setMessage("");
    setSqlScript("");

    try {
      const response = await fetch("/api/admin/init");
      const data = await response.json();
      
      if (data.success) {
        setMessage(`✅ ${data.message}\n\n用户名: ${data.credentials.username}\n密码: ${data.credentials.password}`);
        setTimeout(() => {
          router.push("/admin/login");
        }, 3000);
      } else {
        setMessage(`❌ ${data.message}`);
        if (data.sql) {
          setSqlScript(data.sql);
        }
      }
    } catch (error) {
      setMessage("初始化失败，请查看控制台");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 flex items-center justify-center px-4">
      <div className="max-w-2xl w-full">
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full mb-4">
              <span className="text-2xl">⚙️</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-800">管理员初始化</h1>
            <p className="text-gray-600 mt-2">初始化管理员表和默认账号</p>
          </div>

          <div className="space-y-6">
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-sm text-yellow-800">
                <strong>说明：</strong>此页面用于初始化管理员系统。
              </p>
              <ul className="mt-2 text-sm text-yellow-700 list-disc list-inside">
                <li>如果表不存在，会显示SQL脚本</li>
                <li>如果表存在但无数据，会创建默认管理员</li>
                <li>如果管理员已存在，会重置密码</li>
              </ul>
            </div>

            <button
              onClick={handleInit}
              disabled={isLoading}
              className={`w-full py-3 px-4 rounded-lg font-medium transition-all ${
                isLoading
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:shadow-lg"
              }`}
            >
              {isLoading ? "初始化中..." : "开始初始化"}
            </button>

            {message && (
              <div className={`p-4 rounded-lg ${
                message.includes("✅") ? "bg-green-50 text-green-800" : "bg-red-50 text-red-800"
              }`}>
                <pre className="whitespace-pre-wrap text-sm">{message}</pre>
              </div>
            )}

            {sqlScript && (
              <div className="bg-gray-100 rounded-lg p-4">
                <h3 className="font-semibold mb-2">请在Supabase SQL Editor执行以下脚本：</h3>
                <pre className="bg-white p-4 rounded overflow-x-auto text-xs">
                  {sqlScript}
                </pre>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(sqlScript);
                    alert("SQL脚本已复制到剪贴板");
                  }}
                  className="mt-3 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  复制SQL脚本
                </button>
              </div>
            )}

            <div className="flex justify-center space-x-4 pt-4">
              <button
                onClick={() => router.push("/admin/login")}
                className="text-sm text-gray-600 hover:text-blue-600"
              >
                返回登录
              </button>
              <a
                href="https://app.supabase.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                打开Supabase
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}