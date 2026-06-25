import { useState, useEffect } from 'react';
import { HelloBar } from './components/HelloBar';
import { CookieBanner } from './components/CookieBanner';
import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { FeaturedIn } from './components/FeaturedIn';
import { ActivityFeed } from './components/ActivityFeed';
import { TrustedReviews } from './components/TrustedReviews';
import { StaffGrid } from './components/StaffGrid';
import { Features } from './components/Features';
import { RegisteredGrid } from './components/RegisteredGrid';
import { WhySmooci } from './components/WhySmooci';
import { Footer } from './components/Footer';
import { StaffDetail } from './components/StaffDetail';

// Import Types, mock fallback list, and API service functions
// 引入类型声明、本地备用数据与 API 请求函数
import type { Staff } from './types';
import { mockStaffList } from './mockData';
import { fetchStaffList, fetchStaffDetail, API_BASE_URL } from './services/api';

/**
 * App Root Component
 * 
 * Orchestrates layout components, executes API synchronization, and handles details routing.
 */
export default function App() {
  // Service personnel listing data state
  // 服务人员列表数据状态
  const [staffList, setStaffList] = useState<Staff[]>([]);
  
  // Dialog selection tracking state
  // 选中的人员详情弹窗状态
  const [selectedStaff, setSelectedStaff] = useState<Staff | null>(null);
  
  // Interface loading indicator state
  // 页面骨架屏加载状态
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    // Load staff listing from live API on component mount
    // 组件挂载时自动请求后端接口，拉取人员列表
    fetchStaffList()
      .then((data) => {
        setStaffList(data);
        setIsLoading(false);
      })
      .catch((error) => {
        console.error("API error, falling back to local mock data:", error);
        // Fallback to offline mock data if connection fails to maintain layout visual integrity
        // 若网络错误或 CORS 问题，采用本地 Mock 数据兜底，确保页面展示完整
        setStaffList(mockStaffList);
        setIsLoading(false);
      });
  }, []);

  // Automatically open staff detail if staffId is present in URL query
  // 若 URL 查询参数中包含 staffId，则在列表拉取完成后，自动打开对应陪侍人员详情弹窗
  useEffect(() => {
    if (staffList.length > 0) {
      const urlParams = new URLSearchParams(window.location.search);
      const staffIdParam = urlParams.get('staffId');
      if (staffIdParam) {
        const id = parseInt(staffIdParam, 10);
        const matched = staffList.find((s) => s.id === id);
        if (matched) {
          setSelectedStaff(matched);
        }
      }
    }
  }, [staffList]);

  // Smooth scroll to staff grid directory anchor
  // 平滑滚动至在线列表网格
  const scrollToDirectory = () => {
    const section = document.getElementById('directory');
    if (section) {
      section.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Open profile detail modal
  // 点击人员卡片，展开详情对话框
  const handleStaffClick = (staff: Staff) => {
    setSelectedStaff(staff);
  };

  // Close profile detail modal
  // 关闭详情对话框
  const handleCloseModal = () => {
    setSelectedStaff(null);
  };

  return (
    <div className="min-h-screen bg-white text-neutral-medium">
      {/* 1. Header announcements */}
      {/* 顶部通告栏 */}
      <HelloBar />

      {/* 2. Platform Navigation */}
      {/* 导航栏 */}
      <Navbar />

      {/* 3. Hero Section (using the first 8 staff members as bubble avatars) */}
      {/* 巨幕展示区（气泡头像使用拉取的前 8 位人员数据） */}
      <Hero 
        staffList={staffList} 
        onSearchClick={scrollToDirectory} 
        onStaffClick={handleStaffClick} 
        baseUrl={API_BASE_URL} // Prepend API base domain to staff bubble images / 为头像气泡图片传入 API 域名
      />

      {/* 4. Publisher badges row */}
      {/* 报道媒体合作墙 */}
      <FeaturedIn />

      {/* 5. Live update stream items */}
      {/* 实时动态流 */}
      <ActivityFeed />

      {/* 5.5. Trusted Reviews Stats Pillar Block */}
      {/* 真实评价统计及验证栏 */}
      <TrustedReviews />

      {/* 6. Online Grid directory */}
      {/* 在线服务人员卡片列表网格 */}
      <StaffGrid 
        staffList={staffList} 
        onStaffClick={handleStaffClick} 
        isLoading={isLoading} 
        baseUrl={API_BASE_URL}
      />

      {/* 7. Platform Features and values */}
      {/* 工作流流程与 9 大优势模块 */}
      <Features />

      {/* 7.3. Total Registered Escorts Thumbnail Grid */}
      {/* 注册人员大网格缩略图列表 */}
      <RegisteredGrid onSearchClick={scrollToDirectory} />

      {/* 7.7. Safety, Trust, Privacy & Support Section */}
      {/* 四大安全信任保障板块 */}
      <WhySmooci />

      {/* 8. Links Index Directory & Badges */}
      {/* 页脚细目导航与支付方式 */}
      <Footer />

      {/* 9. Age verification gate Overlay */}
      {/* Cookie 与年龄限制确认遮罩 */}
      <CookieBanner />

      {/* 10. Sliding Profile Details Overlay */}
      {/* 异步拉取单个服务人员精准资料的弹窗遮罩 */}
      <StaffDetail 
        staff={selectedStaff} 
        onClose={handleCloseModal} 
        baseUrl={API_BASE_URL}
        fetchDetailApi={fetchStaffDetail}
      />
    </div>
  );
}
