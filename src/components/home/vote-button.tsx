"use client"

import { useGlobalStore } from "@/stores/global"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export function VoteButton() {
  const { setShowStakeForm } = useGlobalStore()
  const hasStaked = true // Should check from blockchain

  if (!hasStaked) {
    return (
      <Button
        className="mt-2 w-full rounded-full"
        onClick={() => setShowStakeForm(true)}
      >
        Vote Donation
      </Button>
    )
  }

  return (
    <Button className="mt-2 w-full rounded-full" asChild>
      <Link href="/vote">Vote Donation</Link>
    </Button>
  )
}
