"use client"

import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { useGlobalStore } from "@/stores/global"

import { Button } from "@/components/ui/button"
import { Drawer, DrawerContent } from "@/components/ui/drawer"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { LuDollarSign } from "react-icons/lu"

const formSchema = z.object({
  amount: z.string(),
})

const StakeForm = () => {
  const { showStakeForm, setShowStakeForm } = useGlobalStore()

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      amount: "",
    },
  })

  function onSubmit(values: z.infer<typeof formSchema>) {
    console.log(values)
  }
  return (
    <>
      <Drawer open={showStakeForm} onOpenChange={setShowStakeForm}>
        <DrawerContent className="container px-4 pb-6">
          <div className="mt-8 rounded-2xl border border-dark/20 p-6">
            <p className="text-center text-2xl font-bold text-dark">Stake</p>
            <p className="mt-2 text-center text-sm text-dark">
              The following conditions must be met to proceed.
            </p>
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y- mt-8"
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
                  Stake
                </Button>
              </form>
            </Form>
          </div>
        </DrawerContent>
      </Drawer>
    </>
  )
}

export default StakeForm
