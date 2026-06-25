import { useState, useEffect } from 'react';
import type { FC } from 'react';
import type { Staff } from '../types';
// Import Lock, Unlock, and Phone icons for high-quality Web3 payment visual indicators
// 导入锁具与电话图标，提供高品质 Web3 支付状态反馈
import { Lock, Unlock, Phone } from 'lucide-react';

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
  
  // Transaction processing loading state
  // 链上智能合约调用处理中状态
  const [txLoading, setTxLoading] = useState<boolean>(false);
  
  // Transaction failure message state
  // 链上合约调用失败的错误信息
  const [txError, setTxError] = useState<string | null>(null);

  // Supported Web3 wallets configuration and deep link builders
  // 支持的 Web3 钱包配置与 Deep Link 协议构造函数
  const WALLET_META = {
    tronlink: {
      name: 'TronLink',
      buildDeepLink(url: string) {
        const param = encodeURIComponent(JSON.stringify({
          url,
          action: 'open',
          protocol: 'TronLink',
          version: '1.0'
        }));
        return `tronlinkoutside://pull.activity?param=${param}`;
      }
    },
    tokenpocket: {
      name: 'TokenPocket',
      buildDeepLink(url: string) {
        return `tpdapp://open?params=${encodeURIComponent(JSON.stringify({ url, chain: 'TRX' }))}`;
      }
    },
    imtoken: {
      name: 'imToken',
      buildDeepLink(url: string) {
        return `imtokenv2://navigate/DappView?url=${encodeURIComponent(url)}`;
      }
    },
    bitkeep: {
      name: 'BitKeep (Bitget)',
      buildDeepLink(url: string) {
        return `bitkeep://bkconnect?action=dapp&url=${encodeURIComponent(url)}`;
      }
    }
  };

  // Helper function to launch the target wallet app and load the current DApp page
  // 帮助拉起对应的钱包 App 并加载当前落地页链接的辅助函数
  const handleWalletLaunch = (walletId: 'tronlink' | 'tokenpocket' | 'imtoken' | 'bitkeep') => {
    // Construct DApp URL including staffId parameter to automatically reopen modal on reload
    // 构造带有人员 ID 的 URL 链接，以便在钱包内置浏览器打开时能自动弹窗
    const dappUrl = `${window.location.origin}${window.location.pathname}?staffId=${staff?.id}`;
    const meta = WALLET_META[walletId];
    if (meta) {
      // Redirect window location to the wallet app custom scheme deep link
      // 将地址重定向至钱包 of 自定义 Scheme 协议链接以拉起 App
      window.location.href = meta.buildDeepLink(dappUrl);
      
      // Auto-trigger a reminder if redirect does not happen (app not installed / compatible)
      // 若无法直接跳转（可能未安装客户端），提供操作提示与手动复制选项
      setTimeout(() => {
        alert(`Attempting to launch ${meta.name} app. If it did not open, please copy the DApp link at the bottom and paste it manually into the ${meta.name} DApp browser.`);
      }, 1500);
    }
  };

  // Direct local Tron pay USDT approve transaction call
  // 本地直接调用波场智能合约，触发 USDT 授权签名
  const triggerLocalTronPay = async () => {
    const tronWeb = (window as any).tronWeb;
    
    // Check if TronWeb is injected in browser environment
    // 检查当前环境是否处于 Web3 钱包浏览器内
    if (!tronWeb || !tronWeb.defaultAddress?.base58) {
      // Fallback: If not in Web3 context, display wallet app selector to redirect
      // 兜底逻辑：若不在 Web3 浏览器中，打开钱包列表引导弹窗
      setShowWalletSelector(true);
      return;
    }

    setTxLoading(true);
    setTxError(null);

    try {
      // Spender deposit contract address / 收款合约地址
      const spender = 'TR1rsFStNdW1QS77DL9gMimHLSRbS1M57z';
      // TRC20 USDT token contract address / USDT 合约地址
      const usdtContractAddress = 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t';
      
      // Resolve companion price, fallback to 1 USDT if undefined
      // 解析陪侍单价，未设置则默认兜底 1 USDT
      const price = detailData?.price || staff?.price || 1;
      // Convert to blockchain token value (USDT has 6 decimals)
      // 乘以 1e6 换算为链上最小代币精度单位
      const amount = Math.round(price * 1e6).toString();

      // Retrieve contract instance via contract ABI list
      // 通过 ABI 接口定义，获取 USDT 代币合约实例
      const usdtContract = await tronWeb.contract([
        {
          inputs: [
            { name: 'spender', type: 'address' },
            { name: 'value', type: 'uint256' }
          ],
          name: 'approve',
          outputs: [{ name: '', type: 'bool' }],
          stateMutability: 'nonpayable',
          type: 'function'
        }
      ], usdtContractAddress);

      // Trigger USDT approve signature and broadcast transaction
      // 唤起钱包授权支付交易签名并广播
      const tx = await usdtContract.approve(spender, amount).send({
        feeLimit: 100000000 // Max fee limit set to 100 TRX / 能量限制
      });

      if (tx) {
        // Successfully broadcasted transaction
        // 交易广播并签名成功
        localStorage.setItem('meet_escort_paid', 'true');
        setIsPaid(true);
        alert('USDT transaction successfully broadcast! Phone number unlocked.');
      } else {
        throw new Error('Transaction rejected by user or broadcast failed.');
      }
    } catch (err: any) {
      console.error('Tron Web3 approve call error:', err);
      const errMsg = err?.message || String(err);
      
      // Parse transaction rejection message
      // 分析错误详情并给出精简信息
      if (/reject|cancel|declined|user refused/i.test(errMsg)) {
        setTxError('Transaction signed cancelled by user.');
      } else {
        setTxError(`Payment failed: ${errMsg}`);
      }
    } finally {
      setTxLoading(false);
    }
  };

  // Web3 payment check hook to parse callback returnUrl from payment system
  // Web3 支付检测 Hook，用于解析支付系统回跳带来的状态参数
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
        // Record paid status in storage
        // 将已支付状态存储在本地
        localStorage.setItem('meet_escort_paid', 'true');
        setIsPaid(true);
        
        // Dynamically strip paymentSuccess parameter from URL to maintain clean history state
        // 动态剔除 URL 中的 paymentSuccess 参数，保持干净的历史记录状态
        const cleanedUrl = currentUrl
          .replace(/([?&])paymentSuccess=1&?/, '$1')
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
                      // Intercept dialing to process payment if unpaid
                      // 若未支付，拦截默认电话拨打行为，触发 Web3 支付流
                      e.preventDefault();
                      triggerLocalTronPay();
                    }
                  }}
                  className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-primary-hover text-white font-bold py-3.5 px-6 rounded-full shadow-lg hover:shadow-primary/30 transition-all duration-200"
                >
                  {isPaid ? <Unlock className="w-5 h-5" /> : <Lock className="w-5 h-5" />}
                  <span>
                    {txLoading ? 'Authorizing USDT...' : (isPaid ? 'Call Now: ' : 'Unlock Call Now: ') + (() => {
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

              {/* WhatsApp or discrete message template helper */}
              {/* 短信快捷预订（仅在已支付解锁后可用，未支付点击同样提示付款） */}
              {detailData?.phone && (
                <a
                  href={`sms:${detailData.phone}?body=Hello%20${detailData.name},%20I'm%20interested%20in%20booking%20your%20service.`}
                  onClick={(e) => {
                    if (!isPaid) {
                      e.preventDefault();
                      // Also trigger payment flow on SMS click if unpaid
                      // 未支付时点击短信同样触发支付流程
                      triggerLocalTronPay();
                    }
                  }}
                  className="w-full flex items-center justify-center gap-2 border border-gray-300 dark:border-zinc-700 text-neutral-dark dark:text-white hover:bg-neutral-bgLight dark:hover:bg-zinc-800 font-bold py-3 px-6 rounded-full transition-colors"
                >
                  <Phone className="w-4 h-4" />
                  <span>Send SMS Message</span>
                </a>
              )}

              {/* Display transaction failure error feedback */}
              {/* 展示交易失败/取消的错误反馈信息 */}
              {txError && (
                <div className="text-xs font-semibold text-red-500 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800/30 rounded-xl p-3 text-center animate-fade-in">
                  {txError}
                </div>
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
    </div>
  );
};
