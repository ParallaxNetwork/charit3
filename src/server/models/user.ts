import type { z } from "zod"
import mongoose, { Schema, type Model } from "mongoose"
import type { zUser } from "@/server/schema/user"

export type TUser = z.infer<typeof zUser>

const schema: Schema<TUser> = new Schema<TUser>(
  {
    address: {
      type: String,
      required: true,
      unique: true,
    },
    name: {
      type: String,
      required: false,
    },
    role: {
      type: String,
      enum: ["user", "admin"],
      required: true,
    },
  },
  { timestamps: true }
)

schema.pre("save", function (next) {
  if (!this.name) {
    this.name = this.address
  }
  next()
})

const model: Model<TUser> = mongoose.models.User ?? mongoose.model("User", schema)

export default model
