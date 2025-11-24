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
  getWorksByUserId, // ✅ Import hàm mới
} from "../controllers/worksprofile.controller.js";

const router = express.Router();

// ✅ Cấu hình multer
const uploadDir = "uploads/";
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
      const ext = path.extname(file.originalname);
      const name = path.basename(file.originalname, ext).replace(/\s+/g, '-');
      cb(null, `${Date.now()}-${name}${ext}`);
  },
});

const upload = multer({ 
    storage,
    limits: { fileSize: 10 * 1024 * 1024 }
});

// ================= ROUTES (QUAN TRỌNG: THỨ TỰ) =================

// 1. Lấy danh sách của tôi
router.get("/my", verifyTokenUser, getMyWorksProfiles);

// 2. ✅ [MỚI] Lấy danh sách theo User ID (Public)
// Phải đặt TRƯỚC route /:id để không bị lỗi 404
router.get("/user/:userId", getWorksByUserId);

// 3. Tạo mới
router.post("/create", verifyTokenUser, upload.array("images", 10), createWorksProfile);

// 4. Xóa
router.delete("/:id", verifyTokenUser, deleteWorkProfile);

// 5. Lấy chi tiết Work (Đặt cuối cùng)
router.get("/:id", getWorkById); 

export default router;