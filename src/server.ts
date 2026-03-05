// server.ts
import dotenv from 'dotenv'
dotenv.config();
import express, { type Request, type Response } from "express";
import cors from "cors";
import authRoutes from "./Routes/authRoutes.js";
import incidentRoutes from "./Routes/incidentRoutes.js";
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

app.get("/", (req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: "Server is running"
  });
});

/* ---------- START SERVER ---------- */
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});


