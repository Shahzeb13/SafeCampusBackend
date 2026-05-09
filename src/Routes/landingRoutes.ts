import express from "express";
import { submitLead } from "../Controllers/landingController.js";

const router = express.Router();

router.post("/contact", submitLead);

export default router;
