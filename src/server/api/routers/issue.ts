import { z } from "zod"
import { createTRPCRouter, protectedProcedure } from "../trpc"

import { dbConnect } from "@/server/mongoose"
import Issue from "@/server/models/issue"
import { zIssue, zIssueWithCreator } from "@/server/schema/issue"

export const issueRouter = createTRPCRouter({
  getAll: protectedProcedure
    .output(z.array(zIssueWithCreator))
    .query(async () => {
      await dbConnect()
      const issues = await Issue.find()
        .sort({ createdAt: -1 })
        .populate("creator")
      return issues as unknown as z.infer<typeof zIssueWithCreator>[]
    }),
  create: protectedProcedure
    .input(zIssue.omit({ _id: true, createdAt: true, updatedAt: true }))
    .output(z.union([zIssue, z.null()]))
    .mutation(async ({ input }) => {
      await dbConnect()
      const issue = await Issue.create(input)
      return issue
    }),
})
