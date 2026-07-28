import type { FC } from 'react';
import { useTranslation } from '../i18n';

/**
 * WhySmooci Component
 * 
 * Renders the 4 core pillars of the platform: Safety, Trust, Privacy, and Support
 * in a responsive, 4-column layout positioned above the footer.
 * 
 * Detailed annotations added in compliance with rule guidelines.
 */
export const WhySmooci: FC = () => {
  const { t } = useTranslation();

  return (
    <section data-reveal className="bg-white py-12 md:py-16 border-t border-gray-100">
      <div className="max-w-7xl mx-auto px-4">
        
        {/* Core Layout Grid */}
        {/* 核心保障展示网格 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          
          {/* Pillar 1: Safety */}
          {/* 第一点：安全保护 */}
          <div className="space-y-2">
            <h5 className="text-lg font-bold text-neutral-dark">
              {t('why.safety')}
            </h5>
            <p className="text-sm text-neutral-light leading-relaxed">
              {t('why.safetyDescription')}
            </p>
          </div>

          {/* Pillar 2: Trust */}
          {/* 第二点：信任建设 */}
          <div className="space-y-2">
            <h5 className="text-lg font-bold text-neutral-dark">
              {t('why.trust')}
            </h5>
            <p className="text-sm text-neutral-light leading-relaxed">
              {t('why.trustDescription')}
            </p>
          </div>

          {/* Pillar 3: Privacy */}
          {/* 第三点：隐私删除 */}
          <div className="space-y-2">
            <h5 className="text-lg font-bold text-neutral-dark">
              {t('why.privacy')}
            </h5>
            <p className="text-sm text-neutral-light leading-relaxed">
              {t('why.privacyDescription')}
            </p>
          </div>

          {/* Pillar 4: Support */}
          {/* 第四点：快捷客服 */}
          <div className="space-y-2">
            <h5 className="text-lg font-bold text-neutral-dark">
              {t('why.support')}
            </h5>
            <p className="text-sm text-neutral-light leading-relaxed">
              {t('why.supportDescription')}
            </p>
          </div>

        </div>
      </div>
    </section>
  );
};
