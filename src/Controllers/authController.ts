
import { Request, Response } from "express";
import UserModal from "../Models/userModel.js";
import campusModel from "../Models/campusModel.js";
import Organization from "../Models/organizationModel.js";
import generateToken from "../Utils/generateToken.js";
import bcrypt from "bcrypt";
import { encryptPassword } from "../Utils/hashPassword.js";
import { isValidUserRegistrationRequest } from "../Types/TypePredicates/isValidUserRegistrationRequest.js";
import { validateUsername, validateEmail } from "../Utils/ValidateAuthData.js";
import { sendOTPEmail, sendWelcomeEmail } from "../Utils/emailService.js";
import crypto from "crypto";
import { Role } from "../Types/userTypes.js";


export const registerUser = async (req: Request, res: Response): Promise<Response | void> => {
    console.log("User Registration Route hit");
    try {

        const body = req.body;
        const isBodyValid = isValidUserRegistrationRequest(body);
        if (!isBodyValid) {
            return res.status(400).json({ success: false, message: "User ,You are sending Invalid data. " })
        };

        const {
            username, email, password, role, avatar,
            rollNumber, universityName, departmentName, program, semester, section,
            organizationId, campusId
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

        // Prevent public privilege escalation — only campus-level roles allowed on public registration
        const allowedPublicRoles: Role[] = ["student", "staff", "security_personnel"];
        const finalRole: Role = allowedPublicRoles.includes(role as Role) ? (role as Role) : "student";

        // ==================================================
        // ORGANIZATION-AWARE REGISTRATION (SaaS)
        // If organizationId is provided, apply organization settings
        // ==================================================
        let userStatus: "pending" | "active" = "active";

        if (organizationId) {
            // 1. Fetch the organization and check if it exists and is active
            const organization = await Organization.findById(organizationId);
            if (!organization) {
                return res.status(400).json({ success: false, message: "Organization not found." });
            }
            if (organization.status !== "active") {
                return res.status(403).json({ success: false, message: "This organization is not currently accepting registrations." });
            }

            // 2. Check organization-level self-registration setting
            if (!organization.settings?.allowSelfRegistration) {
                return res.status(403).json({ success: false, message: "Self-registration is not allowed for this organization." });
            }

            // 3. Check role-specific registration settings
            if (finalRole === "student" && !organization.settings?.allowStudentRegistration) {
                return res.status(403).json({ success: false, message: "Student registration is not currently allowed." });
            }
            if (finalRole === "staff" && !organization.settings?.allowStaffRegistration) {
                return res.status(403).json({ success: false, message: "Staff registration is not currently allowed." });
            }

            // 4. Verify campus belongs to this organization
            if (campusId) {
                const campus = await campusModel.findOne({ _id: campusId, organizationId });
                if (!campus) {
                    return res.status(400).json({ success: false, message: "Selected campus does not belong to your organization." });
                }
            }

            // 5. Determine user status based on admin approval setting
            userStatus = organization.settings?.requireAdminApproval ? "pending" : "active";
        }

        const hashedPassword = await encryptPassword(password);

        const user = await UserModal.create({
            username,
            email,
            password: hashedPassword,
            role: finalRole,
            avatar,
            rollNumber,
            universityName,
            departmentName,
            program,
            semester,
            section,
            organizationId: organizationId || undefined,
            campusId: campusId || undefined,
            status: userStatus,
        });

        if (user) {
            const token = generateToken(
                user.id,
                user.role,
                organizationId || undefined,
                campusId || undefined
            );
            console.log("🔑 Registration JWT Token:", token);

            res.cookie("jwt", token, {
                httpOnly: true,
                secure: process.env.NODE_ENV !== "development",
                sameSite: "strict",
                maxAge: 30 * 24 * 60 * 60 * 1000,
            });

            // Send Welcome Email in background
            sendWelcomeEmail(user.email, user.username, user.role).catch(err => console.error("Welcome email background error:", err));

            return res.status(201).json({
                id: user.id,
                username: user.username,
                email: user.email,
                role: user.role,
                status: user.status,
                organizationId: user.organizationId,
                campusId: user.campusId,
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
export const loginUser = async (req: Request, res: Response) => {
    console.log("Login route hit");
    console.log(req.body)
    try {
        const { email, password } = req.body;

        const isEmailValid = validateEmail(email);
        if (!isEmailValid.ok) {
            res.status(400).json({ success: false, message: isEmailValid.reason })
            return;
        }

        console.log("ajfalkjlfjalfj")
        const user = await UserModal.findOne({ email });
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User Doesn't exist"
            })
        }

        console.log("aflakfjakfjaofjalkfjalfkj")
        if (user && (await bcrypt.compare(password, user.password))) {
            console.log("entered")
            // ==================================================
            // STATUS CHECK — Block non-active accounts
            // Exception: super_admin always allowed
            // ==================================================
            if (user.status !== "active" && user.role !== "super_admin") {

                res.status(403).json({
                    success: false,
                    message: "Your account is not active yet. Please contact your campus admin."
                });
                return;
            }

            console.log("hi mom")

            const token = generateToken(
                user.id,
                user.role,
                user.organizationId?.toString(),
                user.campusId?.toString()
            );
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
                status: user.status,
                organizationId: user.organizationId,
                campusId: user.campusId,
                avatar: user.avatar,
                personalEmergencyContacts: user.personalEmergencyContacts || [],
                // token: token,
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
                status: user.status,
                organizationId: user.organizationId,
                campusId: user.campusId,
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
        console.log('Generated OTP:', otp);

        // Save OTP and expiry (10 minutes)
        user.resetPasswordOTP = otp;
        user.resetPasswordOTPExpires = new Date(Date.now() + 10 * 60 * 1000);
        await user.save();

        // Send Email
        // await sendOTPEmail(user.email, otp);

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
