
import jwt from "jsonwebtoken";
import { Request, Response, NextFunction } from "express";
import UserWrapper from "../Modals/userModal.js";

interface AuthRequest extends Request {
    user?: any;
    cookies: { [key: string]: string };
}

export const protect = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    let token;

    if (req.cookies.jwt) {
        token = req.cookies.jwt;
    } else if (
        req.headers.authorization &&
        req.headers.authorization.startsWith("Bearer")
    ) {
        token = req.headers.authorization.split(" ")[1];
    }

    if (token) {
        try {
            const decoded: any = jwt.verify(token, process.env.JWT_SECRET || "fallbackSecretNoOneShouldKnow");

            const user = await UserWrapper.findById(decoded.id).select("-password");
            if (user) {
                req.user = user;
                next();
            } else {
                res.status(401).json({ message: "Not authorized, token failed" });
                return;
            }

        } catch (error) {
            console.error(error);
            res.status(401).json({ message: "Not authorized, token failed" });
            return;
        }
    } else {
        res.status(401).json({ message: "Not authorized, no token" });
        return;
    }
};
