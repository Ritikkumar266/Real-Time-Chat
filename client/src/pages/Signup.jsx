import { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import useAuthStore from "../store/useAuthStore";
import { User, Mail, Lock, Image, ArrowLeft, ShieldCheck } from "lucide-react";

const Signup = () => {
  const [form, setForm] = useState({ username: "", email: "", password: "", confirmPassword: "" });
  const [picPreview, setPicPreview] = useState(null);
  const [picFile, setPicFile] = useState(null);
  const { signup, verifyOtp, resendOtp, isLoading } = useAuthStore();

  // OTP state
  const [otpStep, setOtpStep] = useState(false);
  const [otpEmail, setOtpEmail] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [cooldown, setCooldown] = useState(0);
  const otpRefs = useRef([]);

  // Cooldown timer for resend
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

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

    const result = await signup(fd);
    if (result) {
      setOtpEmail(result.email);
      setOtpStep(true);
      setCooldown(60);
      // Focus first OTP input
      setTimeout(() => otpRefs.current[0]?.focus(), 100);
    }
  };

  const handleOtpChange = (index, value) => {
    if (value.length > 1) {
      // Handle paste — distribute digits across inputs
      const digits = value.replace(/\D/g, "").slice(0, 6).split("");
      const newOtp = [...otp];
      digits.forEach((d, i) => {
        if (index + i < 6) newOtp[index + i] = d;
      });
      setOtp(newOtp);
      const nextIndex = Math.min(index + digits.length, 5);
      otpRefs.current[nextIndex]?.focus();
      return;
    }

    if (!/^\d*$/.test(value)) return; // only digits
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleVerify = async () => {
    const otpString = otp.join("");
    if (otpString.length !== 6) return;
    await verifyOtp(otpEmail, otpString);
  };

  const handleResend = async () => {
    if (cooldown > 0) return;
    const ok = await resendOtp(otpEmail);
    if (ok) {
      setCooldown(60);
      setOtp(["", "", "", "", "", ""]);
      otpRefs.current[0]?.focus();
    }
  };

  // OTP Verification Screen
  if (otpStep) {
    return (
      <div className="auth-page">
        <div className="auth-card">
          <div className="auth-logo">
            <div className="otp-icon-wrapper">
              <ShieldCheck size={40} />
            </div>
            <h1>Verify Your Email</h1>
            <p className="otp-subtitle">
              We've sent a 6-digit code to<br />
              <strong>{otpEmail}</strong>
            </p>
          </div>

          <div className="otp-inputs">
            {otp.map((digit, i) => (
              <input
                key={i}
                ref={(el) => (otpRefs.current[i] = el)}
                type="text"
                inputMode="numeric"
                maxLength={6}
                value={digit}
                onChange={(e) => handleOtpChange(i, e.target.value)}
                onKeyDown={(e) => handleOtpKeyDown(i, e)}
                className={`otp-input ${digit ? "filled" : ""}`}
                autoFocus={i === 0}
              />
            ))}
          </div>

          <button
            className="auth-btn"
            onClick={handleVerify}
            disabled={isLoading || otp.join("").length !== 6}
          >
            {isLoading ? "Verifying..." : "Verify & Create Account"}
          </button>

          <div className="otp-resend">
            {cooldown > 0 ? (
              <span className="otp-cooldown">Resend code in <strong>{cooldown}s</strong></span>
            ) : (
              <button className="otp-resend-btn" onClick={handleResend} disabled={isLoading}>
                Didn't receive the code? <strong>Resend</strong>
              </button>
            )}
          </div>

          <button className="otp-back-btn" onClick={() => { setOtpStep(false); setOtp(["", "", "", "", "", ""]); }}>
            <ArrowLeft size={16} /> Back to Sign Up
          </button>
        </div>
      </div>
    );
  }

  // Signup Form Screen
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
            {isLoading ? "Sending OTP..." : "Sign Up"}
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
