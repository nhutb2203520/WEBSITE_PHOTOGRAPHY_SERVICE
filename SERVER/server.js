// SERVER/server.js
import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import connectDB from "./src/config/mongoDb.js";

// ✅ CRITICAL: Import models index TRƯỚC routes để đăng ký tất cả schemas
import './src/models/index.js';

// Import routes
import authRoutes from "./src/routes/auth.route.js";
import khachHangRoutes from "./src/routes/khachhang.route.js";
import uploadRoutes from "./src/routes/upload.route.js";
import worksProfileRoutes from "./src/routes/worksprofile.route.js";
import servicePackageRoutes from "./src/routes/servicePackage.route.js";
import orderRoute from "./src/routes/order.route.js";

import khachHangController from "./src/controllers/khachhang.controller.js";
import { verifyTokenUser } from "./src/middlewares/verifyToken.js";

// ✅ Load environment & connect DB
dotenv.config();
connectDB();

const app = express();

// ============ MIDDLEWARE ============
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// ✅ Serve static files (avatar, cover, works, packages...)
app.use("/uploads", express.static("uploads"));

// ============ ROUTES ============
app.use("/api/auth", authRoutes);
app.use("/api/khachhang", khachHangRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/worksprofile", worksProfileRoutes);
app.use('/api/service-packages', servicePackageRoutes);
app.use("/api/orders", orderRoute);
// ✅ Get current user profile
app.get("/api/my-profile", verifyTokenUser, khachHangController.getMyAccount);

// ============ HEALTH CHECK ============
app.get("/", (req, res) => {
  res.json({ 
    message: '🎨 Photography Service API đang hoạt động!',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    endpoints: {
      auth: '/api/auth',
      customers: '/api/khachhang',
      upload: '/api/upload',
      worksProfile: '/api/worksprofile',
      servicePackages: '/api/service-packages',
      myProfile: '/api/my-profile'
    }
  });
});

// ============ ERROR HANDLERS ============
// 404 Handler
app.use((req, res) => {
  res.status(404).json({ 
    success: false,
    message: "Không tìm thấy endpoint này!" 
  });
});

// Global Error Handler
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
});

export default app;