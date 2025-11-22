import express from "express";
import paymentMethodController from "../controllers/paymentmethod.controller.js";
import { verifyTokenUser } from "../middlewares/verifyToken.js"; 

const router = express.Router();

// --- MIDDLEWARE AUTHORIZATION ---
// Hàm kiểm tra quyền Admin (bạn có thể tách ra file riêng)
const authorizeAdmin = (req, res, next) => {
  if (req.user && (req.user.role === 'admin' || req.user.isAdmin)) {
    next();
  } else {
    res.status(403).json({ message: "Yêu cầu quyền Admin" });
  }
};

// --- ROUTES ---

// Public: Lấy danh sách
router.get("/", paymentMethodController.getAllPaymentMethods);

// Public: Lấy chi tiết
router.get("/:id", paymentMethodController.getPaymentMethodById);

// Protected: Tạo mới (JSON)
router.post(
  "/",
  verifyTokenUser,
  authorizeAdmin,
  paymentMethodController.createPaymentMethod
);

// Protected: Cập nhật (JSON)
router.put(
  "/:id",
  verifyTokenUser,
  authorizeAdmin,
  paymentMethodController.updatePaymentMethod
);

// Protected: Xóa
router.delete(
  "/:id",
  verifyTokenUser,
  authorizeAdmin,
  paymentMethodController.deletePaymentMethod
);

// Protected: Toggle Active
router.patch(
  "/:id/toggle-active",
  verifyTokenUser,
  authorizeAdmin,
  paymentMethodController.toggleActiveStatus
);

export default router;