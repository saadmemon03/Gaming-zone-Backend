import jwt from "jsonwebtoken";
import User from "../models/User.model.js";
import crypto from "crypto";
import sendEmail from "../utils/sendEmail.js";

const genToken = (user) =>
  jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: "7d" });

const normalizeEmail = (email = "") => String(email).trim().toLowerCase();

const sendVerificationOtp = async (user) => {
  const otp = crypto.randomInt(100000, 1000000).toString();
  user.verificationOTP = crypto.createHash("sha256").update(otp).digest("hex");
  user.verificationOTPExpire = Date.now() + 15 * 60 * 1000;
  await user.save();

  try {
    await sendEmail({
      email: user.email,
      subject: "Account Verification OTP - GameZone",
      html: `
        <h3>Account Verification</h3>
        <p>Your verification OTP is: <strong>${otp}</strong></p>
        <p>This code will expire in 15 minutes.</p>
      `,
    });
  } catch (err) {
    user.verificationOTP = undefined;
    user.verificationOTPExpire = undefined;
    await user.save({ validateBeforeSave: false });

    console.error("Registration verification email delivery failed:", err.code || "SMTP_ERROR");
    const error = new Error(
      "We couldn't send the verification email. Please check the email service configuration and try again.",
    );
    error.status = 502;
    throw error;
  }
};

export const registerService = async ({ name, email, password, phone }) => {
  const cleanEmail = normalizeEmail(email);

  let user = await User.findOne({ email: cleanEmail });
  if (user && user.isVerified) {
    const error = new Error("Email already in use");
    error.status = 409;
    throw error;
  }

  if (!user) {
    user = await User.create({
      name,
      email: cleanEmail,
      password,
      phone,
      isVerified: false,
    });
  } else {
    user.name = name;
    user.email = cleanEmail;
    user.password = password;
    user.phone = phone;
    await user.save();
  }

  await sendVerificationOtp(user);
  return {
    message: "Verification OTP has been sent to your email. Please verify your account.",
  };
};

export const resendVerificationOtpService = async ({ email }) => {
  const cleanEmail = normalizeEmail(email);
  const user = await User.findOne({ email: cleanEmail, isVerified: false });

  if (!user) {
    const existingUser = await User.findOne({ email: cleanEmail });
    const error = new Error(
      existingUser?.isVerified
        ? "This email is already verified. Please sign in."
        : "No unverified account was found for this email. Please check the address or create an account first.",
    );
    error.status = existingUser?.isVerified ? 409 : 404;
    throw error;
  }

  await sendVerificationOtp(user);

  return {
    message: `A new verification code has been sent to ${user.email}. It expires in 10 minutes.`,
  };
};

export const verifyEmailService = async ({ email, otp }) => {
  const cleanEmail = normalizeEmail(email);

  const hashedOTP = crypto.createHash("sha256").update(String(otp)).digest("hex");

  const user = await User.findOne({
    email: cleanEmail,
    verificationOTP: hashedOTP,
    verificationOTPExpire: { $gt: Date.now() },
  });

  if (!user) {
    const error = new Error("Invalid or expired OTP");
    error.status = 400;
    throw error;
  }

  user.isVerified = true;
  user.verificationOTP = undefined;
  user.verificationOTPExpire = undefined;

  await user.save();

  return { message: "Your account has been verified successfully." };
};

export const loginService = async ({ email, password }) => {
  const cleanEmail = normalizeEmail(email);

  const user = await User.findOne({ email: cleanEmail, isActive: true }).select("+password");
  if (!user || !(await user.matchPassword(password))) {
    const error = new Error("Invalid credentials");
    error.status = 401;
    throw error;
  }

  if (!user.isVerified) {
    const error = new Error("Please verify your account before logging in.");
    error.status = 403;
    error.code = "EMAIL_NOT_VERIFIED";
    throw error;
  }

  return { message: "Login successful", token: genToken(user), user };
};

export const getMeService = async (user) => {
  return { user };
};

export const forgotPasswordService = async ({ email }) => {
  const user = await User.findOne({ email });
  if (!user) {
    const error = new Error("No user was found with this email address.");
    error.status = 404;
    throw error;
  }

  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  
  user.resetPasswordToken = crypto.createHash("sha256").update(otp).digest("hex");
  user.resetPasswordExpire = Date.now() + 15 * 60 * 1000; 
  
  await user.save({ validateBeforeSave: false });

  const htmlMessage = `
    <h3>Password Reset Request</h3>
    <p>Your reset password reset OTP is here: <strong>${otp}</strong></p>
    <p> Your OTP is expire in 15 minutes.</p>
  `;

  try {
    await sendEmail({
      email: user.email,
      subject: "Password Reset OTP - GameZone",
      html: htmlMessage,
    });
    return { message: "Your OTP has been send to your email" };
  } catch (err) {
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save({ validateBeforeSave: false });
    console.error("Forgot-password email failed:", err.message);
    const message = err.message.includes("SMTP_EMAIL")
      ? "SMTP_EMAIL aur SMTP_PASSWORD ko gaming-api/.env mein configure karein"
      : "Email bhejne mein masla aaya";
    const error = new Error(message);
    error.status = 500;
    throw error;
  }
};

export const resetPasswordService = async ({ email, otp, newPassword }) => {
  const hashedOTP = crypto.createHash("sha256").update(otp).digest("hex");

  const user = await User.findOne({
    email: email,
    resetPasswordToken: hashedOTP,
    resetPasswordExpire: { $gt: Date.now() },
  });

  if (!user) {
    const error = new Error("Your OTP is expire");
    error.status = 400;
    throw error;
  }

  user.password = newPassword;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpire = undefined;
  
  await user.save();

  return { message: " Finally your password has been reset successfully."  };
};
