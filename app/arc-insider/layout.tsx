import type { Metadata } from "next"

// The page itself is a client component (it writes localStorage + redirects), so
// it can't export metadata. This server layout supplies it. Arc Insider is a
// quiet unlock link for the Arc team — keep it out of search indexes so it stays
// discoverable only to those who are handed the URL. Overwrites the root robots.
export const metadata: Metadata = {
  title: "Arc Insider — AetherFI",
  robots: { index: false, follow: false },
}

export default function ArcInsiderLayout({ children }: { children: React.ReactNode }) {
  return children
}
