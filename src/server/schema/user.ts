import { z } from "zod"
import { objectIdSchema } from "./global"

export const zUser = z.object({
  _id: objectIdSchema,
  address: z.string().min(1),
  name: z.string().optional(),
  role: z.enum(["user", "admin"]).default("user"),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
})

export const zUserCreate = zUser.pick({ address: true, name: true, role: true })
