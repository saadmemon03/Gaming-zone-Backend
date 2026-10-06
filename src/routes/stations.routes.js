import { Router } from "express";
import { getStations, getStationById, createStation, updateStation, deleteStation } from "../controllers/stations.controller.js";
import { authenticate, authorize } from "../middleware/auth.js";

const router = Router();

// Public routes
router.get("/",       getStations);
router.get("/:id",    getStationById);

// Protected routes
router.use(authenticate);
router.post("/",      authorize("admin","manager"), createStation);
router.put("/:id",    authorize("admin","manager"), updateStation);
router.delete("/:id", authorize("admin"),           deleteStation);
export default router;
