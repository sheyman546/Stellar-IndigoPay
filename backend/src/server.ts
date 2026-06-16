import express from "express";
import cors from "cors";
import path from "path";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

import { register } from "./instrumentation";
import { apiRouter } from "./routes";

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS for frontend domain (localhost:3000)
app.use(cors({
  origin: "http://localhost:3000",
  credentials: true
}));

// Serve static avatars uploaded by users
// Supports uploads saved locally
app.use("/avatars", express.static(path.join(__dirname, "../public/avatars")));

// Mount the API Router
app.use(apiRouter);

// Start server
app.listen(PORT, async () => {
  console.log(`🚀 Backend Express Server running on http://localhost:${PORT}`);
  
  // Register instrumentation (runs database checks & background cron jobs)
  await register();
});
