import type { FC } from 'react';
import { useTranslation } from '../i18n';

/**
 * Footer Component
 * 
 * Multi-column directory footer mapping main markets, legal compliance notes,
 * payment badges, and corporate information.
 */
export const Footer: FC = () => {
  const { t } = useTranslation();
  return (
    <footer data-reveal className="bg-white border-t border-gray-150 py-12 md:py-16 text-xs md:text-sm text-neutral-light">
      <div className="max-w-7xl mx-auto px-4">
        {/* Top Link Directory Grid */}
        {/* 顶部链接目录网格 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 mb-12">
          {/* Logo & Platform Info column */}
          {/* 平台信息列 */}
          <div className="space-y-4">
            <img 
              src="/home_files/logo.png" 
              alt="Smooci Logo" 
              className="h-7 w-auto mb-2 object-contain" 
            />
            <p className="font-semibold text-neutral-dark">
              {t('footer.tagline')}
            </p>
            <div className="space-y-2 flex flex-col font-medium">
              <a href="#blog" className="hover:text-primary transition-colors">{t('footer.blog')}</a>
              <a href="#privacy" className="hover:text-primary transition-colors">{t('footer.privacy')}</a>
              <a href="#terms" className="hover:text-primary transition-colors">{t('footer.terms')}</a>
              <a href="#affiliates" className="hover:text-primary transition-colors">{t('footer.affiliates')}</a>
              <a href="#careers" className="hover:text-primary transition-colors">{t('footer.careers')}</a>
              <a href="#help" className="hover:text-primary transition-colors">{t('footer.help')}</a>
              <a href="#contact" className="hover:text-primary transition-colors">{t('footer.contact')}</a>
            </div>
          </div>

          {/* Asia Division column */}
          {/* 亚洲市场分支 */}
          <div>
            <h5 className="text-sm font-bold text-neutral-dark mb-4">{t('footer.asia')}</h5>
            <div className="space-y-2 leading-relaxed">
              <p><a href="#bangkok" className="hover:text-primary">Bangkok</a> | <a href="#bangkok-trans" className="hover:text-primary">Bangkok Transgender</a></p>
              <p><a href="#singapore" className="hover:text-primary">Singapore</a> | <a href="#singapore-trans" className="hover:text-primary">Singapore Transgender</a></p>
              <p><a href="#manila" className="hover:text-primary">Manila</a> | <a href="#manila-trans" className="hover:text-primary">Manila Transgender</a></p>
              <p><a href="#angeles" className="hover:text-primary">Angeles City</a> | <a href="#angeles-trans" className="hover:text-primary">Angeles City Transgender</a></p>
              <p><a href="#cebu" className="hover:text-primary">Cebu</a> | <a href="#cebu-trans" className="hover:text-primary">Cebu Transgender</a></p>
              <p><a href="#hongkong" className="hover:text-primary">Hong Kong</a> | <a href="#hongkong-trans" className="hover:text-primary">Hong Kong Transgender</a></p>
              <p><a href="#kl" className="hover:text-primary">Kuala Lumpur</a> | <a href="#kl-trans" className="hover:text-primary">Kuala Lumpur Transgender</a></p>
              <p><a href="#macau" className="hover:text-primary">Macau</a> | <a href="#macau-trans" className="hover:text-primary">Macau Transgender</a></p>
              <p><a href="#tokyo" className="hover:text-primary">Tokyo</a> | <a href="#tokyo-trans" className="hover:text-primary">Tokyo Transgender</a></p>
            </div>
          </div>

          {/* Europe & Australia Division column */}
          {/* 欧洲与澳洲市场分支 */}
          <div>
            <h5 className="text-sm font-bold text-neutral-dark mb-4">{t('footer.europeAustralia')}</h5>
            <div className="space-y-2 leading-relaxed">
              <p>
                <a href="#berlin" className="hover:text-primary">Berlin</a>
                {' | '}<a href="#warsaw" className="hover:text-primary">Warsaw</a>
                {' | '}<a href="#krakow" className="hover:text-primary">Krakow</a>
              </p>
              <p>
                <a href="#london" className="hover:text-primary">London</a>
                {' | '}<a href="#leeds" className="hover:text-primary">Leeds</a>
                {' | '}<a href="#liverpool" className="hover:text-primary">Liverpool</a>
                {' | '}<a href="#manchester" className="hover:text-primary">Manchester</a>
              </p>
              <p>
                <a href="#amsterdam" className="hover:text-primary">Amsterdam</a>
                {' | '}<a href="#rotterdam" className="hover:text-primary">Rotterdam</a>
                {' | '}<a href="#hague" className="hover:text-primary">The Hague</a>
              </p>
              <p>
                <a href="#sydney" className="hover:text-primary">Sydney</a>
                {' | '}<a href="#melbourne" className="hover:text-primary">Melbourne</a>
              </p>
            </div>
          </div>
        </div>

        {/* Legal Disclaimer, compliance stamps, payment cards, copyrights */}
        {/* 法律条款、合规性认证、支持支付卡片及版权声明 */}
        <div className="border-t border-gray-100 pt-8 text-center space-y-4">
          <p className="max-w-2xl mx-auto leading-relaxed">{t('footer.compliance')}</p>

          <address className="not-italic font-bold text-neutral-dark">
            SMOOCI
          </address>

          {/* Payment Card Badges */}
          {/* 支付标志 */}
          <div className="flex justify-center items-center gap-4 py-2">
            <img 
              src="/home_files/visa.png" 
              alt="Visa card payment accepted" 
              className="h-7 w-auto object-contain" 
            />
            <img 
              src="/home_files/mastercard.png" 
              alt="MasterCard payment accepted" 
              className="h-7 w-auto object-contain" 
            />
          </div>

          {/* Copyright line */}
          {/* 版权声明 */}
          <p className="text-neutral-light font-semibold pt-2 text-xs">
            &copy; Smooci {new Date().getFullYear()} | contact@smooci.com
          </p>
        </div>
      </div>
    </footer>
  );
};
