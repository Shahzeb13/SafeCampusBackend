import dotenv from "dotenv";
import mongoose from "mongoose";
import UserModel from "../src/Models/userModel.js";
import { connectToMongoDB } from "../src/Database/connectToDatabase.js";

// Load environment variables before doing anything else
dotenv.config();

const seedAllowedClients = async () => {
  try {
    // 1. Connect to the database
    console.log("Connecting to MongoDB...");
    await connectToMongoDB();

    // 2. Define roles and client mappings
    const mobileRoles = ["student", "staff", "security_personnel"];

    // 3. Update users whose role is student, staff, or security_personnel to "mobile"
    console.log("Updating student, staff, and security_personnel to allowed_client: 'mobile'...");
    const mobileResult = await UserModel.updateMany(
      { role: { $in: mobileRoles } },
      { $set: { allowed_client: "mobile" } }
    );
    console.log(`Updated ${mobileResult.modifiedCount} users to 'mobile'.`);

    // 4. Update all other users to "web"
    console.log("Updating all other roles to allowed_client: 'web'...");
    const webResult = await UserModel.updateMany(
      { role: { $nin: mobileRoles } },
      { $set: { allowed_client: "web" } }
    );
    console.log(`Updated ${webResult.modifiedCount} users to 'web'.`);

    console.log("✅ Success! Platform-specific client permissions seeded.");

  } catch (error) {
    console.error("❌ Failed to seed allowed clients:", error);
  } finally {
    // Always close the database connection when the script finishes
    await mongoose.connection.close();
    console.log("Disconnected from MongoDB.");
    process.exit(0);
  }
};

seedAllowedClients();
