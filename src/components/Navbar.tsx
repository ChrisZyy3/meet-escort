import { useEffect, useRef, useState } from 'react';
import type { FC, KeyboardEvent as ReactKeyboardEvent } from 'react';
import { Check, Languages, Menu, X } from 'lucide-react';
import type { AuthUser } from '../types';
import { supportedLanguages, useTranslation, type Language } from '../i18n';

interface NavbarProps {
  user?: AuthUser | null;
  onLoginClick?: () => void;
  onLogoutClick?: () => void;
}

type LanguageSelectorVariant = 'desktop' | 'mobile';
type NavigationKey = 'home' | 'escort' | 'agency';

const getNavigationKeyFromHash = (): NavigationKey => {
  if (typeof window === 'undefined') return 'home';
  if (window.location.hash === '#companion' || window.location.hash === '#directory') return 'escort';
  if (window.location.hash === '#agencies') return 'agency';
  return 'home';
};

const shortenUsername = (username: string, maxLength = 8): string => {
  if (username.length <= maxLength) return username;

  const visibleLength = maxLength - 3;
  const startLength = Math.ceil(visibleLength / 2);
  const endLength = Math.floor(visibleLength / 2);
  return `${username.slice(0, startLength)}...${username.slice(-endLength)}`;
};

/**
 * Navbar Component
 *
 * Header menu with responsive hamburger toggle and auth entry points.
 */
export const Navbar: FC<NavbarProps> = ({ user = null, onLoginClick, onLogoutClick }) => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [isLanguageOpen, setIsLanguageOpen] = useState<boolean>(false);
  const [activeNavigation, setActiveNavigation] = useState<NavigationKey>(getNavigationKeyFromHash);
  const [reducedMotion, setReducedMotion] = useState(false);
  const navRef = useRef<HTMLElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const mobileNavigationRef = useRef<HTMLDivElement>(null);
  const languageTriggerRefs = useRef<Record<LanguageSelectorVariant, HTMLButtonElement | null>>({ desktop: null, mobile: null });
  const languageMenuRefs = useRef<Record<LanguageSelectorVariant, HTMLDivElement | null>>({ desktop: null, mobile: null });
  const activeLanguageSelector = useRef<LanguageSelectorVariant>('desktop');
  const { t, language, setLanguage } = useTranslation();

  const handleNavigationClick = (navigationKey: NavigationKey) => {
    setActiveNavigation(navigationKey);
    setIsOpen(false);
    closeLanguageMenu();
  };

  const navigationLinkClass = (navigationKey: NavigationKey, mobile = false) => {
    const activeClass = activeNavigation === navigationKey ? 'text-primary' : 'text-neutral-medium';
    return mobile
      ? `block rounded-md px-3 py-2 text-base font-semibold transition-colors hover:bg-neutral-bgLight hover:text-primary ${activeClass}`
      : `text-sm font-semibold transition-colors duration-200 hover:text-primary ${activeNavigation === navigationKey ? 'text-primary' : 'text-neutral-medium'}`;
  };

  const toggleMenu = () => {
    setIsOpen((open) => !open);
    setIsLanguageOpen(false);
  };

  const toggleLanguageMenu = () => {
    setIsLanguageOpen((open) => !open);
  };

  const closeLanguageMenu = (restoreFocus = false) => {
    setIsLanguageOpen(false);
    if (restoreFocus) {
      window.requestAnimationFrame(() => languageTriggerRefs.current[activeLanguageSelector.current]?.focus());
    }
  };

  const selectLanguage = (nextLanguage: Language) => {
    setLanguage(nextLanguage);
    setIsLanguageOpen(false);
    setIsOpen(false);
  };

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (!navRef.current?.contains(event.target as Node)) {
        closeLanguageMenu();
        setIsOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        closeLanguageMenu(isLanguageOpen);
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isLanguageOpen]);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const updateMotionPreference = () => setReducedMotion(mediaQuery.matches);
    const syncNavigation = () => setActiveNavigation(getNavigationKeyFromHash());

    updateMotionPreference();
    window.addEventListener('hashchange', syncNavigation);
    mediaQuery.addEventListener('change', updateMotionPreference);
    return () => {
      window.removeEventListener('hashchange', syncNavigation);
      mediaQuery.removeEventListener('change', updateMotionPreference);
    };
  }, []);

  useEffect(() => {
    if (isOpen) {
      window.requestAnimationFrame(() => {
        mobileNavigationRef.current?.querySelector<HTMLElement>('a, button')?.focus();
      });
      return;
    }

    if (document.activeElement !== document.body) {
      window.requestAnimationFrame(() => menuButtonRef.current?.focus());
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isLanguageOpen) return;
    const menu = languageMenuRefs.current[activeLanguageSelector.current];
    menu?.querySelector<HTMLButtonElement>('[role="menuitemradio"][aria-checked="true"]')?.focus();
  }, [isLanguageOpen]);

  const handleLanguageMenuKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    const menuItems = Array.from(event.currentTarget.querySelectorAll<HTMLButtonElement>('[role="menuitemradio"]'));
    const currentIndex = menuItems.indexOf(document.activeElement as HTMLButtonElement);
    let nextIndex = currentIndex;

    if (event.key === 'ArrowDown') nextIndex = currentIndex < menuItems.length - 1 ? currentIndex + 1 : 0;
    if (event.key === 'ArrowUp') nextIndex = currentIndex > 0 ? currentIndex - 1 : menuItems.length - 1;
    if (event.key === 'Home') nextIndex = 0;
    if (event.key === 'End') nextIndex = menuItems.length - 1;

    if (nextIndex !== currentIndex) {
      event.preventDefault();
      menuItems[nextIndex]?.focus();
      return;
    }

    if (event.key === 'Escape') {
      event.preventDefault();
      event.stopPropagation();
      closeLanguageMenu(true);
      setIsOpen(false);
    }
  };

  const handleMobileLogin = () => {
    setIsOpen(false);
    closeLanguageMenu();
    onLoginClick?.();
  };

  const LanguageSelector = ({ mobile = false }: { mobile?: boolean }) => {
    const variant: LanguageSelectorVariant = mobile ? 'mobile' : 'desktop';
    const menuId = `language-menu-${variant}`;

    return (
      <div className="relative">
      <button
        type="button"
        onClick={() => {
          activeLanguageSelector.current = variant;
          toggleLanguageMenu();
        }}
        ref={(element) => {
          languageTriggerRefs.current[variant] = element;
        }}
        className={mobile
          ? 'inline-flex h-10 w-10 items-center justify-center rounded-full border border-gray-300 text-neutral-dark transition hover:bg-neutral-bgLight'
          : 'inline-flex h-10 w-10 items-center justify-center rounded-full border border-gray-300 bg-white text-neutral-dark shadow-sm transition hover:bg-neutral-bgLight'}
        aria-label={`${t('language.choose')} (${language.toUpperCase()})`}
        title={`${t('language.choose')} (${language.toUpperCase()})`}
        aria-expanded={isLanguageOpen}
        aria-haspopup="menu"
        aria-controls={menuId}
      >
        <Languages className="h-4 w-4" aria-hidden="true" />
      </button>

      {isLanguageOpen && (
        <div
          id={menuId}
          ref={(element) => {
            languageMenuRefs.current[variant] = element;
          }}
          onKeyDown={handleLanguageMenuKeyDown}
          role="menu"
          aria-label={t('language.choose')}
          className="absolute right-0 top-full z-50 mt-2 w-40 rounded-xl border border-gray-100 bg-white p-1.5 shadow-lg ring-1 ring-black/5"
        >
          {supportedLanguages.map((option) => (
            <button
              key={option.value}
              type="button"
              role="menuitemradio"
              aria-checked={language === option.value}
              onClick={() => selectLanguage(option.value)}
              className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm font-semibold transition ${language === option.value ? 'bg-neutral-bgLight text-primary' : 'text-neutral-dark hover:bg-neutral-bgLight'}`}
            >
              {t(option.labelKey)}
              {language === option.value ? <Check className="h-4 w-4" aria-hidden="true" /> : null}
            </button>
          ))}
        </div>
      )}
      </div>
    );
  };

  const AuthActions = ({ mobile = false, showIdentity = true }: { mobile?: boolean; showIdentity?: boolean }) => {
    if (user) {
      return (
        <div className={mobile ? 'space-y-2' : 'flex items-center gap-3'}>
          {showIdentity ? (
            <span
              className={mobile
                ? 'block px-3 py-2 text-sm font-semibold text-neutral-medium'
                : 'max-w-[180px] truncate text-sm font-semibold text-neutral-medium'}
              title={user.email}
            >
              {user.email}
            </span>
          ) : null}
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
    <nav ref={navRef} className="sticky top-0 z-50 border-b border-gray-100 bg-white/95 shadow-sm backdrop-blur">
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
              onClick={() => handleNavigationClick('home')}
              className={navigationLinkClass('home')}
            >
              {t('nav.home')}
            </a>
            <a
              href="#directory"
              onClick={() => handleNavigationClick('escort')}
              className={navigationLinkClass('escort')}
            >
              {t('nav.escort')}
            </a>
            <a
              href="#agencies"
              onClick={() => handleNavigationClick('agency')}
              className={navigationLinkClass('agency')}
            >
              {t('nav.agency')}
            </a>
          </div>

          <div className="hidden items-center lg:flex">
            <div className="flex items-center gap-3">
              <AuthActions />
              <LanguageSelector />
            </div>
          </div>

          <div className="flex items-center gap-1 lg:hidden">
            {user ? (
              <span className="mobile-user-summary" title={user.email}>
                {shortenUsername(user.email)}
              </span>
            ) : (
              <button
                type="button"
                onClick={handleMobileLogin}
                className="rounded-full border border-gray-300 bg-white px-3 py-1.5 text-sm font-semibold text-neutral-dark shadow-sm transition hover:bg-neutral-bgLight"
              >
                {t('nav.login')}
              </button>
            )}
            <LanguageSelector mobile />
            <button
              ref={menuButtonRef}
              onClick={toggleMenu}
              type="button"
              className="inline-flex h-10 w-10 items-center justify-center rounded-full text-neutral-light transition-colors duration-200 hover:bg-neutral-bgLight hover:text-neutral-dark focus:outline-none"
              aria-expanded={isOpen}
              aria-controls="mobile-navigation"
              aria-label={isOpen ? t('nav.closeMenu') : t('nav.openMenu')}
            >
              {isOpen ? <X className="h-5 w-5" aria-hidden="true" /> : <Menu className="h-5 w-5" aria-hidden="true" />}
            </button>
          </div>
        </div>
      </div>

      <div
        className={`${reducedMotion ? '' : 'transition-all duration-300 ease-in-out'} overflow-hidden lg:hidden ${
          isOpen ? 'max-h-80 border-b border-gray-100 opacity-100' : 'pointer-events-none max-h-0 opacity-0'
        }`}
      >
        <div ref={mobileNavigationRef} id="mobile-navigation" className="space-y-1 bg-white px-2 pb-4 pt-2 sm:px-3">
          <a
            href="/"
            onClick={() => handleNavigationClick('home')}
            className={navigationLinkClass('home', true)}
          >
            {t('nav.home')}
          </a>
          <a
            href="#directory"
            onClick={() => handleNavigationClick('escort')}
            className={navigationLinkClass('escort', true)}
          >
            {t('nav.escort')}
          </a>
          <a
            href="#agencies"
            onClick={() => handleNavigationClick('agency')}
            className={navigationLinkClass('agency', true)}
          >
            {t('nav.agency')}
          </a>
          {user ? (
            <div className="mt-3 border-t border-gray-100 pt-3">
              <AuthActions mobile showIdentity={false} />
            </div>
          ) : null}
        </div>
      </div>
    </nav>
  );
};
