import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import connectDB from "./src/config/mongoDb.js";

// ✅ CRITICAL: Import models index TRƯỚC routes để đăng ký tất cả schemas
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

// ✅ [MỚI] Import Route Thông báo
import notificationRoute from "./src/routes/notification.route.js";

// ✅ Load environment variables
dotenv.config();

// ✅ Config __dirname cho ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ✅ Connect Database
connectDB();

const app = express();

// ============ MIDDLEWARE ============
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// ============ STATIC FILES CONFIG ============
const uploadDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
  console.log('📂 Đã tạo thư mục uploads');
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

// 7. ✅ [MỚI] Route Thông báo
app.use("/api/notifications", notificationRoute);

// ============ HEALTH CHECK ============
app.get("/", (req, res) => {
  res.json({ 
    message: '🎨 Photography Service API đang hoạt động!',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    endpoints: {
      auth: '/api/auth',
      customers: '/api/khachhang',
      notifications: '/api/notifications', // ✅ Đã thêm vào docs
      orders: '/api/orders',
    }
  });
});

// ============ ERROR HANDLERS ============
app.use((req, res) => {
  console.log('❌ 404 - Không tìm thấy:', req.method, req.originalUrl);
  res.status(404).json({ 
    success: false,
    message: "Không tìm thấy endpoint này!",
    requestedUrl: req.originalUrl,
    method: req.method
  });
});

app.use((err, req, res, next) => {
  console.error('❌ Server Error:', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
    error: process.env.NODE_ENV === 'development' ? err.stack : {}
  });
});

// ============ START SERVER ============
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✅ Server chạy trên cổng ${PORT}`);
  console.log(`✅ API endpoint: http://localhost:${PORT}`);
  console.log(`✅ Static files: http://localhost:${PORT}/uploads`);
});

export default app;