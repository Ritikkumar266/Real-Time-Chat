import Message from "../models/Message.js";
import Chat from "../models/Chat.js";
import { uploadToCloudinary, getCloudinaryFolder } from "../middleware/upload.js";

// @desc    Send a message (text or file)
// @route   POST /api/messages
export const sendMessage = async (req, res) => {
  try {
    const { chatId, content } = req.body;
    if (!chatId) return res.status(400).json({ message: "chatId is required" });

    let messageData = {
      sender: req.user._id,
      chat: chatId,
      content: content || "",
      messageType: "text",
      readBy: [req.user._id],
    };

    if (req.file) {
      const isImage = req.file.mimetype.startsWith("image/");
      const result = await uploadToCloudinary(
        req.file.buffer,
        getCloudinaryFolder("message"),
        isImage ? "image" : "auto"
      );
      messageData.messageType = isImage ? "image" : "file";
      messageData.fileUrl = result.secure_url;
      messageData.fileName = req.file.originalname;
      messageData.fileSize = req.file.size;
    }

    if (!messageData.content && !messageData.fileUrl) {
      return res.status(400).json({ message: "Message content or file is required" });
    }

    let message = await Message.create(messageData);
    message = await message.populate("sender", "username profilePic");
    message = await message.populate("chat");
    message = await message.populate({ path: "chat.users", select: "username profilePic email" });

    await Chat.findByIdAndUpdate(chatId, { latestMessage: message._id });

    res.status(201).json(message);
  } catch (error) {
    console.error("Send message error:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
};

// @desc    Get messages for a chat
// @route   GET /api/messages/:chatId
export const getMessages = async (req, res) => {
  try {
    const { chatId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;

    const messages = await Message.find({ chat: chatId })
      .populate("sender", "username profilePic")
      .sort({ createdAt: 1 })
      .skip(skip)
      .limit(limit);

    const total = await Message.countDocuments({ chat: chatId });

    res.json({ messages, page, totalPages: Math.ceil(total / limit), total });
  } catch (error) {
    console.error("Get messages error:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
};
