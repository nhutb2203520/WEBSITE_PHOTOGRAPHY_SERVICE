import express from "express";
import notificationAdminController from "../controllers/notificationAdmin.controller.js";
import { verifyAdmin } from "../middlewares/verifyAdmin.js"; // Dùng middleware bảo vệ Admin

const router = express.Router();

// Tất cả route này đều yêu cầu quyền Admin
router.use(verifyAdmin);

router.get("/", notificationAdminController.getMyNotifications);
router.patch("/:id/read", notificationAdminController.markAsRead);
router.patch("/read-all", notificationAdminController.markAllAsRead);

export default router;