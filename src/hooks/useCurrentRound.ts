"use client"

import { getAddress } from "viem"
import { useReadContract } from "wagmi"
import { CONTRACT_ABI_DONATION_MANAGER } from "@/lib/contract"

export function useCurrentRound() {
  const { data: roundId, isPending: isPendingRoundId } = useReadContract({
    abi: CONTRACT_ABI_DONATION_MANAGER,
    address: getAddress(process.env.NEXT_PUBLIC_CONTRACT_ADDRESS!),
    functionName: "roundId",
  })

  const { data, isPending } = useReadContract({
    abi: CONTRACT_ABI_DONATION_MANAGER,
    address: getAddress(process.env.NEXT_PUBLIC_CONTRACT_ADDRESS!),
    functionName: "rounds",
    args: [roundId ?? BigInt(1)],
    query: {
      enabled: !!roundId && !isPendingRoundId,
    },
  })

  const round =
    data && !isPending
      ? {
          id: roundId?.toString() ?? "",
          registrationActive:
            Number(data[0]) < new Date().getTime() / 1000 &&
            new Date().getTime() / 1000 < Number(data[1]),
          votingActive:
            Number(data[1]) < new Date().getTime() / 1000 &&
            new Date().getTime() / 1000 < Number(data[2]),
          isActive: data[3],
        }
      : null

  return { round, isPending }
}
