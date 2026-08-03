import { cn } from "@/lib/utils"

/**
 * The one AetherFI lockup. "Aether" carries the primary premium text color
 * (ivory), "FI" the champagne accent already in the design system. They sit as
 * a single word with no seam: same weight, same tracking, no space between,
 * so "FI" reads as the tail of the name rather than a bolt-on. This is the only
 * place the brand's visual treatment lives, so every surface stays identical.
 *
 * `className` controls size/typeface at the call site (usually `display` +
 * a text size). The lockup itself never sets font family or size.
 */
export function Wordmark({ className }: { className?: string }) {
  return (
    <span className={cn("whitespace-nowrap", className)}>
      <span className="text-ivory">Aether</span>
      <span className="text-champagne">FI</span>
    </span>
  )
}
