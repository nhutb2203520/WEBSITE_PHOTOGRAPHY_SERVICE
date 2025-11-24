import express from "express";
import { getReviews, createReview } from "../controllers/review.controller.js";
import { verifyTokenUser } from "../middlewares/verifyToken.js";

const router = express.Router();

// Public: Lấy danh sách review
router.get("/", getReviews);

// Private: Tạo review mới (Cần đăng nhập)
router.post("/", verifyTokenUser, createReview);

export default router;