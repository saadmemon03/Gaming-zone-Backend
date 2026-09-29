import jwt from "jsonwebtoken";
import User from "../models/User.model.js";
import crypto from "crypto";
import sendEmail from "../utils/sendEmail.js";

const genToken = (user) =>
  jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: "24h" });

// POST /api/auth/register
export const register = async (req, res) => {
  try {
    const { name, email, password, phone } = req.body;
    if (!name || !email || !password)
      return res.status(400).json({ success: false, message: "name, email, password required" });

    const exists = await User.findOne({ email });
    if (exists)
      return res.status(409).json({ success: false, message: "Email already in use" });

    const user = await User.create({ name, email, password, phone });
    res.status(201).json({ success: true, message: "Registered successfully", token: genToken(user), user });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/auth/login
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ success: false, message: "Email and password required" });

    const user = await User.findOne({ email, isActive: true }).select("+password");
    if (!user || !(await user.matchPassword(password)))
      return res.status(401).json({ success: false, message: "Invalid credentials" });

    res.json({ success: true, message: "Login successful", token: genToken(user), user });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/auth/me
export const getMe = async (req, res) => {
  res.json({ success: true, user: req.user });
};

// POST /api/auth/forgot-password
export const forgotPassword = async (req, res) => {
  try {
    const user = await User.findOne({ email: req.body.email });
    if (!user) {
      return res.status(404).json({ success: false, message: "Is email se koi user nahi mila" });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    
    user.resetPasswordToken = crypto.createHash("sha256").update(otp).digest("hex");
    user.resetPasswordExpire = Date.now() + 10 * 60 * 1000; 
    
    await user.save({ validateBeforeSave: false });

    const htmlMessage = `
      <h3>Password Reset Request</h3>
      <p>Aapka password reset OTP ye hai: <strong>${otp}</strong></p>
      <p>Ye OTP 10 minutes mein expire ho jayega.</p>
    `;

    try {
      await sendEmail({
        email: user.email,
        subject: "Password Reset OTP - GameZone",
        html: htmlMessage,
      });
      res.status(200).json({ success: true, message: "OTP aapki email par bhej diya gaya hai" });
    } catch (err) {
      user.resetPasswordToken = undefined;
      user.resetPasswordExpire = undefined;
      await user.save({ validateBeforeSave: false });
      console.error("Forgot-password email failed:", err.message);
      const message = err.message.includes("SMTP_EMAIL")
        ? "SMTP_EMAIL aur SMTP_PASSWORD ko gaming-api/.env mein configure karein"
        : "Email bhejne mein masla aaya";
      return res.status(500).json({ success: false, message });
    }
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/auth/reset-password
export const resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;
    
    if (!email || !otp || !newPassword) {
      return res.status(400).json({ success: false, message: "Email, OTP aur Naya Password zaroori hain" });
    }
    
    const hashedOTP = crypto.createHash("sha256").update(otp).digest("hex");

    const user = await User.findOne({
      email: email,
      resetPasswordToken: hashedOTP,
      resetPasswordExpire: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ success: false, message: "Ghalat ya Expire shuda OTP" });
    }

    user.password = newPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    
    await user.save();

    res.status(200).json({ success: true, message: "Password kamyabi se reset ho gaya. Ab aap login kar sakte hain." });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
