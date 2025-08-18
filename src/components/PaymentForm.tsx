'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';

interface PaymentFormProps {
  productSlug?: string;
  productId?: string;
  buttonText?: string;
  title?: string;
  description?: string;
  price?: number;
  tier?: string;
  onSuccess?: () => void;
  currency?: string;
}

export function PaymentForm({
  productSlug = 'pro',
  productId,
  buttonText,
  title,
  description,
  price = 68,
  tier = 'pro',
  onSuccess,
  currency = 'USD',
}: PaymentFormProps) {
  const { t } = useTranslation();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Use translations for default values
  const finalButtonText = buttonText || t('payment.subscribe');
  const finalTitle = title || t('payment.upgradeTitle');
  const finalDescription = description || t('payment.upgradeDescription');

  const handleCheckout = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // 获取用户信息
      const userId = localStorage.getItem('userId');
      
      if (!userId) {
        router.push('/admin/login');
        return;
      }

      // 创建checkout会话
      const response = await fetch('/api/stripe/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': userId
        },
        body: JSON.stringify({
          amount: price,
          productName: finalTitle,
          productId: productId || productSlug,
          tier,
          successUrl: `${window.location.origin}/admin/billing?success=true`,
          cancelUrl: `${window.location.origin}/admin/billing?canceled=true`
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || t('payment.createSessionFailed'));
      }

      const data = await response.json();
      
      // 重定向到支付页面
      if (data.url) {
        window.location.href = data.url;
      }
      
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error('Error initiating checkout:', error);
      setError(error instanceof Error ? error.message : t('payment.paymentFailed'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <div className="mb-4">
        <h3 className="text-xl font-bold text-gray-900">{finalTitle}</h3>
        <p className="text-gray-600 mt-2">{finalDescription}</p>
      </div>
      
      <div className="mb-6">
        <div className="text-3xl font-bold text-gray-900">
          ${price}
          <span className="text-base font-normal text-gray-500">{t('common.perMonth')}</span>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      <button
        onClick={handleCheckout}
        disabled={isLoading}
        className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isLoading ? t('common.processing') : finalButtonText}
      </button>
    </div>
  );
}