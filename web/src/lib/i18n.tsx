'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

export type Locale = 'pt' | 'en';

const translations = {
  pt: {
    'home.badge': 'Demo · Devnet',
    'home.tagline.highlight': 'Solana',
    'home.tagline.after': 'em 60 segundos',
    'home.desc.before': 'Pague em reais via PIX. Receba',
    'home.desc.or': 'ou',
    'home.desc.after': 'direto na sua carteira.',
    'home.feature.fee': 'Menos de 1% de taxa',
    'home.feature.noCex': 'Sem corretora',
    'home.feature.noSeed': 'Sem seed phrase',
    'home.feature.security': 'Segurança e privacidade',
    'home.login.enter': 'Entrar',
    'home.login.loading': 'Carregando',
    'home.login.note': 'Email ou Google · Sem seed phrase',
    'home.footer': 'Hackathon · Solana Devnet',
    'lang.pt': 'PT',
    'lang.en': 'EN',
    'lang.switchTo': 'Mudar idioma',
    'dash.balance': 'Saldo',
    'dash.creating': 'Criando carteira…',
    'dash.copied': '✓ Copiado',
    'dash.logout': 'Sair',
    'dash.anonymous': 'Anônimo',
    'tab.buy': 'Comprar',
    'tab.withdraw': 'Sacar',
    'tab.send': 'Enviar',
    'tab.receive': 'Receber',
    'tab.history': 'Histórico',
    'common.retry': 'Tentar de novo',
    'common.failed': 'Falhou',
    'common.soon': 'Em breve',
    'common.zero': 'R$ 0,00',
    'common.zeroPct': '0%',
    'buy.payWith': 'Pagar com',
    'buy.card': 'Cartão',
    'buy.receive': 'Receber',
    'buy.value': 'Valor',
    'buy.generate': 'Gerar PIX',
    'buy.paid': 'Já paguei',
    'buy.cancel': 'Cancelar',
    'buy.sending': 'Enviando SOL…',
    'buy.success.for': 'por',
    'buy.receipt': 'Recibo',
    'buy.fee.pix': 'PIX',
    'buy.fee.network': 'Rede Solana',
    'buy.fee.paidByCifra': 'paga pela Cifra',
    'buy.fee.cifra': 'Cifra (spread)',
    'buy.fee.total': 'Total de taxas',
    'buy.viewSolscan': 'Ver transação no Solscan ↗',
    'buy.again': 'Comprar mais',
    'buy.error': 'Algo deu errado',
    'send.address': 'Endereço Solana',
    'send.addressPh': 'Ex: 4Nd1m...',
    'send.invalid': 'Endereço inválido',
    'send.amount': 'Valor em SOL',
    'send.max': 'Máx',
    'send.invalidAmount': 'Valor inválido',
    'send.insufficient': 'Saldo insuficiente',
    'send.button': 'Enviar',
    'send.fee': 'Taxa de rede ~0.000005 SOL (pago por você)',
    'send.sending': 'Enviando transação…',
    'send.success.to': 'enviados para',
    'send.again': 'Nova transação',
    'withdraw.title': 'Sacar SOL',
    'withdraw.youReceive': 'Você recebe',
    'withdraw.pixKey': 'Chave PIX (destino)',
    'withdraw.pixKeyPh': 'CPF, email, telefone ou aleatória',
    'withdraw.button': 'Sacar para PIX',
    'withdraw.note': 'Taxa de rede ~0.000005 SOL · PIX gratuito · Liquidação instantânea',
    'withdraw.processing': 'Processando saque…',
    'withdraw.success.for': 'por',
    'withdraw.success.to': 'PIX para',
    'withdraw.e2eId': 'End-to-end ID',
    'withdraw.again': 'Novo saque',
    'receive.title': 'Receber SOL e SPL tokens',
    'receive.note.before': 'Envie apenas na rede',
    'receive.network': 'Solana Devnet',
    'receive.yourAddress': 'Seu endereço',
    'receive.copy': 'Copiar endereço',
    'history.empty': 'Nenhuma transação ainda',
    'history.emptyHint': 'Suas compras e envios aparecerão aqui',
    'history.latest': 'Últimas transações',
    'history.buy': 'Comprou SOL',
    'history.send': 'Enviou SOL',
    'history.withdraw': 'Sacou para PIX',
    'history.sentTo': 'para',
    'history.fees': 'Taxas',
    'history.fees.network': 'Taxa de rede',
    'history.destinationFees': 'Destino · Taxas',
    'history.networkShort': 'rede',
    'compliance.tier': 'Nível atual',
    'compliance.tierBadge': 'Tier 1',
    'compliance.limits': 'Limite R$ 500/mês · Login com email',
    'compliance.kyc': 'Fazer KYC para liberar R$ 50k/mês',
    'footer.roadmap': 'KYC via Unico · Confidential USDC · Em breve',
    'footer.demo': 'Demo · Solana Devnet',
    'loading': 'Carregando',
  },
  en: {
    'home.badge': 'Demo · Devnet',
    'home.tagline.highlight': 'Solana',
    'home.tagline.after': 'in 60 seconds',
    'home.desc.before': 'Pay with PIX in Brazilian reais. Receive',
    'home.desc.or': 'or',
    'home.desc.after': 'straight to your wallet.',
    'home.feature.fee': 'Under 1% fees',
    'home.feature.noCex': 'No exchange',
    'home.feature.noSeed': 'No seed phrase',
    'home.feature.security': 'Security & privacy',
    'home.login.enter': 'Get started',
    'home.login.loading': 'Loading',
    'home.login.note': 'Email or Google · No seed phrase',
    'home.footer': 'Hackathon · Solana Devnet',
    'lang.pt': 'PT',
    'lang.en': 'EN',
    'lang.switchTo': 'Switch language',
    'dash.balance': 'Balance',
    'dash.creating': 'Creating wallet…',
    'dash.copied': '✓ Copied',
    'dash.logout': 'Sign out',
    'dash.anonymous': 'Anonymous',
    'tab.buy': 'Buy',
    'tab.withdraw': 'Withdraw',
    'tab.send': 'Send',
    'tab.receive': 'Receive',
    'tab.history': 'History',
    'common.retry': 'Try again',
    'common.failed': 'Transaction failed',
    'common.soon': 'Soon',
    'common.zero': 'R$ 0.00',
    'common.zeroPct': '0%',
    'buy.payWith': 'Pay with',
    'buy.card': 'Card',
    'buy.receive': 'Receive',
    'buy.value': 'Amount',
    'buy.generate': 'Generate PIX',
    'buy.paid': "I've paid",
    'buy.cancel': 'Cancel',
    'buy.sending': 'Sending SOL…',
    'buy.success.for': 'for',
    'buy.receipt': 'Receipt',
    'buy.fee.pix': 'PIX',
    'buy.fee.network': 'Solana network',
    'buy.fee.paidByCifra': 'covered by Cifra',
    'buy.fee.cifra': 'Cifra (spread)',
    'buy.fee.total': 'Total fees',
    'buy.viewSolscan': 'View on Solscan ↗',
    'buy.again': 'Buy more',
    'buy.error': 'Something went wrong',
    'send.address': 'Solana address',
    'send.addressPh': 'e.g. 4Nd1m...',
    'send.invalid': 'Invalid address',
    'send.amount': 'Amount in SOL',
    'send.max': 'Max',
    'send.invalidAmount': 'Invalid amount',
    'send.insufficient': 'Insufficient balance',
    'send.button': 'Send',
    'send.fee': '~0.000005 SOL network fee (paid by you)',
    'send.sending': 'Broadcasting transaction…',
    'send.success.to': 'sent to',
    'send.again': 'New transaction',
    'withdraw.title': 'Withdraw SOL',
    'withdraw.youReceive': 'You receive',
    'withdraw.pixKey': 'PIX key (destination)',
    'withdraw.pixKeyPh': 'CPF, email, phone or random key',
    'withdraw.button': 'Withdraw to PIX',
    'withdraw.note': '~0.000005 SOL network fee · Free PIX · Instant settlement',
    'withdraw.processing': 'Processing withdrawal…',
    'withdraw.success.for': 'for',
    'withdraw.success.to': 'PIX to',
    'withdraw.e2eId': 'End-to-end ID',
    'withdraw.again': 'New withdrawal',
    'receive.title': 'Receive SOL & SPL tokens',
    'receive.note.before': 'Send only on',
    'receive.network': 'Solana Devnet',
    'receive.yourAddress': 'Your address',
    'receive.copy': 'Copy address',
    'history.empty': 'No transactions yet',
    'history.emptyHint': 'Your buys and sends will appear here',
    'history.latest': 'Latest transactions',
    'history.buy': 'Bought SOL',
    'history.send': 'Sent SOL',
    'history.withdraw': 'Withdrew to PIX',
    'history.sentTo': 'to',
    'history.fees': 'Fees',
    'history.fees.network': 'Network fee',
    'history.destinationFees': 'Destination · Fees',
    'history.networkShort': 'network',
    'compliance.tier': 'Current tier',
    'compliance.tierBadge': 'Tier 1',
    'compliance.limits': 'Limit R$ 500/mo · Email login',
    'compliance.kyc': 'Complete KYC to unlock R$ 50k/mo',
    'footer.roadmap': 'KYC via Unico · Confidential USDC · Coming soon',
    'footer.demo': 'Demo · Solana Devnet',
    'loading': 'Loading',
  },
} as const;

type TranslationKey = keyof typeof translations.pt;

const LanguageContext = createContext<{
  locale: Locale;
  setLocale: (l: Locale) => void;
  t: (key: TranslationKey) => string;
}>({
  locale: 'pt',
  setLocale: () => {},
  t: (k) => k,
});

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>('en');

  useEffect(() => {
    const saved = typeof window !== 'undefined' ? localStorage.getItem('cifra:locale') : null;
    if (saved === 'pt' || saved === 'en') {
      setLocaleState(saved);
    } else if (typeof navigator !== 'undefined') {
      const browserLang = navigator.language.toLowerCase();
      if (browserLang.startsWith('pt')) setLocaleState('pt');
    }
  }, []);

  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.lang = locale === 'pt' ? 'pt-BR' : 'en';
    }
  }, [locale]);

  const setLocale = (l: Locale) => {
    setLocaleState(l);
    try {
      localStorage.setItem('cifra:locale', l);
    } catch {}
  };

  const t = (key: TranslationKey): string => translations[locale][key] ?? key;

  return (
    <LanguageContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}

function FlagBR({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 28 20" className={className} aria-hidden="true">
      <rect width="28" height="20" rx="2" fill="#009C3B" />
      <path d="M14 3 L25 10 L14 17 L3 10 Z" fill="#FFDF00" />
      <circle cx="14" cy="10" r="3.6" fill="#002776" />
      <path d="M10.6 10.4 Q14 8.6 17.4 10.4" stroke="#fff" strokeWidth="0.6" fill="none" />
    </svg>
  );
}

function FlagUS({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 28 20" className={className} aria-hidden="true">
      <rect width="28" height="20" rx="2" fill="#B22234" />
      <g fill="#fff">
        <rect y="1.54" width="28" height="1.54" />
        <rect y="4.62" width="28" height="1.54" />
        <rect y="7.7" width="28" height="1.54" />
        <rect y="10.78" width="28" height="1.54" />
        <rect y="13.86" width="28" height="1.54" />
        <rect y="16.94" width="28" height="1.54" />
      </g>
      <rect width="11.2" height="10.78" fill="#3C3B6E" />
    </svg>
  );
}

export function LanguageToggle({ className = '' }: { className?: string }) {
  const { locale, setLocale, t } = useLanguage();

  return (
    <div
      className={`inline-flex items-center gap-1 p-0.5 rounded-full border border-neutral-800 bg-neutral-950/60 ${className}`}
      role="group"
      aria-label={t('lang.switchTo')}
    >
      <button
        type="button"
        onClick={() => setLocale('pt')}
        aria-pressed={locale === 'pt'}
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] uppercase tracking-[0.15em] font-medium transition-colors ${
          locale === 'pt'
            ? 'bg-white text-black'
            : 'text-neutral-500 hover:text-white'
        }`}
      >
        <FlagBR className="w-3.5 h-2.5 rounded-[1px] shrink-0" />
        PT
      </button>
      <button
        type="button"
        onClick={() => setLocale('en')}
        aria-pressed={locale === 'en'}
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] uppercase tracking-[0.15em] font-medium transition-colors ${
          locale === 'en'
            ? 'bg-white text-black'
            : 'text-neutral-500 hover:text-white'
        }`}
      >
        <FlagUS className="w-3.5 h-2.5 rounded-[1px] shrink-0" />
        EN
      </button>
    </div>
  );
}
