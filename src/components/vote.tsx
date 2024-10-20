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
import { cn } from "@/lib/utils";
import Image from "next/image";
import PledgeForm from "./form/pledge";

export const cardData: CardData[] = [
  {
    id: 0,
    name: "Nash",
    age: 20,
    src: "/pfp.jpeg",
    bio: "Jack of all, Master of some",
    genre: ["Metalcore", "Pop", "Rap"],
    tracks: [
      {
        name: "Blood & Water",
        artist: "Memphis May Fire",
        img: "https://i.scdn.co/image/ab67616d0000b27336daf308de541e4019a82139",
      },
      {
        name: "Fighting Gravity",
        artist: "Of Mice & Men",
        img: "https://i.scdn.co/image/ab67616d0000b2738eaa8ea5ed8b61cfeeda605f",
      },
      {
        name: "Tears Don't Fall",
        artist: "Bullet For my Valentine",
        img: "https://i.scdn.co/image/ab67616d0000b27354113df5ab7a69df8a44c37e",
      },
      {
        name: "FEEL NOTHING",
        artist: "The Plot in You",
        img: "https://i.scdn.co/image/ab67616d0000b273197f778e9f68a8ab1d7da3f8",
      },
    ],
  },
  {
    id: 1,
    name: "Nash",
    age: 20,
    src: "/pfp.jpeg",
    bio: "Jack of all, Master of some",
    genre: ["Metalcore", "Pop", "Rap"],
    tracks: [
      {
        name: "Blood & Water",
        artist: "Memphis May Fire",
        img: "https://i.scdn.co/image/ab67616d0000b27336daf308de541e4019a82139",
      },
      {
        name: "Fighting Gravity",
        artist: "Of Mice & Men",
        img: "https://i.scdn.co/image/ab67616d0000b2738eaa8ea5ed8b61cfeeda605f",
      },
      {
        name: "Tears Don't Fall",
        artist: "Bullet For my Valentine",
        img: "https://i.scdn.co/image/ab67616d0000b27354113df5ab7a69df8a44c37e",
      },
      {
        name: "FEEL NOTHING",
        artist: "The Plot in You",
        img: "https://i.scdn.co/image/ab67616d0000b273197f778e9f68a8ab1d7da3f8",
      },
    ],
  },
  {
    id: 2,
    name: "Nash",
    age: 20,
    src: "/pfp.jpeg",
    bio: "Jack of all, Master of some",
    genre: ["Metalcore", "Pop", "Rap"],
    tracks: [
      {
        name: "Blood & Water",
        artist: "Memphis May Fire",
        img: "https://i.scdn.co/image/ab67616d0000b27336daf308de541e4019a82139",
      },
      {
        name: "Fighting Gravity",
        artist: "Of Mice & Men",
        img: "https://i.scdn.co/image/ab67616d0000b2738eaa8ea5ed8b61cfeeda605f",
      },
      {
        name: "Tears Don't Fall",
        artist: "Bullet For my Valentine",
        img: "https://i.scdn.co/image/ab67616d0000b27354113df5ab7a69df8a44c37e",
      },
      {
        name: "FEEL NOTHING",
        artist: "The Plot in You",
        img: "https://i.scdn.co/image/ab67616d0000b273197f778e9f68a8ab1d7da3f8",
      },
    ],
  },
  {
    id: 3,
    name: "Nash",
    age: 20,
    src: "/pfp.jpeg",
    bio: "Jack of all, Master of some",
    genre: ["Metalcore", "Pop", "Rap"],
    tracks: [
      {
        name: "Blood & Water",
        artist: "Memphis May Fire",
        img: "https://i.scdn.co/image/ab67616d0000b27336daf308de541e4019a82139",
      },
      {
        name: "Fighting Gravity",
        artist: "Of Mice & Men",
        img: "https://i.scdn.co/image/ab67616d0000b2738eaa8ea5ed8b61cfeeda605f",
      },
      {
        name: "Tears Don't Fall",
        artist: "Bullet For my Valentine",
        img: "https://i.scdn.co/image/ab67616d0000b27354113df5ab7a69df8a44c37e",
      },
      {
        name: "FEEL NOTHING",
        artist: "The Plot in You",
        img: "https://i.scdn.co/image/ab67616d0000b273197f778e9f68a8ab1d7da3f8",
      },
    ],
  },
  {
    id: 4,
    name: "Nash",
    age: 20,
    src: "/pfp.jpeg",
    bio: "Jack of all, Master of some",
    genre: ["Metalcore", "Pop", "Rap"],
    tracks: [
      {
        name: "Blood & Water",
        artist: "Memphis May Fire",
        img: "https://i.scdn.co/image/ab67616d0000b27336daf308de541e4019a82139",
      },
      {
        name: "Fighting Gravity",
        artist: "Of Mice & Men",
        img: "https://i.scdn.co/image/ab67616d0000b2738eaa8ea5ed8b61cfeeda605f",
      },
      {
        name: "Tears Don't Fall",
        artist: "Bullet For my Valentine",
        img: "https://i.scdn.co/image/ab67616d0000b27354113df5ab7a69df8a44c37e",
      },
      {
        name: "FEEL NOTHING",
        artist: "The Plot in You",
        img: "https://i.scdn.co/image/ab67616d0000b273197f778e9f68a8ab1d7da3f8",
      },
    ],
  },
  {
    id: 5,
    name: "Nash",
    age: 20,
    src: "/pfp.jpeg",
    bio: "Jack of all, Master of some",
    genre: ["Metalcore", "Pop", "Rap"],
    tracks: [
      {
        name: "Blood & Water",
        artist: "Memphis May Fire",
        img: "https://i.scdn.co/image/ab67616d0000b27336daf308de541e4019a82139",
      },
      {
        name: "Fighting Gravity",
        artist: "Of Mice & Men",
        img: "https://i.scdn.co/image/ab67616d0000b2738eaa8ea5ed8b61cfeeda605f",
      },
      {
        name: "Tears Don't Fall",
        artist: "Bullet For my Valentine",
        img: "https://i.scdn.co/image/ab67616d0000b27354113df5ab7a69df8a44c37e",
      },
      {
        name: "FEEL NOTHING",
        artist: "The Plot in You",
        img: "https://i.scdn.co/image/ab67616d0000b273197f778e9f68a8ab1d7da3f8",
      },
    ],
  },
  {
    id: 6,
    name: "Nash",
    age: 20,
    src: "/pfp.jpeg",
    bio: "Jack of all, Master of some",
    genre: ["Metalcore", "Pop", "Rap"],
    tracks: [
      {
        name: "Blood & Water",
        artist: "Memphis May Fire",
        img: "https://i.scdn.co/image/ab67616d0000b27336daf308de541e4019a82139",
      },
      {
        name: "Fighting Gravity",
        artist: "Of Mice & Men",
        img: "https://i.scdn.co/image/ab67616d0000b2738eaa8ea5ed8b61cfeeda605f",
      },
      {
        name: "Tears Don't Fall",
        artist: "Bullet For my Valentine",
        img: "https://i.scdn.co/image/ab67616d0000b27354113df5ab7a69df8a44c37e",
      },
      {
        name: "FEEL NOTHING",
        artist: "The Plot in You",
        img: "https://i.scdn.co/image/ab67616d0000b273197f778e9f68a8ab1d7da3f8",
      },
    ],
  },
];

const VoteForm = () => {
  const [cards, setCards] = useState<CardData[]>(cardData);
  const [rightSwipe, setRightSwipe] = useState(0); // eslint-disable-line @typescript-eslint/no-unused-vars
  const [leftSwipe, setLeftSwipe] = useState(0); // eslint-disable-line @typescript-eslint/no-unused-vars
  const [api, setApi] = useState<CarouselApi>();
  const [selectedScrollSnap, setSelectedScrollSnap] = useState(0);

  useEffect(() => {
    if (!api) {
      return;
    }

    api.on("select", () => {
      // Do something on select.
      console.log("Selected", api, api.selectedScrollSnap());
      setSelectedScrollSnap(api.selectedScrollSnap());
    });
  }, [api]);

  const activeIndex = cards.length - 1;
  const removeCard = (id: number, action: "right" | "left") => {
    setCards((prev) => prev.filter((card) => card.id !== id));
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
          {cards.length ? (
            cards.map((card) => (
              <CardVote
                key={card.id}
                data={card}
                active={card.id === activeIndex}
                removeCard={removeCard}
              />
            ))
          ) : (
            <h2 className="absolute z-10 text-center text-2xl font-bold text-textGrey ">
              Excessive swiping can be injurious to health!
              <br />
              <Button>Go to voting result</Button>
            </h2>
          )}
        </AnimatePresence>
      </div>

      <div className="mt-0 z-40 relative bg-white px-4 pt-3 pb-10">
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
            BTC, ETH and XRP Price Prediction. Test long paragraph
          </p>
          <PledgeForm />
        </div>

        <div className="mt-6">
          <div className="badge">
            <div className="flex gap-1 items-center">
              <LuCircleDollarSign />
              poverty & hunger
            </div>
          </div>
        </div>

        <div className="mt-20 p-1">
          <Carousel setApi={setApi}>
            <CarouselContent>
              {Array.from({ length: 5 }).map((_, i) => (
                <CarouselItem key={i}>
                  <img
                    src="https://s3-alpha-sig.figma.com/img/dbed/fad1/ad943f3af9bb0d0b147b17f107d025f8?Expires=1729468800&Key-Pair-Id=APKAQ4GOSFWCVNEHN3O4&Signature=FOgwJlhVktE8Lw4bgx2SxxPUYiBIjkrs-oOlyjQ4RfQBBPCC-LKD-jHpJTDliDWZRTHphRW4QJ-SV7u8KAz6~QzSgsPcf7oxOmq-mQl0UOGTatXL~PFoEaBuCw9LCezcLCI-3M8-kXcDz-DpkJ0Y~IjcYmHXfOVMl8M9f41bM1HyRbHgqOCt6V4o6ksiBYj3iF~xf7~rPKB9rvFJA4VHhfYDBeIl1g7OW9i2~KHRT0ZLlnT9dx8hYdKwSWtJiqqk6K~HqCrw4lPuk~DfpeydjSbxbmFwNRjzvGNg1uVrlFSMbQKqy2nHrGPRC7fIDDCXd1GRjAlrekkIlJ51It27qg__"
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
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                onClick={() => api?.scrollTo(i)}
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
          <p>
            <b>BTC/USD</b>
          </p>
          <p>
            The price of Bitcoin (BTC) has fallen by 2.77% over the last 24 hour
          </p>
          <p>
            {`On the daily chart, the rate of BTC is falling after a failed
            attempt to fix above the $66,000 zone. If today's bar closes near
            its low, there is a chance to see a test of the $60,000-$62,000
            range by the end of the week. Bitcoin is trading at $63,966 at press
            time.`}
          </p>
          <p>
            <b>BTC/USD</b>
          </p>
          <p>
            The price of Bitcoin (BTC) has fallen by 2.77% over the last 24 hour
          </p>
          <p>
            {`On the daily chart, the rate of BTC is falling after a failed
            attempt to fix above the $66,000 zone. If today's bar closes near
            its low, there is a chance to see a test of the $60,000-$62,000
            range by the end of the week. Bitcoin is trading at $63,966 at press
            time.`}
          </p>
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
              <p className="text-dark">{`Aldiarifk`} - Creator Issue</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VoteForm;
