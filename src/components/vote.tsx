"use client"

import { useEffect, useState, useMemo } from "react"
import { AnimatePresence } from "framer-motion"
import CardVote from "@/components/card-vote"
import type { TIssueWithCreator } from "@/server/models/issue"
import {
  type CarouselApi,
  Carousel,
  CarouselContent,
  CarouselItem,
} from "./ui/carousel"
import {
  cn,
  createBitmap,
  createPledgeBitmap,
  retrieveVoteNoFromLocalStorage,
  retrieveVoteYesFromLocalStorage,
  setVoteLocalStorage,
  setVoteRoundLocalStorage,
  shortAddress,
} from "@/lib/utils"
import PledgeForm from "./form/pledge"
import { FaSpinner } from "react-icons/fa6"
import { LuCircleDollarSign } from "react-icons/lu"
import { api } from "@/trpc/react"
import Avatar from "boring-avatars"
import { useAccount, useReadContract } from "wagmi"
import { CONTRACT_ABI_DONATION_MANAGER } from "@/lib/contract"
import { env } from "@/env"
import {
  simulateContract,
  waitForTransactionReceipt,
  writeContract,
} from "@wagmi/core"
import { config } from "@/lib/wagmi"
import { toast } from "sonner"
import { useBeforeUnload } from "@/hooks/useBeforeUnload"

const VoteForm = () => {
  const { fetchStatus, data, isLoading, isFetched } =
    api.issue.getAll.useQuery()
  console.log("data", data, fetchStatus)

  const [firstSwipe, setFirstSwipe] = useState(false)
  const [cards, setCards] = useState<TIssueWithCreator[]>([])
  const [rightSwipe, setRightSwipe] = useState(0) // eslint-disable-line @typescript-eslint/no-unused-vars
  const [leftSwipe, setLeftSwipe] = useState(0) // eslint-disable-line @typescript-eslint/no-unused-vars
  const [apiCarousel, setApiCarousel] = useState<CarouselApi>()
  const [selectedScrollSnap, setSelectedScrollSnap] = useState(0)

  const { address, chainId } = useAccount()
  const { data: roundId, isSuccess: roundIdIsSuccess } = useReadContract({
    abi: CONTRACT_ABI_DONATION_MANAGER,
    address: env.NEXT_PUBLIC_CONTRACT_ADDRESS as `0x${string}`,
    functionName: "roundId",
  })

  useBeforeUnload(firstSwipe)

  useEffect(() => {
    if (isFetched && data) {
      setCards(data)
      setVoteRoundLocalStorage(Number(roundId))
    }
  }, [isFetched, data])

  useEffect(() => {
    if (!apiCarousel) {
      return
    }

    apiCarousel.on("select", () => {
      // Do something on select.
      console.log("Selected", apiCarousel, apiCarousel.selectedScrollSnap())
      setSelectedScrollSnap(apiCarousel.selectedScrollSnap())
    })
  }, [apiCarousel])

  const activeIndex = useMemo(() => {
    return cards?.length - 1
  }, [cards])

  const removeCard = (issueId: string | null, action: "right" | "left") => {
    let _cards = [...cards]
    setCards((prev) => {
      const newCards = prev.filter((card, i) => card.issueId !== issueId)
      _cards = newCards
      return newCards
    })
    if (action === "right") {
      setRightSwipe((prev) => prev + 1)
      setVoteLocalStorage(issueId ?? "", 1)
    } else {
      setLeftSwipe((prev) => prev + 1)
      setVoteLocalStorage(issueId ?? "", 0)
    }
    setFirstSwipe(true)
    setSelectedScrollSnap(0)

    // last swipe
    if (_cards.length === 0) {
      console.log("last swipe", {
        no: retrieveVoteNoFromLocalStorage(),
        yes: retrieveVoteYesFromLocalStorage(),
      })

      toast.promise(doVoteYes(), {
        loading: "Send Voting...",
        success: (txReceipt) => {
          // toast.success("Voted Yes: " + txReceipt?.transactionHash)
          // return toast.promise(doVoteNo(), {
          //   loading: "Voting No...",
          //   success: (txReceipt) => {
          //     return "Voted No: " + txReceipt?.transactionHash
          //   },
          //   error: (error) => {
          //     console.error("error", error)
          //     return "Error Voting No"
          //   },
          // })

          return "Success Voting: " + txReceipt?.transactionHash
        },
        error: (error) => {
          console.error("error", error)
          return "Error Voting Yes"
        },
      })
    }
  }

  const doVoteYes = async () => {
    try {
      const voteYes = retrieveVoteYesFromLocalStorage()
      const _createPledgeBitmap = createPledgeBitmap(
        voteYes[0] as number[], // eslint-disable-line @typescript-eslint/non-nullable-type-assertion-style
        voteYes[1] as number[], // eslint-disable-line @typescript-eslint/non-nullable-type-assertion-style
      )

      const { request } = await simulateContract(config, {
        abi: CONTRACT_ABI_DONATION_MANAGER,
        address: env.NEXT_PUBLIC_CONTRACT_ADDRESS as `0x${string}`,
        functionName: "voteYes",
        args: [_createPledgeBitmap],
      })
      const hash = await writeContract(config, request)

      const transactionReceipt = await waitForTransactionReceipt(config, {
        hash,
      })

      return transactionReceipt
    } catch (error) {
      console.error("error", error)
      return
    }
  }

  const doVoteNo = async () => {
    try {
      const voteNo = retrieveVoteNoFromLocalStorage()
      const _createBitmap = createBitmap(voteNo)

      const { request } = await simulateContract(config, {
        abi: CONTRACT_ABI_DONATION_MANAGER,
        address: env.NEXT_PUBLIC_CONTRACT_ADDRESS as `0x${string}`,
        functionName: "voteNo",
        args: [_createBitmap],
      })
      const hash = await writeContract(config, request)

      const transactionReceipt = await waitForTransactionReceipt(config, {
        hash,
      })

      return transactionReceipt
    } catch (error) {
      console.error("error", error)
      return
    }
  }

  return (
    <div className="relative">
      {isLoading ? (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-[#CBCBCB]">
          <div className="flex items-center gap-1.5">
            <FaSpinner className="animate-spin text-2xl text-dark" />
            <p className="text-textGrey text-center text-base font-bold">
              Loading...
            </p>
          </div>
        </div>
      ) : null}

      <div
        className={cn("flex justify-center overflow-hidden bg-[#F4F4F4] pt-7", {
          "h-[80vh]": cards?.length,
          "h-[100vh]": !cards?.length,
        })}
      >
        <AnimatePresence>
          {cards?.length ? (
            cards?.map((card, index) => (
              <CardVote
                key={card._id.toString()}
                data={card}
                active={index === activeIndex}
                removeCard={removeCard}
              />
            ))
          ) : isLoading ? (
            <h2 className="text-textGrey absolute inset-0 z-10 flex items-center justify-center text-center text-2xl font-bold">
              ...
            </h2>
          ) : (
            <h2 className="text-textGrey absolute inset-0 z-10 flex items-center justify-center text-center text-2xl font-bold">
              You have voted all issues
            </h2>
          )}
        </AnimatePresence>
      </div>

      {cards?.length ? (
        cards?.map((card, i) =>
          activeIndex === i ? (
            <div
              key={i}
              className="relative z-40 mt-0 bg-white px-4 pb-10 pt-3"
            >
              <div className="flex justify-center">
                <svg
                  width="60"
                  height="8"
                  viewBox="0 0 60 8"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <rect width="60" height="8" rx="4" fill="#CBCBCB" />
                </svg>
              </div>
              <div className="mt-7 flex items-start justify-between gap-2">
                <div>
                  <p className="text-[26px] font-bold text-dark">{card.name}</p>
                  <div className="mt-6">
                    <div className="badge">
                      <div className="flex items-center gap-1">
                        <LuCircleDollarSign />
                        {card.category}
                      </div>
                    </div>
                  </div>
                </div>
                <PledgeForm issue={card} />
              </div>

              <div className="mt-12 p-1">
                <Carousel setApi={setApiCarousel}>
                  <CarouselContent>
                    {(card.gallery || []).map((_, i) => (
                      <CarouselItem key={i}>
                        <img src={card.gallery[i]} alt="carousel" />
                      </CarouselItem>
                    ))}
                  </CarouselContent>
                  {/* <CarouselPrevious />
              <CarouselNext /> */}
                </Carousel>
                <div className="mt-3 flex items-center justify-center gap-1.5">
                  {" "}
                  {(card.gallery || []).map((_, i) => (
                    <div
                      key={i}
                      onClick={() => apiCarousel?.scrollTo(i)}
                      className={cn(
                        "h-1.5 w-1.5 rounded-full hover:cursor-pointer",
                        {
                          "bg-dark": selectedScrollSnap === i,
                          "bg-[#CBCBCB]": selectedScrollSnap !== i,
                        },
                      )}
                    ></div>
                  ))}
                </div>
              </div>

              <div className="mt-6">
                {/* below is description in markdown format? */}
                {card.description}
              </div>

              <div className="mt-10">
                <div className="inline-block">
                  <div className="flex items-center gap-2 rounded-lg bg-shade-white px-3 py-2">
                    {/* <Image
                  src="/pfp.jpeg"
                  width={32}
                  height={32}
                  alt="pfp"
                  className="w-8 h-8 rounded-full object-cover object-center"
                /> */}
                    <Avatar
                      size={32}
                      name={card.creator.name}
                      variant="pixel"
                      colors={[
                        "#e7edea",
                        "#ffc52c",
                        "#fb0c06",
                        "#030d4f",
                        "#ceecef",
                      ]}
                      className="rounded-full border border-[#DBDBDB]"
                    />
                    <p className="text-dark">
                      {shortAddress(card.creator.name ?? "")} - Creator Issue
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ) : null,
        )
      ) : isLoading ? (
        <h2 className="text-textGrey text-center text-2xl font-bold">...</h2>
      ) : (
        <></>
      )}
    </div>
  )
}

export default VoteForm
