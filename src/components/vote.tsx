"use client";

import CardVote from "@/components/card-vote";
import { CardData } from "@/components/card-vote";
import { Button } from "@/components/ui/button";
import { AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import { LuCircleDollarSign } from "react-icons/lu";
import {
  Carousel,
  CarouselApi,
  CarouselContent,
  CarouselItem,
} from "./ui/carousel";
import { cn, shortAddress } from "@/lib/utils";
import Image from "next/image";
import PledgeForm from "./form/pledge";

import { api } from "@/trpc/react"


const VoteForm = () => {
  const { fetchStatus, data, isLoading } = api.issue.getAll.useQuery()
  console.log("data",data, fetchStatus)

  
  const [cards, setCards] = useState<CardData[]>(data as any);
  const [rightSwipe, setRightSwipe] = useState(0); // eslint-disable-line @typescript-eslint/no-unused-vars
  const [leftSwipe, setLeftSwipe] = useState(0); // eslint-disable-line @typescript-eslint/no-unused-vars
  const [apiCarousel, setApiCarousel] = useState<CarouselApi>();
  const [selectedScrollSnap, setSelectedScrollSnap] = useState(0);


  useEffect(() => {
    setCards(data as any)
  },[data])

  useEffect(() => {
    if (!apiCarousel) {
      return;
    }

    apiCarousel.on("select", () => {
      // Do something on select.
      console.log("Selected", apiCarousel, apiCarousel.selectedScrollSnap());
      setSelectedScrollSnap(apiCarousel.selectedScrollSnap());
    });
  }, [apiCarousel]);

  const activeIndex = cards?.length - 1;
  const removeCard = (id: string, action: "right" | "left") => {
    setCards((prev) => prev.filter((card, i) => card._id !== id));
    if (action === "right") {
      setRightSwipe((prev) => prev + 1);
    } else {
      setLeftSwipe((prev) => prev + 1);
    }
  };

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
      <div className="h-[80vh] flex justify-center pt-7 bg-[#F4F4F4] overflow-hidden">
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
            <h2 className="absolute z-10 h-full text-center text-2xl font-bold text-textGrey ">
              Loading...
            </h2>
          ): (
            <h2 className="absolute z-10 h-full text-center text-2xl font-bold text-textGrey ">
             You have voted all issues
            </h2>
          )}
        </AnimatePresence>
      </div>

      {cards?.length ? 
        cards?.map((card, i) => (
          activeIndex === i ? (
            <><div key={i} className="mt-0 z-40 relative bg-white px-4 pt-3 pb-10">
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
          <div className="mt-7 flex items-center justify-between gap-2">
            <p className="text-dark text-[26px] font-bold">
              {card.name}
            </p>
            <PledgeForm />
          </div>
  
          <div className="mt-6">
            <div className="badge">
              <div className="flex gap-1 items-center">
                <LuCircleDollarSign />
                {card.category}
              </div>
            </div>
          </div>
  
          <div className="mt-20 p-1">
            <Carousel setApi={setApiCarousel}>
              <CarouselContent>
                {(card.gallery ||[]).map((_, i) => (
                  <CarouselItem key={i}>
                    <img
                    src={card.gallery[i]}
                      alt="carousel"
                    />
                  </CarouselItem>
                ))}
              </CarouselContent>
              {/* <CarouselPrevious />
              <CarouselNext /> */}
            </Carousel>
            <div className="flex justify-center items-center gap-1.5 mt-3">
              {" "}
              {(card.gallery ||[]).map((_, i) => (
                <div
                  key={i}
                  onClick={() => apiCarousel?.scrollTo(i)}
                  className={cn("w-1.5 h-1.5 rounded-full hover:cursor-pointer", {
                    "bg-dark": selectedScrollSnap === i,
                    "bg-[#CBCBCB]": selectedScrollSnap !== i,
                  })}
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
              <div className="flex items-center gap-2 bg-shade-white rounded-lg px-3 py-2">
                <Image
                  src="/pfp.jpeg"
                  width={32}
                  height={32}
                  alt="pfp"
                  className="w-8 h-8 rounded-full object-cover object-center"
                />
                <p className="text-dark">{shortAddress(card.creator.address || "")} - Creator Issue</p>
              </div>
            </div>
          </div>
        </div></>
          ) : null
        )) : isLoading ? (
          <h2 className="text-center text-2xl font-bold text-textGrey">
            ...
          </h2>
        ) : <></>}
    </div>
  );
};

export default VoteForm;
