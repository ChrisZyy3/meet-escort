import { useState, useEffect, useMemo } from 'react';
import type { FC } from 'react';
import { 
  Clock, 
  Wallet, 
  Cpu, 
  AlertTriangle, 
  ArrowLeft, 
  CheckCircle, 
  XCircle,
  RefreshCw
} from 'lucide-react';
import type { Staff } from '../types';
import {
  DEPOSIT_CONTRACT,
  FEE_MODE,
  MIN_TRX_PAY_GATE,
  fetchWalletBalances,
  payOrder,
  validatePaymentReadiness,
  t,
  getUrlParam,
  redirectAfterPaymentSuccess,
  markOrderPaymentCompleted
} from '../services/tron-pay';
import { fetchSettings } from '../services/api';

// Props definition for the PaymentConfirm component
// 支付确认页组件的属性接口声明
interface PaymentConfirmProps {
  staffList: Staff[];
  onClose: () => void;
}

// 30 minutes countdown length in milliseconds
// 30 分钟订单倒计时的毫秒长度
const ORDER_DURATION_MS = 30 * 60 * 1000;

/**
 * PaymentConfirm Component
 * 
 * Renders a full screen payment check-out view. Matches the look, feel and logic of video-web
 * but adapted with the premium hot pink visual branding of MeetEscort.
 */
export const PaymentConfirm: FC<PaymentConfirmProps> = ({ staffList, onClose }) => {
  // Expire timestamp for order
  // 订单过期时间戳
  const [expireAt] = useState<number>(() => Date.now() + ORDER_DURATION_MS);
  
  // Format string for timer countdown (e.g., "30:00")
  // 倒计时显示文本状态
  const [countdown, setCountdown] = useState<string>('30:00');
  
  // Select active fee mode (default is RESOURCE)
  // 当前选择的矿工费扣除方式，默认“使用资源”
  const [feeMode, setFeeMode] = useState<string>(FEE_MODE.RESOURCE);
  
  // Estimated miner fee TRX display value
  // 预估消耗的 TRX 矿工费显示文本
  const [minerFeeTrx, setMinerFeeTrx] = useState<string>('0.00');
  
  // Wallet account resources (Energy & Bandwidth)
  // 钱包账户的可用能量和带宽资源数据
  const [walletResources, setWalletResources] = useState<{ energy: number; bandwidth: number }>({ energy: 0, bandwidth: 0 });
  
  // Wallet injection ready state
  // 钱包环境就绪状态
  const [walletReady, setWalletReady] = useState<boolean>(false);
  
  // Signature and transaction broadcasting loading state
  // 交易签名广播中的加载状态
  const [paying, setPaying] = useState<boolean>(false);
  
  // Pay complete tracking
  // 支付完成标记
  const [paymentCompleted, setPaymentCompleted] = useState<boolean>(false);
  
  // On-chain wallet balance data fetching state
  // 链上数据拉取中指示器
  const [loadingBalance, setLoadingBalance] = useState<boolean>(false);
  
  // Detailed feedback error messages
  // 用户交互过程的错误反馈信息
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Time tracker for balance refresh throttle
  // 上次刷新余额的时间戳，用于限流防抖
  const [lastBalanceRefreshAt, setLastBalanceRefreshAt] = useState<number>(0);

  // Current payment step tracking description
  // 支付多阶段执行的详情描述
  const [payStage, setPayStage] = useState<string>('');

  // Backend-configured TRON receive address from GET /api/settings (display only)
  // 后台配置的 TRON 收款地址；支付合约仍使用 DEPOSIT_CONTRACT
  const [tronReceiveAddress, setTronReceiveAddress] = useState<string>('');

  // Local storage address details mapping
  // 钱包余额及地址详情状态，加入 allowance 字段记录授权额度
  const [wallet, setWallet] = useState<{
    usdt: string;
    trx: string;
    address: string;
    addressShort: string;
    allowance: string;
  }>({
    usdt: '--',
    trx: '--',
    address: '',
    addressShort: '--',
    allowance: '0'
  });

  // Resolve return path from the URL parameters
  // 解析回跳 URL 参数以备支付成功后返回
  const paymentReturnUrl = useMemo(() => {
    return getUrlParam('returnUrl') || window.location.origin + window.location.pathname;
  }, []);

  // Parse wallet identifier from the URL query
  // 解析当前所选择的钱包类型（TronLink / TokenPocket 等）
  const walletType = useMemo(() => {
    const walletId = getUrlParam('walletId') || 'tokenpocket';
    return {
      id: walletId,
      name: walletId === 'tronlink' ? 'TronLink' : 
            walletId === 'tokenpocket' ? 'TokenPocket' :
            walletId === 'imtoken' ? 'imToken' :
            walletId === 'bitkeep' ? 'Bitget Wallet' :
            walletId === 'okx' ? 'OKX Wallet' : 'TokenPocket'
    };
  }, []);

  // Fetch staff companion price from listing details
  // 获取当前对应的陪侍人员信息及单价，如找不到默认为 1.00 USDT
  const selectedStaff = useMemo(() => {
    const staffId = parseInt(getUrlParam('staffId') || '0', 10);
    return staffList.find(s => s.id === staffId) || null;
  }, [staffList]);

  // Check if current payment is for outcall booking deposit
  // 检查当前交易类型是否为上门预约服务定金
  const isBooking = useMemo(() => {
    return getUrlParam('type') === 'booking';
  }, []);

  // Order total price display computed value (forces 1.00 USDT for booking deposit, hourly price for unlock)
  // 订单应付的总额（预约定金模式下强制固定为 1.00 USDT，解锁电话模式下使用时薪）
  const orderTotal = useMemo(() => {
    if (isBooking) return '1.00';
    return selectedStaff?.price ? selectedStaff.price.toString() : (getUrlParam('price') || '1.00');
  }, [selectedStaff, isBooking]);

  // Load public payment settings (TRON address for display / QR)
  useEffect(() => {
    let active = true;
    fetchSettings()
      .then((settings) => {
        if (active) setTronReceiveAddress(settings.tronAddress || '');
      })
      .catch(() => {
        // Keep empty; UI falls back to the deposit contract address.
      });
    return () => {
      active = false;
    };
  }, []);

  // Run dynamic tick countdown
  // 倒计时实时刷新定时器逻辑
  useEffect(() => {
    const updateCountdown = () => {
      const left = Math.max(0, expireAt - Date.now());
      const min = Math.floor(left / 60000);
      const sec = Math.floor((left % 60000) / 1000);
      setCountdown(`${String(min).padStart(2, '0')}:${String(sec).padStart(2, '0')}`);
      
      if (left <= 0) {
        setErrorMessage(t('common.orderExpired'));
        setTimeout(() => {
          onClose();
        }, 2000);
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [expireAt, onClose]);

  // Read wallet balances and estimate fee limit values
  // 从区块链网络中拉取余额与资源指标，并做防抖节流
  const refreshBalances = async (options: { force?: boolean; silent?: boolean } = {}) => {
    if (loadingBalance && !options.force) return;

    const now = Date.now();
    const isRateLimitThrottled = walletType.id === 'imtoken' || walletType.id === 'bitkeep';
    const refreshGap = isRateLimitThrottled ? 120000 : 30000;
    
    if (!options.force && walletReady && now - lastBalanceRefreshAt < refreshGap) {
      return;
    }

    setLoadingBalance(true);
    setErrorMessage(null);

    try {
      // Direct call to helper inside payment service
      // 聚合调用服务接口，一次性获取地址余额、授权额度与矿工费估算
      const balances = await fetchWalletBalances(walletType.id, feeMode, orderTotal);
      setWallet({
        usdt: balances.usdt,
        trx: balances.trx,
        address: balances.address,
        addressShort: balances.addressShort,
        allowance: balances.allowance
      });
      setWalletResources(balances.resources || { energy: 0, bandwidth: 0 });
      if (balances.minerFee?.amount) {
        setMinerFeeTrx(balances.minerFee.amount);
      }
      setWalletReady(true);
      setLastBalanceRefreshAt(Date.now());
    } catch (error: any) {
      setWalletReady(false);
      const msg = error?.message || String(error);
      if (!options.silent) {
        setErrorMessage(msg.includes('imToken_NO_TRONWEB') ? t('tronPay.imtokenNoTronweb') : msg);
      }
      console.error('Failed to load wallet balances', error);
    } finally {
      setLoadingBalance(false);
    }
  };

  // Trigger initial balance fetch when component mounts
  // 挂载时延时拉取，针对限流严重的钱包设置更长阻尼
  useEffect(() => {
    const isRateLimitThrottled = walletType.id === 'imtoken' || walletType.id === 'bitkeep';
    const delay = isRateLimitThrottled ? 3500 : 800;
    const timer = setTimeout(() => {
      refreshBalances({ force: true });
    }, delay);

    // Auto polling refresh balance intervals
    // 定时轮询器
    const intervalTime = isRateLimitThrottled ? 120000 : 30000;
    const interval = setInterval(() => {
      refreshBalances({ silent: true });
    }, intervalTime);

    return () => {
      clearTimeout(timer);
      clearInterval(interval);
    };
  }, [feeMode, walletType, orderTotal]);

  // Handle gas fee mode changes and trigger immediate re-estimation
  // 切换资费抵扣模式并静默重算费率
  const selectFeeMode = async (mode: string) => {
    if (feeMode === mode) return;
    setFeeMode(mode);
    setLoadingBalance(true);
    try {
      const balances = await fetchWalletBalances(walletType.id, mode, orderTotal);
      if (balances.minerFee?.amount) {
        setMinerFeeTrx(balances.minerFee.amount);
      }
    } catch (e) {
      console.warn('Re-estimating gas fee failed', e);
    } finally {
      setLoadingBalance(false);
    }
  };

  // Perform transaction flow sequence
  // 执行核心付款及授权交互操作
  const handlePay = async () => {
    if (paying || paymentCompleted) return;
    setErrorMessage(null);

    // Expire check
    if (expireAt <= Date.now()) {
      setErrorMessage(t('common.orderExpired'));
      return;
    }

    // Connect trigger if wallet not ready
    if (!walletReady) {
      await refreshBalances({ force: true });
      if (!walletReady) {
        setErrorMessage(t('payment.openInWalletBrowser', { wallet: walletType.name }));
        return;
      }
    }

    // Sync gas fee before signing
    const isRateLimitThrottled = walletType.id === 'imtoken' || walletType.id === 'bitkeep';
    const recentlyRefreshed = Date.now() - lastBalanceRefreshAt < 30000;
    if (!isRateLimitThrottled || !recentlyRefreshed) {
      await refreshBalances({ force: true });
    }

    // Validate balances sufficiency, passing current allowance to determine if we should allow evoking Approve
    // 校验账户余额及授权情况，传入当前授权金额
    const readiness = validatePaymentReadiness({
      feeMode,
      usdt: wallet.usdt,
      trx: wallet.trx,
      orderTotal,
      minerFeeTrx,
      allowance: wallet.allowance
    });
    if (!readiness.ok) {
      setErrorMessage(readiness.message || 'Validation failed');
      return;
    }

    // Launch loader stages and signature request
    // 激活加载中状态并更新支付文字
    setPaying(true);
    setPayStage('paying');

    const updateStageText = (stage: string) => {
      setPayStage(stage);
    };

    try {
      await payOrder(walletType.id, orderTotal, {
        feeMode,
        onProgress: updateStageText,
        onBeforeWalletSign: () => setPayStage('walletSign'),
        onAfterWalletSign: (stage) => {
          if (stage) setPayStage(stage);
        },
        paymentSnapshot: {
          usdt: wallet.usdt,
          trx: wallet.trx,
          resources: { ...walletResources },
          minerFeeTrx: parseFloat(minerFeeTrx),
          refreshedAt: lastBalanceRefreshAt,
          allowance: wallet.allowance
        }
      });

      // Complete and cache local paid status
      setPaymentCompleted(true);
      markOrderPaymentCompleted();
      
      // Auto redirect back
      setTimeout(() => {
        if (!redirectAfterPaymentSuccess(paymentReturnUrl)) {
          onClose();
        }
      }, 1200);
    } catch (err: any) {
      console.error('Payment execution failed', err);
      setErrorMessage(err?.message || t('common.paymentFailed'));
    } finally {
      setPaying(false);
      setPayStage('');
    }
  };

  // Convert current payStage into localized string
  // 获取当前分阶段的具体加载文本
  const getLoaderText = () => {
    if (payStage === 'walletSign') return t('payment.approveSign');
    if (payStage === 'approve') return t('payment.approveSign');
    if (payStage === 'approveConfirming') return t('payment.approveConfirming');
    if (payStage === 'deposit') return t('payment.depositSign');
    if (payStage === 'depositConfirming') return t('payment.depositConfirming');
    return t('payment.paying');
  };

  // Safety checks TRX threshold indicator validity, considering allowance to allow action button click
  // 检查安全校验通过状态，考虑授权情况以允许操作按钮激活
  const warningValid = useMemo(() => {
    const check = validatePaymentReadiness({
      feeMode,
      usdt: wallet.usdt,
      trx: wallet.trx,
      orderTotal,
      minerFeeTrx,
      allowance: wallet.allowance
    });
    return check.ok;
  }, [feeMode, wallet, orderTotal, minerFeeTrx]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950 text-white font-nunito overflow-y-auto">
      {/* Background decoration elements */}
      {/* 背景装饰光效，配合高端视觉美学 */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-primary/10 via-zinc-950 to-zinc-950 pointer-events-none" />

      {/* Main card box with glassmorphism */}
      {/* 磨砂玻璃质感的支付确认主体卡片 */}
      <div className="relative w-full max-w-lg bg-zinc-900/80 backdrop-blur-xl border border-zinc-800 rounded-3xl p-6 md:p-8 shadow-2xl flex flex-col justify-between min-h-[600px] overflow-hidden">
        
        {/* Header navigation bar */}
        {/* 头部导航操作栏 */}
        <div className="flex items-center justify-between mb-6">
          <button 
            onClick={onClose}
            className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors cursor-pointer bg-transparent border-none py-1"
            title="Go Back"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="text-sm font-semibold">Back</span>
          </button>
          
          <div className="flex items-center gap-1.5 bg-zinc-800/80 border border-zinc-700/50 px-3 py-1.5 rounded-full text-sm font-bold text-primary">
            <Clock className="w-4 h-4 animate-pulse" />
            <span>{countdown}</span>
          </div>
        </div>

        {/* Amount description section */}
        {/* 应付金额卡片区（根据定金和解锁模式显示不同订单标题与备注） */}
        <div className="text-center my-6">
          <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-widest mb-2">
            {/* Show English heading for outcall booking deposit, or dynamic translated amount due */}
            {/* 仅显示英文头部标题，避免中文混杂 */}
            {isBooking ? 'Outcall Booking Deposit' : t('payment.amountDue')}
          </h2>
          <div className="inline-flex items-baseline gap-2">
            <span className="text-5xl font-extrabold text-white tracking-tight">
              {parseFloat(orderTotal).toFixed(2)}
            </span>
            <span className="text-xl font-bold text-primary">USDT</span>
          </div>
          {selectedStaff && (
            <p className="text-xs text-zinc-500 mt-2">
              {isBooking 
                ? `Booking deposit for outcall service with `
                : `Unlocking direct channels with `
              }
              <span className="text-zinc-300 font-semibold">{selectedStaff.name}</span>
            </p>
          )}
        </div>

        {/* Balance information and wallet status */}
        {/* 钱包账户连接详情与余额卡片 */}
        <div className="space-y-4">
          <div className="bg-zinc-950/60 border border-zinc-800/80 rounded-2xl p-4">
            <div className="flex items-center justify-between border-b border-zinc-800/60 pb-3 mb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center text-primary font-bold">
                  <Wallet className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold">{t('payment.walletConnection')}</h3>
                  <span className="text-[10px] text-zinc-500 font-semibold uppercase">{walletType.name}</span>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <span className={`inline-block w-2 h-2 rounded-full ${walletReady ? 'bg-green-500' : 'bg-red-500'}`} />
                <span className="text-xs font-semibold text-zinc-400">
                  {loadingBalance ? t('payment.connecting') : (walletReady ? t('payment.connected') : t('payment.notConnected'))}
                </span>
                <button
                  onClick={() => refreshBalances({ force: true })}
                  disabled={loadingBalance}
                  className="text-zinc-400 hover:text-white disabled:opacity-30 p-1 rounded hover:bg-zinc-800 transition-colors cursor-pointer bg-transparent border-none"
                  title="Refresh Balance"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loadingBalance ? 'animate-spin' : ''}`} />
                </button>
              </div>
            </div>

            {/* Sub balances displaying */}
            {/* 多币种余额信息展示 */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-[10px] font-semibold text-zinc-500 block mb-1">
                  {t('payment.usdtBalance')}
                </span>
                <span className="text-base font-extrabold text-green-400">
                  {wallet.usdt} USDT
                </span>
              </div>
              <div>
                <span className="text-[10px] font-semibold text-zinc-500 block mb-1">
                  {t('payment.trxBalance')}
                </span>
                <span className="text-base font-extrabold text-sky-400">
                  {wallet.trx} TRX
                </span>
              </div>
            </div>

            <div className="mt-3 pt-3 border-t border-zinc-800/40 flex justify-between items-center text-[10px] text-zinc-500">
              <span>{t('payment.address')}</span>
              <span className="font-mono text-zinc-300 font-bold bg-zinc-900 px-2 py-0.5 rounded border border-zinc-800/80">
                {wallet.addressShort}
              </span>
            </div>
          </div>

          {/* Gas fee options and estimator selector */}
          {/* 资费抵扣方式选择与估算 */}
          <div className="bg-zinc-950/60 border border-zinc-800/80 rounded-2xl p-4">
            <div className="flex items-center justify-between mb-3.5">
              <div className="flex items-center gap-2">
                <Cpu className="w-4 h-4 text-sky-400" />
                <span className="text-xs font-bold text-zinc-300">
                  {t('payment.estimatedNetworkFee')}
                </span>
              </div>
              <span className="text-xs font-extrabold text-sky-400 bg-sky-950/50 px-2 py-0.5 rounded-full border border-sky-900/30">
                {loadingBalance ? t('payment.feeCalculating') : `~${minerFeeTrx} TRX`}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => selectFeeMode(FEE_MODE.RESOURCE)}
                className={`py-2 px-3 rounded-xl border text-left transition-all cursor-pointer bg-transparent ${
                  feeMode === FEE_MODE.RESOURCE 
                    ? 'border-primary bg-primary/5 text-white' 
                    : 'border-zinc-800 text-zinc-500 hover:border-zinc-700/80 hover:text-zinc-300'
                }`}
              >
                <span className="text-[10px] font-bold block">{t('payment.useResources')}</span>
                <span className="text-[9px] opacity-70">{t('payment.energyBandwidth')}</span>
              </button>
              <button
                onClick={() => selectFeeMode(FEE_MODE.BURN)}
                className={`py-2 px-3 rounded-xl border text-left transition-all cursor-pointer bg-transparent ${
                  feeMode === FEE_MODE.BURN 
                    ? 'border-primary bg-primary/5 text-white' 
                    : 'border-zinc-800 text-zinc-500 hover:border-zinc-700/80 hover:text-zinc-300'
                }`}
              >
                <span className="text-[10px] font-bold block">{t('payment.burnTrx')}</span>
                <span className="text-[9px] opacity-70">{t('payment.burnTrxTokens')}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Error / Warning Alert container */}
        {/* 校验提示及安全警告面板 */}
        <div className="my-5">
          {errorMessage ? (
            <div className="flex items-start gap-2.5 bg-red-950/20 border border-red-900/30 rounded-2xl p-3.5 text-xs text-red-400 animate-fade-in">
              <XCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span className="font-semibold leading-relaxed">{errorMessage}</span>
            </div>
          ) : (
            <div className={`flex items-start gap-2.5 rounded-2xl p-3.5 text-xs transition-all ${
              warningValid 
                ? 'bg-zinc-950/40 border border-zinc-800/80 text-zinc-400' 
                : 'bg-amber-950/20 border border-amber-900/30 text-amber-400'
            }`}>
              <AlertTriangle className={`w-4 h-4 shrink-0 mt-0.5 ${warningValid ? 'text-zinc-500' : 'text-amber-500'}`} />
              <span className="font-semibold leading-relaxed">
                {feeMode === FEE_MODE.BURN 
                  ? t('payment.warningBurnMode', { total: Math.max(parseFloat(minerFeeTrx), MIN_TRX_PAY_GATE).toFixed(2) })
                  : t('payment.tisp')
                }
              </span>
            </div>
          )}
        </div>

        {/* Contract notice text */}
        {/* 收款说明 */}
        <p className="text-[10px] text-zinc-500 text-center leading-relaxed px-4 mb-6">
          {t('payment.contractDesc')}:{' '}
          <span className="font-mono text-zinc-400 block break-all font-bold mt-1 bg-zinc-950 py-1 rounded border border-zinc-800/40">
            {DEPOSIT_CONTRACT}
          </span>
          {tronReceiveAddress ? (
            <span className="mt-3 block text-[11px] text-zinc-500">
              Configured receive address (from settings):
              <span className="font-mono text-zinc-300 block break-all font-bold mt-1 bg-zinc-950 py-1 rounded border border-zinc-800/40">
                {tronReceiveAddress}
              </span>
            </span>
          ) : null}
        </p>

        {/* Footer pay trigger CTA button */}
        {/* 底部支付操作触发按钮 */}
        <div>
          <button
            onClick={handlePay}
            disabled={paying || paymentCompleted || !walletReady || !warningValid}
            className={`w-full py-4 rounded-full font-bold flex items-center justify-center gap-2 shadow-lg transition-all duration-300 cursor-pointer ${
              paymentCompleted
                ? 'bg-green-500 hover:bg-green-600 text-white shadow-green-500/20'
                : paying
                ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed border border-zinc-700/50'
                : !walletReady || !warningValid
                ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed border border-zinc-800/60'
                : 'bg-primary hover:bg-primary-hover text-white shadow-primary/20 hover:scale-[1.02]'
            }`}
          >
            {paymentCompleted ? (
              <>
                <CheckCircle className="w-5 h-5" />
                <span>{t('common.paymentSuccess')}</span>
              </>
            ) : paying ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>{getLoaderText()}</span>
              </>
            ) : (
              <span>
                {!walletReady 
                  ? t('payment.connectWallet', { wallet: walletType.name }) 
                  : t('payment.payNow')
                }
              </span>
            )}
          </button>
        </div>

      </div>
    </div>
  );
};
