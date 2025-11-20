// SERVER/src/routes/paymentMethod.route.js
import express from "express";
import {
  getAllPaymentMethods,
  getPaymentMethodById,
  createPaymentMethod,
  updatePaymentMethod,
  deletePaymentMethod,
  uploadQRCode,
  toggleActiveStatus
} from "../controllers/paymentmethod.controller.js";

import { verifyTokenUser } from "../middlewares/verifyToken.js";
import multer from "multer";
import path from "path";
import fs from "fs";
import { PaymentMethod } from "../models/index.js";

const router = express.Router();

// ================== MIDDLEWARE KIỂM TRA ROLE ==================
export const authorizeRoles = (...roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.role)) {
    return res.status(403).json({ success: false, message: "Access denied" });
  }
  next();
};

// ================== MULTER SETUP FOR QR CODE ==================
const qrCodeDir = "uploads/qrcodes";
if (!fs.existsSync(qrCodeDir)) {
  fs.mkdirSync(qrCodeDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, qrCodeDir);
  },
  filename: (req, file, cb) => {
    const userId = req.user?._id || req.user?.id || "unknown";
    const unique = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, `qr-${userId}-${unique}${path.extname(file.originalname)}`);
  }
});

const fileFilter = (req, file, cb) => {
  if (!file.mimetype.startsWith("image/")) {
    return cb(new Error("Chỉ được upload file ảnh!"));
  }
  cb(null, true);
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB
});

// ================== PUBLIC ROUTES ==================
router.get("/", getAllPaymentMethods);
router.get("/:id", getPaymentMethodById);

// ================== PROTECTED ROUTES ==================
// Tạo phương thức thanh toán mới (admin/photographer)
router.post(
  "/",
  verifyTokenUser,
  authorizeRoles("admin", "photographer"),
  createPaymentMethod
);

// Cập nhật phương thức thanh toán
router.put(
  "/:id",
  verifyTokenUser,
  authorizeRoles("admin", "photographer"),
  updatePaymentMethod
);

// Xóa phương thức thanh toán
router.delete(
  "/:id",
  verifyTokenUser,
  authorizeRoles("admin"),
  deletePaymentMethod
);

// Upload QR code
router.post(
  "/:id/upload-qr",
  verifyTokenUser,
  authorizeRoles("admin", "photographer"),
  (req, res, next) => {
    upload.single("qrCode")(req, res, (err) => {
      if (err instanceof multer.MulterError) {
        return res.status(400).json({ message: `Lỗi upload: ${err.message}` });
      } else if (err) {
        return res.status(400).json({ message: err.message });
      }
      next();
    });
  },
  uploadQRCode
);

// Toggle trạng thái active/inactive
router.patch(
  "/:id/toggle-active",
  verifyTokenUser,
  authorizeRoles("admin"),
  toggleActiveStatus
);

export default router;
