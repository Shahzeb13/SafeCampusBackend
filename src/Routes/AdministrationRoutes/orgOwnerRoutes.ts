import express from "express";
import { 
  getOrganizationbyOrgOwnerId,
  createCampusAdmin,
  assignCampusAdmin,
  getCampusAdmins,
  editCampusAdmin,
  deleteCampusAdmin
} from "../../Controllers/AdministrationControllers/orgOwnerContoller.js";
import { createRequest, getOwnerRequests } from "../../Controllers/campusRequestController.js";

const router = express.Router();

// These routes will be mounted under /api/admin/org-owner
router.get("/getOwnerOrganization" , getOrganizationbyOrgOwnerId)
router.post("/create-campus-admin", createCampusAdmin);
router.post("/assign-campus-admin", assignCampusAdmin);
router.get("/get-campus-admins", getCampusAdmins);
router.patch("/edit-campus-admin/:id", editCampusAdmin);
router.delete("/delete-campus-admin/:id", deleteCampusAdmin);

// Campus Creation Requests
router.post("/campus-requests", createRequest);
router.get("/campus-requests", getOwnerRequests);

export default router;



