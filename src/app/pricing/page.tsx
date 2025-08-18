'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import NavBar from '@/components/NavBar';
import Footer from '@/components/Footer';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { translateDatabaseContent, translatePlanName, translatePlanDescription } from '@/lib/translateContent';

interface SubscriptionPlan {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  currency: string;
  interval: string;
  features: string[];
  limits: any;
  sortOrder: number;
}

interface PointsPackage {
  id: string;
  name: string;
  points: number;
  price: number;
  bonus_points: number;
  currency: string;
  description: string;
  popular: boolean;
}

export default function PricingPage() {
  const { t, i18n } = useTranslation();
  const language = i18n.language as 'en' | 'zh';
  const { user } = useAuth();
  const router = useRouter();
  const [subscriptionPlans, setSubscriptionPlans] = useState<SubscriptionPlan[]>([]);
  const [pointsPackages, setPointsPackages] = useState<PointsPackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'subscription' | 'points'>('subscription');

  useEffect(() => {
    fetchPricingData();
  }, []);

  const fetchPricingData = async () => {
    try {
      const lang = localStorage.getItem('i18nextLng') || 'zh';
      const headers = {
        'Accept-Language': lang
      };
      
      const [plansRes, pointsRes] = await Promise.all([
        fetch('/api/plans', { headers }),
        fetch('/api/points/packages', { headers })
      ]);

      if (plansRes.ok) {
        const plansData = await plansRes.json();
        setSubscriptionPlans(plansData.plans || []);
      }

      if (pointsRes.ok) {
        const pointsData = await pointsRes.json();
        setPointsPackages(pointsData.packages || []);
      }
    } catch (error) {
      console.error('Error fetching pricing data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectPlan = (planId: string) => {
    if (!user) {
      router.push('/?login=true');
    } else {
      router.push(`/recharge?plan=${planId}`);
    }
  };

  const handleSelectPointsPackage = (packageId: string) => {
    if (!user) {
      router.push('/?login=true');
    } else {
      router.push(`/points-shop?package=${packageId}`);
    }
  };

  return (
    <div className="min-h-screen">
      <NavBar />

      <section className="pt-20 pb-12 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-purple-100 dark:bg-purple-900/30 rounded-full mb-6">
            <span className="text-purple-600 dark:text-purple-400 font-semibold">
              ✨ Powered by Qwen Image AI
            </span>
          </div>
          
          <h1 className="text-5xl md:text-6xl font-bold mb-6">
            <span className="bg-gradient-to-r from-purple-600 via-blue-600 to-purple-600 bg-clip-text text-transparent animate-gradient bg-300%">
              {t('pricing.title', 'Choose Your Qwen Image Plan')}
            </span>
          </h1>
          <p className="text-xl text-gray-200 dark:text-gray-300 mb-8 max-w-3xl mx-auto">
            {t('pricing.subtitle', 'Unlock the full potential of Qwen Image AI with our flexible pricing options. Generate stunning images with Qwen Image technology.')}
          </p>

          <div className="inline-flex rounded-2xl bg-white/10 dark:bg-gray-800 backdrop-blur-sm shadow-xl p-1 mb-8 border border-white/20 dark:border-gray-700">
            <button
              onClick={() => setActiveTab('subscription')}
              className={`px-8 py-3 rounded-xl font-semibold transition-all ${
                activeTab === 'subscription'
                  ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg'
                  : 'text-gray-300 dark:text-gray-400 hover:text-white dark:hover:text-white'
              }`}
            >
              📅 {t('pricing.subscriptions', 'Subscriptions')}
            </button>
            <button
              onClick={() => setActiveTab('points')}
              className={`px-8 py-3 rounded-xl font-semibold transition-all ${
                activeTab === 'points'
                  ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg'
                  : 'text-gray-300 dark:text-gray-400 hover:text-white dark:hover:text-white'
              }`}
            >
              💎 {t('pricing.pointsPackages', 'Points Packages')}
            </button>
          </div>

        </div>
      </section>

      {loading ? (
        <div className="flex justify-center items-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
        </div>
      ) : (
        <>
          {activeTab === 'subscription' && (
            <section className="pb-20 px-4">
              <div className="max-w-7xl mx-auto">
                <div className={`grid ${subscriptionPlans.length === 0 ? 'grid-cols-1' : subscriptionPlans.length === 1 ? 'md:grid-cols-1 max-w-md mx-auto' : subscriptionPlans.length === 2 ? 'md:grid-cols-2 max-w-4xl mx-auto' : 'md:grid-cols-3'} gap-8`}>
                  {subscriptionPlans.length === 0 ? (
                    <div className="col-span-full text-center py-12">
                      <p className="text-gray-400 text-lg">No subscription plans available at the moment</p>
                      <p className="text-gray-500 text-sm mt-2">Please check back later or contact support</p>
                    </div>
                  ) : (
                    subscriptionPlans.map((plan, index) => {
                    const isPopular = index === 0;
                    const displayPrice = plan.price;

                    return (
                      <div
                        key={plan.id}
                        className={`relative rounded-3xl p-8 backdrop-blur-sm transition-all transform hover:scale-105 border ${
                          isPopular
                            ? 'bg-gradient-to-br from-purple-600 to-blue-600 text-white shadow-2xl scale-105 border-purple-400/50'
                            : 'bg-white/10 dark:bg-gray-800/50 shadow-xl border-white/20 dark:border-gray-700'
                        }`}
                      >
                        {isPopular && (
                          <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                            <span className="bg-gradient-to-r from-yellow-400 to-orange-400 text-black px-4 py-1 rounded-full text-sm font-bold">
                              {t('pricing.mostPopular')}
                            </span>
                          </div>
                        )}

                        <h3 className={`text-2xl font-bold mb-2 ${isPopular ? 'text-white' : 'text-white dark:text-white'}`}>
                          {translatePlanName(plan.slug || plan.name, language)}
                        </h3>
                        <p className={`text-sm mb-4 ${isPopular ? 'text-white/80' : 'text-gray-200 dark:text-gray-400'}`}>
                          {translatePlanDescription(plan.description, language)}
                        </p>

                        <div className="mb-6">
                          <span className={`text-5xl font-bold ${isPopular ? 'text-white' : 'text-white dark:text-white'}`}>
                            ${displayPrice}
                          </span>
                          <span className={`text-lg ml-2 ${isPopular ? 'text-white/80' : 'text-gray-300 dark:text-gray-400'}`}>
                            /{translateDatabaseContent(plan.interval || 'month', language)}
                          </span>
                        </div>

                        <ul className="space-y-3 mb-8">
                          {plan.features.map((feature, idx) => (
                            <li key={idx} className="flex items-start gap-3">
                              <svg className={`w-5 h-5 mt-0.5 flex-shrink-0 ${isPopular ? 'text-white' : 'text-green-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                              <span className={`text-sm ${isPopular ? 'text-white' : 'text-gray-200 dark:text-gray-300'}`}>
                                {translateDatabaseContent(feature, language).replace('image', 'Qwen Image')}
                              </span>
                            </li>
                          ))}
                        </ul>

                        <button
                          onClick={() => handleSelectPlan(plan.id)}
                          className={`w-full py-4 rounded-2xl font-semibold transition-all transform hover:scale-105 ${
                            isPopular
                              ? 'bg-white text-purple-600 hover:bg-gray-100'
                              : 'bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:shadow-lg'
                          }`}
                        >
                          {t('pricing.getStarted')}
                        </button>
                      </div>
                    );
                  }))}
                </div>
              </div>
            </section>
          )}

          {activeTab === 'points' && (
            <section className="pb-20 px-4">
              <div className="max-w-7xl mx-auto">
                <div className="text-center mb-8">
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                    💎 Qwen Image Points Packages
                  </h3>
                  <p className="text-gray-200 dark:text-gray-400">
                    Purchase points to use Qwen Image AI anytime. 1 point = 1 Qwen Image generation
                  </p>
                </div>
                <div className="grid md:grid-cols-3 lg:grid-cols-4 gap-6">
                  {pointsPackages.length > 0 ? (
                    pointsPackages.map((pkg) => (
                      <div
                        key={pkg.id}
                        className={`relative rounded-2xl p-6 backdrop-blur-sm transition-all transform hover:scale-105 border ${
                          pkg.popular
                            ? 'bg-gradient-to-br from-purple-600 to-blue-600 text-white shadow-2xl border-purple-400/50'
                            : 'bg-white/10 dark:bg-gray-800/50 shadow-xl border-white/20 dark:border-gray-700'
                        }`}
                      >
                        {pkg.popular && (
                          <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                            <span className="bg-gradient-to-r from-yellow-400 to-orange-400 text-black px-3 py-1 rounded-full text-xs font-bold">
                              {t('pricing.bestValue')}
                            </span>
                          </div>
                        )}
                        
                        <h4 className={`text-lg font-bold mb-2 ${pkg.popular ? 'text-white' : 'text-white dark:text-white'}`}>
                          {translateDatabaseContent(pkg.name, language)}
                        </h4>
                        
                        <div className="mb-4">
                          <div className={`text-3xl font-bold ${pkg.popular ? 'text-white' : 'text-purple-600'}`}>
                            {pkg.points + (pkg.bonus_points || 0)}
                          </div>
                          <div className={`text-sm ${pkg.popular ? 'text-white/80' : 'text-gray-300 dark:text-gray-400'}`}>
                            {language === 'zh' ? 'Qwen Image 积分' : 'Qwen Image Credits'}
                          </div>
                          {pkg.bonus_points > 0 && (
                            <div className="mt-1">
                              <span className="text-xs bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 px-2 py-1 rounded-full">
                                +{pkg.bonus_points} {language === 'zh' ? '赠送' : 'bonus'}
                              </span>
                            </div>
                          )}
                        </div>
                        
                        <div className="mb-4">
                          <span className={`text-2xl font-bold ${pkg.popular ? 'text-white' : 'text-white dark:text-white'}`}>
                            ${pkg.price}
                          </span>
                        </div>
                        
                        {pkg.description && (
                          <p className={`text-sm mb-4 ${pkg.popular ? 'text-white/80' : 'text-gray-200 dark:text-gray-400'}`}>
                            {translateDatabaseContent(pkg.description, language)}
                          </p>
                        )}
                        
                        <button
                          onClick={() => handleSelectPointsPackage(pkg.id)}
                          className={`w-full py-3 rounded-xl font-semibold transition-all ${
                            pkg.popular
                              ? 'bg-white text-purple-600 hover:bg-gray-100'
                              : 'bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:shadow-lg'
                          }`}
                        >
                          {t('pricing.buyNow')}
                        </button>
                      </div>
                    ))
                  ) : (
                    <div className="col-span-full text-center py-8">
                      <p className="text-gray-400">No points packages available at the moment</p>
                    </div>
                  )}
                </div>
              </div>
            </section>
          )}
        </>
      )}

      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12 text-white dark:text-white">
            {t('pricing.faq', 'Frequently Asked Questions about Qwen Image')}
          </h2>
          <div className="space-y-6">
            <details className="group bg-white/10 dark:bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 border border-white/20 dark:border-gray-700">
              <summary className="cursor-pointer font-semibold text-white dark:text-white">
                {t('pricing.faqWhatIsQwen')}
              </summary>
              <p className="mt-3 text-gray-200 dark:text-gray-400">
                {t('pricing.faqWhatIsQwenAnswer')}
              </p>
            </details>
            <details className="group bg-white/10 dark:bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 border border-white/20 dark:border-gray-700">
              <summary className="cursor-pointer font-semibold text-white dark:text-white">
                {t('pricing.faqGenerations')}
              </summary>
              <p className="mt-3 text-gray-200 dark:text-gray-400">
                {t('pricing.faqGenerationsAnswer')}
              </p>
            </details>
            <details className="group bg-white/10 dark:bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 border border-white/20 dark:border-gray-700">
              <summary className="cursor-pointer font-semibold text-white dark:text-white">
                {t('pricing.faqCommercial')}
              </summary>
              <p className="mt-3 text-gray-200 dark:text-gray-400">
                {t('pricing.faqCommercialAnswer')}
              </p>
            </details>
            <details className="group bg-white/10 dark:bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 border border-white/20 dark:border-gray-700">
              <summary className="cursor-pointer font-semibold text-white dark:text-white">
                {t('pricing.faqDifference')}
              </summary>
              <p className="mt-3 text-gray-200 dark:text-gray-400">
                {t('pricing.faqDifferenceAnswer')}
              </p>
            </details>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}