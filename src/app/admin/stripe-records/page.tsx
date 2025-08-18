'use client';

import { useState } from 'react';
import AdminLayout from '@/components/AdminLayout';

export default function AdminStripeRecordsPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [records, setRecords] = useState<any>(null);
  const [result, setResult] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'subscriptions' | 'customers' | 'charges' | 'payments'>('subscriptions');

  // 查询Stripe记录
  const searchStripeRecords = async () => {
    if (!email) {
      alert('请输入用户邮箱');
      return;
    }
    
    setLoading(true);
    setResult(null);
    
    try {
      const response = await fetch('/api/admin/stripe-records', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email })
      });

      const data = await response.json();
      
      if (response.ok) {
        setRecords(data);
        
        // 生成统计信息
        const totalCustomers = data.customers?.length || 0;
        const totalSubscriptions = data.subscriptions?.length || 0;
        const activeSubscriptions = data.subscriptions?.filter((s: any) => 
          s.status === 'active' || s.status === 'trialing'
        ).length || 0;
        const totalRevenue = data.charges?.reduce((sum: number, charge: any) => 
          charge.status === 'succeeded' ? sum + charge.amount : sum, 0
        ) || 0;
        
        setResult({ 
          success: true, 
          message: `找到 ${totalCustomers} 个客户，${totalSubscriptions} 个订阅（${activeSubscriptions} 个活跃），总收入 $${totalRevenue.toFixed(2)}`
        });
      } else {
        setResult({ error: '查询失败', details: data });
      }
    } catch (error) {
      setResult({ error: '查询失败', details: error });
    }
    
    setLoading(false);
  };

  // 取消特定订阅
  const cancelSubscription = async (subscriptionId: string) => {
    if (!confirm(`确定要取消订阅 ${subscriptionId} 吗？`)) {
      return;
    }

    setLoading(true);
    
    try {
      const response = await fetch('/api/admin/stripe-cancel-subscription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ subscriptionId })
      });

      const data = await response.json();
      
      if (response.ok) {
        setResult({ 
          success: true, 
          message: `订阅 ${subscriptionId} 已成功取消`
        });
        
        // 重新查询以更新列表
        await searchStripeRecords();
      } else {
        setResult({ error: '取消失败', details: data });
      }
    } catch (error) {
      setResult({ error: '取消失败', details: error });
    }
    
    setLoading(false);
  };

  // 取消所有活跃订阅
  const cancelAllActiveSubscriptions = async () => {
    const activeSubscriptions = records?.subscriptions?.filter((s: any) => 
      s.status === 'active' || s.status === 'trialing'
    ) || [];

    if (activeSubscriptions.length === 0) {
      alert('没有活跃的订阅需要取消');
      return;
    }

    if (!confirm(`确定要取消 ${email} 的所有 ${activeSubscriptions.length} 个活跃订阅吗？`)) {
      return;
    }

    setLoading(true);
    
    try {
      const response = await fetch('/api/admin/stripe-force-cancel', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email })
      });

      const data = await response.json();
      
      if (response.ok) {
        const cancelledCount = data.summary?.subscriptions_cancelled || 0;
        setResult({ 
          success: true, 
          message: cancelledCount > 0 
            ? `成功取消了 ${cancelledCount} 个订阅`
            : '所有订阅已经是取消状态'
        });
        
        // 重新查询以更新列表
        await searchStripeRecords();
      } else {
        setResult({ error: '批量取消失败', details: data });
      }
    } catch (error) {
      setResult({ error: '批量取消失败', details: error });
    }
    
    setLoading(false);
  };

  // 删除Stripe客户
  const deleteCustomer = async (customerId: string) => {
    if (!confirm(`确定要删除客户 ${customerId} 吗？这将删除所有相关数据且不可恢复！`)) {
      return;
    }

    setLoading(true);
    
    try {
      const response = await fetch('/api/admin/stripe-delete-customer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ customerId })
      });

      const data = await response.json();
      
      if (response.ok) {
        setResult({ 
          success: true, 
          message: `客户 ${customerId} 已成功删除`
        });
        
        // 重新查询以更新列表
        await searchStripeRecords();
      } else {
        setResult({ error: '删除失败', details: data });
      }
    } catch (error) {
      setResult({ error: '删除失败', details: error });
    }
    
    setLoading(false);
  };

  // 格式化日期
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // 格式化金额
  const formatAmount = (amount: number, currency: string = 'usd') => {
    return new Intl.NumberFormat('zh-CN', {
      style: 'currency',
      currency: currency.toUpperCase(),
      minimumFractionDigits: 2
    }).format(amount);
  };

  return (
    <AdminLayout>
      <div className="p-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-4xl font-bold mb-8 text-gray-900">Stripe记录管理</h1>

          {/* 搜索栏 */}
          <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
            <div className="flex space-x-4">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="输入用户邮箱查询Stripe记录"
                className="flex-1 px-4 py-3 text-lg border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                onKeyPress={(e) => e.key === 'Enter' && searchStripeRecords()}
              />
              <button
                onClick={searchStripeRecords}
                disabled={loading}
                className="px-8 py-3 bg-blue-600 text-white text-lg font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? '查询中...' : '查询记录'}
              </button>
            </div>
          </div>

          {/* 操作结果 */}
          {result && (
            <div className={`rounded-lg shadow-lg p-5 mb-6 ${
              result.success ? 'bg-green-50 border-2 border-green-300' : 'bg-red-50 border-2 border-red-300'
            }`}>
              <p className={`text-lg font-semibold ${result.success ? 'text-green-800' : 'text-red-800'}`}>
                {result.success ? '✅' : '❌'} {result.message || result.error}
              </p>
              {result.details && (
                <details className="mt-3">
                  <summary className="cursor-pointer text-gray-700 font-medium">查看详情</summary>
                  <pre className="mt-3 text-sm bg-white p-4 rounded border overflow-auto max-h-96">
                    {JSON.stringify(result.details, null, 2)}
                  </pre>
                </details>
              )}
            </div>
          )}

          {/* Stripe记录 */}
          {records && (
            <>
              {/* 统计卡片 */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
                <div className="bg-white rounded-lg shadow-lg p-6">
                  <div className="text-gray-600 text-sm font-medium">客户数量</div>
                  <div className="text-3xl font-bold text-gray-900 mt-2">
                    {records.customers?.length || 0}
                  </div>
                </div>
                <div className="bg-white rounded-lg shadow-lg p-6">
                  <div className="text-gray-600 text-sm font-medium">总订阅数</div>
                  <div className="text-3xl font-bold text-gray-900 mt-2">
                    {records.subscriptions?.length || 0}
                  </div>
                </div>
                <div className="bg-white rounded-lg shadow-lg p-6">
                  <div className="text-gray-600 text-sm font-medium">活跃订阅</div>
                  <div className="text-3xl font-bold text-green-600 mt-2">
                    {records.subscriptions?.filter((s: any) => s.status === 'active' || s.status === 'trialing').length || 0}
                  </div>
                </div>
                <div className="bg-white rounded-lg shadow-lg p-6">
                  <div className="text-gray-600 text-sm font-medium">总收入</div>
                  <div className="text-3xl font-bold text-blue-600 mt-2">
                    ${(records.charges?.reduce((sum: number, charge: any) => 
                      charge.status === 'succeeded' ? sum + charge.amount : sum, 0
                    ) || 0).toFixed(2)}
                  </div>
                </div>
              </div>

              {/* 批量操作 */}
              {records.subscriptions?.some((s: any) => s.status === 'active' || s.status === 'trialing') && (
                <div className="bg-yellow-50 border-2 border-yellow-300 rounded-lg p-5 mb-6">
                  <div className="flex items-center justify-between">
                    <p className="text-yellow-900 font-semibold text-lg">
                      ⚠️ 发现 {records.subscriptions.filter((s: any) => s.status === 'active' || s.status === 'trialing').length} 个活跃订阅
                    </p>
                    <button
                      onClick={cancelAllActiveSubscriptions}
                      disabled={loading}
                      className="px-6 py-3 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 disabled:opacity-50"
                    >
                      取消所有活跃订阅
                    </button>
                  </div>
                </div>
              )}

              {/* 标签页 */}
              <div className="bg-white rounded-lg shadow-lg mb-6">
                <div className="flex border-b">
                  <button
                    onClick={() => setActiveTab('subscriptions')}
                    className={`px-6 py-4 font-semibold text-lg ${
                      activeTab === 'subscriptions' 
                        ? 'text-blue-600 border-b-3 border-blue-600 bg-blue-50' 
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    订阅记录 ({records.subscriptions?.length || 0})
                  </button>
                  <button
                    onClick={() => setActiveTab('customers')}
                    className={`px-6 py-4 font-semibold text-lg ${
                      activeTab === 'customers' 
                        ? 'text-blue-600 border-b-3 border-blue-600 bg-blue-50' 
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    客户记录 ({records.customers?.length || 0})
                  </button>
                  <button
                    onClick={() => setActiveTab('charges')}
                    className={`px-6 py-4 font-semibold text-lg ${
                      activeTab === 'charges' 
                        ? 'text-blue-600 border-b-3 border-blue-600 bg-blue-50' 
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    充值记录 ({records.charges?.length || 0})
                  </button>
                  <button
                    onClick={() => setActiveTab('payments')}
                    className={`px-6 py-4 font-semibold text-lg ${
                      activeTab === 'payments' 
                        ? 'text-blue-600 border-b-3 border-blue-600 bg-blue-50' 
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    支付会话 ({records.payments?.length || 0})
                  </button>
                </div>

                <div className="p-6">
                  {/* 订阅记录 */}
                  {activeTab === 'subscriptions' && (
                    <div className="overflow-x-auto">
                      <table className="min-w-full">
                        <thead>
                          <tr className="bg-gray-100">
                            <th className="px-4 py-3 text-left text-sm font-bold text-gray-900">订阅ID</th>
                            <th className="px-4 py-3 text-left text-sm font-bold text-gray-900">产品名称</th>
                            <th className="px-4 py-3 text-left text-sm font-bold text-gray-900">金额</th>
                            <th className="px-4 py-3 text-left text-sm font-bold text-gray-900">周期</th>
                            <th className="px-4 py-3 text-left text-sm font-bold text-gray-900">状态</th>
                            <th className="px-4 py-3 text-left text-sm font-bold text-gray-900">创建时间</th>
                            <th className="px-4 py-3 text-left text-sm font-bold text-gray-900">到期时间</th>
                            <th className="px-4 py-3 text-left text-sm font-bold text-gray-900">操作</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {records.subscriptions?.map((sub: any) => (
                            <tr key={sub.id} className="hover:bg-gray-50">
                              <td className="px-4 py-4 text-sm font-mono text-gray-900">{sub.id}</td>
                              <td className="px-4 py-4 text-sm font-semibold text-gray-900">
                                {sub.product_name || sub.metadata?.planName || '未知产品'}
                              </td>
                              <td className="px-4 py-4 text-sm font-bold text-gray-900">
                                {formatAmount(sub.amount || 0, sub.currency)}
                              </td>
                              <td className="px-4 py-4 text-sm text-gray-700">
                                {sub.interval === 'month' ? '月付' : 
                                 sub.interval === 'year' ? '年付' : 
                                 sub.interval || '一次性'}
                              </td>
                              <td className="px-4 py-4">
                                <span className={`inline-flex px-3 py-1 text-xs font-bold rounded-full ${
                                  sub.status === 'active' ? 'bg-green-100 text-green-800' :
                                  sub.status === 'trialing' ? 'bg-blue-100 text-blue-800' :
                                  sub.status === 'canceled' ? 'bg-gray-100 text-gray-800' :
                                  sub.status === 'past_due' ? 'bg-red-100 text-red-800' :
                                  'bg-gray-100 text-gray-800'
                                }`}>
                                  {sub.status}
                                </span>
                                {sub.cancel_at_period_end && (
                                  <span className="ml-2 text-xs text-orange-600 font-semibold">期末取消</span>
                                )}
                              </td>
                              <td className="px-4 py-4 text-sm text-gray-700">
                                {formatDate(sub.created)}
                              </td>
                              <td className="px-4 py-4 text-sm text-gray-700">
                                {formatDate(sub.current_period_end)}
                              </td>
                              <td className="px-4 py-4">
                                {(sub.status === 'active' || sub.status === 'trialing') && (
                                  <button
                                    onClick={() => cancelSubscription(sub.id)}
                                    disabled={loading}
                                    className="px-4 py-2 bg-red-600 text-white text-sm font-semibold rounded hover:bg-red-700 disabled:opacity-50"
                                  >
                                    取消
                                  </button>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      {(!records.subscriptions || records.subscriptions.length === 0) && (
                        <div className="text-center py-8 text-gray-500">暂无订阅记录</div>
                      )}
                    </div>
                  )}

                  {/* 客户记录 */}
                  {activeTab === 'customers' && (
                    <div className="space-y-4">
                      {records.customers?.map((customer: any) => (
                        <div key={customer.id} className="border-2 border-gray-200 rounded-lg p-5 hover:border-blue-300">
                          <div className="flex items-start justify-between">
                            <div>
                              <p className="font-bold text-lg text-gray-900">{customer.id}</p>
                              <p className="text-gray-700 mt-1">
                                <span className="font-semibold">邮箱:</span> {customer.email}
                              </p>
                              {customer.name && (
                                <p className="text-gray-700 mt-1">
                                  <span className="font-semibold">姓名:</span> {customer.name}
                                </p>
                              )}
                              <p className="text-gray-600 mt-1">
                                <span className="font-semibold">创建时间:</span> {formatDate(customer.created)}
                              </p>
                            </div>
                            <button
                              onClick={() => deleteCustomer(customer.id)}
                              disabled={loading}
                              className="px-4 py-2 bg-red-100 text-red-700 font-semibold rounded-lg hover:bg-red-200 disabled:opacity-50"
                            >
                              删除客户
                            </button>
                          </div>
                        </div>
                      ))}
                      {(!records.customers || records.customers.length === 0) && (
                        <div className="text-center py-8 text-gray-500">暂无客户记录</div>
                      )}
                    </div>
                  )}

                  {/* 充值记录 */}
                  {activeTab === 'charges' && (
                    <div className="overflow-x-auto">
                      <table className="min-w-full">
                        <thead>
                          <tr className="bg-gray-100">
                            <th className="px-4 py-3 text-left text-sm font-bold text-gray-900">充值ID</th>
                            <th className="px-4 py-3 text-left text-sm font-bold text-gray-900">金额</th>
                            <th className="px-4 py-3 text-left text-sm font-bold text-gray-900">状态</th>
                            <th className="px-4 py-3 text-left text-sm font-bold text-gray-900">描述</th>
                            <th className="px-4 py-3 text-left text-sm font-bold text-gray-900">时间</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {records.charges?.map((charge: any) => (
                            <tr key={charge.id} className="hover:bg-gray-50">
                              <td className="px-4 py-4 text-sm font-mono text-gray-900">{charge.id}</td>
                              <td className="px-4 py-4 text-sm font-bold text-gray-900">
                                {formatAmount(charge.amount, charge.currency)}
                              </td>
                              <td className="px-4 py-4">
                                <span className={`inline-flex px-3 py-1 text-xs font-bold rounded-full ${
                                  charge.status === 'succeeded' ? 'bg-green-100 text-green-800' :
                                  charge.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                  charge.status === 'failed' ? 'bg-red-100 text-red-800' :
                                  'bg-gray-100 text-gray-800'
                                }`}>
                                  {charge.status}
                                </span>
                              </td>
                              <td className="px-4 py-4 text-sm text-gray-700">
                                {charge.description || '-'}
                              </td>
                              <td className="px-4 py-4 text-sm text-gray-700">
                                {formatDate(charge.created)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      {(!records.charges || records.charges.length === 0) && (
                        <div className="text-center py-8 text-gray-500">暂无充值记录</div>
                      )}
                    </div>
                  )}

                  {/* 支付会话 */}
                  {activeTab === 'payments' && (
                    <div className="overflow-x-auto">
                      <table className="min-w-full">
                        <thead>
                          <tr className="bg-gray-100">
                            <th className="px-4 py-3 text-left text-sm font-bold text-gray-900">会话ID</th>
                            <th className="px-4 py-3 text-left text-sm font-bold text-gray-900">金额</th>
                            <th className="px-4 py-3 text-left text-sm font-bold text-gray-900">状态</th>
                            <th className="px-4 py-3 text-left text-sm font-bold text-gray-900">时间</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {records.payments?.map((payment: any) => (
                            <tr key={payment.id} className="hover:bg-gray-50">
                              <td className="px-4 py-4 text-sm font-mono text-gray-900">{payment.id}</td>
                              <td className="px-4 py-4 text-sm font-bold text-gray-900">
                                {formatAmount(payment.amount, payment.currency)}
                              </td>
                              <td className="px-4 py-4">
                                <span className={`inline-flex px-3 py-1 text-xs font-bold rounded-full ${
                                  payment.status === 'paid' ? 'bg-green-100 text-green-800' :
                                  payment.status === 'unpaid' ? 'bg-yellow-100 text-yellow-800' :
                                  'bg-gray-100 text-gray-800'
                                }`}>
                                  {payment.status}
                                </span>
                              </td>
                              <td className="px-4 py-4 text-sm text-gray-700">
                                {formatDate(payment.created)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      {(!records.payments || records.payments.length === 0) && (
                        <div className="text-center py-8 text-gray-500">暂无支付会话</div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}