"use client"

import { useAppKit } from "@reown/appkit/react"

export function WalletButton({ children }: { children: React.ReactNode }) {
  const { open } = useAppKit()

  return <button onClick={() => open()}>{children}</button>
}
