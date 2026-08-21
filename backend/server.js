import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import { setServers } from "node:dns/promises";
import {
  MONGODB_URI,
  PORT,
  JWT_SECRET,
  CLOUDINARY_API_KEY,
  CLOUDINARY_CLOUD_NAME,
  CLOUDINARY_API_SECRET,
  SMTP_SERVICE,
  SMTP_EMAIL,
  SMTP_APP_PASS,
} from "./config/config.js";

mongoose
  .connect(MONGODB_URI)
  .then(() => {
    console.log("MongoDB Connected");
  })
  .catch((error) => {
    console.log("Error in MongoDB Connection", error);
  });

const app = express();

app.use(express.json());
app.use(cors());

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
