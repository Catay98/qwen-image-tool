'use client';

import { useEffect } from 'react';
import { useAutoLanguage } from '@/hooks/useAutoLanguage';

export function AutoLanguageProvider({ children }: { children: React.ReactNode }) {
  const { isDetecting } = useAutoLanguage();

  useEffect(() => {
    // 语言检测完成后，更新HTML的lang属性
    if (!isDetecting) {
      const lang = localStorage.getItem('userLanguage') || 
                   localStorage.getItem('autoDetectedLanguage') || 
                   'en';
      document.documentElement.lang = lang;
    }
  }, [isDetecting]);

  return <>{children}</>;
}