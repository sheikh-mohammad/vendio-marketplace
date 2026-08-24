import mongoose from "mongoose";

const PURPOSES = ["password_reset"];

const otpSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: [true, "Email is required"],
      lowercase: true,
      trim: true,
    },
    code: {
      type: String,
      required: [true, "OTP code is required"],
    },
    purpose: {
      type: String,
      enum: PURPOSES,
      default: "password_reset",
    },
    expiresAt: {
      type: Date,
      required: [true, "Expiry date is required"],
    },
    verified: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

// One active OTP per email per purpose — re-issuing overwrites the old one.
otpSchema.index({ email: 1, purpose: 1 }, { unique: true });

// MongoDB TTL index — expired documents are deleted automatically.
otpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const Otp = mongoose.model("Otp", otpSchema);

export default Otp;
