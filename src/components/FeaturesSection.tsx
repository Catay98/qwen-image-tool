'use client';

import { useTranslation } from 'react-i18next';

const features = [
  {
    icon: '🎨',
    gradient: 'from-purple-500 to-pink-500',
    titleKey: 'features.artistic.title',
    defaultTitle: 'Artistic Styles',
    descKey: 'features.artistic.desc',
    defaultDesc: 'Choose from hundreds of artistic styles, from photorealistic to abstract art'
  },
  {
    icon: '⚡',
    gradient: 'from-blue-500 to-cyan-500',
    titleKey: 'features.fast.title',
    defaultTitle: 'Lightning Fast',
    descKey: 'features.fast.desc',
    defaultDesc: 'Generate high-quality images in seconds, not minutes'
  },
  {
    icon: '🌍',
    gradient: 'from-green-500 to-teal-500',
    titleKey: 'features.multilingual.title',
    defaultTitle: 'Multilingual Support',
    descKey: 'features.multilingual.desc',
    defaultDesc: 'Perfect understanding of prompts in multiple languages'
  },
  {
    icon: '💎',
    gradient: 'from-yellow-500 to-orange-500',
    titleKey: 'features.quality.title',
    defaultTitle: 'HD Quality',
    descKey: 'features.quality.desc',
    defaultDesc: 'All images generated in stunning 1024x1024 resolution'
  },
  {
    icon: '🔒',
    gradient: 'from-red-500 to-pink-500',
    titleKey: 'features.private.title',
    defaultTitle: 'Private & Secure',
    descKey: 'features.private.desc',
    defaultDesc: 'Your creations are private and secure, with no data sharing'
  },
  {
    icon: '♾️',
    gradient: 'from-indigo-500 to-purple-500',
    titleKey: 'features.unlimited.title',
    defaultTitle: 'Unlimited Creativity',
    descKey: 'features.unlimited.desc',
    defaultDesc: 'No limits on your imagination - create anything you can dream of'
  }
];

export default function FeaturesSection() {
  const { t } = useTranslation();

  return (
    <section className="relative py-20 px-4 z-10 features-section">
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            <span className="bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              {t('features.sectionTitle', 'Why Choose Our AI')}
            </span>
          </h2>
          <p className="text-lg text-gray-200 dark:text-gray-300 max-w-2xl mx-auto">
            {t('features.sectionSubtitle', 'Experience the most advanced AI image generation technology')}
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div
              key={index}
              className="group relative p-8 glass-card rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 overflow-hidden"
              style={{
                animation: `fadeInUp 0.6s ease-out ${index * 0.1}s both`
              }}
            >
              {/* Icon Container */}
              <div className="mb-6">
                <div className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-r ${feature.gradient} shadow-lg transform transition-transform group-hover:scale-110`}>
                  <span className="text-3xl">{feature.icon}</span>
                </div>
              </div>

              {/* Content */}
              <h3 className="text-xl font-bold text-white dark:text-white mb-3">
                {t(feature.titleKey, feature.defaultTitle)}
              </h3>
              <p className="text-gray-200 dark:text-gray-300 leading-relaxed">
                {t(feature.descKey, feature.defaultDesc)}
              </p>

              {/* Decorative Element */}
              <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${feature.gradient} opacity-5 rounded-full blur-3xl group-hover:opacity-10 transition-opacity`} />
            </div>
          ))}
        </div>

        {/* Bottom CTA */}
        <div className="text-center mt-16">
          <p className="text-lg text-gray-200 dark:text-gray-300 mb-6">
            {t('features.ctaText', 'Ready to unleash your creativity?')}
          </p>
          <button
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold rounded-full hover:shadow-2xl transform transition-all duration-300 hover:scale-105"
          >
            <span>{t('features.ctaButton', 'Start Creating Now')}</span>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </button>
        </div>
      </div>

    </section>
  );
}