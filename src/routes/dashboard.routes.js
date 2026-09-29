import { Router } from "express";
import { getDashboardStats, getRevenueChart, getStationOverview, getRecentBookings } from "../controllers/dashboard.controller.js";
import { authenticate, authorize } from "../middleware/auth.js";

const router = Router();
router.use(authenticate, authorize("admin","manager"));
router.get("/stats",             getDashboardStats);
router.get("/revenue",           getRevenueChart);
router.get("/station-overview",  getStationOverview);
router.get("/recent-bookings",   getRecentBookings);
export default router;
