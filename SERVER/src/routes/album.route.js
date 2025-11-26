import express from "express";
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { verifyTokenUser } from "../middlewares/verifyToken.js";
import * as albumController from "../controllers/album.controller.js";

const router = express.Router();

const albumDir = 'uploads/albums';
if (!fs.existsSync(albumDir)) fs.mkdirSync(albumDir, { recursive: true });
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, albumDir),
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'photo-' + uniqueSuffix + path.extname(file.originalname));
    }
});
const upload = multer({
    storage: storage, limits: { fileSize: 50 * 1024 * 1024, files: 1000 },
    fileFilter: (req, file, cb) => { if (file.mimetype.startsWith('image/')) cb(null, true); else cb(new Error('Chỉ chấp nhận file ảnh!')); }
});

// --- PUBLIC API ---
router.get("/public/:token", albumController.getPublicAlbum);
router.put("/public/:token/selection", albumController.submitPublicSelection);

// --- PRIVATE API ---
router.post("/:id/share", verifyTokenUser, albumController.createShareLink);

// [NEW] Route Giao Album (Upload ảnh chỉnh sửa)
router.post("/:id/deliver", verifyTokenUser, upload.array('photos', 1000), albumController.deliverAlbum);

// Các route cũ
router.post("/freelance", verifyTokenUser, albumController.createFreelanceAlbum);
router.get("/my-albums", verifyTokenUser, albumController.getMyAlbums);
router.post("/:id/upload", verifyTokenUser, upload.array('photos', 1000), albumController.uploadPhotos);
router.get("/:id", verifyTokenUser, albumController.getAlbum);
router.put("/:id/selection", verifyTokenUser, albumController.selectPhotos);
router.put("/:id/info", verifyTokenUser, albumController.updateAlbumInfo);
router.delete("/:id/photos/:photoId", verifyTokenUser, albumController.deletePhoto);
router.delete("/:id", verifyTokenUser, albumController.deleteAlbum);

export default router;