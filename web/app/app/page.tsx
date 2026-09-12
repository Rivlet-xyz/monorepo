import { Suspense } from "react"

import { Dashboard } from "@/components/dashboard/dashboard"
import { Header } from "@/components/dashboard/header"
import { LoadingState } from "@/components/dashboard/states"

export default function Page() {
  return (
    <>
      <Header />
      <main className="min-h-svh">
        <div className="container-x">
          <Suspense fallback={<LoadingState />}>
            <Dashboard />
          </Suspense>
        </div>
      </main>
    </>
  )
}
