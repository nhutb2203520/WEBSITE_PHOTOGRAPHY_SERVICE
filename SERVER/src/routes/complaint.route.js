import express from "express";
import { verifyTokenUser } from "../middlewares/verifyToken.js"; 
// ✅ 1. Import Middleware xác thực Admin (Giả sử bạn đã có file này)
// Nếu bạn chưa có verifyAdmin, hãy xem Bước 2 bên dưới
import { verifyAdmin } from "../middlewares/verifyAdmin.js"; 

import { 
    createComplaint, 
    processComplaint, 
    getMyComplaints, 
    getAllComplaints 
} from "../controllers/complaint.controller.js";

import multer from "multer";
import path from "path";
import fs from "fs";

const router = express.Router();

// --- CẤU HÌNH UPLOAD ---
const uploadDir = "uploads/complaints/";
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `complaint-${Date.now()}-${Math.round(Math.random() * 1E9)}${ext}`);
  },
});

const upload = multer({ 
    storage, 
    limits: { fileSize: 10 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) cb(null, true);
        else cb(new Error('Chỉ chấp nhận file ảnh!'), false);
    }
});

// ================= ROUTES =================

// 1. KHÁCH HÀNG: Tạo khiếu nại
router.post("/", verifyTokenUser, upload.array("images", 10), createComplaint);

// 2. KHÁCH HÀNG: Xem danh sách của mình
router.get("/my-complaints", verifyTokenUser, getMyComplaints);

// 3. ✅ ADMIN: Duyệt hoặc Từ chối khiếu nại
router.put("/:id/process", verifyAdmin, processComplaint); 
router.get("/admin/all", verifyAdmin, getAllComplaints);

export default router;