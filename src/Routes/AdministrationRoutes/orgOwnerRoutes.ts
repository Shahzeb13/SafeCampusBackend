import express from "express";
import { getOrganizationbyOrgOwnerId } from "../../Controllers/AdministrationControllers/orgOwnerContoller.js";


const router = express.Router();

// These routes will be mounted under /api/admin
router.get("/getOwnerOrganization" , getOrganizationbyOrgOwnerId)
export default router;
