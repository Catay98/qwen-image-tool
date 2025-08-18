"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import AdminLayout from "@/components/AdminLayout";

interface SubscriptionPlan {
  id: string;
  name: string;
  duration_type: string;
  duration_value: number;
  price: number;
  points: number;
  description: string;
  features: any;
  is_active: boolean;
  sort_order: number;
}

interface PointsPackage {
  id: string;
  name: string;
  description: string;
  price: number;
  points: number;
  bonus_points: number;
  is_active: boolean;
  sort_order: number;
}

export default function AdminPlans() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("subscriptions");
  const [subscriptionPlans, setSubscriptionPlans] = useState<SubscriptionPlan[]>([]);
  const [pointsPackages, setPointsPackages] = useState<PointsPackage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingPlan, setEditingPlan] = useState<SubscriptionPlan | null>(null);
  const [editingPackage, setEditingPackage] = useState<PointsPackage | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);

  useEffect(() => {
    checkAuth();
    loadData();
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

  const loadData = async () => {
    setIsLoading(true);
    try {
      // 加载订阅计划
      const plansResponse = await fetch("/api/admin/plans");
      if (plansResponse.ok) {
        const plansData = await plansResponse.json();
        setSubscriptionPlans(plansData.subscriptionPlans || []);
        setPointsPackages(plansData.pointsPackages || []);
      }
    } catch (error) {
      console.error("Failed to load plans:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSavePlan = async (plan: SubscriptionPlan) => {
    try {
      const response = await fetch("/api/admin/plans", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          type: "subscription",
          plan: plan,
        }),
      });

      if (response.ok) {
        alert("计划已保存");
        setEditingPlan(null);
        loadData();
      } else {
        alert("保存失败");
      }
    } catch (error) {
      console.error("Save plan error:", error);
      alert("保存失败");
    }
  };

  const handleSavePackage = async (pkg: PointsPackage) => {
    try {
      const response = await fetch("/api/admin/plans", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          type: "points",
          package: pkg,
        }),
      });

      if (response.ok) {
        alert("积分包已保存");
        setEditingPackage(null);
        loadData();
      } else {
        alert("保存失败");
      }
    } catch (error) {
      console.error("Save package error:", error);
      alert("保存失败");
    }
  };

  const handleToggleActive = async (id: string, type: "subscription" | "points", isActive: boolean) => {
    try {
      const response = await fetch(`/api/admin/plans/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          type: type,
          is_active: !isActive,
        }),
      });

      if (response.ok) {
        loadData();
      }
    } catch (error) {
      console.error("Toggle active error:", error);
    }
  };

  return (
    <AdminLayout>
      <div className="p-6">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800">套餐管理</h1>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            添加新套餐
          </button>
        </div>

        {/* 标签页 */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab("subscriptions")}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === "subscriptions"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              订阅套餐
            </button>
            <button
              onClick={() => setActiveTab("points")}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === "points"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              积分包
            </button>
          </nav>
        </div>

        {isLoading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          </div>
        ) : (
          <>
            {/* 订阅套餐管理 */}
            {activeTab === "subscriptions" && (
              <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        套餐名称
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        价格
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        时长
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        赠送积分
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        状态
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        操作
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {subscriptionPlans.map((plan) => (
                      <tr key={plan.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">{plan.name}</div>
                            <div className="text-xs text-gray-500">{plan.description}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm font-medium text-gray-900">${plan.price}</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {plan.duration_value} {plan.duration_type === "month" ? "个月" : "年"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                            {plan.points} 积分
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={plan.is_active}
                              onChange={() => handleToggleActive(plan.id, "subscription", plan.is_active)}
                              className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                          </label>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button
                            onClick={() => setEditingPlan(plan)}
                            className="text-blue-600 hover:text-blue-900 mr-3"
                          >
                            编辑
                          </button>
                          <button className="text-red-600 hover:text-red-900">删除</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* 积分包管理 */}
            {activeTab === "points" && (
              <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        积分包名称
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        价格
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        积分数量
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        赠送积分
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        单价
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        状态
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        操作
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {pointsPackages.map((pkg) => {
                      const totalPoints = pkg.points + pkg.bonus_points;
                      const unitPrice = (pkg.price / totalPoints).toFixed(3);
                      
                      return (
                        <tr key={pkg.id}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <div className="text-sm font-medium text-gray-900">{pkg.name}</div>
                              <div className="text-xs text-gray-500">{pkg.description}</div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="text-sm font-medium text-gray-900">${pkg.price}</span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="text-sm text-gray-900">{pkg.points}</span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {pkg.bonus_points > 0 && (
                              <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                                +{pkg.bonus_points}
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            ${unitPrice}/积分
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <label className="relative inline-flex items-center cursor-pointer">
                              <input
                                type="checkbox"
                                checked={pkg.is_active}
                                onChange={() => handleToggleActive(pkg.id, "points", pkg.is_active)}
                                className="sr-only peer"
                              />
                              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                            </label>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <button
                              onClick={() => setEditingPackage(pkg)}
                              className="text-blue-600 hover:text-blue-900 mr-3"
                            >
                              编辑
                            </button>
                            <button className="text-red-600 hover:text-red-900">删除</button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}

        {/* 编辑订阅计划模态框 */}
        {editingPlan && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
              <h3 className="text-lg font-bold text-gray-900 mb-4">编辑订阅计划</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">名称</label>
                  <input
                    type="text"
                    value={editingPlan.name}
                    onChange={(e) => setEditingPlan({...editingPlan, name: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">价格</label>
                  <input
                    type="number"
                    value={editingPlan.price}
                    onChange={(e) => setEditingPlan({...editingPlan, price: parseFloat(e.target.value)})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">赠送积分</label>
                  <input
                    type="number"
                    value={editingPlan.points}
                    onChange={(e) => setEditingPlan({...editingPlan, points: parseInt(e.target.value)})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">描述</label>
                  <textarea
                    value={editingPlan.description}
                    onChange={(e) => setEditingPlan({...editingPlan, description: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                    rows={3}
                  />
                </div>
              </div>
              <div className="mt-6 flex justify-end space-x-3">
                <button
                  onClick={() => setEditingPlan(null)}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
                >
                  取消
                </button>
                <button
                  onClick={() => handleSavePlan(editingPlan)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  保存
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 添加新套餐模态框 */}
        {showAddModal && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
              <h3 className="text-lg font-bold text-gray-900 mb-4">添加新{activeTab === "subscriptions" ? "订阅套餐" : "积分包"}</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">名称</label>
                  <input
                    type="text"
                    id="new-name"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                    placeholder={activeTab === "subscriptions" ? "如：高级订阅" : "如：1000积分包"}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">显示名称</label>
                  <input
                    type="text"
                    id="new-display-name"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                    placeholder={activeTab === "subscriptions" ? "如：高级月度订阅" : "如：超值1000积分"}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">价格 ($)</label>
                  <input
                    type="number"
                    id="new-price"
                    step="0.01"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                    placeholder="如：29.99"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">积分数量</label>
                  <input
                    type="number"
                    id="new-points"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                    placeholder="如：1000"
                  />
                </div>
                {activeTab === "subscriptions" && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">时长类型</label>
                    <select
                      id="new-duration-type"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                    >
                      <option value="month">月度</option>
                      <option value="year">年度</option>
                    </select>
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">描述</label>
                  <textarea
                    id="new-description"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                    rows={3}
                    placeholder="套餐描述..."
                  />
                </div>
              </div>
              <div className="mt-6 flex justify-end space-x-3">
                <button
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
                >
                  取消
                </button>
                <button
                  onClick={async () => {
                    const name = (document.getElementById('new-name') as HTMLInputElement).value;
                    const displayName = (document.getElementById('new-display-name') as HTMLInputElement).value;
                    const price = parseFloat((document.getElementById('new-price') as HTMLInputElement).value);
                    const points = parseInt((document.getElementById('new-points') as HTMLInputElement).value);
                    const description = (document.getElementById('new-description') as HTMLTextAreaElement).value;
                    
                    if (!name || !price || !points) {
                      alert('请填写必要字段');
                      return;
                    }
                    
                    try {
                      const response = await fetch("/api/admin/plans", {
                        method: "POST",
                        headers: {
                          "Content-Type": "application/json",
                        },
                        body: JSON.stringify({
                          type: activeTab === "subscriptions" ? "subscription" : "points",
                          plan: activeTab === "subscriptions" ? {
                            name,
                            display_name: displayName || name,
                            price,
                            points,
                            duration_type: (document.getElementById('new-duration-type') as HTMLSelectElement)?.value || 'month',
                            duration_value: 1,
                            description,
                            features: ['高清图片生成', '优先处理队列', '批量生成功能'],
                            is_active: true,
                            sort_order: 100
                          } : {
                            name,
                            display_name: displayName || name,
                            price,
                            points,
                            description,
                            features: ['积分永不过期', '灵活使用'],
                            validity_days: 60,
                            is_active: true,
                            sort_order: 100
                          }
                        }),
                      });
                      
                      if (response.ok) {
                        alert('添加成功');
                        setShowAddModal(false);
                        loadData();
                      } else {
                        alert('添加失败');
                      }
                    } catch (error) {
                      console.error('Add plan error:', error);
                      alert('添加失败');
                    }
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  添加
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 编辑积分包模态框 */}
        {editingPackage && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
              <h3 className="text-lg font-bold text-gray-900 mb-4">编辑积分包</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">名称</label>
                  <input
                    type="text"
                    value={editingPackage.name}
                    onChange={(e) => setEditingPackage({...editingPackage, name: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">价格</label>
                  <input
                    type="number"
                    value={editingPackage.price}
                    onChange={(e) => setEditingPackage({...editingPackage, price: parseFloat(e.target.value)})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">积分数量</label>
                  <input
                    type="number"
                    value={editingPackage.points}
                    onChange={(e) => setEditingPackage({...editingPackage, points: parseInt(e.target.value)})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">赠送积分</label>
                  <input
                    type="number"
                    value={editingPackage.bonus_points}
                    onChange={(e) => setEditingPackage({...editingPackage, bonus_points: parseInt(e.target.value)})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>
              <div className="mt-6 flex justify-end space-x-3">
                <button
                  onClick={() => setEditingPackage(null)}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
                >
                  取消
                </button>
                <button
                  onClick={() => handleSavePackage(editingPackage)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  保存
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}