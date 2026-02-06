// server.ts
import express, { type Request, type Response } from "express";
import cors from "cors";

const app = express();
const PORT = process.env.PORT || 5000;

/* ---------- MIDDLEWARE ---------- */
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/* ---------- ROUTES ---------- */
app.get("/", (req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: "Server is running"
  });
});

/* ---------- START SERVER ---------- */
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});


console.log("Server ")