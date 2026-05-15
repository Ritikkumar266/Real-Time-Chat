import useAuthStore from "../store/useAuthStore";
import useChatStore from "../store/useChatStore";
import { getChatName, getChatPic, getChatUser, fileUrl } from "../lib/utils";
import { X, UserPlus, LogOut, Trash2 } from "lucide-react";
import { useState } from "react";

const ChatInfoPanel = ({ onClose }) => {
  const { user } = useAuthStore();
  const { activeChat, onlineUsers, addToGroup, removeFromGroup, searchUsers, searchResults, clearSearch } = useChatStore();
  const [addQuery, setAddQuery] = useState("");
  const [showAdd, setShowAdd] = useState(false);

  if (!activeChat) return null;

  const isAdmin = activeChat.isGroupChat && activeChat.groupAdmin?._id === user._id;

  const handleSearch = (q) => {
    setAddQuery(q);
    if (q.trim()) searchUsers(q);
    else clearSearch();
  };

  const handleAdd = async (uid) => {
    await addToGroup(activeChat._id, uid);
    setAddQuery("");
    clearSearch();
    setShowAdd(false);
  };

  const handleRemove = async (uid) => {
    if (window.confirm("Remove this member?")) {
      await removeFromGroup(activeChat._id, uid);
    }
  };

  const handleLeave = async () => {
    if (window.confirm("Leave this group?")) {
      await removeFromGroup(activeChat._id, user._id);
      onClose();
    }
  };

  return (
    <div className="chat-info-panel">
      <div className="chat-info-header">
        <button className="icon-btn" onClick={onClose}><X size={20} /></button>
        <h3>{activeChat.isGroupChat ? "Group Info" : "Contact Info"}</h3>
      </div>

      <div className="chat-info-profile">
        <div className="chat-info-avatar">
          {getChatPic(activeChat, user._id) ? (
            <img src={fileUrl(getChatPic(activeChat, user._id))} alt="" />
          ) : activeChat.isGroupChat ? "👥" : "👤"}
        </div>
        <div className="chat-info-name">{getChatName(activeChat, user._id)}</div>
        {!activeChat.isGroupChat && (
          <div className="chat-info-detail">
            {getChatUser(activeChat, user._id)?.email}
          </div>
        )}
        {activeChat.isGroupChat && (
          <div className="chat-info-detail">{activeChat.users.length} members</div>
        )}
      </div>

      {!activeChat.isGroupChat && (() => {
        const cu = getChatUser(activeChat, user._id);
        return cu?.about ? (
          <div className="settings-section">
            <label>About</label>
            <div className="value">{cu.about}</div>
          </div>
        ) : null;
      })()}

      {activeChat.isGroupChat && (
        <div className="members-section">
          <h4>
            Members
            {isAdmin && (
              <button className="icon-btn" style={{ display: "inline-flex", marginLeft: 8, width: 28, height: 28 }} onClick={() => setShowAdd(!showAdd)}>
                <UserPlus size={16} />
              </button>
            )}
          </h4>

          {showAdd && (
            <div style={{ marginBottom: 12 }}>
              <input placeholder="Search users to add..." value={addQuery} onChange={(e) => handleSearch(e.target.value)} style={{ width: "100%", padding: 8, background: "var(--bg-input)", border: "1px solid var(--border)", borderRadius: 8, color: "var(--text-primary)", outline: "none", fontSize: 13 }} />
              {searchResults.map((u) => (
                <div key={u._id} className="search-result-item" onClick={() => handleAdd(u._id)}>
                  <div className="search-result-avatar">{u.profilePic ? <img src={fileUrl(u.profilePic)} alt="" /> : "👤"}</div>
                  <div className="search-result-info"><h4>{u.username}</h4></div>
                </div>
              ))}
            </div>
          )}

          {activeChat.users.map((m) => (
            <div key={m._id} className="member-item">
              <div className="member-avatar">
                {m.profilePic ? <img src={fileUrl(m.profilePic)} alt="" /> : "👤"}
                {onlineUsers.includes(m._id) && <span className="online-dot" style={{ width: 8, height: 8, bottom: 0, right: 0 }} />}
              </div>
              <span className="member-name">{m._id === user._id ? "You" : m.username}</span>
              {activeChat.groupAdmin?._id === m._id && <span className="member-badge">Admin</span>}
              {isAdmin && m._id !== user._id && (
                <button className="icon-btn" style={{ width: 28, height: 28 }} onClick={() => handleRemove(m._id)}>
                  <Trash2 size={14} />
                </button>
              )}
            </div>
          ))}

          {!isAdmin && (
            <button className="settings-btn danger" onClick={handleLeave} style={{ marginTop: 12 }}>
              <LogOut size={18} /> Leave Group
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default ChatInfoPanel;
