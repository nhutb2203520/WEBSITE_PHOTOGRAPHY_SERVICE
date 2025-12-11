import express from "express";
import { getReviews, createReview, updateReview } from "../controllers/review.controller.js";
import { verifyTokenUser } from "../middlewares/verifyToken.js";
import multer from "multer";
import path from "path";
import fs from "fs";

const router = express.Router();

const uploadDir = "uploads/reviews/";
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
      const ext = path.extname(file.originalname);
      cb(null, `review-${Date.now()}-${Math.round(Math.random() * 1E9)}${ext}`);
  },
});

const upload = multer({ 
    storage, 
    limits: { fileSize: 100 * 1024 * 1024 } 
});

// GET /api/reviews
router.get("/", getReviews);

// POST /api/reviews
router.post("/", verifyTokenUser, upload.array('images', 5), createReview);

// PUT /api/reviews/:id
router.put("/:id", verifyTokenUser, upload.array('images', 5), updateReview);

export default router;