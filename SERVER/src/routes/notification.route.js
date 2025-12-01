import express from "express";
import notificationController from "../controllers/notification.controller.js";
import { verifyTokenUser } from "../middlewares/verifyToken.js"; 

const router = express.Router();

// Bắt buộc đăng nhập mới xem được thông báo
router.use(verifyTokenUser);

router.get("/", notificationController.getMyNotifications);
router.patch("/:id/read", notificationController.markAsRead);
router.patch("/read-all", notificationController.markAllAsRead);

export default router;