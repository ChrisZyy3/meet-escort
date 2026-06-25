import type { FC } from 'react';
import { mockActivities } from '../mockData';

/**
 * ActivityFeed Component
 * 
 * Renders the "Live updates" feed, presenting join updates, timeline image posts,
 * and text updates from staff in a responsive, two-column layout.
 */
export const ActivityFeed: FC = () => {
  return (
    <section className="bg-white py-12 md:py-16">
      <div className="max-w-7xl mx-auto px-4">
        {/* Title elements */}
        {/* 标题 */}
        <div className="mb-10 text-center md:text-left">
          <h2 className="text-3xl font-bold text-neutral-dark mb-2">
            Live escort updates
          </h2>
          <h3 className="text-lg text-neutral-light">
            Latest reviews, photos and activity
          </h3>
        </div>

        {/* Responsive grid container */}
        {/* 响应式网格布局 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {mockActivities.map((act) => (
            <div 
              key={act.id} 
              className="flex gap-4 p-5 rounded-2xl bg-neutral-bgLight/40 hover:bg-neutral-bgLight/80 border border-gray-100 transition-all duration-300 shadow-sm hover:shadow-md"
            >
              {/* Profile Image Column */}
              {/* 头像列 */}
              <div className="flex-shrink-0">
                <img
                  src={act.image}
                  alt={`${act.name} live update`}
                  className="w-16 h-16 md:w-20 md:h-20 rounded-xl object-cover shadow-sm border border-gray-200"
                />
              </div>

              {/* Content Description Column */}
              {/* 内容描述列 */}
              <div className="flex-grow flex flex-col justify-between">
                <div>
                  <div className="text-sm md:text-base text-neutral-dark font-medium leading-relaxed">
                    <span className="font-bold text-primary mr-1 hover:underline cursor-pointer">
                      {act.name}
                    </span>{' '}
                    {act.action}
                  </div>

                  {/* Optional Timeline image post */}
                  {/* 可选的时线动态附图 */}
                  {act.timelineImage && (
                    <div className="mt-3 overflow-hidden rounded-xl border border-gray-200 max-w-[200px] hover-scale">
                      <img
                        src={act.timelineImage}
                        alt={`${act.name} timeline upload`}
                        className="w-full object-cover aspect-square"
                      />
                    </div>
                  )}

                  {/* Optional message quote block */}
                  {/* 可选的引言状态文本 */}
                  {act.details && (
                    <blockquote className="mt-2 text-xs md:text-sm text-neutral-medium italic pl-3 border-l-2 border-primary/40 bg-white/50 py-1 pr-2 rounded-r-md">
                      "{act.details}"
                    </blockquote>
                  )}
                </div>

                {/* Relative timestamp */}
                {/* 相对发布时间 */}
                <div className="mt-3 text-xs text-neutral-light font-semibold">
                  {act.time}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
