import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

interface LanguageDetection {
  detectedLanguage: string;
  browserLanguage: string;
  ipBasedLanguage: string;
  location?: {
    ip: string;
    country: string;
    countryCode: string;
  };
}

export function useAutoLanguage() {
  const { i18n } = useTranslation();
  const [isDetecting, setIsDetecting] = useState(true);
  const [detectionResult, setDetectionResult] = useState<LanguageDetection | null>(null);
  const [isManuallySet, setIsManuallySet] = useState(false);

  useEffect(() => {
    const detectAndSetLanguage = async () => {
      try {
        // 只在客户端访问 localStorage
        if (typeof window === 'undefined') {
          setIsDetecting(false);
          return;
        }

        // 检查是否已有用户手动设置的语言
        const savedLanguage = localStorage.getItem('userLanguage');
        const hasManuallySet = localStorage.getItem('languageManuallySet') === 'true';
        setIsManuallySet(hasManuallySet);
        
        // 如果用户手动设置过语言，使用用户的选择
        if (hasManuallySet && savedLanguage) {
          i18n.changeLanguage(savedLanguage);
          setIsDetecting(false);
          return;
        }

        // 否则自动检测语言
        const response = await fetch('/api/detect-language');
        if (response.ok) {
          const data: LanguageDetection = await response.json();
          setDetectionResult(data);
          
          console.log('Language detection result:', data);
          
          // 如果检测到的语言与当前语言不同，且是支持的语言
          const supportedLanguages = ['en', 'zh', 'ja', 'ko'];
          if (supportedLanguages.includes(data.detectedLanguage)) {
            console.log(`Switching language from ${i18n.language} to ${data.detectedLanguage}`);
            
            // 自动切换语言
            await i18n.changeLanguage(data.detectedLanguage);
            
            // 保存自动检测的语言（但不标记为手动设置）
            localStorage.setItem('autoDetectedLanguage', data.detectedLanguage);
            localStorage.setItem('languageDetectionInfo', JSON.stringify(data));
            
            // 更新HTML lang属性
            if (typeof document !== 'undefined') {
              document.documentElement.lang = data.detectedLanguage;
            }
          }
        }
      } catch (error) {
        console.error('Error auto-detecting language:', error);
      } finally {
        setIsDetecting(false);
      }
    };

    // 只在组件首次加载时检测
    if (typeof window !== 'undefined') {
      detectAndSetLanguage();
    }
  }, []); // 空依赖数组，只运行一次

  // 提供手动切换语言的方法
  const setLanguageManually = (language: string) => {
    if (typeof window === 'undefined') return;
    
    i18n.changeLanguage(language);
    localStorage.setItem('userLanguage', language);
    localStorage.setItem('languageManuallySet', 'true');
    setIsManuallySet(true);
  };

  // 重置为自动检测
  const resetToAutoDetect = async () => {
    if (typeof window === 'undefined') return;
    
    localStorage.removeItem('userLanguage');
    localStorage.removeItem('languageManuallySet');
    setIsManuallySet(false);
    
    // 重新检测
    try {
      const response = await fetch('/api/detect-language');
      if (response.ok) {
        const data: LanguageDetection = await response.json();
        await i18n.changeLanguage(data.detectedLanguage);
        localStorage.setItem('autoDetectedLanguage', data.detectedLanguage);
      }
    } catch (error) {
      console.error('Error resetting to auto-detect:', error);
    }
  };

  return {
    isDetecting,
    detectionResult,
    currentLanguage: i18n.language,
    setLanguageManually,
    resetToAutoDetect,
    isManuallySet
  };
}