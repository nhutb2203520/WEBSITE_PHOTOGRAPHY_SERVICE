import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import connectDB from "./src/config/mongoDb.js";

// ✅ 1. BẮT LỖI TOÀN CỤC (QUAN TRỌNG)
process.on('uncaughtException', (err) => {
  console.error('🔥 LỖI NGHIÊM TRỌNG (Uncaught Exception):', err);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('🔥 LỖI PROMISE (Unhandled Rejection):', reason);
});

// ✅ Import models index TRƯỚC routes
import './src/models/index.js';

// ============ IMPORT ROUTES ============
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
import khachHangController from "./src/controllers/khachhang.controller.js";
import { verifyTokenUser } from "./src/middlewares/verifyToken.js";

// ✅ [MỚI] Route Thông báo cho Khách/Thợ
import notificationRoute from "./src/routes/notification.route.js";

// ✅ [MỚI] Route Thông báo cho Admin
import notificationAdminRoute from "./src/routes/notificationAdmin.route.js";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

connectDB();

const app = express();

// ============ MIDDLEWARE ============
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// ============ STATIC FILES ============
const uploadDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// ============ ROUTES REGISTRATION ============

// 1. Auth & Users
app.use("/api/auth", authRoutes);
app.use("/api/khachhang", khachHangRoutes);

// 2. Uploads & Profiles
app.use("/api/upload", uploadRoutes);
app.use("/api/worksprofile", worksProfileRoutes);

// 3. Services & Orders
app.use('/api/service-packages', servicePackageRoutes);
app.use("/api/orders", orderRoute);
app.use("/api/service-fees", serviceFeeRoutes);

// 4. Payments & Admin
app.use("/api/payment-methods", paymentMethodRoutes);
app.use("/api/admin", adminRoute);

// 5. Reviews, Schedule, Album, Complaint
app.use("/api/reviews", reviewRoutes);
app.use("/api/schedule", scheduleRoutes);
app.use("/api/albums", albumRoute);
app.use("/api/complaints", complaintRoute);

// 6. Direct Controller Routes
app.get("/api/my-profile", verifyTokenUser, khachHangController.getMyAccount);

// 7. ✅ Route Thông báo (User)
app.use("/api/notifications", notificationRoute);

// 8. ✅ Route Thông báo (Admin) - QUAN TRỌNG: Đây là dòng bạn bị thiếu
app.use("/api/admin/notifications", notificationAdminRoute);

// ============ ERROR HANDLERS ============
app.use((req, res) => {
  console.log('❌ 404 - Không tìm thấy:', req.method, req.originalUrl);
  res.status(404).json({ 
    success: false, 
    message: "Endpoint không tồn tại!" 
  });
});

app.use((err, req, res, next) => {
  console.error('❌ Server Error:', err);
  if (res.headersSent) return next(err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error'
  });
});

// ============ START SERVER ============
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✅ Server chạy trên cổng ${PORT}`);
});

export default app;