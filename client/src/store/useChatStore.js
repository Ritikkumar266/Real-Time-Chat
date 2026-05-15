import { create } from "zustand";
import { io } from "socket.io-client";
import API, { SERVER_URL } from "../lib/api";
import toast from "react-hot-toast";

const SOCKET_URL = SERVER_URL || window.location.origin;

const useChatStore = create((set, get) => ({
  socket: null,
  chats: [],
  activeChat: null,
  messages: [],
  onlineUsers: [],
  typingUsers: {},
  isLoadingChats: false,
  isLoadingMessages: false,
  searchResults: [],
  allUsers: [],

  // Socket connection
  connectSocket: (userId) => {
    const { socket } = get();
    if (socket?.connected) return;

    const newSocket = io(SOCKET_URL, {
      withCredentials: true,
    });

    newSocket.on("connect", () => {
      console.log("Socket connected");
      newSocket.emit("setup", userId);
    });

    newSocket.on("online_users", (users) => {
      set({ onlineUsers: users });
    });

    newSocket.on("user_online", ({ userId: uid, isOnline }) => {
      set((state) => ({
        onlineUsers: isOnline
          ? [...new Set([...state.onlineUsers, uid])]
          : state.onlineUsers.filter((id) => id !== uid),
      }));
    });

    newSocket.on("message_received", (message) => {
      const { activeChat, chats } = get();

      // If the message is for the active chat, add it to messages
      if (activeChat && (message.chat._id === activeChat._id || message.chat === activeChat._id)) {
        set((state) => ({
          messages: [...state.messages, message],
        }));
      }

      // Update chat list with latest message
      set((state) => {
        const chatId = message.chat._id || message.chat;
        const updatedChats = state.chats.map((c) =>
          c._id === chatId ? { ...c, latestMessage: message } : c
        );
        // Move chat to top
        const chatIndex = updatedChats.findIndex((c) => c._id === chatId);
        if (chatIndex > 0) {
          const [chat] = updatedChats.splice(chatIndex, 1);
          updatedChats.unshift(chat);
        }
        return { chats: updatedChats };
      });

      // Show notification if not active chat
      if (!activeChat || (message.chat._id !== activeChat._id && message.chat !== activeChat._id)) {
        toast(`💬 ${message.sender.username}: ${message.content || "Sent a file"}`, {
          icon: "🔔",
          duration: 3000,
        });
      }
    });

    newSocket.on("chat_created", (chat) => {
      set((state) => ({
        chats: [chat, ...state.chats],
      }));
    });

    newSocket.on("group_updated", (chat) => {
      set((state) => ({
        chats: state.chats.map((c) => (c._id === chat._id ? chat : c)),
        activeChat: state.activeChat?._id === chat._id ? chat : state.activeChat,
      }));
    });

    newSocket.on("typing", ({ chatId, userId: uid, username }) => {
      set((state) => ({
        typingUsers: { ...state.typingUsers, [chatId]: { userId: uid, username } },
      }));
    });

    newSocket.on("stop_typing", ({ chatId }) => {
      set((state) => {
        const updated = { ...state.typingUsers };
        delete updated[chatId];
        return { typingUsers: updated };
      });
    });

    set({ socket: newSocket });
  },

  disconnectSocket: () => {
    const { socket } = get();
    if (socket) {
      socket.disconnect();
      set({ socket: null });
    }
  },

  // Fetch all chats
  fetchChats: async () => {
    set({ isLoadingChats: true });
    try {
      const res = await API.get("/chats");
      set({ chats: res.data });
    } catch (error) {
      toast.error("Failed to load chats");
    } finally {
      set({ isLoadingChats: false });
    }
  },

  // Set active chat and join room
  setActiveChat: (chat) => {
    const { socket, activeChat } = get();

    // Leave previous room
    if (activeChat && socket) {
      socket.emit("leave_chat", activeChat._id);
    }

    // Join new room
    if (chat && socket) {
      socket.emit("join_chat", chat._id);
    }

    set({ activeChat: chat, messages: [] });
  },

  // Fetch messages for active chat
  fetchMessages: async (chatId) => {
    set({ isLoadingMessages: true });
    try {
      const res = await API.get(`/messages/${chatId}`);
      set({ messages: res.data.messages });
    } catch (error) {
      toast.error("Failed to load messages");
    } finally {
      set({ isLoadingMessages: false });
    }
  },

  // Send a message
  sendMessage: async (chatId, content, file) => {
    try {
      const formData = new FormData();
      formData.append("chatId", chatId);
      if (content) formData.append("content", content);
      if (file) formData.append("file", file);

      const res = await API.post("/messages", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      const message = res.data;

      // Add to messages
      set((state) => ({
        messages: [...state.messages, message],
      }));

      // Update chat list
      set((state) => {
        const updatedChats = state.chats.map((c) =>
          c._id === chatId ? { ...c, latestMessage: message } : c
        );
        const chatIndex = updatedChats.findIndex((c) => c._id === chatId);
        if (chatIndex > 0) {
          const [chat] = updatedChats.splice(chatIndex, 1);
          updatedChats.unshift(chat);
        }
        return { chats: updatedChats };
      });

      // Emit via socket
      const { socket } = get();
      if (socket) {
        socket.emit("new_message", message);
      }

      return message;
    } catch (error) {
      toast.error("Failed to send message");
      return null;
    }
  },

  // Access / create a 1-on-1 chat
  accessChat: async (userId) => {
    try {
      const res = await API.post("/chats", { userId });
      const chat = res.data;

      // Add to chats if not exists
      set((state) => {
        const exists = state.chats.find((c) => c._id === chat._id);
        if (!exists) {
          return { chats: [chat, ...state.chats], activeChat: chat };
        }
        return { activeChat: chat };
      });

      // Notify via socket
      const { socket } = get();
      if (socket) {
        socket.emit("new_chat_created", chat);
      }

      return chat;
    } catch (error) {
      toast.error("Failed to access chat");
      return null;
    }
  },

  // Create group chat
  createGroupChat: async (name, userIds) => {
    try {
      const res = await API.post("/chats/group", { name, users: userIds });
      const chat = res.data;

      set((state) => ({
        chats: [chat, ...state.chats],
        activeChat: chat,
      }));

      const { socket } = get();
      if (socket) {
        socket.emit("new_chat_created", chat);
      }

      toast.success("Group created! 🎉");
      return chat;
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to create group");
      return null;
    }
  },

  // Add to group
  addToGroup: async (chatId, userId) => {
    try {
      const res = await API.put(`/chats/group/${chatId}/add`, { userId });
      set((state) => ({
        chats: state.chats.map((c) => (c._id === chatId ? res.data : c)),
        activeChat: state.activeChat?._id === chatId ? res.data : state.activeChat,
      }));
      toast.success("Member added!");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to add member");
    }
  },

  // Remove from group
  removeFromGroup: async (chatId, userId) => {
    try {
      const res = await API.put(`/chats/group/${chatId}/remove`, { userId });
      set((state) => ({
        chats: state.chats.map((c) => (c._id === chatId ? res.data : c)),
        activeChat: state.activeChat?._id === chatId ? res.data : state.activeChat,
      }));
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to remove member");
    }
  },

  // Search users
  searchUsers: async (query) => {
    if (!query.trim()) {
      set({ searchResults: [] });
      return;
    }
    try {
      const res = await API.get(`/users/search?q=${query}`);
      set({ searchResults: res.data });
    } catch (error) {
      set({ searchResults: [] });
    }
  },

  clearSearch: () => set({ searchResults: [] }),

  // Fetch all registered users
  fetchAllUsers: async () => {
    try {
      const res = await API.get("/users");
      set({ allUsers: res.data });
    } catch (error) {
      console.error("Failed to fetch users");
    }
  },

  // Typing events
  emitTyping: (chatId, userId, username) => {
    const { socket } = get();
    if (socket) socket.emit("typing", { chatId, userId, username });
  },

  emitStopTyping: (chatId, userId) => {
    const { socket } = get();
    if (socket) socket.emit("stop_typing", { chatId, userId });
  },
}));

export default useChatStore;
