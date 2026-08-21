import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { JWT_SECRET } from "../config/config.js";

/**
 * Protect a route: requires a valid `Authorization: Bearer <token>` header.
 * On success attaches `req.user` and `req.userId`; otherwise responds 401.
 */
export async function protect(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Not authorized — no token provided" });
  }

  const token = authHeader.split(" ")[1];
  let decoded;
  try {
    decoded = jwt.verify(token, JWT_SECRET);
  } catch {
    return res.status(401).json({ message: "Not authorized — token invalid or expired" });
  }

  const user = await User.findById(decoded.id);
  if (!user) {
    return res.status(401).json({ message: "Not authorized — account no longer exists" });
  }

  req.user = user;
  req.userId = user._id.toString();
  next();
}
