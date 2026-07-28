import type { FC } from 'react';
import { useTranslation } from '../i18n';

export const HelloBar: FC = () => {
  const { t } = useTranslation();

  return (
    <div className="hello-bar">
      <span>
        {t('announcement.open')} <strong>BANGKOK</strong> · <strong>TOKYO</strong> · <strong>DUBAI</strong> · <strong>MANILA</strong>.
      </span>
      <br className="sm:hidden" />
      <span className="md:ml-2">
        {t('announcement.contact')}{' '}
        <a href="mailto:contact@smooci.com" className="underline hover:text-gray-100 transition-colors" rel="nofollow">
          contact@smooci.com
        </a>
      </span>
    </div>
  );
};
