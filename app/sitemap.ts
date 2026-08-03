import type { MetadataRoute } from "next"

// Only the landing page is a stable, indexable surface. Per-wallet routes
// (/w/[address], /compare/[a]/[b]) are unbounded and generated on demand, so
// they don't belong in a static sitemap; /arc-insider is deliberately noindex.
// File 07 (SEO/crawlability).
const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://aetherfi.vercel.app"

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: SITE,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1,
    },
  ]
}
