'use client';

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

export default function DisclaimerModal() {
  const [isOpen, setIsOpen] = useState(false);
  const { i18n } = useTranslation();
  const language = i18n.language;

  useEffect(() => {
    // 检查是否已经显示过免责声明
    const hasSeenDisclaimer = localStorage.getItem('hasSeenDisclaimer');
    if (!hasSeenDisclaimer) {
      setIsOpen(true);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem('hasSeenDisclaimer', 'true');
    setIsOpen(false);
  };

  const handleClose = () => {
    localStorage.setItem('hasSeenDisclaimer', 'true');
    setIsOpen(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      {/* 背景遮罩 */}
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={handleClose}></div>
      
      {/* 弹窗内容 */}
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in duration-300">
        {/* 关闭按钮 */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 transition-colors"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="p-8">
          {/* 警告图标 */}
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center">
              <span className="text-4xl">⚠️</span>
            </div>
          </div>

          {/* 标题 */}
          <h2 className="text-2xl font-bold text-center mb-6 text-gray-900">
            {language === 'zh' ? '重要声明' : 'Important Notice'}
          </h2>

          {/* 内容 */}
          <div className="space-y-4 text-gray-700">
            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
              <p className="font-semibold mb-2">
                {language === 'zh' ? '网站独立性声明' : 'Website Independence Statement'}
              </p>
              <p>
                {language === 'zh' 
                  ? '本网站 www.aiqwen.cc 是一个完全独立的AI图像生成服务平台，与阿里巴巴、通义千问或任何其他公司均无关联。'
                  : 'This website www.aiqwen.cc is a completely independent AI image generation service platform, not affiliated with Alibaba, Tongyi Qianwen, or any other companies.'}
              </p>
            </div>

            <div className="bg-blue-50 border-l-4 border-blue-400 p-4">
              <p className="font-semibold mb-2">
                {language === 'zh' ? '服务说明' : 'Service Description'}
              </p>
              <p>
                {language === 'zh'
                  ? '我们提供基于开源AI模型的图像生成服务。所有支付均通过正规的Stripe支付平台安全处理。'
                  : 'We provide image generation services based on open-source AI models. All payments are securely processed through the legitimate Stripe payment platform.'}
              </p>
            </div>

            <div className="bg-green-50 border-l-4 border-green-400 p-4">
              <p className="font-semibold mb-2">
                {language === 'zh' ? '安全保证' : 'Security Guarantee'}
              </p>
              <p>
                {language === 'zh'
                  ? '本网站绝不会索取您的密码、银行账户或其他敏感信息。我们仅通过Stripe收集必要的支付信息。'
                  : 'This website will never ask for your passwords, bank accounts, or other sensitive information. We only collect necessary payment information through Stripe.'}
              </p>
            </div>

            <div className="text-sm text-gray-600 text-center mt-6">
              <p>
                {language === 'zh' 
                  ? '如有任何疑问，请联系：support@aiqwen.cc'
                  : 'For any questions, please contact: support@aiqwen.cc'}
              </p>
            </div>
          </div>

          {/* 按钮 */}
          <div className="flex gap-4 mt-8">
            <button
              onClick={handleAccept}
              className="flex-1 bg-blue-600 text-white py-3 px-6 rounded-xl font-semibold hover:bg-blue-700 transition-colors"
            >
              {language === 'zh' ? '我已了解并同意' : 'I Understand and Agree'}
            </button>
            <a
              href="/disclaimer"
              className="flex-1 bg-gray-100 text-gray-700 py-3 px-6 rounded-xl font-semibold hover:bg-gray-200 transition-colors text-center"
            >
              {language === 'zh' ? '查看完整声明' : 'View Full Disclaimer'}
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}