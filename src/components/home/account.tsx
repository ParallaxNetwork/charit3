"use client"

import { useEffect } from "react"
import { useGlobalStore } from "@/stores/global"
import type { Session } from "next-auth"
import { shortAddress } from "@/lib/utils"

import Avatar from "boring-avatars"
import { LuWallet, LuDollarSign, LuTrophy, LuPiggyBank } from "react-icons/lu"
import { BiDonateHeart } from "react-icons/bi"
import { WalletButton } from "@/components/wallet-button"

export function Account({ session }: { session: Session | null }) {
  const { showStakeForm, setShowStakeForm } = useGlobalStore()

  useEffect(() => {
    console.log("showStakeForm", showStakeForm)
  }, [showStakeForm])

  return (
    <>
      <Avatar
        size={72}
        name={session?.user.name}
        variant="pixel"
        colors={["#e7edea", "#ffc52c", "#fb0c06", "#030d4f", "#ceecef"]}
        className="rounded-full border border-[#DBDBDB]"
      />
      <div className="mt-2 flex items-center gap-2">
        <p className="mt-2 font-bold text-dark">
          {shortAddress(session?.user.address!)}
        </p>
        {/* <LuPencil className="mt-2 text-dark/40" /> */}
      </div>
      <div className="mt-5 flex items-center gap-9">
        <WalletButton className="text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full border border-dark/20 bg-white">
            <LuWallet className="text-3xl text-dark" />
          </div>
          <p className="mt-2 text-sm text-dark">Wallet</p>
        </WalletButton>
        <button className="text-center" onClick={() => setShowStakeForm(true)}>
          <div className="flex h-16 w-16 items-center justify-center rounded-full border border-dark/20 bg-white">
            <LuDollarSign className="text-3xl text-dark" />
          </div>
          <p className="mt-2 text-sm text-dark">Stake</p>
        </button>
        <div className="text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full border border-dark/20 bg-white">
            <LuTrophy className="text-3xl text-dark" />
          </div>
          <p className="mt-2 text-sm text-dark">Rank</p>
        </div>
      </div>
      <div className="mt-6 grid w-full grid-cols-2 gap-3">
        <div className="flex flex-col items-center gap-4 rounded-2xl border border-dark/20 bg-white p-6 text-center">
          <LuPiggyBank className="text-xl" />
          <p className="text-xl font-bold text-dark">$0.00</p>
          <div className="badge">Stake Amount</div>
        </div>
        <div className="flex flex-col items-center gap-4 rounded-2xl border border-dark/20 bg-white p-6 text-center">
          <BiDonateHeart className="text-xl" />
          <p className="text-xl font-bold text-dark">$450.00</p>
          <div className="badge">Donation Amount</div>
        </div>
      </div>
    </>
  )
}
