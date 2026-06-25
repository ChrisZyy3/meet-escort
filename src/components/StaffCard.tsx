import type { FC } from 'react';
import type { Staff } from '../types';

interface StaffCardProps {
  staff: Staff;
  onClick: () => void;
  baseUrl?: string; // Prepend base URL for images in Phase 2
}

/**
 * StaffCard Component
 * 
 * Individual card representation for a service person. Contains
 * details such as active indicator, name, price, and picture.
 */
export const StaffCard: FC<StaffCardProps> = ({ staff, onClick, baseUrl = '' }) => {
  // Resolve image URL: prepend BaseURL if photoUrl is a relative path (e.g. starting with /uploads/)
  // 解析图片 URL：若是以 /uploads/ 开头的相对路径，则在其前添加 BaseURL 域名前缀
  const resolvedPhotoUrl = staff.photoUrl
    ? (staff.photoUrl.startsWith('http') || staff.photoUrl.startsWith('/home_files')
        ? staff.photoUrl 
        : `${baseUrl}${staff.photoUrl}`)
    : ''; // empty fallback if no photo provided / 若接口未配置图片，则留空

  return (
    <div 
      onClick={onClick}
      className="group cursor-pointer bg-white rounded-2xl overflow-hidden border border-gray-100 hover:border-primary/20 hover:shadow-card hover-scale select-none"
    >
      {/* Photo Wrapper with fixed square aspect ratio */}
      {/* 图片包装容器，强制 1:1 正方形比例 */}
      <div className="relative aspect-square w-full bg-neutral-bgLight overflow-hidden">
        {resolvedPhotoUrl ? (
          <img 
            src={resolvedPhotoUrl} 
            alt={`${staff.name} profile`} 
            className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          /* Avatar fallback placeholder when photo is missing */
          /* 无头像时的默认首字母占位设计 */
          <div className="w-full h-full flex flex-col justify-center items-center bg-primary/5 text-primary text-3xl font-extrabold">
            {staff.name.charAt(0).toUpperCase()}
            <span className="text-xs font-semibold text-neutral-light mt-2">No Photo</span>
          </div>
        )}

        {/* Pulse online green dot overlay */}
        {/* 卡片图片上的在线指示器 */}
        {staff.isActive && (
          <span className="absolute top-4 left-4 flex h-3.5 w-3.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-green-500 border border-white"></span>
          </span>
        )}

        {/* Price tag badge overlay */}
        {/* 卡片下方的价格标签徽章 */}
        <div className="absolute bottom-4 right-4 bg-black/75 backdrop-blur-sm text-white text-xs md:text-sm font-bold py-1 px-3 rounded-full shadow-md">
          {staff.price ? `¥${staff.price.toFixed(2)}` : 'Contact for price'}
        </div>
      </div>

      {/* Info Block */}
      {/* 文本信息块 */}
      <div className="p-4 text-left">
        <h4 className="text-base md:text-lg font-bold text-neutral-dark group-hover:text-primary transition-colors duration-200 truncate">
          {staff.name}
        </h4>
        <p className="text-xs md:text-sm text-neutral-light line-clamp-2 mt-1 min-h-[2.5rem] leading-snug">
          {staff.description || 'Professional service companion, ready to assist.'}
        </p>
      </div>
    </div>
  );
};
