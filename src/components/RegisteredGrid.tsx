import type { FC } from 'react';

interface RegisteredGridProps {
  onSearchClick: () => void;
}

// Static list of the 25 registered companion thumbnails in public/home_files/
// 静态注册伴游头像数据列表
const registeredThumbnails = [
  "/home_files/maria-17669846974490.jpg",
  "/home_files/anna-baby-17154305866564.jpg",
  "/home_files/ava-17648689007974.jpg",
  "/home_files/nana-15575619024446.jpg",
  "/home_files/pinky-15632672706394.jpg",
  "/home_files/misaki-17012656183467.jpg",
  "/home_files/smile-15606356507970.jpg",
  "/home_files/apple-15623100050666.jpg",
  "/home_files/mazzy-17817648368181.jpg",
  "/home_files/miho-15854610612652.jpg",
  "/home_files/lia-16733403994723.jpg",
  "/home_files/nina-15609673418083.jpg",
  "/home_files/audrey-16348721686877.jpg",
  "/home_files/melek-16620653348544.jpg",
  "/home_files/kara-15689781784653.jpg",
  "/home_files/ran-ny-15797810551971.jpg",
  "/home_files/kinkyc-17325481900739.jpg",
  "/home_files/chloe-16677107958549.jpg",
  "/home_files/agnes-15607176862448.jpg",
  "/home_files/azelea-17076015277979.jpg",
  "/home_files/alicea-15647362646872.jpg",
  "/home_files/rio-nanase-17229186235364.jpg",
  "/home_files/rose-in-thailand-16503764477841.jpg",
  "/home_files/kim10-17430657439902.jpg",
  "/home_files/nina-15812396855097.jpg"
];

/**
 * RegisteredGrid Component
 * 
 * Displays the grid of registered profiles, count headers, and a search trigger button.
 * Uses a mobile 4-column layout and a desktop 5-column layout.
 */
export const RegisteredGrid: FC<RegisteredGridProps> = ({ onSearchClick }) => {
  return (
    <section className="bg-neutral-bgLight py-12 md:py-16">
      <div className="max-w-7xl mx-auto px-4 text-center">
        
        {/* Headline Count */}
        {/* 大字数量标题 */}
        <h2 className="text-3xl md:text-4xl font-extrabold text-neutral-dark mb-1">
          <span className="text-primary block md:inline text-4xl md:text-5xl mr-1">5,074</span>
          Registered escorts
        </h2>
        
        {/* Subtitle */}
        {/* 副标题 */}
        <h3 className="text-lg text-neutral-light font-semibold mb-6">
          And counting...
        </h3>

        {/* CTA Button */}
        {/* 搜索行动按钮 */}
        <div className="mb-10">
          <button
            onClick={onSearchClick}
            className="bg-primary hover:bg-primary-hover text-white font-bold py-3 px-8 rounded-full shadow-md hover:shadow-primary/30 transform hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200"
          >
            Search Now
          </button>
        </div>

        {/* Grid of 25 thumbnail pictures */}
        {/* 25位注册伴游缩略图网格 */}
        <div className="grid grid-cols-4 sm:grid-cols-5 gap-2 md:gap-4 max-w-4xl mx-auto">
          {registeredThumbnails.map((src, index) => (
            <div 
              key={index} 
              className="overflow-hidden rounded-xl bg-white border border-gray-150 aspect-square shadow-sm hover-scale cursor-pointer"
              onClick={onSearchClick}
            >
              <img
                src={src}
                alt={`Registered companion thumbnail ${index + 1}`}
                className="w-full h-full object-cover"
                loading="lazy"
              />
            </div>
          ))}
        </div>

      </div>
    </section>
  );
};
