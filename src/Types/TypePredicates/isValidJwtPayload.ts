import { jwtPayLoad } from "../jwtPayloadType.js";

export function isValidJwtPayload(decoded : unknown)  : decoded is jwtPayLoad {
    if(decoded === null || decoded === undefined){
        return false;
    }

    if(typeof decoded !== "object"){
        return false;
    }
    if(Array.isArray(decoded)){
        return false;
    }

    const d = decoded as Record<string , unknown>
    
    if(
        (typeof d.id !== "string") ||
        (typeof d.role !== "string")
    ){
        return false;
    }

    if (!["admin", "student", "staff", "security_personnel"].includes(d.role as string)) return false;

    return true
}