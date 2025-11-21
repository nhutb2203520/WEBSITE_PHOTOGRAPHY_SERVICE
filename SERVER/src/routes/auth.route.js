import express from "express";
import passport from "passport";
import jwt from "jsonwebtoken";
import authController from "../controllers/auth.controller.js";

const router = express.Router();

// ✅ Đăng ký & Đăng nhập
router.post("/register", authController.register);
router.post("/login", authController.login);

// Quên mật khẩu, reset token
router.post("/forgot-password", authController.forgotPassword);
router.post("/reset-password/:token", authController.resetPassword);
router.post("/refresh-token", authController.refreshToken);

export default router;