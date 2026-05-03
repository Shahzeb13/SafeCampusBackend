import { Server } from "socket.io";
import { Server as HttpServer } from "http";
import { logger } from "../Utils/logger.js";
import { saveMessageToDb } from "../Controllers/chatController.js";

let io: Server;

export const initSocket = (server: HttpServer) => {
  io = new Server(server, {
    cors: {
      origin: ["http://localhost:3000", "http://localhost:3001", "http://127.0.0.1:3000", "http://127.0.0.1:3001", "http://192.168.1.77:5173"],
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

  io.on("connection", (socket) => {
    logger.info(`🔌 New connection: ${socket.id}`);

    // User joins their own room based on userId for private messaging
    socket.on("join", (userId: string) => {
      socket.join(userId);
      logger.info(`👤 User ${userId} joined room: ${socket.id}`);
      
      // If you want to identify admins specifically, you could check their role here
      // For now, let's just log it.
    });

    // Handle messages
    socket.on("send_message", async (data) => {
      const { senderId, receiverId, message, senderName } = data;
      logger.info(`📩 Message from ${senderName} (${senderId}) to ${receiverId}: ${message}`);
      
      try {
        // Persist message to MongoDB
        await saveMessageToDb(senderId, senderName, receiverId, message);
        
        // Emit to the receiver's room
        io.to(receiverId).emit("receive_message", {
          senderId,
          senderName,
          message,
          timestamp: new Date().toISOString(),
        });

        // SPECIAL CASE: If sending to admin (hardcoded ID or known admin ID)
        // We can also emit to a general 'admins' room if we want all admins to see it
        // Or just ensure the admin is joined to the room they expect.
        
        logger.info(`✅ Message delivered to room ${receiverId}`);
      } catch (error) {
        logger.error(`❌ Failed to save/send message: ${error}`);
      }
    });

    socket.on("disconnect", () => {
      logger.info(`❌ User disconnected: ${socket.id}`);
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
