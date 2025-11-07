import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import connectDB from "./src/config/mongoDb.js";

import authRoutes from "./src/routes/auth.route.js";
import khachHangRoutes from "./src/routes/khachhang.route.js";
import uploadRoutes from "./src/routes/upload.route.js";
import worksProfileRoutes from "./src/routes/worksprofile.route.js";

import khachHangController from "./src/controllers/khachhang.controller.js";
import { verifyTokenUser } from "./src/middlewares/verifyToken.js";

dotenv.config();
connectDB();

const app = express();

// Middleware chung
app.use(cors());
app.use(express.json());

// ✅ Cho phép truy cập ảnh upload (avatar, cover, tác phẩm,…)
app.use("/uploads", express.static("uploads"));

// ✅ Mount các route chính
app.use("/api/auth", authRoutes);
app.use("/api/khachhang", khachHangRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/worksprofile", worksProfileRoutes);

// ✅ Lấy thông tin tài khoản hiện tại (user profile)
app.get("/api/my-profile", verifyTokenUser, khachHangController.getMyAccount);

// ✅ Route mặc định (test server)
app.get("/", (req, res) => {
  res.send("🎨 Photography Service API đang hoạt động!");
});

// ✅ Xử lý lỗi không tìm thấy route
app.use((req, res) => {
  res.status(404).json({ message: "Không tìm thấy endpoint này!" });
});

// ✅ Khởi chạy server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`✅ Server chạy trên cổng ${PORT}`));
