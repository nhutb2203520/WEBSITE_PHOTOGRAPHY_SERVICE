import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { 
    createComplaint, 
    processComplaint, 
    getAllComplaints, 
    getMyComplaints,
    resolveComplaintManual // <-- Import hàm mới
} from "../controllers/complaint.controller.js";
import { verifyTokenUser } from "../middlewares/verifyToken.js";
import { verifyAdmin  } from "../middlewares/verifyAdmin.js";
const router = express.Router();

// 1. Cấu hình thư mục lưu ảnh khiếu nại
const uploadDir = path.join(process.cwd(), "uploads/complaints");
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// 2. Cấu hình Multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({ storage: storage });

// ================= ROUTES =================

// Khách hàng tạo khiếu nại (có upload ảnh bằng chứng)
router.post("/", verifyTokenUser, upload.array("images", 5), createComplaint);

// Admin xử lý cơ bản (Duyệt/Từ chối - Không chia tiền)
router.put("/:id", verifyAdmin, processComplaint);

// Khách hàng lấy danh sách khiếu nại của mình
router.get("/my-complaints", verifyTokenUser, getMyComplaints);

// Admin lấy tất cả khiếu nại
router.get("/all", verifyAdmin, getAllComplaints);

// 🔥 [NEW] Admin giải quyết tài chính thủ công (Upload 2 biên lai)
// upload.fields cho phép upload nhiều file với key khác nhau
router.post("/resolve-manual", verifyAdmin, upload.fields([
    { name: 'refundProof', maxCount: 1 },  // Ảnh biên lai trả khách
    { name: 'payoutProof', maxCount: 1 }   // Ảnh biên lai trả thợ
]), resolveComplaintManual);

export default router;