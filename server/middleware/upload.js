import multer from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create uploads directories
const dirs = ["uploads/avatars", "uploads/groups", "uploads/messages"];
dirs.forEach((dir) => {
  const fullPath = path.join(__dirname, "..", dir);
  if (!fs.existsSync(fullPath)) fs.mkdirSync(fullPath, { recursive: true });
});

// Disk storage — saves files to /uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let folder = "uploads/messages";
    if (req.uploadType === "avatar") folder = "uploads/avatars";
    if (req.uploadType === "group") folder = "uploads/groups";
    cb(null, path.join(__dirname, "..", folder));
  },
  filename: (req, file, cb) => {
    const unique = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, unique + ext);
  },
});

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

// Middleware to set upload type
export const setUploadType = (type) => (req, res, next) => {
  req.uploadType = type;
  next();
};

export default upload;
