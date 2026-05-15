import express from "express";
import { sendMessage, getMessages } from "../controllers/messageController.js";
import protect from "../middleware/auth.js";
import upload from "../middleware/upload.js";

const router = express.Router();

router.post("/", protect, upload.single("file"), sendMessage);
router.get("/:chatId", protect, getMessages);

export default router;
