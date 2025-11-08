import express from "express";
import khachHangController from "../controllers/khachhang.controller.js";
import { verifyTokenUser } from "../middlewares/verifyToken.js";
import multer from "multer";
import path from "path";
import fs from "fs";
import KhachHang from "../models/khachhang.model.js"; // ← THÊM IMPORT

const router = express.Router();


const avatarDir = "uploads/avatars";
if (!fs.existsSync(avatarDir)) {
  fs.mkdirSync(avatarDir, { recursive: true });
}


const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, avatarDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const userId = req.user?._id || req.user?.id || 'unknown';
    cb(null, `${userId}-${Date.now()}${ext}`);
  },
});


const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (extname && mimetype) {
    cb(null, true);
  } else {
    cb(new Error("Chỉ chấp nhận file ảnh (jpg, png, gif, webp)!"));
  }
};

const upload = multer({ 
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 } // Giới hạn 5MB
});


router
  .get("/me", verifyTokenUser, khachHangController.getMyAccount)
  .post("/register", khachHangController.register)
  .post("/login", khachHangController.login)
  .patch("/update", verifyTokenUser, khachHangController.updateAccount)
  .patch("/change-password", verifyTokenUser, khachHangController.changePassword);

router.post(
  "/upload-avatar",
  verifyTokenUser,
  (req, res, next) => {
    upload.single("avatar")(req, res, (err) => {
      if (err instanceof multer.MulterError) {
        return res.status(400).json({ message: `Lỗi upload: ${err.message}` });
      } else if (err) {
        return res.status(400).json({ message: err.message });
      }
      next();
    });
  },
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "Không có file được tải lên!" });
      }

      const userId = req.user._id || req.user.id;
      const fileUrl = `${req.protocol}://${req.get("host")}/uploads/avatars/${req.file.filename}`;
      
      // ✅ CẬP NHẬT VÀO DATABASE
      const updated = await KhachHang.findByIdAndUpdate(
        userId,
        { Avatar: fileUrl },
        { new: true }
      );

      if (!updated) {
        return res.status(404).json({ message: "Không tìm thấy người dùng!" });
      }
      
      res.status(200).json({
        message: "Tải ảnh đại diện thành công!",
        fileUrl,
        user: updated
      });
    } catch (err) {
      console.error("❌ Upload avatar error:", err);
      res.status(500).json({ message: "Lỗi khi tải ảnh lên máy chủ" });
    }
  }
);

// 🆕 Route upload ảnh bìa - CẬP NHẬT VÀO DATABASE
router.post(
  "/upload-cover",
  verifyTokenUser,
  (req, res, next) => {
    upload.single("cover")(req, res, (err) => {
      if (err instanceof multer.MulterError) {
        return res.status(400).json({ message: `Lỗi upload: ${err.message}` });
      } else if (err) {
        return res.status(400).json({ message: err.message });
      }
      next();
    });
  },
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "Không có file được tải lên!" });
      }

      const userId = req.user._id || req.user.id;
      const fileUrl = `${req.protocol}://${req.get("host")}/uploads/avatars/${req.file.filename}`;
      
      // ✅ CẬP NHẬT VÀO DATABASE
      const updated = await KhachHang.findByIdAndUpdate(
        userId,
        { CoverImage: fileUrl },
        { new: true }
      );

      if (!updated) {
        return res.status(404).json({ message: "Không tìm thấy người dùng!" });
      }     
      res.status(200).json({
        message: "Tải ảnh bìa thành công!",
        fileUrl,
        user: updated
      });
    } catch (err) {
      console.error("❌ Upload cover error:", err);
      res.status(500).json({ message: "Lỗi khi tải ảnh bìa lên máy chủ" });
    }
  }
);
// 🆕 API công khai: Lấy danh sách photographer
router.get("/photographers", async (req, res) => {
  try {
    const photographers = await KhachHang.find(
      { isPhotographer: true },
      "HoTen Avatar CoverImage Email isPhotographer"
    ).lean();

    if (!photographers.length) {
      return res.status(200).json([]);
    }

    res.status(200).json(photographers);
  } catch (error) {
    console.error("❌ Lỗi khi lấy danh sách photographer:", error);
    res.status(500).json({ message: "Lỗi máy chủ khi lấy danh sách photographer" });
  }
});

export default router;