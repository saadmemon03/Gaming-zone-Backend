import { z } from "zod";
import * as authService from "../services/auth.service.js";
import { strongPasswordMessage, strongPasswordPattern } from "../utils/passwordValidation.js";

const registerSchema = z.object({
  name: z.string().min(1, "name, email and password are required"),
  email: z.string().email("Invalid email").min(1, "name, email and password are required"),
  password: z.string().regex(strongPasswordPattern, strongPasswordMessage),
  phone: z.string().optional(),
});

export const register = async (req, res) => {
  try {
    const validatedData = registerSchema.parse(req.body);
    const result = await authService.registerService(validatedData);
    return res.status(200).json({ success: true, ...result });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: err.issues.map((issue) => issue.message).join(", "),
      });
    }
    const status = err.status || 500;
    return res.status(status).json({ success: false, message: err.message });
  }
};

const verifyEmailSchema = z.object({
  email: z.string().min(1, "Email and OTP are required"),
  otp: z.union([z.string(), z.number()]).transform((val) => String(val)),
});

export const verifyEmail = async (req, res) => {
  try {
    const validatedData = verifyEmailSchema.parse(req.body);
    const result = await authService.verifyEmailService(validatedData);
    return res.status(200).json({ success: true, ...result });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ success: false, message: "Email and OTP are required" });
    }
    const status = err.status || 500;
    return res.status(status).json({ success: false, message: err.message });
  }
};

const resendVerificationOtpSchema = z.object({
  email: z.string().trim().email("Enter a valid email address."),
});

export const resendVerificationOtp = async (req, res) => {
  try {
    const validatedData = resendVerificationOtpSchema.parse(req.body);
    const result = await authService.resendVerificationOtpService(validatedData);
    return res.status(200).json({ success: true, ...result });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: err.issues.map((issue) => issue.message).join(", "),
      });
    }
    const status = err.status || 500;
    return res.status(status).json({ success: false, message: err.message });
  }
};

const loginSchema = z.object({
  email: z.string().min(1, "Email and password are required"),
  password: z.string().min(1, "Email and password are required"),
});

export const login = async (req, res) => {
  try {
    const validatedData = loginSchema.parse(req.body);
    const result = await authService.loginService(validatedData);
    return res.status(200).json({ success: true, ...result });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ success: false, message: "Email and password are required" });
    }
    const status = err.status || 500;
    const response = { success: false, message: err.message };
    if (err.code) response.code = err.code;
    return res.status(status).json(response);
  }
};

export const getMe = async (req, res) => {
  try {
    const result = await authService.getMeService(req.user);
    return res.status(200).json({ success: true, ...result });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

const forgotPasswordSchema = z.object({
  email: z.string().email("Invalid email"),
});

export const forgotPassword = async (req, res) => {
  try {
    const validatedData = forgotPasswordSchema.parse(req.body);
    const result = await authService.forgotPasswordService(validatedData);
    return res.status(200).json({ success: true, ...result });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ success: false, message: err.errors.map((e) => e.message).join(", ") });
    }
    const status = err.status || 500;
    return res.status(status).json({ success: false, message: err.message });
  }
};

const resetPasswordSchema = z.object({
  email: z.string().min(1, "Email, OTP aur Naya Password zaroori hain"),
  otp: z.union([z.string(), z.number()]).transform((val) => String(val)),
  newPassword: z.string().regex(strongPasswordPattern, strongPasswordMessage),
});

export const resetPassword = async (req, res) => {
  try {
    const validatedData = resetPasswordSchema.parse(req.body);
    const result = await authService.resetPasswordService(validatedData);
    return res.status(200).json({ success: true, ...result });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: err.issues.map((issue) => issue.message).join(", "),
      });
    }
    const status = err.status || 500;
    return res.status(status).json({ success: false, message: err.message });
  }
};
