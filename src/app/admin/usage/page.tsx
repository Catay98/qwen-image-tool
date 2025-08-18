'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import AdminLayout from '@/components/AdminLayout';

interface UsageRecord {
  id: string;
  user_id: string;
  date: string;
  free_uses_remaining: number;
  total_uses: number;
  api_calls: any[];
  user_email?: string;
}

interface UsageStats {
  totalApiCalls: number;
  todayApiCalls: number;
  averageUsesPerUser: number;
  peakHour: string;
}

export default function AdminUsage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [usageRecords, setUsageRecords] = useState<UsageRecord[]>([]);
  const [stats, setStats] = useState<UsageStats>({
    totalApiCalls: 0,
    todayApiCalls: 0,
    averageUsesPerUser: 0,
    peakHour: 'N/A'
  });
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (selectedDate) {
      fetchUsageData();
    }
  }, [selectedDate]);

  const checkAuth = async () => {
    try {
      const response = await fetch('/api/admin/verify');

      if (!response.ok) {
        router.push('/admin/login');
      }
    } catch (error) {
      console.error('Auth check error:', error);
      router.push('/admin/login');
    }
  };

  const fetchUsageData = async () => {
    setLoading(true);
    try {
      // 获取选定日期的使用记录
      const { data: usageData, error } = await supabase
        .from('user_usage')
        .select('*')
        .eq('date', selectedDate)
        .order('total_uses', { ascending: false });

      if (error) {
        console.error('Error fetching usage data:', error);
        setLoading(false);
        return;
      }

      // 获取用户信息（如果有users表）
      if (usageData && usageData.length > 0) {
        const userIds = [...new Set(usageData.map(record => record.user_id))];
        const { data: usersData } = await supabase
          .from('users')
          .select('id, email')
          .in('id', userIds);
        
        // 合并用户信息
        const usageWithUsers = usageData.map(record => {
          const user = usersData?.find(u => u.id === record.user_id);
          return {
            ...record,
            user_email: user?.email || record.user_id
          };
        });
        
        setUsageRecords(usageWithUsers || []);
      } else {
        setUsageRecords(usageData || []);
      }

      // 计算统计数据
      if (usageData && usageData.length > 0) {
        const totalUses = usageData.reduce((sum, record) => sum + record.total_uses, 0);
        const todayUses = usageData
          .filter(record => record.date === new Date().toISOString().split('T')[0])
          .reduce((sum, record) => sum + record.total_uses, 0);
        
        // 分析高峰时段
        const hourCounts: { [key: string]: number } = {};
        usageData.forEach(record => {
          if (record.api_calls && Array.isArray(record.api_calls)) {
            record.api_calls.forEach(call => {
              if (call.timestamp) {
                const hour = new Date(call.timestamp).getHours();
                hourCounts[hour] = (hourCounts[hour] || 0) + 1;
              }
            });
          }
        });

        const peakHour = Object.entries(hourCounts).reduce((a, b) => 
          hourCounts[a[0]] > hourCounts[b[0]] ? a : b, ['0', 0])[0];

        setStats({
          totalApiCalls: totalUses,
          todayApiCalls: todayUses,
          averageUsesPerUser: usageData.length > 0 ? Math.round(totalUses / usageData.length) : 0,
          peakHour: `${peakHour}:00`
        });
      }
    } catch (error) {
      console.error('Error fetching usage data:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminLayout>
      <div className="p-6">
        <h1 className="text-3xl font-bold mb-8">使用量统计</h1>

        {/* 统计卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">总API调用</p>
                <p className="text-2xl font-bold text-gray-800 mt-2">
                  {stats.totalApiCalls}
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <span className="text-2xl">📊</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">今日调用</p>
                <p className="text-2xl font-bold text-gray-800 mt-2">
                  {stats.todayApiCalls}
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <span className="text-2xl">📈</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">人均使用</p>
                <p className="text-2xl font-bold text-gray-800 mt-2">
                  {stats.averageUsesPerUser}
                </p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <span className="text-2xl">👤</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">高峰时段</p>
                <p className="text-2xl font-bold text-gray-800 mt-2">
                  {stats.peakHour}
                </p>
              </div>
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <span className="text-2xl">⏰</span>
              </div>
            </div>
          </div>
        </div>

        {/* 日期选择器 */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            选择日期
          </label>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="px-4 py-2 border rounded-lg"
            max={new Date().toISOString().split('T')[0]}
          />
        </div>

        {/* 使用记录表格 */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b">
            <h2 className="text-xl font-semibold">用户使用详情</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    用户
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    日期
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    总使用次数
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    剩余免费次数
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    API调用详情
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-4 text-center">
                      加载中...
                    </td>
                  </tr>
                ) : usageRecords.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                      暂无使用记录
                    </td>
                  </tr>
                ) : (
                  usageRecords.map((record) => (
                    <tr key={record.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {record.user_email || record.user_id}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{record.date}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{record.total_uses}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{record.free_uses_remaining}</div>
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => {
                            console.log('API Calls:', record.api_calls);
                            alert(`共 ${record.api_calls?.length || 0} 次调用`);
                          }}
                          className="text-blue-600 hover:text-blue-900 text-sm"
                        >
                          查看详情
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="mt-8">
          <button
            onClick={() => router.push('/admin/dashboard')}
            className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
          >
            返回仪表板
          </button>
        </div>
      </div>
    </AdminLayout>
  );
}