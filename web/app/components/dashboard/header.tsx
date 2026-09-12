"use client"

import Image from "next/image"
import Link from "next/link"
import { useEffect, useState } from "react"

import { FixturePill } from "@/components/dashboard/pills"
import { explorerBlockUrl, getMeta, usingFixtures } from "@/lib/api"
import { blockNumber, prettySource, utcTime } from "@/lib/format"
import type { Meta } from "@/lib/types"

function MetaPill({ meta, failed }: { meta: Meta | null; failed: boolean }) {
  // A failed /meta is never hidden: a stale block number on camera is worse
  // than an obvious red pill.
  if (failed) {
    return (
      <span className="inline-flex items-center gap-2 rounded-full border border-destructive/50 bg-destructive/10 px-3 py-1 font-mono text-xs text-destructive-foreground">
        <span aria-hidden className="size-1.5 rounded-full bg-destructive" />
        data unavailable
      </span>
    )
  }
  if (!meta) {
    return (
      <span className="inline-flex items-center gap-2 rounded-full border border-border px-3 py-1 font-mono text-xs text-muted-foreground">
        <span aria-hidden className="size-1.5 rounded-full bg-muted-foreground" />
        connecting…
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-border px-3 py-1 font-mono text-xs text-muted-foreground">
      <span aria-hidden className="size-1.5 rounded-full bg-success" />
      live · block{" "}
      <a
        href={explorerBlockUrl(meta.block)}
        target="_blank"
        rel="noreferrer"
        className="text-foreground underline decoration-dotted underline-offset-4 hover:decoration-solid"
      >
        {blockNumber(meta.block)}
      </a>{" "}
      · refreshed {utcTime(meta.refreshedAt)}
    </span>
  )
}

export function Header() {
  const [meta, setMeta] = useState<Meta | null>(null)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    const controller = new AbortController()
    getMeta(controller.signal)
      .then(setMeta)
      .catch(() => {
        if (!controller.signal.aborted) setFailed(true)
      })
    return () => controller.abort()
  }, [])

  const sources = meta
    ? `sources: ${meta.sources.lending.map(prettySource).join(", ")} · ${meta.sources.dex
        .map(prettySource)
        .join(", ")} depth`
    : null

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur-sm">
      <div className="container-x flex flex-col gap-3 border-x border-border px-4 py-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2" aria-label="shoalfi home">
            <Image draggable={false} src="/logo.png" alt="" width={22} height={22} priority />
            <span className="font-semibold tracking-tight">shoalfi</span>
          </Link>
          {usingFixtures ? <FixturePill /> : null}
        </div>

        <MetaPill meta={meta} failed={failed} />

        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 font-mono text-xs text-muted-foreground">
          {sources ? <span>{sources}</span> : null}
          <Link href="/incident" className="hover:text-foreground">
            aug 2026 incidents
          </Link>
          <a href="#how-this-works" className="underline decoration-dotted underline-offset-4 hover:text-foreground">
            how this works
          </a>
        </div>
      </div>
    </header>
  )
}
