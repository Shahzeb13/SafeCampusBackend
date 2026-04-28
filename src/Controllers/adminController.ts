import { Request, Response } from "express";
import UserModal from "../Models/userModel.js";
import { encryptPassword } from "../Utils/hashPassword.js";
import { validateUsername, validateEmail } from "../Utils/ValidateAuthData.js";

/**
 * Controller for Admin to create users (Students or Staff)
 */
export const createUserByAdmin = async (req: Request, res: Response) => {
    try {
        const { username, email, password, role } = req.body;

        // 1. Basic Validation
        if (!username || !email || !password || !role) {
            return res.status(400).json({ success: false, message: "Please provide all required fields (username, email, password, role)" });
        }

        // 2. Role Security Check
        const allowedRoles = ["student", "staff"];
        if (!allowedRoles.includes(role)) {
            return res.status(400).json({ success: false, message: "Invalid role. Admins can only create 'student' or 'staff' accounts." });
        }

        // 3. User Input Validation
        const usernameCheck = validateUsername(username);
        if (!usernameCheck.ok) return res.status(400).json({ success: false, message: usernameCheck.reason });

        const emailCheck = validateEmail(email);
        if (!emailCheck.ok) return res.status(400).json({ success: false, message: emailCheck.reason });

        // 4. Check Duplicate Email
        const existingUser = await UserModal.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ success: false, message: "User with this email already exists" });
        }

        // 5. Create User
        const hashedPassword = await encryptPassword(password);
        const user = await UserModal.create({
            username,
            email,
            password: hashedPassword,
            role,
            // Add other optional fields if necessary or let them be updated later
        });

        res.status(201).json({
            success: true,
            message: `User created successfully as ${role}`,
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                role: user.role
            }
        });

    } catch (error: any) {
        console.error("Admin Create User Error:", error);
        res.status(500).json({ success: false, message: "Server Error during user creation" });
    }
};
