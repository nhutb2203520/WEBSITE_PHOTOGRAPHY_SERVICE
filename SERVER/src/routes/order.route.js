import express from "express";
import { verifyTokenUser } from "../middlewares/verifyToken.js";
import orderController from "../controllers/order.controller.js";
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const router = express.Router();

// --- CẤU HÌNH UPLOAD ẢNH THANH TOÁN ---
const orderImgDir = 'uploads/orders';
// Tạo thư mục nếu chưa có
if (!fs.existsSync(orderImgDir)) {
  fs.mkdirSync(orderImgDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, orderImgDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    // Tên file: payment-{timestamp}-{random}.ext
    cb(null, `payment-${Date.now()}-${Math.round(Math.random() * 1E9)}${ext}`);
  },
});

// Biến cấu hình upload tên là 'upload'
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('Chỉ chấp nhận file ảnh!'));
  }
});

// --- ROUTES ---

// API Tính phí (Preview)
router.post("/calculate-travel-fee", verifyTokenUser, orderController.calculateTravelFee);

// Tạo đơn hàng
router.post("/", verifyTokenUser, orderController.createOrder);

// Lấy danh sách đơn
router.get("/my-orders", verifyTokenUser, orderController.getMyOrders);

// Lấy chi tiết
router.get("/:orderId", verifyTokenUser, orderController.getOrderDetail);

// Cập nhật trạng thái (Admin/Photographer)
router.put("/:orderId/status", verifyTokenUser, orderController.updateOrderStatus);

// ✅ NEW: Xác nhận thanh toán & Upload ảnh bill (Khách hàng)
router.post(
  '/:orderId/confirm-payment', // Dùng :orderId để khớp với controller
  verifyTokenUser, 
  upload.single('payment_proof'), // ✅ Đã sửa: dùng biến 'upload' thay vì 'uploadCloud'
  orderController.confirmPayment
);

export default router;