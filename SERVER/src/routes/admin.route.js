import express from "express";
import { loginAdmin, refreshAccessToken, logoutAdmin } from "../controllers/admin.controller.js";
import { verifyTokenUser } from "../middlewares/verifyToken.js";

const router = express.Router();

// Public routes
router.post("/login", loginAdmin);
router.post("/refresh-token", refreshAccessToken);

// Protected routes
router.post("/logout", verifyTokenUser, logoutAdmin);

export default router;