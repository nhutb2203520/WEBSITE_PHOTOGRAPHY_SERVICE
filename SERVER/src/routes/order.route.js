import express from "express";
import { verifyTokenUser } from "../middlewares/verifyToken.js";
import orderController from "../controllers/order.controller.js";
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const router = express.Router();

// --- CẤU HÌNH UPLOAD ẢNH (BẰNG CHỨNG THANH TOÁN) ---
const orderImgDir = 'uploads/orders';

// Tạo thư mục nếu chưa tồn tại
if (!fs.existsSync(orderImgDir)) {
  fs.mkdirSync(orderImgDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, orderImgDir);
  },
  filename: (req, file, cb) => {
    // Đặt tên file: orderId-timestamp.ext để tránh trùng lặp
    const ext = path.extname(file.originalname);
    // Lưu ý: req.params.orderId có thể undefined nếu route không parse kịp, nên dùng fallback
    const id = req.params.orderId || 'payment';
    cb(null, `${id}-${Date.now()}${ext}`);
  },
});

const upload = multer({ 
    storage, 
    limits: { fileSize: 5 * 1024 * 1024 }, // Giới hạn 5MB
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Chỉ chấp nhận file ảnh!'));
        }
    }
});

// ==================== DEFINING ROUTES ====================

// 1. Tính phí di chuyển (Preview trước khi tạo đơn)
router.post("/calculate-travel-fee", verifyTokenUser, orderController.calculateTravelFee);

// 2. Tạo đơn hàng mới
router.post("/", verifyTokenUser, orderController.createOrder);

// 3. Lấy danh sách đơn hàng của tôi (User)
router.get("/my-orders", verifyTokenUser, orderController.getMyOrders);

// 4. Lấy chi tiết đơn hàng theo ID
router.get("/:orderId", verifyTokenUser, orderController.getOrderDetail);

// 5. Cập nhật trạng thái đơn hàng (Hủy đơn / Admin update)
router.put("/:orderId/status", verifyTokenUser, orderController.updateOrderStatus);

// 6. Xác nhận thanh toán (Cọc hoặc Thanh toán phần còn lại)
// Có upload ảnh minh chứng chuyển khoản
router.post(
  '/:orderId/confirm-payment',
  verifyTokenUser, 
  upload.single('payment_proof'), 
  orderController.confirmPayment
);

// 7. Gửi khiếu nại (Khách hàng)
router.post("/:orderId/complaint", verifyTokenUser, orderController.submitComplaint);

// 8. Gửi đánh giá & Nhận xét (Khách hàng)
router.post("/:orderId/review", verifyTokenUser, orderController.submitReview);

// 9. Admin giải quyết khiếu nại
// (Trong thực tế nên có thêm middleware verifyTokenAdmin hoặc check role trong controller)
router.put("/:orderId/resolve-complaint", verifyTokenUser, orderController.resolveComplaint);

export default router;