import { createConfig, http } from "wagmi"
import { baseSepolia } from "wagmi/chains"
import { coinbaseWallet } from "@wagmi/connectors"

// Create the wagmi configuration
export const wagmiConfig = createConfig({
  chains: [baseSepolia],
  connectors: [
    coinbaseWallet({
      appName: "Charit3",
      appLogoUrl: "/logo.svg",
    }),
  ],
  transports: {
    [baseSepolia.id]: http(),
  },
})

declare module "wagmi" {
  interface Register {
    config: typeof wagmiConfig
  }
}
