'use client';

import { PrivyProvider } from '@privy-io/react-auth';
import { createSolanaRpc, createSolanaRpcSubscriptions } from '@solana/kit';
import { LanguageProvider } from '@/lib/i18n';

const DEVNET_HTTP = process.env.NEXT_PUBLIC_SOLANA_RPC || 'https://api.devnet.solana.com';
const DEVNET_WS = DEVNET_HTTP.replace(/^http/, 'ws');

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <PrivyProvider
      appId={process.env.NEXT_PUBLIC_PRIVY_APP_ID || ''}
      clientId="client-WY6YV4jrLnAhobxBs9BQVpy19jeU7ATBznkJSGXV1WBTF"
      config={{
        loginMethods: ['email', 'google'],
        appearance: {
          theme: 'dark',
          accentColor: '#9945FF',
          logo: '/logo.png',
        },
        embeddedWallets: {
          solana: {
            createOnLogin: 'users-without-wallets',
          },
        },
        solana: {
          rpcs: {
            'solana:devnet': {
              rpc: createSolanaRpc(DEVNET_HTTP),
              rpcSubscriptions: createSolanaRpcSubscriptions(DEVNET_WS),
              blockExplorerUrl: 'https://explorer.solana.com',
            },
          },
        },
      }}
    >
      <LanguageProvider>{children}</LanguageProvider>
    </PrivyProvider>
  );
}
