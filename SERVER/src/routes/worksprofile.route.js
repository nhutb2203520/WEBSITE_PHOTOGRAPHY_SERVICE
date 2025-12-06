import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { verifyTokenUser } from "../middlewares/verifyToken.js";
import {
  createWorksProfile,
  getMyWorksProfiles,
  deleteWorkProfile,
  getWorkById,
  getWorksByUserId,
  searchByImage, // ✅ Import hàm search
  updateWork     // ✅ Import hàm update
} from "../controllers/worksprofile.controller.js";

const router = express.Router();

// ==========================================
// 📁 CẤU HÌNH MULTER (Lưu vào uploads/works)
// ==========================================
const uploadDir = "uploads/works"; // Tách riêng thư mục cho gọn
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
      const ext = path.extname(file.originalname);
      const name = path.basename(file.originalname, ext).replace(/\s+/g, '-');
      const userId = req.user?._id || 'unknown';
      cb(null, `work-${userId}-${Date.now()}${ext}`);
  },
});

const upload = multer({ 
    storage,
    limits: { fileSize: 50 * 1024 * 1024 } // Max 50MB
});

// ================= ROUTES =================

// 1. ✅ AI SEARCH (Public)
router.post('/search-image', upload.single('image'), searchByImage);

// 2. Lấy danh sách của tôi
router.get("/my", verifyTokenUser, getMyWorksProfiles);

// 3. Lấy theo User ID (Public)
router.get("/user/:userId", getWorksByUserId);

// 4. Tạo mới (Upload tối đa 10 ảnh)
router.post("/create", verifyTokenUser, upload.array("images", 20), createWorksProfile);

// 5. Cập nhật
router.put("/:id", verifyTokenUser, updateWork);

// 6. Xóa
router.delete("/:id", verifyTokenUser, deleteWorkProfile);

// 7. Lấy chi tiết Work (Đặt cuối cùng để tránh conflict route)
router.get("/:id", getWorkById); 

export default router;