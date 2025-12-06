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
  searchByImage // ✅ Import hàm search mới
} from "../controllers/worksprofile.controller.js";

const router = express.Router();

// Cấu hình Multer
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
    limits: { fileSize: 500 * 1024 * 1024 } // Tăng lên 500MB
});

// ================= ROUTES =================

// 1. ✅ AI SEARCH (Public)
router.post('/search-image', upload.single('image'), searchByImage);

// 2. Lấy danh sách của tôi
router.get("/my", verifyTokenUser, getMyWorksProfiles);

// 3. Lấy theo User ID
router.get("/user/:userId", getWorksByUserId);

// 4. Tạo mới
router.post("/create", verifyTokenUser, upload.array("images", 10), createWorksProfile);

// 5. Xóa
router.delete("/:id", verifyTokenUser, deleteWorkProfile);

// 6. Chi tiết (Cuối cùng)
router.get("/:id", getWorkById); 

export default router;