'use client';

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

export default function HeroSection({ onStartCreating }: { onStartCreating: () => void }) {
  const { t } = useTranslation();
  const [isVisible, setIsVisible] = useState(false);
  const [typedText, setTypedText] = useState('');
  const [currentExampleIndex, setCurrentExampleIndex] = useState(0);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  useEffect(() => {
    const examples = [
      "Create a majestic dragon with Qwen Image AI",
      "Generate cyberpunk city using Qwen Image",
      "Qwen Image portrait of a space explorer",
      "Enchanted forest created by Qwen Image",
      "Steampunk art with Qwen Image technology",
      "Underwater palace - Qwen Image masterpiece"
    ];
    
    const example = examples[currentExampleIndex];
    let charIndex = 0;
    setTypedText('');

    const typeInterval = setInterval(() => {
      if (charIndex < example.length) {
        setTypedText(example.substring(0, charIndex + 1));
        charIndex++;
      } else {
        clearInterval(typeInterval);
        setTimeout(() => {
          setCurrentExampleIndex((prev) => (prev + 1) % examples.length);
        }, 2000);
      }
    }, 50);

    return () => clearInterval(typeInterval);
  }, [currentExampleIndex]);

  const stats = [
    { value: '10M+', label: t('hero.stat1', 'Images Created') },
    { value: '500K+', label: t('hero.stat2', 'Active Users') },
    { value: '4.9★', label: t('hero.stat3', 'User Rating') }
  ];

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden hero-section">
      {/* Purple gradient overlay for Hero section */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-purple-600/10 to-blue-900/20"></div>

      {/* Main Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-4">
        <div className={`transform transition-all duration-1000 ${
          isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'
        }`}>
          
          {/* Badge */}
          <div className="flex justify-center mb-8">
            <div className="inline-flex items-center gap-2 px-6 py-3 glass-card rounded-full">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
              </span>
              <span className="text-white text-sm font-medium">
                🚀 {t('hero.badge')}
              </span>
            </div>
          </div>

          {/* Main Title */}
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold text-center mb-8">
            <span className="block text-white mb-4">
              {t('hero.title1')}
            </span>
            <span className="block relative">
              <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent animate-gradient-x bg-300%">
                {t('hero.title2')}
              </span>
              <span className="absolute -inset-1 bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 opacity-30 blur-3xl"></span>
            </span>
          </h1>

          {/* Animated Prompt Example */}
          <div className="max-w-3xl mx-auto mb-8">
            <div className="glass-card rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-white/60 text-sm">Try this prompt:</span>
              </div>
              <p className="text-white text-lg md:text-xl font-mono">
                {typedText}<span className="animate-blink">|</span>
              </p>
            </div>
          </div>

          {/* Description */}
          <p className="text-xl md:text-2xl text-white/80 text-center mb-12 max-w-3xl mx-auto leading-relaxed">
            {t('hero.description')}
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16">
            <button
              onClick={onStartCreating}
              className="group relative px-8 py-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-bold text-lg rounded-2xl shadow-2xl hover:shadow-purple-500/25 transform transition-all hover:scale-105 overflow-hidden"
            >
              <span className="relative z-10 flex items-center gap-3">
                ✨ {t('hero.startCreating')}
                <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-600 opacity-0 group-hover:opacity-100 transition-opacity"></div>
            </button>

            <button
              onClick={() => window.location.href = '/pricing'}
              className="px-8 py-4 glass-card text-white font-semibold text-lg rounded-2xl hover:bg-white/20 transform transition-all hover:scale-105"
            >
              💎 {t('hero.viewPricing')}
            </button>

            <button
              onClick={() => document.getElementById('showcase')?.scrollIntoView({ behavior: 'smooth' })}
              className="px-8 py-4 bg-transparent text-white/80 font-semibold text-lg rounded-2xl hover:text-white transform transition-all hover:scale-105"
            >
              🎨 {t('hero.viewGallery')}
            </button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-8 max-w-2xl mx-auto">
            {stats.map((stat, index) => (
              <div
                key={index}
                className={`text-center transform transition-all duration-700 delay-${index * 100} ${
                  isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'
                }`}
              >
                <div className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent mb-2">
                  {stat.value}
                </div>
                <div className="text-white/60 text-sm">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>

          {/* Scroll Indicator */}
          <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
            <svg className="w-6 h-6 text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
          </div>
        </div>
      </div>


    </section>
  );
}