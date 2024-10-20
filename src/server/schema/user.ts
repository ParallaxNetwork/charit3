import { z } from "zod"
import { Types } from "mongoose"

export const zUser = z.object({
  _id: z.instanceof(Types.ObjectId),
  address: z.string().min(1),
  name: z.string().optional(),
  role: z.enum(["user", "admin"]),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
})
