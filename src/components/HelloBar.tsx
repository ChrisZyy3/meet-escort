import type { FC } from 'react';

/**
 * HelloBar Component
 * 
 * Renders the top announcement bar. Includes open cities and
 * contact email for prospective companion sign-ups.
 */
export const HelloBar: FC = () => {
  return (
    <div className="hello-bar">
      {/* Announcement text for open locations */}
      {/* 打开城市列表通告 */}
      <span>
        Now open in <strong>BANGKOK</strong> · <strong>TOKYO</strong> · <strong>DUBAI</strong> · <strong>MANILA</strong>.
      </span>
      <br className="sm:hidden" />
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
