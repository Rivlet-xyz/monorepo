import { Suspense } from "react"

import { Dashboard } from "@/components/dashboard/dashboard"
import { LoadingState } from "@/components/dashboard/states"

export default function Page() {
  return (
    <main className="min-h-svh">
      <div className="container-x">
        <Suspense fallback={<LoadingState />}>
          <Dashboard />
        </Suspense>
      </div>
    </main>
  )
}
