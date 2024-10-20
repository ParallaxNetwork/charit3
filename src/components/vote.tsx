"use client"

import CardVote from "@/components/card-vote"
import { CardData } from "@/components/card-vote"
import { AnimatePresence } from "framer-motion"
import { useEffect, useState } from "react"
import { LuCircleDollarSign } from "react-icons/lu"
import {
  Carousel,
  CarouselApi,
  CarouselContent,
  CarouselItem,
} from "./ui/carousel"
import { cn, shortAddress } from "@/lib/utils"
import PledgeForm from "./form/pledge"

import { api } from "@/trpc/react"
import Avatar from "boring-avatars"
import { FaSpinner } from "react-icons/fa6"

const VoteForm = () => {
  const { fetchStatus, data, isLoading, isSuccess } =
    api.issue.getAll.useQuery()
  console.log("data", data, fetchStatus)

  const [cards, setCards] = useState<CardData[]>(data as any)
  const [rightSwipe, setRightSwipe] = useState(0) // eslint-disable-line @typescript-eslint/no-unused-vars
  const [leftSwipe, setLeftSwipe] = useState(0) // eslint-disable-line @typescript-eslint/no-unused-vars
  const [apiCarousel, setApiCarousel] = useState<CarouselApi>()
  const [selectedScrollSnap, setSelectedScrollSnap] = useState(0)

  useEffect(() => {
    if (!isSuccess) {
      return
    }
    setCards(data as any)
  }, [isSuccess])

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

  const activeIndex = cards?.length - 1
  const removeCard = (id: string, action: "right" | "left") => {
    setCards((prev) => prev.filter((card, i) => card._id !== id))
    if (action === "right") {
      setRightSwipe((prev) => prev + 1)
    } else {
      setLeftSwipe((prev) => prev + 1)
    }
    setSelectedScrollSnap(0)
  }

  // const stats = [
  //   {
  //     name: "Left",
  //     count: leftSwipe,
  //   },
  //   {
  //     name: "Right",
  //     count: rightSwipe,
  //   },
  // ];

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
            cards?.map((card, i) => (
              <CardVote
                key={i}
                data={card}
                active={i === activeIndex}
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
            <>
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
                    <p className="text-[26px] font-bold text-dark">
                      {card.name}
                    </p>
                    <div className="mt-6">
                      <div className="badge">
                        <div className="flex items-center gap-1">
                          <LuCircleDollarSign />
                          {card.category}
                        </div>
                      </div>
                    </div>
                  </div>
                  <PledgeForm />
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
                        {shortAddress(card.creator.name || "")} - Creator Issue
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </>
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
