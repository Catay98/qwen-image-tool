'use client';

import { useEffect, useState } from 'react';
import { I18nextProvider } from 'react-i18next';
import i18n from '@/lib/i18n-config';

export default function I18nProvider({ children }: { children: React.ReactNode }) {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    
    // 只在客户端进行语言检测
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('preferred-language');
      
      if (saved === 'zh' || saved === 'en') {
        // 使用保存的语言偏好
        i18n.changeLanguage(saved);
      } else {
        // 检测浏览器语言
        const browserLang = navigator.language || (navigator as any).userLanguage || '';
        const langCode = browserLang.toLowerCase();
        
        let detectedLang = 'en';
        if (langCode.startsWith('zh') || 
            langCode.startsWith('cn') || 
            langCode === 'chinese' ||
            langCode.includes('hans') || 
            langCode.includes('hant')) {
          detectedLang = 'zh';
        }
        
        // 保存检测到的语言
        localStorage.setItem('preferred-language', detectedLang);
        i18n.changeLanguage(detectedLang);
      }
    }
  }, []);

  // 在客户端挂载前，使用默认语言（英文）
  if (!isClient) {
    return <I18nextProvider i18n={i18n}>{children}</I18nextProvider>;
  }

  return <I18nextProvider i18n={i18n}>{children}</I18nextProvider>;
}