import "express";
import { jwtPayLoad } from "./jwtPayloadType.ts";

declare module "express-serve-static-core" {
  interface Request {
    user?: jwtPayLoad
  }
}