import { Router } from "express";
import rateLimit from "express-rate-limit";
import { login, getMe, register, verifyEmail, resendVerificationOtp, forgotPassword, resetPassword } from "../controllers/auth.controller.js";
import { authenticate } from "../middleware/auth.js";

const router = Router();
const resendVerificationOtpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: process.env.NODE_ENV === "production" ? 5 : 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many OTP requests. Please try again later.",
  },
});

router.post("/register", register);
router.post("/verify-email", verifyEmail);
router.post("/resend-verification-otp", resendVerificationOtpLimiter, resendVerificationOtp);
router.post("/login", login);
router.get("/me", authenticate, getMe);

// Naye routes
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);

export default router;