import User from "../models/User.js";

// @desc    Search users
// @route   GET /api/users/search?q=
export const searchUsers = async (req, res) => {
  try {
    const keyword = req.query.q;
    if (!keyword) return res.status(400).json({ message: "Search query is required" });

    const users = await User.find({
      $or: [
        { username: { $regex: keyword, $options: "i" } },
        { email: { $regex: keyword, $options: "i" } },
      ],
      _id: { $ne: req.user._id },
    }).select("-password");

    res.json(users);
  } catch (error) {
    console.error("Search users error:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
};

// @desc    Get own profile
// @route   GET /api/users/profile
export const getProfile = async (req, res) => {
  res.json(req.user);
};

// @desc    Get all users (except self)
// @route   GET /api/users
export const getAllUsers = async (req, res) => {
  try {
    const users = await User.find({ _id: { $ne: req.user._id } })
      .select("-password")
      .sort({ createdAt: -1 });
    res.json(users);
  } catch (error) {
    console.error("Get all users error:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
};

// @desc    Update profile
// @route   PUT /api/users/profile
export const updateProfile = async (req, res) => {
  try {
    const { about } = req.body;
    const user = await User.findById(req.user._id);

    if (about !== undefined) user.about = about;

    if (req.file) {
      user.profilePic = `/uploads/avatars/${req.file.filename}`;
    }

    await user.save();

    res.json({
      _id: user._id, username: user.username, email: user.email,
      profilePic: user.profilePic, about: user.about,
    });
  } catch (error) {
    console.error("Update profile error:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
};
