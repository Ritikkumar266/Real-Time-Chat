import { useState } from "react";
import { Link } from "react-router-dom";
import useAuthStore from "../store/useAuthStore";
import { MessageCircle, User, Mail, Lock, Image } from "lucide-react";

const Signup = () => {
  const [form, setForm] = useState({ username: "", email: "", password: "", confirmPassword: "" });
  const [picPreview, setPicPreview] = useState(null);
  const [picFile, setPicFile] = useState(null);
  const { signup, isLoading } = useAuthStore();

  const handlePic = (e) => {
    const file = e.target.files[0];
    if (file) {
      setPicFile(file);
      setPicPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirmPassword) {
      return alert("Passwords do not match");
    }
    const fd = new FormData();
    fd.append("username", form.username);
    fd.append("email", form.email);
    fd.append("password", form.password);
    if (picFile) fd.append("profilePic", picFile);
    await signup(fd);
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">
          <h1>💬 ZingChat</h1>
          <p>Create your account</p>
        </div>
        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="avatar-upload">
            <div className="avatar-preview">
              {picPreview ? <img src={picPreview} alt="avatar" /> : <User size={28} />}
            </div>
            <label className="avatar-upload-btn">
              <Image size={14} style={{ marginRight: 4 }} /> Upload Photo
              <input type="file" accept="image/*" hidden onChange={handlePic} />
            </label>
          </div>
          <div className="form-group">
            <label>Username</label>
            <input type="text" placeholder="Choose a username" value={form.username} onChange={e => setForm({ ...form, username: e.target.value })} required />
          </div>
          <div className="form-group">
            <label>Email</label>
            <input type="email" placeholder="Enter your email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input type="password" placeholder="Min 6 characters" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} required />
          </div>
          <div className="form-group">
            <label>Confirm Password</label>
            <input type="password" placeholder="Confirm password" value={form.confirmPassword} onChange={e => setForm({ ...form, confirmPassword: e.target.value })} required />
          </div>
          <button type="submit" className="auth-btn" disabled={isLoading}>
            {isLoading ? "Creating Account..." : "Sign Up"}
          </button>
          <div className="auth-link">
            Already have an account? <Link to="/login">Log in</Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Signup;
