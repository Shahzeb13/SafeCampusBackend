import express from "express";
import { 
    createSecurityPersonel, 
    createStudentStaff, 
    getcampusAdminOrganziation,
    getStudentsStaff,
    updateStudent,
    deleteStudent,
    updateStaff,
    deleteStaff,
    getSecurityPersonnel,
    updateSecurityPersonnel,
    deleteSecurityPersonnel
} from "../../Controllers/AdministrationControllers/campusAdminController.js";

const router = express.Router();

// These routes will be mounted under /api/Admin
router.post("/getCampusAdminOrg" , getcampusAdminOrganziation);

// Students / Staff Unified Fetch and Create
router.post("/createStudentStaff" , createStudentStaff )
router.get("/students-staff", getStudentsStaff);

// Student specific routes
router.put("/student/:id", updateStudent);
router.delete("/student/:id", deleteStudent);

// Staff specific routes
router.put("/staff/:id", updateStaff);
router.delete("/staff/:id", deleteStaff);

// Security Personnel
router.post("/createSecurityPersonel" , createSecurityPersonel )
router.get("/security-personnel", getSecurityPersonnel);
router.put("/security-personnel/:id", updateSecurityPersonnel);
router.delete("/security-personnel/:id", deleteSecurityPersonnel);

export default router;