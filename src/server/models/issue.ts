import type { z } from "zod"
import mongoose, { Schema, type Model } from "mongoose"
import { type zIssue, categories } from "@/server/schema/issue"
import User from "./user"

export type TIssue = z.infer<typeof zIssue>

const schema: Schema<TIssue> = new Schema<TIssue>(
  {
    name: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      required: true,
      enum: categories,
    },
    description: {
      type: String,
      required: true,
    },
    thumbnail: {
      type: String,
      required: true,
    },
    gallery: {
      type: [String],
      required: true,
    },
    creator: {
      type: Schema.Types.ObjectId,
      ref: User,
      required: true,
    },
    issueId: {
      type: Number,
      required: true,
    },
    roundId: {
      type: Number,
      required: true,
    },
  },
  { timestamps: true },
)

const model: Model<TIssue> =
  mongoose.models.Issue ?? mongoose.model("Issue", schema)

export default model
