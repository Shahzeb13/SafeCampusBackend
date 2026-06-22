import express from 'express';
import { getChatHistory, getAllConversations, getSecurityIncharge } from '../Controllers/chatController.js';
import { verifyJwtToken } from '../Middlewares/authMiddleware.js';

const router = express.Router();

// Chat routes require authentication
router.use(verifyJwtToken);

// Get security incharge for the current campus
router.get('/incharge', getSecurityIncharge);

// Get history between two participants
router.get('/history/:userId/:adminId', getChatHistory);

// Admin route to see all active conversations
router.get('/conversations', getAllConversations);

export default router;
