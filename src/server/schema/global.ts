import { z } from "zod"
import { Types } from "mongoose"

export const objectIdSchema = z.custom<Types.ObjectId>((value) =>
  Types.ObjectId.isValid(value),
)
