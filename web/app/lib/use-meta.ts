"use client"

import { useEffect, useState } from "react"

import { getMeta } from "@/lib/api"
import type { Meta } from "@/lib/types"

/**
 * One in-flight request shared by every caller, so the header and the footnote
 * do not each fetch /meta.
 */
let cached: Promise<Meta> | null = null

function loadMeta(): Promise<Meta> {
  if (!cached) {
    cached = getMeta().catch((error: unknown) => {
      cached = null // let a later mount retry
      throw error
    })
  }
  return cached
}

export function useMeta(): { meta: Meta | null; failed: boolean } {
  const [meta, setMeta] = useState<Meta | null>(null)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    let active = true
    loadMeta()
      .then((value) => {
        if (active) setMeta(value)
      })
      .catch(() => {
        if (active) setFailed(true)
      })
    return () => {
      active = false
    }
  }, [])

  return { meta, failed }
}
