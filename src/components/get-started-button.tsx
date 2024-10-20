"use client"

import { useRouter } from "next/navigation"
import { useAccount } from "wagmi"
import { useAppKit } from "@reown/appkit/react"

import { Button } from "@/components/ui/button"
import { FaArrowRight } from "react-icons/fa6"

export function GetStartedButton() {
  const router = useRouter()
  const { isConnected } = useAccount()
  const { open } = useAppKit()

  function handleClick() {
    if (isConnected) {
      router.push("/verify")
      return
    }

    open()
  }

  return (
    <Button
      variant="default"
      size="lg"
      className="mt-12 rounded-full"
      onClick={handleClick}
    >
      Get Started
      <FaArrowRight className="ml-2" />
    </Button>
  )
}
