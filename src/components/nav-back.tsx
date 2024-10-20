"use client"

import React, { Suspense } from "react"
import { Button } from "./ui/button"
import { LuMoveLeft } from "react-icons/lu"
import { useRouter, useSearchParams } from "next/navigation"

type Props = { title: string }

const NavBackContent = ({ title }: Props) => {
  const router = useRouter()
  const searchParams = useSearchParams()
  return (
    <div className="relative border-b border-dark/20 px-4 py-6">
      <Button
        variant="ghost"
        size="icon"
        onClick={() => {
          router.push(searchParams.get("from") ?? "/home")
        }}
        className="absolute"
      >
        <LuMoveLeft className="text-2xl" />
      </Button>
      <p className="text-center text-2xl font-bold text-dark">{title}</p>
    </div>
  )
}

const NavBack = ({ title }: Props) => {
  return (
    <Suspense>
      <NavBackContent title={title} />
    </Suspense>
  )
}

export default NavBack
