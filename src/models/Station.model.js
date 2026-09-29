import mongoose from "mongoose";

const stationSchema = new mongoose.Schema(
  {
    name:       { type: String, required: true, trim: true },
    type:       { type: String, enum: ["Gaming PC", "PlayStation 5", "Xbox"], default: "Gaming PC" },
    specs:      { type: String, default: "" },
    hourlyRate: { type: Number, required: true },
    status:     { type: String, enum: ["Available", "Occupied", "Reserved", "Maintenance"], default: "Available" },
    usageHours: { type: Number, default: 0 },
    image:      { type: String, default: null },
  },
  { timestamps: true }
);

export default mongoose.model("Station", stationSchema);
