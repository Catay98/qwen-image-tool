"use client";

import NavBar from "@/components/NavBar";
import HeroSection from "@/components/HeroSection";
import FeaturesSection from "@/components/FeaturesSection";
import ShowcaseGallery from "@/components/ShowcaseGallery";
import Footer from "@/components/Footer";
import TranslationWrapper from "@/components/TranslationWrapper";
import DisclaimerModal from "@/components/DisclaimerModal";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";

export default function HomePage() {
  const { t, i18n } = useTranslation();
  const language = i18n.language;
  const router = useRouter();

  const handleStartCreating = () => {
    router.push('/generator');
  };

  return (
    <>
      {/* 免责声明弹窗 */}
      <DisclaimerModal />
      
      <main className="min-h-screen">
        <NavBar />
        
        {/* Hero Section */}
        <HeroSection onStartCreating={handleStartCreating} />

        {/* Features Section */}
        <FeaturesSection />

        {/* Showcase Gallery */}
        <div id="showcase">
          <ShowcaseGallery />
        </div>

        {/* CTA Section */}
        <section className="py-20 px-4 bg-gradient-to-r from-purple-600 to-blue-600">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              {t('features.ctaText')}
            </h2>
            <p className="text-xl text-white/90 mb-8">
              {language === 'zh' 
                ? '加入数千位创作者，每天使用 Qwen Image 将创意变为现实'
                : 'Join thousands of creators using Qwen Image every day to bring their ideas to life'}
            </p>
            <TranslationWrapper className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={handleStartCreating}
                className="group px-8 py-4 bg-white text-purple-600 rounded-2xl font-semibold text-lg hover:shadow-2xl transition-all transform hover:scale-105 flex items-center justify-center gap-3"
              >
                <span>🚀</span>
                <span>{t('hero.startCreating')}</span>
                <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </button>
              
              <button
                onClick={() => router.push('/pricing')}
                className="px-8 py-4 bg-transparent border-2 border-white text-white rounded-2xl font-semibold text-lg hover:bg-white/10 transition-all transform hover:scale-105"
              >
                <span className="mr-2">💎</span>
                {t('hero.viewPricing')}
              </button>
            </TranslationWrapper>
          </div>
        </section>

        {/* Footer */}
        <Footer />
      </main>

      {/* Cookie Consent - Temporarily disabled due to translation conflict */}
      {/* <CookieConsent /> */}
    </>
  );
}