import express from "express";
import { loginAdmin, refreshAccessToken, logoutAdmin } from "../controllers/admin.controller.js";
import { verifyTokenUser } from "../middlewares/verifyToken.js";

// ✅ THÊM 2 DÒNG IMPORT NÀY ĐỂ SỬA LỖI:
import { verifyAdmin } from "../middlewares/verifyAdmin.js"; 
import orderController from "../controllers/order.controller.js";

const router = express.Router();

// Public routes
router.post("/login", loginAdmin);
router.post("/refresh-token", refreshAccessToken);

// Protected routes
router.post("/logout", verifyTokenUser, logoutAdmin);

// --- CÁC ROUTE QUẢN LÝ ĐƠN HÀNG ---
// Bây giờ verifyAdmin và orderController đã được định nghĩa nhờ import bên trên
router.get("/orders", verifyTokenUser, verifyAdmin, orderController.getAllOrders);
router.put("/orders/:orderId/confirm-payment", verifyTokenUser, verifyAdmin, orderController.confirmPayment);
router.put("/orders/:orderId", verifyTokenUser, verifyAdmin, orderController.updateOrderStatus);

export default router;