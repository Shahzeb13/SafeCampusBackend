import { Request, Response } from 'express';
import ChatModel from '../Models/chatModel.js';
import mongoose from 'mongoose';

/**
 * Fetch chat history between a user and admin
 */
export const getChatHistory = async (req: Request, res: Response) => {
  try {
    const { userId, adminId } = req.params;

    // Find the conversation where both are participants
    const chat = await ChatModel.findOne({
      participants: { $all: [userId, adminId] },
    });

    if (!chat) {
      return res.status(200).json({
        success: true,
        data: [],
        message: "No history found",
      });
    }

    return res.status(200).json({
      success: true,
      data: chat.messages,
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
 * Fetch all active conversations for the admin
 */
export const getAllConversations = async (req: Request, res: Response) => {
  try {
    const conversations = await ChatModel.find()
      .populate('participants', 'username email role')
      .sort({ updatedAt: -1 });

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
    const participants = [
      new mongoose.Types.ObjectId(senderId),
      new mongoose.Types.ObjectId(receiverId),
    ];

    // Find existing conversation or create new one
    let chat = await ChatModel.findOne({
      participants: { $all: participants },
    });

    if (!chat) {
      chat = new ChatModel({
        participants,
        messages: [],
      });
    }

    // Push new message to nested array
    chat.messages.push({
      senderId: new mongoose.Types.ObjectId(senderId),
      senderName,
      message,
      timestamp: new Date(),
    });

    chat.lastMessage = message;
    await chat.save();
    
    return chat;
  } catch (error) {
    console.error("Error saving message to DB:", error);
    throw error;
  }
};
