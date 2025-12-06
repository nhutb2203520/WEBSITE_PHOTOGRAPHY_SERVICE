import express from 'express';
// ✅ Import controller và hàm AI Helper
import servicePackageController, { analyzePackageImage } from "../controllers/servicePackage.controller.js";
import { verifyTokenUser } from "../middlewares/verifyToken.js";
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { ServicePackage } from "../models/index.js";

const router = express.Router();

// ==========================================
// 📁 CẤU HÌNH MULTER (UPLOAD ẢNH)
// ==========================================
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
    // Đặt tên file duy nhất
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
  limits: { fileSize: 500 * 1024 * 1024 }, // Max 500MB
});

// ==========================================
// 🔍 ROUTES: AI SEARCH
// ==========================================
// Endpoint này dùng ảnh upload lên để tìm gói dịch vụ tương tự
router.post('/search-image', upload.single('image'), servicePackageController.searchByImage);


// ==========================================
// 🌍 ROUTES: PUBLIC (KHÔNG CẦN LOGIN)
// ==========================================
router.get('/', servicePackageController.getAllPackages);
router.get('/:id', servicePackageController.getPackageById);
router.get('/photographer/:username', servicePackageController.getPackagesByPhotographer);


// ==========================================
// 🔒 ROUTES: PROTECTED (CẦN LOGIN)
// ==========================================
router.get('/my/packages', verifyTokenUser, servicePackageController.getMyPackages);
router.post('/create', verifyTokenUser, servicePackageController.createPackage);
router.patch('/:id', verifyTokenUser, servicePackageController.updatePackage);
router.delete('/:id', verifyTokenUser, servicePackageController.deletePackage);
router.post('/:id/rate', verifyTokenUser, servicePackageController.ratePackage);


// ==========================================
// 📸 ROUTES: UPLOAD ẢNH (TÍCH HỢP AI)
// ==========================================

// 1️⃣ Upload ảnh bìa (Single) -> TRIGGER AI
router.post(
  '/:id/upload-image',
  verifyTokenUser,
  (req, res, next) => {
    upload.single('packageImage')(req, res, (err) => {
      if (err) return res.status(400).json({ message: err.message });
      next();
    });
  },
  async (req, res) => {
    try {
      const { id } = req.params;
      const photographerId = req.user._id || req.user.id;

      if (!req.file) return res.status(400).json({ message: 'Không có file!' });

      const package_data = await ServicePackage.findById(id);
      if (!package_data) return res.status(404).json({ message: 'Không tìm thấy gói' });
      
      if (package_data.PhotographerId.toString() !== photographerId.toString()) {
        return res.status(403).json({ message: 'Không có quyền chỉnh sửa' });
      }

      // Tạo URL truy cập ảnh
      const fileUrl = `${req.protocol}://${req.get('host')}/uploads/packages/${req.file.filename}`;

      // Cập nhật vào DB
      const updated = await ServicePackage.findByIdAndUpdate(
        id,
        { AnhBia: fileUrl },
        { new: true }
      );

      // 🤖 TRIGGER AI: Gửi ảnh mới sang Python để học lại Vector ngay lập tức
      // (Không dùng await để response nhanh cho client)
      analyzePackageImage(id, fileUrl);

      res.status(200).json({
        message: 'Tải ảnh bìa thành công!',
        fileUrl,
        package: updated,
      });
    } catch (err) {
      console.error('❌ Upload package image error:', err);
      res.status(500).json({ message: 'Lỗi server' });
    }
  }
);

// 2️⃣ Upload nhiều ảnh (Multiple) -> Cập nhật Gallery
router.post(
  '/:id/upload-images',
  verifyTokenUser,
  (req, res, next) => {
    upload.array('packageImages', 20)(req, res, (err) => {
      if (err) return res.status(400).json({ message: err.message });
      next();
    });
  },
  async (req, res) => {
    try {
      const { id } = req.params;
      const photographerId = req.user._id || req.user.id;

      if (!req.files || req.files.length === 0) return res.status(400).json({ message: 'Không có file!' });

      const package_data = await ServicePackage.findById(id);
      if (!package_data) return res.status(404).json({ message: 'Không tìm thấy gói' });
      
      if (package_data.PhotographerId.toString() !== photographerId.toString()) {
        return res.status(403).json({ message: 'Không có quyền' });
      }

      const fileUrls = req.files.map(file => 
        `${req.protocol}://${req.get('host')}/uploads/packages/${file.filename}`
      );

      const updated = await ServicePackage.findByIdAndUpdate(
        id,
        { $push: { Images: { $each: fileUrls } } },
        { new: true }
      );
      
      // (Tùy chọn) Nếu gói chưa có ảnh bìa, dùng ảnh đầu tiên gallery để học AI
      if (!updated.AnhBia && fileUrls.length > 0) {
        analyzePackageImage(id, fileUrls[0]);
      }

      res.status(200).json({
        message: `Tải ${fileUrls.length} ảnh thành công!`,
        fileUrls,
        package: updated,
      });
    } catch (err) {
      console.error('❌ Upload gallery error:', err);
      res.status(500).json({ message: 'Lỗi server' });
    }
  }
);

// 3️⃣ Xóa ảnh khỏi gallery
router.delete(
  '/:id/delete-image',
  verifyTokenUser,
  async (req, res) => {
    try {
      const { id } = req.params;
      const { imageUrl } = req.body;
      const photographerId = req.user._id || req.user.id;

      if (!imageUrl) return res.status(400).json({ message: 'Thiếu URL ảnh' });

      const package_data = await ServicePackage.findById(id);
      if (!package_data) return res.status(404).json({ message: 'Không tìm thấy gói' });

      if (package_data.PhotographerId.toString() !== photographerId.toString()) {
        return res.status(403).json({ message: 'Không có quyền' });
      }

      const updated = await ServicePackage.findByIdAndUpdate(
        id,
        { $pull: { Images: imageUrl } },
        { new: true }
      );

      res.status(200).json({
        message: 'Xóa ảnh thành công!',
        package: updated,
      });
    } catch (err) {
      console.error('❌ Delete image error:', err);
      res.status(500).json({ message: 'Lỗi server' });
    }
  }
);

export default router;