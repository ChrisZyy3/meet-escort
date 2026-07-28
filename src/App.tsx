import { useState, useEffect } from 'react';
import { HelloBar } from './components/HelloBar';
import { CookieBanner } from './components/CookieBanner';
import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { FeaturedIn } from './components/FeaturedIn';
import { StaffGrid } from './components/StaffGrid';
import { Features } from './components/Features';
import { WhySmooci } from './components/WhySmooci';
import { Footer } from './components/Footer';
import { StaffDetail } from './components/StaffDetail';
import { MeetEscortFlow } from './components/MeetEscortFlow';
import { FavoritesPanel } from './components/FavoritesPanel';

// Import API-backed types and service functions.
// 引入类型声明、本地备用数据与 API 请求函数
import type { AuthUser, Staff } from './types';
import {
  API_BASE_URL,
  clearAuthSession,
  fetchCurrentUser,
  fetchStaffDetail,
  fetchStaffList,
  getStoredAuthToken,
  getStoredAuthUser,
  logoutUser,
} from './services/api';
// Import the new Web3 payment confirmation component
// 导入新增的 Web3 支付确认页组件
import { PaymentConfirm } from './components/PaymentConfirm';
import { AuthModal } from './components/AuthModal';
import { Toast, type ToastKind } from './components/Toast';

const FAVORITES_STORAGE_KEY = 'meet_escort_favorite_ids';

const loadFavoriteIds = (): Set<number> => {
  if (typeof window === 'undefined') return new Set();
  try {
    const saved = JSON.parse(localStorage.getItem(FAVORITES_STORAGE_KEY) || '[]');
    return new Set(Array.isArray(saved) ? saved.filter((id): id is number => Number.isInteger(id)) : []);
  } catch {
    return new Set();
  }
};

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
  const [staffError, setStaffError] = useState<string | null>(null);
  const [isMeetFlowOpen, setIsMeetFlowOpen] = useState<boolean>(false);
  const [isFavoritesOpen, setIsFavoritesOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [authUser, setAuthUser] = useState<AuthUser | null>(() => getStoredAuthUser());
  const [toast, setToast] = useState<{ message: string; kind: ToastKind } | null>(null);
  const [favoriteIds, setFavoriteIds] = useState<Set<number>>(loadFavoriteIds);

  // Simple query-param based routing to toggle between main view and payment confirm view
  // 基于查询参数的简易路由，决定渲染主应用还是支付确认界面
  const [currentPage, setCurrentPage] = useState<'main' | 'payment-confirm'>(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      return urlParams.get('page') === 'payment-confirm' ? 'payment-confirm' : 'main';
    }
    return 'main';
  });

  // Watch for history state/popstate events to sync navigation changes
  // 监听浏览器历史状态变化，同步当前路由页面状态
  useEffect(() => {
    const handlePopState = () => {
      const urlParams = new URLSearchParams(window.location.search);
      setCurrentPage(urlParams.get('page') === 'payment-confirm' ? 'payment-confirm' : 'main');
      const staffId = parseInt(urlParams.get('staffId') || '', 10);
      if (Number.isNaN(staffId)) {
        setSelectedStaff(null);
        return;
      }
      const matched = staffList.find((staff) => staff.id === staffId) || null;
      setSelectedStaff(matched);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [staffList]);


  useEffect(() => {
    // Load staff listing from live API on component mount
    // 组件挂载时自动请求后端接口，拉取人员列表
    fetchStaffList()
      .then((data) => {
        setStaffList(data);
        setStaffError(null);
        setIsLoading(false);
      })
      .catch((error) => {
        console.error('Failed to load staff list:', error);
        setStaffList([]);
        setStaffError(error instanceof Error ? error.message : 'Unable to load profiles right now.');
        setIsLoading(false);
      });
  }, []);

  // Restore session from stored token when the app loads
  useEffect(() => {
    if (!getStoredAuthToken()) return;
    fetchCurrentUser()
      .then((user) => setAuthUser(user))
      .catch(() => {
        clearAuthSession();
        setAuthUser(null);
      });
  }, []);

  useEffect(() => {
    localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(Array.from(favoriteIds)));
  }, [favoriteIds]);

  const toggleFavorite = (id: number) => {
    setFavoriteIds((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const showToast = (message: string, kind: ToastKind = 'success') => {
    setToast({ message, kind });
  };

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

  // Open profile detail modal
  // 点击人员卡片，展开详情对话框
  const handleStaffClick = (staff: Staff) => {
    const url = new URL(window.location.href);
    url.searchParams.set('page', 'profile');
    url.searchParams.set('staffId', String(staff.id));
    window.history.pushState(null, '', url.toString());
    setSelectedStaff(staff);
  };

  // Close profile detail modal
  // 关闭详情对话框
  const handleCloseModal = () => {
    const url = new URL(window.location.href);
    url.searchParams.delete('staffId');
    if (url.searchParams.get('page') === 'profile') {
      url.searchParams.delete('page');
    }
    window.history.replaceState(null, '', url.toString());
    setSelectedStaff(null);
  };

  // If currently routed to the payment confirmation screen, render it full screen
  // 如果当前路由跳转到了支付确认页面，则全屏渲染该组件并挂载对应的返回回调
  if (currentPage === 'payment-confirm') {
    return (
      <PaymentConfirm 
        staffList={staffList}
        onClose={() => {
          // Clean history parameters and switch back to DApp main homepage
          // 剔除 URL 中的 page 及 walletId 历史参数，切换回主页面显示
          const url = new URL(window.location.href);
          url.searchParams.delete('page');
          url.searchParams.delete('walletId');
          window.history.replaceState(null, '', url.toString());
          setCurrentPage('main');
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-white text-neutral-medium">
      {/* 1. Header announcements */}
      {/* 顶部通告栏 */}
      <HelloBar />

      {/* 2. Platform Navigation */}
      {/* 导航栏 */}
      <Navbar
        user={authUser}
        onLoginClick={() => setIsAuthOpen(true)}
        onLogoutClick={async () => {
          await logoutUser();
          setAuthUser(null);
          showToast('You have been logged out.');
        }}
      />

      {/* 3. Hero Section (using the first 8 staff members as bubble avatars) */}
      {/* 巨幕展示区（气泡头像使用拉取的前 8 位人员数据） */}
      <Hero 
        staffList={staffList} 
        onMeetClick={() => setIsMeetFlowOpen(true)}
        onStaffClick={handleStaffClick} 
        baseUrl={API_BASE_URL} // Prepend API base domain to staff bubble images / 为头像气泡图片传入 API 域名
      />

      {/* 4. Publisher badges row */}
      {/* 报道媒体合作墙 */}
      <FeaturedIn />

      {/* 5. API-backed staff directory */}
      {/* 实时动态流 */}
      {/* Directory */}
      {/* 在线服务人员卡片列表网格 */}
      <StaffGrid 
        staffList={staffList} 
        onStaffClick={handleStaffClick} 
        isLoading={isLoading} 
        errorMessage={staffError}
        baseUrl={API_BASE_URL}
        favoriteIds={favoriteIds}
        onToggleFavorite={toggleFavorite}
        onShowFavorites={() => setIsFavoritesOpen(true)}
      />

      {/* 6. Platform Features and values */}
      {/* 工作流流程与 9 大优势模块 */}
      <Features />

      {/* Directory content above is sourced from the live API. */}
      {/* 7. Safety, Trust, Privacy & Support Section */}
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
        isFavorite={selectedStaff ? favoriteIds.has(selectedStaff.id) : false}
        onToggleFavorite={toggleFavorite}
      />

      {isMeetFlowOpen && (
        <MeetEscortFlow
          staffList={staffList}
          baseUrl={API_BASE_URL}
          onClose={() => setIsMeetFlowOpen(false)}
          onStaffClick={(staff) => {
            setIsMeetFlowOpen(false);
            handleStaffClick(staff);
          }}
          favoriteIds={favoriteIds}
          onToggleFavorite={toggleFavorite}
        />
      )}

      {isFavoritesOpen && (
        <FavoritesPanel
          staffList={staffList}
          favoriteIds={favoriteIds}
          baseUrl={API_BASE_URL}
          onClose={() => setIsFavoritesOpen(false)}
          onStaffClick={(staff) => {
            setIsFavoritesOpen(false);
            handleStaffClick(staff);
          }}
          onToggleFavorite={toggleFavorite}
        />
      )}

      {isAuthOpen && (
        <AuthModal
          onClose={() => setIsAuthOpen(false)}
          onError={(message) => showToast(message, 'error')}
          onAuthenticated={(session, mode) => {
            setAuthUser(session.user);
            showToast(mode === 'register' ? 'Account created successfully.' : 'Successfully signed in.');
          }}
        />
      )}

      {toast ? <Toast message={toast.message} kind={toast.kind} onClose={() => setToast(null)} /> : null}
    </div>
  );
}
