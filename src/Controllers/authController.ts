
import { Request, Response } from "express";
import UserModal from "../Models/userModel.js";
import generateToken from "../Utils/generateToken.js";
import bcrypt from "bcrypt";
import { encryptPassword } from "../Utils/hashPassword.js";
import {  isValidUserRegistrationRequest } from "../Types/TypePredicates/isValidUserRegistrationRequest.js";
import { validateUsername, validateEmail } from "../Utils/ValidateAuthData.js";



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

        const hashedPassword = await encryptPassword(password);
        
        const user = await UserModal.create({
            username,
            email,
            password: hashedPassword,
            role,
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

            res.cookie("jwt", token, {
                httpOnly: true,
                secure: process.env.NODE_ENV !== "development", // Use secure cookies in production
                sameSite: "strict", // Prevent CSRF attacks
                maxAge:  30 * 24 * 60 * 60 * 1000,
            });

            return res.status(201).json({
                id: user.id,
                username: user.username,
                email: user.email,
                role: user.role,
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
    try {
        const user = await UserModal.findById(req.user?.id);

        if (user) {
            res.json({
                id: user.id,
                username: user.username,
                email: user.email,
                role: user.role,
                avatar: user.avatar,
            });
        } else {
            res.status(404).json({ message: "User not found" });
        }
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Server Error" });
    }
};
