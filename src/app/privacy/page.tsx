'use client';

import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import NavBar from '@/components/NavBar';
import Footer from '@/components/Footer';

export default function PrivacyPage() {
  const { t } = useTranslation();
  const lastUpdated = '2024-01-01';

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      {/* Navigation */}
      <div className="sticky top-0 z-40 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-800">
        <div className="container mx-auto px-4">
          <NavBar />
        </div>
      </div>

      {/* Content */}
      <main className="py-20 px-4">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold mb-4 text-gray-900 dark:text-white">
            {t('privacy.title')}
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-8">
            {t('privacy.lastUpdated')}: {lastUpdated}
          </p>

          <div className="prose prose-gray dark:prose-invert max-w-none">
            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4 text-gray-900 dark:text-white">
                1. {t('privacy.informationCollection')}
              </h2>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                {t('privacy.informationCollectionDesc')}
              </p>
              <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300 space-y-2">
                <li>{t('privacy.accountInfo')}</li>
                <li>{t('privacy.generatedContent')}</li>
                <li>{t('privacy.usageData')}</li>
                <li>{t('privacy.paymentInfo')}</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4 text-gray-900 dark:text-white">
                2. {t('privacy.useOfInformation')}
              </h2>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                {t('privacy.useOfInformationDesc')}
              </p>
              <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300 space-y-2">
                <li>{t('privacy.provideServices')}</li>
                <li>{t('privacy.processTransactions')}</li>
                <li>{t('privacy.sendNotices')}</li>
                <li>{t('privacy.respondQuestions')}</li>
                <li>{t('privacy.analyzeUsage')}</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4 text-gray-900 dark:text-white">
                3. {t('privacy.dataProtection')}
              </h2>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                {t('privacy.dataProtectionDesc')}
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4 text-gray-900 dark:text-white">
                4. {t('privacy.cookies')}
              </h2>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                {t('privacy.cookiesDesc')}
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4 text-gray-900 dark:text-white">
                5. {t('privacy.userRights')}
              </h2>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                {t('privacy.userRightsDesc')}
              </p>
              <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300 space-y-2">
                <li>{t('privacy.accessData')}</li>
                <li>{t('privacy.correctData')}</li>
                <li>{t('privacy.deleteData')}</li>
                <li>{t('privacy.objectProcessing')}</li>
                <li>{t('privacy.dataPortability')}</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4 text-gray-900 dark:text-white">
                6. {t('privacy.contact')}
              </h2>
              <p className="text-gray-700 dark:text-gray-300">
                {t('privacy.contactDesc')}
              </p>
              <p className="text-gray-700 dark:text-gray-300 mt-2">
                {t('privacy.contactEmail')}: media@aiqwen.cc
              </p>
            </section>
          </div>
        </div>
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}