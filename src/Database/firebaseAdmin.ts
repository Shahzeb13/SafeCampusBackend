import admin from "firebase-admin";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Path to your service account key
const serviceAccountPath = path.resolve(__dirname, "../../firebase-service-account.json");
console.log("🔍 Looking for Firebase key at:", serviceAccountPath);

if (fs.existsSync(serviceAccountPath)) {
  const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, "utf-8"));

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });

  console.log("✅ Firebase Admin Initialized");
} else {
  console.warn("⚠️ Firebase service account file not found. Push notifications will not work.");
}

export default admin;
