import { Request, Response } from 'express';
import { ConversationModel, MessageModel } from '../Models/chatModel.js';
import UserModel from '../Models/userModel.js';
import mongoose from 'mongoose';

/**
 * Fetch chat history between a user and security incharge
 */
export const getChatHistory = async (req: Request, res: Response) => {
  try {
    const { userId, adminId } = req.params;
    const loggedInUser = req.user;

    if (!loggedInUser) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    // 1. Fetch user and admin details to verify campus isolation
    const user = await UserModel.findById(userId);
    const admin = await UserModel.findById(adminId);

    if (!user || !admin) {
      return res.status(404).json({
        success: false,
        message: "User or Admin not found",
      });
    }

    // 2. Enforce Campus Isolation: Must belong to the same campus
    if (user.campusId?.toString() !== admin.campusId?.toString()) {
      return res.status(403).json({
        success: false,
        message: "Campus isolation violation: Users belong to different campuses",
      });
    }

    // 3. User Authorization: The logged-in user must be either a participant or an admin/owner of that campus
    if (
      loggedInUser.role !== 'super_admin' &&
      loggedInUser.role !== 'organization_owner' &&
      loggedInUser.role !== 'campus_admin' &&
      loggedInUser.role !== 'security_incharge' &&
      loggedInUser.id !== userId &&
      loggedInUser.id !== adminId
    ) {
      return res.status(403).json({
        success: false,
        message: "Access denied: You are not authorized to view this chat history",
      });
    }

    // Extra double-check: Non-super-admins can only view their own campus data
    if (
      loggedInUser.role !== 'super_admin' &&
      loggedInUser.campusId?.toString() !== user.campusId?.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: "Access denied: Campus isolation violation",
      });
    }

    // 4. Find the conversation or create it
    let conversation = await ConversationModel.findOne({
      participants: { $all: [new mongoose.Types.ObjectId(userId as string), new mongoose.Types.ObjectId(adminId as string)] },
    });

    if (!conversation) {
      conversation = new ConversationModel({
        organizationId: user.organizationId,
        campusId: user.campusId,
        participants: [user._id, admin._id],
      });
      await conversation.save();
    }

    // 5. Fetch all messages in the conversation chronologically
    const messages = await MessageModel.find({ conversationId: conversation._id }).sort({ createdAt: 1 });

    // 6. Automatically mark other participant's messages as read
    await MessageModel.updateMany(
      {
        conversationId: conversation._id,
        senderId: { $ne: new mongoose.Types.ObjectId(loggedInUser.id) },
        isRead: false
      },
      {
        $set: { isRead: true, readAt: new Date() }
      }
    );

    return res.status(200).json({
      success: true,
      data: messages,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch chat history",
      error: error.message,
    });
  }
};

/**
 * Fetch all active conversations for the Security Incharge
 */
export const getAllConversations = async (req: Request, res: Response) => {
  try {
    const loggedInUser = req.user;

    if (!loggedInUser) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    // Enforce role-based query scopes
    let query: any = {};
    if (loggedInUser.role === 'super_admin') {
      if (req.query.campusId) query.campusId = req.query.campusId;
      if (req.query.organizationId) query.organizationId = req.query.organizationId;
    } else if (loggedInUser.role === 'organization_owner') {
      query.organizationId = loggedInUser.organizationId;
      if (req.query.campusId) query.campusId = req.query.campusId;
    } else {
      // security_incharge, campus_admin: scoped strictly to their campus
      if (!loggedInUser.campusId) {
        return res.status(400).json({ success: false, message: "User is not assigned to any campus" });
      }
      query.campusId = loggedInUser.campusId;
    }

    const conversations = await ConversationModel.find(query)
      .populate('participants', 'username email role avatar')
      .populate({
        path: 'lastMessage',
        model: 'Message'
      })
      .sort({ lastMessageAt: -1, updatedAt: -1 });

    return res.status(200).json({
      success: true,
      data: conversations,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch conversations",
      error: error.message,
    });
  }
};

/**
 * Helper to save message to DB (Used by SocketManager)
 */
export const saveMessageToDb = async (senderId: string, senderName: string, receiverId: string, message: string) => {
  try {
    const sender = await UserModel.findById(senderId);
    const receiver = await UserModel.findById(receiverId);

    if (!sender || !receiver) {
      throw new Error("Sender or Receiver user not found");
    }

    console.log("💬 [saveMessageToDb] Sender:", sender._id, "Role:", sender.role, "Campus:", sender.campusId?.toString());
    console.log("💬 [saveMessageToDb] Receiver:", receiver._id, "Role:", receiver.role, "Campus:", receiver.campusId?.toString());

    // Enforce isolation during message persistence
    if (sender.campusId?.toString() !== receiver.campusId?.toString()) {
      console.warn("⚠️ [saveMessageToDb] Campus isolation violation check failed");
      throw new Error(`Campus isolation violation: Users belong to different campuses (Sender: ${sender.campusId?.toString()} vs Receiver: ${receiver.campusId?.toString()})`);
    }

    const participants = [
      new mongoose.Types.ObjectId(senderId),
      new mongoose.Types.ObjectId(receiverId),
    ];

    // Find existing conversation or create new one
    let conversation = await ConversationModel.findOne({
      participants: { $all: participants },
    });

    if (!conversation) {
      conversation = new ConversationModel({
        organizationId: sender.organizationId,
        campusId: sender.campusId,
        participants,
      });
      await conversation.save();
    }

    // Create the message document
    const newMessage = new MessageModel({
      conversationId: conversation._id,
      senderId: sender._id,
      senderName,
      message,
    });

    await newMessage.save();

    // Update conversation with latest message reference
    conversation.lastMessage = newMessage._id as mongoose.Types.ObjectId;
    conversation.lastMessageAt = newMessage.createdAt;
    await conversation.save();

    return newMessage;
  } catch (error) {
    console.error("Error saving message to DB:", error);
    throw error;
  }
};

/**
 * Fetch the Security Incharge for the current user's campus
 */
export const getSecurityIncharge = async (req: Request, res: Response) => {
  try {
    const loggedInUser = req.user;
    if (!loggedInUser || !loggedInUser.campusId) {
      return res.status(400).json({ success: false, message: "User is not assigned to any campus" });
    }

    const incharge = await UserModel.findOne({
      role: 'security_incharge',
      campusId: loggedInUser.campusId,
    }).select('_id username email avatar');

    if (!incharge) {
      return res.status(404).json({ success: false, message: "No Security Incharge found for your campus" });
    }

    return res.status(200).json({
      success: true,
      data: incharge,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch Security Incharge",
      error: error.message,
    });
  }
};

