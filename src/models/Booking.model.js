import mongoose from "mongoose";

const bookingSchema = new mongoose.Schema(
  {
    user:      { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    guestName: { type: String, default: null },
    contactNumber: { type: String, default: null },
    station:   { type: mongoose.Schema.Types.ObjectId, ref: "Station", required: true },
    game:      { type: mongoose.Schema.Types.ObjectId, ref: "Game",    default: null },
    startTime: { type: Date, required: true },
    endTime:   { type: Date, required: true },
    amount:    { type: Number, required: true },
    status:    { type: String, enum: ["Pending", "Confirmed", "Completed", "Cancelled"], default: "Pending" },
  },
  { timestamps: true }
);

export default mongoose.model("Booking", bookingSchema);
