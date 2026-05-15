import express from "express";
import { searchUsers, getProfile, updateProfile, getAllUsers } from "../controllers/userController.js";
import protect from "../middleware/auth.js";
import upload, { setUploadType } from "../middleware/upload.js";

const router = express.Router();

router.get("/", protect, getAllUsers);
router.get("/search", protect, searchUsers);
router.get("/profile", protect, getProfile);
router.put("/profile", protect, setUploadType("avatar"), upload.single("profilePic"), updateProfile);

export default router;
