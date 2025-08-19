'use client';

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { cookieManager } from '@/lib/cookieManager';

interface CookiePreferences {
  necessary: boolean;
  analytics: boolean;
  marketing: boolean;
  functional: boolean;
}

// List of known analytics and tracking scripts to block
const ANALYTICS_SCRIPTS = [
  'google-analytics.com',
  'googletagmanager.com',
  'hotjar.com',
  'clarity.ms',
  'segment.com',
  'mixpanel.com',
  'amplitude.com',
  'heap.io',
  'fullstory.com',
  'plausible.io',
  'matomo.org'
];

const MARKETING_SCRIPTS = [
  'facebook.com/tr',
  'connect.facebook.net',
  'doubleclick.net',
  'googlesyndication.com',
  'googleadservices.com',
  'google-analytics.com/collect',
  'criteo.com',
  'adsrvr.org',
  'amazon-adsystem.com',
  'bing.com/bat',
  'linkedin.com/px',
  'twitter.com/i/adsct',
  'tiktok.com/i18n/pixel'
];

const SOCIAL_SCRIPTS = [
  'platform.twitter.com',
  'connect.facebook.net',
  'platform.linkedin.com',
  'assets.pinterest.com',
  'platform.instagram.com'
];

export default function CookieConsent() {
  const { t, i18n } = useTranslation();
const language = i18n.language;
  const [showBanner, setShowBanner] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [preferences, setPreferences] = useState<CookiePreferences>({
    necessary: true, // Always true, cannot be disabled
    analytics: false,
    marketing: false,
    functional: false
  });

  // Policy version - increment this when policy changes
  const POLICY_VERSION = '1.0.0';
  const CONSENT_VALIDITY_DAYS = 180; // 6 months

  useEffect(() => {
    checkConsentStatus();
    setupScriptBlocking();
    
    // Listen for event to show cookie banner
    const handleShowCookieConsent = () => {
      setShowBanner(true);
      setShowSettings(false);
    };
    
    window.addEventListener('showCookieConsent', handleShowCookieConsent);
    
    return () => {
      window.removeEventListener('showCookieConsent', handleShowCookieConsent);
    };
  }, []);

  const checkConsentStatus = () => {
    // Skip on server side
    if (typeof window === 'undefined') {
      return;
    }
    
    const consent = localStorage.getItem('cookieConsent');
    const consentTime = localStorage.getItem('cookieConsentTime');
    const consentVersion = localStorage.getItem('cookieConsentVersion');
    
    // Check if user has made a choice
    if (!consent || !consentTime) {
      setShowBanner(true);
      blockAllNonEssential();
      return;
    }

    // Check if policy has changed
    if (consentVersion !== POLICY_VERSION) {
      localStorage.removeItem('cookieConsent');
      localStorage.removeItem('cookieConsentTime');
      localStorage.removeItem('cookieConsentVersion');
      setShowBanner(true);
      blockAllNonEssential();
      return;
    }

    // Check if consent is older than 6 months
    const consentDate = parseInt(consentTime);
    const validityPeriod = CONSENT_VALIDITY_DAYS * 24 * 60 * 60 * 1000;
    if (Date.now() - consentDate > validityPeriod) {
      localStorage.removeItem('cookieConsent');
      localStorage.removeItem('cookieConsentTime');
      localStorage.removeItem('cookieConsentVersion');
      setShowBanner(true);
      blockAllNonEssential();
      return;
    }

    // Apply saved preferences
    const savedPrefs = JSON.parse(consent);
    setPreferences(savedPrefs);
    applyPreferences(savedPrefs);
  };

  const setupScriptBlocking = () => {
    // Skip on server side
    if (typeof window === 'undefined' || typeof document === 'undefined') {
      return;
    }
    
    // Override document.createElement to block scripts
    const originalCreateElement = document.createElement;
    document.createElement = function(...args) {
      const element = originalCreateElement.apply(document, args);
      
      if (element.tagName === 'SCRIPT') {
        // Check if script should be blocked
        const consent = localStorage.getItem('cookieConsent');
        if (consent) {
          const prefs = JSON.parse(consent);
          
          element.addEventListener('beforeload', (e) => {
            const src = element.src || '';
            
            // Block analytics scripts
            if (!prefs.analytics && ANALYTICS_SCRIPTS.some(script => src.includes(script))) {
              e.preventDefault();
              console.log('Blocked analytics script:', src);
              return;
            }
            
            // Block marketing scripts
            if (!prefs.marketing && MARKETING_SCRIPTS.some(script => src.includes(script))) {
              e.preventDefault();
              console.log('Blocked marketing script:', src);
              return;
            }
            
            // Block social scripts
            if (!prefs.functional && SOCIAL_SCRIPTS.some(script => src.includes(script))) {
              e.preventDefault();
              console.log('Blocked social script:', src);
              return;
            }
          });
        }
      }
      
      return element;
    };
  };

  const blockAllNonEssential = () => {
    // Immediately block all non-essential functionality
    blockAnalytics();
    blockMarketing();
    blockFunctional();
    blockSocialMedia();
  };

  const applyPreferences = (prefs: CookiePreferences) => {
    // Update cookie manager with preferences
    cookieManager.updatePreferences(prefs);
    
    if (!prefs.analytics) {
      blockAnalytics();
    } else {
      enableAnalytics();
    }
    
    if (!prefs.marketing) {
      blockMarketing();
    } else {
      enableMarketing();
    }
    
    if (!prefs.functional) {
      blockFunctional();
    }
    
    // Always block social media if marketing is blocked
    if (!prefs.marketing) {
      blockSocialMedia();
    }
  };

  const blockAnalytics = () => {
    // Block Google Analytics
    window['ga-disable-GA_MEASUREMENT_ID'] = true;
    if (window.ga) window.ga = () => {};
    if (window.gtag) window.gtag = () => {};
    
    // Block Hotjar
    if (window.hj) window.hj = () => {};
    
    // Block Microsoft Clarity
    if (window.clarity) window.clarity = () => {};
    
    // Block Segment
    if (window.analytics) window.analytics = {
      track: () => {},
      page: () => {},
      identify: () => {}
    };
    
    // Remove analytics cookies
    const analyticsCookies = ['_ga', '_gid', '_gat', 'hjid', '_clck', '_clsk'];
    document.cookie.split(';').forEach(cookie => {
      const [name] = cookie.split('=');
      const cookieName = name.trim();
      
      if (analyticsCookies.some(ac => cookieName.startsWith(ac))) {
        // Delete cookie for all possible domains
        document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
        document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=.${window.location.hostname}`;
        document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=${window.location.hostname}`;
      }
    });
  };

  const enableAnalytics = () => {
    // Re-enable analytics if user consents
    delete window['ga-disable-GA_MEASUREMENT_ID'];
  };

  const blockMarketing = () => {
    // Block Facebook Pixel
    if (window.fbq) window.fbq = () => {};
    
    // Block Google Ads
    window['google_conversion_id'] = undefined;
    if (window.google_trackConversion) window.google_trackConversion = () => {};
    
    // Block Criteo
    if (window.criteo_q) window.criteo_q = [];
    
    // Block LinkedIn Insight
    if (window._linkedin_data_partner_ids) window._linkedin_data_partner_ids = [];
    
    // Block Twitter Pixel
    if (window.twq) window.twq = () => {};
    
    // Block TikTok Pixel
    if (window.ttq) window.ttq = () => {};
    
    // Remove marketing cookies
    const marketingCookies = ['_fbp', 'fr', '_gcl_au', '_rdt_uuid', 'IDE', '_ttp'];
    document.cookie.split(';').forEach(cookie => {
      const [name] = cookie.split('=');
      const cookieName = name.trim();
      
      if (marketingCookies.some(mc => cookieName.startsWith(mc))) {
        document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
        document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=.${window.location.hostname}`;
      }
    });
  };

  const enableMarketing = () => {
    // Marketing scripts would need to be re-initialized if consent is given
    // This typically requires a page reload
  };

  const blockFunctional = () => {
    // Remove functional cookies except essential ones
    const essentialCookies = ['cookieConsent', 'preferred-language', 'session', 'auth'];
    
    document.cookie.split(';').forEach(cookie => {
      const [name] = cookie.split('=');
      const cookieName = name.trim();
      
      if (!essentialCookies.some(ec => cookieName.includes(ec))) {
        document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
      }
    });
  };

  const blockSocialMedia = () => {
    // Block social media embeds and widgets
    const socialSelectors = [
      'iframe[src*="facebook.com"]',
      'iframe[src*="twitter.com"]',
      'iframe[src*="instagram.com"]',
      'iframe[src*="linkedin.com"]',
      'iframe[src*="youtube.com"]'
    ];
    
    socialSelectors.forEach(selector => {
      document.querySelectorAll(selector).forEach(elem => {
        elem.remove();
      });
    });
  };

  const handleAcceptAll = () => {
    const allAccepted = {
      necessary: true,
      analytics: true,
      marketing: true,
      functional: true
    };
    
    localStorage.setItem('cookieConsent', JSON.stringify(allAccepted));
    localStorage.setItem('cookieConsentTime', Date.now().toString());
    localStorage.setItem('cookieConsentVersion', POLICY_VERSION);
    setPreferences(allAccepted);
    applyPreferences(allAccepted);
    setShowBanner(false);
    setShowSettings(false);
    
    // Reload page to initialize accepted scripts
    window.location.reload();
  };

  const handleRejectAll = () => {
    const onlyNecessary = {
      necessary: true,
      analytics: false,
      marketing: false,
      functional: false
    };
    
    localStorage.setItem('cookieConsent', JSON.stringify(onlyNecessary));
    localStorage.setItem('cookieConsentTime', Date.now().toString());
    localStorage.setItem('cookieConsentVersion', POLICY_VERSION);
    setPreferences(onlyNecessary);
    applyPreferences(onlyNecessary);
    setShowBanner(false);
    setShowSettings(false);
  };

  const handleSavePreferences = () => {
    localStorage.setItem('cookieConsent', JSON.stringify(preferences));
    localStorage.setItem('cookieConsentTime', Date.now().toString());
    localStorage.setItem('cookieConsentVersion', POLICY_VERSION);
    applyPreferences(preferences);
    setShowBanner(false);
    setShowSettings(false);
    
    // Reload if enabling features that were previously disabled
    if (preferences.analytics || preferences.marketing) {
      window.location.reload();
    }
  };

  if (!showBanner) return null;

  const consentText = language === 'zh' 
    ? '根据法律，我们想用一些小文件来记录你的信息，以便提供更好的服务和广告。其中一些是网站运行必需的，但另一些（比如用于广告追踪的）需要得到你的明确许可。这是你的权利，请做出选择。'
    : 'According to the law, we would like to use some small files to record your information in order to provide better services and advertising. Some of these are necessary for the website to function, but others (such as those used for advertising tracking) require your explicit permission. This is your right, please make your choice.';

  return (
    <>
      {/* Cookie Banner */}
      <div className="fixed bottom-0 left-0 right-0 z-50 p-6 bg-white dark:bg-gray-900 border-t-2 border-gray-200 dark:border-gray-700 shadow-2xl">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
            <div className="flex-1">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3 flex items-center">
                <span className="mr-2 text-2xl">🍪</span>
                {language === 'zh' ? 'Cookie 使用说明' : 'Cookie Notice'}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                {consentText}
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
              {/* Accept All - Prominent button */}
              <button
                onClick={handleAcceptAll}
                className="px-8 py-3.5 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-bold rounded-xl hover:shadow-xl transform transition-all hover:scale-105 text-center"
              >
                {language === 'zh' ? '全部接受' : 'Accept All'}
              </button>
              
              {/* Reject All - Secondary button */}
              <button
                onClick={handleRejectAll}
                className="px-8 py-3.5 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-semibold rounded-xl hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors text-center border border-gray-300 dark:border-gray-600"
              >
                {language === 'zh' ? '全部拒绝' : 'Reject All'}
              </button>
              
              {/* Customize - Secondary button */}
              <button
                onClick={() => setShowSettings(!showSettings)}
                className="px-8 py-3.5 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-semibold rounded-xl hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors text-center border border-gray-300 dark:border-gray-600"
              >
                {language === 'zh' ? '自定义偏好' : 'Customize'} ⚙️
              </button>
            </div>
          </div>

          {/* Expandable Settings */}
          {showSettings && (
            <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
              <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
                {language === 'zh' ? '自定义Cookie偏好设置' : 'Customize Cookie Preferences'}
              </h4>
              
              <div className="space-y-4">
                {/* Necessary Cookies - Always On */}
                <div className="flex items-center justify-between p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                  <div className="flex-1">
                    <h5 className="font-semibold text-gray-900 dark:text-white mb-1">
                      {language === 'zh' ? '必要Cookie' : 'Necessary Cookies'}
                      <span className="ml-2 text-xs bg-green-600 text-white px-2 py-1 rounded-full">
                        {language === 'zh' ? '始终启用' : 'Always Active'}
                      </span>
                    </h5>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {language === 'zh' 
                        ? '维持登录状态、购物车功能、安全认证以及记住您的Cookie选择。这些是网站正常运行所必需的。'
                        : 'Maintain login status, shopping cart functionality, security authentication, and remember your cookie choices. These are essential for the website to function properly.'}
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={true}
                    disabled
                    className="w-6 h-6 text-green-600 cursor-not-allowed opacity-50"
                  />
                </div>

                {/* Analytics Cookies */}
                <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="flex-1">
                    <h5 className="font-semibold text-gray-900 dark:text-white mb-1">
                      {language === 'zh' ? '分析Cookie' : 'Analytics Cookies'}
                    </h5>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {language === 'zh'
                        ? '包括Google Analytics、Hotjar等工具，用于统计流量和分析用户行为，帮助我们改进网站。'
                        : 'Including Google Analytics, Hotjar and other tools for traffic statistics and user behavior analysis to help us improve the website.'}
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={preferences.analytics}
                      onChange={(e) => setPreferences({...preferences, analytics: e.target.checked})}
                      className="sr-only peer"
                    />
                    <div className="w-14 h-7 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 dark:peer-focus:ring-purple-800 rounded-full peer dark:bg-gray-600 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-purple-600"></div>
                  </label>
                </div>

                {/* Marketing Cookies */}
                <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="flex-1">
                    <h5 className="font-semibold text-gray-900 dark:text-white mb-1">
                      {language === 'zh' ? '营销Cookie' : 'Marketing Cookies'}
                    </h5>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {language === 'zh'
                        ? '包括Meta Pixel、Google Ads、Criteo等，用于广告投放和再营销，展示个性化广告。'
                        : 'Including Meta Pixel, Google Ads, Criteo, etc., for advertising and remarketing to show personalized ads.'}
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={preferences.marketing}
                      onChange={(e) => setPreferences({...preferences, marketing: e.target.checked})}
                      className="sr-only peer"
                    />
                    <div className="w-14 h-7 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 dark:peer-focus:ring-purple-800 rounded-full peer dark:bg-gray-600 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-purple-600"></div>
                  </label>
                </div>

                {/* Functional Cookies */}
                <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="flex-1">
                    <h5 className="font-semibold text-gray-900 dark:text-white mb-1">
                      {language === 'zh' ? '功能性Cookie' : 'Functional Cookies'}
                    </h5>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {language === 'zh'
                        ? '记住您的偏好设置，如主题颜色、布局等个性化选项，以及社交媒体插件。'
                        : 'Remember your preferences such as theme color, layout and other personalization options, as well as social media plugins.'}
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={preferences.functional}
                      onChange={(e) => setPreferences({...preferences, functional: e.target.checked})}
                      className="sr-only peer"
                    />
                    <div className="w-14 h-7 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 dark:peer-focus:ring-purple-800 rounded-full peer dark:bg-gray-600 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-purple-600"></div>
                  </label>
                </div>
              </div>

              <div className="mt-6 flex gap-3 justify-end">
                <button
                  onClick={handleSavePreferences}
                  className="px-6 py-2.5 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold rounded-lg hover:shadow-lg transition-all"
                >
                  {language === 'zh' ? '保存偏好设置' : 'Save Preferences'}
                </button>
              </div>

              {/* Privacy Links */}
              <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 text-xs text-gray-500 dark:text-gray-400">
                <a href="/privacy" className="hover:text-purple-600 mr-4">
                  {language === 'zh' ? '隐私政策' : 'Privacy Policy'}
                </a>
                <a href="/terms" className="hover:text-purple-600">
                  {language === 'zh' ? '服务条款' : 'Terms of Service'}
                </a>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}