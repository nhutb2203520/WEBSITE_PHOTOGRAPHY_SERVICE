import express from "express";
import { createFee, getAllFees, updateFee, deleteFee } from "../controllers/servicefee.controller.js";
import { verifyTokenUser } from "../middlewares/verifyToken.js";
import { verifyAdmin } from "../middlewares/verifyAdmin.js";

const router = express.Router();

// Áp dụng middleware bảo vệ cho tất cả các route bên dưới
router.use(verifyTokenUser, verifyAdmin);

router.post("/", createFee);       // Tạo
router.get("/", getAllFees);       // Xem
router.put("/:id", updateFee);     // Sửa
router.delete("/:id", deleteFee);  // Xóa

export default router;