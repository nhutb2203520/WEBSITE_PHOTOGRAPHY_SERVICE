import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { 
    createConversation, 
    getConversations, 
    getMessages,
    getComplaintConversation,
    addMessage,
    getUnreadCount,
    markAsRead // <-- Import mới
} from "../controllers/chat.controller.js";

const router = express.Router();

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

router.post("/", createConversation);
router.get("/unread/:userId", getUnreadCount); 
router.put("/mark-read", markAsRead); // <-- Route mới để đánh dấu đã đọc

router.get("/:userId", getConversations);
router.get("/message/:conversationId", getMessages);
router.post("/complaint-group", getComplaintConversation);
router.post("/message", upload.array("images", 5), addMessage);

export default router;