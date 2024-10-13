"use client";

import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Drawer, DrawerContent, DrawerTrigger } from "@/components/ui/drawer";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { LuDollarSign } from "react-icons/lu";

type Props = {};

const formSchema = z.object({
  amount: z.string(),
});

const StakeForm = (props: Props) => {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      amount: "",
    },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    console.log(values);
  }
  return (
    <>
      <Drawer>
        <DrawerTrigger asChild>
          <Button className="w-full rounded-full mt-2">Vote Donation</Button>
        </DrawerTrigger>
        <DrawerContent className="container px-4 pb-6">
          <div className="border border-dark/20 rounded-2xl p-6 mt-14">
            <p className="text-dark font-bold text-2xl text-center">
              Stake to continue
            </p>
            <p className="text-dark text-sm mt-2 text-center">
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
                      <FormLabel className="font-semibold text-dark text-sm">
                        Amount
                      </FormLabel>
                      <FormControl>
                        <div className="relative">
                          <LuDollarSign className="text-lg font-bold text-dark absolute top-4 left-3.5" />
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
  );
};

export default StakeForm;
