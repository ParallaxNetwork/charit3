"use client"

import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Drawer, DrawerContent, DrawerTrigger } from "@/components/ui/drawer"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { LuDollarSign } from "react-icons/lu"
import { setVoteLocalStorage } from "@/lib/utils"
import { toast } from "sonner"
import { useState } from "react"

const formSchema = z.object({
  amount: z.string(),
})

const PledgeForm = ({
  issue,
  removeCard,
}: {
  issue: any
  removeCard: (
    issueId: string | null,
    action: "right" | "left",
    pledgeAmount?: number,
  ) => void
}) => {
  const [open, setOpen] = useState(false)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      amount: "",
    },
  })

  function onSubmit(values: z.infer<typeof formSchema>) {
    removeCard(issue.issueId, "right", Number(values.amount))
    toast.success("Donation sent successfully")
    setOpen(false)
  }
  return (
    <>
      <Drawer open={open} onOpenChange={setOpen}>
        <DrawerTrigger asChild>
          <button className="btn-pledge shrink-0 transition-transform hover:scale-105 active:scale-100">
            <svg
              width="58"
              height="58"
              viewBox="0 0 58 58"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M29 52.5772C42.0213 52.5772 52.5772 42.0214 52.5772 29C52.5772 15.9787 42.0213 5.42278 29 5.42278C15.9786 5.42278 5.42273 15.9787 5.42273 29C5.42273 42.0214 15.9786 52.5772 29 52.5772Z"
                fill="white"
                stroke="white"
                strokeWidth="1.95122"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M38.4309 19.5691H24.2845C23.0339 19.5691 21.8345 20.0659 20.9502 20.9502C20.0659 21.8346 19.5691 23.034 19.5691 24.2846C19.5691 25.5352 20.0659 26.7346 20.9502 27.6189C21.8345 28.5032 23.0339 29 24.2845 29H33.7154C34.9661 29 36.1654 29.4968 37.0498 30.3811C37.9341 31.2655 38.4309 32.4649 38.4309 33.7155C38.4309 34.9661 37.9341 36.1655 37.0498 37.0498C36.1654 37.9341 34.9661 38.4309 33.7154 38.4309H19.5691"
                stroke="#3DB8F5"
                strokeWidth="1.95122"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M29 43.1464V14.8537"
                stroke="#3DB8F5"
                strokeWidth="1.95122"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </DrawerTrigger>
        <DrawerContent className="container px-4 pb-6">
          <div className="relative mt-14 rounded-2xl border border-dark/20 p-6">
            <p className="text-center text-2xl font-bold text-dark blur-none">
              Send Donation
            </p>
            <p className="mt-2 text-center text-sm text-dark blur-none">
              The following conditions must be met to proceed.
            </p>
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y- mt-8 blur-none"
              >
                <FormField
                  control={form.control}
                  name="amount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-semibold text-dark">
                        Amount
                      </FormLabel>
                      <FormControl>
                        <div className="relative">
                          <LuDollarSign className="absolute left-3.5 top-4 text-lg font-bold text-dark" />
                          <Input
                            type="number"
                            placeholder="Input amount you want to donate"
                            className="pl-10"
                            {...field}
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="mt-6 w-full rounded-full">
                  Send
                </Button>
              </form>
            </Form>
          </div>
        </DrawerContent>
      </Drawer>
    </>
  )
}

export default PledgeForm
