import type { z } from "zod"
import mongoose, { Schema, type Model } from "mongoose"
import type { zRound } from "@/server/schema/round"
import Issue from "@/server/models/issue"

export type TRound = z.infer<typeof zRound>

const schema: Schema<TRound> = new Schema<TRound>(
  {
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
    issues: {
      type: [Schema.Types.ObjectId],
      ref: Issue,
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "active", "completed"],
      required: true,
    },
  },
  { timestamps: true },
)

const model: Model<TRound> =
  mongoose.models.Round ?? mongoose.model("Round", schema)

export default model
