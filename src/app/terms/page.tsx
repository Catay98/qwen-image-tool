'use client';

import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import NavBar from '@/components/NavBar';
import Footer from '@/components/Footer';

export default function TermsPage() {
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
            {t('terms.title')}
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-8">
            {t('terms.lastUpdated')}: {lastUpdated}
          </p>

          <div className="prose prose-gray dark:prose-invert max-w-none">
            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4 text-gray-900 dark:text-white">
                1. {t('terms.acceptance')}
              </h2>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                {t('terms.acceptanceDesc')}
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4 text-gray-900 dark:text-white">
                2. {t('terms.useLicense')}
              </h2>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                {t('terms.useLicenseDesc')}
              </p>
              <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300 space-y-2">
                <li>{t('terms.accessServices')}</li>
                <li>{t('terms.createImages')}</li>
                <li>{t('terms.useImages')}</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4 text-gray-900 dark:text-white">
                3. {t('terms.userResponsibilities')}
              </h2>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                {t('terms.userResponsibilitiesDesc')}
              </p>
              <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300 space-y-2">
                <li>{t('terms.noIllegalContent')}</li>
                <li>{t('terms.noIPInfringement')}</li>
                <li>{t('terms.noLawViolation')}</li>
                <li>{t('terms.noBypass')}</li>
                <li>{t('terms.noResale')}</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4 text-gray-900 dark:text-white">
                4. {t('terms.intellectualProperty')}
              </h2>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                {t('terms.intellectualPropertyDesc')}
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4 text-gray-900 dark:text-white">
                5. {t('terms.payment')}
              </h2>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                {t('terms.paymentDesc')}
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4 text-gray-900 dark:text-white">
                6. {t('terms.liability')}
              </h2>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                {t('terms.liabilityDesc')}
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4 text-gray-900 dark:text-white">
                7. {t('terms.termination')}
              </h2>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                {t('terms.terminationDesc')}
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4 text-gray-900 dark:text-white">
                8. {t('terms.changes')}
              </h2>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                {t('terms.changesDesc')}
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4 text-gray-900 dark:text-white">
                9. {t('terms.contact')}
              </h2>
              <p className="text-gray-700 dark:text-gray-300">
                {t('terms.contactDesc')}
              </p>
              <p className="text-gray-700 dark:text-gray-300 mt-2">
                {t('terms.contactEmail')}: media@aiqwen.cc
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