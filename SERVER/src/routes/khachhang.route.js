import express from "express";
import khachHangController from "../controllers/khachhang.controller.js";
import { verifyTokenUser } from "../middlewares/verifyToken.js";

const router = express.Router();

router
  .get("/me", verifyTokenUser, khachHangController.getMyAccount)
  .post("/register", khachHangController.register)
  .post("/login", khachHangController.login)
  .patch("/update", verifyTokenUser, khachHangController.updateAccount)
  .patch("/change-password", verifyTokenUser, khachHangController.changePassword);

export default router;
