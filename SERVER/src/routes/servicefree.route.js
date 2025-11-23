import express from "express";
import { createFee, getAllFees, updateFee, deleteFee } from "../controllers/serviceFee.controller.js";
import { verifyTokenUser } from "../middlewares/verifyToken.js";
import { verifyAdmin } from "../middlewares/verifyAdmin.js";

const router = express.Router();

// ✅ SỬA: Cho phép mọi User đã đăng nhập (bao gồm Nhiếp ảnh gia) xem danh sách phí
// Thay vì dùng verifyAdmin, chỉ dùng verifyTokenUser
router.get("/", verifyTokenUser, getAllFees);

// Các chức năng thay đổi dữ liệu vẫn giữ quyền Admin
router.post("/", verifyTokenUser, verifyAdmin, createFee);
router.put("/:id", verifyTokenUser, verifyAdmin, updateFee);
router.delete("/:id", verifyTokenUser, verifyAdmin, deleteFee);

export default router;