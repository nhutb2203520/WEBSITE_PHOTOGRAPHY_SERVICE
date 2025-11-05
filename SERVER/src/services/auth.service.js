import crypto from "crypto";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";

import khachHangModel from "../models/khachhang.model.js";
import trangThaiKhachHangModel from "../models/trangthaikhachhang.model.js";
import ResetToken from "../models/resettoken.model.js";

dotenv.config();

const CLIENT_URL = process.env.CLIENT_URL;

class AuthService {
  // --- Đăng ký khách hàng ---
  async register(data) {
    const {
      username,
      fullname,
      email,
      phone,
      dateOfBirth,
      gender,
      password,
      isPhotographer,
    } = data;

    // Kiểm tra email trùng
    const existingUser = await khachHangModel.findOne({ Email: email });
    if (existingUser) throw new Error("Email đã được đăng ký.");

    // Lấy trạng thái khách hàng mặc định ("active")
    let customerStatus = await trangThaiKhachHangModel.findOne({ TenTT: "active" });
    if (!customerStatus) {
      customerStatus = await trangThaiKhachHangModel.create({ TenTT: "active" });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Tạo tài khoản
    const newUser = new khachHangModel({
      TenDangNhap: username,
      HoTen: fullname,
      NgaySinh: dateOfBirth,
      GioiTinh: gender,
      SoDienThoai: phone,
      Email: email,
      Password: hashedPassword,
      MaTT: customerStatus._id,
      isPhotographer,
    });

    await newUser.save();

    return {
      message: "Đăng ký tài khoản thành công.",
      user: {
        id: newUser._id,
        username: newUser.TenDangNhap,
        email: newUser.Email,
      },
    };
  }

  // --- Đăng nhập ---
  async login(identifier, password) {
  const user = await khachHangModel
    .findOne({
      $or: [
        { TenDangNhap: identifier.trim() },
        { Email: identifier.trim().toLowerCase() },
        { SoDienThoai: identifier.trim() },
      ],
    })
    .populate("MaTT", "TenTT");

  if (!user) throw new Error("Người dùng không tồn tại.");
  if (user.MaTT?.TenTT !== "active")
    throw new Error("Tài khoản bị khóa, vui lòng liên hệ quản trị viên.");

  const isMatch = await bcrypt.compare(password, user.Password);
  if (!isMatch) throw new Error("Mật khẩu không đúng.");

  const token = jwt.sign(
    { id: user._id, Email: user.Email },
    process.env.JWT_SECRET || "SecretKey",
    { expiresIn: "1h" }
  );

  const refreshToken = jwt.sign(
    { id: user._id },
    process.env.JWT_REFRESH_SECRET || "RefreshSecretKey",
    { expiresIn: "7d" }
  );

  user.RefreshToken = refreshToken;
  await user.save();

  return {
    message: "Đăng nhập thành công.",
    token,
    refreshToken,
    user: {
      id: user._id,
      username: user.TenDangNhap,
      email: user.Email,
    },
  };
}


  // --- Quên mật khẩu ---
  async requestResetPassword(identifier) {
    const user = await khachHangModel.findOne({
      $or: [{ Email: identifier.trim() }, { SoDienThoai: identifier.trim() }],
    });
    if (!user) throw new Error("Không tìm thấy người dùng.");

    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

    await ResetToken.create({
      KhachHangId: user._id,
      Token: token,
      expiresAt,
    });

    const resetLink = `${CLIENT_URL}/reset-password/${token}`;
    // await sendMail(user.Email, "Khôi phục mật khẩu", `<a href="${resetLink}">${resetLink}</a>`);

    return { message: "Liên kết đặt lại mật khẩu đã được gửi." };
  }

  // --- Đặt lại mật khẩu ---
  async resetPassword(token, newPassword) {
    const resetDoc = await ResetToken.findOne({
      Token: token,
      expiresAt: { $gt: new Date() },
    });
    if (!resetDoc) throw new Error("Token không hợp lệ hoặc đã hết hạn.");

    const user = await khachHangModel.findById(resetDoc.KhachHangId);
    if (!user) throw new Error("Không tìm thấy người dùng.");

    const salt = await bcrypt.genSalt(10);
    user.Password = await bcrypt.hash(newPassword, salt);
    await user.save();

    await ResetToken.deleteOne({ _id: resetDoc._id });
    return { message: "Đặt lại mật khẩu thành công." };
  }

  // --- Làm mới token ---
  async refreshAccessToken(refreshToken) {
    if (!refreshToken) throw new Error("Thiếu refresh token.");

    const decoded = jwt.verify(
      refreshToken,
      process.env.JWT_REFRESH_SECRET || "RefreshSecretKey"
    );

    const user = await khachHangModel.findById(decoded.id);
    if (!user || user.RefreshToken !== refreshToken)
      throw new Error("Refresh token không hợp lệ.");

    const accessToken = jwt.sign(
      { id: user._id, Email: user.Email },
      process.env.JWT_SECRET || "SecretKey",
      { expiresIn: "1h" }
    );

    return { token: accessToken };
  }
}

export default new AuthService();