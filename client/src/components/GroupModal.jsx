import { useState } from "react";
import useChatStore from "../store/useChatStore";
import { X } from "lucide-react";
import { fileUrl } from "../lib/utils";

const GroupModal = ({ onClose }) => {
  const { searchUsers, searchResults, clearSearch, createGroupChat, allUsers } = useChatStore();
  const [name, setName] = useState("");
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState([]);

  const handleSearch = (q) => {
    setQuery(q);
    if (q.trim()) searchUsers(q);
    else clearSearch();
  };

  const toggleUser = (u) => {
    setSelected((prev) =>
      prev.find((s) => s._id === u._id)
        ? prev.filter((s) => s._id !== u._id)
        : [...prev, u]
    );
  };

  const handleCreate = async () => {
    if (!name.trim() || selected.length < 2) return;
    await createGroupChat(name, selected.map((u) => u._id));
    onClose();
  };

  // Show search results when searching, otherwise show all users
  const usersToShow = query.trim() ? searchResults : allUsers;
  // Filter out already selected users
  const filteredUsers = usersToShow.filter((u) => !selected.find((s) => s._id === u._id));

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Create Group Chat</h3>
          <button className="icon-btn" onClick={onClose}><X size={20} /></button>
        </div>
        <div className="modal-body">
          <div className="form-group">
            <label>Group Name</label>
            <input placeholder="Enter group name" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="form-group">
            <label>Add Members (min 2)</label>
            <input placeholder="Search users..." value={query} onChange={(e) => handleSearch(e.target.value)} />
          </div>

          {selected.length > 0 && (
            <div className="selected-users">
              {selected.map((u) => (
                <span className="selected-chip" key={u._id}>
                  {u.username}
                  <button onClick={() => toggleUser(u)}>×</button>
                </span>
              ))}
            </div>
          )}

          {filteredUsers.map((u) => (
            <div
              key={u._id}
              className="search-result-item"
              onClick={() => toggleUser(u)}
            >
              <div className="search-result-avatar">
                {u.profilePic ? <img src={fileUrl(u.profilePic)} alt="" /> : "👤"}
              </div>
              <div className="search-result-info">
                <h4>{u.username}</h4>
                <p>{u.email}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="modal-footer">
          <button className="btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn-primary" onClick={handleCreate} disabled={!name.trim() || selected.length < 2}>
            Create Group
          </button>
        </div>
      </div>
    </div>
  );
};

export default GroupModal;
