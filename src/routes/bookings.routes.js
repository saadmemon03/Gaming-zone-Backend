import { Router } from "express";
import { getBookings, getBookingById, createBooking, updateBooking, deleteBooking } from "../controllers/bookings.controller.js";
import { authenticate, authorize } from "../middleware/auth.js";

const router = Router();
router.use(authenticate);
router.get("/",       authorize("admin","manager","staff"), getBookings);
router.get("/:id",    authorize("admin","manager","staff"), getBookingById);
router.post("/",      authorize("admin","manager","staff"), createBooking);
router.put("/:id",    authorize("admin","manager","staff"), updateBooking);
router.delete("/:id", authorize("admin"),                   deleteBooking);
export default router;
