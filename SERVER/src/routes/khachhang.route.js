import express from "express";
import khachHangController from "../controllers/khachhang.controller.js";
import { verifyTokenUser } from "../middlewares/verifyToken.js";
import multer from "multer";
import path from "path";
import fs from "fs";
import KhachHang from "../models/khachhang.model.js";

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
  limits: { fileSize: 5 * 1024 * 1024 }
});

// ================== AUTHENTICATION ROUTES ==================
router
  .get("/me", verifyTokenUser, khachHangController.getMyAccount)
  .post("/register", khachHangController.register)
  .post("/login", khachHangController.login)
  .patch("/update", verifyTokenUser, khachHangController.updateAccount)
  .patch("/change-password", verifyTokenUser, khachHangController.changePassword);

// ================== UPLOAD ROUTES ==================
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

// ================== PHOTOGRAPHER ROUTES ==================
// 🆕 Get all photographers
router.get("/photographers", async (req, res) => {
  try {
    const photographers = await KhachHang.find(
      { isPhotographer: true },
      "TenDangNhap HoTen Avatar CoverImage Email SDT DiaChi isPhotographer"
    ).lean();

    console.log(`✅ Found ${photographers.length} photographers`);
    
    res.status(200).json(photographers);
  } catch (error) {
    console.error("❌ Error fetching photographers:", error);
    res.status(500).json({ message: "Lỗi máy chủ khi lấy danh sách photographer" });
  }
});

// ✅ FIX: Get photographer by username
router.get("/photographers/username/:username", async (req, res) => {
  try {
    const { username } = req.params;
    
    console.log(`🔍 Searching for photographer with username: ${username}`);
    
    // ✅ FIX: Use correct model name and field
    const photographer = await KhachHang.findOne({ 
      TenDangNhap: username,
      isPhotographer: true 
    });

    if (!photographer) {
      console.log(`❌ Photographer not found: ${username}`);
      return res.status(404).json({ 
        message: `Không tìm thấy photographer với username: ${username}` 
      });
    }

    console.log(`✅ Found photographer:`, photographer.HoTen);
    res.status(200).json(photographer);
    
  } catch (error) {
    console.error("❌ Error fetching photographer by username:", error);
    res.status(500).json({ 
      message: "Lỗi máy chủ khi lấy thông tin photographer",
      error: error.message 
    });
  }
});

// ✅ OPTIONAL: Get photographer by ID (fallback)
router.get("/photographers/id/:id", async (req, res) => {
  try {
    const { id } = req.params;
    
    console.log(`🔍 Searching for photographer with ID: ${id}`);
    
    const photographer = await KhachHang.findOne({
      _id: id,
      isPhotographer: true
    });

    if (!photographer) {
      console.log(`❌ Photographer not found: ${id}`);
      return res.status(404).json({ 
        message: `Không tìm thấy photographer với ID: ${id}` 
      });
    }

    console.log(`✅ Found photographer:`, photographer.HoTen);
    res.status(200).json(photographer);
    
  } catch (error) {
    console.error("❌ Error fetching photographer by ID:", error);
    res.status(500).json({ 
      message: "Lỗi máy chủ khi lấy thông tin photographer",
      error: error.message 
    });
  }
});

export default router;