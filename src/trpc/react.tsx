"use client"

import { useState } from "react"
import { SessionProvider } from "next-auth/react"
import SuperJSON from "superjson"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { createAppKit } from "@reown/appkit/react"
import { baseSepolia } from "@reown/appkit/networks"
import { cookieToInitialState, WagmiProvider, type Config } from "wagmi"
import { loggerLink, unstable_httpBatchStreamLink } from "@trpc/client"
import { createTRPCReact } from "@trpc/react-query"
import { type inferRouterInputs, type inferRouterOutputs } from "@trpc/server"
import { wagmiAdapter, projectId } from "@/lib/wagmi"
import { siweConfig } from "@/lib/siwe"
import { env } from "@/env"

import { type AppRouter } from "@/server/api/root"

const createQueryClient = () => new QueryClient()

let clientQueryClientSingleton: QueryClient | undefined = undefined
const getQueryClient = () => {
  if (typeof window === "undefined") {
    // Server: always make a new query client
    return createQueryClient()
  }
  // Browser: use singleton pattern to keep the same query client
  return (clientQueryClientSingleton ??= createQueryClient())
}

// Set up metadata
const metadata = {
  name: "Charit3",
  description: "Stake once, donate forever.",
  url: "http://localhost:3000", // origin must match your domain & subdomain
  icons: [`${env.NEXT_PUBLIC_APP_URL}/logo.svg`],
}

createAppKit({
  adapters: [wagmiAdapter],
  projectId,
  networks: [baseSepolia],
  defaultNetwork: baseSepolia,
  metadata: metadata,
  features: {
    analytics: true, // Optional - defaults to your Cloud configuration
  },
  siweConfig,
  themeMode: "light",
})

export const api = createTRPCReact<AppRouter>()

/**
 * Inference helper for inputs.
 *
 * @example type HelloInput = RouterInputs['example']['hello']
 */
export type RouterInputs = inferRouterInputs<AppRouter>

/**
 * Inference helper for outputs.
 *
 * @example type HelloOutput = RouterOutputs['example']['hello']
 */
export type RouterOutputs = inferRouterOutputs<AppRouter>

export function Provider({ children, cookies }: { children: React.ReactNode; cookies: string | null }) {
  const queryClient = getQueryClient()

  const [trpcClient] = useState(() =>
    api.createClient({
      links: [
        loggerLink({
          enabled: (op) =>
            process.env.NODE_ENV === "development" || (op.direction === "down" && op.result instanceof Error),
        }),
        unstable_httpBatchStreamLink({
          transformer: SuperJSON,
          url: getBaseUrl() + "/api/trpc",
          headers: () => {
            const headers = new Headers()
            headers.set("x-trpc-source", "nextjs-react")
            return headers
          },
        }),
      ],
    })
  )

  const initialState = cookieToInitialState(wagmiAdapter.wagmiConfig as Config, cookies)

  return (
    <SessionProvider>
      <WagmiProvider
        config={wagmiAdapter.wagmiConfig as Config}
        initialState={initialState}
      >
        <QueryClientProvider client={queryClient}>
          <api.Provider
            client={trpcClient}
            queryClient={queryClient}
          >
            {children}
          </api.Provider>
        </QueryClientProvider>
      </WagmiProvider>
    </SessionProvider>
  )
}

function getBaseUrl() {
  if (typeof window !== "undefined") return window.location.origin
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`
  return `http://localhost:${process.env.PORT ?? 3000}`
}
