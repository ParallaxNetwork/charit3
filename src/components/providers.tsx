"use client"

import { SessionProvider } from "next-auth/react"
import { type State, WagmiProvider } from "wagmi"
import { TRPCReactProvider } from "@/trpc/react"
import { wagmiConfig } from "@/lib/wagmi"

export function AppProviders({ children, initialState }: { children: React.ReactNode; initialState?: State }) {
  return (
    <SessionProvider>
      <WagmiProvider
        config={wagmiConfig}
        initialState={initialState}
      >
        <TRPCReactProvider>{children}</TRPCReactProvider>
      </WagmiProvider>
    </SessionProvider>
  )
}
