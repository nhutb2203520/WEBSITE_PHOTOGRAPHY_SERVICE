import express from "express";
import khachHangController from "../controllers/khachhang.controller.js";
import { verifyTokenUser, verifyTokenStaff } from "../middlewares/verifyToken.js";
// import nhanVienController from "../controllers/nhanvien.controller.js";

const router = express.Router();

// Khách hàng
router
  .get("/me", verifyTokenUser, khachHangController.getMyAccount)
  .post("/register", khachHangController.register)
  .post("/login", khachHangController.login)
  .delete("/me", verifyTokenUser, khachHangController.deleteMyAccount)
  .patch("/change-password", verifyTokenUser, khachHangController.changePassword)
  .patch("/me", verifyTokenUser, khachHangController.updateAccount);

// Nhân viên (nếu cần)
/*
router
  .get("/", verifyTokenStaff, nhanVienController.getAllReaders)
  .get("/:id", verifyTokenStaff, nhanVienController.getOneReader)
  .patch(
    "/update-status/:id",
    verifyTokenStaff,
    nhanVienController.updateStatusReader
  );
*/

export default router;
