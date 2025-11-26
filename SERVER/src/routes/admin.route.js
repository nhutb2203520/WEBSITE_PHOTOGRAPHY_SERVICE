import express from "express";
import { 
  loginAdmin, 
  refreshAccessToken, 
  logoutAdmin,
  getCustomers,       // ✅ Thêm mới
  getPhotographers,   // ✅ Thêm mới

} from "../controllers/admin.controller.js";
import { verifyTokenUser } from "../middlewares/verifyToken.js";
import { verifyAdmin } from "../middlewares/verifyAdmin.js"; 
import orderController from "../controllers/order.controller.js";

const router = express.Router();

// ==================================================
// 🔐 AUTHENTICATION ROUTES
// ==================================================
router.post("/login", loginAdmin);
router.post("/refresh-token", refreshAccessToken);
router.post("/logout", verifyTokenUser, logoutAdmin);

// ==================================================
// 📦 ORDER MANAGEMENT ROUTES
// ==================================================

// 1. Lấy danh sách tất cả đơn hàng (có tính phí sàn)
router.get("/orders", verifyTokenUser, verifyAdmin, orderController.getAllOrders);

// 2. 👇 QUAN TRỌNG: Quyết toán lương cho thợ ảnh
router.put("/orders/:orderId/settle", verifyTokenUser, verifyAdmin, orderController.settleForPhotographer);

// 3. Xác nhận thanh toán từ khách (nếu Admin làm thay khách)
router.put("/orders/:orderId/confirm-payment", verifyTokenUser, verifyAdmin, orderController.confirmPayment);

// 4. Cập nhật trạng thái đơn hàng chung
router.put("/orders/:orderId", verifyTokenUser, verifyAdmin, orderController.updateOrderStatus);

// ==================================================
// 👥 USER MANAGEMENT ROUTES (Khách hàng & Thợ ảnh)
// ==================================================

// 1. Lấy danh sách Khách hàng
router.get("/customers", verifyTokenUser, verifyAdmin, getCustomers);

// 2. Lấy danh sách Nhiếp ảnh gia
router.get("/photographers", verifyTokenUser, verifyAdmin, getPhotographers);



export default router;