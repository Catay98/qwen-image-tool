'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import AdminLayout from '@/components/AdminLayout';

export default function AdminInitPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const initializePlans = async () => {
    setLoading(true);
    setMessage('');
    setError('');

    try {
      const response = await fetch('/api/admin/init-plans', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (response.ok) {
        setMessage('套餐初始化成功！已创建：\n' + 
          data.plans.map((p: any) => `${p.name}: $${p.price}/月`).join('\n'));
      } else {
        setError(data.error || '初始化失败');
      }
    } catch (err) {
      setError('网络错误，请重试');
    } finally {
      setLoading(false);
    }
  };

  const testStripe = async () => {
    const hasKey = !!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
    if (hasKey) {
      setMessage('Stripe配置已找到');
    } else {
      setError('Stripe配置未找到，请检查环境变量');
    }
  };

  return (
    <AdminLayout>
      <div className="p-6">
        <h1 className="text-3xl font-bold mb-8">系统初始化</h1>

        <div className="space-y-6">
          {/* 初始化套餐 */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-semibold mb-4">初始化订阅套餐</h2>
            <p className="text-gray-600 mb-4">
              点击下面的按钮将创建默认的订阅套餐（基础版、专业版、高级版）
            </p>
            <button
              onClick={initializePlans}
              disabled={loading}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50"
            >
              {loading ? '初始化中...' : '初始化套餐'}
            </button>
          </div>

          {/* Stripe配置检查 */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Stripe配置检查</h2>
            <p className="text-gray-600 mb-4">
              检查Stripe密钥是否已正确配置
            </p>
            <button
              onClick={testStripe}
              className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors"
            >
              检查配置
            </button>
            
            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600">当前配置：</p>
              <p className="text-xs font-mono mt-2">
                STRIPE_SECRET_KEY: {process.env.STRIPE_SECRET_KEY ? '已配置' : '未配置'}
              </p>
              <p className="text-xs font-mono">
                NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: {process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ? '已配置' : '未配置'}
              </p>
            </div>
          </div>

          {/* 消息显示 */}
          {message && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-green-700 whitespace-pre-line">{message}</p>
            </div>
          )}

          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-700">{error}</p>
            </div>
          )}

          <div className="mt-8">
            <button
              onClick={() => router.push('/admin/billing')}
              className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 mr-4"
            >
              前往账单管理
            </button>
            <button
              onClick={() => router.push('/admin/dashboard')}
              className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
            >
              返回仪表板
            </button>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}