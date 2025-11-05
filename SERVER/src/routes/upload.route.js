import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { uploadAvatar, uploadCover } from "../controllers/upload.controller.js";
import { verifyTokenUser } from "../middlewares/verifyToken.js";

const router = express.Router();

// ✅ Đảm bảo thư mục uploads tồn tại
const uploadDir = "uploads";
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

// ✅ Cấu hình Multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, Date.now() + "-" + file.fieldname + ext);
  }
});

const upload = multer({ storage });

// ✅ Routes upload
router.post("/avatar", verifyTokenUser, upload.single("file"), uploadAvatar);
router.post("/cover", verifyTokenUser, upload.single("file"), uploadCover);

export default router;
