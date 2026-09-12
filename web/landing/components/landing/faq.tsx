"use client"

import { Plus } from "lucide-react"
import { AnimatePresence, motion } from "motion/react"
import { useState } from "react"

import { cn } from "@/lib/utils"

export type FaqItem = { question: string; answer: string }

export function Faq({ items }: { items: FaqItem[] }) {
  const [open, setOpen] = useState<number | null>(0)

  return (
    <div>
      {items.map((item, index) => {
        const isOpen = open === index
        return (
          <div key={item.question} className="border-b border-border last:border-b-0">
            <button
              type="button"
              aria-expanded={isOpen}
              aria-controls={`faq-panel-${index}`}
              onClick={() => setOpen(isOpen ? null : index)}
              className="flex w-full items-center justify-between gap-6 px-4 py-5 text-left md:px-10"
            >
              <span className="text-base font-medium md:text-lg">{item.question}</span>
              <Plus className={cn("size-4 shrink-0 text-muted-foreground transition-transform duration-300", isOpen && "rotate-45")} />
            </button>
            <AnimatePresence initial={false}>
              {isOpen ? (
                <motion.div
                  id={`faq-panel-${index}`}
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                  className="overflow-hidden"
                >
                  <p className="max-w-2xl px-4 pb-6 leading-relaxed text-muted-foreground md:px-10">{item.answer}</p>
                </motion.div>
              ) : null}
            </AnimatePresence>
          </div>
        )
      })}
    </div>
  )
}
