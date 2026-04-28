
import express from "express";
import { registerUser, loginUser, logoutUser, getUserProfile, forgotPassword, resetPassword } from "../Controllers/authController.js";
import { verifyJwtToken} from "../Middlewares/authMiddleware.js";

const router = express.Router();

router.post("/register", registerUser);
router.post("/login", loginUser);
router.post("/logout", logoutUser);
router.get("/profile", verifyJwtToken, getUserProfile);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);

export default router;
