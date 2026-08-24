import dns from "dns";
import mongoose from "mongoose";
import app from "./app.js";
import { MONGODB_URI, PORT } from "./config/config.js";

let isConnected = false;

async function connectDB() {
  if (isConnected) return;
  if (mongoose.connection.readyState === 1) {
    isConnected = true;
    return;
  }
  if (process.env.VERCEL) {
    dns.setServers(["8.8.8.8", "1.1.1.1"]);
  }
  await mongoose.connect(MONGODB_URI);
  isConnected = true;
  console.log("MongoDB Connected");
}

if (process.env.VERCEL) {
  try {
    await connectDB();
  } catch (error) {
    console.error("Error in MongoDB Connection", error);
  }
} else {
  connectDB()
    .then(() => {
      app.listen(PORT, () => {
        console.log(`Server is running on http://localhost:${PORT}`);
      });
    })
    .catch((error) => {
      console.log("Error in MongoDB Connection", error);
    });
}

export default app;
