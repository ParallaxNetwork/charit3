import { z } from "zod"
import { objectIdSchema } from "./global"

export const zRound = z.object({
  _id: objectIdSchema,
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  issues: z.array(objectIdSchema),
  status: z.enum(["pending", "active", "completed"]),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
})
