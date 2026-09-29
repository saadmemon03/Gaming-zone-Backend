import Booking from "../models/Booking.model.js";
import Station from "../models/Station.model.js";

export const getBookings = async (req, res) => {
  try {
    const bookings = await Booking.find().populate("user").populate("station").sort({ createdAt: -1 });
    res.json({ success: true, data: bookings });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

export const getBookingById = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id).populate("user").populate("station");
    res.json({ success: true, data: booking });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

export const createBooking = async (req, res) => {
  try {
    const booking = await Booking.create(req.body);
    await Station.findByIdAndUpdate(req.body.station, { status: "Occupied" });
    res.status(201).json({ success: true, data: booking });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

export const updateBooking = async (req, res) => {
  try {
    const booking = await Booking.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (req.body.status === "Completed" || req.body.status === "Cancelled") {
      await Station.findByIdAndUpdate(booking.station, { status: "Available" });
    }
    res.json({ success: true, data: booking });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

export const deleteBooking = async (req, res) => {
  try {
    await Booking.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: "Booking deleted" });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};
