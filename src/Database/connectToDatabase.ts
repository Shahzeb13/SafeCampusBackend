import mongoose from "mongoose"
import { logger } from "../Utils/logger.js"


export async function connectToMongoDB() {
  try {
    if(process.env.ATLAS_URI !== undefined){
      await mongoose.connect(process.env.ATLAS_URI,{
      dbName: "SafeCampus"
    });
    logger.dbConnected();
    }
    
  } catch (error) {
    logger.error(`Database connection failed: ${error}`);
  }
}