import express from "express";
import { signup, login, logout, changePassword, checkAuth, verifyOtp, resendOtp } from "../controllers/authController.js";
import protect from "../middleware/auth.js";
import upload, { setUploadType } from "../middleware/upload.js";

const router = express.Router();

router.post("/signup", setUploadType("avatar"), upload.single("profilePic"), signup);
router.post("/verify-otp", verifyOtp);
router.post("/resend-otp", resendOtp);
router.post("/login", login);
router.post("/logout", logout);
router.put("/change-password", protect, changePassword);
router.get("/check", protect, checkAuth);

export default router;
