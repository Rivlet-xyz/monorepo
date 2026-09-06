import Image from "next/image"

import { docsUrl, githubUrl } from "@/lib/site"

export function Footer() {
  return (
    <footer>
      <div className="container-x flex flex-col gap-6 border-x border-border px-4 py-8 text-sm md:flex-row md:items-center md:justify-between md:px-10">
        <div className="flex items-center gap-2">
          <Image draggable={false} src="/rivlet-mark.png" alt="" width={20} height={20} className="invert" />
          <span className="font-medium">Rivlet</span>
          <span className="text-muted-foreground">Back a bot. Share its earnings.</span>
        </div>
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-muted-foreground">
          <a href={githubUrl} target="_blank" rel="noreferrer" className="hover:text-foreground">
            GitHub
          </a>
          <a href={docsUrl} target="_blank" rel="noreferrer" className="hover:text-foreground">
            Documentation
          </a>
          {/* <span>Built with Hedera · x402 · World · The Graph</span> */}
        </div>
      </div>
      <div className="border-t border-border">
        <div className="container-x flex flex-col gap-1 border-x border-border px-4 py-4 font-mono text-xs text-muted-foreground md:flex-row md:justify-between md:px-10">
          <span>© {new Date().getFullYear()} Rivlet</span>
          {/* <span>Testnet preview. Uses test tokens.</span> */}
        </div>
      </div>
    </footer>
  )
}
