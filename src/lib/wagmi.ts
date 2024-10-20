import { cookieStorage, createStorage } from "@wagmi/core"
import { WagmiAdapter } from "@reown/appkit-adapter-wagmi"
import { baseSepolia } from "@reown/appkit/networks"
import { env } from "@/env"

// Get projectId from https://cloud.reown.com
export const projectId = env.NEXT_PUBLIC_WC_PROJECT_ID

if (!projectId) {
  throw new Error("Project ID is not defined")
}

export const networks = [baseSepolia]

//Set up the Wagmi Adapter (Config)
export const wagmiAdapter = new WagmiAdapter({
  storage: createStorage({
    storage: cookieStorage,
  }),
  ssr: true,
  projectId,
  networks,
})

export const config = wagmiAdapter.wagmiConfig
