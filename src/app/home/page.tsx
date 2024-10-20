import CardResult from "@/components/card/result"
import Nav from "@/components/nav"
import Avatar from "boring-avatars"
// import { LuPencil } from "react-icons/lu"
import { LuWallet } from "react-icons/lu"
import { LuDollarSign } from "react-icons/lu"
import { LuTrophy } from "react-icons/lu"
import { LuPiggyBank } from "react-icons/lu"
import { BiDonateHeart } from "react-icons/bi"
import { WalletButton } from "@/components/wallet-button"
import { getServerAuthSession } from "@/server/auth"
import { shortAddress } from "@/lib/utils"

import StakeForm from "@/components/form/stake"

export default async function HomePage() {
  // fetch staked amount
  // if staked amount is 0, show the stake form
  const session = await getServerAuthSession()

  return (
    <div className="bg-splash-dimmed container">
      <Nav />
      <div className="flex flex-col items-center px-4 py-6">
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
          <WalletButton>
            <div className="text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full border border-dark/20 bg-white">
                <LuWallet className="text-3xl text-dark" />
              </div>
              <p className="mt-2 text-sm text-dark">Wallet</p>
            </div>
          </WalletButton>
          <div className="text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full border border-dark/20 bg-white">
              <LuDollarSign className="text-3xl text-dark" />
            </div>
            <p className="mt-2 text-sm text-dark">Stake</p>
          </div>
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
        <div className="mt-6 w-full">
          <p className="text-base font-medium text-dark">Last Round’s Result</p>

          <div className="relative overflow-hidden">
            <div className="mt-3 grid max-h-72 gap-2 overflow-y-scroll pb-6 scrollbar-none">
              {[1, 2, 3, 4, 5].map((_, i) => (
                <CardResult
                  key={i}
                  title="Title topic or headline is here"
                  amount={1220}
                  index={i}
                />
              ))}
            </div>
            {[1, 2, 3, 4, 5].length > 3 && (
              <div className="bg-blur pointer-events-none absolute -bottom-20 left-0 right-0 h-44"></div>
            )}
          </div>
        </div>

        <StakeForm />
      </div>
    </div>
  )
}
