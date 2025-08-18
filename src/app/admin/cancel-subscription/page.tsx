'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import AdminLayout from '@/components/AdminLayout';

export default function AdminCancelSubscriptionPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [userInfo, setUserInfo] = useState<any>(null);

  // 查询用户信息
  const searchUser = async () => {
    if (!email) {
      alert('请输入用户邮箱');
      return;
    }
    
    setLoading(true);
    setResult(null);
    
    try {
      // 查找用户
      const { data: user } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .single();

      if (!user) {
        setUserInfo(null);
        setResult({ error: '未找到该用户' });
        setLoading(false);
        return;
      }

      // 查找订阅信息
      const { data: subscription } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      // 查找积分信息
      const { data: points } = await supabase
        .from('user_points')
        .select('*')
        .eq('user_id', user.id)
        .single();

      setUserInfo({
        user,
        subscription,
        points
      });

    } catch (error) {
      console.error('查询失败:', error);
      setResult({ error: '查询失败', details: error });
    }
    
    setLoading(false);
  };

  // 取消订阅（软取消 - 期末取消）
  const cancelSubscription = async () => {
    if (!userInfo?.user) {
      alert('请先查询用户');
      return;
    }

    if (!confirm(`确定要取消 ${email} 的订阅吗？（保留访问权限直到期末）`)) {
      return;
    }

    setLoading(true);
    
    try {
      // 获取管理员session
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error('未登录');
      }

      // 模拟用户token调用取消API
      const response = await fetch('/api/subscription/cancel', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
          'X-Admin-Override': 'true',
          'X-Target-User': userInfo.user.id
        },
        body: JSON.stringify({
          immediateCancel: false
        })
      });

      const data = await response.json();
      
      if (response.ok) {
        setResult({ success: true, message: '订阅已设置为期末取消', data });
        // 重新查询用户信息
        await searchUser();
      } else {
        setResult({ error: '取消失败', details: data });
      }
    } catch (error) {
      setResult({ error: '操作失败', details: error });
    }
    
    setLoading(false);
  };

  // 立即取消订阅
  const immediateCancelSubscription = async () => {
    if (!userInfo?.user) {
      alert('请先查询用户');
      return;
    }

    if (!confirm(`确定要立即取消 ${email} 的订阅吗？（立即失效并清零积分）`)) {
      return;
    }

    setLoading(true);
    
    try {
      // 直接更新数据库
      const { error: subError } = await supabase
        .from('subscriptions')
        .update({
          status: 'cancelled',
          cancel_at_period_end: true,
          cancelled_at: new Date().toISOString(),
          end_date: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userInfo.user.id)
        .eq('status', 'active');

      if (subError) throw subError;

      // 清零积分
      const { error: pointsError } = await supabase
        .from('user_points')
        .update({
          available_points: 0,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userInfo.user.id);

      if (pointsError) throw pointsError;

      setResult({ 
        success: true, 
        message: '订阅已立即取消，积分已清零' 
      });
      
      // 重新查询用户信息
      await searchUser();
      
    } catch (error) {
      setResult({ error: '操作失败', details: error });
    }
    
    setLoading(false);
  };

  // 取消Stripe订阅
  const cancelStripeSubscription = async () => {
    if (!email) {
      alert('请输入用户邮箱');
      return;
    }

    if (!confirm(`确定要取消 ${email} 在Stripe的所有订阅吗？`)) {
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
        // 处理没有summary的情况
        if (!data.summary) {
          setResult({ 
            success: false, 
            message: '操作完成但未返回预期数据',
            details: data
          });
        } else {
          const cancelledCount = data.summary.subscriptions_cancelled || 0;
          const foundCount = data.summary.subscriptions_found || 0;
          const customersCount = data.summary.customers_found || 0;
          
          let message = '';
          if (cancelledCount > 0) {
            message = `✅ Stripe订阅取消成功！取消了 ${cancelledCount} 个订阅`;
          } else if (foundCount > 0) {
            message = '📋 找到订阅但已经是取消状态';
          } else if (customersCount > 0) {
            message = '👤 找到客户但没有活跃订阅';
          } else {
            message = '❌ 该邮箱在Stripe中没有找到任何客户或订阅';
          }
          
          setResult({ 
            success: cancelledCount > 0 || foundCount === 0, 
            message: message,
            details: data
          });
        }
        
        // 如果用户已查询，重新查询信息
        if (userInfo) {
          await searchUser();
        }
      } else {
        setResult({ error: 'Stripe取消失败', details: data });
      }
    } catch (error) {
      setResult({ error: 'Stripe操作失败', details: error });
    }
    
    setLoading(false);
  };

  // 删除所有订阅记录
  const deleteAllSubscriptions = async () => {
    if (!userInfo?.user) {
      alert('请先查询用户');
      return;
    }

    if (!confirm(`确定要删除 ${email} 的所有订阅记录吗？（不可恢复）`)) {
      return;
    }

    setLoading(true);
    
    try {
      // 删除订阅
      await supabase
        .from('subscriptions')
        .delete()
        .eq('user_id', userInfo.user.id);

      // 删除积分
      await supabase
        .from('user_points')
        .delete()
        .eq('user_id', userInfo.user.id);

      // 删除支付记录
      await supabase
        .from('payment_records')
        .delete()
        .eq('user_id', userInfo.user.id);

      setResult({ 
        success: true, 
        message: '所有订阅记录已删除' 
      });
      
      // 重新查询用户信息
      await searchUser();
      
    } catch (error) {
      setResult({ error: '删除失败', details: error });
    }
    
    setLoading(false);
  };

  return (
    <AdminLayout>
      <div className="p-8">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl font-bold mb-8">取消用户订阅</h1>

        {/* 搜索栏 */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex space-x-4">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="输入用户邮箱 (例如: qinfeng3350@gmail.com)"
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg"
              onKeyPress={(e) => e.key === 'Enter' && searchUser()}
            />
            <button
              onClick={searchUser}
              disabled={loading}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? '查询中...' : '查询用户'}
            </button>
          </div>
        </div>

        {/* 用户信息 */}
        {userInfo && (
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">用户信息</h2>
            
            <div className="grid grid-cols-3 gap-6">
              {/* 用户基本信息 */}
              <div>
                <h3 className="font-medium text-gray-700 mb-2">基本信息</h3>
                <p className="text-sm text-gray-600">ID: {userInfo.user.id}</p>
                <p className="text-sm text-gray-600">邮箱: {userInfo.user.email}</p>
                <p className="text-sm text-gray-600">
                  注册时间: {new Date(userInfo.user.created_at).toLocaleDateString()}
                </p>
              </div>

              {/* 订阅信息 */}
              <div>
                <h3 className="font-medium text-gray-700 mb-2">订阅信息</h3>
                {userInfo.subscription ? (
                  <>
                    <p className="text-sm text-gray-600">
                      状态: <span className={
                        userInfo.subscription.status === 'active' ? 'text-green-600 font-bold' :
                        userInfo.subscription.status === 'cancelled' ? 'text-red-600 font-bold' :
                        'text-gray-600 font-bold'
                      }>
                        {userInfo.subscription.status}
                      </span>
                    </p>
                    <p className="text-sm text-gray-600">套餐: {userInfo.subscription.plan_name}</p>
                    <p className="text-sm text-gray-600">
                      到期: {new Date(userInfo.subscription.end_date).toLocaleDateString()}
                    </p>
                    {userInfo.subscription.cancel_at_period_end && (
                      <p className="text-sm text-yellow-600 font-bold">已取消续费</p>
                    )}
                  </>
                ) : (
                  <p className="text-sm text-gray-500">无订阅</p>
                )}
              </div>

              {/* 积分信息 */}
              <div>
                <h3 className="font-medium text-gray-700 mb-2">积分信息</h3>
                {userInfo.points ? (
                  <>
                    <p className="text-sm text-gray-600">
                      可用积分: <span className="font-bold">{userInfo.points.available_points}</span>
                    </p>
                    <p className="text-sm text-gray-600">
                      过期积分: {userInfo.points.expired_points || 0}
                    </p>
                  </>
                ) : (
                  <p className="text-sm text-gray-500">无积分记录</p>
                )}
              </div>
            </div>

            {/* 操作按钮 */}
            <div className="mt-6 pt-6 border-t">
              <div className="flex space-x-4 mb-3">
                <button
                  onClick={cancelSubscription}
                  disabled={loading || !userInfo.subscription || userInfo.subscription.status !== 'active'}
                  className="px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  期末取消（保留访问）
                </button>
                
                <button
                  onClick={immediateCancelSubscription}
                  disabled={loading || !userInfo.subscription || userInfo.subscription.status !== 'active'}
                  className="px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  立即取消（清零积分）
                </button>
                
                <button
                  onClick={deleteAllSubscriptions}
                  disabled={loading}
                  className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
                >
                  删除所有记录
                </button>
              </div>
              
              {/* Stripe操作按钮 */}
              <div className="pt-3 border-t">
                <p className="text-sm text-gray-600 mb-2">Stripe操作（解决"您已订阅"问题）：</p>
                <button
                  onClick={cancelStripeSubscription}
                  disabled={loading}
                  className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 disabled:opacity-50"
                >
                  🔧 取消Stripe端订阅
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 操作结果 */}
        {result && (
          <div className={`rounded-lg shadow p-6 ${
            result.success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
          } border`}>
            <h3 className={`font-semibold mb-2 ${
              result.success ? 'text-green-800' : 'text-red-800'
            }`}>
              {result.success ? '✅ 操作成功' : '❌ 操作失败'}
            </h3>
            <p className={result.success ? 'text-green-700' : 'text-red-700'}>
              {result.message || result.error}
            </p>
            {result.details && (
              <pre className="mt-2 text-xs bg-white p-2 rounded overflow-auto">
                {JSON.stringify(result.details, null, 2)}
              </pre>
            )}
          </div>
        )}
        </div>
      </div>
    </AdminLayout>
  );
}