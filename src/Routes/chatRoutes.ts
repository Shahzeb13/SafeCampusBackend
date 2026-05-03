import express from 'express';
import { getChatHistory, getAllConversations } from '../Controllers/chatController.js';
import { verifyJwtToken } from '../Middlewares/authMiddleware.js';

const router = express.Router();

// Chat routes require authentication
router.use(verifyJwtToken);

// Get history between two participants
router.get('/history/:userId/:adminId', getChatHistory);

// Admin route to see all active conversations
router.get('/conversations', getAllConversations);

export default router;
