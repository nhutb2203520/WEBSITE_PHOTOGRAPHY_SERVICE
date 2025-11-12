// SERVER/src/routes/servicePackage.route.js
import express from 'express';
import servicePackageController from "../controllers/servicePackage.controller.js";
import { verifyTokenUser } from "../middlewares/verifyToken.js";
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { ServicePackage } from "../models/index.js";

const router = express.Router();

// ============ MULTER SETUP FOR PACKAGE IMAGES ============
const packageImgDir = 'uploads/packages';
if (!fs.existsSync(packageImgDir)) {
  fs.mkdirSync(packageImgDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, packageImgDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const userId = req.user?._id || req.user?.id || 'unknown';
    cb(null, `package-${userId}-${Date.now()}${ext}`);
  },
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (extname && mimetype) {
    cb(null, true);
  } else {
    cb(new Error('Chỉ chấp nhận file ảnh (jpg, png, gif, webp)!'));
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
});

// ============ PUBLIC ROUTES (Không cần đăng nhập) ============
// 📋 Lấy tất cả gói dịch vụ
router.get('/', servicePackageController.getAllPackages);

// 🔍 Lấy chi tiết 1 gói
router.get('/:id', servicePackageController.getPackageById);

// 🔍 Lấy gói của 1 photographer theo username
router.get('/photographer/:username', servicePackageController.getPackagesByPhotographer);

// ============ PROTECTED ROUTES (Cần đăng nhập) ============
// 🔍 Lấy gói của photographer hiện tại
router.get('/my/packages', verifyTokenUser, servicePackageController.getMyPackages);

// 📦 Tạo gói mới
router.post('/create', verifyTokenUser, servicePackageController.createPackage);

// ✏️ Cập nhật gói
router.patch('/:id', verifyTokenUser, servicePackageController.updatePackage);

// 🗑️ Xóa gói
router.delete('/:id', verifyTokenUser, servicePackageController.deletePackage);

// ⭐ Đánh giá gói (Yêu cầu đăng nhập)
router.post('/:id/rate', verifyTokenUser, servicePackageController.ratePackage);

// ============ UPLOAD PACKAGE IMAGE ============
router.post(
  '/:id/upload-image',
  verifyTokenUser,
  (req, res, next) => {
    upload.single('packageImage')(req, res, (err) => {
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
      const { id } = req.params;
      const photographerId = req.user._id || req.user.id;

      if (!req.file) {
        return res.status(400).json({ message: 'Không có file được tải lên!' });
      }

      // Kiểm tra quyền sở hữu
      const package_data = await ServicePackage.findById(id);
      if (!package_data) {
        return res.status(404).json({ message: 'Không tìm thấy gói dịch vụ' });
      }

      if (package_data.PhotographerId.toString() !== photographerId.toString()) {
        return res.status(403).json({ message: 'Bạn không có quyền chỉnh sửa gói này' });
      }

      const fileUrl = `${req.protocol}://${req.get('host')}/uploads/packages/${req.file.filename}`;

      // Cập nhật ảnh bìa
      const updated = await ServicePackage.findByIdAndUpdate(
        id,
        { AnhBia: fileUrl },
        { new: true }
      );

      res.status(200).json({
        message: 'Tải ảnh gói dịch vụ thành công!',
        fileUrl,
        package: updated,
      });
    } catch (err) {
      console.error('❌ Upload package image error:', err);
      res.status(500).json({ message: 'Lỗi khi tải ảnh lên máy chủ' });
    }
  }
);

export default router;