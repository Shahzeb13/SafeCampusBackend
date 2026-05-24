/**
 * Backfill Script — Assign organizationId to existing data
 * =========================================================
 * Purpose: Old data created before the SaaS multi-tenant refactor
 *          will not have organizationId set. This script backfills
 *          organizationId on Users, Incidents, SOS, Chats, Notifications,
 *          and EmergencyContacts by tracing back through campusId.
 *
 * HOW TO USE:
 *   1. Make sure your MONGO_URI env var is set.
 *   2. Run: npx ts-node src/scripts/backfillOrganizationId.ts
 *   3. This script is SAFE to re-run — it only patches records where organizationId is missing.
 *   4. DO NOT run this in production without reviewing logs first.
 *
 * WARNING: Run this ONCE after deploying the multi-tenant schema update.
 */

import mongoose from "mongoose";
import "dotenv/config";

import campusModel from "../Models/campusModel.js";
import UserModel from "../Models/userModel.js";
import IncidentModel from "../Models/incidentModel.js";
import SOSModel from "../Models/sosModel.js";
import ChatModel from "../Models/chatModel.js";
import NotificationModel from "../Models/notificationModel.js";
import EmergencyContactModel from "../Models/emergencyContactModel.js";

async function connect() {
  const uri = process.env.MONGO_URI;
  if (!uri) throw new Error("MONGO_URI is not defined in environment variables.");
  await mongoose.connect(uri);
  console.log("✅ Connected to MongoDB");
}

async function backfill() {
  await connect();

  // -------------------------------------------------------
  // 1. Build a campusId → organizationId lookup map
  // -------------------------------------------------------
  console.log("\n📦 Building campusId → organizationId map...");
  const campuses = await campusModel.find({ organizationId: { $exists: true, $ne: null } });
  const campusOrgMap = new Map<string, string>();
  for (const campus of campuses) {
    if ((campus as any).organizationId) {
      campusOrgMap.set(campus._id.toString(), (campus as any).organizationId.toString());
    }
  }
  console.log(`   Found ${campusOrgMap.size} campuses with organizationId.`);

  // -------------------------------------------------------
  // 2. Backfill Users
  // -------------------------------------------------------
  console.log("\n👤 Backfilling Users...");
  const usersWithoutOrg = await UserModel.find({ organizationId: { $exists: false } });
  let userPatched = 0;
  for (const user of usersWithoutOrg) {
    if (user.campusId) {
      const orgId = campusOrgMap.get(user.campusId.toString());
      if (orgId) {
        await UserModel.findByIdAndUpdate(user._id, { organizationId: orgId });
        userPatched++;
      }
    }
  }
  console.log(`   Patched ${userPatched} / ${usersWithoutOrg.length} users.`);

  // -------------------------------------------------------
  // 3. Backfill Incidents
  // -------------------------------------------------------
  console.log("\n🚨 Backfilling Incidents...");
  const incidentsWithoutOrg = await IncidentModel.find({ organizationId: { $exists: false } });
  let incidentPatched = 0;
  for (const incident of incidentsWithoutOrg) {
    if (incident.campusId) {
      const orgId = campusOrgMap.get(incident.campusId.toString());
      if (orgId) {
        await IncidentModel.findByIdAndUpdate(incident._id, { organizationId: orgId });
        incidentPatched++;
      }
    }
  }
  console.log(`   Patched ${incidentPatched} / ${incidentsWithoutOrg.length} incidents.`);

  // -------------------------------------------------------
  // 4. Backfill SOS
  // -------------------------------------------------------
  console.log("\n🆘 Backfilling SOS records...");
  const sosWithoutOrg = await SOSModel.find({ organizationId: { $exists: false } });
  let sosPatched = 0;
  for (const sos of sosWithoutOrg) {
    if (sos.campusId) {
      const orgId = campusOrgMap.get(sos.campusId.toString());
      if (orgId) {
        await SOSModel.findByIdAndUpdate(sos._id, { organizationId: orgId });
        sosPatched++;
      }
    }
  }
  console.log(`   Patched ${sosPatched} / ${sosWithoutOrg.length} SOS records.`);

  // -------------------------------------------------------
  // 5. Backfill Chats (campusId is now required but was not before)
  // -------------------------------------------------------
  console.log("\n💬 Backfilling Chats...");
  const chatsWithoutOrg = await ChatModel.find({ organizationId: { $exists: false } });
  console.log(`   ${chatsWithoutOrg.length} chats have no organizationId — cannot auto-resolve (no campusId on old chats). Manual review needed.`);

  // -------------------------------------------------------
  // 6. Backfill Notifications
  // -------------------------------------------------------
  console.log("\n🔔 Backfilling Notifications...");
  const notificationsWithoutOrg = await NotificationModel.find({ organizationId: { $exists: false } });
  console.log(`   ${notificationsWithoutOrg.length} notifications have no organizationId — cannot auto-resolve. Manual review needed.`);

  // -------------------------------------------------------
  // 7. Backfill EmergencyContacts
  // -------------------------------------------------------
  console.log("\n📞 Backfilling EmergencyContacts...");
  const contactsWithoutOrg = await EmergencyContactModel.find({ organizationId: { $exists: false } });
  let contactPatched = 0;
  for (const contact of contactsWithoutOrg) {
    if ((contact as any).campusId) {
      const orgId = campusOrgMap.get((contact as any).campusId.toString());
      if (orgId) {
        await EmergencyContactModel.findByIdAndUpdate(contact._id, { organizationId: orgId });
        contactPatched++;
      }
    }
  }
  console.log(`   Patched ${contactPatched} / ${contactsWithoutOrg.length} emergency contacts.`);

  // -------------------------------------------------------
  // Done
  // -------------------------------------------------------
  console.log("\n✅ Backfill complete. Disconnecting...");
  await mongoose.disconnect();
  console.log("✅ Disconnected from MongoDB");
}

backfill().catch((err) => {
  console.error("❌ Backfill script failed:", err);
  mongoose.disconnect();
  process.exit(1);
});
