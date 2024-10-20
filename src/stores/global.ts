import { z } from "zod"
import { create } from "zustand"

export const globalStoreSchema = z.object({
  showStakeForm: z.boolean(),
  setShowStakeForm: z.function().args(z.boolean()).returns(z.void()),
})

export const useGlobalStore = create<z.infer<typeof globalStoreSchema>>(
  (set) => ({
    showStakeForm: false,
    setShowStakeForm: (showStakeForm) => set({ showStakeForm }),
  }),
)
