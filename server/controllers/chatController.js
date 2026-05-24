import Chat from "../models/Chat.js";
import User from "../models/User.js";
import { uploadToCloudinary, getCloudinaryFolder } from "../middleware/upload.js";

// @desc    Create or access a 1-on-1 chat
// @route   POST /api/chats
export const accessChat = async (req, res) => {
  try {
    const { userId } = req.body;
    if (!userId) return res.status(400).json({ message: "userId is required" });

    let chat = await Chat.findOne({
      isGroupChat: false,
      $and: [
        { users: { $elemMatch: { $eq: req.user._id } } },
        { users: { $elemMatch: { $eq: userId } } },
      ],
    }).populate("users", "-password").populate("latestMessage");

    if (chat) {
      chat = await User.populate(chat, { path: "latestMessage.sender", select: "username profilePic email" });
      return res.json(chat);
    }

    const newChat = await Chat.create({ chatName: "direct", isGroupChat: false, users: [req.user._id, userId] });
    const fullChat = await Chat.findById(newChat._id).populate("users", "-password");
    res.status(201).json(fullChat);
  } catch (error) {
    console.error("Access chat error:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
};

// @desc    Get all chats for logged-in user
// @route   GET /api/chats
export const getChats = async (req, res) => {
  try {
    let chats = await Chat.find({ users: { $elemMatch: { $eq: req.user._id } } })
      .populate("users", "-password")
      .populate("groupAdmin", "-password")
      .populate("latestMessage")
      .sort({ updatedAt: -1 });

    chats = await User.populate(chats, { path: "latestMessage.sender", select: "username profilePic email" });
    res.json(chats);
  } catch (error) {
    console.error("Get chats error:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
};

// @desc    Create group chat
// @route   POST /api/chats/group
export const createGroupChat = async (req, res) => {
  try {
    const { name, users } = req.body;
    if (!name || !users || users.length < 2) {
      return res.status(400).json({ message: "Group name and at least 2 other users are required" });
    }

    const allUsers = [...users, req.user._id.toString()];

    let groupPic = "";
    if (req.file) {
      const result = await uploadToCloudinary(req.file.buffer, getCloudinaryFolder("group"), "image");
      groupPic = result.secure_url;
    }

    const groupChat = await Chat.create({
      chatName: name, isGroupChat: true, users: allUsers,
      groupAdmin: req.user._id, groupPic,
    });

    const fullGroupChat = await Chat.findById(groupChat._id)
      .populate("users", "-password").populate("groupAdmin", "-password");

    res.status(201).json(fullGroupChat);
  } catch (error) {
    console.error("Create group error:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
};

// @desc    Update group
// @route   PUT /api/chats/group/:id
export const updateGroup = async (req, res) => {
  try {
    const { chatName } = req.body;
    const chat = await Chat.findById(req.params.id);
    if (!chat || !chat.isGroupChat) return res.status(404).json({ message: "Group not found" });

    if (chatName) chat.chatName = chatName;
    if (req.file) {
      const result = await uploadToCloudinary(req.file.buffer, getCloudinaryFolder("group"), "image");
      chat.groupPic = result.secure_url;
    }
    await chat.save();

    const updated = await Chat.findById(chat._id).populate("users", "-password").populate("groupAdmin", "-password");
    res.json(updated);
  } catch (error) {
    console.error("Update group error:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
};

// @desc    Add user to group
// @route   PUT /api/chats/group/:id/add
export const addToGroup = async (req, res) => {
  try {
    const { userId } = req.body;
    const chat = await Chat.findById(req.params.id);
    if (!chat || !chat.isGroupChat) return res.status(404).json({ message: "Group not found" });
    if (chat.groupAdmin.toString() !== req.user._id.toString()) return res.status(403).json({ message: "Only admin can add members" });
    if (chat.users.includes(userId)) return res.status(400).json({ message: "User already in group" });

    chat.users.push(userId);
    await chat.save();
    const updated = await Chat.findById(chat._id).populate("users", "-password").populate("groupAdmin", "-password");
    res.json(updated);
  } catch (error) {
    console.error("Add to group error:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
};

// @desc    Remove user from group
// @route   PUT /api/chats/group/:id/remove
export const removeFromGroup = async (req, res) => {
  try {
    const { userId } = req.body;
    const chat = await Chat.findById(req.params.id);
    if (!chat || !chat.isGroupChat) return res.status(404).json({ message: "Group not found" });
    if (chat.groupAdmin.toString() !== req.user._id.toString() && userId !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized" });
    }

    chat.users = chat.users.filter((u) => u.toString() !== userId);
    await chat.save();
    const updated = await Chat.findById(chat._id).populate("users", "-password").populate("groupAdmin", "-password");
    res.json(updated);
  } catch (error) {
    console.error("Remove from group error:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
};
