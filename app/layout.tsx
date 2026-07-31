import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { Providers } from "./providers"

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" })

export const metadata: Metadata = {
  title: "AetherFi — Your Arc Wallet Kundli",
  description:
    "Connect your wallet and reveal your on-chain identity on Arc Testnet. Activity score, badges, and an AI-powered wallet personality. Free forever.",
  openGraph: {
    title: "AetherFi — Your Arc Wallet Kundli",
    description: "Reveal your on-chain identity on Arc Testnet. Free AI-powered wallet analytics.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "AetherFi — Your Arc Wallet Kundli",
    description: "Reveal your on-chain identity on Arc Testnet.",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.variable} min-h-screen bg-background text-foreground antialiased`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}