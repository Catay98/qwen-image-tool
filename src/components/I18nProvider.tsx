'use client';

import { useEffect, useState } from 'react';
import { I18nextProvider } from 'react-i18next';
import i18n from '@/lib/i18n-config';

export default function I18nProvider({ children }: { children: React.ReactNode }) {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    
    // 简化语言初始化，让AutoLanguageProvider处理语言检测
    if (typeof window !== 'undefined') {
      // 检查是否有用户手动设置的语言
      const userLanguage = localStorage.getItem('userLanguage');
      const autoDetectedLanguage = localStorage.getItem('autoDetectedLanguage');
      const preferredLanguage = localStorage.getItem('preferred-language');
      
      // 优先使用用户手动设置的语言
      const languageToUse = userLanguage || autoDetectedLanguage || preferredLanguage || 'en';
      
      if (languageToUse && ['zh', 'en', 'ja', 'ko'].includes(languageToUse)) {
        i18n.changeLanguage(languageToUse);
      }
    }
  }, []);

  // 在客户端挂载前，使用默认语言（英文）
  if (!isClient) {
    return <I18nextProvider i18n={i18n}>{children}</I18nextProvider>;
  }

  return <I18nextProvider i18n={i18n}>{children}</I18nextProvider>;
}