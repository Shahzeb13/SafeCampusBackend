import mongoose from "mongoose"


export async function connectToMongoDB() {
  try {
    if(process.env.ATLAS_URI !== undefined){
      await mongoose.connect(process.env.ATLAS_URI,{
      dbName: "SafeCampus"
    });
    console.log("MongoDB Connected");
    }
    
  } catch (error) {
    console.error(error);
  }
}