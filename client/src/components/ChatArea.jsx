import { useEffect, useRef } from "react";
import useAuthStore from "../store/useAuthStore";
import useChatStore from "../store/useChatStore";
import MessageInput from "./MessageInput";
import { getChatName, getChatPic, getChatUser, formatTime, formatDate, formatFileSize, getFileIcon, fileUrl } from "../lib/utils";
import { ArrowLeft, MoreVertical, Info } from "lucide-react";

const ChatArea = ({ className = "", onOpenInfo, onBackMobile }) => {
  const { user } = useAuthStore();
  const { activeChat, messages, fetchMessages, onlineUsers, typingUsers, isLoadingMessages } = useChatStore();
  const bottomRef = useRef(null);

  useEffect(() => {
    if (activeChat) fetchMessages(activeChat._id);
  }, [activeChat?._id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  if (!activeChat) return null;

  const chatUser = getChatUser(activeChat, user._id);
  const isOnline = chatUser && onlineUsers.includes(chatUser._id);
  const typing = typingUsers[activeChat._id];

  // Group messages by date
  let lastDate = "";
  const renderDateSep = (msg) => {
    const d = formatDate(msg.createdAt);
    if (d !== lastDate) { lastDate = d; return <div className="date-separator"><span>{d}</span></div>; }
    return null;
  };

  return (
    <div className={`chat-area ${className}`}>
      <div className="chat-area-header">
        <div className="chat-area-header-info" onClick={onOpenInfo}>
          <button className="icon-btn" onClick={(e) => { e.stopPropagation(); onBackMobile(); }} style={{ display: "none" }}>
            <ArrowLeft size={20} />
          </button>
          <div className="chat-area-avatar">
            {getChatPic(activeChat, user._id) ? (
              <img src={fileUrl(getChatPic(activeChat, user._id))} alt="" />
            ) : activeChat.isGroupChat ? "👥" : "👤"}
          </div>
          <div>
            <div className="chat-area-name">{getChatName(activeChat, user._id)}</div>
            <div className={`chat-area-status ${isOnline ? "online" : ""}`}>
              {typing ? `${typing.username} is typing...`
                : activeChat.isGroupChat ? `${activeChat.users.length} members`
                : isOnline ? "online" : chatUser ? "offline" : ""}
            </div>
          </div>
        </div>
        <div className="sidebar-actions">
          <button onClick={onOpenInfo}><Info size={20} /></button>
        </div>
      </div>

      <div className="messages-container">
        {isLoadingMessages ? (
          <div style={{ textAlign: "center", padding: 40, color: "var(--text-secondary)" }}>Loading messages...</div>
        ) : messages.length === 0 ? (
          <div style={{ textAlign: "center", padding: 40, color: "var(--text-secondary)" }}>No messages yet. Say hi! 👋</div>
        ) : (
          messages.map((msg) => {
            const isSent = msg.sender._id === user._id || msg.sender === user._id;
            return (
              <div key={msg._id}>
                {renderDateSep(msg)}
                <div className={`message-bubble ${isSent ? "sent" : "received"}`}>
                  {!isSent && activeChat.isGroupChat && (
                    <div className="message-sender">{msg.sender.username}</div>
                  )}

                  {msg.messageType === "image" && msg.fileUrl && (
                    <div className="message-image">
                      <a href={fileUrl(msg.fileUrl)} target="_blank" rel="noreferrer">
                        <img src={fileUrl(msg.fileUrl)} alt={msg.fileName || "image"} />
                      </a>
                    </div>
                  )}

                  {msg.messageType === "file" && msg.fileUrl && (
                    <a href={fileUrl(msg.fileUrl)} target="_blank" rel="noreferrer" className="message-file" style={{ textDecoration: "none" }}>
                      <span className="file-icon">{getFileIcon(msg.fileName)}</span>
                      <div className="file-details">
                        <div className="file-name">{msg.fileName}</div>
                        <div className="file-size">{formatFileSize(msg.fileSize)}</div>
                      </div>
                    </a>
                  )}

                  {msg.content && <div className="message-text">{msg.content}</div>}

                  <div className="message-meta">
                    <span className="message-time">{formatTime(msg.createdAt)}</span>
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      <MessageInput />
    </div>
  );
};

export default ChatArea;
