import multer from "multer";
import cloudinary from "../config/cloudinary.js";

// Use memory storage — files stay in buffer, then we upload to Cloudinary
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    "image/jpeg", "image/png", "image/gif", "image/webp",
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "application/vnd.ms-powerpoint",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    "text/plain",
    "application/zip",
    "application/x-rar-compressed",
  ];
  if (allowedTypes.includes(file.mimetype)) cb(null, true);
  else cb(new Error(`File type ${file.mimetype} is not supported`), false);
};

const upload = multer({ storage, fileFilter, limits: { fileSize: 10 * 1024 * 1024 } });

// Middleware to set upload type (used to determine Cloudinary folder)
export const setUploadType = (type) => (req, res, next) => {
  req.uploadType = type;
  next();
};

/**
 * Upload a file buffer to Cloudinary.
 * @param {Buffer} fileBuffer - The file buffer from multer memoryStorage
 * @param {string} folder - Cloudinary folder (e.g. "zingchat/avatars")
 * @param {string} resourceType - "image" or "auto" (for non-image files)
 * @returns {Promise<object>} Cloudinary upload result with secure_url, public_id, etc.
 */
export const uploadToCloudinary = (fileBuffer, folder, resourceType = "auto") => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: resourceType,
      },
      (error, result) => {
        if (error) reject(error);
        else resolve(result);
      }
    );
    stream.end(fileBuffer);
  });
};

/**
 * Get the Cloudinary folder based on upload type.
 */
export const getCloudinaryFolder = (uploadType) => {
  switch (uploadType) {
    case "avatar":
      return "zingchat/avatars";
    case "group":
      return "zingchat/groups";
    default:
      return "zingchat/messages";
  }
};

export default upload;
