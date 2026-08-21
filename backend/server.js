import mongoose from "mongoose";
import app from "./app.js";
import { MONGODB_URI, PORT } from "./config/config.js";

mongoose
  .connect(MONGODB_URI)
  .then(() => {
    console.log("MongoDB Connected");
    app.listen(PORT, () => {
      console.log(`Server is running on http://localhost:${PORT}`);
    });
  })
  .catch((error) => {
    console.log("Error in MongoDB Connection", error);
  });
