import User from "../models/User.js";
import Otp from "../models/Otp.js";
import { generateToken } from "../middleware/auth.js";
import { uploadToCloudinary, getCloudinaryFolder } from "../middleware/upload.js";
import sendOtpEmail from "../config/sendEmail.js";
import bcrypt from "bcryptjs";

// Generate a 6-digit OTP
const generateOtp = () => Math.floor(100000 + Math.random() * 900000).toString();

// @desc    Register — Step 1: Validate, upload pic, send OTP
// @route   POST /api/auth/signup
export const signup = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }
    if (password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters" });
    }

    const existingEmail = await User.findOne({ email });
    if (existingEmail) return res.status(400).json({ message: "Email already in use" });

    const existingUsername = await User.findOne({ username });
    if (existingUsername) return res.status(400).json({ message: "Username already taken" });

    // Upload profile pic to Cloudinary (if provided)
    let profilePic = "";
    if (req.file) {
      const result = await uploadToCloudinary(req.file.buffer, getCloudinaryFolder("avatar"), "image");
      profilePic = result.secure_url;
    }

    // Hash the password before storing in OTP record
    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Delete any existing OTP for this email
    await Otp.deleteMany({ email });

    // Generate OTP and store pending signup data
    const otp = generateOtp();
    await Otp.create({
      email,
      otp, // will be hashed by the pre-save hook
      username,
      password: hashedPassword,
      profilePic,
    });

    // Send OTP via email
    await sendOtpEmail(email, otp);

    res.status(200).json({
      message: "OTP sent to your email",
      email,
    });
  } catch (error) {
    console.error("Signup error:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
};

// @desc    Register — Step 2: Verify OTP and create account
// @route   POST /api/auth/verify-otp
export const verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ message: "Email and OTP are required" });
    }

    // Find the latest OTP record for this email
    const otpRecord = await Otp.findOne({ email }).sort({ createdAt: -1 });

    if (!otpRecord) {
      return res.status(400).json({ message: "OTP expired or not found. Please request a new one." });
    }

    // Check if OTP has expired
    if (otpRecord.expiresAt < new Date()) {
      await Otp.deleteMany({ email });
      return res.status(400).json({ message: "OTP has expired. Please request a new one." });
    }

    // Verify OTP
    const isValid = await otpRecord.compareOtp(otp);
    if (!isValid) {
      return res.status(400).json({ message: "Invalid OTP. Please try again." });
    }

    // Check again that email/username aren't taken (race condition guard)
    const existingEmail = await User.findOne({ email });
    if (existingEmail) {
      await Otp.deleteMany({ email });
      return res.status(400).json({ message: "Email already in use" });
    }

    const existingUsername = await User.findOne({ username: otpRecord.username });
    if (existingUsername) {
      await Otp.deleteMany({ email });
      return res.status(400).json({ message: "Username already taken" });
    }

    // Create the user (password is already hashed, so skip the User pre-save hook)
    const user = new User({
      username: otpRecord.username,
      email: otpRecord.email,
      password: otpRecord.password,
      profilePic: otpRecord.profilePic,
    });

    // Mark password as not modified so the User pre-save hook won't re-hash it
    user.$skipPasswordHash = true;
    await user.save();

    // Clean up OTP records
    await Otp.deleteMany({ email });

    // Generate JWT and set cookie
    generateToken(user._id, res);

    res.status(201).json({
      _id: user._id, username: user.username, email: user.email,
      profilePic: user.profilePic, about: user.about,
    });
  } catch (error) {
    console.error("Verify OTP error:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
};

// @desc    Resend OTP
// @route   POST /api/auth/resend-otp
export const resendOtp = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: "Email is required" });

    // Find existing OTP record to get stored signup data
    const existing = await Otp.findOne({ email }).sort({ createdAt: -1 });
    if (!existing) {
      return res.status(400).json({ message: "No pending registration found. Please sign up again." });
    }

    // Delete old OTPs and create a new one
    await Otp.deleteMany({ email });

    const otp = generateOtp();
    await Otp.create({
      email,
      otp,
      username: existing.username,
      password: existing.password,
      profilePic: existing.profilePic,
    });

    await sendOtpEmail(email, otp);

    res.status(200).json({ message: "New OTP sent to your email" });
  } catch (error) {
    console.error("Resend OTP error:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
};

// @desc    Login user
// @route   POST /api/auth/login
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ message: "All fields are required" });

    const user = await User.findOne({ email }).select("+password");
    if (!user) return res.status(400).json({ message: "Invalid email or password" });

    const isMatch = await user.comparePassword(password);
    if (!isMatch) return res.status(400).json({ message: "Invalid email or password" });

    generateToken(user._id, res);

    res.json({
      _id: user._id, username: user.username, email: user.email,
      profilePic: user.profilePic, about: user.about,
    });
  } catch (error) {
    console.error("Login error:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
};

// @desc    Logout user
// @route   POST /api/auth/logout
export const logout = (req, res) => {
  try {
    res.cookie("jwt", "", { maxAge: 0 });
    res.json({ message: "Logged out successfully" });
  } catch (error) {
    console.error("Logout error:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
};

// @desc    Change password
// @route   PUT /api/auth/change-password
export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) return res.status(400).json({ message: "Both passwords are required" });
    if (newPassword.length < 6) return res.status(400).json({ message: "New password must be at least 6 characters" });

    const user = await User.findById(req.user._id).select("+password");
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) return res.status(400).json({ message: "Current password is incorrect" });

    user.password = newPassword;
    await user.save();
    res.json({ message: "Password changed successfully" });
  } catch (error) {
    console.error("Change password error:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
};

// @desc    Check auth
// @route   GET /api/auth/check
export const checkAuth = (req, res) => {
  res.json(req.user);
};
