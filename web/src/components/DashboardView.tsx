'use client';

import { usePrivy } from '@privy-io/react-auth';
import { useWallets, useSignAndSendTransaction } from '@privy-io/react-auth/solana';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import {
  Connection,
  PublicKey,
  LAMPORTS_PER_SOL,
  SystemProgram,
  Transaction,
} from '@solana/web3.js';
import bs58 from 'bs58';
import Image from 'next/image';
import { useLanguage, LanguageToggle } from '@/lib/i18n';

const RPC = process.env.NEXT_PUBLIC_SOLANA_RPC || 'https://api.devnet.solana.com';
const TREASURY_ADDRESS = '5dghLkW1SpNhgpD9kDMzh9vmZgh73wAssVhMsifnSiM7';

type View = 'buy' | 'withdraw' | 'send' | 'receive' | 'history';
type BuyStep = 'idle' | 'qr' | 'processing' | 'done' | 'error';
type SendStep = 'idle' | 'processing' | 'done' | 'error';
type WithdrawStep = 'idle' | 'processing' | 'done' | 'error';

type Fees = {
  pix: { brl: number; label: string };
  network: { sol: number; label: string };
  cifra: { brl: number; label: string };
  totalBrl: number;
};

type BuyResult = {
  signature: string;
  solAmount: number;
  brlAmount: number;
  fees: Fees;
  timestamp: number;
};

type WithdrawResult = {
  pixId: string;
  signature: string;
  solAmount: number;
  brlGross: number;
  brlNet: number;
  pixKey: string;
  fees: { pix: { brl: number }; cifra: { brl: number }; totalBrl: number };
  timestamp: number;
};

type HistoryEntry =
  | ({ type: 'buy' } & BuyResult)
  | {
      type: 'send';
      signature: string;
      recipient: string;
      solAmount: number;
      timestamp: number;
    }
  | ({ type: 'withdraw' } & WithdrawResult);

const HISTORY_KEY = (addr: string) => `cifra:history:${addr}`;

function loadHistory(addr: string): HistoryEntry[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(HISTORY_KEY(addr));
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveHistory(addr: string, txs: HistoryEntry[]) {
  try {
    localStorage.setItem(HISTORY_KEY(addr), JSON.stringify(txs.slice(0, 50)));
  } catch {}
}

function formatDate(ts: number, locale: string = 'pt-BR'): string {
  return new Date(ts).toLocaleString(locale, {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function shorten(addr: string, chars = 4): string {
  return `${addr.slice(0, chars)}…${addr.slice(-chars)}`;
}

export default function DashboardView() {
  const { ready, authenticated, user, logout } = usePrivy();
  const { wallets } = useWallets();
  const { signAndSendTransaction } = useSignAndSendTransaction();
  const router = useRouter();
  const { t } = useLanguage();

  const [solBalance, setSolBalance] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [view, setView] = useState<View>('buy');
  const [history, setHistory] = useState<HistoryEntry[]>([]);

  // Buy (PIX) state
  const [buyStep, setBuyStep] = useState<BuyStep>('idle');
  const [brlInput, setBrlInput] = useState('50');
  const [buyResult, setBuyResult] = useState<BuyResult | null>(null);
  const [buyError, setBuyError] = useState('');

  // Send state
  const [sendStep, setSendStep] = useState<SendStep>('idle');
  const [sendTo, setSendTo] = useState('');
  const [sendAmount, setSendAmount] = useState('');
  const [sendSig, setSendSig] = useState('');
  const [sendError, setSendError] = useState('');

  // Withdraw state
  const [withdrawStep, setWithdrawStep] = useState<WithdrawStep>('idle');
  const [withdrawSol, setWithdrawSol] = useState('');
  const [withdrawPixKey, setWithdrawPixKey] = useState('');
  const [withdrawResult, setWithdrawResult] = useState<WithdrawResult | null>(null);
  const [withdrawError, setWithdrawError] = useState('');

  const solanaWallet = wallets[0];

  useEffect(() => {
    if (ready && !authenticated) router.push('/');
  }, [ready, authenticated, router]);

  const refreshBalance = useCallback(async () => {
    if (!solanaWallet?.address) return;
    const connection = new Connection(RPC, 'confirmed');
    try {
      const pubkey = new PublicKey(solanaWallet.address);
      const lamports = await connection.getBalance(pubkey, 'confirmed');
      setSolBalance(lamports / LAMPORTS_PER_SOL);
    } catch {
      setSolBalance(0);
    }
  }, [solanaWallet?.address]);

  useEffect(() => {
    refreshBalance();
  }, [refreshBalance]);

  useEffect(() => {
    if (solanaWallet?.address) {
      setHistory(loadHistory(solanaWallet.address));
    }
  }, [solanaWallet?.address]);

  const brlAmount = Number(brlInput);
  const brlValid = Number.isFinite(brlAmount) && brlAmount > 0;
  const estimatedSol = brlValid ? brlAmount / 800 : 0;

  const sendAmountNum = Number(sendAmount);
  const sendAmountValid =
    Number.isFinite(sendAmountNum) &&
    sendAmountNum > 0 &&
    (solBalance === null || sendAmountNum <= solBalance);

  let sendToValid = false;
  try {
    if (sendTo) {
      new PublicKey(sendTo);
      sendToValid = true;
    }
  } catch {}

  const copyToClipboard = async (value: string, field: string) => {
    await navigator.clipboard.writeText(value);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 1600);
  };

  const handleCopyAddress = async () => {
    if (!solanaWallet?.address) return;
    await navigator.clipboard.writeText(solanaWallet.address);
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  };

  const handleGeneratePix = () => {
    if (!brlValid) return;
    setBuyStep('qr');
  };

  const handleConfirmPayment = async () => {
    if (!solanaWallet?.address || !brlValid) return;
    setBuyStep('processing');
    setBuyError('');
    try {
      const res = await fetch('/api/pix/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recipient: solanaWallet.address, brlAmount }),
      });
      const data: BuyResult = await res.json();
      if (!res.ok) {
        throw new Error(
          (data as unknown as { error?: string }).error || 'Transferência falhou'
        );
      }
      setBuyResult(data);
      setBuyStep('done');
      refreshBalance();
      setTimeout(refreshBalance, 2500);
      const entry: HistoryEntry = { type: 'buy', ...data };
      const updated = [entry, ...history];
      setHistory(updated);
      if (solanaWallet?.address) saveHistory(solanaWallet.address, updated);
    } catch (err) {
      setBuyError(err instanceof Error ? err.message : 'Erro desconhecido');
      setBuyStep('error');
    }
  };

  const resetBuy = () => {
    setBuyStep('idle');
    setBuyResult(null);
    setBuyError('');
  };

  const handleSend = async () => {
    if (!solanaWallet?.address || !sendToValid || !sendAmountValid) return;
    setSendStep('processing');
    setSendError('');
    try {
      const connection = new Connection(RPC, 'confirmed');
      const fromPubkey = new PublicKey(solanaWallet.address);
      const toPubkey = new PublicKey(sendTo);
      const { blockhash } = await connection.getLatestBlockhash();
      const tx = new Transaction({ feePayer: fromPubkey, recentBlockhash: blockhash }).add(
        SystemProgram.transfer({
          fromPubkey,
          toPubkey,
          lamports: Math.floor(sendAmountNum * LAMPORTS_PER_SOL),
        })
      );
      const serialized = tx.serialize({ requireAllSignatures: false });
      const result = await signAndSendTransaction({
        transaction: new Uint8Array(serialized),
        wallet: solanaWallet,
        chain: 'solana:devnet',
      });
      const sigStr =
        typeof result.signature === 'string'
          ? result.signature
          : bs58.encode(result.signature as unknown as Uint8Array);
      setSendSig(sigStr);
      setSendStep('done');
      refreshBalance();
      setTimeout(refreshBalance, 2500);
      const entry: HistoryEntry = {
        type: 'send',
        signature: sigStr,
        recipient: sendTo,
        solAmount: sendAmountNum,
        timestamp: Date.now(),
      };
      const updated = [entry, ...history];
      setHistory(updated);
      if (solanaWallet?.address) saveHistory(solanaWallet.address, updated);
    } catch (err) {
      setSendError(err instanceof Error ? err.message : 'Erro desconhecido');
      setSendStep('error');
    }
  };

  const resetSend = () => {
    setSendStep('idle');
    setSendTo('');
    setSendAmount('');
    setSendSig('');
    setSendError('');
  };

  const withdrawSolNum = Number(withdrawSol);
  const withdrawSolValid =
    Number.isFinite(withdrawSolNum) &&
    withdrawSolNum > 0 &&
    (solBalance === null || withdrawSolNum <= solBalance);
  const withdrawPixKeyValid = withdrawPixKey.trim().length >= 3;
  const withdrawBrl = withdrawSolValid ? withdrawSolNum * 800 : 0;

  const handleWithdraw = async () => {
    if (!solanaWallet?.address || !withdrawSolValid || !withdrawPixKeyValid) return;
    setWithdrawStep('processing');
    setWithdrawError('');
    try {
      const connection = new Connection(RPC, 'confirmed');
      const fromPubkey = new PublicKey(solanaWallet.address);
      const toPubkey = new PublicKey(TREASURY_ADDRESS);
      const { blockhash } = await connection.getLatestBlockhash();
      const tx = new Transaction({ feePayer: fromPubkey, recentBlockhash: blockhash }).add(
        SystemProgram.transfer({
          fromPubkey,
          toPubkey,
          lamports: Math.floor(withdrawSolNum * LAMPORTS_PER_SOL),
        })
      );
      const serialized = tx.serialize({ requireAllSignatures: false });
      const signed = await signAndSendTransaction({
        transaction: new Uint8Array(serialized),
        wallet: solanaWallet,
        chain: 'solana:devnet',
      });
      const sigStr =
        typeof signed.signature === 'string'
          ? signed.signature
          : bs58.encode(signed.signature as unknown as Uint8Array);

      const res = await fetch('/api/pix/withdraw', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          solAmount: withdrawSolNum,
          pixKey: withdrawPixKey.trim(),
          signature: sigStr,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Saque falhou');

      const result: WithdrawResult = { ...data, signature: sigStr };
      setWithdrawResult(result);
      setWithdrawStep('done');
      refreshBalance();
      setTimeout(refreshBalance, 2500);
      const entry: HistoryEntry = { type: 'withdraw', ...result };
      const updated = [entry, ...history];
      setHistory(updated);
      if (solanaWallet?.address) saveHistory(solanaWallet.address, updated);
    } catch (err) {
      setWithdrawError(err instanceof Error ? err.message : 'Erro desconhecido');
      setWithdrawStep('error');
    }
  };

  const resetWithdraw = () => {
    setWithdrawStep('idle');
    setWithdrawSol('');
    setWithdrawPixKey('');
    setWithdrawResult(null);
    setWithdrawError('');
  };

  const switchView = (next: View) => {
    setView(next);
    if (next === 'buy' && buyStep !== 'idle') resetBuy();
    if (next === 'send' && sendStep !== 'idle') resetSend();
    if (next === 'withdraw' && withdrawStep !== 'idle') resetWithdraw();
  };

  if (!ready || !authenticated) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="flex items-center gap-3 text-neutral-500 text-sm">
          <span className="w-3.5 h-3.5 border-2 border-neutral-600 border-t-transparent rounded-full animate-spin-slow" />
          {t('loading')}
        </div>
      </main>
    );
  }

  const userEmail = user?.email?.address || user?.google?.email || t('dash.anonymous');
  const fullAddress = solanaWallet?.address ?? null;
  const shortAddress = fullAddress ? shorten(fullAddress, 6) : null;

  return (
    <main className="min-h-screen flex flex-col">
      <header className="flex items-center justify-between px-6 md:px-10 py-5">
        <Image src="/logo.png" alt="Cifra" width={40} height={40} />
        <div className="flex items-center gap-5">
          <LanguageToggle />
          <span className="hidden sm:inline text-xs text-neutral-500">{userEmail}</span>
          <button
            onClick={logout}
            className="text-xs text-neutral-500 hover:text-white transition-colors"
          >
            {t('dash.logout')}
          </button>
        </div>
      </header>

      <div className="flex-1 flex flex-col items-center px-6 py-8">
        <div className="w-full max-w-md space-y-6">
          {/* Balance */}
          <div className="text-center space-y-2">
            <p className="text-[10px] uppercase tracking-[0.2em] text-neutral-600">{t('dash.balance')}</p>
            <p className="text-5xl font-semibold tracking-tight">
              <span className="cifra-gradient-text">
                {solBalance === null ? '—' : solBalance.toFixed(4)}
              </span>
              <span className="text-neutral-500 text-2xl font-normal ml-2">SOL</span>
            </p>
            <button
              onClick={handleCopyAddress}
              className="text-[11px] font-mono text-neutral-500 hover:text-neutral-300 transition-colors"
            >
              {copied ? t('dash.copied') : shortAddress || t('dash.creating')}
            </button>
          </div>

          {/* Action tabs */}
          <div className="grid grid-cols-5 gap-1 p-1 bg-neutral-900/50 border border-neutral-800 rounded-full">
            <ViewTab active={view === 'buy'} onClick={() => switchView('buy')}>
              {t('tab.buy')}
            </ViewTab>
            <ViewTab active={view === 'withdraw'} onClick={() => switchView('withdraw')}>
              {t('tab.withdraw')}
            </ViewTab>
            <ViewTab active={view === 'send'} onClick={() => switchView('send')}>
              {t('tab.send')}
            </ViewTab>
            <ViewTab active={view === 'receive'} onClick={() => switchView('receive')}>
              {t('tab.receive')}
            </ViewTab>
            <ViewTab active={view === 'history'} onClick={() => switchView('history')}>
              {t('tab.history')}
            </ViewTab>
          </div>

          {/* Content */}
          <div className="rounded-2xl border border-neutral-900 bg-neutral-950/40 p-6">
            {view === 'buy' && (
              <BuyView
                step={buyStep}
                brlInput={brlInput}
                setBrlInput={setBrlInput}
                brlAmount={brlAmount}
                brlValid={brlValid}
                estimatedSol={estimatedSol}
                result={buyResult}
                error={buyError}
                onGenerate={handleGeneratePix}
                onConfirm={handleConfirmPayment}
                onReset={resetBuy}
              />
            )}

            {view === 'withdraw' && (
              <WithdrawView
                step={withdrawStep}
                sol={withdrawSol}
                setSol={setWithdrawSol}
                pixKey={withdrawPixKey}
                setPixKey={setWithdrawPixKey}
                solNum={withdrawSolNum}
                solValid={withdrawSolValid}
                pixKeyValid={withdrawPixKeyValid}
                balance={solBalance}
                brlAmount={withdrawBrl}
                result={withdrawResult}
                error={withdrawError}
                onWithdraw={handleWithdraw}
                onReset={resetWithdraw}
              />
            )}

            {view === 'send' && (
              <SendView
                step={sendStep}
                to={sendTo}
                setTo={setSendTo}
                amount={sendAmount}
                setAmount={setSendAmount}
                amountNum={sendAmountNum}
                toValid={sendToValid}
                amountValid={sendAmountValid}
                balance={solBalance}
                signature={sendSig}
                error={sendError}
                onSend={handleSend}
                onReset={resetSend}
              />
            )}

            {view === 'receive' && (
              <ReceiveView
                address={fullAddress}
                onCopy={copyToClipboard}
                copiedField={copiedField}
              />
            )}

            {view === 'history' && (
              <HistoryView history={history} />
            )}
          </div>

          {/* Compliance card */}
          <div className="rounded-xl border border-neutral-900 bg-neutral-950/50 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase tracking-[0.2em] text-neutral-500">
                {t('compliance.tier')}
              </span>
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-[#14F195]/10 border border-[#14F195]/30 text-[10px] text-[#14F195] font-medium">
                <span className="w-1 h-1 rounded-full bg-[#14F195]" />
                {t('compliance.tierBadge')}
              </span>
            </div>
            <p className="text-xs text-neutral-400">
              {t('compliance.limits')}
            </p>
            <button
              disabled
              className="w-full text-[11px] text-neutral-500 py-2 rounded-lg border border-neutral-900 flex items-center justify-center gap-2 cursor-not-allowed"
            >
              {t('compliance.kyc')}
              <SoonBadge />
            </button>
          </div>
        </div>
      </div>

      <footer className="text-center space-y-1 text-[10px] uppercase tracking-[0.2em] text-neutral-700 pb-6">
        <p>{t('footer.roadmap')}</p>
        <p>{t('footer.demo')}</p>
      </footer>
    </main>
  );
}

function ViewTab({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`py-2 rounded-full text-xs font-semibold transition-all ${
        active
          ? 'bg-white text-black'
          : 'text-neutral-400 hover:text-white'
      }`}
    >
      {children}
    </button>
  );
}

function BuyView(props: {
  step: BuyStep;
  brlInput: string;
  setBrlInput: (v: string) => void;
  brlAmount: number;
  brlValid: boolean;
  estimatedSol: number;
  result: BuyResult | null;
  error: string;
  onGenerate: () => void;
  onConfirm: () => void;
  onReset: () => void;
}) {
  const { step, brlInput, setBrlInput, brlAmount, brlValid, estimatedSol, result, error, onGenerate, onConfirm, onReset } = props;
  const { t } = useLanguage();

  if (step === 'idle') {
    return (
      <div className="space-y-5">
        <div>
          <p className="text-[10px] uppercase tracking-[0.2em] text-neutral-600 mb-2">
            {t('buy.payWith')}
          </p>
          <div className="flex gap-2 p-1 bg-neutral-900/50 border border-neutral-800 rounded-full">
            <button className="flex-1 py-2 rounded-full bg-white text-black text-xs font-semibold">
              PIX
            </button>
            <button
              disabled
              className="flex-1 py-2 rounded-full text-xs font-medium text-neutral-500 flex items-center justify-center gap-1.5 cursor-not-allowed"
            >
              {t('buy.card')}
              <SoonBadge />
            </button>
          </div>
        </div>

        <div>
          <p className="text-[10px] uppercase tracking-[0.2em] text-neutral-600 mb-2">
            {t('buy.receive')}
          </p>
          <div className="flex gap-2 p-1 bg-neutral-900/50 border border-neutral-800 rounded-full">
            <button className="flex-1 py-2 rounded-full cifra-gradient-bg text-black text-xs font-semibold">
              SOL
            </button>
            <button
              disabled
              className="flex-1 py-2 rounded-full text-xs font-medium text-neutral-500 flex items-center justify-center gap-1.5 cursor-not-allowed"
            >
              USDC
              <SoonBadge />
            </button>
            <button
              disabled
              className="flex-1 py-2 rounded-full text-xs font-medium text-neutral-500 flex items-center justify-center gap-1.5 cursor-not-allowed"
            >
              cBTC
              <SoonBadge />
            </button>
          </div>
        </div>

        <div className="text-center">
          <p className="text-[10px] uppercase tracking-[0.2em] text-neutral-600 mb-3">
            {t('buy.value')}
          </p>
          <div className="flex items-baseline justify-center gap-2">
            <span className="text-neutral-600 text-2xl">R$</span>
            <input
              type="number"
              min="1"
              value={brlInput}
              onChange={(e) => setBrlInput(e.target.value)}
              className="bg-transparent text-5xl font-semibold tracking-tight text-white focus:outline-none w-40 text-center"
              placeholder="50"
            />
          </div>
          {brlValid && (
            <p className="text-xs text-neutral-500 mt-3">
              ≈ {estimatedSol.toFixed(4)} SOL
            </p>
          )}
        </div>

        <button
          onClick={onGenerate}
          disabled={!brlValid}
          className="w-full py-3.5 rounded-full cifra-gradient-bg text-black font-semibold text-sm shadow-[0_0_30px_rgba(153,69,255,0.2)] hover:shadow-[0_0_40px_rgba(153,69,255,0.35)] active:scale-[0.99] transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none"
        >
          {t('buy.generate')}
        </button>
      </div>
    );
  }

  if (step === 'qr') {
    return (
      <div className="space-y-5 text-center">
        <div className="mx-auto w-48 h-48 bg-white rounded-2xl p-3">
          <div
            className="w-full h-full rounded-lg"
            style={{
              backgroundImage: 'repeating-conic-gradient(#000 0% 25%, #fff 0% 50%)',
              backgroundSize: '14px 14px',
            }}
          />
        </div>

        <div>
          <p className="text-[10px] uppercase tracking-[0.2em] text-neutral-600 mb-1">{t('buy.value')}</p>
          <p className="text-3xl font-semibold">R$ {brlAmount.toFixed(2)}</p>
          <p className="text-xs text-neutral-500 mt-1">≈ {estimatedSol.toFixed(4)} SOL</p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={onReset}
            className="flex-1 py-3.5 rounded-full border border-neutral-800 hover:bg-neutral-900 text-neutral-400 text-sm transition-colors"
          >
            {t('buy.cancel')}
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 py-3.5 rounded-full cifra-gradient-bg text-black font-semibold text-sm shadow-[0_0_30px_rgba(153,69,255,0.2)] transition-all"
          >
            {t('buy.paid')}
          </button>
        </div>
      </div>
    );
  }

  if (step === 'processing') {
    return (
      <div className="py-12 text-center space-y-4">
        <div className="mx-auto w-8 h-8 border-2 border-neutral-600 border-t-white rounded-full animate-spin-slow" />
        <p className="text-sm text-neutral-400">{t('buy.sending')}</p>
      </div>
    );
  }

  if (step === 'done' && result) {
    return (
      <div className="py-2 space-y-5">
        <div className="text-center space-y-3">
          <div className="mx-auto w-14 h-14 rounded-full bg-[#14F195]/10 border border-[#14F195]/30 flex items-center justify-center text-2xl text-[#14F195]">
            ✓
          </div>
          <div>
            <p className="text-3xl font-bold">
              <span className="cifra-gradient-text">{result.solAmount.toFixed(4)}</span>
              <span className="text-neutral-400 text-xl font-normal ml-2">SOL</span>
            </p>
            <p className="text-xs text-neutral-500 mt-1">
              {t('buy.success.for')} R$ {result.brlAmount.toFixed(2)}
            </p>
          </div>
        </div>

        <div className="rounded-xl border border-neutral-900 bg-neutral-950/70 p-4 space-y-2">
          <p className="text-[10px] uppercase tracking-[0.2em] text-neutral-500 mb-2">{t('buy.receipt')}</p>
          <FeeRow label={t('buy.fee.pix')} value={t('common.zero')} note={t('common.zeroPct')} />
          <FeeRow
            label={t('buy.fee.network')}
            value={`${result.fees.network.sol.toFixed(6)} SOL`}
            note={t('buy.fee.paidByCifra')}
          />
          <FeeRow label={t('buy.fee.cifra')} value={t('common.zero')} note={t('common.zeroPct')} />
          <div className="h-px bg-neutral-900 my-1" />
          <FeeRow label={t('buy.fee.total')} value={t('common.zero')} bold />
        </div>

        <a
          href={`https://solscan.io/tx/${result.signature}?cluster=devnet`}
          target="_blank"
          rel="noopener noreferrer"
          className="block text-center text-xs text-neutral-400 hover:text-white transition-colors"
        >
          {t('buy.viewSolscan')}
        </a>

        <button
          onClick={onReset}
          className="w-full py-3.5 rounded-full border border-neutral-800 hover:bg-neutral-900 text-neutral-300 text-sm transition-colors"
        >
          {t('buy.again')}
        </button>
      </div>
    );
  }

  if (step === 'error') {
    return (
      <div className="py-6 text-center space-y-5">
        <div className="mx-auto w-14 h-14 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center text-2xl text-red-400">
          !
        </div>
        <div>
          <p className="font-medium">{t('buy.error')}</p>
          <p className="text-xs text-red-400 mt-1">{error}</p>
        </div>
        <button
          onClick={onReset}
          className="w-full py-3.5 rounded-full border border-neutral-800 hover:bg-neutral-900 text-neutral-300 text-sm transition-colors"
        >
          {t('common.retry')}
        </button>
      </div>
    );
  }

  return null;
}

function SendView(props: {
  step: SendStep;
  to: string;
  setTo: (v: string) => void;
  amount: string;
  setAmount: (v: string) => void;
  amountNum: number;
  toValid: boolean;
  amountValid: boolean;
  balance: number | null;
  signature: string;
  error: string;
  onSend: () => void;
  onReset: () => void;
}) {
  const { step, to, setTo, amount, setAmount, amountNum, toValid, amountValid, balance, signature, error, onSend, onReset } = props;
  const { t } = useLanguage();

  if (step === 'idle') {
    const valid = toValid && amountValid;
    return (
      <div className="space-y-5">
        <div>
          <p className="text-[10px] uppercase tracking-[0.2em] text-neutral-600 mb-2">
            {t('send.address')}
          </p>
          <input
            type="text"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            placeholder={t('send.addressPh')}
            className="w-full bg-neutral-900/50 border border-neutral-800 rounded-xl px-4 py-3 text-sm font-mono text-white placeholder-neutral-600 focus:outline-none focus:border-[#9945FF] transition-colors"
          />
          {to && !toValid && (
            <p className="text-xs text-red-400 mt-2">{t('send.invalid')}</p>
          )}
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-[10px] uppercase tracking-[0.2em] text-neutral-600">
              {t('send.amount')}
            </p>
            {balance !== null && (
              <button
                onClick={() => setAmount(balance.toFixed(6))}
                className="text-[10px] text-[#14F195] hover:underline"
              >
                {t('send.max')}: {balance.toFixed(4)}
              </button>
            )}
          </div>
          <input
            type="number"
            step="0.0001"
            min="0"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
            className="w-full bg-neutral-900/50 border border-neutral-800 rounded-xl px-4 py-3 text-lg font-semibold text-white focus:outline-none focus:border-[#9945FF] transition-colors"
          />
          {amount && !amountValid && (
            <p className="text-xs text-red-400 mt-2">
              {amountNum <= 0 ? t('send.invalidAmount') : t('send.insufficient')}
            </p>
          )}
        </div>

        <button
          onClick={onSend}
          disabled={!valid}
          className="w-full py-3.5 rounded-full cifra-gradient-bg text-black font-semibold text-sm shadow-[0_0_30px_rgba(153,69,255,0.2)] hover:shadow-[0_0_40px_rgba(153,69,255,0.35)] active:scale-[0.99] transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none"
        >
          {t('send.button')}
        </button>

        <p className="text-[10px] text-neutral-600 text-center">
          {t('send.fee')}
        </p>
      </div>
    );
  }

  if (step === 'processing') {
    return (
      <div className="py-12 text-center space-y-4">
        <div className="mx-auto w-8 h-8 border-2 border-neutral-600 border-t-white rounded-full animate-spin-slow" />
        <p className="text-sm text-neutral-400">{t('send.sending')}</p>
      </div>
    );
  }

  if (step === 'done') {
    return (
      <div className="py-2 text-center space-y-5">
        <div className="mx-auto w-14 h-14 rounded-full bg-[#14F195]/10 border border-[#14F195]/30 flex items-center justify-center text-2xl text-[#14F195]">
          ✓
        </div>
        <div>
          <p className="text-2xl font-bold">
            <span className="cifra-gradient-text">{amountNum.toFixed(4)}</span>
            <span className="text-neutral-400 text-lg font-normal ml-2">SOL</span>
          </p>
          <p className="text-xs text-neutral-500 mt-1">{t('send.success.to')}</p>
          <p className="text-xs text-neutral-300 mt-1 font-mono">{shorten(to, 8)}</p>
        </div>
        <a
          href={`https://solscan.io/tx/${signature}?cluster=devnet`}
          target="_blank"
          rel="noopener noreferrer"
          className="block text-[10px] text-neutral-500 hover:text-white transition-colors font-mono"
        >
          {signature.slice(0, 24)}… ↗
        </a>
        <button
          onClick={onReset}
          className="w-full py-3.5 rounded-full border border-neutral-800 hover:bg-neutral-900 text-neutral-300 text-sm transition-colors"
        >
          {t('send.again')}
        </button>
      </div>
    );
  }

  if (step === 'error') {
    return (
      <div className="py-6 text-center space-y-5">
        <div className="mx-auto w-14 h-14 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center text-2xl text-red-400">
          !
        </div>
        <div>
          <p className="font-medium">{t('common.failed')}</p>
          <p className="text-xs text-red-400 mt-1">{error}</p>
        </div>
        <button
          onClick={onReset}
          className="w-full py-3.5 rounded-full border border-neutral-800 hover:bg-neutral-900 text-neutral-300 text-sm transition-colors"
        >
          {t('common.retry')}
        </button>
      </div>
    );
  }

  return null;
}

function WithdrawView(props: {
  step: WithdrawStep;
  sol: string;
  setSol: (v: string) => void;
  pixKey: string;
  setPixKey: (v: string) => void;
  solNum: number;
  solValid: boolean;
  pixKeyValid: boolean;
  balance: number | null;
  brlAmount: number;
  result: WithdrawResult | null;
  error: string;
  onWithdraw: () => void;
  onReset: () => void;
}) {
  const { step, sol, setSol, pixKey, setPixKey, solNum, solValid, pixKeyValid, balance, brlAmount, result, error, onWithdraw, onReset } = props;
  const { t } = useLanguage();

  if (step === 'idle') {
    const valid = solValid && pixKeyValid;
    return (
      <div className="space-y-5">
        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-[10px] uppercase tracking-[0.2em] text-neutral-600">
              {t('withdraw.title')}
            </p>
            {balance !== null && (
              <button
                onClick={() => setSol(balance.toFixed(6))}
                className="text-[10px] text-[#14F195] hover:underline"
              >
                {t('send.max')}: {balance.toFixed(4)}
              </button>
            )}
          </div>
          <input
            type="number"
            step="0.0001"
            min="0"
            value={sol}
            onChange={(e) => setSol(e.target.value)}
            placeholder="0.00"
            className="w-full bg-neutral-900/50 border border-neutral-800 rounded-xl px-4 py-3 text-lg font-semibold text-white focus:outline-none focus:border-[#9945FF] transition-colors"
          />
          {sol && !solValid && (
            <p className="text-xs text-red-400 mt-2">
              {solNum <= 0 ? t('send.invalidAmount') : t('send.insufficient')}
            </p>
          )}
          {solValid && (
            <p className="text-xs text-neutral-500 mt-2">
              {t('withdraw.youReceive')}{' '}
              <span className="cifra-gradient-text font-semibold">
                R$ {brlAmount.toFixed(2)}
              </span>
            </p>
          )}
        </div>

        <div>
          <p className="text-[10px] uppercase tracking-[0.2em] text-neutral-600 mb-2">
            {t('withdraw.pixKey')}
          </p>
          <input
            type="text"
            value={pixKey}
            onChange={(e) => setPixKey(e.target.value)}
            placeholder={t('withdraw.pixKeyPh')}
            className="w-full bg-neutral-900/50 border border-neutral-800 rounded-xl px-4 py-3 text-sm text-white placeholder-neutral-600 focus:outline-none focus:border-[#9945FF] transition-colors"
          />
        </div>

        <button
          onClick={onWithdraw}
          disabled={!valid}
          className="w-full py-3.5 rounded-full cifra-gradient-bg text-black font-semibold text-sm shadow-[0_0_30px_rgba(153,69,255,0.2)] hover:shadow-[0_0_40px_rgba(153,69,255,0.35)] active:scale-[0.99] transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none"
        >
          {t('withdraw.button')}
        </button>

        <p className="text-[10px] text-neutral-600 text-center">
          {t('withdraw.note')}
        </p>
      </div>
    );
  }

  if (step === 'processing') {
    return (
      <div className="py-12 text-center space-y-4">
        <div className="mx-auto w-8 h-8 border-2 border-neutral-600 border-t-white rounded-full animate-spin-slow" />
        <p className="text-sm text-neutral-400">{t('withdraw.processing')}</p>
      </div>
    );
  }

  if (step === 'done' && result) {
    return (
      <div className="py-2 space-y-5">
        <div className="text-center space-y-3">
          <div className="mx-auto w-14 h-14 rounded-full bg-[#14F195]/10 border border-[#14F195]/30 flex items-center justify-center text-2xl text-[#14F195]">
            ✓
          </div>
          <div>
            <p className="text-3xl font-bold">
              <span className="cifra-gradient-text">R$ {result.brlNet.toFixed(2)}</span>
            </p>
            <p className="text-xs text-neutral-500 mt-1">
              {t('withdraw.success.for')} {result.solAmount.toFixed(4)} SOL · {t('withdraw.success.to')} {result.pixKey}
            </p>
          </div>
        </div>

        <div className="rounded-xl border border-neutral-900 bg-neutral-950/70 p-4 space-y-2">
          <p className="text-[10px] uppercase tracking-[0.2em] text-neutral-500 mb-2">{t('buy.receipt')}</p>
          <FeeRow label={t('buy.fee.pix')} value={t('common.zero')} note={t('common.zeroPct')} />
          <FeeRow label={t('buy.fee.cifra')} value={t('common.zero')} note={t('common.zeroPct')} />
          <div className="h-px bg-neutral-900 my-1" />
          <FeeRow label={t('buy.fee.total')} value={t('common.zero')} bold />
        </div>

        <div className="space-y-1.5 text-center">
          <p className="text-[10px] text-neutral-600 uppercase tracking-wider">{t('withdraw.e2eId')}</p>
          <p className="text-[10px] font-mono text-neutral-400 break-all">{result.pixId}</p>
        </div>

        <a
          href={`https://solscan.io/tx/${result.signature}?cluster=devnet`}
          target="_blank"
          rel="noopener noreferrer"
          className="block text-center text-xs text-neutral-400 hover:text-white transition-colors"
        >
          {t('buy.viewSolscan')}
        </a>

        <button
          onClick={onReset}
          className="w-full py-3.5 rounded-full border border-neutral-800 hover:bg-neutral-900 text-neutral-300 text-sm transition-colors"
        >
          {t('withdraw.again')}
        </button>
      </div>
    );
  }

  if (step === 'error') {
    return (
      <div className="py-6 text-center space-y-5">
        <div className="mx-auto w-14 h-14 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center text-2xl text-red-400">
          !
        </div>
        <div>
          <p className="font-medium">{t('common.failed')}</p>
          <p className="text-xs text-red-400 mt-1">{error}</p>
        </div>
        <button
          onClick={onReset}
          className="w-full py-3.5 rounded-full border border-neutral-800 hover:bg-neutral-900 text-neutral-300 text-sm transition-colors"
        >
          {t('common.retry')}
        </button>
      </div>
    );
  }

  return null;
}

function ReceiveView({
  address,
  onCopy,
  copiedField,
}: {
  address: string | null;
  onCopy: (v: string, field: string) => void;
  copiedField: string | null;
}) {
  const { t } = useLanguage();

  if (!address) {
    return <p className="text-center text-sm text-neutral-500 py-8">{t('dash.creating')}</p>;
  }

  return (
    <div className="space-y-5 text-center">
      <div>
        <p className="text-[10px] uppercase tracking-[0.2em] text-neutral-600 mb-2">
          {t('receive.title')}
        </p>
        <p className="text-xs text-neutral-500">
          {t('receive.note.before')} <span className="cifra-gradient-text font-semibold">{t('receive.network')}</span>
        </p>
      </div>

      <div className="mx-auto w-48 h-48 bg-white rounded-2xl p-3">
        <div
          className="w-full h-full rounded-lg"
          style={{
            backgroundImage: 'repeating-conic-gradient(#000 0% 25%, #fff 0% 50%)',
            backgroundSize: '14px 14px',
          }}
        />
      </div>

      <div className="rounded-xl border border-neutral-900 bg-neutral-950/70 p-4 space-y-2">
        <p className="text-[10px] uppercase tracking-[0.2em] text-neutral-500 text-left">
          {t('receive.yourAddress')}
        </p>
        <p className="text-xs font-mono text-neutral-200 break-all text-left">{address}</p>
      </div>

      <button
        onClick={() => onCopy(address, 'receive-addr')}
        className="w-full py-3.5 rounded-full cifra-gradient-bg text-black font-semibold text-sm"
      >
        {copiedField === 'receive-addr' ? t('dash.copied') : t('receive.copy')}
      </button>
    </div>
  );
}

function HistoryView({ history }: { history: HistoryEntry[] }) {
  const { t, locale } = useLanguage();
  const dateLocale = locale === 'pt' ? 'pt-BR' : 'en-US';

  if (history.length === 0) {
    return (
      <div className="py-12 text-center space-y-2">
        <p className="text-sm text-neutral-400">{t('history.empty')}</p>
        <p className="text-xs text-neutral-600">
          {t('history.emptyHint')}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-[10px] uppercase tracking-[0.2em] text-neutral-500 mb-2">
        {t('history.latest')}
      </p>
      {history.map((tx) => (
        <div key={tx.signature} className="rounded-xl border border-neutral-900 bg-neutral-950/60 p-3">
          {tx.type === 'buy' && (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium">
                  <span className="text-[#14F195]">+</span> {t('history.buy')}
                </span>
                <span className="text-[10px] text-neutral-600">{formatDate(tx.timestamp, dateLocale)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-mono">
                  <span className="cifra-gradient-text font-semibold">
                    {tx.solAmount.toFixed(4)}
                  </span>{' '}
                  SOL
                </span>
                <span className="text-xs text-neutral-400">
                  R$ {tx.brlAmount.toFixed(2)}
                </span>
              </div>
              <div className="flex items-center justify-between pt-1 border-t border-neutral-900/80">
                <span className="text-[10px] text-neutral-600">{t('history.fees')}</span>
                <span className="text-[10px] text-neutral-500">
                  R$ {tx.fees.totalBrl.toFixed(2)} · {t('history.networkShort')} {tx.fees.network.sol.toFixed(6)} SOL
                </span>
              </div>
              <a
                href={`https://solscan.io/tx/${tx.signature}?cluster=devnet`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[10px] text-neutral-500 hover:text-white transition-colors inline-flex items-center gap-1 mt-1"
              >
                {shorten(tx.signature, 6)} ↗
              </a>
            </div>
          )}
          {tx.type === 'send' && (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium">
                  <span className="text-red-400">−</span> {t('history.send')}
                </span>
                <span className="text-[10px] text-neutral-600">{formatDate(tx.timestamp, dateLocale)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-mono">
                  <span className="text-red-300 font-semibold">{tx.solAmount.toFixed(4)}</span> SOL
                </span>
                <span className="text-[10px] text-neutral-500 font-mono">
                  {t('history.sentTo')} {shorten(tx.recipient, 6)}
                </span>
              </div>
              <div className="flex items-center justify-between pt-1 border-t border-neutral-900/80">
                <span className="text-[10px] text-neutral-600">{t('history.fees.network')}</span>
                <span className="text-[10px] text-neutral-500">~0.000005 SOL</span>
              </div>
            </div>
          )}
          {tx.type === 'withdraw' && (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium">
                  <span className="text-[#9945FF]">↓</span> {t('history.withdraw')}
                </span>
                <span className="text-[10px] text-neutral-600">{formatDate(tx.timestamp, dateLocale)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-mono">
                  <span className="cifra-gradient-text font-semibold">
                    R$ {tx.brlNet.toFixed(2)}
                  </span>
                </span>
                <span className="text-xs text-neutral-400">
                  −{tx.solAmount.toFixed(4)} SOL
                </span>
              </div>
              <div className="flex items-center justify-between pt-1 border-t border-neutral-900/80">
                <span className="text-[10px] text-neutral-600">{t('history.destinationFees')}</span>
                <span className="text-[10px] text-neutral-500">
                  {tx.pixKey.length > 16 ? shorten(tx.pixKey, 6) : tx.pixKey} · R$ {tx.fees.totalBrl.toFixed(2)}
                </span>
              </div>
              <a
                href={`https://solscan.io/tx/${tx.signature}?cluster=devnet`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[10px] text-neutral-500 hover:text-white transition-colors inline-flex items-center gap-1 mt-1"
              >
                {shorten(tx.signature, 6)} ↗
              </a>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function FeeRow({
  label,
  value,
  note,
  bold,
}: {
  label: string;
  value: string;
  note?: string;
  bold?: boolean;
}) {
  return (
    <div className="flex items-center justify-between text-xs">
      <span className={bold ? 'text-white font-semibold' : 'text-neutral-400'}>{label}</span>
      <div className="flex items-center gap-2">
        {note && <span className="text-[10px] text-neutral-600">{note}</span>}
        <span className={bold ? 'text-white font-semibold' : 'text-neutral-300 font-mono'}>
          {value}
        </span>
      </div>
    </div>
  );
}

function SoonBadge() {
  const { t } = useLanguage();
  return (
    <span className="px-1.5 py-0.5 rounded-full bg-neutral-800 text-[9px] uppercase tracking-wider text-neutral-400">
      {t('common.soon')}
    </span>
  );
}
