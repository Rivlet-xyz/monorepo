"use client"

import { useCallback, useState } from "react"

interface TipState {
  text: string
  x: number
  y: number
}

/**
 * A single fixed-position tooltip shared by every trigger on the page.
 *
 * Fixed positioning is deliberate: the table lives in an `overflow-x-auto`
 * container, which clips both axes, so an absolutely positioned tooltip inside
 * a header cell would be cut off.
 */
export function useTooltip() {
  const [tip, setTip] = useState<TipState | null>(null)

  const show = useCallback((event: React.MouseEvent<HTMLElement> | React.FocusEvent<HTMLElement>, text: string) => {
    const rect = event.currentTarget.getBoundingClientRect()
    setTip({ text, x: rect.left + rect.width / 2, y: rect.bottom + 8 })
  }, [])

  const hide = useCallback(() => setTip(null), [])

  const triggerProps = useCallback(
    (text: string) => ({
      onMouseEnter: (event: React.MouseEvent<HTMLElement>) => show(event, text),
      onMouseLeave: hide,
      onFocus: (event: React.FocusEvent<HTMLElement>) => show(event, text),
      onBlur: hide,
    }),
    [show, hide],
  )

  const tooltip = tip ? (
    <div
      role="tooltip"
      style={{ left: tip.x, top: tip.y }}
      className="pointer-events-none fixed z-50 max-w-xs -translate-x-1/2 border border-border bg-popover px-3 py-2 text-xs leading-relaxed text-popover-foreground shadow-lg"
    >
      {tip.text}
    </div>
  ) : null

  return { triggerProps, tooltip }
}
