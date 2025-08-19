'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import AdminLayout from '@/components/AdminLayout';

interface Plan {
  id: string;
  name: string;
  duration_type: string;
  duration_value: number;
  price: number;
  description: string;
  features: any;
  is_active: boolean;
}

interface NewPlan {
  name: string;
  duration_type: string;
  duration_value: number;
  price: number;
  description: string;
}

interface Subscription {
  id: string;
  user_id: string;
  plan_id: string;
  status: string;
  start_date: string;
  end_date: string;
  users?: { email: string };
  subscription_plans?: { name: string };
}

export default function AdminSubscriptions() {
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [editingPlan, setEditingPlan] = useState<string | null>(null);
  const [newPrice, setNewPrice] = useState<number>(0);
  const [activeTab, setActiveTab] = useState<'plans' | 'subscriptions'>('plans');
  const [showAddPlan, setShowAddPlan] = useState(false);
  const [newPlan, setNewPlan] = useState<NewPlan>({
    name: '',
    duration_type: 'month',
    duration_value: 1,
    price: 0,
    description: ''
  });

  useEffect(() => {
    checkAdmin();
  }, []);

  const checkAdmin = async () => {
    try {
      const response = await fetch('/api/admin/verify');

      if (!response.ok) {
        router.push('/ydm/login');
        return;
      }

      setIsAdmin(true);
      fetchPlans();
      fetchSubscriptions();
    } catch (error) {
      console.error('Admin check error:', error);
      router.push('/ydm/login');
    } finally {
      setLoading(false);
    }
  };

  const fetchPlans = async () => {
    try {
      const response = await fetch('/api/subscription/plans');
      const data = await response.json();
      setPlans(data);
    } catch (error) {
      console.error('Error fetching plans:', error);
    }
  };

  const fetchSubscriptions = async () => {
    try {
      // 使用正确的表名 subscriptions 而不是 user_subscriptions
      const { data: subscriptionsData, error: subsError } = await supabase
        .from('subscriptions')
        .select(`
          *,
          subscription_plans(name, price)
        `)
        .order('created_at', { ascending: false });

      if (subsError) {
        console.error('Error fetching subscriptions:', subsError);
        return;
      }

      // 获取用户信息
      if (subscriptionsData && subscriptionsData.length > 0) {
        const userIds = [...new Set(subscriptionsData.map(s => s.user_id))];
        
        // 从users表获取用户邮箱
        const { data: usersData } = await supabase
          .from('users')
          .select('id, email')
          .in('id', userIds);

        // 合并数据
        const subscriptionsWithUsers = subscriptionsData.map(sub => {
          const user = usersData?.find(u => u.id === sub.user_id);
          return {
            ...sub,
            users: { email: user?.email || `用户 ${sub.user_id.substring(0, 8)}` }
          };
        });

        setSubscriptions(subscriptionsWithUsers);
      } else {
        setSubscriptions(subscriptionsData || []);
      }
    } catch (error) {
      console.error('Error fetching subscriptions:', error);
    }
  };

  const updatePlanPrice = async (planId: string) => {
    try {
      const response = await fetch('/api/subscription/plans', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ planId, price: newPrice })
      });

      if (response.ok) {
        alert('价格更新成功');
        setEditingPlan(null);
        fetchPlans();
      } else {
        alert('更新失败');
      }
    } catch (error) {
      console.error('Error updating price:', error);
      alert('更新失败');
    }
  };

  const addNewPlan = async () => {
    try {
      const { data, error } = await supabase
        .from('subscription_plans')
        .insert({
          ...newPlan,
          features: { unlimited_uses: true },
          is_active: true
        })
        .select()
        .single();

      if (error) {
        alert('添加失败: ' + error.message);
        return;
      }

      alert('订阅计划添加成功');
      setShowAddPlan(false);
      setNewPlan({
        name: '',
        duration_type: 'month',
        duration_value: 1,
        price: 0,
        description: ''
      });
      fetchPlans();
    } catch (error) {
      console.error('Error adding plan:', error);
      alert('添加失败');
    }
  };

  const deletePlan = async (planId: string) => {
    if (!confirm('确定要删除这个订阅计划吗？')) return;

    try {
      const { error } = await supabase
        .from('subscription_plans')
        .delete()
        .eq('id', planId);

      if (error) {
        alert('删除失败: ' + error.message);
        return;
      }

      alert('订阅计划已删除');
      fetchPlans();
    } catch (error) {
      console.error('Error deleting plan:', error);
      alert('删除失败');
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="min-h-screen flex items-center justify-center">
          <span className="text-gray-700">加载中...</span>
        </div>
      </AdminLayout>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <AdminLayout>
      <div className="p-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold mb-8 text-gray-900">订阅管理</h1>

        {/* 标签切换 */}
        <div className="flex space-x-4 mb-8">
          <button
            onClick={() => setActiveTab('plans')}
            className={`px-4 py-2 rounded-lg font-medium ${
              activeTab === 'plans'
                ? 'bg-blue-500 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            订阅计划
          </button>
          <button
            onClick={() => setActiveTab('subscriptions')}
            className={`px-4 py-2 rounded-lg font-medium ${
              activeTab === 'subscriptions'
                ? 'bg-blue-500 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            用户订阅
          </button>
        </div>

        {activeTab === 'plans' && (
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-900">订阅计划管理</h2>
              <button
                onClick={() => setShowAddPlan(!showAddPlan)}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                {showAddPlan ? '取消' : '+ 新增计划'}
              </button>
            </div>

            {/* 新增计划表单 */}
            {showAddPlan && (
              <div className="bg-gray-50 p-4 rounded-lg mb-4">
                <h3 className="font-medium mb-3 text-gray-900">新增订阅计划</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">计划名称</label>
                    <input
                      type="text"
                      value={newPlan.name}
                      onChange={(e) => setNewPlan({...newPlan, name: e.target.value})}
                      className="w-full px-3 py-2 border rounded text-gray-900 bg-white"
                      placeholder="如：季度订阅"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">价格</label>
                    <input
                      type="number"
                      value={newPlan.price}
                      onChange={(e) => setNewPlan({...newPlan, price: Number(e.target.value)})}
                      className="w-full px-3 py-2 border rounded text-gray-900 bg-white"
                      step="0.01"
                      placeholder="99.90"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">时长类型</label>
                    <select
                      value={newPlan.duration_type}
                      onChange={(e) => setNewPlan({...newPlan, duration_type: e.target.value})}
                      className="w-full px-3 py-2 border rounded text-gray-900 bg-white"
                    >
                      <option value="week">周</option>
                      <option value="month">月</option>
                      <option value="year">年</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">时长数值</label>
                    <input
                      type="number"
                      value={newPlan.duration_value}
                      onChange={(e) => setNewPlan({...newPlan, duration_value: Number(e.target.value)})}
                      className="w-full px-3 py-2 border rounded text-gray-900 bg-white"
                      min="1"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">描述</label>
                    <input
                      type="text"
                      value={newPlan.description}
                      onChange={(e) => setNewPlan({...newPlan, description: e.target.value})}
                      className="w-full px-3 py-2 border rounded text-gray-900 bg-white"
                      placeholder="适合长期使用的用户"
                    />
                  </div>
                </div>
                <div className="flex justify-end mt-4 space-x-2">
                  <button
                    onClick={() => setShowAddPlan(false)}
                    className="px-4 py-2 border rounded hover:bg-gray-100 text-gray-700"
                  >
                    取消
                  </button>
                  <button
                    onClick={addNewPlan}
                    className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
                  >
                    添加计划
                  </button>
                </div>
              </div>
            )}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 text-gray-700">计划名称</th>
                    <th className="text-left py-3 px-4 text-gray-700">类型</th>
                    <th className="text-left py-3 px-4 text-gray-700">当前价格</th>
                    <th className="text-left py-3 px-4 text-gray-700">描述</th>
                    <th className="text-left py-3 px-4 text-gray-700">状态</th>
                    <th className="text-left py-3 px-4 text-gray-700">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {plans.map(plan => (
                    <tr key={plan.id} className="border-b">
                      <td className="py-3 px-4 font-medium text-gray-900">{plan.name}</td>
                      <td className="py-3 px-4 text-gray-700">{plan.duration_type}</td>
                      <td className="py-3 px-4">
                        {editingPlan === plan.id ? (
                          <input
                            type="number"
                            value={newPrice}
                            onChange={(e) => setNewPrice(Number(e.target.value))}
                            className="w-24 px-2 py-1 border rounded text-gray-900 bg-white"
                            step="0.01"
                          />
                        ) : (
                          `$${plan.price}`
                        )}
                      </td>
                      <td className="py-3 px-4 text-gray-700">{plan.description}</td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 rounded text-xs ${
                          plan.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {plan.is_active ? '激活' : '停用'}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        {editingPlan === plan.id ? (
                          <div className="flex space-x-2">
                            <button
                              onClick={() => updatePlanPrice(plan.id)}
                              className="text-green-600 hover:text-green-800"
                            >
                              保存
                            </button>
                            <button
                              onClick={() => setEditingPlan(null)}
                              className="text-gray-600 hover:text-gray-800"
                            >
                              取消
                            </button>
                          </div>
                        ) : (
                          <div className="flex space-x-2">
                            <button
                              onClick={() => {
                                setEditingPlan(plan.id);
                                setNewPrice(plan.price);
                              }}
                              className="text-blue-600 hover:text-blue-800"
                            >
                              编辑价格
                            </button>
                            <button
                              onClick={() => deletePlan(plan.id)}
                              className="text-red-600 hover:text-red-800"
                            >
                              删除
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'subscriptions' && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-900">用户订阅记录</h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4">用户邮箱</th>
                    <th className="text-left py-3 px-4">订阅计划</th>
                    <th className="text-left py-3 px-4">状态</th>
                    <th className="text-left py-3 px-4">开始时间</th>
                    <th className="text-left py-3 px-4">结束时间</th>
                  </tr>
                </thead>
                <tbody>
                  {subscriptions.map(sub => (
                    <tr key={sub.id} className="border-b">
                      <td className="py-3 px-4 text-gray-900">{sub.users?.email || 'N/A'}</td>
                      <td className="py-3 px-4 text-gray-700">{sub.subscription_plans?.name || 'N/A'}</td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 rounded text-xs ${
                          sub.status === 'active' 
                            ? 'bg-green-100 text-green-800' 
                            : sub.status === 'expired'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {sub.status}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        {new Date(sub.start_date).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4">
                        {new Date(sub.end_date).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

          <div className="mt-8">
            <button
              onClick={() => router.push('/admin/dashboard')}
              className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
            >
              返回管理面板
            </button>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}