import mongoose from "mongoose";

const gameSchema = new mongoose.Schema(
  {
    name:        { type: String, required: true, trim: true },
    platform:    { type: String, enum: ["PC", "PlayStation 5", "Xbox"], required: true },
    description: { type: String, default: "" },
    isActive:    { type: Boolean, default: true },
    image:       { type: String, default: null },
  },
  { timestamps: true }
);

export default mongoose.model("Game", gameSchema);
