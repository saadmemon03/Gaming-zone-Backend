import Booking from "../models/Booking.model.js";
import Station from "../models/Station.model.js";
import { validateBookingTimes } from "../utils/bookingValidation.js";

export const getBookings = async (req, res) => {
  try {
    const shouldOnlyReturnOwnBookings = req.user.role === "user" || req.query.my === "true";
    const query = shouldOnlyReturnOwnBookings ? { user: req.user._id } : {};
    const bookings = await Booking.find(query).populate("user").populate("station").sort({ createdAt: -1 });
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
    const { station, startTime, endTime } = req.body;
    const contactNumber = typeof req.body.contactNumber === "string" ? req.body.contactNumber.trim() : "";
    if (req.user.role === "user" && !contactNumber) {
      return res.status(400).json({ success: false, message: "Contact number is required to create a booking." });
    }

    const timeValidationError = validateBookingTimes(startTime, endTime);
    if (timeValidationError) {
      return res.status(400).json({ success: false, message: timeValidationError });
    }
    
    // Check for overlapping bookings
    const overlap = await Booking.findOne({
      station: station,
      status: { $in: ["Pending", "Confirmed"] },
      $or: [
        { startTime: { $lt: endTime }, endTime: { $gt: startTime } }
      ]
    });
    
    if (overlap) {
      return res.status(400).json({ success: false, message: "This slot is already booked for the selected time." });
    }

    const booking = await Booking.create({
      ...req.body,
      user: req.user._id,
      contactNumber,
      customerEmail: req.user.email
    });
    
    // Optional: Only update station to occupied if booking is starting right now
    const now = new Date();
    const st = new Date(startTime);
    if (st <= now && new Date(endTime) > now) {
      await Station.findByIdAndUpdate(station, { status: "Occupied" });
    }
    
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

const getGuestCustomerFilter = ({ name, contact }) => ({
  user: null,
  guestName: name,
  contactNumber: contact ?? null,
  isCustomerDeleted: { $ne: true },
});

export const updateGuestCustomer = async (req, res) => {
  try {
    const { currentName, currentContact, name, contact } = req.body;
    if (
      typeof currentName !== "string" ||
      typeof name !== "string" ||
      typeof contact !== "string" ||
      !name.trim()
    ) {
      return res.status(400).json({ success: false, message: "Customer name and contact number are required." });
    }

    const result = await Booking.updateMany(
      getGuestCustomerFilter({ name: currentName, contact: currentContact }),
      { $set: { guestName: name.trim(), contactNumber: contact.trim() } }
    );
    if (result.matchedCount === 0) {
      return res.status(404).json({ success: false, message: "Customer not found." });
    }

    res.json({ success: true, message: "Customer updated successfully." });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

export const deleteGuestCustomer = async (req, res) => {
  try {
    const { name, contact } = req.body;
    if (typeof name !== "string") {
      return res.status(400).json({ success: false, message: "Customer name is required." });
    }

    const result = await Booking.updateMany(
      getGuestCustomerFilter({ name, contact }),
      { $set: { isCustomerDeleted: true } }
    );
    if (result.matchedCount === 0) {
      return res.status(404).json({ success: false, message: "Customer not found." });
    }

    res.json({ success: true, message: "Customer archived successfully." });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};
