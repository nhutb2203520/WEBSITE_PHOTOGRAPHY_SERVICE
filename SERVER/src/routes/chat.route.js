import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { 
    createConversation, 
    getConversations, 
    getConversationsAdmin, // 🔥 [QUAN TRỌNG] Phải import hàm này
    getMessages,
    getComplaintConversation,
    addMessage,
    getUnreadCount,
    markAsRead 
} from "../controllers/chat.controller.js";

const router = express.Router();

// --- Cấu hình Multer (Upload ảnh) ---
const uploadDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

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

// --- ĐỊNH NGHĨA ROUTES ---

// 1. Tạo cuộc hội thoại mới
router.post("/", createConversation);

// 2. Lấy số tin nhắn chưa đọc & Đánh dấu đã đọc
router.get("/unread/:userId", getUnreadCount); 
router.put("/mark-read", markAsRead); 

// 🔥 [FIX QUAN TRỌNG NHẤT] Route dành riêng cho Admin
// Route này sẽ gọi hàm getConversationsAdmin (có populate status khiếu nại)
// Đặt nó TRƯỚC route /:userId để tránh bị nhầm lẫn
router.get("/admin/:userId", getConversationsAdmin); 

// 3. Lấy danh sách chat cho User thường (Không có populate status chi tiết)
router.get("/:userId", getConversations);

// 4. Các route khác
router.get("/message/:conversationId", getMessages);
router.post("/complaint-group", getComplaintConversation);
router.post("/message", upload.array("images", 5), addMessage);

export default router;