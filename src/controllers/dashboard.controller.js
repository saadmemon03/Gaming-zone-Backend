import User    from "../models/User.model.js";
import Station from "../models/Station.model.js";
import Booking from "../models/Booking.model.js";

export const getDashboardStats = async (_req, res) => {
  try {
    const [totalUsers, totalStations, totalBookings, revenueData] = await Promise.all([
      User.countDocuments({ role: "user" }),
      Station.countDocuments(),
      Booking.countDocuments(),
      Booking.aggregate([
        { $match: { status: { $in: ["Confirmed", "Completed"] } } },
        { $group: { _id: null, total: { $sum: "$amount" } } }
      ]),
    ]);

    const totalRevenue = revenueData[0]?.total ?? 0;
    res.json({ success: true, data: { totalRevenue, totalBookings, totalUsers, totalStations } });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

export const getRevenueChart = async (req, res) => { res.json({ success: true, data: [] }); };
export const getStationOverview = async (req, res) => { res.json({ success: true, data: {} }); };
export const getRecentBookings = async (req, res) => { res.json({ success: true, data: [] }); };
