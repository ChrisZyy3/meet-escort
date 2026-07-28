import { useState } from 'react';
import type { FC } from 'react';
import { Languages, Menu, X } from 'lucide-react';
import type { AuthUser } from '../types';
import { useTranslation } from '../i18n';

interface NavbarProps {
  user?: AuthUser | null;
  onLoginClick?: () => void;
  onLogoutClick?: () => void;
}

const shortenUsername = (username: string, maxLength = 8): string => {
  if (username.length <= maxLength) return username;

  const suffixLength = 3;
  return `${username.slice(0, maxLength - suffixLength - 1)}…${username.slice(-suffixLength)}`;
};

/**
 * Navbar Component
 *
 * Header menu with responsive hamburger toggle and auth entry points.
 */
export const Navbar: FC<NavbarProps> = ({ user = null, onLoginClick, onLogoutClick }) => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const { t, language, setLanguage } = useTranslation();

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  const toggleLanguage = () => {
    setLanguage(language === 'en' ? 'de' : 'en');
    setIsOpen(false);
  };

  const AuthActions = ({ mobile = false }: { mobile?: boolean }) => {
    if (user) {
      return (
        <div className={mobile ? 'space-y-2 pt-2 border-t border-gray-100' : 'flex items-center gap-3'}>
          <span
            className={
              mobile
                ? 'block px-3 py-2 text-sm font-semibold text-neutral-medium'
                : 'max-w-[180px] truncate text-sm font-semibold text-neutral-medium'
            }
            title={user.email}
          >
            {user.email}
          </span>
          <button
            type="button"
            onClick={onLogoutClick}
            className={
              mobile
                ? 'block w-full rounded-full border border-gray-300 px-4 py-2 text-center text-base font-semibold text-neutral-dark transition hover:bg-neutral-bgLight'
                : 'inline-flex items-center justify-center rounded-full border border-gray-300 bg-white px-5 py-2 text-sm font-semibold text-neutral-dark shadow-sm transition-all duration-200 hover:bg-neutral-bgLight'
            }
          >
            {t('nav.logout')}
          </button>
        </div>
      );
    }

    return (
      <button
        type="button"
        onClick={onLoginClick}
        className={
          mobile
            ? 'mt-2 block w-full rounded-full border border-gray-300 px-4 py-2 text-center text-base font-semibold text-neutral-dark transition hover:bg-neutral-bgLight'
            : 'inline-flex items-center justify-center rounded-full border border-gray-300 bg-white px-5 py-2 text-sm font-semibold text-neutral-dark shadow-sm transition-all duration-200 hover:bg-neutral-bgLight'
        }
      >
        {t('nav.login')}
      </button>
    );
  };

  return (
    <nav className="sticky top-0 z-50 border-b border-gray-100 bg-white/95 shadow-sm backdrop-blur">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="flex flex-shrink-0 items-center">
            <a href="/">
              <img
                className="h-7 w-auto transition-transform duration-300 hover:scale-105"
                src="/home_files/logo.png"
                alt="Smooci Logo"
              />
            </a>
          </div>

          <div className="hidden items-center lg:flex lg:space-x-8">
            <a
              href="/"
              className="text-sm font-semibold text-neutral-dark transition-colors duration-200 hover:text-primary"
            >
              {t('nav.home')}
            </a>
            <a
              href="#companion"
              className="text-sm font-semibold text-neutral-medium transition-colors duration-200 hover:text-primary"
            >
              {t('nav.escort')}
            </a>
            <a
              href="#agencies"
              className="text-sm font-semibold text-neutral-medium transition-colors duration-200 hover:text-primary"
            >
              {t('nav.agency')}
            </a>
          </div>

          <div className="hidden items-center lg:flex">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={toggleLanguage}
                className="inline-flex items-center gap-1.5 rounded-full border border-gray-300 bg-white px-3 py-2 text-sm font-semibold text-neutral-dark shadow-sm transition hover:bg-neutral-bgLight"
                aria-label={t('language.switchTo')}
                title={t('language.switchTo')}
              >
                <Languages className="h-4 w-4" aria-hidden="true" />
                {language.toUpperCase()}
              </button>
              <AuthActions />
            </div>
          </div>

          <div className="flex items-center gap-1 lg:hidden">
            {user ? (
              <span
                className="max-w-16 break-all whitespace-normal px-2 py-1 text-center text-sm font-semibold leading-tight text-neutral-dark"
                title={user.email}
              >
                {shortenUsername(user.email)}
              </span>
            ) : (
              <button
                type="button"
                onClick={onLoginClick}
                className="rounded-full border border-gray-300 bg-white px-3 py-1.5 text-sm font-semibold text-neutral-dark shadow-sm transition hover:bg-neutral-bgLight"
              >
                {t('nav.login')}
              </button>
            )}
            <button
              onClick={toggleMenu}
              type="button"
              className="inline-flex h-10 w-10 items-center justify-center rounded-full text-neutral-light transition-colors duration-200 hover:bg-neutral-bgLight hover:text-neutral-dark focus:outline-none"
              aria-expanded={isOpen}
              aria-controls="mobile-navigation"
              aria-label={t('nav.openMenu')}
            >
              {isOpen ? <X className="h-5 w-5" aria-hidden="true" /> : <Menu className="h-5 w-5" aria-hidden="true" />}
            </button>
          </div>
        </div>
      </div>

      <div
        className={`overflow-hidden transition-all duration-300 ease-in-out lg:hidden ${
          isOpen ? 'max-h-80 border-b border-gray-100 opacity-100' : 'pointer-events-none max-h-0 opacity-0'
        }`}
      >
        <div id="mobile-navigation" className="space-y-1 bg-white px-2 pb-4 pt-2 sm:px-3">
          <a
            href="/"
            onClick={() => setIsOpen(false)}
            className="block rounded-md px-3 py-2 text-base font-semibold text-neutral-dark transition-colors hover:bg-neutral-bgLight hover:text-primary"
          >
            {t('nav.home')}
          </a>
          <a
            href="#companion"
            onClick={() => setIsOpen(false)}
            className="block rounded-md px-3 py-2 text-base font-semibold text-neutral-medium transition-colors hover:bg-neutral-bgLight hover:text-primary"
          >
            {t('nav.escort')}
          </a>
          <a
            href="#agencies"
            onClick={() => setIsOpen(false)}
            className="block rounded-md px-3 py-2 text-base font-semibold text-neutral-medium transition-colors hover:bg-neutral-bgLight hover:text-primary"
          >
            {t('nav.agency')}
          </a>
          <div className="flex items-center justify-between gap-3 border-t border-gray-100 pt-2">
            <button
              type="button"
              onClick={toggleLanguage}
              className="inline-flex items-center gap-1.5 rounded-full border border-gray-300 px-3 py-2 text-sm font-semibold text-neutral-dark"
              aria-label={t('language.switchTo')}
            >
              <Languages className="h-4 w-4" aria-hidden="true" />
              {language.toUpperCase()}
            </button>
            <AuthActions mobile />
          </div>
        </div>
      </div>
    </nav>
  );
};
