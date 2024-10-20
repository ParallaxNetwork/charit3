"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { useAppKit } from "@reown/appkit/react"

export function WalletButton({ children }: { children: React.ReactNode }) {
  const { open } = useAppKit()
  const { data: session } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (!session) {
      router.refresh()
    }
  }, [session, router])

  return <button onClick={() => open()}>{children}</button>
}
