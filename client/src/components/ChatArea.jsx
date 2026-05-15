import { useEffect, useRef, useState, useCallback } from "react";
import useAuthStore from "../store/useAuthStore";
import useChatStore from "../store/useChatStore";
import MessageInput from "./MessageInput";
import { getChatName, getChatPic, getChatUser, formatTime, formatDate, formatFileSize, getFileIcon, fileUrl } from "../lib/utils";
import { ArrowLeft, Info, Check, CheckCheck, Search, X, ChevronUp, ChevronDown } from "lucide-react";

const ChatArea = ({ className = "", onOpenInfo, onBackMobile }) => {
  const { user } = useAuthStore();
  const { activeChat, messages, fetchMessages, onlineUsers, typingUsers, isLoadingMessages } = useChatStore();
  const bottomRef = useRef(null);
  const messagesRef = useRef(null);

  // Search state
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [matchedIds, setMatchedIds] = useState([]);
  const [activeMatchIdx, setActiveMatchIdx] = useState(-1);

  useEffect(() => {
    if (activeChat) {
      fetchMessages(activeChat._id);
      setShowSearch(false);
      setSearchQuery("");
      setMatchedIds([]);
    }
  }, [activeChat?._id]);

  useEffect(() => {
    if (!showSearch) bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Search logic
  const handleSearchChange = useCallback((q) => {
    setSearchQuery(q);
    if (!q.trim()) {
      setMatchedIds([]);
      setActiveMatchIdx(-1);
      return;
    }
    const lower = q.toLowerCase();
    const ids = messages
      .filter((m) => m.content && m.content.toLowerCase().includes(lower))
      .map((m) => m._id);
    setMatchedIds(ids);
    setActiveMatchIdx(ids.length > 0 ? ids.length - 1 : -1);
    // Scroll to last match
    if (ids.length > 0) scrollToMessage(ids[ids.length - 1]);
  }, [messages]);

  const scrollToMessage = (id) => {
    const el = document.getElementById(`msg-${id}`);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  const goToPrevMatch = () => {
    if (matchedIds.length === 0) return;
    const next = activeMatchIdx > 0 ? activeMatchIdx - 1 : matchedIds.length - 1;
    setActiveMatchIdx(next);
    scrollToMessage(matchedIds[next]);
  };

  const goToNextMatch = () => {
    if (matchedIds.length === 0) return;
    const next = activeMatchIdx < matchedIds.length - 1 ? activeMatchIdx + 1 : 0;
    setActiveMatchIdx(next);
    scrollToMessage(matchedIds[next]);
  };

  const closeSearch = () => {
    setShowSearch(false);
    setSearchQuery("");
    setMatchedIds([]);
    setActiveMatchIdx(-1);
  };

  // Highlight matching text
  const highlightText = (text, msgId) => {
    if (!searchQuery.trim() || !matchedIds.includes(msgId)) return text;
    const lower = text.toLowerCase();
    const qLower = searchQuery.toLowerCase();
    const idx = lower.indexOf(qLower);
    if (idx === -1) return text;
    const isActive = matchedIds[activeMatchIdx] === msgId;
    return (
      <>
        {text.slice(0, idx)}
        <mark className={`search-highlight ${isActive ? "active" : ""}`}>
          {text.slice(idx, idx + searchQuery.length)}
        </mark>
        {text.slice(idx + searchQuery.length)}
      </>
    );
  };

  if (!activeChat) return null;

  const chatUser = getChatUser(activeChat, user._id);
  const isOnline = chatUser && onlineUsers.includes(chatUser._id);
  const typing = typingUsers[activeChat._id];

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
          <button onClick={() => setShowSearch(!showSearch)} title="Search messages"><Search size={20} /></button>
          <button onClick={onOpenInfo}><Info size={20} /></button>
        </div>
      </div>

      {/* Search Bar */}
      {showSearch && (
        <div className="msg-search-bar">
          <Search size={18} className="msg-search-icon" />
          <input
            autoFocus
            placeholder="Search messages..."
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
          />
          {matchedIds.length > 0 && (
            <span className="msg-search-count">
              {activeMatchIdx + 1} of {matchedIds.length}
            </span>
          )}
          <button className="icon-btn-sm" onClick={goToPrevMatch} disabled={matchedIds.length === 0}><ChevronUp size={18} /></button>
          <button className="icon-btn-sm" onClick={goToNextMatch} disabled={matchedIds.length === 0}><ChevronDown size={18} /></button>
          <button className="icon-btn-sm" onClick={closeSearch}><X size={18} /></button>
        </div>
      )}

      <div className="messages-container" ref={messagesRef}>
        {isLoadingMessages ? (
          <div style={{ textAlign: "center", padding: 40, color: "var(--text-secondary)" }}>Loading messages...</div>
        ) : messages.length === 0 ? (
          <div style={{ textAlign: "center", padding: 40, color: "var(--text-secondary)" }}>No messages yet. Say hi! 👋</div>
        ) : (
          messages.map((msg) => {
            const isSent = msg.sender._id === user._id || msg.sender === user._id;
            const isMatched = matchedIds.includes(msg._id);
            const isActiveMatch = matchedIds[activeMatchIdx] === msg._id;
            return (
              <div key={msg._id} id={`msg-${msg._id}`} className={`message-wrapper ${isActiveMatch ? "search-active" : ""}`}>
                {renderDateSep(msg)}
                <div className={`message-bubble ${isSent ? "sent" : "received"} ${isMatched ? "search-matched" : ""}`}>
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

                  {msg.content && <div className="message-text">{highlightText(msg.content, msg._id)}</div>}

                  <div className="message-meta">
                    <span className="message-time">{formatTime(msg.createdAt)}</span>
                    {isSent && (
                      <span className={`message-ticks ${msg.status === "read" ? "read" : ""}`}>
                        {msg.status === "read" ? (
                          <CheckCheck size={16} />
                        ) : msg.status === "delivered" ? (
                          <CheckCheck size={16} />
                        ) : (
                          <Check size={16} />
                        )}
                      </span>
                    )}
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
