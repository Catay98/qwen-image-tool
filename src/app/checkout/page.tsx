'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useTranslation } from 'react-i18next';

function CheckoutContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const { t } = useTranslation();
  const [processing, setProcessing] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  
  const success = searchParams.get('success');
  const canceled = searchParams.get('canceled');
  const sessionId = searchParams.get('session_id');

  useEffect(() => {
    console.log('Checkout params:', { success, canceled, sessionId });
    if (success === 'true' && sessionId) {
      console.log('Processing payment success...');
      handlePaymentSuccess();
      
      // 添加后备跳转机制 - 如果5秒后还没跳转，强制跳转
      const fallbackTimer = setTimeout(() => {
        console.log('Fallback redirect triggered');
        window.location.href = '/';
      }, 5000);
      
      return () => clearTimeout(fallbackTimer);
    } else if (canceled === 'true') {
      setMessage(t('checkout.cancelled'));
      setTimeout(() => {
        router.push('/');
      }, 3000);
    }
  }, [success, canceled, sessionId]);

  const handlePaymentSuccess = async () => {
    if (!sessionId) {
      console.log('No sessionId found');
      return;
    }
    
    console.log('Starting payment success handling with sessionId:', sessionId);
    setProcessing(true);
    setMessage(t('checkout.processing'));

    try {
      // 调用后端API处理支付成功
      const response = await fetch('/api/stripe/handle-success', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ sessionId }),
      });

      console.log('Response status:', response.status);
      const data = await response.json();
      console.log('Response data:', data);

      if (response.ok && data.success) {
        setMessage(`${data.message || t('checkout.success')} ${t('checkout.redirecting')}`);
        setProcessing(false); // 停止处理状态
        
        console.log('Payment successful, redirecting in 2 seconds...');
        // 2秒后跳转到首页
        setTimeout(() => {
          console.log('Redirecting to homepage...');
          window.location.href = '/'; // 使用硬跳转确保页面刷新
        }, 2000);
      } else {
        console.error('Payment processing failed:', data.error);
        setMessage(data.error || 'Payment processing failed, please contact support.');
        setProcessing(false);
      }
    } catch (error) {
      console.error('Error processing payment:', error);
      setMessage('Payment processing error, please contact support.');
      setProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8">
        <div className="text-center">
          {processing ? (
            <>
              <div className="mb-6">
                <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-blue-200 border-t-blue-600"></div>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">{t('checkout.processing')}</h2>
              <p className="text-gray-600">{message || t('checkout.confirming')}</p>
            </>
          ) : success === 'true' ? (
            <>
              <div className="mb-6">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                  <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">{t('checkout.success')}</h2>
              <p className="text-gray-600 mb-6">{message}</p>
              <div className="bg-blue-50 rounded-lg p-4">
                <p className="text-sm text-blue-800">{t('checkout.pointsAdded')}</p>
              </div>
            </>
          ) : canceled === 'true' ? (
            <>
              <div className="mb-6">
                <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mx-auto">
                  <svg className="w-10 h-10 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">{t('checkout.cancelled')}</h2>
              <p className="text-gray-600 mb-6">{message}</p>
              <button
                onClick={() => router.push('/recharge')}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                {t('checkout.backToRecharge')}
              </button>
            </>
          ) : (
            <>
              <div className="mb-6">
                <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto">
                  <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">{t('checkout.invalid')}</h2>
              <p className="text-gray-600 mb-6">{t('checkout.invalidParams')}</p>
              <button
                onClick={() => router.push('/')}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                {t('checkout.backToHome')}
              </button>
            </>
          )}
        </div>

        {!processing && (
          <div className="mt-8 pt-6 border-t border-gray-200">
            <p className="text-xs text-gray-500 text-center">
              {t('checkout.contactSupport')}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading checkout information...</p>
        </div>
      </div>
    }>
      <CheckoutContent />
    </Suspense>
  );
}