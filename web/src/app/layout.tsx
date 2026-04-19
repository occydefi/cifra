import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const SITE_URL = "https://web-virid-zeta.vercel.app";
const DESC_EN =
  "Buy SOL and USDC in 60 seconds by paying with PIX. No exchange account, no seed phrase, no KYC wait.";
const DESC_PT =
  "Compre SOL e USDC em 60 segundos pagando com PIX. Sem corretora, sem seed phrase, sem espera de KYC.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Cifra — Solana in 60 seconds, paid with PIX",
    template: "%s · Cifra",
  },
  description: DESC_EN,
  keywords: [
    "Solana",
    "PIX",
    "onramp",
    "Brazil",
    "USDC",
    "SOL",
    "crypto",
    "DeFi",
    "Privy",
    "embedded wallet",
  ],
  authors: [{ name: "Cifra" }],
  creator: "Cifra",
  icons: {
    icon: "/logo-mark.svg",
  },
  openGraph: {
    type: "website",
    url: SITE_URL,
    title: "Cifra — Solana in 60 seconds, paid with PIX",
    description: DESC_EN,
    siteName: "Cifra",
    locale: "en_US",
    alternateLocale: ["pt_BR"],
    images: [{ url: "/logo.png", width: 1200, height: 630, alt: "Cifra" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Cifra — Solana in 60 seconds, paid with PIX",
    description: DESC_EN,
    images: ["/logo.png"],
  },
  alternates: {
    canonical: SITE_URL,
    languages: {
      "en-US": SITE_URL,
      "pt-BR": SITE_URL,
    },
  },
  other: {
    "description:pt-BR": DESC_PT,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-[#0a0a0f] text-white">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
