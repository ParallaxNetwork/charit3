import { z } from "zod"
import { createTRPCRouter, protectedProcedure } from "../trpc"

import { dbConnect } from "@/server/mongoose"
import Issue from "@/server/models/issue"
import { zIssue } from "@/server/schema/issue"

export const issueRouter = createTRPCRouter({
  create: protectedProcedure
    .input(zIssue.omit({ _id: true, createdAt: true, updatedAt: true }))
    .output(z.union([zIssue, z.null()]))
    .mutation(async ({ input }) => {
      await dbConnect()
      const issue = await Issue.create(input)
      return issue
    }),
})
