import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import User from "../models/User.js";
import { JWT_SECRET } from "../config/config.js";
import { generateOtp, sendOtpEmail } from "../utils/email.js";

const OTP_EXPIRY_MS = 10 * 60 * 1000; // 10 minutes

const signToken = (id) => jwt.sign({ id }, JWT_SECRET, { expiresIn: "7d" });

// POST /api/auth/signup — create account, return JWT
export async function signup(req, res, next) {
  try {
    const { name, email, password, confirmPassword } = req.body;

    if (!name || !email || !password || !confirmPassword) {
      return res.status(400).json({ message: "All fields are required" });
    }
    if (password !== confirmPassword) {
      return res.status(400).json({ message: "Passwords do not match" });
    }
    if (password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters" });
    }

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(400).json({ message: "An account with this email already exists" });
    }

    const user = await User.create({
      name: name.trim(),
      email: email.toLowerCase(),
      password,
    });

    res.status(201).json({
      success: true,
      message: "Account created successfully",
      token: signToken(user._id),
      user: { id: user._id, name: user.name, email: user.email },
    });
  } catch (err) {
    next(err);
  }
}

// POST /api/auth/login — verify credentials, return JWT
export async function login(req, res, next) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const user = await User.findOne({ email: email.toLowerCase() }).select("+password");
    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    res.status(200).json({
      success: true,
      message: "Login successful",
      token: signToken(user._id),
      user: { id: user._id, name: user.name, email: user.email },
    });
  } catch (err) {
    next(err);
  }
}

// POST /api/auth/logout (protected) — JWT is stateless, so the client discards it.
export async function logout(req, res) {
  res.status(200).json({ success: true, message: "Logged out successfully" });
}

// POST /api/auth/forgot-password — send OTP email
export async function forgotPassword(req, res, next) {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    const user = await User.findOne({ email: email.toLowerCase() });

    // Respond identically whether or not the email exists (no account leaking).
    if (user) {
      const otp = generateOtp();
      user.passwordResetOtpHash = await bcrypt.hash(otp, 10);
      user.passwordResetOtpExpires = new Date(Date.now() + OTP_EXPIRY_MS);
      user.otpVerified = false;
      await user.save();
      await sendOtpEmail(user.email, otp);
    }

    res.status(200).json({
      success: true,
      message: "If that email is registered, a password reset OTP has been sent to it.",
    });
  } catch (err) {
    next(err);
  }
}

// POST /api/auth/verify-otp — verify the received OTP
export async function verifyOtp(req, res, next) {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ message: "Email and OTP are required" });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    const valid =
      user &&
      user.passwordResetOtpHash &&
      (!user.passwordResetOtpExpires || new Date(user.passwordResetOtpExpires) > new Date()) &&
      (await bcrypt.compare(String(otp), user.passwordResetOtpHash));

    if (!valid) {
      return res.status(400).json({ message: "Invalid or expired OTP" });
    }

    user.otpVerified = true;
    await user.save();

    res.status(200).json({ success: true, message: "OTP verified successfully" });
  } catch (err) {
    next(err);
  }
}

// POST /api/auth/reset-password — set a new password (requires prior OTP verification)
export async function resetPassword(req, res, next) {
  try {
    const { email, newPassword, confirmPassword } = req.body;

    if (!email || !newPassword || !confirmPassword) {
      return res.status(400).json({ message: "All fields are required" });
    }
    if (newPassword !== confirmPassword) {
      return res.status(400).json({ message: "Passwords do not match" });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters" });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user || !user.otpVerified) {
      return res.status(400).json({ message: "Please verify your OTP first" });
    }
    if (!user.passwordResetOtpExpires || new Date(user.passwordResetOtpExpires) < new Date()) {
      return res.status(400).json({ message: "OTP has expired. Please request a new one." });
    }

    user.password = newPassword; // hashed by the User pre-save hook
    user.passwordResetOtpHash = undefined;
    user.passwordResetOtpExpires = undefined;
    user.otpVerified = false;
    await user.save();

    res.status(200).json({ success: true, message: "Password reset successful. You can log in now." });
  } catch (err) {
    next(err);
  }
}
