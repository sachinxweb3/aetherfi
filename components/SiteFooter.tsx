import Link from "next/link"

// Footer with the maker's identity on one side and official Arc links on the
// other. Kept plain and hand-written so it reads like a person built it.
export function SiteFooter() {
  return (
    <footer className="relative z-10 border-t border-hairline px-6 py-10 sm:px-12">
      <div className="mx-auto flex max-w-6xl flex-col gap-8 sm:flex-row sm:items-start sm:justify-between">
        {/* Maker */}
        <div className="space-y-2.5">
          <div className="text-sm font-medium text-foreground">
            Crafted by <span className="text-champagne">Sachin</span>
          </div>
          <div className="flex flex-wrap gap-x-5 gap-y-1 text-sm text-silver-dim">
            <a
              href="https://x.com/sachinxweb3"
              target="_blank"
              rel="noopener noreferrer"
              className="transition hover:text-foreground"
            >
              @sachinxweb3
            </a>
            <a
              href="https://linktr.ee/sachinxweb3"
              target="_blank"
              rel="noopener noreferrer"
              className="transition hover:text-foreground"
            >
              Linktree
            </a>
            <a
              href="https://github.com/sachinxweb3"
              target="_blank"
              rel="noopener noreferrer"
              className="transition hover:text-foreground"
            >
              GitHub
            </a>
          </div>
        </div>

        {/* Arc official */}
        <div className="space-y-2.5 sm:text-right">
          <div className="text-sm font-medium text-silver">Built on Arc</div>
          <div className="flex flex-wrap gap-x-5 gap-y-1 text-sm text-silver-dim sm:justify-end">
            <a href="https://arc.io" target="_blank" rel="noopener noreferrer" className="transition hover:text-foreground">
              Website
            </a>
            <a href="https://docs.arc.io" target="_blank" rel="noopener noreferrer" className="transition hover:text-foreground">
              Docs
            </a>
            <a
              href="https://testnet.arcscan.app"
              target="_blank"
              rel="noopener noreferrer"
              className="transition hover:text-foreground"
            >
              Explorer
            </a>
            <a
              href="https://faucet.circle.com"
              target="_blank"
              rel="noopener noreferrer"
              className="transition hover:text-foreground"
            >
              Faucet
            </a>
          </div>
        </div>
      </div>

      <div className="mx-auto mt-8 max-w-6xl border-t border-hairline pt-5 text-center text-xs text-silver-dim">
        Free forever. No sign-up, no keys. AetherFI reads — it never signs.
      </div>
    </footer>
  )
}
