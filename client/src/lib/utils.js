import { SERVER_URL } from "./api";

// Resolve file paths — if it starts with /uploads, prepend server URL
export const fileUrl = (path) => {
  if (!path) return "";
  if (path.startsWith("http")) return path;
  return `${SERVER_URL}${path}`;
};

export const formatTime = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
};

export const formatDate = (dateString) => {
  const date = new Date(dateString);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (date.toDateString() === today.toDateString()) return "Today";
  if (date.toDateString() === yesterday.toDateString()) return "Yesterday";

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

export const formatLastSeen = (dateString) => {
  if (!dateString) return "";
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);

  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  return formatDate(dateString);
};

export const formatFileSize = (bytes) => {
  if (!bytes) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
};

export const getFileIcon = (fileName) => {
  if (!fileName) return "📄";
  const ext = fileName.split(".").pop().toLowerCase();
  const icons = {
    pdf: "📕",
    doc: "📘",
    docx: "📘",
    xls: "📗",
    xlsx: "📗",
    ppt: "📙",
    pptx: "📙",
    txt: "📄",
    zip: "🗜️",
    rar: "🗜️",
  };
  return icons[ext] || "📄";
};

export const getChatName = (chat, currentUserId) => {
  if (chat.isGroupChat) return chat.chatName;
  const other = chat.users.find((u) => u._id !== currentUserId);
  return other?.username || "Unknown";
};

export const getChatPic = (chat, currentUserId) => {
  if (chat.isGroupChat) return chat.groupPic || "";
  const other = chat.users.find((u) => u._id !== currentUserId);
  return other?.profilePic || "";
};

export const getChatUser = (chat, currentUserId) => {
  if (chat.isGroupChat) return null;
  return chat.users.find((u) => u._id !== currentUserId);
};
