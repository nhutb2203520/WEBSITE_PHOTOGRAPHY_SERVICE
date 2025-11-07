import express from "express";
import multer from "multer";
import { verifyTokenUser } from "../middlewares/verifyToken.js";
import {
  createWorksProfile,
  getMyWorksProfiles,
  deleteWorkProfile,
} from "../controllers/worksprofile.controller.js";

const router = express.Router();

// ✅ Cấu hình multer để lưu ảnh vào thư mục uploads/
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) => cb(null, Date.now() + "-" + file.originalname),
});

const upload = multer({ storage });

// ✅ Các route chính
router.post("/create", verifyTokenUser, upload.array("images", 10), createWorksProfile);
router.get("/my", verifyTokenUser, getMyWorksProfiles);
router.delete("/:id", verifyTokenUser, deleteWorkProfile);

export default router;
