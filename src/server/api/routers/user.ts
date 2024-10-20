import { z } from "zod"
import { createTRPCRouter, publicProcedure } from "../trpc"

import { dbConnect } from "@/server/mongoose"
import User from "@/server/models/user"
import { zUserCreate } from "@/server/schema/user"

export const userRouter = createTRPCRouter({
  create: publicProcedure
    .input(zUserCreate)
    .output(z.boolean())
    .mutation(async ({ input }) => {
      await dbConnect()
      const user = await User.create(input)
      return !!user
    }),
})
