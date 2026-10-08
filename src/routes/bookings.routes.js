import { Router } from "express";
import { getBookings, getBookingById, createBooking, updateBooking, deleteBooking, updateGuestCustomer, deleteGuestCustomer } from "../controllers/bookings.controller.js";
import { authenticate, authorize } from "../middleware/auth.js";

const router = Router();
router.use(authenticate);
// user can get their own bookings or all if admin
router.get("/",       getBookings); 
router.put("/customers/guest", authorize("admin","manager"), updateGuestCustomer);
router.delete("/customers/guest", authorize("admin","manager"), deleteGuestCustomer);
router.get("/:id",    getBookingById);
// users can create bookings
router.post("/",      createBooking);
router.put("/:id",    authorize("admin","manager","staff"), updateBooking);
router.delete("/:id", authorize("admin"),                   deleteBooking);
export default router;
