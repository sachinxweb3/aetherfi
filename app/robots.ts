import type { MetadataRoute } from "next"

// Same origin resolution as layout.tsx's metadataBase, so robots, sitemap, and
// OG URLs all agree. File 07 (SEO/crawlability).
const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://aetherfi.vercel.app"

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // /arc-insider is a quiet unlock link for the Arc team (noindex, nofollow
      // via its layout) — keep crawlers off it. /api/og is intentionally left
      // crawlable so social scrapers can fetch share-card images.
      disallow: "/arc-insider",
    },
    sitemap: `${SITE}/sitemap.xml`,
    host: SITE,
  }
}
