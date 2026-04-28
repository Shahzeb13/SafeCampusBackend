import dotenv from "dotenv";
import mongoose from "mongoose";
import UserModal from "../Models/userModel.js";
import { encryptPassword } from "./hashPassword.js";
import { connectToMongoDB } from "../Database/connectToDatabase.js";

// Load environment variables before doing anything else
dotenv.config();

const seedSuperAdmin = async () => {
  try {
    // 1. Connect to the database
    await connectToMongoDB();

    // 2. Define the exact superadmin credentials
    // Note: Do NOT commit this to public GitHub repos with real passwords in production.
    const adminEmail = "superadmin@safecampus.com";
    const adminPassword = "SuperSecurePassword123!"; 

    // 3. Check if the admin already exists
    const existingAdmin = await UserModal.findOne({ email: adminEmail });
    
    if (existingAdmin) {
      console.log("⚠️ SuperAdmin already exists in the database. No action taken.");
      process.exit(0);
    }

    // 4. Hash the password
    const hashedPassword = await encryptPassword(adminPassword);

    // 5. Create the admin user explicitly bypassing our controller rules
    await UserModal.create({
      username: "superadmin",
      email: adminEmail,
      password: hashedPassword,
      role: "admin", 
      // Required fallback fields to satisfy your UserSchema if needed
      rollNumber: "ADMIN-001",
      universityName: "System",
      departmentName: "Administration",
      program: "N/A",
      semester: "N/A",
      section: "N/A"
    });

    console.log(`✅ Success! SuperAdmin created.`);
    console.log(`📧 Email: ${adminEmail}`);
    console.log(`🔑 Password: ${adminPassword}`);

  } catch (error) {
    console.error("❌ Failed to seed SuperAdmin:", error);
  } finally {
    // Always close the database connection when the script finishes
    mongoose.connection.close();
    process.exit(0);
  }
};

seedSuperAdmin();
