"use client"

import { useCurrentRound } from "@/hooks/useCurrentRound"

import Link from "next/link"
import Image from "next/image"
import { Button } from "./ui/button"
import { usePathname, useRouter } from "next/navigation"

const Nav = () => {
  const router = useRouter()
  const currentPath = usePathname()

  const { round, isPending } = useCurrentRound()

  return (
    <>
      <div className="flex items-center justify-between gap-3 border-b border-dark/5 px-[18px] py-5 backdrop-blur-[50px]">
        <Link href="/home">
          <Image
            className="w-36"
            src="/logo-1.svg"
            alt="logo"
            width={184}
            height={52}
            priority
          />
        </Link>

        {!isPending && round?.registrationActive && (
          <Button
            size="sm"
            onClick={() => {
              const query = new URLSearchParams()
              query.set("from", currentPath)
              router.push("/create-issue" + "?" + query.toString())
            }}
          >
            Create Issue
          </Button>
        )}
      </div>
    </>
  )
}

export default Nav
