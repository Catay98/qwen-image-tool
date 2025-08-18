"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import AdminLayout from "@/components/AdminLayout";
import { supabase } from '@/lib/supabase';

interface PaymentRecord {
  id: string;
  user_id: string;
  amount: number;
  currency: string;
  payment_type: string;
  payment_method: string;
  payment_status: string;
  transaction_id: string;
  created_at: string;
  user_email?: string;
}

interface PointsPurchase {
  id: string;
  user_id: string;
  package_name: string;
  price: number;
  points: number;
  bonus_points: number;
  total_points: number;
  payment_status: string;
  created_at: string;
  user_email?: string;
}

interface BillingStats {
  totalRevenue: number;
  monthlyRevenue: number;
  todayRevenue: number;
  totalTransactions: number;
  averageTransaction: number;
  successRate: number;
}

export default function AdminBilling() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("overview");
  const [paymentRecords, setPaymentRecords] = useState<PaymentRecord[]>([]);
  const [pointsPurchases, setPointsPurchases] = useState<PointsPurchase[]>([]);
  const [stats, setStats] = useState<BillingStats>({
    totalRevenue: 0,
    monthlyRevenue: 0,
    todayRevenue: 0,
    totalTransactions: 0,
    averageTransaction: 0,
    successRate: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [dateRange, setDateRange] = useState({
    start: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    checkAuth();
    loadBillingData();
  }, [dateRange]);

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

  const loadBillingData = async () => {
    setIsLoading(true);
    try {
      // 获取支付记录
      const { data: payments, error: paymentsError } = await supabase
        .from('payment_records')
        .select('*')
        .gte('created_at', dateRange.start)
        .lte('created_at', dateRange.end + 'T23:59:59')
        .order('created_at', { ascending: false });

      // 获取积分购买记录
      const { data: pointsPurchases, error: pointsError } = await supabase
        .from('points_purchase_records')
        .select('*')
        .gte('created_at', dateRange.start)
        .lte('created_at', dateRange.end + 'T23:59:59')
        .order('created_at', { ascending: false });

      // 获取用户信息
      const allUserIds = new Set<string>();
      payments?.forEach(p => allUserIds.add(p.user_id));
      pointsPurchases?.forEach(p => allUserIds.add(p.user_id));

      const { data: users } = await supabase
        .from('users')
        .select('id, email')
        .in('id', Array.from(allUserIds));

      const userMap = new Map(users?.map(u => [u.id, u.email]) || []);

      // 合并用户信息
      if (payments) {
        const paymentsWithUsers = payments.map(p => ({
          ...p,
          user_email: userMap.get(p.user_id) || `用户 ${p.user_id.substring(0, 8)}`
        }));
        setPaymentRecords(paymentsWithUsers);
      }

      if (pointsPurchases) {
        const purchasesWithUsers = pointsPurchases.map(p => ({
          ...p,
          user_email: userMap.get(p.user_id) || `用户 ${p.user_id.substring(0, 8)}`
        }));
        setPointsPurchases(purchasesWithUsers);
      }

      // 计算统计数据
      calculateStats(payments || [], pointsPurchases || []);
    } catch (error) {
      console.error("Failed to load billing data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const calculateStats = (payments: any[], pointsPurchases: any[]) => {
    const allTransactions = [...payments, ...pointsPurchases];
    const successfulTransactions = allTransactions.filter(t => 
      t.payment_status === 'completed' || t.payment_status === 'success'
    );

    const totalRevenue = successfulTransactions.reduce((sum, t) => 
      sum + (parseFloat(t.amount) || parseFloat(t.price) || 0), 0
    );

    const today = new Date().toISOString().split('T')[0];
    const todayTransactions = successfulTransactions.filter(t => 
      t.created_at.startsWith(today)
    );
    const todayRevenue = todayTransactions.reduce((sum, t) => 
      sum + (parseFloat(t.amount) || parseFloat(t.price) || 0), 0
    );

    const thisMonth = new Date().toISOString().substring(0, 7);
    const monthlyTransactions = successfulTransactions.filter(t => 
      t.created_at.startsWith(thisMonth)
    );
    const monthlyRevenue = monthlyTransactions.reduce((sum, t) => 
      sum + (parseFloat(t.amount) || parseFloat(t.price) || 0), 0
    );

    setStats({
      totalRevenue,
      monthlyRevenue,
      todayRevenue,
      totalTransactions: allTransactions.length,
      averageTransaction: allTransactions.length > 0 ? totalRevenue / successfulTransactions.length : 0,
      successRate: allTransactions.length > 0 ? (successfulTransactions.length / allTransactions.length) * 100 : 0,
    });
  };

  const exportToCSV = () => {
    const data = activeTab === "payments" ? paymentRecords : pointsPurchases;
    if (data.length === 0) {
      alert("没有数据可导出");
      return;
    }

    const headers = Object.keys(data[0]).join(',');
    const rows = data.map(row => Object.values(row).join(','));
    const csv = [headers, ...rows].join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `billing_${activeTab}_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  return (
    <AdminLayout>
      <div className="p-6">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800">账单管理</h1>
          <button
            onClick={exportToCSV}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            导出CSV
          </button>
        </div>

        {/* 统计卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-8">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <p className="text-gray-500 text-sm">总收入</p>
            <p className="text-2xl font-bold text-gray-800 mt-2">
              ${stats.totalRevenue.toFixed(2)}
            </p>
          </div>
          <div className="bg-white rounded-xl shadow-lg p-6">
            <p className="text-gray-500 text-sm">本月收入</p>
            <p className="text-2xl font-bold text-gray-800 mt-2">
              ${stats.monthlyRevenue.toFixed(2)}
            </p>
          </div>
          <div className="bg-white rounded-xl shadow-lg p-6">
            <p className="text-gray-500 text-sm">今日收入</p>
            <p className="text-2xl font-bold text-gray-800 mt-2">
              ${stats.todayRevenue.toFixed(2)}
            </p>
          </div>
          <div className="bg-white rounded-xl shadow-lg p-6">
            <p className="text-gray-500 text-sm">总交易数</p>
            <p className="text-2xl font-bold text-gray-800 mt-2">
              {stats.totalTransactions}
            </p>
          </div>
          <div className="bg-white rounded-xl shadow-lg p-6">
            <p className="text-gray-500 text-sm">平均交易额</p>
            <p className="text-2xl font-bold text-gray-800 mt-2">
              ${stats.averageTransaction.toFixed(2)}
            </p>
          </div>
          <div className="bg-white rounded-xl shadow-lg p-6">
            <p className="text-gray-500 text-sm">成功率</p>
            <p className="text-2xl font-bold text-gray-800 mt-2">
              {stats.successRate.toFixed(1)}%
            </p>
          </div>
        </div>

        {/* 日期范围选择 */}
        <div className="bg-white rounded-xl shadow-lg p-4 mb-6">
          <div className="flex items-center space-x-4">
            <label className="text-sm font-medium text-gray-700">日期范围：</label>
            <input
              type="date"
              value={dateRange.start}
              onChange={(e) => setDateRange({...dateRange, start: e.target.value})}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
            />
            <span className="text-gray-500">至</span>
            <input
              type="date"
              value={dateRange.end}
              onChange={(e) => setDateRange({...dateRange, end: e.target.value})}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
            />
            <button
              onClick={loadBillingData}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              查询
            </button>
          </div>
        </div>

        {/* 标签页 */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab("overview")}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === "overview"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              概览
            </button>
            <button
              onClick={() => setActiveTab("payments")}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === "payments"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              支付记录
            </button>
            <button
              onClick={() => setActiveTab("points")}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === "points"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              积分购买
            </button>
          </nav>
        </div>

        {/* 内容区域 */}
        {isLoading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          </div>
        ) : (
          <>
            {/* 概览 */}
            {activeTab === "overview" && (
              <div className="grid gap-6">
                <div className="bg-white rounded-xl shadow-lg p-6">
                  <h2 className="text-xl font-semibold text-gray-800 mb-4">收入趋势</h2>
                  <div className="h-64 flex items-center justify-center text-gray-400">
                    图表功能开发中...
                  </div>
                </div>
                
                <div className="bg-white rounded-xl shadow-lg p-6">
                  <h2 className="text-xl font-semibold text-gray-800 mb-4">最近交易</h2>
                  <div className="space-y-2">
                    {[...paymentRecords, ...pointsPurchases]
                      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                      .slice(0, 5)
                      .map((record) => (
                        <div key={record.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                          <div>
                            <p className="font-medium text-gray-800">{record.user_email}</p>
                            <p className="text-sm text-gray-500">
                              {new Date(record.created_at).toLocaleString('zh-CN')}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-gray-800">
                              ${'amount' in record ? record.amount : record.price}
                            </p>
                            <p className="text-sm text-gray-500">
                              {'payment_type' in record ? record.payment_type : '积分购买'}
                            </p>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            )}

            {/* 支付记录 */}
            {activeTab === "payments" && (
              <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        用户
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        金额
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        类型
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        支付方式
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        状态
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        时间
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {paymentRecords.map((record) => (
                      <tr key={record.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {record.user_email}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          ${record.amount} {record.currency}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {record.payment_type}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {record.payment_method}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            record.payment_status === 'completed' || record.payment_status === 'success'
                              ? 'bg-green-100 text-green-800'
                              : record.payment_status === 'pending'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {record.payment_status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(record.created_at).toLocaleString('zh-CN')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* 积分购买记录 */}
            {activeTab === "points" && (
              <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        用户
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        套餐
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        价格
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        积分
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        赠送
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        状态
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        时间
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {pointsPurchases.map((record) => (
                      <tr key={record.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {record.user_email}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {record.package_name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          ${record.price}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {record.points}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          +{record.bonus_points}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            record.payment_status === 'completed' || record.payment_status === 'success'
                              ? 'bg-green-100 text-green-800'
                              : record.payment_status === 'pending'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {record.payment_status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(record.created_at).toLocaleString('zh-CN')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </div>
    </AdminLayout>
  );
}