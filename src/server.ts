// server.ts
import dotenv from 'dotenv'
dotenv.config();
import express, { type Request, type Response } from "express";
import cors from "cors";
import authRoutes from "./Routes/authRoutes.js";
import incidentRoutes from "./Routes/incidentRoutes.js";
import notificationRoutes from "./Routes/notificationRoutes.js";
import emergencyContactRoutes from "./Routes/emergencyContactRoutes.js";
import sosRoutes from "./Routes/sosRoutes.js";
const app = express();
const PORT = process.env.PORT || 5000;

/* ---------- MIDDLEWARE ---------- */
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

import cookieParser from "cookie-parser";
import { connectToMongoDB } from './Database/connectToDatabase.js';
app.use(cookieParser());
await connectToMongoDB()
/* ---------- ROUTES ---------- */

app.use("/api/auth", authRoutes);
app.use("/api/incidents", incidentRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/emergency-contacts", emergencyContactRoutes);
app.use("/api/sos", sosRoutes);

app.get("/api/test-server", (req: Request, res: Response) => {
  console.log("Test Server ROute hit")
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
  console.log(`Server running on http://localhost:${PORT}`);
});

server.timeout = 300000; // 5 minutes recorded timeout for large file uploads


