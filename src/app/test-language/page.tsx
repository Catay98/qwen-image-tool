'use client';

import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

export default function TestLanguagePage() {
  const { i18n, t } = useTranslation();
  const [detectionInfo, setDetectionInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDetectionInfo = async () => {
      try {
        const response = await fetch('/api/detect-language');
        const data = await response.json();
        setDetectionInfo(data);
      } catch (error) {
        console.error('Error fetching detection info:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDetectionInfo();
  }, []);

  const testLanguageChange = (lang: string) => {
    i18n.changeLanguage(lang);
    localStorage.setItem('userLanguage', lang);
    localStorage.setItem('languageManuallySet', 'true');
  };

  const clearLanguageSettings = () => {
    localStorage.removeItem('userLanguage');
    localStorage.removeItem('languageManuallySet');
    localStorage.removeItem('autoDetectedLanguage');
    localStorage.removeItem('preferred-language');
    localStorage.removeItem('languageDetectionInfo');
    window.location.reload();
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Language Detection Test</h1>
        
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Current Settings</h2>
          <div className="space-y-2">
            <p><strong>Current Language:</strong> {i18n.language}</p>
            <p><strong>Browser Language:</strong> {navigator.language}</p>
            <p><strong>User Agent Languages:</strong> {navigator.languages?.join(', ')}</p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Detection Results</h2>
          {detectionInfo && (
            <div className="space-y-2">
              <p><strong>Detected Language:</strong> {detectionInfo.detectedLanguage}</p>
              <p><strong>Browser Language:</strong> {detectionInfo.browserLanguage}</p>
              <p><strong>IP-based Language:</strong> {detectionInfo.ipBasedLanguage}</p>
              <p><strong>Location:</strong> {detectionInfo.location?.country || 'Unknown'} ({detectionInfo.location?.countryCode})</p>
              <p><strong>IP Address:</strong> {detectionInfo.location?.ip}</p>
              <p><strong>Recommendation:</strong> {detectionInfo.recommendation}</p>
              <div>
                <strong>Browser Languages (Priority):</strong>
                <ul className="ml-4 mt-1">
                  {detectionInfo.browserLanguages?.map((lang: any, index: number) => (
                    <li key={index}>
                      {lang.code} (quality: {lang.quality})
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">LocalStorage Values</h2>
          <div className="space-y-2">
            <p><strong>userLanguage:</strong> {localStorage.getItem('userLanguage') || 'null'}</p>
            <p><strong>languageManuallySet:</strong> {localStorage.getItem('languageManuallySet') || 'null'}</p>
            <p><strong>autoDetectedLanguage:</strong> {localStorage.getItem('autoDetectedLanguage') || 'null'}</p>
            <p><strong>preferred-language:</strong> {localStorage.getItem('preferred-language') || 'null'}</p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Test Translation</h2>
          <div className="space-y-2">
            <p><strong>nav.home:</strong> {t('nav.home')}</p>
            <p><strong>nav.generator:</strong> {t('nav.generator')}</p>
            <p><strong>nav.pricing:</strong> {t('nav.pricing')}</p>
            <p><strong>nav.subscribe:</strong> {t('nav.subscribe')}</p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Actions</h2>
          <div className="flex flex-wrap gap-4">
            <button
              onClick={() => testLanguageChange('en')}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Switch to English
            </button>
            <button
              onClick={() => testLanguageChange('zh')}
              className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
            >
              Switch to Chinese
            </button>
            <button
              onClick={() => testLanguageChange('ja')}
              className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600"
            >
              Switch to Japanese
            </button>
            <button
              onClick={() => testLanguageChange('ko')}
              className="px-4 py-2 bg-indigo-500 text-white rounded hover:bg-indigo-600"
            >
              Switch to Korean
            </button>
            <button
              onClick={clearLanguageSettings}
              className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
            >
              Clear All Settings & Reload
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}