import express from "express";
import favoriteController from "../controllers/favorite.controller.js";
import { verifyTokenUser } from "../middlewares/verifyToken.js";

const router = express.Router();

// Yêu cầu đăng nhập để dùng tính năng này
router.post("/toggle", verifyTokenUser, favoriteController.toggleFavorite);
router.get("/my-favorites", verifyTokenUser, favoriteController.getMyFavorites);

export default router;