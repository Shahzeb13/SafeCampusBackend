import {Request, Response , NextFunction } from "express";
import jwt from "jsonwebtoken";
import { jwtPayLoad } from "../Types/jwtPayloadType.js";
import { isValidJwtPayload } from "../Types/TypePredicates/isValidJwtPayload.js";
//I leaned tht htere are two type of request and respnose object
// Dom Fetch ap request/response and express request/response


export function verifyJwtToken(req: Request , res: Response , next: NextFunction){
    console.log("Auth Middleware hit")
    try{
    let token = req.cookies?.jwt;

    // Check Authorization header if cookie not found (standard for mobile)
    if (!token && req.headers.authorization?.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    }

    if(!token){
        return res.status(401).json({success: false , message:"Not Authorizied! Token Not Found"});
    }

    const decoded = jwt.verify(token , process.env.JWT_SECRET!) ;
        if(!isValidJwtPayload(decoded)){
            return res.status(400).json({succes: false , message:"Decoded is not a valid jwtPayload"})
        }
        decoded//checing flow type here , just hover over it brosski
    req.user = decoded;

    

    next();

    }

    catch(err: unknown ){
        if(err instanceof Error){
            console.error("Error Verifying Jwt", {
            message: err.message,
            stack: err.stack
        })
        return res.status(500).json({success: false , message: "Internal Server Error"})
        }
        
    }
 
}

export function isAdmin(req: Request, res: Response, next: NextFunction) {
    if (req.user && req.user.role === "admin") {
        next();
    } else {
        res.status(403).json({ success: false, message: "Not Authorized! Admin access required" });
    }
}