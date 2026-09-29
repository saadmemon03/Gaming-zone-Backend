import { Router } from "express";
import { login, getMe, register, forgotPassword, resetPassword } from "../controllers/auth.controller.js";
import { authenticate } from "../middleware/auth.js";

const router = Router();
router.post("/register", register);
router.post("/login", login);
router.get("/me", authenticate, getMe);

// Naye routes
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);

export default router;