'use client';

import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import { useState } from 'react';

export default function Footer() {
  const { t, i18n } = useTranslation();
  const language = i18n.language;
  const currentYear = new Date().getFullYear();
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const showCookieBanner = () => {
    // Trigger cookie consent banner
    const event = new CustomEvent('showCookieConsent');
    window.dispatchEvent(event);
  };

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle subscription logic here
    setSubscribed(true);
    setTimeout(() => setSubscribed(false), 3000);
  };

  const footerLinks = {
    product: [
      { href: '/', label: t('footer.home') },
      { href: '/generator', label: t('nav.generator') },
      { href: '/pricing', label: t('footer.pricing') },
      { href: '/points-shop', label: t('nav.pointsShop') },
    ],
    company: [
      { href: '/about', label: language === 'zh' ? '关于我们' : 'About Us' },
      { href: 'https://mail.google.com/mail/?view=cm&fs=1&to=media@aiqwen.cc', label: t('footer.contact'), target: '_blank' },
    ],
    resources: [
      { href: '/help', label: t('footer.support') },
    ],
    legal: [
      { href: '/disclaimer', label: language === 'zh' ? '⚠️ 免责声明' : '⚠️ Disclaimer', className: 'text-yellow-400 font-bold' },
      { href: '/privacy', label: t('footer.privacy') },
      { href: '/terms', label: t('footer.terms') },
      { href: '#', label: t('footer.cookies') },
      { href: '/refund', label: t('footer.refund') },
    ],
  };

  return (
    <footer className="relative bg-gradient-to-b from-gray-900/80 to-black/90 backdrop-blur-md border-t border-white/20">
      {/* Decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-300 rounded-full mix-blend-multiply filter blur-3xl opacity-10 dark:opacity-5"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-300 rounded-full mix-blend-multiply filter blur-3xl opacity-10 dark:opacity-5"></div>
      </div>

      <div className="relative container mx-auto px-4 py-16">

        <div className="grid grid-cols-2 md:grid-cols-5 gap-8">
          {/* Brand Section */}
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-12 h-12 bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl flex items-center justify-center shadow-lg transform hover:scale-110 transition-transform">
                <span className="text-white text-2xl">🎨</span>
              </div>
              <span className="font-bold text-2xl bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                AIQwen
              </span>
            </div>
            <p className="text-sm text-gray-300 dark:text-gray-400 mb-6 leading-relaxed">
              {language === 'zh' 
                ? '独立的AI图像生成服务平台。使用先进的AI技术创造令人惊叹的视觉效果。'
                : 'Independent AI image generation service. Create stunning visuals with advanced AI technology.'}
            </p>
            <div className="flex gap-3">
              <a
                href="https://twitter.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 bg-gradient-to-r from-purple-100 to-blue-100 dark:from-purple-900/30 dark:to-blue-900/30 rounded-xl flex items-center justify-center hover:from-purple-200 hover:to-blue-200 dark:hover:from-purple-800/30 dark:hover:to-blue-800/30 transition-all transform hover:scale-110 shadow-md"
                aria-label="Twitter"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                </svg>
              </a>
              <a
                href="https://github.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 bg-gradient-to-r from-purple-100 to-blue-100 dark:from-purple-900/30 dark:to-blue-900/30 rounded-xl flex items-center justify-center hover:from-purple-200 hover:to-blue-200 dark:hover:from-purple-800/30 dark:hover:to-blue-800/30 transition-all transform hover:scale-110 shadow-md"
                aria-label="GitHub"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"/>
                </svg>
              </a>
            </div>
          </div>

          {/* Product Links */}
          <div>
            <h3 className="font-semibold text-white mb-4">
              {t('footer.product')}
            </h3>
            <ul className="space-y-2">
              {footerLinks.product.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-gray-300 hover:text-white transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company Links */}
          <div>
            <h3 className="font-semibold text-white mb-4">
              {t('footer.company')}
            </h3>
            <ul className="space-y-2">
              {footerLinks.company.map((link) => (
                <li key={link.label}>
                  {link.disabled ? (
                    <span className="text-sm text-gray-400 dark:text-gray-600 cursor-not-allowed">
                      {link.label}
                    </span>
                  ) : link.href.startsWith('http') || link.href.startsWith('mailto:') ? (
                    <a
                      href={link.href}
                      target={link.target || '_self'}
                      rel={link.target === '_blank' ? 'noopener noreferrer' : undefined}
                      className="text-sm text-gray-300 hover:text-white transition-colors"
                    >
                      {link.label}
                    </a>
                  ) : (
                    <Link
                      href={link.href}
                      className={(link as any).className || "text-sm text-gray-300 hover:text-white transition-colors"}
                    >
                      {link.label}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </div>

          {/* Resources Links */}
          <div>
            <h3 className="font-semibold text-white mb-4">
              {t('footer.resources')}
            </h3>
            <ul className="space-y-2">
              {footerLinks.resources.map((link) => (
                <li key={link.label}>
                  {link.disabled ? (
                    <span className="text-sm text-gray-400 dark:text-gray-600 cursor-not-allowed">
                      {link.label}
                    </span>
                  ) : (
                    <Link
                      href={link.href}
                      className={(link as any).className || "text-sm text-gray-300 hover:text-white transition-colors"}
                    >
                      {link.label}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </div>

          {/* Legal Links */}
          <div>
            <h3 className="font-semibold text-white mb-4">
              {t('footer.legal')}
            </h3>
            <ul className="space-y-2">
              {footerLinks.legal.map((link) => (
                <li key={link.label}>
                  {link.label === t('footer.cookies') ? (
                    <button
                      onClick={showCookieBanner}
                      className="text-sm text-gray-300 hover:text-white transition-colors text-left"
                    >
                      {link.label}
                    </button>
                  ) : (
                    <Link
                      href={link.href}
                      className={(link as any).className || "text-sm text-gray-300 hover:text-white transition-colors"}
                    >
                      {link.label}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* 免责声明部分 */}
        <div className="mt-8 p-6 bg-yellow-500/10 border border-yellow-500/30 rounded-xl">
          <div className="flex items-start gap-3">
            <span className="text-2xl">⚠️</span>
            <div className="flex-1">
              <h4 className="font-bold text-yellow-400 mb-2">
                {language === 'zh' ? '重要声明' : 'Important Notice'}
              </h4>
              <p className="text-sm text-gray-300 leading-relaxed">
                {language === 'zh' 
                  ? '本网站 AIQwen (www.aiqwen.cc) 是一个独立运营的AI图像生成服务平台，与阿里巴巴集团、通义千问（Tongyi Qianwen）或任何其他公司均无任何关联。我们提供的服务基于开源AI技术，所有支付通过Stripe安全处理。'
                  : 'This website AIQwen (www.aiqwen.cc) is an independently operated AI image generation service platform, not affiliated with Alibaba Group, Tongyi Qianwen, or any other companies. Our services are based on open-source AI technology, with all payments securely processed through Stripe.'}
              </p>
              <Link 
                href="/disclaimer" 
                className="inline-flex items-center gap-2 text-yellow-400 hover:text-yellow-300 font-medium mt-3 transition-colors"
              >
                <span>{language === 'zh' ? '查看完整免责声明' : 'View Full Disclaimer'}</span>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="mt-8 pt-8 border-t border-gray-200 dark:border-gray-800">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                © {currentYear} AIQwen - Independent AI Service. All rights reserved.
              </p>
              <span className="text-gray-400 dark:text-gray-600">|</span>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {language === 'zh' ? '独立AI服务平台' : 'Independent AI Platform'}
              </p>
            </div>
          </div>
          
          {/* Trust Badges */}
          <div className="mt-8 flex flex-wrap justify-center items-center gap-8">
            <div className="flex items-center gap-2 text-gray-500 dark:text-gray-500">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 1a4.5 4.5 0 00-4.5 4.5V9H5a2 2 0 00-2 2v6a2 2 0 002 2h10a2 2 0 002-2v-6a2 2 0 00-2-2h-.5V5.5A4.5 4.5 0 0010 1zm3 8V5.5a3 3 0 10-6 0V9h6z" clipRule="evenodd" />
              </svg>
              <span className="text-xs font-medium">{language === 'zh' ? 'SSL 安全保护' : 'SSL Secured'}</span>
            </div>
            <div className="flex items-center gap-2 text-gray-500 dark:text-gray-500">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span className="text-xs font-medium">{language === 'zh' ? 'GDPR 合规' : 'GDPR Compliant'}</span>
            </div>
            <div className="flex items-center gap-2 text-gray-500 dark:text-gray-500">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd" />
              </svg>
              <span className="text-xs font-medium">{language === 'zh' ? '安全支付' : 'Secure Payments'}</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}