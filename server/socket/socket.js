import { Server } from "socket.io";
import User from "../models/User.js";

// Map userId → socketId for tracking online users
const onlineUsers = new Map();

const setupSocket = (server) => {
  const io = new Server(server, {
    cors: {
      origin: process.env.NODE_ENV === "production"
        ? undefined
        : (process.env.CLIENT_URL || "http://localhost:5173"),
      credentials: true,
    },
    pingTimeout: 60000,
  });

  io.on("connection", (socket) => {
    console.log(`🔌 User connected: ${socket.id}`);

    // User comes online
    socket.on("setup", async (userId) => {
      socket.userId = userId;
      socket.join(userId); // personal room for DMs
      onlineUsers.set(userId, socket.id);

      // Update DB
      await User.findByIdAndUpdate(userId, { isOnline: true });

      // Broadcast online status
      io.emit("user_online", { userId, isOnline: true });

      // Send current online users list
      socket.emit("online_users", Array.from(onlineUsers.keys()));
    });

    // Join a chat room
    socket.on("join_chat", (chatId) => {
      socket.join(chatId);
      console.log(`👤 User joined chat room: ${chatId}`);
    });

    // Leave a chat room
    socket.on("leave_chat", (chatId) => {
      socket.leave(chatId);
    });

    // New message — broadcast to chat room
    socket.on("new_message", (message) => {
      const chat = message.chat;

      if (!chat || !chat.users) return;

      chat.users.forEach((user) => {
        // Don't send back to sender
        if (user._id === message.sender._id) return;
        socket.to(user._id).emit("message_received", message);
      });
    });

    // Typing indicator
    socket.on("typing", ({ chatId, userId, username }) => {
      socket.to(chatId).emit("typing", { chatId, userId, username });
    });

    socket.on("stop_typing", ({ chatId, userId }) => {
      socket.to(chatId).emit("stop_typing", { chatId, userId });
    });

    // Notification for new chat
    socket.on("new_chat_created", (chat) => {
      chat.users.forEach((user) => {
        if (user._id !== socket.userId) {
          socket.to(user._id).emit("chat_created", chat);
        }
      });
    });

    // Group update notification
    socket.on("group_updated", (chat) => {
      chat.users.forEach((user) => {
        socket.to(user._id).emit("group_updated", chat);
      });
    });

    // Disconnect
    socket.on("disconnect", async () => {
      console.log(`❌ User disconnected: ${socket.id}`);

      if (socket.userId) {
        onlineUsers.delete(socket.userId);

        await User.findByIdAndUpdate(socket.userId, {
          isOnline: false,
          lastSeen: new Date(),
        });

        io.emit("user_online", {
          userId: socket.userId,
          isOnline: false,
          lastSeen: new Date(),
        });
      }
    });
  });

  return io;
};

export default setupSocket;
