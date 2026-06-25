import { useState, useMemo } from 'react';
import type { FC } from 'react';
import type { Staff } from '../types';
import { StaffCard } from './StaffCard';

interface StaffGridProps {
  staffList: Staff[];
  onStaffClick: (staff: Staff) => void;
  isLoading?: boolean;
  baseUrl?: string;
}

/**
 * StaffGrid Component
 * 
 * Lists all active service personnel. Provides client-side searching
 * (by name/description) and sorting (by price/newest) to create a premium experience.
 */
export const StaffGrid: FC<StaffGridProps> = ({ 
  staffList, 
  onStaffClick, 
  isLoading = false,
  baseUrl = ''
}) => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortBy, setSortBy] = useState<string>('default');

  // Filter and sort the personnel list dynamically
  // 动态对服务人员列表进行搜索过滤和排序
  const processedStaffList = useMemo(() => {
    let result = [...staffList];

    // Apply Search Query filter (checks name & description)
    // 匹配搜索条件（姓名和描述）
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (item) => 
          item.name.toLowerCase().includes(q) || 
          (item.description && item.description.toLowerCase().includes(q))
      );
    }

    // Apply Sorting logic
    // 应用排序规则
    if (sortBy === 'price-asc') {
      result.sort((a, b) => a.price - b.price); // Price low to high
    } else if (sortBy === 'price-desc') {
      result.sort((a, b) => b.price - a.price); // Price high to low
    } else if (sortBy === 'newest') {
      result.sort((a, b) => b.id - a.id);        // Newest / ID descending
    }

    return result;
  }, [staffList, searchQuery, sortBy]);

  return (
    <section id="directory" className="bg-neutral-bgLight py-12 md:py-16 scroll-mt-6">
      <div className="max-w-7xl mx-auto px-4">
        {/* Section Header */}
        {/* 区域标题 */}
        <div className="text-center mb-10">
          <h2 className="text-3xl md:text-4xl font-bold text-neutral-dark mb-3">
            Escorts Currently Online
          </h2>
          <p className="text-neutral-light font-medium max-w-xl mx-auto">
            Browse our list of verified service providers currently online and available to meet right now.
          </p>
        </div>

        {/* Filter & Search Bar */}
        {/* 搜索与筛选工具栏 */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
          {/* Search Box */}
          {/* 搜索输入框 */}
          <div className="flex-1 max-w-md relative">
            <input
              type="text"
              placeholder="Search by name or specialty..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-4 pr-10 py-2.5 rounded-full border border-gray-250 focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none text-sm text-neutral-medium"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-neutral-light hover:text-neutral-dark text-xs font-semibold"
              >
                Clear
              </button>
            )}
          </div>

          {/* Sort Dropdown */}
          {/* 排序选择下拉框 */}
          <div className="flex items-center gap-3">
            <span className="text-xs md:text-sm font-semibold text-neutral-light">Sort:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="border border-gray-250 rounded-full px-4 py-2 text-sm text-neutral-medium bg-white focus:outline-none focus:border-primary cursor-pointer"
            >
              <option value="default">Default</option>
              <option value="newest">Newest</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
            </select>
          </div>
        </div>

        {/* Dynamic List Rendering */}
        {/* 动态网格内容展示 */}
        {isLoading ? (
          /* Loading Skeleton Grid */
          /* 加载骨架屏 */
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="animate-pulse bg-white rounded-2xl p-2 border border-gray-100">
                <div className="bg-gray-200 aspect-square w-full rounded-xl mb-4" />
                <div className="h-4 bg-gray-200 rounded w-2/3 mb-2 px-2" />
                <div className="h-3 bg-gray-200 rounded w-1/2 px-2" />
              </div>
            ))}
          </div>
        ) : processedStaffList.length > 0 ? (
          /* Cards Grid */
          /* 卡片网格 */
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
            {processedStaffList.map((staff) => (
              <StaffCard
                key={staff.id}
                staff={staff}
                onClick={() => onStaffClick(staff)}
                baseUrl={baseUrl}
              />
            ))}
          </div>
        ) : (
          /* Empty Search results template */
          /* 空结果占位 */
          <div className="text-center py-16 bg-white rounded-3xl border border-gray-100 shadow-sm">
            <p className="text-lg font-semibold text-neutral-light mb-2">No service providers found</p>
            <p className="text-sm text-neutral-light">Try adjusting your search filters or clear inputs.</p>
          </div>
        )}
      </div>
    </section>
  );
};
