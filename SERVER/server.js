import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { createServer } from "http"; 
import { Server } from "socket.io"; 
import connectDB from "./src/config/mongoDb.js";

// Import Models
import Conversation from "./src/models/conversation.model.js";
import Message from "./src/models/message.model.js";
import './src/models/index.js'; 

// Import Routes
import authRoutes from "./src/routes/auth.route.js";
import khachHangRoutes from "./src/routes/khachhang.route.js";
import uploadRoutes from "./src/routes/upload.route.js";
import worksProfileRoutes from "./src/routes/worksprofile.route.js";
import servicePackageRoutes from "./src/routes/servicePackage.route.js";
import orderRoute from "./src/routes/order.route.js";
import paymentMethodRoutes from "./src/routes/paymentMethod.route.js";
import adminRoute from "./src/routes/admin.route.js";
import serviceFeeRoutes from "./src/routes/servicefree.route.js";
import scheduleRoutes from "./src/routes/schedule.route.js";
import albumRoute from "./src/routes/album.route.js";
import complaintRoute from "./src/routes/complaint.route.js";
import reviewRoutes from "./src/routes/review.route.js";
import notificationRoute from "./src/routes/notification.route.js";
import notificationAdminRoute from "./src/routes/notificationAdmin.route.js";
import homeRoute from "./src/routes/home.route.js";
import favoriteRoutes from "./src/routes/favorite.route.js";
import chatRoutes from "./src/routes/chat.route.js"; 

import khachHangController from "./src/controllers/khachhang.controller.js";
import { verifyTokenUser } from "./src/middlewares/verifyToken.js";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

connectDB();

const app = express();
const httpServer = createServer(app);

// Cấu hình Socket.IO
const io = new Server(httpServer, {
    cors: {
        origin: process.env.CLIENT_URL || 'http://localhost:5173',
        methods: ["GET", "POST"],
        credentials: true
    }
});

// Middleware
app.use(cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// --- QUAN TRỌNG: Cấu hình Static Files cho Uploads ---
const uploadDir = path.join(process.cwd(), "uploads"); 
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}
// Mở quyền truy cập public cho thư mục uploads
app.use("/uploads", express.static(uploadDir));

// --- SOCKET.IO LOGIC ---
let onlineUsers = [];

const addUser = (userId, socketId) => {
    !onlineUsers.some((user) => user.userId === userId) &&
        onlineUsers.push({ userId, socketId });
};

const removeUser = (socketId) => {
    onlineUsers = onlineUsers.filter((user) => user.socketId !== socketId);
};

io.on("connection", (socket) => {
    // 1. Khi user kết nối
    socket.on("add_user", (userId) => {
        addUser(userId, socket.id);
        io.emit("getUsers", onlineUsers);
        console.log(`⚡ User connected: ${userId}`);
    });

    // 2. Vào phòng chat
    socket.on("join_room", (roomId) => {
        socket.join(roomId);
        console.log(`User joined room: ${roomId}`);
    });

    // 3. Gửi tin nhắn (KHÔNG LƯU DB Ở ĐÂY NỮA, CHỈ BROADCAST)
    socket.on("send_message", ({ senderId, conversationId, text, images, createdAt }) => {
        const messageData = {
            senderId,
            conversationId,
            text,
            images,
            createdAt: createdAt || Date.now()
        };
        
        // Gửi cho client khác trong cùng phòng conversationId
        io.to(conversationId).emit("receive_message", messageData);
    });

    // 4. Khi ngắt kết nối
    socket.on("disconnect", () => {
        console.log("User disconnected!");
        removeUser(socket.id);
        io.emit("getUsers", onlineUsers);
    });
});

// Đăng ký Routes
app.use("/api/auth", authRoutes);
app.use("/api/khachhang", khachHangRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/worksprofile", worksProfileRoutes);
app.use('/api/service-packages', servicePackageRoutes);
app.use("/api/orders", orderRoute);
app.use("/api/service-fees", serviceFeeRoutes);
app.use("/api/payment-methods", paymentMethodRoutes);
app.use("/api/admin", adminRoute);
app.use("/api/reviews", reviewRoutes);
app.use("/api/schedule", scheduleRoutes);
app.use("/api/albums", albumRoute);
app.use("/api/complaints", complaintRoute);
app.get("/api/my-profile", verifyTokenUser, khachHangController.getMyAccount);
app.use("/api/notifications", notificationRoute);
app.use("/api/admin/notifications", notificationAdminRoute);
app.use("/api/public", homeRoute);
app.use("/api/favorites", favoriteRoutes);
app.use("/api/chat", chatRoutes);

// Error Handler
app.use((req, res) => {
    console.log('❌ 404 - Không tìm thấy:', req.method, req.originalUrl);
    res.status(404).json({ success: false, message: "Endpoint không tồn tại!" });
});

app.use((err, req, res, next) => {
    console.error('❌ Server Error:', err);
    if (res.headersSent) return next(err);
    res.status(err.status || 500).json({
        success: false,
        message: err.message || 'Internal Server Error'
    });
});

const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () => {
    console.log(`✅ Server (Socket.io) chạy trên cổng ${PORT}`);
});

export default app;