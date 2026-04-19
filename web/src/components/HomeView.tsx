'use client';

import { usePrivy } from '@privy-io/react-auth';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import Image from 'next/image';
import { useLanguage, LanguageToggle } from '@/lib/i18n';

export default function HomeView() {
  const { ready, authenticated, login } = usePrivy();
  const router = useRouter();
  const { t } = useLanguage();

  useEffect(() => {
    if (ready && authenticated) {
      router.push('/dashboard');
    }
  }, [ready, authenticated, router]);

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-6 relative">
      <div className="absolute top-6 right-6 hidden md:flex items-center gap-4">
        <LanguageToggle />
        <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-neutral-900 text-[10px] uppercase tracking-[0.2em] text-neutral-500">
          <span className="w-1 h-1 rounded-full bg-[#14F195]" />
          {t('home.badge')}
        </span>
      </div>

      <div className="w-full max-w-md flex flex-col items-center text-center">
        <Image
          src="/logo.png"
          alt="Cifra"
          width={340}
          height={340}
          priority
          className="mb-2"
        />

        <h1 className="text-2xl md:text-3xl font-medium tracking-tight mb-3 text-neutral-200">
          <span className="cifra-gradient-text font-bold">{t('home.tagline.highlight')}</span> {t('home.tagline.after')}
        </h1>

        <p className="text-sm text-neutral-400 mb-5 leading-relaxed max-w-xs">
          {t('home.desc.before')} <span className="cifra-gradient-text font-semibold">SOL</span> {t('home.desc.or')} <span className="cifra-gradient-text font-semibold">USDC</span> {t('home.desc.after')}
        </p>

        <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 mb-10 text-[11px] uppercase tracking-wider text-neutral-500">
          <span className="flex items-center gap-1.5">
            <span className="w-1 h-1 rounded-full bg-[#14F195]" />
            {t('home.feature.fee')}
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-1 h-1 rounded-full bg-[#9945FF]" />
            {t('home.feature.noCex')}
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-1 h-1 rounded-full bg-[#14F195]" />
            {t('home.feature.noSeed')}
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-1 h-1 rounded-full bg-[#9945FF]" />
            {t('home.feature.security')}
          </span>
        </div>

        <button
          onClick={login}
          disabled={!ready}
          className="group w-full py-3.5 rounded-full cifra-gradient-bg text-black font-semibold text-sm shadow-[0_0_40px_rgba(153,69,255,0.25)] hover:shadow-[0_0_50px_rgba(153,69,255,0.4)] active:scale-[0.99] transition-all disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {ready ? (
            <span className="inline-flex items-center gap-2">
              {t('home.login.enter')}
              <span className="group-hover:translate-x-0.5 transition-transform">→</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-2">
              <span className="w-3.5 h-3.5 border-2 border-black border-t-transparent rounded-full animate-spin-slow" />
              {t('home.login.loading')}
            </span>
          )}
        </button>

        <p className="text-[11px] text-neutral-600 mt-4">
          {t('home.login.note')}
        </p>
      </div>

      <footer className="absolute bottom-6 text-[10px] uppercase tracking-[0.2em] text-neutral-700">
        {t('home.footer')}
      </footer>
    </main>
  );
}
