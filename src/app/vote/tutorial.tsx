"use client"

import { Button } from "@/components/ui/button"
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerFooter,
} from "@/components/ui/drawer"

import { cn } from "@/lib/utils"
import { useEffect, useState } from "react"

const tutorials = [
  {
    title: "Give your vote issue",
    content:
      "Berikan pendapatmu terhadap sebuah isu dengan cara Swipe kanan untuk “Yes” dan Swipe kiri untuk “No”",
    image: "/tutorial-1.svg",
  },
  {
    title: "Send Donation",
    content:
      "Kamu bisa mengirimkan donasi kepada author secara langsung untuk apresiasi",
    image: "/tutorial-2.svg",
  },
  {
    title: "See Final Result",
    content:
      "Pada akhir vote kamu bisa melihat hasil akhir dari “Top of Donation” dan kamu dapat kembali vote setelah periode time selesai",
    image: "/tutorial-2.svg",
  },
]

const VoteTutorial = () => {
  const [active, setActive] = useState(0)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    console.log(localStorage.getItem("tutorial"))
    if (!localStorage.getItem("tutorial")) {
      setOpen(true)
    }
  }, [])

  return (
    <>
      <Drawer open={open} onOpenChange={setOpen}>
        <DrawerContent mark={false} className="container px-10 pb-4">
          <div className="px- mt-14 rounded-2xl pb-0">
            <div className="flex items-center gap-3">
              {tutorials.map((tutorial, i) => (
                <div
                  key={i}
                  className={cn("h-1.5 flex-1 rounded-full", {
                    "bg-[#CBCBCB]": active !== i,
                    "bg-blue": active === i,
                  })}
                  onClick={() => setActive(i)}
                ></div>
              ))}
            </div>

            {tutorials.map((tutorial, i) => (
              <div
                key={i}
                className={cn({
                  hidden: active !== i,
                })}
              >
                <div className="mt-5">
                  <img src={tutorial.image} />
                </div>
                <p className="mt-10 text-center text-2xl font-bold text-dark">
                  {tutorial.title}
                </p>
                <p className="mt-2.5 text-center text-base text-dark">
                  {tutorial.content}
                </p>
              </div>
            ))}

            <DrawerFooter>
              <Button
                onClick={() => {
                  if (active === tutorials.length - 1) {
                    setOpen(false)
                    localStorage.setItem("tutorial", "true")
                  }
                  setActive((prev) => prev + 1)
                }}
              >
                Continue
              </Button>
              <DrawerClose asChild>
                <Button
                  variant="ghost"
                  onClick={() => {
                    setOpen(false)
                    localStorage.setItem("tutorial", "true")
                  }}
                >
                  Close
                </Button>
              </DrawerClose>
            </DrawerFooter>
          </div>
        </DrawerContent>
      </Drawer>
    </>
  )
}

export default VoteTutorial
