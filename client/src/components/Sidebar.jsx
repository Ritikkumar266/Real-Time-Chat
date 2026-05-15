import { useState } from "react";
import useAuthStore from "../store/useAuthStore";
import useChatStore from "../store/useChatStore";
import { Search, Users, MessageSquarePlus } from "lucide-react";
import { getChatName, getChatPic, getChatUser, formatTime, fileUrl } from "../lib/utils";

const Sidebar = ({ onOpenSettings, onNewGroup }) => {
  const { user } = useAuthStore();
  const { chats, activeChat, setActiveChat, searchUsers, searchResults, clearSearch, accessChat, onlineUsers, typingUsers, isLoadingChats, allUsers } = useChatStore();
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);

  const handleSearch = (q) => {
    setSearchQuery(q);
    if (q.trim()) {
      setIsSearching(true);
      searchUsers(q);
    } else {
      setIsSearching(false);
      clearSearch();
    }
  };

  const handleSelectUser = async (u) => {
    await accessChat(u._id);
    setSearchQuery("");
    setIsSearching(false);
    clearSearch();
  };

  const handleSelectChat = (chat) => {
    setActiveChat(chat);
    setSearchQuery("");
    setIsSearching(false);
    clearSearch();
  };

  const isOnline = (chat) => {
    if (chat.isGroupChat) return false;
    const other = getChatUser(chat, user._id);
    return other && onlineUsers.includes(other._id);
  };

  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <div className="sidebar-header-left">
          <div className="sidebar-user-avatar" onClick={onOpenSettings}>
            {user.profilePic ? <img src={fileUrl(user.profilePic)} alt="" /> : "👤"}
          </div>
          <span className="sidebar-title">ZingChat</span>
        </div>
        <div className="sidebar-actions">
          <button title="New Group" onClick={onNewGroup}><Users size={20} /></button>
          <button title="New Chat" onClick={() => { setIsSearching(true); }}><MessageSquarePlus size={20} /></button>
        </div>
      </div>

      <div className="sidebar-search">
        <div className="search-wrapper">
          <Search />
          <input
            placeholder="Search or start new chat"
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            onFocus={() => searchQuery && setIsSearching(true)}
          />
        </div>
      </div>

      <div className="chat-list">
        {isSearching && searchResults.length > 0 ? (
          searchResults.map((u) => (
            <div key={u._id} className="chat-item" onClick={() => handleSelectUser(u)}>
              <div className="chat-avatar">
                {u.profilePic ? <img src={fileUrl(u.profilePic)} alt="" /> : "👤"}
              </div>
              <div className="chat-info">
                <div className="chat-info-top">
                  <span className="chat-name">{u.username}</span>
                </div>
                <div className="chat-last-msg">{u.email}</div>
              </div>
            </div>
          ))
        ) : isSearching && searchQuery ? (
          <div style={{ padding: 20, textAlign: "center", color: "var(--text-secondary)" }}>No users found</div>
        ) : isLoadingChats ? (
          <div style={{ padding: 20, textAlign: "center", color: "var(--text-secondary)" }}>Loading chats...</div>
        ) : (
          <>
            {/* Existing Chats */}
            {chats.length > 0 && chats.map((chat) => {
              const typing = typingUsers[chat._id];
              return (
                <div
                  key={chat._id}
                  className={`chat-item ${activeChat?._id === chat._id ? "active" : ""}`}
                  onClick={() => handleSelectChat(chat)}
                >
                  <div className="chat-avatar">
                    {getChatPic(chat, user._id) ? (
                      <img src={fileUrl(getChatPic(chat, user._id))} alt="" />
                    ) : chat.isGroupChat ? "👥" : "👤"}
                    {isOnline(chat) && <span className="online-dot" />}
                  </div>
                  <div className="chat-info">
                    <div className="chat-info-top">
                      <span className="chat-name">{getChatName(chat, user._id)}</span>
                      {chat.latestMessage && (
                        <span className="chat-time">{formatTime(chat.latestMessage.createdAt || chat.updatedAt)}</span>
                      )}
                    </div>
                    <div className="chat-last-msg">
                      {typing ? (
                        <span className="typing-indicator">{typing.username} is typing...</span>
                      ) : chat.latestMessage ? (
                        chat.latestMessage.content || (chat.latestMessage.messageType === "image" ? "📷 Photo" : "📎 File")
                      ) : "Start a conversation"}
                    </div>
                  </div>
                </div>
              );
            })}

            {/* All Users Section */}
            {allUsers.length > 0 && (
              <>
                <div style={{ padding: '10px 16px 6px', fontSize: 13, fontWeight: 600, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.5px', borderTop: '1px solid var(--border)', marginTop: 4 }}>
                  All Users
                </div>
                {allUsers.map((u) => (
                  <div key={u._id} className="chat-item" onClick={() => handleSelectUser(u)}>
                    <div className="chat-avatar">
                      {u.profilePic ? <img src={fileUrl(u.profilePic)} alt="" /> : "👤"}
                      {onlineUsers.includes(u._id) && <span className="online-dot" />}
                    </div>
                    <div className="chat-info">
                      <div className="chat-info-top">
                        <span className="chat-name">{u.username}</span>
                      </div>
                      <div className="chat-last-msg">{u.about || u.email}</div>
                    </div>
                  </div>
                ))}
              </>
            )}

            {chats.length === 0 && allUsers.length === 0 && (
              <div style={{ padding: 20, textAlign: "center", color: "var(--text-secondary)" }}>No users yet. Invite friends to ZingChat!</div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Sidebar;
