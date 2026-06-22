import { Server } from "socket.io";
import { Server as HttpServer } from "http";
import jwt from "jsonwebtoken";
import { logger } from "../Utils/logger.js";
import { saveMessageToDb } from "../Controllers/chatController.js";
import UserModel from "../Models/userModel.js";
import { MessageModel } from "../Models/chatModel.js";
import { jwtPayLoad } from "../Types/jwtPayloadType.js";

let io: Server;
const onlineUsers = new Set<string>(); // Set of authenticated user IDs who are currently online

export const initSocket = (server: HttpServer) => {
  io = new Server(server, {
    cors: {
      origin: ["http://localhost:3000", "http://localhost:3001", "http://127.0.0.1:3000", "http://127.0.0.1:3001", "http://192.168.1.77:5173"],
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

  // 1. Socket.IO Connection Authentication Middleware (JWT Validation)
  io.use((socket, next) => {
    try {
      let token = socket.handshake.auth?.token || socket.handshake.query?.token;
      
      // Fallback to Authorization Header
      if (!token && socket.handshake.headers?.authorization) {
        const parts = socket.handshake.headers.authorization.split(" ");
        if (parts.length === 2 && parts[0] === "Bearer") {
          token = parts[1];
        }
      }

      if (!token) {
        logger.error("🔌 Socket Connection Refused: Token missing");
        return next(new Error("Authentication error: Token missing"));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as jwtPayLoad;
      socket.data.user = decoded;
      next();
    } catch (error) {
      logger.error(`🔌 Socket Connection Refused: JWT invalid - ${error}`);
      return next(new Error("Authentication error: JWT invalid"));
    }
  });

  io.on("connection", async (socket) => {
    const user = socket.data.user;
    if (!user || !user.id) {
      return socket.disconnect();
    }

    const userId = user.id;
    const campusId = user.campusId;
    const campusRoom = `campus_${campusId}`;

    logger.info(`🔌 Secure connection established: ${socket.id} (User: ${userId}, Campus: ${campusId})`);

    // 2. Room Joins
    socket.join(userId); // Join private room for targeted events
    logger.info(`🏠 Socket ${socket.id} joined private room: "${userId}"`);
    if (campusId) {
      socket.join(campusRoom); // Join campus room for campus-scoped broadcasts (like online/offline status)
      
      // Add to online tracking
      onlineUsers.add(userId);
      // Broadcast online status to others on the same campus
      socket.to(campusRoom).emit("user_status", { userId, status: "online" });
    }

    // Handle initial join event (for backwards compatibility with existing frontend code)
    socket.on("join", (joinedUserId: string) => {
      if (joinedUserId === userId) {
        logger.info(`👤 User ${userId} joined room: ${socket.id}`);
      }
    });

    // 3. Handle Send Message Event
    socket.on("send_message", async (data) => {
      const { receiverId, message } = data;
      logger.info(`📩 Message request from ${userId} to ${receiverId}`);

      try {
        if (!message || !message.trim()) {
          return socket.emit("error", "Message content cannot be empty");
        }

        const senderProfile = await UserModel.findById(userId);
        const receiverProfile = await UserModel.findById(receiverId);

        if (!senderProfile || !receiverProfile) {
          return socket.emit("error", "Sender or receiver not found");
        }

        // Campus Isolation Check
        if (senderProfile.campusId?.toString() !== receiverProfile.campusId?.toString()) {
          logger.warn(`⚠️ Blocked cross-campus chat attempt from ${userId} to ${receiverId}`);
          return socket.emit("error", "Campus isolation restriction: cross-campus messages are not allowed");
        }

        // Save message to DB (Updates/Creates Conversation too)
        const savedMsg = await saveMessageToDb(userId, senderProfile.username, receiverId, message.trim());

        const payload = {
          _id: savedMsg._id,
          conversationId: savedMsg.conversationId,
          senderId: userId,
          senderName: senderProfile.username,
          message: savedMsg.message,
          isRead: false,
          timestamp: savedMsg.createdAt.toISOString(),
        };

        // Debug: Check how many sockets are in the receiver's room
        const receiverRoom = io.sockets.adapter.rooms.get(receiverId);
        const receiverSocketCount = receiverRoom ? receiverRoom.size : 0;
        logger.info(`🎯 Delivering to room "${receiverId}" — ${receiverSocketCount} socket(s) connected`);
        if (receiverSocketCount === 0) {
          logger.warn(`⚠️ Receiver ${receiverId} has NO connected sockets — message saved but NOT delivered in real-time`);
        }

        // Deliver to receiver and sender private rooms
        io.to(receiverId).emit("receive_message", payload);
        socket.emit("message_sent", payload);

        logger.info(`✅ Message saved & emit fired from ${userId} → ${receiverId}`);
      } catch (error: any) {
        logger.error(`❌ Failed to process send_message: ${error.message}`);
        socket.emit("error", "Failed to send message: " + error.message);
      }
    });

    // 4. Handle Typing Indicators
    socket.on("typing", (data) => {
      const { receiverId } = data;
      io.to(receiverId).emit("user_typing", { senderId: userId });
    });

    socket.on("stop_typing", (data) => {
      const { receiverId } = data;
      io.to(receiverId).emit("user_stop_typing", { senderId: userId });
    });

    // 5. Handle Read Receipts
    socket.on("mark_read", async (data) => {
      const { conversationId, senderId } = data;
      try {
        await MessageModel.updateMany(
          { conversationId, senderId, isRead: false },
          { $set: { isRead: true, readAt: new Date() } }
        );
        // Notify the sender that their messages have been read
        io.to(senderId).emit("messages_read", { conversationId, readerId: userId });
      } catch (error: any) {
        logger.error(`❌ Failed to mark messages as read: ${error.message}`);
      }
    });

    // 6. Handle Disconnection
    socket.on("disconnect", () => {
      logger.info(`❌ Connection closed: ${socket.id} (User: ${userId})`);
      if (campusId) {
        onlineUsers.delete(userId);
        // Notify others in the same campus about the offline status change
        socket.to(campusRoom).emit("user_status", { userId, status: "offline" });
      }
    });
  });

  return io;
};

export const getIO = () => {
  if (!io) {
    throw new Error("Socket.io not initialized!");
  }
  return io;
};

// Helper to check if a user is online
export const isUserOnline = (userId: string): boolean => {
  return onlineUsers.has(userId);
};
