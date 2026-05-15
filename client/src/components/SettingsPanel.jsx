import { useState, useRef } from "react";
import useAuthStore from "../store/useAuthStore";
import { fileUrl } from "../lib/utils";
import { ArrowLeft, Camera, Lock, LogOut } from "lucide-react";

const SettingsPanel = ({ onClose }) => {
  const { user, updateProfile, changePassword, logout, isLoading } = useAuthStore();
  const [about, setAbout] = useState(user.about || "");
  const [editAbout, setEditAbout] = useState(false);
  const [showPwForm, setShowPwForm] = useState(false);
  const [pw, setPw] = useState({ current: "", newPw: "", confirm: "" });
  const fileRef = useRef(null);

  const handlePicChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const fd = new FormData();
    fd.append("profilePic", file);
    await updateProfile(fd);
  };

  const handleAboutSave = async () => {
    const fd = new FormData();
    fd.append("about", about);
    await updateProfile(fd);
    setEditAbout(false);
  };

  const handlePasswordChange = async () => {
    if (pw.newPw !== pw.confirm) { alert("Passwords don't match"); return; }
    const ok = await changePassword(pw.current, pw.newPw);
    if (ok) { setShowPwForm(false); setPw({ current: "", newPw: "", confirm: "" }); }
  };

  return (
    <div className="settings-panel">
      <div className="settings-header">
        <button className="icon-btn" onClick={onClose}><ArrowLeft size={20} /></button>
        <h3>Profile</h3>
      </div>

      <div className="profile-section">
        <div className="profile-avatar-large" onClick={() => fileRef.current?.click()}>
          {user.profilePic ? <img src={fileUrl(user.profilePic)} alt="" /> : "👤"}
        </div>
        <input type="file" ref={fileRef} hidden accept="image/*" onChange={handlePicChange} />
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 20, fontWeight: 600 }}>{user.username}</div>
          <div style={{ fontSize: 13, color: "var(--text-secondary)", marginTop: 4 }}>{user.email}</div>
        </div>
      </div>

      <div className="settings-section">
        <label>About</label>
        {editAbout ? (
          <div style={{ display: "flex", gap: 8, marginTop: 6 }}>
            <input value={about} onChange={(e) => setAbout(e.target.value)} style={{ flex: 1 }} />
            <button className="btn-primary" onClick={handleAboutSave} disabled={isLoading} style={{ padding: "8px 14px" }}>Save</button>
          </div>
        ) : (
          <div className="value" onClick={() => setEditAbout(true)} style={{ cursor: "pointer" }}>
            {user.about || "Click to add about"} ✏️
          </div>
        )}
      </div>

      <button className="settings-btn" onClick={() => setShowPwForm(!showPwForm)}>
        <Lock size={18} /> Change Password
      </button>

      {showPwForm && (
        <div className="settings-section" style={{ borderTop: "none" }}>
          <div className="form-group" style={{ marginBottom: 10 }}>
            <input type="password" placeholder="Current password" value={pw.current} onChange={(e) => setPw({ ...pw, current: e.target.value })} />
          </div>
          <div className="form-group" style={{ marginBottom: 10 }}>
            <input type="password" placeholder="New password" value={pw.newPw} onChange={(e) => setPw({ ...pw, newPw: e.target.value })} />
          </div>
          <div className="form-group" style={{ marginBottom: 10 }}>
            <input type="password" placeholder="Confirm new password" value={pw.confirm} onChange={(e) => setPw({ ...pw, confirm: e.target.value })} />
          </div>
          <button className="btn-primary" onClick={handlePasswordChange} disabled={isLoading}>
            {isLoading ? "Updating..." : "Update Password"}
          </button>
        </div>
      )}

      <button className="settings-btn danger" onClick={logout}>
        <LogOut size={18} /> Log out
      </button>
    </div>
  );
};

export default SettingsPanel;
