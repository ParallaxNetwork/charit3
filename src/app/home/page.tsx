import CardResult from "@/components/card/result"
import Nav from "@/components/nav"
import { BiDonateHeart } from "react-icons/bi"
import { getServerAuthSession } from "@/server/auth"
import { Account } from "@/components/home/account"

import StakeForm from "@/components/form/stake"
import { VoteButton } from "@/components/home/vote-button"

export default async function HomePage() {
  // fetch staked amount
  // if staked amount is 0, show the stake form
  const session = await getServerAuthSession()

  return (
    <div className="bg-splash-dimmed container">
      <Nav />
      <div className="flex flex-col items-center px-4 py-6">
        <Account session={session} />
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

        <VoteButton />

        <StakeForm />
      </div>
    </div>
  )
}
