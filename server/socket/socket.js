import { Server } from "socket.io";
import User from "../models/User.js";
import Message from "../models/Message.js";

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

      await User.findByIdAndUpdate(userId, { isOnline: true });
      io.emit("user_online", { userId, isOnline: true });
      socket.emit("online_users", Array.from(onlineUsers.keys()));
    });

    // Join a chat room
    socket.on("join_chat", (chatId) => {
      socket.join(chatId);
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
        if (user._id === message.sender._id) return;

        // If recipient is online, mark as delivered
        if (onlineUsers.has(user._id)) {
          Message.findByIdAndUpdate(message._id, {
            status: "delivered",
            $addToSet: { deliveredTo: user._id },
          }).exec();

          // Send delivered message with updated status
          const deliveredMsg = { ...message, status: "delivered" };
          socket.to(user._id).emit("message_received", deliveredMsg);

          // Notify sender about delivery
          socket.emit("message_status_update", {
            messageId: message._id,
            status: "delivered",
          });
        } else {
          socket.to(user._id).emit("message_received", message);
        }
      });
    });

    // Mark messages as delivered when user comes online
    socket.on("mark_delivered", async ({ chatId, userId }) => {
      try {
        await Message.updateMany(
          { chat: chatId, sender: { $ne: userId }, status: "sent" },
          { status: "delivered", $addToSet: { deliveredTo: userId } }
        );

        // Notify senders
        const updated = await Message.find({ chat: chatId, status: "delivered" })
          .select("_id sender status");
        updated.forEach((msg) => {
          socket.to(msg.sender.toString()).emit("message_status_update", {
            messageId: msg._id,
            status: "delivered",
          });
        });
      } catch (err) {
        console.error("mark_delivered error:", err.message);
      }
    });

    // Mark messages as read when user opens the chat
    socket.on("mark_read", async ({ chatId, userId }) => {
      try {
        const result = await Message.updateMany(
          { chat: chatId, sender: { $ne: userId }, status: { $ne: "read" } },
          { status: "read", $addToSet: { readBy: userId } }
        );

        if (result.modifiedCount > 0) {
          // Get all updated messages to notify senders
          const readMsgs = await Message.find({ chat: chatId, sender: { $ne: userId }, status: "read" })
            .select("_id sender");
          
          readMsgs.forEach((msg) => {
            socket.to(msg.sender.toString()).emit("message_status_update", {
              messageId: msg._id,
              status: "read",
            });
          });

          // Also broadcast to chat room
          socket.to(chatId).emit("messages_read", { chatId, userId });
        }
      } catch (err) {
        console.error("mark_read error:", err.message);
      }
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
