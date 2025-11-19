import express from "express";
import { verifyTokenUser } from "../middlewares/verifyToken.js";
import {
  createOrder,
  getMyOrders,
  updateOrderStatus,
} from "../controllers/order.controller.js";

const router = express.Router();

// Tạo đơn hàng
router.post("/",verifyTokenUser, createOrder);

// Lấy đơn hàng của khách
router.get("/my-orders",verifyTokenUser, getMyOrders);

// Admin / Photographer cập nhật trạng thái
router.put("/:orderId/status",verifyTokenUser, updateOrderStatus);

export default router;
