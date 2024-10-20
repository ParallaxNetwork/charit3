import { z } from "zod"
import { objectIdSchema } from "./global"

export const categories = [
  "Property & Hunger",
  "Education & Youth Development",
  "Health & Wellness",
  "Environment Conservation",
  "Animal Welfare",
  "Human Rights & Social Justice",
  "Disaster & Emergency Relief",
  "NGO Support",
] as const

export const zIssue = z.object({
  _id: objectIdSchema,
  name: z.string().min(5).max(60),
  thumbnail: z.string(),
  category: z.enum(categories),
  description: z.string(),
  gallery: z.array(z.string()).max(6),
  creator: objectIdSchema,
  issueId: z.number(),
  roundId: z.number(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
})
