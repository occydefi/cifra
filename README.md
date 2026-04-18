# Cifra

> Fiat-to-Solana onramp via PIX with optional confidential USDC

Cifra lets anyone enter Solana DeFi in under 60 seconds via PIX or credit card — no CEX account, no seed phrase, no KYC wait. Users pay in BRL and receive **USDC**, **SOL**, or **cBTC** directly in an embedded wallet.

## Features

- **60-second onboarding** — email/Google login via Privy (embedded wallet)
- **<1% fees on PIX** — vs 2% on p2p.me, 4-5% on MoonPay, 1-3% via CEX
- **Multi-asset** — USDC, SOL, cbBTC (Coinbase Wrapped BTC on Solana)
- **Optional privacy** — confidential USDC via Solana's Token-2022 Confidential Balances
- **Compliance-friendly** — optional auditor accounts for regulatory compliance (Lei 14.478/2025)

## How it works

1. User pays in BRL via PIX (P2P provider) or credit card (processor)
2. Payment is detected via EfiBank webhook / processor API
3. Solana smart contract releases USDC/SOL/cbBTC to the user's embedded wallet
4. Optional: mint confidential USDC (cUSDC) for amount privacy

## Tech Stack

- **Blockchain:** Solana
- **Smart contracts:** Anchor (Rust)
- **Tokens:** SPL Token-2022 with Confidential Transfer extension
- **Assets:** USDC, SOL, cbBTC
- **Embedded wallet:** Privy (email/Google auth)
- **Frontend:** Next.js + TypeScript
- **Backend:** Node.js + PIX webhook
- **PIX API:** EfiBank
- **RPC:** Helius
- **AI tooling:** Claude Code

## Market

Built for the **200M+ Brazilians** who use PIX daily (70% of payments) but have never touched DeFi — mainstream users, freelancers, small businesses priced out by CEX friction. The multi-asset P2P + card architecture scales to any emerging market where local rails exist but fiat-to-crypto access is broken.

## Status

Under active development — **Solana Frontier Hackathon 2026**

- Hackathon: [Colosseum Frontier](https://colosseum.com/frontier)
- Deadline: May 11, 2026
- Category: Payments & Remittance

## Team

- [@occydefi](https://github.com/occydefi) — Founder & Builder

## License

MIT
