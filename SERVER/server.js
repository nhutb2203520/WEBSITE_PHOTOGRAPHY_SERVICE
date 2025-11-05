import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import connectDB from "./src/config/mongoDb.js";
import authRoutes from "./src/routes/auth.route.js";
import khachHangRoutes from "./src/routes/khachhang.route.js";
import uploadRoutes from "./src/routes/upload.route.js";
import khachHangController from "./src/controllers/khachhang.controller.js";
import { verifyTokenUser } from "./src/middlewares/verifyToken.js";

dotenv.config();
connectDB();

const app = express();
app.use(cors());
app.use(express.json());

// ✅ Cho phép truy cập ảnh đã upload
app.use("/uploads", express.static("uploads"));

// ✅ Routes
app.use("/api/auth", authRoutes);
app.use("/api/khachhang", khachHangRoutes);
app.use("/api/upload", uploadRoutes);

// ✅ Lấy thông tin tài khoản hiện tại
app.get("/api/my-profile", verifyTokenUser, khachHangController.getMyAccount);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`✅ Server chạy trên cổng ${PORT}`));
