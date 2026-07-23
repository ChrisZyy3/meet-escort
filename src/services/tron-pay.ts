/**
 * Web3 TRON Payment Service File
 * Wave TRON payment logic, wallet adapters, fee estimation, and contract calls.
 * 波场 (TRON) Web3 支付服务模块：管理钱包连接、估算网络矿工费、检测状态并触发智能合约交易
 */

import acceptorAbi from '../utils/UsdtAccepter.json';

// Local storage key for tracking member payment status
// 本地存储中记录用户已支付 VIP 状态的缓存键名
const MEMBER_STORAGE_KEY = 'meet_escort_paid';

// Default TRC20 USDT Mainnet Contract Address
// TRC20 USDT 主网代币合约地址
export const USDT_CONTRACT = 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t';

// Recipient Deposit Contract Address (UsdtAccepter)
// 我们的收款智能合约（UsdtAccepter）主网部署地址
export const DEPOSIT_CONTRACT = 'TR1rsFStNdW1QS77DL9gMimHLSRbS1M57z';

// Validate a normal TRON wallet recipient and reject known contract addresses.
// Direct payment must go to a wallet controlled by the receiving party.
export function isValidTronRecipientAddress(address: string): boolean {
  const target = address.trim();
  if (target === USDT_CONTRACT || target === DEPOSIT_CONTRACT) return false;
  return /^T[1-9A-HJ-NP-Za-km-z]{33}$/.test(target);
}

// Basic TRC20 ABI methods for checking balance, allowance, and approving spender
// 基础的 TRC20 代币合约 ABI 定义，用于查询余额、授权额度以及授权签名
const TRC20_ABI = [
  {
    inputs: [{ name: 'who', type: 'address' }],
    name: 'balanceOf',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [
      { name: 'owner', type: 'address' },
      { name: 'spender', type: 'address' }
    ],
    name: 'allowance',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [
      { name: 'spender', type: 'address' },
      { name: 'value', type: 'uint256' }
    ],
    name: 'approve',
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    inputs: [
      { name: 'to', type: 'address' },
      { name: 'value', type: 'uint256' }
    ],
    name: 'transfer',
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'nonpayable',
    type: 'function'
  }
];

// Supported Web3 wallets configuration and deep-link protocol builders
// 支持的 Web3 钱包元信息及 App 唤起协议 (Deep Link) 构造参数
export const WALLET_META: Record<string, {
  name: string;
  download: string;
  buildDeepLink: (url: string) => string;
  hasWaitMethod: boolean;
  needRequestAccounts: boolean;
  tronWebAlias?: string;
}> = {
  tronlink: {
    name: 'TronLink',
    download: 'https://www.tronlink.org/',
    buildDeepLink(url) {
      // Use Mainnet Chain ID by default / 默认使用波场主网 Chain ID 十六进制
      let chainId = '0x2b6653dc';
      const host = (import.meta.env.VITE_TRON_RPC_HOST || '').toLowerCase();
      
      // Match testnets if configuration directs to Nile or Shasta
      // 根据节点环境匹配 Nile 或 Shasta 测试网 Chain ID
      if (host.includes('nile')) {
        chainId = '0xcd8690dc';
      } else if (host.includes('shasta')) {
        chainId = '0x94a9059e';
      }

      // Build official TronLink custom link with action configurations
      // 构建 TronLink 官方标准的 DeepLink JSON 参数
      const param = encodeURIComponent(JSON.stringify({
        url,
        action: 'open',
        protocol: 'TronLink',
        version: '1.0',
        actionId: Date.now().toString(),
        dappName: 'MeetEscort',
        chainId
      }));
      return `tronlinkoutside://pull.activity?param=${param}`;
    },
    hasWaitMethod: true,
    needRequestAccounts: true
  },
  tokenpocket: {
    name: 'TokenPocket',
    download: 'https://www.tokenpocket.pro/',
    buildDeepLink(url) {
      return `tpdapp://open?params=${encodeURIComponent(JSON.stringify({ url, chain: 'TRX' }))}`;
    },
    hasWaitMethod: false,
    needRequestAccounts: false
  },
  imtoken: {
    name: 'imToken',
    download: 'https://token.im/',
    buildDeepLink(url) {
      return `imtokenv2://navigate/DappView?url=${encodeURIComponent(url)}`;
    },
    hasWaitMethod: false,
    needRequestAccounts: false
  },
  bitkeep: {
    name: 'Bitget Wallet',
    download: 'https://web3.bitget.com/',
    buildDeepLink(url) {
      return `bitkeep://bkconnect?action=dapp&url=${encodeURIComponent(url)}`;
    },
    hasWaitMethod: false,
    needRequestAccounts: true,
    tronWebAlias: 'bitkeepTronWeb'
  },
  okx: {
    name: 'OKX Wallet',
    download: 'https://www.okx.com/web3',
    buildDeepLink(url) {
      return `okx://wallet/dapp/url?dappUrl=${encodeURIComponent(url)}`;
    },
    hasWaitMethod: false,
    needRequestAccounts: true
  }
};

// Local translation dictionary matching video-web i18n
// 对应 video-web 多语言结构的高精度翻译字典
const TRANSLATIONS: Record<string, Record<string, string>> = {
  zh: {
    'tronPay.feeBurnEstimate': '网络费通过燃烧 TRX 支付（链上估算）',
    'tronPay.feeLowBandwidth': '带宽充足，网络费极低',
    'tronPay.feePartialResources': '资源部分不足，可能消耗少量 TRX',
    'tronPay.feeSwitchToBurn': '能量或带宽不足，建议切换至燃烧 TRX',
    'tronPay.walletNetworkError': '{wallet} 钱包网络异常',
    'tronPay.invalidPaymentAmount': '支付金额无效',
    'tronPay.insufficientTrx': 'TRX 余额不足，至少需要 {total} TRX（含约 {fee} TRX 网络费）',
    'tronPay.insufficientTrxForResourceFee': '资源不足，预计需燃烧约 {needed} TRX 作为网络费，当前 TRX 余额不够',
    'tronPay.usdtAllowanceTimeout': 'USDT 授权尚未生效，请稍后直接重试支付（无需重复授权）',
    'tronPay.usdtApprovalSignTimeout': 'USDT 授权响应超时。若已在钱包内确认，请稍候再试（无需重复授权）',
    'tronPay.usdtApprovalRejected': '已取消 USDT 授权',
    'tronPay.rateLimitError': '链节点请求频繁，请稍后重试',
    'tronPay.usdtApprovalFailed': 'USDT 授权失败：{message}',
    'tronPay.usdtDepositSignTimeout': 'USDT 支付等待超时，请在钱包或 Tronscan 查看是否有待确认交易',
    'tronPay.usdtDepositRejected': '已取消 USDT 支付',
    'tronPay.depositTxFailed': 'USDT 支付交易失败',
    'tronPay.depositTxFailedDetail': 'USDT 支付失败：{message}',
    'tronPay.usdtPaymentFailed': 'USDT 支付失败',
    'tronPay.insufficientEnergyTx': '{wallet}：能量不足，无法完成交易',
    'tronPay.feeCoveredByResources': '网络费由能量和带宽抵扣',
    'tronPay.feeInsufficientResources': '资源不足，预计燃烧 TRX（链上估算）',
    'tronPay.feeBurnFallback': '网络费通过燃烧 TRX 支付',
    'tronPay.imtokenNoTronweb': '请在 imToken 内置浏览器刷新页面，等待钱包链节点注入',
    'tronPay.imtokenNetworkBlocked': 'imToken 网络请求被拦截，切换流量或清除浏览器缓存后重试',
    'tronPay.walletFetchFailed': '获取钱包信息失败',
    'tronPay.h5Only': '钱包仅能在 H5 环境中打开',
    'tronPay.unsupportedWallet': '不支持的钱包类型：{walletId}',
    
    // UI elements translations
    'payment.confirmTitle': '确认支付',
    'payment.amountDue': '应付金额',
    'payment.walletConnection': '钱包连接',
    'payment.connecting': '连接中',
    'payment.connected': '已连接',
    'payment.notConnected': '未连接',
    'payment.usdtBalance': 'USDT 余额',
    'payment.trxBalance': 'TRX 余额',
    'payment.address': '地址',
    'payment.contractDesc': '合约收款地址，请勿直接向该地址转账，请点击下方支付按钮发起支付。（TRC20）',
    'payment.verified': '已验证',
    'payment.estimatedNetworkFee': '预估网络费',
    'payment.updatingLive': '实时更新',
    'payment.updatingFee': '正在更新预估费用...',
    'payment.feeCalculating': '计算中...',
    'payment.useResources': '使用资源',
    'payment.energyBandwidth': '能量 + 带宽',
    'payment.burnTrx': '燃烧 TRX',
    'payment.burnTrxTokens': '燃烧 TRX 代币',
    'payment.payNow': '立即支付  →',
    'payment.paying': '支付中...',
    'payment.connectWallet': '连接 {wallet}',
    'payment.payingWith': '正在使用 {token} 支付...',
    'payment.approveSign': '请在钱包中确认 USDT 授权...',
    'payment.approveConfirming': '授权已提交，链上确认中...',
    'payment.depositSign': '请在钱包中确认 USDT 扣款...',
    'payment.depositConfirming': '扣款已提交，链上确认中...',
    'payment.trxSign': '请在钱包中确认 TRX 支付...',
    'payment.trxConfirming': '支付已提交，链上确认中...',
    'payment.openInWalletBrowser': '请在 {wallet} 内置浏览器中打开',
    'payment.warningBurnMode': '「燃烧 TRX」模式：订单使用 TRX 支付。请确保 TRX 余额 ≥ {total} TRX（含网络费），否则交易将失败且无法撤销。',
    'payment.tisp': '请确保您的钱包中有足够 12 个的 TRX 用于支付矿工费，否则交易将失败且无法退回。',
    'common.orderExpired': '订单已过期，请重新发起解锁',
    'common.paymentSuccess': '支付成功',
    'common.paymentFailed': '支付失败',
    'paymentWallet.connectingWallet': '正在连接钱包...',
    'paymentWallet.connecting': '正在请求授权...',
    'paymentWallet.openingWallet': '正在打开 {wallet}',
    'paymentWallet.walletNotOpened': '{wallet} 未打开？',
    'paymentWallet.downloadPrompt': '请确认已安装钱包，或在钱包内置 DApp 浏览器中打开此页面完成支付。',
    'paymentWallet.download': '下载官网',
    'paymentWallet.gotIt': '知道了'
  },
  en: {
    'tronPay.feeBurnEstimate': 'Fee paid by burning TRX (estimated)',
    'tronPay.feeLowBandwidth': 'Bandwidth sufficient, fee very low',
    'tronPay.feePartialResources': 'Resources partially short, TRX may burn',
    'tronPay.feeSwitchToBurn': 'Resources short, recommend switching to Burn TRX',
    'tronPay.walletNetworkError': '{wallet} wallet network error',
    'tronPay.invalidPaymentAmount': 'Invalid payment amount',
    'tronPay.insufficientTrx': 'Insufficient TRX. Need at least {total} TRX (includes ~{fee} TRX network fee)',
    'tronPay.insufficientTrxForResourceFee': 'Insufficient resources. Need ~{needed} TRX for network fee',
    'tronPay.usdtAllowanceTimeout': 'USDT approval not took effect yet. Please try again',
    'tronPay.usdtApprovalSignTimeout': 'USDT approval signing timed out. If confirmed in wallet, wait a moment',
    'tronPay.usdtApprovalRejected': 'USDT approval cancelled',
    'tronPay.rateLimitError': 'Frequent requests to blockchain node. Please try again later',
    'tronPay.usdtApprovalFailed': 'USDT approval failed: {message}',
    'tronPay.usdtDepositSignTimeout': 'USDT deposit timed out. Check Tronscan for status',
    'tronPay.usdtDepositRejected': 'USDT payment cancelled',
    'tronPay.depositTxFailed': 'USDT payment transaction failed',
    'tronPay.depositTxFailedDetail': 'USDT payment failed: {message}',
    'tronPay.usdtPaymentFailed': 'USDT payment failed',
    'tronPay.insufficientEnergyTx': '{wallet}: Insufficient energy, transaction failed',
    'tronPay.feeCoveredByResources': 'Fee fully covered by Energy & Bandwidth',
    'tronPay.feeInsufficientResources': 'Insufficient resources, TRX will burn (estimated)',
    'tronPay.feeBurnFallback': 'Fee paid by burning TRX',
    'tronPay.imtokenNoTronweb': 'Please refresh in imToken browser and wait for node injection',
    'tronPay.imtokenNetworkBlocked': 'imToken network blocked. Clear cache or switch networks',
    'tronPay.walletFetchFailed': 'Failed to fetch wallet info',
    'tronPay.h5Only': 'Wallets can only be launched in H5 environment',
    'tronPay.unsupportedWallet': 'Unsupported wallet: {walletId}',
    
    // UI elements translations
    'payment.confirmTitle': 'Confirm Payment',
    'payment.amountDue': 'Amount Due',
    'payment.walletConnection': 'Wallet Connection',
    'payment.connecting': 'Connecting',
    'payment.connected': 'Connected',
    'payment.notConnected': 'Not Connected',
    'payment.usdtBalance': 'USDT Balance',
    'payment.trxBalance': 'TRX Balance',
    'payment.address': 'Address',
    'payment.contractDesc': 'Contract Recipient Address. Do not send direct transfers here. Click Pay Now below to start. (TRC20)',
    'payment.verified': 'Verified',
    'payment.estimatedNetworkFee': 'Estimated Network Fee',
    'payment.updatingLive': 'Live updates',
    'payment.updatingFee': 'Updating estimated fee...',
    'payment.feeCalculating': 'Calculating...',
    'payment.useResources': 'Use Resources',
    'payment.energyBandwidth': 'Energy + Bandwidth',
    'payment.burnTrx': 'Burn TRX',
    'payment.burnTrxTokens': 'Burn TRX Tokens',
    'payment.payNow': 'Pay Now  →',
    'payment.paying': 'Paying...',
    'payment.connectWallet': 'Connect {wallet}',
    'payment.payingWith': 'Paying with {token}...',
    'payment.approveSign': 'Please confirm USDT authorization in wallet...',
    'payment.approveConfirming': 'Approval submitted, confirming on-chain...',
    'payment.depositSign': 'Please confirm USDT payment in wallet...',
    'payment.depositConfirming': 'Payment submitted, confirming on-chain...',
    'payment.trxSign': 'Please confirm TRX payment in wallet...',
    'payment.trxConfirming': 'TRX payment submitted, confirming on-chain...',
    'payment.openInWalletBrowser': 'Please open this page inside {wallet} browser',
    'payment.warningBurnMode': 'Burn mode: Order paid in TRX. Make sure TRX >= {total} TRX (includes fee), or transaction fails.',
    'payment.tisp': 'Please ensure your wallet has at least 12 TRX to pay for gas fees, or the transaction will fail and cannot be reverted.',
    'common.orderExpired': 'Order has expired. Please try unlocking again',
    'common.paymentSuccess': 'Payment Successful',
    'common.paymentFailed': 'Payment Failed',
    'paymentWallet.connectingWallet': 'Connecting wallet...',
    'paymentWallet.connecting': 'Requesting authorization...',
    'paymentWallet.openingWallet': 'Opening {wallet}...',
    'paymentWallet.walletNotOpened': '{wallet} not opening?',
    'paymentWallet.downloadPrompt': 'Make sure the wallet app is installed, or open this DApp in your wallet browser.',
    'paymentWallet.download': 'Official Site',
    'paymentWallet.gotIt': 'Got It'
  }
};

// Detect active page language (always return 'en' for meet-escort to keep UI in English only)
// 检测并强制返回英文 'en'，确保 meet-escort 支付弹窗不显示中文
export function getLanguage(): 'zh' | 'en' {
  // Always return 'en' as the default language for this site's user base.
  // 始终返回 'en' 以适配本网站的海外用户群体，禁用中文翻译。
  return 'en';
}

// Global translate utility mirroring Vue t() function
// 全局翻译工具函数，模拟 Vue-I18n 的 t 行为
export function t(key: string, params?: Record<string, string | number>): string {
  const lang = getLanguage();
  const dict = TRANSLATIONS[lang] || TRANSLATIONS.zh;
  let text = dict[key] || key;
  if (params) {
    Object.keys(params).forEach((k) => {
      text = text.replace(new RegExp(`\\{${k}\\}`, 'g'), String(params[k]));
    });
  }
  return text;
}

// Fee mode constants
// 交易手续费模式常量定义
export const FEE_MODE = {
  RESOURCE: 'resource', // Use frozen Energy & Bandwidth (prioritized) / 优先扣除质押冻结的能量和带宽
  BURN: 'burn'          // Burn TRX directly for execution fee / 直接燃烧消耗 TRX
};

// Minimum TRX buffer threshold to prevent out-of-energy failed transaction
// 最小安全防护门槛：要求账户备留至少 12 TRX，防止因微调能量波动导致广播失败
export const MIN_TRX_PAY_GATE = 12;

// Standard resource numbers needed for contract transaction
// 估算和发起交易所需标准资源的基准值
const ENERGY_NEEDED = 130000;
const BANDWIDTH_NEEDED = 690;
const MIN_TRX_FEE_FALLBACK = 1;
const TRX_TRANSFER_BANDWIDTH = 268;
const CONTRACT_TX_BANDWIDTH = 345;
const USDT_APPROVE_ENERGY_MIN = 64000;
const USDT_DEPOSIT_ENERGY_MIN = 65000;
const USDT_TRANSFER_ENERGY_MIN = 65000;

// Tron Web RPC details
// 波场链节点配置信息，从环境变量读取，回退主网公共节点
export const tronRpc = {
  host: String(import.meta.env.VITE_TRON_RPC_HOST || 'https://api.trongrid.io').replace(/\/$/, ''),
  apiKey: import.meta.env.VITE_TRON_API_KEY || ''
};

// Retrieve connected wallet address from local storage cache
// 获取当前已缓存连接的钱包地址，供 UI 反馈使用
export function getConnectedWalletAddress(): string {
  if (typeof window === 'undefined') return '';
  return localStorage.getItem('walletAddress') || '';
}

// Cache connected wallet address in local storage
// 将当前连接的钱包地址写入缓存
export function setConnectedWalletAddress(address: string) {
  if (typeof window !== 'undefined') {
    localStorage.setItem('walletAddress', address);
  }
}

// Disconnect wallet address
// 断开钱包连接：清除本地缓存地址
export function disconnectWallet() {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('walletAddress');
  }
}

// Retrieve look member VIP payment state
// 读取本地 VIP 已付费标记
export function getLookMember(): boolean {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem(MEMBER_STORAGE_KEY) === 'true';
}

// Set look member VIP payment state
// 写入本地 VIP 已付费缓存
export function setLookMember(val: boolean) {
  if (typeof window !== 'undefined') {
    localStorage.setItem(MEMBER_STORAGE_KEY, String(val));
  }
}

// Clear order and mark payment complete
// 清理待处理订单，并将用户状态设为已支付会员
export function markOrderPaymentCompleted() {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('pendingOrder');
    setLookMember(true);
  }
}

// Abbreviate long wallet addresses (first 6 and last 4 characters)
// 钱包地址缩略，保留前 6 后 4 以优化视觉展示
export function formatAddressShort(address = ''): string {
  if (!address || address.length < 10) return address || '--';
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

// Format number total to blockchain decimals (6 decimal places for USDT)
// 将普通金额转换为链上最小精度精度值（USDT 精度为 6 位）
export function toUsdtAmount(value: string | number): string {
  const num = parseFloat(String(value || '0'));
  if (!num || Number.isNaN(num)) return '0';
  return Math.round(num * 1e6).toString();
}

// Convert big contract decimals back to human readable balance string
// 将链上 6 位精度数值转换回可读的小数形式
export function fromUsdtAmount(raw: any): string {
  let value = raw;
  if (raw != null && typeof raw === 'object') {
    value = raw._hex ?? raw.toString?.() ?? 0;
  }
  const num = Number(value || 0) / 1e6;
  if (Number.isNaN(num)) return '0.00';
  return num.toFixed(2);
}

// Convert TRX Sun decimals back to human readable TRX balance
// 将 TRX 的 Sun 单位 (1e6精度) 转换回可读的 TRX 数量
export function fromTrxAmount(sun: any): string {
  let value = sun;
  if (sun != null && typeof sun === 'object') {
    value = sun._hex ?? sun.toString?.() ?? 0;
  }
  const num = Number(value || 0) / 1e6;
  if (Number.isNaN(num)) return '0.00';
  return num.toFixed(2);
}

// Helper to convert input balance strings to safe floats
// 将余额字符串安全转换为浮点数，支持兜底处理
export function parseBalance(value: any): number {
  if (value == null || value === '--') return 0;
  const num = parseFloat(String(value));
  return Number.isNaN(num) ? 0 : num;
}

// Retrieve injected tronWeb instance according to selected wallet key
// 根据所选钱包标识，寻找注入浏览器的相应 TronWeb 实例接口
export function getTronWeb(walletId = ''): any {
  if (typeof window === 'undefined') return null;

  const win = window as any;
  if (walletId === 'bitkeep' && win[WALLET_META.bitkeep.tronWebAlias || '']) {
    return win[WALLET_META.bitkeep.tronWebAlias || ''];
  }

  if (walletId === 'okx' && win.okxwallet?.tronLink?.tronWeb) {
    return win.okxwallet.tronLink.tronWeb;
  }

  const commonTronWeb = win.tronWeb || win.tronLink?.tronWeb;
  if (commonTronWeb) return commonTronWeb;

  return win.okxwallet?.tronLink?.tronWeb || win.bitkeepTronWeb || win.tpTronWeb || null;
}

// Standard promise timeout wrapper to protect third-party hangs
// 带超时的 Promise 包装器，防止钱包签名挂起无响应导致页面卡死
export function promiseWithTimeout<T>(promise: Promise<T>, ms: number, timeoutErrorMsg = 'timeout'): Promise<T> {
  let timer: any = null;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error(timeoutErrorMsg)), ms);
  });
  return Promise.race([
    promise.then((res) => {
      clearTimeout(timer);
      return res;
    }, (err) => {
      clearTimeout(timer);
      throw err;
    }),
    timeoutPromise
  ]);
}

// Async request authorization trigger
// 向当前钱包的 provider 触发唤起授权账户的底层 RPC 请求
function requestTronAccountsFor(walletId: string): Promise<any> | null {
  const win = window as any;
  if (walletId === 'okx') return win.okxwallet?.tronLink?.request?.({ method: 'tron_requestAccounts' }) || null;
  if (walletId === 'bitkeep') return win.bitkeep?.request?.({ method: 'tron_requestAccounts' }) || null;
  return win.tronLink?.request?.({ method: 'tron_requestAccounts' }) || null;
}

// Wait and poll for TronWeb instance injection and request authorization if missing
// 异步等待并轮询钱包注入 TronWeb，在必要时触发钱包的授权弹窗
export async function waitForTronWeb(walletId = '', timeout = 8000, options: { skipAuthorize?: boolean } = {}): Promise<any> {
  const start = Date.now();
  const walletMeta = WALLET_META[walletId] || WALLET_META.tokenpocket;
  let hasRequested = false;

  while (Date.now() - start < timeout) {
    const tronWeb = getTronWeb(walletId);
    if (tronWeb) {
      if (options.skipAuthorize) {
        return tronWeb;
      }

      if (walletMeta.hasWaitMethod && typeof tronWeb.wait === 'function' && walletId !== 'imtoken') {
        try {
          await promiseWithTimeout(tronWeb.wait(), 2000);
        } catch (e) {
          console.warn(`${walletMeta.name} wait execution failed or timed out`, e);
        }
      }

      if (walletMeta.needRequestAccounts && !tronWeb.defaultAddress?.base58 && !hasRequested) {
        hasRequested = true;
        try {
          const reqPromise = requestTronAccountsFor(walletId);
          if (reqPromise) {
            await promiseWithTimeout(reqPromise, 20000);
          }
        } catch (e) {
          console.warn(`${walletMeta.name} authorization rejected`, e);
        }
      }

      if (tronWeb.defaultAddress?.base58) {
        return tronWeb;
      }
    }
    await new Promise((resolve) => setTimeout(resolve, 300));
  }

  if (walletId === 'imtoken') {
    throw new Error('imToken_NO_TRONWEB');
  }
  throw new Error(t('tronPay.walletNetworkError', { wallet: walletMeta.name }));
}

// Retrieve query parameter from URL search or hash string
// 从 URL 的 search 或 hash 解析查询参数
export function getUrlParam(key: string): string {
  if (typeof window === 'undefined') return '';
  const hash = window.location.hash || '';
  const qIndex = hash.indexOf('?');
  if (qIndex >= 0) {
    const v = new URLSearchParams(hash.slice(qIndex + 1)).get(key);
    if (v != null) return v;
  }
  return new URLSearchParams(window.location.search || '').get(key) || '';
}

// Strip specific parameter from address bar history without refreshing
// 无刷新从地址栏剔除指定的参数名，防止二次回跳造成的反复重载
export function stripUrlParam(key: string) {
  if (typeof window === 'undefined' || !window.history?.replaceState) return;
  const href = window.location.href;
  const re = new RegExp(`([?&])${key}=[^&]*(&|$)`);
  const cleaned = href.replace(re, (_m, p1, p2) => (p1 === '?' && p2 === '&' ? '?' : (p2 ? p1 : '')));
  if (cleaned !== href) {
    window.history.replaceState(null, '', cleaned);
  }
}

// Determine if running inside wallet's internal Web3 browser
// 检查当前环境是否已被钱包 Web3 节点标记注入（判定是否在钱包内置 WebView 中）
export function isInjectedWalletBrowser(): boolean {
  if (typeof window === 'undefined') return false;
  const win = window as any;
  return !!(win.tronLink?.tronWeb || win.tronWeb || win.okxwallet?.tronLink?.tronWeb || win.bitkeepTronWeb || win.tpTronWeb);
}

// Identify the wallet provider injected into the current browser page.
export function detectInjectedWalletId(): string {
  if (typeof window === 'undefined') return '';
  const win = window as any;
  if (win.okxwallet?.tronLink?.tronWeb) return 'okx';
  if (win.bitkeepTronWeb || win.bitkeep?.tronWeb) return 'bitkeep';
  if (win.tronLink?.tronWeb || win.tronWeb) return 'tronlink';
  if (win.tpTronWeb) return 'tokenpocket';
  return '';
}

// Connect the provider already injected into the current browser page.
export async function connectInjectedTronWallet(): Promise<{ walletId: string; address: string }> {
  const walletId = detectInjectedWalletId();
  if (!walletId) {
    throw new Error('No compatible TRON wallet was detected in this browser.');
  }

  const tronWeb = await waitForTronWeb(walletId);
  const address = tronWeb.defaultAddress?.base58 || '';
  if (!address) {
    throw new Error('The wallet did not provide a TRON account.');
  }

  setConnectedWalletAddress(address);
  return { walletId, address };
}

// Construct external return URL
// 记录当前的页面路径作为钱包支付回调返回 URL
export function buildPaymentReturnUrl(): string {
  if (typeof window === 'undefined') return '';
  return window.location.href;
}

// Append hash parameter query values
// 往已有的 URL 结构中拼接 hash 携带的查询参数
function appendHashQuery(url: string, key: string, value: string): string {
  if (!value) return url;
  const hashIndex = url.indexOf('#');
  if (hashIndex < 0) {
    const sep = url.includes('?') ? '&' : '?';
    return `${url}${sep}${encodeURIComponent(key)}=${encodeURIComponent(value)}`;
  }
  const prefix = url.slice(0, hashIndex + 1);
  const hash = url.slice(hashIndex + 1);
  const qIndex = hash.indexOf('?');
  const hashPath = qIndex >= 0 ? hash.slice(0, qIndex) : hash;
  const hashQuery = qIndex >= 0 ? hash.slice(qIndex + 1) : '';
  const pair = `${encodeURIComponent(key)}=${encodeURIComponent(value)}`;
  const nextQuery = hashQuery ? `${hashQuery}&${pair}` : pair;
  return `${prefix}${hashPath}?${nextQuery}`;
}

// Generate complete payment confirm URL for external deep linking
// 根据所选钱包及当前上下文，构建钱包内置浏览器加载支付确认界面的完整地址（自动转发当前地址栏携带的 staffId 及 price）
export function getPaymentConfirmUrl(walletInfo: { id: string }, returnUrl = ''): string {
  if (typeof window === 'undefined') return '';
  const resolvedReturnUrl = returnUrl || buildPaymentReturnUrl();
  const staffId = getUrlParam('staffId');
  const price = getUrlParam('price');
  
  // SPA routing syntax / SPA 查询路径
  let url = `${window.location.origin}${window.location.pathname}?page=payment-confirm&walletId=${walletInfo.id || 'tokenpocket'}`;
  if (staffId) url = appendHashQuery(url, 'staffId', staffId);
  if (price) url = appendHashQuery(url, 'price', price);
  
  return appendHashQuery(url, 'returnUrl', resolvedReturnUrl);
}

// Launch wallet App to payment confirmation page using custom deep-links
// 通过 Deep Link 深链接唤起所选钱包客户端，加载对应的支付确认中心
export function launchWalletApp(walletId: string, walletInfo: any, returnUrl = '') {
  if (typeof window === 'undefined') {
    throw new Error(t('tronPay.h5Only'));
  }
  const meta = WALLET_META[walletId];
  if (!meta) throw new Error(t('tronPay.unsupportedWallet', { walletId }));

  const info = walletInfo || { id: walletId, name: meta.name };
  localStorage.setItem('wallet', JSON.stringify(info));

  const url = getPaymentConfirmUrl(info, returnUrl);
  window.location.href = meta.buildDeepLink(url);
  return meta;
}

// Redirect back to primary browser session with paymentSuccess tag
// 支付全部完结后，通过 redirect 调回用户的初始浏览器会话，并附加 paymentSuccess 标签
export function redirectAfterPaymentSuccess(returnUrl: string): boolean {
  if (typeof window === 'undefined' || !returnUrl) return false;
  try {
    localStorage.removeItem('pendingOrder');
    const target = appendHashQuery(returnUrl, 'paymentSuccess', '1');
    window.location.replace(target);
    return true;
  } catch (error) {
    console.warn('Redirecting back failed', error);
    return false;
  }
}

// Setup contract node full node host details
// 为 TronWeb 实例配置统一的 RPC 接口与 ApiKey 首部以提升流控限额
function applyTronRpcHost(tronWeb: any) {
  if (!tronWeb) return;
  const host = tronRpc.host;
  if (tronWeb.fullNode?.host !== host) {
    tronWeb.setFullNode(host);
    tronWeb.setSolidityNode(host);
  }
  if (tronRpc.apiKey && typeof tronWeb.setHeader === 'function') {
    tronWeb.setHeader({ 'TRON-PRO-API-KEY': tronRpc.apiKey });
  }
}

// Check if error is related to API rate limiting (HTTP 429)
// 判定是否是链上节点限流报错（HTTP 429）
export function isRateLimitError(error: any): boolean {
  const msg = error?.message || String(error || '');
  return msg.includes('429') || /too many requests/i.test(msg) || error?.response?.status === 429;
}

// Format user-facing error message based on wallet status
// 校验获取钱包或链上操作时的报错，转化为可读的用户提示文案
export function formatWalletFetchError(error: any): string {
  const msg = error?.message || String(error || '');
  if (msg.includes('imToken_NO_TRONWEB')) {
    return t('tronPay.imtokenNoTronweb');
  }
  if (msg.includes('network error')) {
    return t('tronPay.imtokenNetworkBlocked');
  }
  if (isRateLimitError(error)) {
    return t('tronPay.rateLimitError');
  }
  return error?.message || t('tronPay.walletFetchFailed');
}

// Retry wrap logic for network requests to handle rate limit
// 带指数退避的自动重试装饰器，用于对抗公共节点的限流机制
async function withRetry<T>(fn: () => Promise<T>, { retries = 3, baseDelay = 2000 } = {}): Promise<T> {
  let lastError: any;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (!isRateLimitError(error) || attempt === retries) {
        throw error;
      }
      await new Promise((resolve) => setTimeout(resolve, baseDelay * (attempt + 1)));
    }
  }
  throw lastError;
}

// Fetch Chain parameter values (energy price, bandwidth price)
// 拉取链上最新资费费率（计算能量 Sun 与 带宽 Sun 单价）
async function fetchChainFeeRates(tronWeb: any) {
  try {
    const params = await withRetry(() => tronWeb.trx.getChainParameters());
    const map: Record<string, number> = {};
    // Cast params to any array to safely iterate in TypeScript
    // 在 TypeScript 中将 params 强制转换为 any 数组，以安全地遍历链上参数
    for (const item of (params as any) || []) {
      if (item?.key != null) map[item.key] = Number(item.value);
    }
    return {
      energyFeeSun: map.getEnergyFee || 420,
      bandwidthFeeSun: map.getTransactionFee || 1000
    };
  } catch (error) {
    console.warn('Failed to load on-chain fee rates, fallback default values', error);
    return { energyFeeSun: 420, bandwidthFeeSun: 1000 };
  }
}

// Calculate the burned TRX cost in Sun for resources shortage
// 计算在预估资源不足情况下，实际执行交易需要燃烧的 TRX (Sun) 数量
function calcResourceBurnSun({ energyNeeded, bandwidthNeeded, resources, rates }: {
  energyNeeded: number;
  bandwidthNeeded: number;
  resources: { energy: number; bandwidth: number };
  rates: { energyFeeSun: number; bandwidthFeeSun: number };
}) {
  const energyShort = Math.max(0, energyNeeded - (resources.energy || 0));
  const bandwidthShort = Math.max(0, bandwidthNeeded - (resources.bandwidth || 0));
  return energyShort * rates.energyFeeSun + bandwidthShort * rates.bandwidthFeeSun;
}

// Calculate sequential execution fees (Approve + Deposit) and cumulate burn suns
// 并行或串行（Approve 与 Deposit）交易下逐笔扣除可用资源，计算总的 TRX 燃烧额
function calcSequentialContractBurnSun({ steps, resources, rates }: {
  steps: Array<{ energyNeeded: number; bandwidthNeeded: number }>;
  resources: { energy: number; bandwidth: number };
  rates: { energyFeeSun: number; bandwidthFeeSun: number };
}) {
  let remaining = {
    energy: resources?.energy || 0,
    bandwidth: resources?.bandwidth || 0
  };
  let totalBurnSun = 0;
  let totalEnergyNeeded = 0;
  let totalBandwidthNeeded = 0;

  for (const step of steps) {
    if (!step.energyNeeded && !step.bandwidthNeeded) continue;
    totalBurnSun += calcResourceBurnSun({
      energyNeeded: step.energyNeeded,
      bandwidthNeeded: step.bandwidthNeeded,
      resources: remaining,
      rates
    });
    totalEnergyNeeded += step.energyNeeded;
    totalBandwidthNeeded += step.bandwidthNeeded;
    remaining = {
      energy: Math.max(0, remaining.energy - step.energyNeeded),
      bandwidth: Math.max(0, remaining.bandwidth - step.bandwidthNeeded)
    };
  }

  return {
    burnSun: totalBurnSun,
    energyNeeded: totalEnergyNeeded,
    bandwidthNeeded: totalBandwidthNeeded,
    sufficient: totalBurnSun === 0
  };
}

// Fallback logic to determine step energy based on transaction type
// 估算能量辅助解析，用于兜底无法触发 estimateEnergy 的场景
function resolveUsdtStepEnergy(estimated: number | null, minEnergy: number): number {
  const value = Number(estimated || 0);
  if (value > 0) return Math.ceil(value);
  return minEnergy;
}

// Call estimateEnergy on TRON node to get precise fee limits
// 通过波场 RPC 发起触发估算调用合约函数的实际能量消耗
async function estimateContractEnergy(
  tronWeb: any,
  ownerAddress: string,
  contractAddress: string,
  functionSelector: string,
  parameters: Array<{ type: string; value: any }>,
  feeLimit = 100000000
): Promise<number | null> {
  try {
    const builder = tronWeb.transactionBuilder;
    if (typeof builder?.estimateEnergy !== 'function') return null;
    const ownerHex = tronWeb.address.toHex(ownerAddress);
    const contractHex = tronWeb.address.toHex(contractAddress);
    // Cast result to any to access dynamic blockchain trigger response properties
    // 将 result 强转为 any 以读取链上触发返回的动态结构属性
    const result = (await withRetry(() => builder.estimateEnergy(
      contractHex,
      functionSelector,
      { feeLimit, callValue: 0 },
      parameters,
      ownerHex
    ))) as any;
    const energy = Number(result?.energy_required ?? result?.energy_used ?? 0);
    return energy > 0 ? energy : null;
  } catch (error) {
    console.warn(`estimateEnergy call failed: ${functionSelector}`, error);
    return null;
  }
}

// Fetch allowance and determine whether approval transaction is needed
// 判定订单支付（USDT Approve + Deposit）所需的能量和带宽步骤
async function buildUsdtPaymentSteps(
  tronWeb: any,
  address: string,
  orderTotal: string | number,
  options: { lightweight?: boolean } = {}
) {
  const amount = toUsdtAmount(orderTotal);
  const feeLimit = 150000000;
  const steps = [];

  let needsApprove = true;
  if (!options.lightweight) {
    try {
      const usdtContract = await tronWeb.contract(TRC20_ABI, USDT_CONTRACT);
      const allowance = await getUsdtAllowance(usdtContract, address, DEPOSIT_CONTRACT);
      needsApprove = allowance < BigInt(amount);
    } catch (error) {
      console.warn('Failed to query USDT allowance, default to needs approval', error);
    }
  }

  if (needsApprove) {
    const approveEnergy = options.lightweight
      ? null
      : await estimateContractEnergy(
          tronWeb,
          address,
          USDT_CONTRACT,
          'approve(address,uint256)',
          [
            { type: 'address', value: DEPOSIT_CONTRACT },
            { type: 'uint256', value: amount }
          ],
          feeLimit
        );
    steps.push({
      action: 'approve',
      energyNeeded: resolveUsdtStepEnergy(approveEnergy, USDT_APPROVE_ENERGY_MIN),
      bandwidthNeeded: CONTRACT_TX_BANDWIDTH
    });
  }

  const depositEnergy = options.lightweight
    ? null
    : await estimateContractEnergy(
        tronWeb,
        address,
        DEPOSIT_CONTRACT,
        'deposit(uint256)',
        [{ type: 'uint256', value: amount }],
        feeLimit
      );
  steps.push({
    action: 'deposit',
    energyNeeded: resolveUsdtStepEnergy(depositEnergy, USDT_DEPOSIT_ENERGY_MIN),
    bandwidthNeeded: CONTRACT_TX_BANDWIDTH
  });

  return { steps, needsApprove };
}

// Fallback miner fee estimation logic when node query fails
// 矿工费本地兜底估算（在链上查询出错或节点超时时使用）
function estimateMinerFeeFallback(
  feeMode: string,
  resources: { energy: number; bandwidth: number } = { energy: 0, bandwidth: 0 },
  directTransfer = false
) {
  if (feeMode === FEE_MODE.BURN) {
    const zeroResources = { energy: 0, bandwidth: 0 };
    const { burnSun } = calcSequentialContractBurnSun({
      steps: directTransfer
        ? [{ energyNeeded: USDT_TRANSFER_ENERGY_MIN, bandwidthNeeded: CONTRACT_TX_BANDWIDTH }]
        : [
            { energyNeeded: USDT_APPROVE_ENERGY_MIN, bandwidthNeeded: CONTRACT_TX_BANDWIDTH },
            { energyNeeded: USDT_DEPOSIT_ENERGY_MIN, bandwidthNeeded: CONTRACT_TX_BANDWIDTH }
          ],
      resources: zeroResources,
      rates: { energyFeeSun: 420, bandwidthFeeSun: 1000 }
    });
    const amount = fromTrxAmount(burnSun) || MIN_TRX_FEE_FALLBACK.toFixed(2);

    return {
      amount,
      amountTrx: parseFloat(amount),
      unit: 'TRX',
      payToken: 'USDT',
      hint: t('tronPay.feeBurnFallback'),
      sufficient: null,
      source: 'fallback'
    };
  }

  const energyOk = (resources.energy || 0) >= ENERGY_NEEDED;
  const bandwidthOk = (resources.bandwidth || 0) >= BANDWIDTH_NEEDED;
  if (energyOk && bandwidthOk) {
    return {
      amount: '0.00',
      amountTrx: 0,
      unit: 'TRX',
      payToken: 'USDT',
      hint: t('tronPay.feeCoveredByResources'),
      sufficient: true,
      source: 'fallback'
    };
  }

  const { burnSun } = calcSequentialContractBurnSun({
    steps: directTransfer
      ? [{ energyNeeded: USDT_TRANSFER_ENERGY_MIN, bandwidthNeeded: CONTRACT_TX_BANDWIDTH }]
      : [
          { energyNeeded: USDT_APPROVE_ENERGY_MIN, bandwidthNeeded: CONTRACT_TX_BANDWIDTH },
          { energyNeeded: USDT_DEPOSIT_ENERGY_MIN, bandwidthNeeded: CONTRACT_TX_BANDWIDTH }
        ],
    resources,
    rates: { energyFeeSun: 420, bandwidthFeeSun: 1000 }
  });
  const amount = fromTrxAmount(burnSun) || MIN_TRX_FEE_FALLBACK.toFixed(2);

  const feeHintResourcePartial = (eOk: boolean, bOk: boolean) => {
    return eOk || bOk ? t('tronPay.feePartialResources') : t('tronPay.feeSwitchToBurn');
  };

  return {
    amount,
    amountTrx: parseFloat(amount),
    unit: 'TRX',
    payToken: 'USDT',
    hint: feeHintResourcePartial(energyOk, bandwidthOk),
    sufficient: false,
    source: 'fallback'
  };
}

// Estimate transaction fee based on current account resources and mode selection
// 根据选定的费率支付模式，估算账户需要燃烧的实际 TRX 费率
export async function estimateMinerFeeFromChain(
  tronWeb: any,
  address: string,
  feeMode: string,
  resources: { energy: number; bandwidth: number } = { energy: 0, bandwidth: 0 },
  orderTotal = '1.00',
  options: { lightweight?: boolean; directTransfer?: boolean } = {}
) {
  const rates = options.lightweight
    ? { energyFeeSun: 420, bandwidthFeeSun: 1000 }
    : await fetchChainFeeRates(tronWeb);

  const feeHintBurn = (burnSun: number) => {
    return burnSun > 0 ? t('tronPay.feeBurnEstimate') : t('tronPay.feeLowBandwidth');
  };

  if (feeMode === FEE_MODE.BURN) {
    const burnSun = calcResourceBurnSun({
      energyNeeded: 0,
      bandwidthNeeded: TRX_TRANSFER_BANDWIDTH,
      resources,
      rates
    });
    const amount = fromTrxAmount(burnSun);
    return {
      amount,
      amountTrx: parseFloat(amount),
      unit: 'TRX',
      payToken: 'TRX',
      hint: feeHintBurn(burnSun),
      sufficient: null,
      source: 'chain'
    };
  }

  const steps = options.directTransfer
    ? [{ energyNeeded: USDT_TRANSFER_ENERGY_MIN, bandwidthNeeded: CONTRACT_TX_BANDWIDTH }]
    : (await buildUsdtPaymentSteps(tronWeb, address, orderTotal, options)).steps;
  const { burnSun, sufficient } = calcSequentialContractBurnSun({ steps, resources, rates });

  if (sufficient) {
    return {
      amount: '0.00',
      amountTrx: 0,
      unit: 'TRX',
      payToken: 'USDT',
      hint: t('tronPay.feeCoveredByResources'),
      sufficient: true,
      source: 'chain'
    };
  }

  const amount = fromTrxAmount(burnSun);
  return {
    amount,
    amountTrx: parseFloat(amount),
    unit: 'TRX',
    payToken: 'USDT',
    hint: burnSun > 0 ? t('tronPay.feeInsufficientResources') : t('tronPay.feePartialResources'),
    sufficient: false,
    source: 'chain'
  };
}

// Fetch standard account Energy and Bandwidth balances
// 获取指定波场账户可用的能量与带宽资源
export async function fetchAccountResources(tronWeb: any, address: string) {
  try {
    // Cast resources response to any for safe property extraction
    // 将返回的账户资源结构强转为 any，以安全读取属性
    const res = (await withRetry(() => tronWeb.trx.getAccountResources(address))) as any;
    const energy = Math.max(0, (res.EnergyLimit || 0) - (res.EnergyUsed || 0));
    const net = Math.max(0, (res.NetLimit || 0) - (res.NetUsed || 0));
    const freeNet = Math.max(0, (res.freeNetLimit || 600) - (res.freeNetUsed || 0));
    return {
      energy,
      bandwidth: net + freeNet
    };
  } catch (e) {
    console.warn('Failed to fetch account resources', e);
    return { energy: 0, bandwidth: 0 };
  }
}

// Parallel/Throttled balance fetch tracker
// 静默获取钱包账户的 USDT 余额、TRX 余额、资源指标及预估资费
let walletFetchInFlight: Promise<any> | null = null;

async function fetchWalletBalancesInternal(walletId = '', feeMode = FEE_MODE.RESOURCE, orderTotal = '1.00', options: { directTransfer?: boolean } = {}) {
  const tronWeb = await waitForTronWeb(walletId);
  applyTronRpcHost(tronWeb);

  const address = tronWeb.defaultAddress.base58;
  const isRateLimitThrottled = walletId === 'imtoken' || walletId === 'bitkeep';
  const feeEstimateOptions = {
    lightweight: isRateLimitThrottled && feeMode === FEE_MODE.RESOURCE
  };

  // 1. Get TRX Balance
  const trxSun = await withRetry(() => tronWeb.trx.getBalance(address));

  // 2. Get USDT Balance
  const usdtContract = await tronWeb.contract(TRC20_ABI, USDT_CONTRACT);
  const usdtRaw = await withRetry(() => usdtContract.balanceOf(address).call());

  // 2.5 Get USDT Allowance for the spender contract
  // 获取当前账户已授予收款合约的 USDT 额度
  let allowance = 0n;
  if (!options.directTransfer) {
    try {
      allowance = await getUsdtAllowance(usdtContract, address, DEPOSIT_CONTRACT);
    } catch (error) {
      console.warn('Failed to query USDT allowance in balances fetch', error);
    }
  }

  // 3. Fetch resources if in resource mode
  let resources = { energy: 0, bandwidth: 0 };
  if (feeMode !== FEE_MODE.BURN) {
    resources = await fetchAccountResources(tronWeb, address);
  }

  // 4. Estimate miners fee
  let minerFee = estimateMinerFeeFallback(feeMode, resources, options.directTransfer);
  if (feeMode === FEE_MODE.BURN) {
    try {
      const rates = await fetchChainFeeRates(tronWeb);
      const zeroResources = { energy: 0, bandwidth: 0 };
      const { burnSun } = calcSequentialContractBurnSun({
        steps: options.directTransfer
          ? [{ energyNeeded: USDT_TRANSFER_ENERGY_MIN, bandwidthNeeded: CONTRACT_TX_BANDWIDTH }]
          : [
              { energyNeeded: USDT_APPROVE_ENERGY_MIN, bandwidthNeeded: CONTRACT_TX_BANDWIDTH },
              { energyNeeded: USDT_DEPOSIT_ENERGY_MIN, bandwidthNeeded: CONTRACT_TX_BANDWIDTH }
            ],
        resources: zeroResources,
        rates
      });
      const amount = fromTrxAmount(burnSun);
      minerFee = {
        amount,
        amountTrx: parseFloat(amount),
        unit: 'TRX',
        payToken: 'USDT',
        hint: amount ? t('tronPay.feeBurnEstimate') : t('tronPay.feeLowBandwidth'),
        sufficient: null,
        source: 'chain'
      };
    } catch (error) {
      console.warn('Failed to estimate burn mode miner fee from chain, fallback', error);
    }
  } else {
    try {
      minerFee = await estimateMinerFeeFromChain(tronWeb, address, feeMode, resources, orderTotal, {
        ...feeEstimateOptions,
        directTransfer: options.directTransfer
      });
    } catch (error) {
      console.warn('Failed to estimate resource mode miner fee from chain, fallback', error);
    }
  }

  return {
    address,
    addressShort: formatAddressShort(address),
    trx: fromTrxAmount(trxSun),
    usdt: fromUsdtAmount(usdtRaw),
    allowance: fromUsdtAmount(allowance), // Included current allowance in the fetched wallet balances
    resources,
    minerFee
  };
}

// Throttled balance and gas fetcher to prevent 429
// 获取钱包详细账户指标，支持防并发去重合并
export async function fetchWalletBalances(walletId = '', feeMode = FEE_MODE.RESOURCE, orderTotal = '1.00', options: { directTransfer?: boolean } = {}) {
  if (walletFetchInFlight) {
    return walletFetchInFlight;
  }

  walletFetchInFlight = fetchWalletBalancesInternal(walletId, feeMode, orderTotal, options)
    .finally(() => {
      walletFetchInFlight = null;
    });

  return walletFetchInFlight;
}

// Check if TRX balance covers fee limits to prevent transaction freezing
// 支付前安全性强校验：保障用户拥有充足余额完成支付，不因能量不足导致交易失效
// Prefix usdt with underscore to satisfy unused variables compiler rule
// 将 usdt 重命名为 _usdt 以便在不校验该余额充足性的情况下，绕过编译器“未使用变量”的规则限制
export function validatePaymentReadiness({ feeMode, usdt: _usdt, trx, orderTotal, minerFeeTrx, allowance }: {
  feeMode: string;
  usdt: string;
  trx: string;
  orderTotal: string | number;
  minerFeeTrx: string | number;
  allowance?: string | number; // Added optional allowance parameter to check if Approve is needed
}) {
  const orderAmt = parseFloat(String(orderTotal || '0'));
  const trxBal = parseBalance(trx);
  const estimatedFee = parseFloat(String(minerFeeTrx || '0'));
  const allowanceAmt = allowance !== undefined ? parseFloat(String(allowance || '0')) : null;

  if (!orderAmt || Number.isNaN(orderAmt)) {
    return { ok: false, message: t('tronPay.invalidPaymentAmount') };
  }

  // Note: The USDT balance validation check is removed per video-web specs 
  // to allow users with insufficient balance to initiate the signing workflow.

  // If the currently approved allowance is less than the order amount, we must trigger the Approve transaction.
  // In this case, even if TRX balance is insufficient, we bypass the TRX check to allow the Approve signing flow to pop up.
  // 如果已授权额度小于订单应付金额，代表必须触发授权交易。在此前提下，即使 TRX 余额不足也予以通过，从而尝试唤起授权签名弹窗。
  if (allowanceAmt !== null && allowanceAmt < orderAmt) {
    return { ok: true };
  }

  if (feeMode === FEE_MODE.BURN) {
    const neededTrx = Math.max(estimatedFee, MIN_TRX_PAY_GATE);
    if (trxBal < neededTrx) {
      return {
        ok: false,
        message: t('tronPay.insufficientTrx', {
          total: neededTrx.toFixed(2),
          fee: estimatedFee.toFixed(2)
        })
      }
    }
  } else {
    if (trxBal < MIN_TRX_PAY_GATE) {
      return {
        ok: false,
        message: t('tronPay.insufficientTrxForResourceFee', { needed: MIN_TRX_PAY_GATE.toFixed(2) })
      }
    }
  }

  return { ok: true };
}

// Build transaction configurations according to fee mode
// 匹配对应的 feeLimit 设置
function buildTxSendOptions(feeMode: string) {
  if (feeMode === FEE_MODE.BURN) {
    return {
      feeLimit: 200000000,
      callValue: 0,
      shouldPollResponse: true
    };
  }
  return {
    feeLimit: 150000000,
    callValue: 0,
    shouldPollResponse: true
  };
}

// Convert smart contract values into typescript BigInt
// 将复杂的智能合约只读出参格式化为统一的 BigInt 大整数
function parseRawUint(value: any): bigint {
  if (value == null) return 0n;
  if (typeof value === 'bigint') return value;
  if (typeof value === 'object') {
    const raw = value._hex ?? value.toString?.();
    if (raw != null) return BigInt(raw);
  }
  try {
    return BigInt(value);
  } catch {
    return 0n;
  }
}

// Extract transaction hash ID from broadcast responses
// 从广播签名结果包中解析提取交易的 Hash 唯一的 TXID 标识
function extractTxId(result: any): string {
  return result?.txid || result?.txID || result?.transaction?.txID || result?.transaction?.txid || '';
}

// Check if error message matches signature cancel characteristics
// 校验错误特征，判断用户是否手动取消了钱包的签名响应
function isUserRejectedError(error: any): boolean {
  const msg = (error?.message || String(error || '')).toLowerCase();
  return /reject|denied|declined|cancel|cancelled|canceled|user refused/.test(msg);
}

// Determine if transaction was broadcast successfully
// 校验交易响应状态是否返回有效哈希
function isSendSuccessful(result: any): boolean {
  if (!result) return false;
  if (result.result === true) return true;
  return Boolean(extractTxId(result));
}

// Polling interval wait duration helper
// 分阶段自适应的交易状态轮询等待间隔时间
function getPollDelayMs(attemptIndex: number): number {
  return attemptIndex < 3 ? 1000 : 2500;
}

// Polling sleep timer
// 静默休眠封装
async function sleepPoll(attemptIndex: number) {
  await new Promise((resolve) => setTimeout(resolve, getPollDelayMs(attemptIndex)));
}

// Wait for on-chain block transaction receipt confirm state
// 轮询波场节点，校验广播后的交易是否已安全落盘并返回 SUCCESS
async function waitForTxConfirmed(tronWeb: any, txid: string, { timeout = 28000 } = {}): Promise<any> {
  if (!txid) return null;
  const start = Date.now();
  let attempt = 0;
  while (Date.now() - start < timeout) {
    try {
      // Cast info result to any to access dynamic receipts properties
      // 将返回的交易信息结构强转为 any，以便在 TypeScript 中读取 receipt 和 blockNumber 属性
      const info = (await withRetry(() => tronWeb.trx.getTransactionInfo(txid), { retries: 1, baseDelay: 1500 })) as any;
      if (info?.receipt?.result === 'SUCCESS') return info;
      if (info?.receipt?.result === 'REVERT' || info?.receipt?.result === 'OUT_OF_ENERGY') {
        throw new Error(info.receipt.result);
      }
      if (info?.id && info?.blockNumber) return info;
    } catch (error: any) {
      if (error?.message && /REVERT|OUT_OF_ENERGY/.test(error.message)) {
        throw error;
      }
      if (isRateLimitError(error)) {
        await new Promise((resolve) => setTimeout(resolve, 2000));
        continue;
      }
    }
    await sleepPoll(attempt++);
  }
  return null;
}

// Query USDT contract allowance for DEPOSIT spender
// 从代币智能合约查询指定账户对本收款合约的授权限额
async function getUsdtAllowance(usdtContract: any, owner: string, spender: string): Promise<bigint> {
  const allowance = await withRetry(() => usdtContract.allowance(owner, spender).call());
  return parseRawUint(allowance);
}

// Poll until approval changes reflect on chain
// 在授权交易广播完毕后，持续查询链上额度，验证授权是否已生效
async function waitForUsdtAllowance(
  usdtContract: any,
  owner: string,
  spender: string,
  minAmount: string,
  options: { timeout?: number; lightweight?: boolean; walletId?: string } = {}
): Promise<bigint> {
  const needed = BigInt(minAmount);
  const start = Date.now();
  const timeout = options.timeout ?? 35000;
  let attempt = 0;
  const maxAttempts = options.lightweight ? 3 : Infinity;

  if (options.lightweight) {
    await new Promise((resolve) => setTimeout(resolve, 1500));
  }

  while (Date.now() - start < timeout && attempt < maxAttempts) {
    try {
      const allowance = await getUsdtAllowance(usdtContract, owner, spender);
      if (allowance >= needed) return allowance;
    } catch (error) {
      if (isRateLimitError(error)) {
        await new Promise((resolve) => setTimeout(resolve, 2500));
        continue;
      }
      throw error;
    }
    await sleepPoll(attempt++);
    attempt++;
  }

  throw new Error(t('tronPay.usdtAllowanceTimeout'));
}

// Verify balance deduction on user account for deposit validation
// 监控用户账户余额是否下降以作为最终付款校验的备用手段
async function waitForUsdtPaymentEffect(
  usdtContract: any,
  owner: string,
  amount: string,
  options: { timeout?: number } = {}
): Promise<boolean> {
  const needed = BigInt(amount);
  let before: bigint;
  try {
    before = parseRawUint(await withRetry(() => usdtContract.balanceOf(owner).call()));
  } catch (error) {
    console.warn('USDT pre-balance query failed', error);
    return false;
  }
  const start = Date.now();
  const timeout = options.timeout ?? 20000;
  let attempt = 0;

  while (Date.now() - start < timeout) {
    await sleepPoll(attempt++);
    try {
      const after = parseRawUint(await usdtContract.balanceOf(owner).call());
      if (before - after >= needed) return true;
    } catch (error) {
      console.warn('USDT balance polling check failed', error);
    }
  }
  return false;
}

// Finalize sent transaction check logic
// 归档已发送的链上交易，已返回 txid 并且 sendOk 则直接通过
async function finalizeSentTransaction(
  tronWeb: any,
  tx: any,
  options: { onConfirming?: () => void; fallbackCheck?: () => Promise<boolean>; requireConfirmation?: boolean } = {}
) {
  const txid = extractTxId(tx);
  const sendOk = isSendSuccessful(tx);

  if (sendOk) {
    options.onConfirming?.();
    if (options.requireConfirmation && txid) {
      const info = await waitForTxConfirmed(tronWeb, txid);
      if (info) return tx;
      if (options.fallbackCheck && await options.fallbackCheck()) return tx;
      return null;
    }
    if (txid) return tx;
    if (options.fallbackCheck && await options.fallbackCheck()) return tx;
    return tx;
  }

  options.onConfirming?.();

  if (txid) {
    const info = await waitForTxConfirmed(tronWeb, txid);
    if (info) return tx;
  }

  if (options.fallbackCheck && await options.fallbackCheck()) return tx;
  if (sendOk) return tx;
  return null;
}

// Trigger USDT token approval contract call
// 发起代币无限授权交易，并跟踪授权落盘状态
async function ensureUsdtAllowance(
  usdtContract: any,
  owner: string,
  spender: string,
  amount: string,
  txOptions: any,
  tronWeb: any,
  walletId = '',
  payOptions: {
    onProgress?: (stage: string) => void;
    onBeforeWalletSign?: () => void;
    onAfterWalletSign?: (stage: string) => void;
  } = {}
) {
  const needed = BigInt(amount);
  const current = await getUsdtAllowance(usdtContract, owner, spender);
  if (current >= needed) return false;

  // Use unlimited allowance to prevent recurring approval calls in future payments
  // 一步到位授权 uint256 最大范围，避免后续重复授权消耗更多 TRX
  const UNLIMITED_ALLOWANCE = BigInt('115792089237316195423570985008687907853269984665640564039457584007913129639935');

  const allowanceWaitOpts = {
    walletId,
    timeout: 15000,
    lightweight: walletId === 'imtoken' || walletId === 'bitkeep'
  };

  try {
    payOptions.onProgress?.('approve');
    payOptions.onBeforeWalletSign?.();
    
    let approveTx: any = null;
    let signTimedOut = false;
    const signTimeoutMs = walletId === 'imtoken' ? 180000 : 120000;
    
    try {
      approveTx = await promiseWithTimeout(
        withRetry(() => usdtContract.approve(spender, UNLIMITED_ALLOWANCE.toString()).send(txOptions)),
        signTimeoutMs,
        t('tronPay.usdtApprovalSignTimeout')
      );
    } catch (signError: any) {
      if (signError?.message !== t('tronPay.usdtApprovalSignTimeout')) {
        throw signError;
      }
      signTimedOut = true;
      console.warn('Approve send timed out, checking on-chain status fallback');
    } finally {
      payOptions.onAfterWalletSign?.('approveConfirming');
    }

    payOptions.onProgress?.('approveConfirming');

    if (signTimedOut) {
      await waitForUsdtAllowance(usdtContract, owner, spender, amount, { ...allowanceWaitOpts, timeout: 25000 });
      return true;
    }

    const txid = extractTxId(approveTx);
    const sendOk = isSendSuccessful(approveTx);

    if (sendOk && txid) {
      await waitForUsdtAllowance(usdtContract, owner, spender, amount, { ...allowanceWaitOpts, timeout: 15000 });
      return true;
    }

    if (txid) {
      await waitForTxConfirmed(tronWeb, txid, { timeout: 22000 });
    }
    
    await waitForUsdtAllowance(usdtContract, owner, spender, amount, allowanceWaitOpts);
    return true;
  } catch (error: any) {
    if (isUserRejectedError(error)) {
      throw new Error(t('tronPay.usdtApprovalRejected'));
    }
    if (isRateLimitError(error)) {
      throw new Error(t('tronPay.rateLimitError'));
    }
    if (error?.message === t('tronPay.usdtApprovalSignTimeout')) {
      throw error;
    }
    throw new Error(t('tronPay.usdtApprovalFailed', { message: error?.message || String(error) }));
  }
}

// Complete order execution method: routing, approval, and deposit logic
// 统一的代币充值核心逻辑入口：处理授权并触发 deposit 扣款
export async function payOrder(walletId = '', orderTotal: string | number, options: {
  feeMode?: string;
  onProgress?: (stage: string) => void;
  onBeforeWalletSign?: () => void;
  onAfterWalletSign?: (stage: string) => void;
  paymentSnapshot?: {
    usdt: string;
    trx: string;
    resources: { energy: number; bandwidth: number };
    minerFeeTrx: number;
    refreshedAt: number;
    allowance: string; // Included allowance in the payment snapshot definition
  };
} = {}): Promise<any> {
  const feeMode = options.feeMode === FEE_MODE.BURN ? FEE_MODE.BURN : FEE_MODE.RESOURCE;
  const tronWeb = await waitForTronWeb(walletId);
  applyTronRpcHost(tronWeb);
  const address = tronWeb.defaultAddress.base58;
  const amount = toUsdtAmount(orderTotal);

  if (amount === '0') {
    throw new Error(t('tronPay.invalidPaymentAmount'));
  }

  const usdtContract = await tronWeb.contract(TRC20_ABI, USDT_CONTRACT);
  const depositContract = await tronWeb.contract(acceptorAbi, DEPOSIT_CONTRACT);
  const txOptions = buildTxSendOptions(feeMode);

  // Validate balance readiness before starting signing process
  // 开始交易广播流程前的最后防线安全检查
  const snapshot = options.paymentSnapshot;
  if (snapshot && Date.now() - snapshot.refreshedAt < 30000) {
    const readiness = validatePaymentReadiness({
      feeMode,
      usdt: snapshot.usdt,
      trx: snapshot.trx,
      orderTotal,
      minerFeeTrx: snapshot.minerFeeTrx,
      allowance: snapshot.allowance // Passed allowance parameter to check if Approve is required
    });
    if (!readiness.ok) {
      throw new Error(readiness.message);
    }
  } else {
    const usdtRaw = await withRetry(() => usdtContract.balanceOf(address).call());
    const trxSun = await withRetry(() => tronWeb.trx.getBalance(address));
    const currentAllowance = await getUsdtAllowance(usdtContract, address, DEPOSIT_CONTRACT); // Dynamically query allowance

    const readiness = validatePaymentReadiness({
      feeMode,
      usdt: fromUsdtAmount(usdtRaw),
      trx: fromTrxAmount(trxSun),
      orderTotal,
      minerFeeTrx: 0,
      allowance: fromUsdtAmount(currentAllowance) // Passed dynamic allowance
    });
    if (!readiness.ok) {
      throw new Error(readiness.message);
    }
  }

  const isRateLimitThrottled = walletId === 'imtoken' || walletId === 'bitkeep';
  if (isRateLimitThrottled) {
    await new Promise((resolve) => setTimeout(resolve, 1200));
  }

  // Step 1: Ensure enough USDT allowance
  // 步骤 1：检查并引导无限授权签名
  const didApprove = await ensureUsdtAllowance(
    usdtContract,
    address,
    DEPOSIT_CONTRACT,
    amount,
    txOptions,
    tronWeb,
    walletId,
    {
      onProgress: options.onProgress,
      onBeforeWalletSign: options.onBeforeWalletSign,
      onAfterWalletSign: options.onAfterWalletSign
    }
  );

  if (didApprove && isRateLimitThrottled) {
    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  // Step 2: Trigger UsdtAccepter Deposit contract call
  // 步骤 2：发起充值扣款交易签名
  options.onProgress?.('deposit');
  
  let depositRetry = 0;
  const signTimeoutMs = walletId === 'imtoken' ? 180000 : 120000;
  
  while (depositRetry < 2) {
    options.onBeforeWalletSign?.();
    let tx: any;
    try {
      tx = await promiseWithTimeout(
        withRetry(() => depositContract.deposit(amount).send(txOptions)),
        signTimeoutMs,
        t('tronPay.usdtDepositSignTimeout')
      );
    } finally {
      options.onAfterWalletSign?.('depositConfirming');
    }

    try {
      const finalized = await finalizeSentTransaction(tronWeb, tx, {
        onConfirming: () => options.onProgress?.('depositConfirming'),
        fallbackCheck: () => waitForUsdtPaymentEffect(usdtContract, address, amount, { timeout: 18000 })
      });
      if (finalized) return finalized;

      console.warn('Deposit result returned blank, polling balances check fallback');
      const paid = await waitForUsdtPaymentEffect(usdtContract, address, amount, { timeout: 18000 });
      if (paid) return tx;
      throw new Error(t('tronPay.depositTxFailed'));
    } catch (e: any) {
      if (isUserRejectedError(e)) {
        throw new Error(t('tronPay.usdtDepositRejected'));
      }
      if (isRateLimitError(e)) {
        throw new Error(t('tronPay.rateLimitError'));
      }
      depositRetry++;
      if (depositRetry >= 2) {
        let errorMsg = e?.message || t('tronPay.usdtPaymentFailed');
        if (errorMsg.includes('energy not enough') || errorMsg.includes('OUT_OF_ENERGY')) {
          errorMsg = t('tronPay.insufficientEnergyTx', { wallet: WALLET_META[walletId]?.name || walletId });
        } else if (/allowance|InsufficientAllowance/i.test(errorMsg)) {
          errorMsg = t('tronPay.usdtAllowanceTimeout');
        } else if (errorMsg === t('tronPay.usdtDepositSignTimeout')) {
          errorMsg = e.message;
        } else {
          errorMsg = t('tronPay.depositTxFailedDetail', { message: errorMsg });
        }
        throw new Error(errorMsg);
      }
      await new Promise((resolve) => setTimeout(resolve, 1500));
    }
  }
}

// Direct TRC20 USDT transfer to the address configured by the backend.
// This is the payment path used when /api/settings returns a normal wallet address.
export async function payDirectUsdt(
  walletId = '',
  orderTotal: string | number,
  recipient: string,
  options: {
    feeMode?: string;
    onProgress?: (stage: string) => void;
    onBeforeWalletSign?: () => void;
    onAfterWalletSign?: (stage: string) => void;
  } = {}
): Promise<any> {
  const amount = toUsdtAmount(orderTotal);
  const target = recipient.trim();
  if (amount === '0') throw new Error(t('tronPay.invalidPaymentAmount'));

  const tronWeb = await waitForTronWeb(walletId);
  applyTronRpcHost(tronWeb);
  if (!isValidTronRecipientAddress(target) || typeof tronWeb.isAddress !== 'function' || !tronWeb.isAddress(target)) {
    throw new Error('The configured TRON receiving address is invalid.');
  }

  const address = tronWeb.defaultAddress.base58;
  const usdtContract = await tronWeb.contract(TRC20_ABI, USDT_CONTRACT);
  const txOptions = buildTxSendOptions(options.feeMode === FEE_MODE.BURN ? FEE_MODE.BURN : FEE_MODE.RESOURCE);
  const signTimeoutMs = walletId === 'imtoken' ? 180000 : 120000;

  options.onProgress?.('deposit');
  options.onBeforeWalletSign?.();

  let tx: any;
  try {
    tx = await promiseWithTimeout(
      withRetry(() => usdtContract.transfer(target, amount).send(txOptions)),
      signTimeoutMs,
      t('tronPay.usdtDepositSignTimeout')
    );
  } catch (error: any) {
    if (isUserRejectedError(error)) throw new Error(t('tronPay.usdtDepositRejected'));
    if (isRateLimitError(error)) throw new Error(t('tronPay.rateLimitError'));
    throw new Error(t('tronPay.depositTxFailedDetail', { message: error?.message || String(error) }));
  } finally {
    options.onAfterWalletSign?.('depositConfirming');
  }

  const finalized = await finalizeSentTransaction(tronWeb, tx, {
    onConfirming: () => options.onProgress?.('depositConfirming'),
    fallbackCheck: () => waitForUsdtPaymentEffect(usdtContract, address, amount, { timeout: 18000 }),
    requireConfirmation: true
  });
  if (finalized) return finalized;
  throw new Error(t('tronPay.depositTxFailed'));
}
