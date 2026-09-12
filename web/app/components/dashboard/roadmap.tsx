import { NotBuiltBadge } from "@/components/dashboard/pills"

/**
 * Everything here is unbuilt and says so. Nothing in this strip may be
 * described anywhere else as existing.
 */
const ITEMS = [
  { title: "cap steward contract", detail: "clamps borrow caps to safe cap" },
  { title: "more venues", detail: "curve, balancer, aerodrome" },
  { title: "l2 markets", detail: "base, arbitrum" },
]

export function Roadmap() {
  return (
    <div className="border-x border-b border-border">
      <p className="border-b border-border px-4 py-2 font-mono text-xs tracking-[0.08em] text-muted-foreground uppercase">
        roadmap
      </p>
      <ul className="grid md:grid-cols-3">
        {ITEMS.map((item, index) => (
          <li
            key={item.title}
            className={`px-4 py-3 ${index < ITEMS.length - 1 ? "border-b border-border md:border-r md:border-b-0" : ""}`}
          >
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium tracking-tight">{item.title}</span>
              <NotBuiltBadge />
            </div>
            <p className="mt-0.5 text-xs text-muted-foreground">{item.detail}</p>
          </li>
        ))}
      </ul>
    </div>
  )
}
