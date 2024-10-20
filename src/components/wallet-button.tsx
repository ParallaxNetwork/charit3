"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { useAppKit } from "@reown/appkit/react"

export function WalletButton({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  const { open } = useAppKit()
  const { data: session } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (!session) {
      router.push("/")
    }
  }, [session, router])

  return (
    <button onClick={() => open()} className={className}>
      {children}
    </button>
  )
}
