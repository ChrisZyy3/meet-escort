import type { FC } from 'react';

/**
 * FeaturedIn Component
 * 
 * Displays a grayscale-filtered gallery of logos representing
 * news and media outlets where the project has been featured.
 */
export const FeaturedIn: FC = () => {
  return (
    <section className="bg-neutral-bgLight py-8 border-y border-gray-100 shadow-inner">
      <div className="max-w-7xl mx-auto px-4 text-center">
        {/* Title */}
        {/* 报道媒体标题 */}
        <h2 className="text-xs uppercase tracking-widest text-neutral-light font-bold mb-6">
          Featured In
        </h2>

        {/* Logos container */}
        {/* 报道媒体标志列表 */}
        <div className="flex flex-wrap justify-center items-center gap-8 md:gap-12 opacity-60 hover:opacity-80 transition-opacity duration-300">
          <img 
            alt="VICE logo" 
            src="/home_files/vice.png" 
            className="h-8 md:h-10 w-auto object-contain filter grayscale" 
          />
          <img 
            alt="Daily Mirror logo" 
            src="/home_files/daily-mirror.png" 
            className="h-8 md:h-10 w-auto object-contain filter grayscale" 
          />
          <img 
            alt="Daily Star logo" 
            src="/home_files/daily-star.png" 
            className="h-8 md:h-10 w-auto object-contain filter grayscale" 
          />
          <img 
            alt="Female First logo" 
            src="/home_files/female-first.png" 
            className="h-5 md:h-7 w-auto object-contain filter grayscale" 
          />
          <img 
            alt="METRO logo" 
            src="/home_files/metro.png" 
            className="h-8 md:h-10 w-auto object-contain filter grayscale" 
          />
          <img 
            alt="Sex Tech logo" 
            src="/home_files/sex-tech.png" 
            className="h-6 md:h-8 w-auto object-contain filter grayscale" 
          />
          <img 
            alt="ITV News logo" 
            src="/home_files/itv-news.png" 
            className="h-7 md:h-9 w-auto object-contain filter grayscale" 
          />
        </div>
      </div>
    </section>
  );
};
