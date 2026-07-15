import type { FC } from 'react';
import type { Staff } from '../types';

interface HeroProps {
  staffList: Staff[];
  onMeetClick: () => void;
  onStaffClick: (staff: Staff) => void;
  baseUrl?: string; // Prepend base URL for images in Phase 2 / 在第二阶段为图片路径拼接域名
}

/**
 * Hero Component
 * 
 * Main call-to-action panel. Shows headline, navigation shortcuts,
 * dynamic bubble grid of online companion pictures, and Cloudflare WARP guide.
 */
export const Hero: FC<HeroProps> = ({ staffList, onMeetClick, onStaffClick, baseUrl = '' }) => {
  return (
    <section className="bg-white py-12 md:py-20 text-center transition-all duration-300">
      <div className="max-w-4xl mx-auto px-4">
        {/* Main CTA button */}
        {/* 核心动作按钮 */}
        <div className="mb-10">
          <button 
            onClick={onMeetClick}
            className="bg-primary hover:bg-primary-hover text-white text-lg md:text-xl font-bold py-4 px-10 rounded-full shadow-lg hover:shadow-primary/30 transform hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200"
          >
            Meet an escort
          </button>
        </div>

        {/* Catchy headlines */}
        {/* 精美主副标题 */}
        <h1 className="text-4xl md:text-6xl font-bold text-neutral-dark mb-4 tracking-tight leading-tight">
          The Future Escort Directory
        </h1>
        <h2 className="text-xl md:text-2xl text-neutral-light font-medium mb-12">
          Verified reviews, exclusive videos, and more
        </h2>

        {/* Bubble Grid of companions */}
        {/* 动态在线头像气泡网络 */}
        <div className="flex flex-wrap justify-center gap-4 md:gap-6 mb-12">
          {staffList.slice(0, 8).map((staff) => {
            // Resolve photo URL absolute path to handle relative uploads path
            // 对相对路径进行解析并拼接上 API 域名，形成绝对 URL
            const resolvedPhoto = staff.photoUrl
              ? (staff.photoUrl.startsWith('http') || staff.photoUrl.startsWith('/home_files')
                  ? staff.photoUrl 
                  : `${baseUrl}${staff.photoUrl}`)
              : '';

            return (
              <button
                key={staff.id}
                onClick={() => onStaffClick(staff)}
                className="group relative focus:outline-none transition-transform duration-300 hover:scale-110"
                title={`View ${staff.name}`}
              >
                {/* Online pulse dot */}
                {/* 在线指示器呼吸灯 */}
                <span className="absolute top-1.5 right-1.5 w-3.5 h-3.5 bg-green-500 border-2 border-white rounded-full z-10 animate-pulse" />
                <img
                  src={resolvedPhoto}
                  alt={`${staff.name} profile bubble`}
                  className="w-20 h-20 md:w-28 md:h-28 rounded-2xl object-cover shadow-md group-hover:shadow-lg border-2 border-transparent group-hover:border-primary transition-all duration-300"
                />
              </button>
            );
          })}
        </div>

        {/* Info label and cloudflare helper */}
        {/* 伴游注册指引与网络优化工具 */}
        <div className="mt-8 text-sm text-neutral-light">
          <span>Are you an escort? </span>
          <a href="#signup" className="text-primary hover:underline font-semibold transition-colors">
            Sign up
          </a>
          <span> to advertise on Smooci</span>
        </div>

        {/* Cloudflare Warp Section */}
        {/* Cloudflare 优化指引卡片 */}
        <div className="mt-16 p-6 md:p-8 bg-neutral-bgLight rounded-2xl max-w-lg mx-auto border border-gray-100 shadow-sm transition-all duration-300 hover:shadow-md">
          <h3 className="text-lg md:text-xl font-bold text-neutral-dark mb-2">
            Having trouble accessing our directory?
          </h3>
          <p className="text-sm text-neutral-light mb-4">
            Download the free <strong className="text-neutral-dark">WARP</strong> app from Cloudflare for faster, safer access.
          </p>
          <a 
            href="https://1.1.1.1/" 
            target="_blank" 
            rel="nofollow noopener noreferrer"
            className="inline-block transform hover:scale-105 transition-transform duration-200"
          >
            <img 
              width="80" 
              height="80" 
              alt="Cloudflare WARP logo" 
              src="/home_files/warp-logo.png"
              className="mx-auto drop-shadow-sm" 
            />
          </a>
          <p className="text-sm font-semibold text-neutral-medium mt-3">Free. Fast. Private.</p>
        </div>
      </div>
    </section>
  );
};
