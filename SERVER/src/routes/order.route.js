import express from "express";
import { verifyTokenUser } from "../middlewares/verifyToken.js";
import orderController from "../controllers/order.controller.js";
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const router = express.Router();

// --- CẤU HÌNH UPLOAD ẢNH (BẰNG CHỨNG THANH TOÁN) ---
const orderImgDir = 'uploads/orders';
if (!fs.existsSync(orderImgDir)) {
  fs.mkdirSync(orderImgDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, orderImgDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const id = req.params.orderId || 'payment';
    cb(null, `${id}-${Date.now()}${ext}`);
  },
});

const upload = multer({ 
    storage, 
    limits: { fileSize: 5 * 1024 * 1024 }, 
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Chỉ chấp nhận file ảnh!'));
        }
    }
});

// ==================== DEFINING ROUTES ====================

// 1. Tính phí & Tạo đơn
router.post("/calculate-travel-fee", verifyTokenUser, orderController.calculateTravelFee);
router.post("/", verifyTokenUser, orderController.createOrder);

// 2. Route dành cho KHÁCH HÀNG (Xem đơn mình đặt)
router.get("/my-orders", verifyTokenUser, orderController.getMyOrders);

// 3. ✅ Route dành riêng cho PHOTOGRAPHER (Xem đơn mình nhận)
router.get("/photographer/list", verifyTokenUser, orderController.getMyOrdersPhotographer);
router.get("/photographer/detail/:orderId", verifyTokenUser, orderController.getOrderDetailPhotographer);

// 4. Chi tiết & Cập nhật trạng thái chung
router.get("/:orderId", verifyTokenUser, orderController.getOrderDetail);
router.put("/:orderId/status", verifyTokenUser, orderController.updateOrderStatus);

// 5. Xác nhận thanh toán (Upload ảnh)
router.post(
  '/:orderId/confirm-payment',
  verifyTokenUser, 
  upload.single('payment_proof'), 
  orderController.confirmPayment
);

// 6. Khiếu nại & Đánh giá
router.post("/:orderId/complaint", verifyTokenUser, orderController.submitComplaint);
router.post("/:orderId/review", verifyTokenUser, orderController.submitReview);
router.put("/:orderId/resolve-complaint", verifyTokenUser, orderController.resolveComplaint);

export default router;