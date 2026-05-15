import express from "express";
import { accessChat, getChats, createGroupChat, updateGroup, addToGroup, removeFromGroup } from "../controllers/chatController.js";
import protect from "../middleware/auth.js";
import upload, { setUploadType } from "../middleware/upload.js";

const router = express.Router();

router.post("/", protect, accessChat);
router.get("/", protect, getChats);
router.post("/group", protect, setUploadType("group"), upload.single("groupPic"), createGroupChat);
router.put("/group/:id", protect, setUploadType("group"), upload.single("groupPic"), updateGroup);
router.put("/group/:id/add", protect, addToGroup);
router.put("/group/:id/remove", protect, removeFromGroup);

export default router;
