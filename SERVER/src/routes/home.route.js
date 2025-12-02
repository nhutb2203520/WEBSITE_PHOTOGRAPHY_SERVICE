import express from "express";
import homeController from "../controllers/home.controller.js";

const router = express.Router();

// Public Route: Lấy thống kê trang chủ
// Endpoint sẽ là: /api/public/stats
router.get("/stats", homeController.getSystemStats);

export default router;