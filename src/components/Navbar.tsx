import { useState } from 'react';
import type { FC } from 'react';

/**
 * Navbar Component
 * 
 * Replicates the header menu structure, including the responsive
 * hamburger toggle mechanism on smaller viewports.
 */
export const Navbar: FC = () => {
  const [isOpen, setIsOpen] = useState<boolean>(false);

  // Toggle mobile navigation menu open/closed state
  // 切换移动端导航抽屉的打开与关闭状态
  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  return (
    <nav className="relative bg-white border-b border-gray-100 shadow-sm z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo brand block */}
          {/* Logo 区域 */}
          <div className="flex-shrink-0 flex items-center">
            <a href="/">
              <img 
                className="h-7 w-auto transition-transform duration-300 hover:scale-105" 
                src="/home_files/logo.png" 
                alt="Smooci Logo" 
              />
            </a>
          </div>

          {/* Desktop Navigation Links */}
          {/* 桌面端导航链接 */}
          <div className="hidden lg:flex lg:space-x-8 items-center">
            <a 
              href="/" 
              className="text-neutral-dark hover:text-primary font-semibold text-sm transition-colors duration-200"
            >
              Home
            </a>
            <a 
              href="#companion" 
              className="text-neutral-medium hover:text-primary font-semibold text-sm transition-colors duration-200"
            >
              I'm an Escort
            </a>
            <a 
              href="#agencies" 
              className="text-neutral-medium hover:text-primary font-semibold text-sm transition-colors duration-200"
            >
              I'm an Agency
            </a>
          </div>

          {/* Desktop Login Button */}
          {/* 桌面端登录按钮 */}
          <div className="hidden lg:flex items-center">
            <a 
              href="#login" 
              className="inline-flex items-center justify-center px-5 py-2 border border-gray-300 rounded-full text-sm font-semibold text-neutral-dark bg-white hover:bg-neutral-bgLight transition-all duration-200 shadow-sm"
            >
              Login
            </a>
          </div>

          {/* Mobile hamburger menu toggle */}
          {/* 移动端汉堡菜单切换按钮 */}
          <div className="flex items-center lg:hidden">
            <button
              onClick={toggleMenu}
              type="button"
              className="inline-flex items-center justify-center p-2 rounded-md text-neutral-light hover:text-neutral-dark hover:bg-neutral-bgLight focus:outline-none transition-colors duration-200"
              aria-expanded="false"
            >
              <span className="sr-only">Open main menu</span>
              {/* Menu icon lines */}
              {/* 菜单三道杠图标 */}
              <div className="w-6 h-6 flex flex-col justify-between items-center relative">
                <span className={`block h-0.5 w-5 bg-current transform transition duration-300 ${isOpen ? 'rotate-45 translate-y-2.5' : ''}`} />
                <span className={`block h-0.5 w-5 bg-current transition duration-300 ${isOpen ? 'opacity-0' : ''}`} />
                <span className={`block h-0.5 w-5 bg-current transform transition duration-300 ${isOpen ? '-rotate-45 -translate-y-2.5' : ''}`} />
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer menu block */}
      {/* 移动端下拉列表导航菜单 */}
      <div 
        className={`lg:hidden transition-all duration-300 ease-in-out overflow-hidden ${
          isOpen ? 'max-h-64 border-b border-gray-100 opacity-100' : 'max-h-0 opacity-0 pointer-events-none'
        }`}
      >
        <div className="px-2 pt-2 pb-4 space-y-1 sm:px-3 bg-white">
          <a 
            href="/" 
            className="block px-3 py-2 rounded-md text-base font-semibold text-neutral-dark hover:bg-neutral-bgLight hover:text-primary transition-colors"
          >
            Home
          </a>
          <a 
            href="#companion" 
            className="block px-3 py-2 rounded-md text-base font-semibold text-neutral-medium hover:bg-neutral-bgLight hover:text-primary transition-colors"
          >
            I'm an Escort
          </a>
          <a 
            href="#agencies" 
            className="block px-3 py-2 rounded-md text-base font-semibold text-neutral-medium hover:bg-neutral-bgLight hover:text-primary transition-colors"
          >
            I'm an Agency
          </a>
          <div className="pt-2 border-t border-gray-100">
            <a 
              href="#login" 
              className="block text-center px-4 py-2 mt-2 border border-gray-300 rounded-full text-base font-semibold text-neutral-dark hover:bg-neutral-bgLight transition-all"
            >
              Login
            </a>
          </div>
        </div>
      </div>
    </nav>
  );
};
