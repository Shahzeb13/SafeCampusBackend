import mongoose from "mongoose";
import dotenv from "dotenv";
import readline from "readline/promises";
import { stdin as input, stdout as output } from "process";

// Load environment variables
dotenv.config();

const MONGO_URI = process.env.ATLAS_URI;

/**
 * ATTENTION: This script is intended for DEVELOPMENT and TEST environments only.
 * DO NOT run this against a production database unless you are absolutely sure.
 * This will permanently delete ALL data in the database.
 */

async function dropDatabase() {
  if (!MONGO_URI) {
    console.error("Error: MONGO_URI is not defined in .env file.");
    process.exit(1);
  }

  try {
    // Connect to MongoDB
    console.log("Connecting to MongoDB...");
    await mongoose.connect(MONGO_URI);

    const dbName = mongoose.connection.name;
    console.log(`Successfully connected to database: \x1b[33m${dbName}\x1b[0m`);

    // Check for --yes flag
    const skipConfirmation = process.argv.includes("--yes");

    if (!skipConfirmation) {
      const rl = readline.createInterface({ input, output });
      const confirmationPhrase = "DROP SAFECAMPUS DATABASE";
      
      console.log("\x1b[31m\x1b[1mWARNING: YOU ARE ABOUT TO DROP THE ENTIRE DATABASE!\x1b[0m");
      console.log(`This action is permanent and cannot be undone.`);
      
      const answer = await rl.question(
        `To confirm, please type exactly \x1b[36m"${confirmationPhrase}"\x1b[0m: `
      );

      rl.close();

      if (answer !== confirmationPhrase) {
        console.log("Confirmation failed. Database drop aborted.");
        await mongoose.disconnect();
        process.exit(0);
      }
    } else {
      console.log("\x1b[33mSkipping confirmation due to --yes flag...\x1b[0m");
    }

    console.log(`Dropping database \x1b[33m${dbName}\x1b[0m...`);
    await mongoose.connection.dropDatabase();
    
    console.log("\x1b[32m\x1b[1mDatabase dropped successfully!\x1b[0m");
    console.log("\x1b[34mNext steps:\x1b[0m");
    console.log("1. Restart your backend server so Mongoose can recreate collections and indexes.");
    console.log("2. Run your seed scripts to populate the database with fresh multi-tenant data.");
    console.log("3. It is recommended to create a comprehensive seed script for Organizations, Campuses, and Users.");

  } catch (error: any) {
    console.error("\x1b[31mAn error occurred while dropping the database:\x1b[0m");
    console.error(error.message);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected from MongoDB.");
    process.exit(0);
  }
}

dropDatabase();
