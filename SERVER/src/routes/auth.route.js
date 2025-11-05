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


// --- Google OAuth (nếu dùng) ---
/*
router.get(
  "/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

router.get(
  "/google/callback",
  passport.authenticate("google", {
    session: false,
    failureRedirect: `${process.env.CLIENT_URL}/signinuser?error=google_auth_failed`,
  }),
  async (req, res) => {
    try {
      const tokens = await new DocGiaService().generateAndSaveTokens(req.user);
      const redirectURL = `${process.env.CLIENT_URL}/auth/callback?token=${tokens.token}&refreshToken=${tokens.refreshToken}`;
      res.redirect(redirectURL);
    } catch (error) {
      res.redirect(
        `${process.env.CLIENT_URL}/signinuser?error=token_generation_failed`
      );
    }
  }
);
*/
