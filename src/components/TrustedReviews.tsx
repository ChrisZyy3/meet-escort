import type { FC } from 'react';
import { Heart, Star, CheckCircle } from 'lucide-react';

/**
 * TrustedReviews Component
 * 
 * Displays aggregate review statistics and highlights three key quality assurances:
 * anonymity (Private), unedited text (Real), and verification filters (Verified).
 * 
 * Contains detailed comments on code blocks in compliance with Pair Programming rules.
 */
export const TrustedReviews: FC = () => {
  return (
    <section className="bg-neutral-bgLight py-12 md:py-16 border-y border-gray-100 shadow-inner">
      <div className="max-w-7xl mx-auto px-4 text-center">
        
        {/* Statistics Headline */}
        {/* 点评数据统计标题 */}
        <h2 className="text-2xl md:text-3.5xl font-extrabold text-neutral-dark mb-10 leading-tight">
          <span className="text-primary">60,522</span> Trusted reviews{' '}
          <span className="text-neutral-light font-medium text-lg md:text-xl block md:inline">
            from 151,372 requests
          </span>
        </h2>

        {/* Pillars Grid */}
        {/* 三大信誉支撑网格 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          
          {/* Pillar 1: Private */}
          {/* 第一支柱：隐私保障 */}
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col items-center">
            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center text-primary mb-4">
              <Heart className="w-6 h-6 fill-current" />
            </div>
            <h3 className="text-lg font-bold text-neutral-dark mb-2">
              <span className="text-primary">100%</span> Private
            </h3>
            <p className="text-sm text-neutral-light leading-relaxed">
              Once a request is complete, clients can leave a rating and written review of their escort experience. All feedback remains <em className="not-italic font-semibold text-neutral-dark">totally anonymous</em>.
            </p>
          </div>

          {/* Pillar 2: Real */}
          {/* 第二支柱：真实评价 */}
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col items-center">
            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center text-primary mb-4">
              <Star className="w-6 h-6 fill-current" />
            </div>
            <h3 className="text-lg font-bold text-neutral-dark mb-2">
              <span className="text-primary">100%</span> Real
            </h3>
            <p className="text-sm text-neutral-light leading-relaxed">
              All ratings and reviews are posted unedited for other clients to read, giving valuable and insightful feedback to the community.
            </p>
          </div>

          {/* Pillar 3: Verified */}
          {/* 第三支柱：审核验证 */}
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col items-center">
            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center text-primary mb-4">
              <CheckCircle className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-neutral-dark mb-2">
              <span className="text-primary">100%</span> Verified
            </h3>
            <p className="text-sm text-neutral-light leading-relaxed">
              Unique algorithm based on requests patterns checks help us determine which ratings and reviews are genuine, and remove fake and suspicious feedback.
            </p>
          </div>

        </div>
      </div>
    </section>
  );
};
