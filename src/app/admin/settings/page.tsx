"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import AdminLayout from "@/components/AdminLayout";

interface SystemSettings {
  apiKey: string;
  apiUrl: string;
  model: string;
  imageSize: string;
  maxHistoryItems: number;
  enableGoogleAuth: boolean;
  enableEmailAuth: boolean;
}

export default function AdminSettings() {
  const router = useRouter();
  const [settings, setSettings] = useState<SystemSettings>({
    apiKey: "sk-lDX0Kbb9Wdz5BFLQPPE9Sa8QOGw5bVgDTpvZ9hOWpRBsFFI6",
    apiUrl: "https://api.302.ai/aliyun/api/v1/services/aigc/text2image/image-synthesis",
    model: "wan2.2-t2i-flash",
    imageSize: "1024*1024",
    maxHistoryItems: 20,
    enableGoogleAuth: true,
    enableEmailAuth: false,
  });
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    checkAuth();
    loadSettings();
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

  const loadSettings = () => {
    // 从localStorage或数据库加载设置
    const savedSettings = localStorage.getItem('systemSettings');
    if (savedSettings) {
      setSettings(JSON.parse(savedSettings));
    }
  };

  const handleSaveSettings = async () => {
    setIsSaving(true);
    try {
      // 保存到localStorage（实际应该保存到数据库）
      localStorage.setItem('systemSettings', JSON.stringify(settings));
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (error) {
      console.error("Failed to save settings:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleInputChange = (field: keyof SystemSettings, value: string | number | boolean) => {
    setSettings(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <AdminLayout>
      <div className="p-6">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800">系统设置</h1>
          {showSuccess && (
            <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
              设置已保存
            </div>
          )}
        </div>

        <div className="grid gap-6">
          {/* API设置 */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">API 设置</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  API 密钥
                </label>
                <input
                  type="password"
                  value={settings.apiKey}
                  onChange={(e) => handleInputChange('apiKey', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                  placeholder="sk-..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  API 地址
                </label>
                <input
                  type="text"
                  value={settings.apiUrl}
                  onChange={(e) => handleInputChange('apiUrl', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  模型
                </label>
                <select
                  value={settings.model}
                  onChange={(e) => handleInputChange('model', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                >
                  <option value="wan2.2-t2i-flash">wan2.2-t2i-flash (快速)</option>
                  <option value="wan2.2-t2i-standard">wan2.2-t2i-standard (标准)</option>
                  <option value="wan2.2-t2i-pro">wan2.2-t2i-pro (专业)</option>
                </select>
              </div>
            </div>
          </div>

          {/* 图片设置 */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">图片设置</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  图片尺寸
                </label>
                <select
                  value={settings.imageSize}
                  onChange={(e) => handleInputChange('imageSize', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                >
                  <option value="512*512">512x512 (小)</option>
                  <option value="768*768">768x768 (中)</option>
                  <option value="1024*1024">1024x1024 (大)</option>
                  <option value="1280*720">1280x720 (横屏)</option>
                  <option value="720*1280">720x1280 (竖屏)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  历史记录保存数量
                </label>
                <input
                  type="number"
                  value={settings.maxHistoryItems}
                  onChange={(e) => handleInputChange('maxHistoryItems', parseInt(e.target.value))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                  min="1"
                  max="100"
                />
              </div>
            </div>
          </div>

          {/* 认证设置 */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">认证设置</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <label className="font-medium text-gray-700">Google 登录</label>
                  <p className="text-sm text-gray-500">允许用户使用 Google 账号登录</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.enableGoogleAuth}
                    onChange={(e) => handleInputChange('enableGoogleAuth', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <label className="font-medium text-gray-700">邮箱登录</label>
                  <p className="text-sm text-gray-500">允许用户使用邮箱密码登录</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.enableEmailAuth}
                    onChange={(e) => handleInputChange('enableEmailAuth', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
            </div>
          </div>

          {/* 管理员设置 */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">管理员设置</h2>
            <div className="space-y-4">
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm text-yellow-800">
                  <strong>注意：</strong>修改管理员密码需要重新登录
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  管理员用户名
                </label>
                <input
                  type="text"
                  value="admin"
                  disabled
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 cursor-not-allowed"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  新密码（留空保持不变）
                </label>
                <input
                  type="password"
                  placeholder="输入新密码"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          {/* 保存按钮 */}
          <div className="flex justify-end">
            <button
              onClick={handleSaveSettings}
              disabled={isSaving}
              className={`px-6 py-3 rounded-lg font-medium transition-all ${
                isSaving
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:shadow-lg"
              }`}
            >
              {isSaving ? "保存中..." : "保存设置"}
            </button>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}