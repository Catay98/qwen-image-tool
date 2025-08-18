'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { useTranslation } from 'react-i18next';

interface UsageRecord {
  id: string;
  date: string;
  total_uses: number;
  free_uses_remaining: number;
  api_calls: any[];
  created_at: string;
  updated_at: string;
}

interface PointsTransaction {
  id: string;
  type: string;
  points: number;
  amount: number | null;
  description: string;
  created_at: string;
}

export default function UsagePage() {
  const router = useRouter();
  const { user } = useAuth();
  const { t } = useTranslation();
  const [usageRecords, setUsageRecords] = useState<UsageRecord[]>([]);
  const [pointsTransactions, setPointsTransactions] = useState<PointsTransaction[]>([]);
  const [activeTab, setActiveTab] = useState('usage');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      router.push('/?auth=signin');
      return;
    }
    fetchData();
  }, [user, activeTab]);

  const fetchData = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      if (activeTab === 'usage') {
        // 获取使用记录
        const { data, error } = await supabase
          .from('user_usage')
          .select('*')
          .eq('user_id', user.id)
          .order('date', { ascending: false })
          .limit(30);
        
        if (!error && data) {
          setUsageRecords(data);
        }
      } else {
        // 获取积分交易记录
        const { data, error } = await supabase
          .from('points_transactions')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(50);
        
        if (!error && data) {
          setPointsTransactions(data);
        }
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getTypeLabel = (type: string) => {
    const labels: { [key: string]: string } = {
      'recharge': t('usage.transactionTypes.recharge'),
      'exchange': t('usage.transactionTypes.exchange'),
      'bonus': t('usage.transactionTypes.bonus'),
      'refund': t('usage.transactionTypes.refund')
    };
    return labels[type] || type;
  };

  const getTypeColor = (type: string) => {
    const colors: { [key: string]: string } = {
      'recharge': 'text-green-600',
      'exchange': 'text-red-600',
      'bonus': 'text-blue-600',
      'refund': 'text-orange-600'
    };
    return colors[type] || 'text-gray-600';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* 顶部导航 */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <button
              onClick={() => router.push('/profile')}
              className="flex items-center text-gray-700 hover:text-gray-900"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              {t('usage.backToProfile')}
            </button>
            <h1 className="text-xl font-semibold text-gray-900">{t('usage.title')}</h1>
            <div className="w-24"></div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 选项卡 */}
        <div className="bg-white rounded-t-xl shadow-sm border-b">
          <div className="flex space-x-8 px-6">
            <button
              onClick={() => {
                setActiveTab('usage');
                fetchData();
              }}
              className={`py-4 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'usage'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {t('usage.apiUsageRecords')}
            </button>
            <button
              onClick={() => {
                setActiveTab('points');
                fetchData();
              }}
              className={`py-4 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'points'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {t('usage.pointsTransactions')}
            </button>
          </div>
        </div>

        {/* 内容区域 */}
        <div className="bg-white rounded-b-xl shadow-lg">
          {loading ? (
            <div className="p-12 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">{t('usage.loading')}</p>
            </div>
          ) : (
            <>
              {/* API使用记录 */}
              {activeTab === 'usage' && (
                <div className="p-6">
                  {usageRecords.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              {t('usage.date')}
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              {t('usage.usageCount')}
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              {t('usage.remainingFree')}
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              {t('usage.apiCallDetails')}
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              {t('usage.updateTime')}
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {usageRecords.map((record) => (
                            <tr key={record.id} className="hover:bg-gray-50">
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {formatDate(record.date)}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {record.total_uses}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {record.free_uses_remaining}
                              </td>
                              <td className="px-6 py-4 text-sm text-gray-500">
                                <details className="cursor-pointer">
                                  <summary className="text-blue-600 hover:text-blue-800">
                                    {t('usage.viewCalls', { count: record.api_calls?.length || 0 })}
                                  </summary>
                                  {record.api_calls && record.api_calls.length > 0 && (
                                    <div className="mt-2 space-y-1 text-xs">
                                      {record.api_calls.slice(-5).map((call, index) => (
                                        <div key={index} className="bg-gray-50 p-2 rounded">
                                          <p>{call.endpoint || t('usage.apiCall')}</p>
                                          <p className="text-gray-400">
                                            {new Date(call.timestamp).toLocaleTimeString()}
                                          </p>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </details>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {formatDateTime(record.updated_at)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <p className="mt-2 text-gray-500">{t('usage.noRecords')}</p>
                    </div>
                  )}
                </div>
              )}

              {/* 积分交易记录 */}
              {activeTab === 'points' && (
                <div className="p-6">
                  {pointsTransactions.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              {t('usage.time')}
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              {t('usage.type')}
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              {t('usage.pointsChange')}
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              {t('usage.amount')}
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              {t('usage.description')}
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {pointsTransactions.map((transaction) => (
                            <tr key={transaction.id} className="hover:bg-gray-50">
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {formatDateTime(transaction.created_at)}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm">
                                <span className={`font-medium ${getTypeColor(transaction.type)}`}>
                                  {getTypeLabel(transaction.type)}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                <span className={transaction.points > 0 ? 'text-green-600' : 'text-red-600'}>
                                  {transaction.points > 0 ? '+' : ''}{transaction.points}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {transaction.amount ? `$${transaction.amount}` : '—'}
                              </td>
                              <td className="px-6 py-4 text-sm text-gray-500">
                                {transaction.description || '—'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <p className="mt-2 text-gray-500">{t('usage.noTransactions')}</p>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}