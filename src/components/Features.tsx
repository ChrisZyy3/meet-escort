import type { FC } from 'react';
import { useTranslation } from '../i18n';

/**
 * Features Component
 * 
 * Bundles the "How it works" sequence guide with the "9 reasons to use" list
 * using highly responsive grid column structures.
 * 
 * Written in 100% English. Annotations in code blocks are retained in bilingual format.
 */
export const Features: FC = () => {
  const { t } = useTranslation();

  return (
    <div className="bg-white">
      {/* 1. How It Works Section */}
      {/* 运作流程 */}
      <section data-reveal className="py-12 md:py-20 border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-extrabold text-neutral-dark mb-4">
            {t('features.howItWorks')}
          </h2>
          <p className="text-neutral-light font-medium max-w-xl mx-auto mb-12">
            {t('features.howItWorksDescription')}
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Step 1 */}
            {/* 步骤 1 */}
            <div className="flex flex-col items-center">
              <span className="text-5xl font-extrabold text-primary mb-3">1</span>
              <h4 className="text-lg font-bold text-neutral-dark mb-4">
                {t('features.liveSearch')}
              </h4>
              <div className="h-72 mb-4 overflow-hidden rounded-2xl shadow-sm border border-gray-100 hover-scale">
                <img 
                  alt="Smooci how it works step 1" 
                  src="/home_files/how-1.jpg" 
                  className="w-full h-full object-cover" 
                />
              </div>
              <p className="text-sm text-neutral-medium px-4">
                {t('features.liveSearchDescription')}
              </p>
            </div>

            {/* Step 2 */}
            {/* 步骤 2 */}
            <div className="flex flex-col items-center">
              <span className="text-5xl font-extrabold text-primary mb-3">2</span>
              <h4 className="text-lg font-bold text-neutral-dark mb-4">
                {t('features.fastConfirmations')}
              </h4>
              <div className="h-72 mb-4 overflow-hidden rounded-2xl shadow-sm border border-gray-100 hover-scale">
                <img 
                  alt="Smooci how it works step 2" 
                  src="/home_files/how-2.jpg" 
                  className="w-full h-full object-cover" 
                />
              </div>
              <p className="text-sm text-neutral-medium px-4">
                {t('features.fastConfirmationsDescription')}
              </p>
            </div>

            {/* Step 3 */}
            {/* 步骤 3 */}
            <div className="flex flex-col items-center">
              <span className="text-5xl font-extrabold text-primary mb-3">3</span>
              <h4 className="text-lg font-bold text-neutral-dark mb-4">
                {t('features.realtimeUpdates')}
              </h4>
              <div className="h-72 mb-4 overflow-hidden rounded-2xl shadow-sm border border-gray-100 hover-scale">
                <img 
                  alt="Smooci how it works step 3" 
                  src="/home_files/how-3.jpg" 
                  className="w-full h-full object-cover" 
                />
              </div>
              <p className="text-sm text-neutral-medium px-4">
                {t('features.realtimeUpdatesDescription')}
              </p>
            </div>

            {/* Step 4 */}
            {/* 步骤 4 */}
            <div className="flex flex-col items-center">
              <span className="text-5xl font-extrabold text-primary mb-3">4</span>
              <h4 className="text-lg font-bold text-neutral-dark mb-4">
                {t('features.discreetFeedback')}
              </h4>
              <div className="h-72 mb-4 overflow-hidden rounded-2xl shadow-sm border border-gray-100 hover-scale">
                <img 
                  alt="Smooci how it works step 4" 
                  src="/home_files/how-4.jpg" 
                  className="w-full h-full object-cover" 
                />
              </div>
              <p className="text-sm text-neutral-medium px-4">
                {t('features.discreetFeedbackDescription')}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 2. 9 Reasons Section */}
      {/* 9大选择理由 */}
      <section data-reveal className="py-12 md:py-20 bg-neutral-bgLight/30">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-3xl font-extrabold text-neutral-dark text-center mb-12">
            {t('features.reasons')}
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Reason 1 */}
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
              <h5 className="text-base md:text-lg font-bold text-neutral-dark mb-2">{t('features.reason1Title')}</h5>
              <p className="text-sm text-neutral-light leading-relaxed">
                {t('features.reason1Text')}
              </p>
            </div>
            
            {/* Reason 2 */}
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
              <h5 className="text-base md:text-lg font-bold text-neutral-dark mb-2">{t('features.reason2Title')}</h5>
              <p className="text-sm text-neutral-light leading-relaxed">
                {t('features.reason2Text')}
              </p>
            </div>

            {/* Reason 3 */}
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
              <h5 className="text-base md:text-lg font-bold text-neutral-dark mb-2">{t('features.reason3Title')}</h5>
              <p className="text-sm text-neutral-light leading-relaxed">
                {t('features.reason3Text')}
              </p>
            </div>

            {/* Reason 4 */}
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
              <h5 className="text-base md:text-lg font-bold text-neutral-dark mb-2">{t('features.reason4Title')}</h5>
              <p className="text-sm text-neutral-light leading-relaxed">
                {t('features.reason4Text')}
              </p>
            </div>

            {/* Reason 5 */}
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
              <h5 className="text-base md:text-lg font-bold text-neutral-dark mb-2">{t('features.reason5Title')}</h5>
              <p className="text-sm text-neutral-light leading-relaxed">
                {t('features.reason5Text')}
              </p>
            </div>

            {/* Reason 6 */}
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
              <h5 className="text-base md:text-lg font-bold text-neutral-dark mb-2">{t('features.reason6Title')}</h5>
              <p className="text-sm text-neutral-light leading-relaxed">
                {t('features.reason6Text')}
              </p>
            </div>

            {/* Reason 7 */}
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
              <h5 className="text-base md:text-lg font-bold text-neutral-dark mb-2">{t('features.reason7Title')}</h5>
              <p className="text-sm text-neutral-light leading-relaxed">
                {t('features.reason7Text')}
              </p>
            </div>

            {/* Reason 8 */}
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
              <h5 className="text-base md:text-lg font-bold text-neutral-dark mb-2">{t('features.reason8Title')}</h5>
              <p className="text-sm text-neutral-light leading-relaxed">
                Companions have their age and photos verified by Smooci’s 24/7 support staff. Verified profiles are highlighted.
              </p>
            </div>

            {/* Reason 9 */}
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
              <h5 className="text-base md:text-lg font-bold text-neutral-dark mb-2">{t('features.reason9Title')}</h5>
              <p className="text-sm text-neutral-light leading-relaxed">
                {t('features.reason9Text')}
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
