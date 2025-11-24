import express from "express";
import { getReviews, createReview, updateReview } from "../controllers/review.controller.js";
import { verifyTokenUser } from "../middlewares/verifyToken.js";
import multer from "multer";
import path from "path";
import fs from "fs";

const router = express.Router();

// --- Cấu hình Multer cho Review Images ---
const uploadDir = "uploads/reviews/";
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
      const ext = path.extname(file.originalname);
      // Tên file: review-{timestamp}-{random}.ext
      cb(null, `review-${Date.now()}-${Math.round(Math.random() * 1E9)}${ext}`);
  },
});

// Giới hạn file 5MB, tối đa 5 ảnh
const upload = multer({ 
    storage, 
    limits: { fileSize: 5 * 1024 * 1024 } 
});

// --- ROUTES ---

// Public: Lấy danh sách review
router.get("/", getReviews);

// Private: Tạo review mới (Cần đăng nhập + Upload ảnh)
router.post("/", verifyTokenUser, upload.array('images', 5), createReview);

// Private: Sửa review (Cần đăng nhập + Upload ảnh)
router.put("/:id", verifyTokenUser, upload.array('images', 5), updateReview);

export default router;