// import { z } from "zod"
// import { TRPCError } from "@trpc/server"
// import { publicProcedure } from "../trpc"
// import { env } from "@/env"

// import { dbConnect } from "@/server/mongoose"
// import User from "@/server/models/user"
// import { zUser } from "@/server/schema/user"

// export const userRouter = createTRPCRouter({
//   create: publicProcedure
//     .input(zUserCreate)
//     .output(z.boolean())
//     .mutation(async ({ input }) => {
//       await dbConnect()
//       const user = await User.create(input)
//       return !!user
//     }),
// })
