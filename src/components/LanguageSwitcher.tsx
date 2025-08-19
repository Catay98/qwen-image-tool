'use client';

import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAutoLanguage } from '@/hooks/useAutoLanguage';

const languages = [
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'zh', name: '中文', flag: '🇨🇳' },
  { code: 'ja', name: '日本語', flag: '🇯🇵' },
  { code: 'ko', name: '한국어', flag: '🇰🇷' },
];

export default function LanguageSwitcher() {
  const { i18n } = useTranslation();
  const { setLanguageManually, resetToAutoDetect, isManuallySet, detectionResult } = useAutoLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const currentLanguage = languages.find(lang => lang.code === i18n.language) || languages[0];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLanguageChange = (langCode: string) => {
    setLanguageManually(langCode);
    setIsOpen(false);
    setShowTooltip(false);
  };

  const handleAutoDetect = () => {
    resetToAutoDetect();
    setIsOpen(false);
    setShowTooltip(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors text-white"
      >
        <span className="text-lg">{currentLanguage.flag}</span>
        <span className="text-sm font-medium">{currentLanguage.name}</span>
        <svg
          className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Tooltip */}
      {showTooltip && !isOpen && detectionResult && (
        <div className="absolute bottom-full left-0 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg whitespace-nowrap">
          {isManuallySet ? (
            <span>手动选择的语言</span>
          ) : (
            <span>
              自动检测: {detectionResult.location?.country || '未知地区'}
            </span>
          )}
          <div className="absolute bottom-0 left-4 transform translate-y-1/2 rotate-45 w-2 h-2 bg-gray-900"></div>
        </div>
      )}

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute top-full right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden z-50">
          {/* Language options */}
          {languages.map((lang) => (
            <button
              key={lang.code}
              onClick={() => handleLanguageChange(lang.code)}
              className={`w-full px-4 py-3 flex items-center gap-3 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${
                lang.code === i18n.language ? 'bg-blue-50 dark:bg-blue-900/30' : ''
              }`}
            >
              <span className="text-lg">{lang.flag}</span>
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                {lang.name}
              </span>
              {lang.code === i18n.language && (
                <svg
                  className="w-4 h-4 ml-auto text-blue-600"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
              )}
            </button>
          ))}
          
          {/* Auto-detect option */}
          <div className="border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={handleAutoDetect}
              className="w-full px-4 py-3 flex items-center gap-3 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <span className="text-lg">🌐</span>
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                自动检测
              </span>
              {!isManuallySet && (
                <span className="ml-auto text-xs text-gray-500">
                  当前
                </span>
              )}
            </button>
          </div>

          {/* Detection info */}
          {detectionResult && (
            <div className="border-t border-gray-200 dark:border-gray-700 px-4 py-2 bg-gray-50 dark:bg-gray-900">
              <p className="text-xs text-gray-500 dark:text-gray-400">
                检测位置: {detectionResult.location?.country || '未知'}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                浏览器语言: {languages.find(l => l.code === detectionResult.browserLanguage)?.name || detectionResult.browserLanguage}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}