
import { Request, Response } from "express";
import UserModal from "../Models/userModel.js";
import generateToken from "../Utils/generateToken.js";
import bcrypt from "bcrypt";
import { encryptPassword } from "../Utils/hashPassword.js";
import {  isValidUserRegistrationRequest } from "../Types/TypePredicates/isValidUserRegistrationRequest.js";
import { validateUsername, validateEmail } from "../Utils/ValidateAuthData.js";
import { sendOTPEmail, sendWelcomeEmail } from "../Utils/emailService.js";
import crypto from "crypto";




export const registerUser = async (req: Request, res: Response): Promise<Response | void> => {
    console.log("User Registration Route hit");
    try {
        
        const body = req.body;
        const isBodyValid = isValidUserRegistrationRequest(body);
        if (!isBodyValid) {
            return res.status(400).json({ success: false, message: "User ,You are sending Invalid data. " })

        };


        body

        const { 
            username, email, password, role, avatar,
            rollNumber, universityName, departmentName, program, semester, section 
        } = body;

        const isUsernameValid = validateUsername(username);
        if (!isUsernameValid.ok) {
            return res.status(400).json({ success: false, message: isUsernameValid.reason })
        }

        const isEmailValid = validateEmail(email);
        if (!isEmailValid.ok) {
            return res.status(400).json({ success: false, message: isEmailValid.reason })
        }


        const userExists = await UserModal.findOne({ email });

        if (userExists) {
            res.status(400).json({ message: "User already exists" });
            return;
        }

        // Prevent public privilege escalation
        const validRoles = ["student", "staff", "security_personnel"];
        const finalRole = validRoles.includes(role) ? role : "student";

        const hashedPassword = await encryptPassword(password);
        
        const user = await UserModal.create({
            username,
            email,
            password: hashedPassword,
            role: finalRole, // Accepts student or staff, defaults to student
            avatar,
            rollNumber,
            universityName,
            departmentName,
            program,
            semester,
            section
        });

        if (user) {
            const token = generateToken(user.id, user.role);
            console.log("🔑 Registration JWT Token:", token);

            res.cookie("jwt", token, {
                httpOnly: true,
                secure: process.env.NODE_ENV !== "development", // Use secure cookies in production
                sameSite: "strict", // Prevent CSRF attacks
                maxAge:  30 * 24 * 60 * 60 * 1000,
            });

            // Send Welcome Email in background
            sendWelcomeEmail(user.email, user.username, user.role).catch(err => console.error("Welcome email background error:", err));

            return res.status(201).json({
                id: user.id,
                username: user.username,
                email: user.email,
                role: user.role,
                avatar: user.avatar,
                personalEmergencyContacts: user.personalEmergencyContacts || [],
                token: token,
            });
        } else {
            res.status(400).json({ message: "User Does not Exist" });
        }
    } catch (error: any) {
        console.error("Error Registering User ", {
            stack: error.stack,
            message: error.message
        });
        res.status(500).json({ message: "Server Error" });
    }
};

// @desc    Auth user & get token
// @route   POST /api/users/login
// @access  Public
export const loginUser = async (req: Request, res: Response): Promise<void> => {
    console.log("Login route hit");
    console.log(req.body)
    try {
        const { email, password } = req.body;

        const isEmailValid = validateEmail(email);
        if (!isEmailValid.ok) {
            res.status(400).json({ success: false, message: isEmailValid.reason })
            return;
        }

        const user = await UserModal.findOne({ email });

        if (user && (await bcrypt.compare(password, user.password))) {
            const token = generateToken(user.id, user.role);
            console.log("🔑 Login JWT Token:", token);

            res.cookie("jwt", token, {
                httpOnly: true,
                secure: process.env.NODE_ENV !== "development",
                sameSite: "strict",
                maxAge: 30 * 24 * 60 * 60 * 1000,
            });

            res.json({
                id: user.id,
                username: user.username,
                email: user.email,
                role: user.role,
                avatar: user.avatar,
                personalEmergencyContacts: user.personalEmergencyContacts || [],
                token: token,
            });
        } else {
            res.status(401).json({ message: "Invalid email or password" });
        }
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Server Error" });
    }
};

// @desc    Logout user / clear cookie
// @route   POST /api/users/logout
// @access  Private
export const logoutUser = (req: Request, res: Response): void => {
    console.log("logout rout hit")
    res.cookie("jwt", "", {
        httpOnly: true,
        expires: new Date(0),
    });
    res.status(200).json({ message: "Logged out successfully" });
};

// @desc    Get user profile
// @route   GET /api/users/profile
// @access  Private
export const getUserProfile = async (req: Request, res: Response): Promise<void> => {
    console.log("getUserProfile route hit");
    try {
        const user = await UserModal.findById(req.user?.id);

        if (user) {
            res.json({
                id: user.id,
                username: user.username,
                role: user.role,
                avatar: user.avatar,
                personalEmergencyContacts: user.personalEmergencyContacts || [],
            });
        } else {
            res.status(404).json({ message: "User not found" });
        }
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Server Error" });
    }
};

// @desc    Request password reset OTP
// @route   POST /api/auth/forgot-password
// @access  Public
export const forgotPassword = async (req: Request, res: Response): Promise<void> => {
    console.log("forgot password rout hit");
    try {
        const { email } = req.body;
        const user = await UserModal.findOne({ email });

        if (!user) {
            res.status(404).json({ success: false, message: "User not found" });
            return;
        }

        // Generate 6-digit OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        
        // Save OTP and expiry (10 minutes)
        user.resetPasswordOTP = otp;
        user.resetPasswordOTPExpires = new Date(Date.now() + 10 * 60 * 1000);
        await user.save();

        // Send Email
        await sendOTPEmail(user.email, otp);

        res.status(200).json({ success: true, message: "OTP sent to your email" });
    } catch (error) {
        console.error("Forgot password error:", error);
        res.status(500).json({ success: false, message: "Failed to process request" });
    }
};

// @desc    Reset password using OTP
// @route   POST /api/auth/reset-password
// @access  Public
export const resetPassword = async (req: Request, res: Response): Promise<void> => {
    console.log("reset password route hit");
    try {
        const { email, otp, newPassword } = req.body;

        const user = await UserModal.findOne({
            email,
            resetPasswordOTP: otp,
            resetPasswordOTPExpires: { $gt: new Date() }
        });

        if (!user) {
            res.status(400).json({ success: false, message: "Invalid or expired OTP" });
            return;
        }

        // Encrypt new password
        user.password = await encryptPassword(newPassword);
        
        // Clear OTP fields
        user.resetPasswordOTP = null;
        user.resetPasswordOTPExpires = null;
        await user.save();

        res.status(200).json({ success: true, message: "Password reset successful" });
    } catch (error) {
        console.error("Reset password error:", error);
        res.status(500).json({ success: false, message: "Failed to reset password" });
    }
};

