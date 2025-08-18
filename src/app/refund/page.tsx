'use client';

import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import NavBar from '@/components/NavBar';
import Footer from '@/components/Footer';

export default function RefundPage() {
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
            {t('refund.title')}
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-8">
            {t('refund.lastUpdated')}: {lastUpdated}
          </p>

          <div className="prose prose-gray dark:prose-invert max-w-none">
            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4 text-gray-900 dark:text-white">
                1. {t('refund.generalPolicy')}
              </h2>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                {t('refund.generalPolicyDesc')}
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4 text-gray-900 dark:text-white">
                2. {t('refund.subscriptionRefunds')}
              </h2>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                {t('refund.subscriptionRefundsDesc')}
              </p>
              <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300 space-y-2">
                <li>{t('refund.subscription7Days')}</li>
                <li>{t('refund.subscriptionProrated')}</li>
                <li>{t('refund.subscriptionUsage')}</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4 text-gray-900 dark:text-white">
                3. {t('refund.pointsRefunds')}
              </h2>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                {t('refund.pointsRefundsDesc')}
              </p>
              <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300 space-y-2">
                <li>{t('refund.pointsUnused')}</li>
                <li>{t('refund.points48Hours')}</li>
                <li>{t('refund.pointsNoRefund')}</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4 text-gray-900 dark:text-white">
                4. {t('refund.refundProcess')}
              </h2>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                {t('refund.refundProcessDesc')}
              </p>
              <ol className="list-decimal pl-6 text-gray-700 dark:text-gray-300 space-y-2">
                <li>{t('refund.processStep1')}</li>
                <li>{t('refund.processStep2')}</li>
                <li>{t('refund.processStep3')}</li>
                <li>{t('refund.processStep4')}</li>
              </ol>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4 text-gray-900 dark:text-white">
                5. {t('refund.exceptions')}
              </h2>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                {t('refund.exceptionsDesc')}
              </p>
              <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300 space-y-2">
                <li>{t('refund.exceptionAbuse')}</li>
                <li>{t('refund.exceptionViolation')}</li>
                <li>{t('refund.exceptionChargeback')}</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4 text-gray-900 dark:text-white">
                6. {t('refund.processingTime')}
              </h2>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                {t('refund.processingTimeDesc')}
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4 text-gray-900 dark:text-white">
                7. {t('refund.contact')}
              </h2>
              <p className="text-gray-700 dark:text-gray-300">
                {t('refund.contactDesc')}
              </p>
              <p className="text-gray-700 dark:text-gray-300 mt-2">
                {t('refund.contactEmail')}: refund@aiqwen.cc
              </p>
              <p className="text-gray-700 dark:text-gray-300 mt-2">
                {t('refund.contactInfo')}
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