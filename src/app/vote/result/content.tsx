"use client"

import CardResult from "@/components/card/result"
import { Button } from "@/components/ui/button"
import { countDownTo, formatDollar } from "@/lib/utils"
import React, { useEffect } from "react"

const data = [
  {
    image: "/pfp.jpeg",
    title: "BTC, ETH and XRP Price Prediction",
    amount: 500,
  },
  {
    image: "/pfp.jpeg",
    title: "Global Aid Effort for Refugees Expands",
    amount: 1500,
  },
  {
    image: "/pfp.jpeg",
    title: "Endangered Wildlife Numbers Show Recovery",
    amount: 830,
  },
  {
    image: "/pfp.jpeg",
    title: "Ocean Cleanup Tech Tackles Plastic Waste",
    amount: 100,
  },
  {
    image: "/pfp.jpeg",
    title: "Nash",
    amount: 200,
  },
  {
    image: "/pfp.jpeg",
    title: "Nash",
    amount: 300,
  },
  {
    image: "/pfp.jpeg",
    title: "Nash",
    amount: 400,
  },
  {
    image: "/pfp.jpeg",
    title: "Nash",
    amount: 500,
  },
  {
    image: "/pfp.jpeg",
    title: "Nash",
    amount: 600,
  },
  {
    image: "/pfp.jpeg",
    title: "Nash",
    amount: 700,
  },
  {
    image: "/pfp.jpeg",
    title: "Nash",
    amount: 800,
  },
  {
    image: "/pfp.jpeg",
    title: "Nash",
    amount: 900,
  },
  {
    image: "/pfp.jpeg",
    title: "Nash",
    amount: 1000,
  },
  {
    image: "/pfp.jpeg",
    title: "Nash",
    amount: 1100,
  },
  {
    image: "/pfp.jpeg",
    title: "Nash",
    amount: 1200,
  },
  {
    image: "/pfp.jpeg",
    title: "Nash",
    amount: 1300,
  },
  {
    image: "/pfp.jpeg",
    title: "Nash",
    amount: 1400,
  },
  {
    image: "/pfp.jpeg",
    title: "Nash",
    amount: 1500,
  },
  {
    image: "/pfp.jpeg",
    title: "Nash",
    amount: 1600,
  },
  {
    image: "/pfp.jpeg",
    title: "Nash",
    amount: 1700,
  },
  {
    image: "/pfp.jpeg",
    title: "Nash",
    amount: 1800,
  },
]

const filters = ["Today", "This Week", "This Month"]

type Props = {}

const VoteResultContent = (props: Props) => {
  const [filter, setFilter] = React.useState("Today")

  const [countDown, setCountDown] = React.useState("")

  useEffect(() => {
    const interval = setInterval(() => {
      setCountDown(countDownTo(new Date("2024-10-21").getTime() / 1000))
    }, 1000)

    return () => clearInterval(interval)
  }, [])

  return (
    <div className="h-screen overflow-y-auto px-4 py-6 pb-52">
      <div className="absolute inset-x-0 bottom-0 z-10 border-t border-dark/10 bg-white px-4 pb-6 pt-4 text-center">
        <p className="text-sm text-dark">Next voting in</p>
        <p className="-mt-3 text-[42px] font-bold text-dark">
          {countDown || "-"}
        </p>
      </div>
      <div className="bg-blur pointer-events-none absolute bottom-10 left-0 right-0 h-44"></div>

      <div className="flex items-center gap-3">
        {filters.map((_filter, i) => (
          <Button
            key={i}
            size="sm"
            className="flex-1 rounded-full"
            variant={_filter === filter ? "default" : "ghost"}
            onClick={() => setFilter(_filter)}
          >
            {_filter}
          </Button>
        ))}
      </div>

      <div className="mt-6 flex items-center justify-between gap-2 rounded-xl border border-dark bg-lilac p-3">
        <div>
          <p className="text-xs font-medium text-black/60">
            Total earning creating issue
          </p>
          <p className="mt-1 text-[28px] font-bold text-dark">
            {formatDollar(1200)}
          </p>
        </div>
        <Button variant="claim-reward" className="!h-full">
          Claim Reward
        </Button>
      </div>

      <div className="mt-8 flex items-center justify-between">
        <p className="text-sm text-dark">Top of Donation</p>
        <p className="text-sm text-dark">Participants (120)</p>
      </div>

      <div className="mt-3 space-y-4">
        {data.map((d, i) => (
          <CardResult
            key={i}
            title={d.title}
            amount={d.amount}
            index={i}
            image={d.image}
          />
        ))}
      </div>
    </div>
  )
}

export default VoteResultContent
