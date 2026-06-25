import { useState, useEffect } from 'react';
import type { FC } from 'react';

/**
 * CookieBanner Component
 * 
 * Shows a full-screen overlay when the user first visits the site,
 * prompting them to confirm they are 18 or older and agree to cookies/terms.
 */
export const CookieBanner: FC = () => {
  const [isOpen, setIsOpen] = useState<boolean>(false);

  useEffect(() => {
    // Check local storage or cookies if the banner has been accepted before
    // 检测本地存储，确定用户是否在之前已经接受过该条款
    const accepted = localStorage.getItem('cookiesAccepted');
    if (!accepted) {
      setIsOpen(true);
    }
  }, []);

  const handleAccept = () => {
    // Persist acceptance in localStorage and close the banner
    // 将确认状态持久化存入 localStorage 并关闭弹窗
    localStorage.setItem('cookiesAccepted', 'true');
    setIsOpen(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-white/95 dark:bg-black/95 z-[100] flex flex-col items-center justify-center p-6 text-center animate-fade-in">
      <div className="max-w-md w-full p-8 rounded-2xl bg-white dark:bg-zinc-900 shadow-2xl border border-gray-100 dark:border-zinc-800">
        <h2 className="text-2xl font-bold text-neutral-dark dark:text-white mb-4">
          Age Verification Required
        </h2>
        
        {/* Warning text in English & Chinese */}
        {/* 英文及中文年龄验证提示 */}
        <p className="text-sm md:text-base text-neutral-medium dark:text-zinc-300 mb-6 leading-relaxed">
          By continuing to browse, you accept the{' '}
          <a 
            href="#privacy" 
            className="text-primary hover:underline font-semibold"
            target="_blank" 
            rel="noopener noreferrer"
          >
            use of cookies
          </a>{' '}
          and the{' '}
          <a 
            href="#terms" 
            className="text-primary hover:underline font-semibold"
            target="_blank" 
            rel="noopener noreferrer"
          >
            general conditions
          </a>.
        </p>

        {/* Action Button */}
        {/* 年龄确认按钮 */}
        <button 
          onClick={handleAccept}
          className="w-full bg-primary hover:bg-primary-hover text-white font-bold py-3 px-8 rounded-full shadow-lg hover:shadow-primary/30 transform hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200"
        >
          I am 18 years or older
        </button>
      </div>
    </div>
  );
};
