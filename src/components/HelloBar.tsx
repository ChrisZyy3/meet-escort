import type { FC } from 'react';

/**
 * HelloBar Component
 * 
 * Renders the top announcement bar. Includes open cities and
 * contact email for prospective companion sign-ups.
 */
export const HelloBar: FC = () => {
  return (
    <div className="bg-hellobar text-white text-center py-3 px-6 text-sm md:text-base font-semibold shadow-sm leading-tight transition-all duration-300">
      {/* Announcement text for open locations */}
      {/* 打开城市列表通告 */}
      <span>
        Now open in <strong className="underline">PATTAYA</strong> - <strong className="underline">PHUKET</strong> - <strong className="underline">DUBAI</strong> - <strong className="underline">ABU DHABI</strong>.
      </span>
      <br className="md:hidden" />
      {/* Contact Link */}
      {/* 联系邮箱 */}
      <span className="md:ml-2">
        For info or show interest:{' '}
        <a 
          href="mailto:contact@smooci.com" 
          className="underline hover:text-gray-100 transition-colors"
          rel="nofollow"
        >
          contact@smooci.com
        </a>
      </span>
    </div>
  );
};
