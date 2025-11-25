import express from "express";
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { verifyTokenUser } from "../middlewares/verifyToken.js";
import * as albumController from "../controllers/album.controller.js";

const router = express.Router();

// --- CẤU HÌNH LƯU TRỮ ---
const albumDir = 'uploads/albums';
if (!fs.existsSync(albumDir)) {
    fs.mkdirSync(albumDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, albumDir),
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'photo-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 50 * 1024 * 1024,
        files: 1000
    },
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) cb(null, true);
        else cb(new Error('Chỉ chấp nhận file ảnh!'));
    }
});

// ================= API ENDPOINTS =================

// 1. Tạo album Job ngoài (Freelance) - MỚI
router.post("/freelance", verifyTokenUser, albumController.createFreelanceAlbum);

// 2. Lấy danh sách tất cả album của Photographer - MỚI
router.get("/my-albums", verifyTokenUser, albumController.getMyAlbums);

// 3. Upload ảnh (Dùng chung cho cả Order và Freelance)
// :id có thể là OrderID hoặc AlbumID
router.post("/:id/upload", verifyTokenUser, upload.array('photos', 1000), albumController.uploadPhotos);

// 4. Lấy chi tiết album
router.get("/:id", verifyTokenUser, albumController.getAlbum);

// 5. Khách hàng gửi lựa chọn ảnh
router.put("/:id/selection", verifyTokenUser, albumController.selectPhotos);

// 6. Cập nhật thông tin album
router.put("/:id/info", verifyTokenUser, albumController.updateAlbumInfo);

// 7. Xóa 1 ảnh cụ thể
router.delete("/:id/photos/:photoId", verifyTokenUser, albumController.deletePhoto);

// 8. Xóa toàn bộ album
router.delete("/:id", verifyTokenUser, albumController.deleteAlbum);

export default router;