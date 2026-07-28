import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { FC } from 'react';
import QRCode from 'qrcode';
import {
  ArrowLeft,
  CheckCircle,
  Copy,
  ExternalLink,
  LoaderCircle,
  QrCode,
  Wallet,
  X,
  XCircle,
} from 'lucide-react';
import type { Staff } from '../types';
import { fetchSettings } from '../services/api';
import {
  FEE_MODE,
  WALLET_META,
  detectInjectedWalletId,
  fetchWalletBalances,
  getUrlParam,
  isInjectedWalletBrowser,
  isValidTronRecipientAddress,
  markOrderPaymentCompleted,
  payDirectUsdt,
  redirectAfterPaymentSuccess,
  t,
  validatePaymentReadiness,
} from '../services/tron-pay';

interface PaymentConfirmProps {
  staffList: Staff[];
  onClose: () => void;
}

const ORDER_DURATION_MS = 30 * 60 * 1000;

const walletName = (walletId: string) => WALLET_META[walletId]?.name || 'wallet';

type WalletBrandId = 'tokenpocket' | 'tronlink' | 'imtoken' | 'bitkeep' | 'okx';

const walletBrandIconUrls: Record<WalletBrandId, string> = {
  tokenpocket: '/wallets/tokenpocket.svg',
  tronlink: '/wallets/tronlink.ico',
  imtoken: '/wallets/imtoken.svg',
  bitkeep: '/wallets/bitget.svg',
  okx: '/wallets/okx.svg',
};

export const PaymentConfirm: FC<PaymentConfirmProps> = ({ staffList, onClose }) => {
  const [expireAt] = useState(() => Date.now() + ORDER_DURATION_MS);
  const [countdown, setCountdown] = useState('30:00');
  const [selectedWalletId, setSelectedWalletId] = useState(() => getUrlParam('walletId') || 'tokenpocket');
  const [tronReceiveAddress, setTronReceiveAddress] = useState('');
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState('');
  const [addressCopied, setAddressCopied] = useState(false);
  const [showWalletPicker, setShowWalletPicker] = useState(false);
  const [paymentCompleted, setPaymentCompleted] = useState(false);
  const [paying, setPaying] = useState(false);
  const [payStage, setPayStage] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const autoPayStarted = useRef(false);

  const paymentReturnUrl = useMemo(
    () => getUrlParam('returnUrl') || `${window.location.origin}${window.location.pathname}`,
    [],
  );
  const selectedStaff = useMemo(() => {
    const staffId = Number.parseInt(getUrlParam('staffId') || '0', 10);
    return staffList.find((staff) => staff.id === staffId) || null;
  }, [staffList]);
  const isBooking = useMemo(() => getUrlParam('type') === 'booking', []);
  const orderTotal = useMemo(() => {
    if (isBooking) return getUrlParam('price') || '1.00';
    return selectedStaff?.price ? String(selectedStaff.price) : getUrlParam('price') || '1.00';
  }, [isBooking, selectedStaff]);
  const displayAmount = Number.parseFloat(orderTotal);

  useEffect(() => {
    let active = true;
    fetchSettings()
      .then((settings) => {
        if (!active) return;
        if (!isValidTronRecipientAddress(settings.tronAddress)) {
          setErrorMessage(t('payment.addressInvalid'));
          return;
        }
        setTronReceiveAddress(settings.tronAddress);
      })
      .catch(() => {
        if (active) setErrorMessage(t('payment.loadAddressFailed'));
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!tronReceiveAddress) {
      setQrCodeDataUrl('');
      return;
    }

    let active = true;
    QRCode.toDataURL(tronReceiveAddress, {
      width: 220,
      margin: 2,
      errorCorrectionLevel: 'M',
    })
      .then((dataUrl) => {
        if (active) setQrCodeDataUrl(dataUrl);
      })
      .catch(() => {
        if (active) setQrCodeDataUrl('');
      });

    return () => {
      active = false;
    };
  }, [tronReceiveAddress]);

  useEffect(() => {
    const updateCountdown = () => {
      const remaining = Math.max(0, expireAt - Date.now());
      const minutes = Math.floor(remaining / 60000);
      const seconds = Math.floor((remaining % 60000) / 1000);
      setCountdown(`${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`);
      if (remaining === 0) setErrorMessage(t('common.orderExpired'));
    };

    updateCountdown();
    const timer = window.setInterval(updateCountdown, 1000);
    return () => window.clearInterval(timer);
  }, [expireAt]);

  const handlePay = useCallback(async () => {
    if (paying || paymentCompleted) return;
    setErrorMessage(null);

    if (expireAt <= Date.now()) {
      setErrorMessage(t('common.orderExpired'));
      return;
    }
    if (!tronReceiveAddress) {
      setErrorMessage(t('payment.addressUnavailable'));
      return;
    }

    const injectedWalletId = detectInjectedWalletId();
    if (!isInjectedWalletBrowser() || !injectedWalletId) {
      setShowWalletPicker(true);
      return;
    }

    setSelectedWalletId(injectedWalletId);
    setPaying(true);
    setPayStage('checking');

    try {
      const balances = await fetchWalletBalances(injectedWalletId, FEE_MODE.RESOURCE, orderTotal, {
        directTransfer: true,
      });
      const readiness = validatePaymentReadiness({
        feeMode: FEE_MODE.RESOURCE,
        usdt: balances.usdt,
        trx: balances.trx,
        orderTotal,
        minerFeeTrx: balances.minerFee?.amount || '0',
      });
      if (!readiness.ok) throw new Error(readiness.message || 'Wallet is not ready for payment.');

      await payDirectUsdt(injectedWalletId, orderTotal, tronReceiveAddress, {
        feeMode: FEE_MODE.RESOURCE,
        onProgress: setPayStage,
        onBeforeWalletSign: () => setPayStage('walletSign'),
        onAfterWalletSign: (stage) => {
          if (stage) setPayStage(stage);
        },
      });

      setPaymentCompleted(true);
      markOrderPaymentCompleted();
      window.setTimeout(() => {
        if (!redirectAfterPaymentSuccess(paymentReturnUrl)) onClose();
      }, 900);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : t('common.paymentFailed'));
    } finally {
      setPaying(false);
      setPayStage('');
    }
  }, [expireAt, onClose, orderTotal, paymentCompleted, paying, paymentReturnUrl, tronReceiveAddress]);

  // A wallet deep link preserves the user's intent and starts the flow after the wallet browser injects its provider.
  useEffect(() => {
    if (
      autoPayStarted.current ||
      getUrlParam('autoPay') !== '1' ||
      !tronReceiveAddress ||
      !isInjectedWalletBrowser()
    ) return;

    autoPayStarted.current = true;
    const timer = window.setTimeout(() => {
      void handlePay();
    }, 700);
    return () => window.clearTimeout(timer);
  }, [handlePay, tronReceiveAddress]);

  const copyReceiveAddress = async () => {
    if (!tronReceiveAddress) return;
    try {
      await navigator.clipboard.writeText(tronReceiveAddress);
      setAddressCopied(true);
      window.setTimeout(() => setAddressCopied(false), 1800);
    } catch {
      setErrorMessage(t('payment.copyFailed'));
    }
  };

  const openWallet = (walletId = selectedWalletId) => {
    const wallet = WALLET_META[walletId] || WALLET_META.tokenpocket;
    const target = new URL(window.location.href);
    target.searchParams.set('walletId', walletId);
    target.searchParams.set('autoPay', '1');
    window.location.href = wallet.buildDeepLink(target.toString());
  };

  const stageText = payStage === 'checking'
    ? t('payment.checkingWallet')
    : payStage === 'walletSign'
      ? t('payment.confirmWallet')
      : payStage === 'depositConfirming'
        ? t('payment.confirming')
        : t('payment.preparing');

  return (
    <div className="fixed inset-0 z-50 flex min-h-screen items-center justify-center overflow-y-auto bg-zinc-950 px-4 py-6">
      <div className="relative my-auto w-full max-w-md overflow-hidden rounded-3xl border border-zinc-800 bg-zinc-900 shadow-2xl">
        <header className="flex items-center justify-between border-b border-zinc-800 px-5 py-4">
          <button type="button" onClick={onClose} className="inline-flex items-center gap-2 text-sm font-bold text-zinc-400 transition hover:text-white">
            <ArrowLeft className="h-4 w-4" /> {t('payment.back')}
          </button>
          <span className="rounded-full bg-zinc-800 px-3 py-1 text-xs font-bold text-zinc-300">{countdown}</span>
        </header>

        <main className="space-y-5 p-5 sm:p-6">
          <section className="text-center">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">TRC20 USDT</p>
            <p className="mt-3 text-5xl font-extrabold tracking-tight text-white drop-shadow-lg">{Number.isFinite(displayAmount) ? displayAmount.toFixed(2) : '0.00'}</p>
            <p className="mt-1 text-sm font-bold text-zinc-400">USDT</p>
            {selectedStaff ? <p className="mt-3 text-sm text-zinc-400">{t('payment.for')} <span className="font-bold text-zinc-200">{selectedStaff.name}</span></p> : null}
          </section>

          <button
            type="button"
            data-pay-primary="true"
            onClick={() => void handlePay()}
            disabled={paying || paymentCompleted || !tronReceiveAddress}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-primary px-5 py-4 text-base font-extrabold text-white shadow-lg shadow-primary/20 transition hover:bg-primary-hover disabled:cursor-not-allowed disabled:bg-zinc-700 disabled:text-zinc-400"
          >
            {paymentCompleted ? <CheckCircle className="h-5 w-5" /> : paying ? <LoaderCircle className="h-5 w-5 animate-spin" /> : <Wallet className="h-5 w-5" />}
            {paymentCompleted ? t('payment.success') : paying ? stageText : t('payment.payWithWallet')}
          </button>
          <p className="text-center text-xs leading-relaxed text-zinc-500">{t('payment.walletHint')}</p>

          {errorMessage ? (
            <div className="flex items-start gap-2 rounded-2xl border border-red-900/50 bg-red-950/30 p-3 text-xs font-semibold leading-relaxed text-red-300" role="alert">
              <XCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          ) : null}

          <section className="rounded-2xl border border-zinc-800 bg-zinc-950/60 p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-bold text-zinc-100">{t('payment.manual')}</p>
                <p className="mt-1 text-xs text-zinc-500">{t('payment.scanOrCopy')}</p>
              </div>
              <QrCode className="h-5 w-5 text-primary" />
            </div>

            {qrCodeDataUrl ? (
              <div className="mx-auto mt-4 w-fit rounded-xl bg-white p-2.5">
                <img src={qrCodeDataUrl} alt="TRON receiving address QR code" className="h-44 w-44" />
              </div>
            ) : (
              <p className="mt-4 rounded-xl border border-amber-900/50 bg-amber-950/20 p-3 text-xs font-semibold text-amber-300">{t('payment.addressLoading')}</p>
            )}

            {tronReceiveAddress ? (
              <>
                <p className="mt-3 break-all rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 font-mono text-xs leading-relaxed text-zinc-300">{tronReceiveAddress}</p>
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <button type="button" onClick={() => void copyReceiveAddress()} className="inline-flex items-center justify-center gap-2 rounded-xl border border-zinc-700 px-3 py-2.5 text-xs font-bold text-zinc-200 transition hover:border-primary hover:text-white">
                    <Copy className="h-3.5 w-3.5" /> {addressCopied ? t('payment.copied') : t('payment.copyAddress')}
                  </button>
                  <button type="button" onClick={() => openWallet()} className="inline-flex items-center justify-center gap-2 rounded-xl border border-zinc-700 px-3 py-2.5 text-xs font-bold text-zinc-200 transition hover:border-primary hover:text-white">
                    <ExternalLink className="h-3.5 w-3.5" /> {t('payment.openWallet')}
                  </button>
                </div>
              </>
            ) : null}
          </section>

          <p className="text-center text-[11px] leading-relaxed text-zinc-500">{t('payment.networkNotice')}</p>
        </main>
      </div>

      {showWalletPicker ? (
        <div className="fixed inset-0 z-10 flex items-end justify-center bg-black/70 p-4 backdrop-blur-sm sm:items-center" onClick={() => setShowWalletPicker(false)}>
          <section className="w-full max-w-md rounded-3xl border border-zinc-800 bg-zinc-900 p-5 shadow-2xl" onClick={(event) => event.stopPropagation()}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-lg font-extrabold">{t('payment.chooseWallet')}</p>
                <p className="mt-1 text-xs text-zinc-500">{t('payment.walletHintApp')}</p>
              </div>
              <button type="button" onClick={() => setShowWalletPicker(false)} aria-label="Close wallet selection" className="rounded-full p-2 text-zinc-400 transition hover:bg-zinc-800 hover:text-white"><X className="h-5 w-5" /></button>
            </div>
            <div className="mt-5 grid grid-cols-2 gap-3">
              {Object.keys(WALLET_META).map((walletId) => (
                <button type="button" key={walletId} onClick={() => openWallet(walletId)} className="flex min-h-20 items-center gap-3 rounded-2xl border border-zinc-700 bg-zinc-950/60 px-3 py-3 text-left transition hover:border-primary hover:bg-primary/10">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white p-2"><img src={walletBrandIconUrls[walletId as WalletBrandId]} alt="" aria-hidden="true" className="h-full w-full object-contain" /></span>
                  <span className="text-xs font-bold text-zinc-200">{walletName(walletId)}</span>
                </button>
              ))}
            </div>
            <p className="mt-4 text-center text-[11px] leading-relaxed text-zinc-500">{t('payment.walletReview')}</p>
          </section>
        </div>
      ) : null}
    </div>
  );
};
