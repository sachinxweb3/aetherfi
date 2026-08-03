import type { Metadata } from "next"
import { Inter, Fraunces } from "next/font/google"
import "./globals.css"
import { Providers } from "./providers"

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" })

// Editorial display serif — the voice of the product. Optical sizing gives the
// large headings their engraved, high-contrast character; not a SaaS default.
const display = Fraunces({
  subsets: ["latin"],
  variable: "--font-display",
  weight: "variable",
  style: ["normal", "italic"],
  axes: ["opsz"],
})

export const metadata: Metadata = {
  // Composes relative URL-based metadata (e.g. OG images) into absolute URLs so
  // social crawlers unfurl them. Env override lets previews use their own origin.
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "https://aetherfi.vercel.app"),
  title: "AetherFI — The Financial Intelligence Operating System",
  description:
    "AetherFI reads your wallet like a ledger of a life. Intelligence, insight, and one-tap transfers on Arc Testnet. Self-custodied. Never holds your keys.",
  openGraph: {
    title: "AetherFI — The Financial Intelligence Operating System",
    description: "Your wallet is a record of a life. AetherFI turns it into intelligence.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "AetherFI — The Financial Intelligence Operating System",
    description: "Your wallet is a record of a life. AetherFI turns it into intelligence.",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.variable} ${display.variable} min-h-screen bg-background text-foreground antialiased`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}