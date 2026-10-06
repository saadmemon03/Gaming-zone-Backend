import Station from "../models/Station.model.js";
import Booking from "../models/Booking.model.js";

export const getStations = async (req, res) => {
  try {
    const { search = "", status = "", type = "", page = 1, limit = 50 } = req.query;
    const filter = {};
    if (search) filter.name = new RegExp(search, "i");
    if (status) filter.status = status;
    if (type)   filter.type   = type;

    const total    = await Station.countDocuments(filter);
    const stations = await Station.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(Number(limit)).lean();
    
    const now = new Date();
    for (let i = 0; i < stations.length; i++) {
      const activeBooking = await Booking.findOne({
        station: stations[i]._id,
        status: { $in: ["Pending", "Confirmed"] },
        endTime: { $gt: now }
      }).sort({ startTime: 1 }).select("startTime endTime status");
      
      stations[i].activeBooking = activeBooking || null;
    }

    res.json({ success: true, data: stations, total, page: Number(page), limit: Number(limit) });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

export const getStationById = async (req, res) => {
  try {
    const station = await Station.findById(req.params.id);
    if (!station) return res.status(404).json({ success: false, message: "Station not found" });
    res.json({ success: true, data: station });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

export const createStation = async (req, res) => {
  try {
    const existing = await Station.findOne({ name: { $regex: new RegExp(`^${req.body.name}$`, "i") } });
    if (existing) {
      return res.status(400).json({ success: false, message: "A station with this name already exists!" });
    }
    const station = await Station.create(req.body);
    res.status(201).json({ success: true, data: station });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

export const updateStation = async (req, res) => {
  try {
    if (req.body.name) {
      const existing = await Station.findOne({ 
        name: { $regex: new RegExp(`^${req.body.name}$`, "i") },
        _id: { $ne: req.params.id }
      });
      if (existing) {
        return res.status(400).json({ success: false, message: "A station with this name already exists!" });
      }
    }
    const station = await Station.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!station) return res.status(404).json({ success: false, message: "Station not found" });
    res.json({ success: true, data: station });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

export const deleteStation = async (req, res) => {
  try {
    const station = await Station.findByIdAndDelete(req.params.id);
    if (!station) return res.status(404).json({ success: false, message: "Station not found" });
    res.json({ success: true, message: "Station deleted" });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};
