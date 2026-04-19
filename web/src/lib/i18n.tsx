'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

export type Locale = 'pt' | 'en';

const translations = {
  pt: {
    'home.badge': 'Demo · Devnet',
    'home.tagline.before': '',
    'home.tagline.highlight': 'Solana',
    'home.tagline.after': 'em 60 segundos',
    'home.desc.before': 'Pague em reais via PIX. Receba',
    'home.desc.or': 'ou',
    'home.desc.after': 'direto na sua wallet.',
    'home.feature.fee': 'Menos de 1% de taxa',
    'home.feature.noCex': 'Sem CEX',
    'home.feature.noSeed': 'Sem seed phrase',
    'home.feature.security': 'Segurança e privacidade',
    'home.login.enter': 'Entrar',
    'home.login.loading': 'Carregando',
    'home.login.note': 'Email ou Google · Sem seed phrase',
    'home.footer': 'Hackathon · Solana Devnet',
    'lang.pt': 'PT',
    'lang.en': 'EN',
    'dash.balance': 'Saldo',
    'dash.creating': 'Criando wallet…',
    'dash.copied': '✓ Copiado',
    'dash.logout': 'Sair',
    'dash.anonymous': 'Anônimo',
    'tab.buy': 'Comprar',
    'tab.withdraw': 'Sacar',
    'tab.send': 'Enviar',
    'tab.receive': 'Receber',
    'tab.history': 'Histórico',
    'buy.payWith': 'Pagar com',
    'buy.receive': 'Receber',
    'buy.value': 'Valor',
    'buy.soon': 'Em breve',
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
    'buy.retry': 'Tentar de novo',
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
    'send.error': 'Falhou',
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
    'history.fees': 'Taxas',
    'history.fees.network': 'Taxa de rede',
    'history.destinationFees': 'Destino · Taxas',
    'compliance.tier': 'Nível atual',
    'compliance.tierBadge': 'Tier 1',
    'compliance.limits': 'Limite R$ 500/mês · Login com email',
    'compliance.kyc': 'Fazer KYC pra liberar R$ 50k/mês',
    'footer.roadmap': 'KYC via Unico · Confidential USDC · Em breve',
    'footer.demo': 'Demo · Solana Devnet',
    'loading': 'Carregando',
  },
  en: {
    'home.badge': 'Demo · Devnet',
    'home.tagline.before': '',
    'home.tagline.highlight': 'Solana',
    'home.tagline.after': 'in 60 seconds',
    'home.desc.before': 'Pay in reais via PIX. Receive',
    'home.desc.or': 'or',
    'home.desc.after': 'straight to your wallet.',
    'home.feature.fee': 'Less than 1% fee',
    'home.feature.noCex': 'No CEX',
    'home.feature.noSeed': 'No seed phrase',
    'home.feature.security': 'Security and privacy',
    'home.login.enter': 'Enter',
    'home.login.loading': 'Loading',
    'home.login.note': 'Email or Google · No seed phrase',
    'home.footer': 'Hackathon · Solana Devnet',
    'lang.pt': 'PT',
    'lang.en': 'EN',
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
    'buy.payWith': 'Pay with',
    'buy.receive': 'Receive',
    'buy.value': 'Amount',
    'buy.soon': 'Soon',
    'buy.generate': 'Generate PIX',
    'buy.paid': 'I paid',
    'buy.cancel': 'Cancel',
    'buy.sending': 'Sending SOL…',
    'buy.success.for': 'for',
    'buy.receipt': 'Receipt',
    'buy.fee.pix': 'PIX',
    'buy.fee.network': 'Solana network',
    'buy.fee.paidByCifra': 'paid by Cifra',
    'buy.fee.cifra': 'Cifra (spread)',
    'buy.fee.total': 'Total fees',
    'buy.viewSolscan': 'View transaction on Solscan ↗',
    'buy.again': 'Buy more',
    'buy.error': 'Something went wrong',
    'buy.retry': 'Try again',
    'send.address': 'Solana address',
    'send.addressPh': 'E.g. 4Nd1m...',
    'send.invalid': 'Invalid address',
    'send.amount': 'Amount in SOL',
    'send.max': 'Max',
    'send.invalidAmount': 'Invalid amount',
    'send.insufficient': 'Insufficient balance',
    'send.button': 'Send',
    'send.fee': 'Network fee ~0.000005 SOL (paid by you)',
    'send.sending': 'Sending transaction…',
    'send.success.to': 'sent to',
    'send.again': 'New transaction',
    'send.error': 'Failed',
    'withdraw.title': 'Withdraw SOL',
    'withdraw.youReceive': 'You receive',
    'withdraw.pixKey': 'PIX key (destination)',
    'withdraw.pixKeyPh': 'CPF, email, phone or random',
    'withdraw.button': 'Withdraw to PIX',
    'withdraw.note': 'Network fee ~0.000005 SOL · PIX free · Instant settlement',
    'withdraw.processing': 'Processing withdraw…',
    'withdraw.success.for': 'for',
    'withdraw.success.to': 'PIX to',
    'withdraw.e2eId': 'End-to-end ID',
    'withdraw.again': 'New withdraw',
    'receive.title': 'Receive SOL and SPL tokens',
    'receive.note.before': 'Only send on',
    'receive.network': 'Solana Devnet',
    'receive.yourAddress': 'Your address',
    'receive.copy': 'Copy address',
    'history.empty': 'No transactions yet',
    'history.emptyHint': 'Your buys and sends will appear here',
    'history.latest': 'Latest transactions',
    'history.buy': 'Bought SOL',
    'history.send': 'Sent SOL',
    'history.withdraw': 'Withdrew to PIX',
    'history.fees': 'Fees',
    'history.fees.network': 'Network fee',
    'history.destinationFees': 'Destination · Fees',
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
  const [locale, setLocaleState] = useState<Locale>('pt');

  useEffect(() => {
    const saved = typeof window !== 'undefined' ? localStorage.getItem('cifra:locale') : null;
    if (saved === 'pt' || saved === 'en') {
      setLocaleState(saved);
    } else if (typeof navigator !== 'undefined') {
      const browserLang = navigator.language.toLowerCase();
      if (!browserLang.startsWith('pt')) setLocaleState('en');
    }
  }, []);

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

export function LanguageToggle({ className = '' }: { className?: string }) {
  const { locale, setLocale } = useLanguage();
  return (
    <button
      onClick={() => setLocale(locale === 'pt' ? 'en' : 'pt')}
      className={`text-[10px] uppercase tracking-[0.2em] text-neutral-500 hover:text-white transition-colors ${className}`}
      aria-label="Toggle language"
    >
      {locale === 'pt' ? 'PT · EN' : 'EN · PT'}
    </button>
  );
}
