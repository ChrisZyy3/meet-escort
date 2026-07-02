import { useState, useEffect } from 'react';
import type { FC } from 'react';
import type { Staff } from '../types';
// Import Lock, Unlock, and Phone icons for high-quality Web3 payment visual indicators
// 导入锁具与电话图标，提供高品质 Web3 支付状态反馈
import { Lock, Unlock, Phone } from 'lucide-react';
// Import payment service integration helpers
// 导入 Web3 支付工具函数进行流程管理与钱包唤起
import { isInjectedWalletBrowser, buildPaymentReturnUrl, WALLET_META } from '../services/tron-pay';

interface StaffDetailProps {
  staff: Staff | null;
  onClose: () => void;
  baseUrl?: string;
  fetchDetailApi?: (id: number) => Promise<Staff>; // Phase 2: Async details fetcher
}

/**
 * StaffDetail Component
 * 
 * Renders a full screen overlay dialog. Provides detailed view of a selected
 * companion including bio, phone, absolute photo, pricing, and communication shortcuts.
 */
export const StaffDetail: FC<StaffDetailProps> = ({ 
  staff, 
  onClose, 
  baseUrl = '',
  fetchDetailApi
}) => {
  const [detailData, setDetailData] = useState<Staff | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Web3 payment unlock status state initialization (checks localStorage)
  // 初始化 Web3 支付解锁状态（读取本地缓存）
  const [isPaid, setIsPaid] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('meet_escort_paid') === 'true';
    }
    return false;
  });

  // Wallet selection modal display state
  // 钱包拉起选择框显示状态
  const [showWalletSelector, setShowWalletSelector] = useState<boolean>(false);

  // Booking form modal display state
  // 预约上门表单弹窗显示状态
  const [showBookingModal, setShowBookingModal] = useState<boolean>(false);

  // Form input fields for booking details, initialize bookingTime to tomorrow (T+1) at 18:00
  // 预约信息录入表单的各输入字段状态，初始化预约时间为明天 (T+1) 的 18:00
  const [bookingTime, setBookingTime] = useState<string>(() => {
    // Generate tomorrow's Date object
    // 生成明天的日期对象
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Format year, month, and day components to standard YYYY-MM-DD
    // 格式化年、月、日为标准的 YYYY-MM-DD 格式
    const year = tomorrow.getFullYear();
    const month = String(tomorrow.getMonth() + 1).padStart(2, '0');
    const day = String(tomorrow.getDate()).padStart(2, '0');

    // Combine date components with default time 18:00 for datetime-local value
    // 拼接成 HTML5 datetime-local 控件要求的 YYYY-MM-DDT18:00 字符串形式
    return `${year}-${month}-${day}T18:00`;
  });
  const [bookingLocation, setBookingLocation] = useState<string>('');
  const [bookingDuration, setBookingDuration] = useState<string>('1h');
  const [bookingContact, setBookingContact] = useState<string>('');

  // Flag to indicate if wallet launcher is triggered for booking or phone unlock
  // 标记当前拉起钱包是进行上门服务预约支付（定金 1 USDT），还是解锁联系方式支付
  const [isBookingLaunch, setIsBookingLaunch] = useState<boolean>(false);

  // Helper function to launch the target wallet app and load the DApp payment confirmation screen
  // 帮助拉起对应的钱包 App 并在其内置浏览器加载支付确认界面的辅助函数（支持预定定金模式）
  const handleWalletLaunch = (walletId: 'tronlink' | 'tokenpocket' | 'imtoken' | 'bitkeep') => {
    try {
      let returnUrl = buildPaymentReturnUrl();
      if (isBookingLaunch) {
        // Append type=booking query to callback return URL
        // 往支付成功的回跳 URL 中附带 type=booking 以便页面截获后弹出预约成功信息
        returnUrl = returnUrl.includes('?') 
          ? `${returnUrl}&type=booking` 
          : `${returnUrl}?type=booking`;
      }
      
      const meta = WALLET_META[walletId] || WALLET_META.tokenpocket;
      
      // Construct exact URL to load inside DApp browser
      // 构造收银台 URL。定金模式下强制传 price=1.00 和 type=booking 参数
      let targetUrl = `${window.location.origin}${window.location.pathname}?page=payment-confirm&walletId=${walletId}&staffId=${staff?.id}`;
      if (isBookingLaunch) {
        targetUrl += `&price=1.00&type=booking`;
      } else {
        const price = detailData?.price || staff?.price || 1;
        targetUrl += `&price=${price}`;
      }
      
      // Append return URL
      targetUrl = targetUrl.includes('?') 
        ? `${targetUrl}&returnUrl=${encodeURIComponent(returnUrl)}` 
        : `${targetUrl}?returnUrl=${encodeURIComponent(returnUrl)}`;
        
      window.location.href = meta.buildDeepLink(targetUrl);
    } catch (err: any) {
      console.error('Failed to launch wallet app', err);
      alert(`Failed to open wallet: ${err?.message || String(err)}`);
    }
  };

  // Direct local Tron pay trigger: redirects to confirmation view if inside wallet browser
  // 本地波场支付入口：如果在钱包内置浏览器中则直接跳转确认付款，否则展示钱包列表
  const triggerLocalTronPay = async (isBookingPayment = false) => {
    setIsBookingLaunch(isBookingPayment);
    
    // Check if running inside a Web3 wallet built-in browser environment
    // 检查当前是否处于注入了波场 Web3 实例的钱包浏览器环境内
    if (isInjectedWalletBrowser()) {
      let url = `${window.location.origin}${window.location.pathname}?page=payment-confirm&walletId=tokenpocket&staffId=${staff?.id}`;
      if (isBookingPayment) {
        url += `&price=1.00&type=booking`;
      } else {
        const price = detailData?.price || staff?.price || 1;
        url += `&price=${price}`;
      }
      window.location.href = url;
      return;
    }

    // Display wallet selector launcher popup if in normal system browser
    // 在普通浏览器中则弹出钱包引导框
    setShowWalletSelector(true);
  };

  // Web3 payment check hook to parse callback returnUrl from payment system
  // Web3 支付检测 Hook，用于解析支付系统回跳带来的状态参数（支持解锁电话与预定定金）
  useEffect(() => {
    const checkPaymentStatus = () => {
      if (typeof window === 'undefined') return;
      
      const currentUrl = window.location.href;
      
      // Look for paymentSuccess=1 in either search query or hash fragment
      // 在标准查询参数和 Hash 分段中查找 paymentSuccess=1
      const hasSuccess = currentUrl.includes('paymentSuccess=1') ||
                         window.location.search.includes('paymentSuccess=1') ||
                         window.location.hash.includes('paymentSuccess=1');
      
      if (hasSuccess) {
        const isBookingPay = currentUrl.includes('type=booking') || 
                             window.location.search.includes('type=booking') || 
                             window.location.hash.includes('type=booking');
                             
        if (isBookingPay) {
          // Record paid status in storage and state to unlock phone number upon booking deposit success
          // 预约成功后，同步缓存已支付状态并设置已支付解锁，打通两部分权益
          localStorage.setItem('meet_escort_paid', 'true');
          setIsPaid(true);

          // Retrieve cached booking details
          // 从本地缓存读取录入的预约订单详情
          const stored = localStorage.getItem('meet_booking_details');
          if (stored) {
            try {
              const details = JSON.parse(stored);
              alert(
                `Outcall booking payment verified successfully!\nDirect communication channels are now unlocked.\n\n` +
                `Staff: ${details.staffName}\n` +
                `Time: ${details.time}\n` +
                `Location: ${details.location}\n` +
                `Duration: ${details.duration}\n` +
                `Contact: ${details.contact}\n\n` +
                `The companion will get in touch with you shortly.`
              );
            } catch (e) {
              alert('Outcall booking deposit payment verified successfully! Booking confirmed and phone unlocked.');
            }
            localStorage.removeItem('meet_booking_details');
          } else {
            alert('Outcall booking deposit payment verified successfully! Booking confirmed and phone unlocked.');
          }
        } else {
          // Record paid status in storage for unlock call
          // 记录解锁电话已支付状态
          localStorage.setItem('meet_escort_paid', 'true');
          setIsPaid(true);
          alert('USDT payment verification successful! Direct communication channels have been unlocked.');
        }
        
        // Dynamically strip paymentSuccess and type parameters from URL to maintain clean history state
        // 动态剔除 URL 中的 paymentSuccess 及 type 参数，保持干净的历史记录状态
        const cleanedUrl = currentUrl
          .replace(/([?&])paymentSuccess=1&?/, '$1')
          .replace(/([?&])type=booking&?/, '$1')
          .replace(/[?&]$/, '');
        
        window.history.replaceState(null, '', cleanedUrl);
        
        // Display user notification toast/dialog
        // 提示用户成功解锁
        alert('USDT payment verification successful! Direct communication channels have been unlocked.');
      }
    };

    checkPaymentStatus();
    window.addEventListener('hashchange', checkPaymentStatus);
    return () => {
      window.removeEventListener('hashchange', checkPaymentStatus);
    };
  }, []);

  useEffect(() => {
    // Reset states when the selected staff changes
    // 当选择的服务人员改变时，重置状态
    setDetailData(staff);
    setError(null);

    if (staff && fetchDetailApi) {
      // Async detail fetch for Phase 2 API integration
      // 针对第二阶段 API 接口的动态异步加载详细信息
      setLoading(true);
      fetchDetailApi(staff.id)
        .then((data) => {
          setDetailData(data);
          setLoading(false);
        })
        .catch((err) => {
          console.error("Error fetching staff detail:", err);
          setError("Failed to load details. Showing cached info.");
          setLoading(false);
        });
    }
  }, [staff, fetchDetailApi]);

  // Lock scrolling on document body while the modal is open
  // 当模态弹窗打开时，锁定页面主体滚动
  useEffect(() => {
    if (staff) {
      document.body.classList.add('noscroll');
    } else {
      document.body.classList.remove('noscroll');
    }
    return () => {
      document.body.classList.remove('noscroll');
    };
  }, [staff]);

  if (!staff) return null;

  // Resolve photo URL absolute path
  // 解析绝对图片地址
  const resolvedPhoto = detailData?.photoUrl
    ? (detailData.photoUrl.startsWith('http') || detailData.photoUrl.startsWith('/home_files')
        ? detailData.photoUrl 
        : `${baseUrl}${detailData.photoUrl}`)
    : '';

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div 
        className="relative bg-white dark:bg-zinc-900 rounded-3xl overflow-hidden w-full max-w-4xl shadow-2xl border border-gray-100 dark:border-zinc-800 animate-slide-up"
        onClick={(e) => e.stopPropagation()} // Stop click propagation to background overlay
      >
        {/* Close Button overlay */}
        {/* 关闭按钮 */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 z-10 w-10 h-10 flex items-center justify-center rounded-full bg-black/50 hover:bg-black/70 text-white text-2xl font-bold cursor-pointer transition-colors duration-200"
          title="Close details"
        >
          &times;
        </button>

        {/* Modal Layout */}
        {/* 弹窗内容排版 */}
        <div className="flex flex-col md:flex-row min-h-[500px]">
          {/* Photo Column */}
          {/* 图片列 */}
          <div className="w-full md:w-1/2 bg-neutral-bgLight relative aspect-square md:aspect-auto">
            {resolvedPhoto ? (
              <img 
                src={resolvedPhoto} 
                alt={`${staff.name} profile`} 
                className="w-full h-full object-cover" 
              />
            ) : (
              <div className="w-full h-full flex flex-col justify-center items-center bg-primary/5 text-primary text-4xl font-extrabold">
                {staff.name.charAt(0).toUpperCase()}
                <span className="text-sm font-semibold text-neutral-light mt-2">No Photo</span>
              </div>
            )}
          </div>

          {/* Details Column */}
          {/* 信息详情列 */}
          <div className="w-full md:w-1/2 p-6 md:p-10 flex flex-col justify-between">
            <div>
              {/* Header tags: Status & Price */}
              {/* 头部状态与价格显示 */}
              <div className="flex items-center justify-between gap-4 mb-4">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                  <span className="w-1.5 h-1.5 bg-green-500 rounded-full mr-1.5 animate-pulse" />
                  Online Now
                </span>
                
                {/* Price Display */}
                {/* 价格 */}
                <span className="text-lg md:text-xl font-extrabold text-primary">
                  {detailData?.price ? `¥${detailData.price.toFixed(2)} / hr` : 'Price on request'}
                </span>
              </div>

              {/* Name header */}
              {/* 姓名 */}
              <h3 className="text-2xl md:text-4xl font-extrabold text-neutral-dark dark:text-white mb-2">
                {detailData?.name || staff.name}
              </h3>

              {/* Description bio text */}
              {/* 简介 / 描述 */}
              <p className="text-sm md:text-base text-neutral-medium dark:text-zinc-300 leading-relaxed mb-6 whitespace-pre-line min-h-[100px]">
                {loading ? 'Loading details...' : (detailData?.description || 'Professional service provider.')}
              </p>

              {/* Created date & metadata info */}
              {/* 细节元数据 */}
              <div className="text-xs text-neutral-light dark:text-zinc-500 space-y-1 mb-8">
                {detailData?.createdAt && (
                  <div>Registered on: {new Date(detailData.createdAt).toLocaleDateString()}</div>
                )}
                {error && <div className="text-red-500 font-semibold">{error}</div>}
              </div>
            </div>

            {/* Direct Communication Action row */}
            {/* 通讯与预约操作栏 */}
            <div className="space-y-3">
              {detailData?.phone ? (
                /* Primary Call Button with masked/full phone number based on payment status */
                /* 呼叫热线电话（根据支付状态展示掩码/完整电话，并处理支付跳转） */
                <a
                  href={`tel:${detailData.phone}`}
                  onClick={(e) => {
                    if (!isPaid) {
                      // Prevent telephone dialing if not paid, and trigger payment flow directly instead of showing booking form
                      // 若未支付，拦截默认电话拨号，直接触发解锁电话支付流程而非弹出预约框
                      e.preventDefault();
                      triggerLocalTronPay(false);
                    }
                  }}
                  className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-primary-hover text-white font-bold py-3.5 px-6 rounded-full shadow-lg hover:shadow-primary/30 transition-all duration-200"
                >
                  {isPaid ? <Unlock className="w-5 h-5" /> : <Lock className="w-5 h-5" />}
                  <span>
                    {(isPaid ? 'Call Now: ' : 'Unlock Call Now: ') + (() => {
                      const phone = detailData.phone.trim();
                      if (isPaid) return phone;
                      if (phone.length <= 4) return phone;
                      return '*'.repeat(phone.length - 4) + phone.slice(-4);
                    })()}
                  </span>
                </a>
              ) : (
                <button
                  disabled
                  className="block w-full text-center bg-neutral-light text-white font-bold py-3.5 px-6 rounded-full cursor-not-allowed opacity-50"
                >
                  No Contact Provided
                </button>
              )}

              {/* "Meet" Booking button trigger */}
              {/* “Meet” 上门服务预约录入按钮（采用渐变设计，外观与 Unlock Call 同样显眼） */}
              {detailData?.phone && (
                <button
                  onClick={() => setShowBookingModal(true)}
                  className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-primary to-hellobar hover:opacity-90 text-white font-bold py-3.5 px-6 rounded-full shadow-lg shadow-hellobar/20 transition-all duration-200 cursor-pointer border-none"
                >
                  <Phone className="w-4 h-4" />
                  <span>Meet</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Wallet selector launcher popup overlay */}
      {/* Web3 钱包客户端呼叫启动模态弹窗 */}
      {showWalletSelector && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div 
            className="relative bg-zinc-950 text-white rounded-3xl p-6 md:p-8 w-full max-w-md shadow-2xl border border-zinc-800 animate-scale-in text-center animate-slide-up"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close modal button */}
            {/* 关闭按钮 */}
            <button 
              onClick={() => setShowWalletSelector(false)}
              className="absolute top-4 right-4 text-zinc-400 hover:text-white text-2xl font-bold transition-colors cursor-pointer"
            >
              &times;
            </button>
            
            {/* Title / Icon header */}
            {/* 头部图标与说明 */}
            <Lock className="w-12 h-12 text-primary mx-auto mb-4 animate-bounce" />
            <h4 className="text-xl md:text-2xl font-extrabold mb-2 tracking-tight text-white">
              Unlock Contact Number
            </h4>
            <p className="text-zinc-400 text-xs md:text-sm mb-6 leading-relaxed">
              Launch a Web3 Tron wallet to open this page. Once inside, tap 'Unlock' to sign the USDT authorization.
            </p>
            
            {/* Wallet Selection Grid */}
            {/* 钱包网格按钮组 */}
            <div className="grid grid-cols-2 gap-3 mb-6">
              {/* TokenPocket launcher */}
              {/* TP 钱包拉起 */}
              <button
                onClick={() => handleWalletLaunch('tokenpocket')}
                className="flex flex-col items-center p-4 bg-zinc-900/50 hover:bg-zinc-900 rounded-2xl border border-zinc-800 hover:border-primary/50 transition-all duration-200 cursor-pointer"
              >
                <div className="w-12 h-12 flex items-center justify-center rounded-xl bg-blue-600 font-extrabold text-white text-lg shadow-md mb-2">
                  TP
                </div>
                <span className="text-xs font-bold text-zinc-200">TokenPocket</span>
              </button>

              {/* TronLink launcher */}
              {/* 波场助手拉起 */}
              <button
                onClick={() => handleWalletLaunch('tronlink')}
                className="flex flex-col items-center p-4 bg-zinc-900/50 hover:bg-zinc-900 rounded-2xl border border-zinc-800 hover:border-primary/50 transition-all duration-200 cursor-pointer"
              >
                <div className="w-12 h-12 flex items-center justify-center rounded-xl bg-zinc-950 text-red-500 border border-red-500/30 font-extrabold text-lg shadow-md mb-2">
                  TL
                </div>
                <span className="text-xs font-bold text-zinc-200">TronLink</span>
              </button>

              {/* imToken launcher */}
              {/* IM 钱包拉起 */}
              <button
                onClick={() => handleWalletLaunch('imtoken')}
                className="flex flex-col items-center p-4 bg-zinc-900/50 hover:bg-zinc-900 rounded-2xl border border-zinc-800 hover:border-primary/50 transition-all duration-200 cursor-pointer"
              >
                <div className="w-12 h-12 flex items-center justify-center rounded-xl bg-cyan-600 font-extrabold text-white text-lg shadow-md mb-2">
                  IM
                </div>
                <span className="text-xs font-bold text-zinc-200">imToken</span>
              </button>

              {/* BitKeep launcher */}
              {/* Bitget 钱包拉起 */}
              <button
                onClick={() => handleWalletLaunch('bitkeep')}
                className="flex flex-col items-center p-4 bg-zinc-900/50 hover:bg-zinc-900 rounded-2xl border border-zinc-800 hover:border-primary/50 transition-all duration-200 cursor-pointer"
              >
                <div className="w-12 h-12 flex items-center justify-center rounded-xl bg-gradient-to-tr from-purple-600 to-orange-500 font-extrabold text-white text-lg shadow-md mb-2">
                  BK
                </div>
                <span className="text-xs font-bold text-zinc-200">BitKeep</span>
              </button>
            </div>

            {/* Manual Clipboard Helper link */}
            {/* 手动复制链接块 */}
            <div className="mt-4 pt-4 border-t border-zinc-900 flex flex-col gap-2">
              <button
                onClick={() => {
                  const dappUrl = `${window.location.origin}${window.location.pathname}?staffId=${staff.id}`;
                  navigator.clipboard.writeText(dappUrl);
                  alert('DApp link copied to clipboard! Paste it inside your wallet browser.');
                }}
                className="text-xs text-primary hover:text-primary-hover font-semibold transition-colors cursor-pointer bg-transparent border-none py-1"
              >
                Copy DApp URL to Clipboard
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Booking Form Modal Overlay */}
      {/* 上门预约服务信息录入弹窗 */}
      {showBookingModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div 
            className="relative bg-zinc-950 text-white rounded-3xl p-6 md:p-8 w-full max-w-md shadow-2xl border border-zinc-800 animate-scale-in"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close modal button */}
            {/* 关闭按钮 */}
            <button 
              onClick={() => setShowBookingModal(false)}
              className="absolute top-4 right-4 text-zinc-400 hover:text-white text-2xl font-bold transition-colors cursor-pointer bg-transparent border-none"
            >
              &times;
            </button>
            
            <h4 className="text-xl md:text-2xl font-extrabold mb-2 tracking-tight text-white text-center">
              Book Outcall Service
            </h4>
            <p className="text-zinc-400 text-xs md:text-sm mb-6 text-center">
              Please enter your service details. A deposit of 1.00 USDT is required to confirm booking.
            </p>

            <form 
              onSubmit={(e) => {
                e.preventDefault();
                if (!bookingTime || !bookingLocation || !bookingContact) {
                  alert('Please fill out all booking details.');
                  return;
                }
                // Save booking details to localStorage
                localStorage.setItem('meet_booking_details', JSON.stringify({
                  time: bookingTime,
                  location: bookingLocation,
                  duration: bookingDuration,
                  contact: bookingContact,
                  staffName: detailData?.name || staff.name
                }));
                // Hide booking modal and trigger payment flow for 1.00 USDT deposit
                setShowBookingModal(false);
                triggerLocalTronPay(true);
              }}
              className="space-y-4 text-left"
            >
              {/* Service Time */}
              {/* 服务时间 */}
              <div>
                <label className="block text-[10px] font-bold text-zinc-500 uppercase mb-1">
                  {/* Select the appointment date and time */}
                  {/* 预约具体时间 */}
                  Date & Time
                </label>
                <input 
                  type="datetime-local" 
                  required
                  value={bookingTime}
                  onChange={(e) => setBookingTime(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-primary transition-colors"
                />
              </div>

              {/* Service Location */}
              {/* 服务地点 */}
              <div>
                <label className="block text-[10px] font-bold text-zinc-500 uppercase mb-1">
                  {/* Enter service address/location details */}
                  {/* 预约服务地点 */}
                  Service Address
                </label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g. Hotel name & room number"
                  value={bookingLocation}
                  onChange={(e) => setBookingLocation(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-primary transition-colors"
                />
              </div>

              {/* Service Duration */}
              {/* 服务时长 */}
              <div>
                <label className="block text-[10px] font-bold text-zinc-500 uppercase mb-1">
                  {/* Select duration of the booking */}
                  {/* 预约服务时长 */}
                  Duration
                </label>
                <select 
                  value={bookingDuration}
                  onChange={(e) => setBookingDuration(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-primary transition-colors"
                >
                  <option value="1h">1 Hour</option>
                  <option value="2h">2 Hours</option>
                  <option value="3h">3 Hours</option>
                  <option value="overnight">Overnight</option>
                </select>
              </div>

              {/* Contact Info */}
              {/* 联系方式 */}
              <div>
                <label className="block text-[10px] font-bold text-zinc-500 uppercase mb-1">
                  {/* Enter telegram handle or phone contact details */}
                  {/* 预约人联系方式 */}
                  Telegram or Phone
                </label>
                <input 
                  type="text" 
                  required
                  placeholder="@telegram or phone number"
                  value={bookingContact}
                  onChange={(e) => setBookingContact(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-primary transition-colors"
                />
              </div>

              {/* Deposit notice */}
              {/* 定金提示 */}
              <div className="bg-primary/10 border border-primary/20 rounded-xl p-3 text-[10px] text-primary/90 text-center font-bold">
                Booking Deposit Due: 1.00 USDT
              </div>

              {/* Submit CTA */}
              {/* 提交按钮 */}
              <button
                type="submit"
                className="w-full bg-primary hover:bg-primary-hover text-white font-bold py-3.5 px-6 rounded-full shadow-lg hover:shadow-primary/20 transition-all duration-300 cursor-pointer text-sm"
              >
                Confirm & Pay Deposit
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
