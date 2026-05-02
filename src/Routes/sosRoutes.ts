import express from 'express';
import { 
    createSOS, 
    getMySOSHistory, 
    updateSOSStatus, 
    getAllSOS, 
    getSOSById, 
    updateLiveLocation, 
    getActiveSOS,
    assignSOS,
    respondToSOSAssignment,
    getMySOSAssignments
} from '../Controllers/sosController.js';
import { verifyJwtToken } from '../Middlewares/authMiddleware.js';

const router = express.Router();

// All SOS routes require authentication
router.use(verifyJwtToken);

router.get('/', getAllSOS); // List all historical SOS
router.get('/active', getActiveSOS); // List only current emergencies (Dashboard)
router.get('/history', getMySOSHistory); // for app
router.get('/my-assignments', getMySOSAssignments); // for guard app
router.get('/:id', getSOSById); // detailed tracking with locationHistory
router.post('/trigger', createSOS);
router.post('/assign', assignSOS); // for admin dashboard
router.post('/respond', respondToSOSAssignment); // for guard app
router.patch('/:id/status', updateSOSStatus); //for dashboard
router.patch('/:id/location', updateLiveLocation); // for live location tracking

export default router;




// When you build your future dashboard, the "Moving-Dot" effect should be implemented like this:

// Call GET /api/sos/:id on an interval (e.g., every 5 seconds).
// The dashboard takes latestLocation and moves the map marker to those coordinates.
// Simultaneously, it takes the locationHistory array and draws a line connecting all points, showing the security guard the exact path the student has taken.
// Your backend is now fully "Dashboard-Ready." Which part of the system would you like to refine next?

// 2
// sosController.ts
// sosRoutes.ts
