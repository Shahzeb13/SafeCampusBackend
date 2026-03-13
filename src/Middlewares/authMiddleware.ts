import {Request, Response , NextFunction } from "express";
import jwt from "jsonwebtoken";
import { jwtPayLoad } from "../Types/jwtPayloadType.js";
import { isValidJwtPayload } from "../Types/TypePredicates/isValidJwtPayload.js";
//I leaned tht htere are two type of request and respnose object
// Dom Fetch ap request/response and express request/response


export function verifyJwtToken(req: Request , res: Response , next: NextFunction){
    // const token = req.cookies.jwt;
    try{
   console.log("request" , req);
    const token = req.cookies?.jwt;
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

//today task
//learn about request and respnse objects as much as you can today
// work on seach engine prject too, learn about regex engine as much
//as you can
//i have still doubts in type assertion , gotta clear them