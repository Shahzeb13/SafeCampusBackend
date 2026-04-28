// server.ts
import dotenv from 'dotenv'
dotenv.config();
import { logger } from './Utils/logger.js';
import express, { type Request, type Response } from "express";
import cors from "cors";
import authRoutes from "./Routes/authRoutes.js";
import incidentRoutes from "./Routes/incidentRoutes.js";
import notificationRoutes from "./Routes/notificationRoutes.js";
import emergencyContactRoutes from "./Routes/emergencyContactRoutes.js";
import sosRoutes from "./Routes/sosRoutes.js";
import adminRoutes from "./Routes/adminRoutes.js";
import userRoutes from "./Routes/userRoutes.js";
import { fancyRequestLogger } from "./Middlewares/fancyLogger.js";
const app = express();
const PORT = process.env.PORT || 5000;

/* ---------- MIDDLEWARE ---------- */
app.use(cors({
  origin: ["http://localhost:3000", "http://localhost:3001"],
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(fancyRequestLogger);

import cookieParser from "cookie-parser";
import { connectToMongoDB } from './Database/connectToDatabase.js';
import "./Database/firebaseAdmin.js";
app.use(cookieParser());
await connectToMongoDB();
/* ---------- ROUTES ---------- */

app.use("/api/auth", authRoutes);
app.use("/api/incidents", incidentRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/emergency-contacts", emergencyContactRoutes);
app.use("/api/sos", sosRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/users", userRoutes);

app.get("/api/test-server", (req: Request, res: Response) => {
  logger.info("Test Server Route hit")
  res.status(200).json({
    success: true,
    message: "Backend is reachable and responding properly! Yeah It's working buddy",
    timestamp: new Date().toISOString()
  });
});

app.get("/", (req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: "Server is running"
  });
});

/* ---------- START SERVER ---------- */
const server = app.listen(PORT, () => {
  logger.startup(PORT);
});

server.timeout = 300000; // 5 minutes recorded timeout for large file uploads


