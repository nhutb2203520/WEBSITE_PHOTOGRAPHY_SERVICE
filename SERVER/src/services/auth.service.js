import crypto from "crypto";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";

import khachHangModel from "../models/khachhang.model.js";
import trangThaiKhachHangModel from "../models/trangthaikhachhang.model.js";
import ResetToken from "../models/resettoken.model.js";
import sendMail from "../utils/sendMail.js"; 

dotenv.config();

const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:5173"; 
const JWT_SECRET = process.env.JWT_SECRET || "Luan Van Tot Nghiep-B2203520";
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || "RefreshSecretKey";

class AuthService {
  
  // --- 1. ĐĂNG KÝ (Tự động gán trạng thái active) ---
  async register(data) {
    const { username, fullname, email, phone, dateOfBirth, gender, password, isPhotographer } = data;

    // Check trùng lặp
    const existingEmail = await khachHangModel.findOne({ Email: email.trim().toLowerCase() });
    if (existingEmail) throw new Error("Email đã được đăng ký.");

    const existingPhone = await khachHangModel.findOne({ SoDienThoai: phone.trim() });
    if (existingPhone) throw new Error("Số điện thoại đã được đăng ký.");

    const existingUsername = await khachHangModel.findOne({ TenDangNhap: username.trim() });
    if (existingUsername) throw new Error("Tên đăng nhập đã tồn tại.");

    // Tìm trạng thái 'active' trong DB của bạn
    let customerStatus = await trangThaiKhachHangModel.findOne({ TenTT: "active" });
    
    // Fallback: Nếu lỡ DB chưa có thì tạo mới (để tránh lỗi)
    if (!customerStatus) {
      customerStatus = await trangThaiKhachHangModel.create({ TenTT: "active" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = new khachHangModel({
      TenDangNhap: username.trim(),
      HoTen: fullname.trim(),
      NgaySinh: dateOfBirth,
      GioiTinh: gender,
      SoDienThoai: phone.trim(),
      Email: email.trim().toLowerCase(),
      Password: hashedPassword,
      MaTT: customerStatus._id, // Gán ID của trạng thái active
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

  // --- 2. ĐĂNG NHẬP (Logic kiểm tra khóa tài khoản ở đây) ---
  async login(identifier, password) {
    // Tìm user và lấy luôn thông tin bảng trạng thái (MaTT)
    const user = await khachHangModel
      .findOne({
        $or: [
          { TenDangNhap: identifier.trim() },
          { Email: identifier.trim().toLowerCase() },
          { SoDienThoai: identifier.trim() },
        ],
      })
      .populate("MaTT", "TenTT"); // Lấy trường TenTT từ bảng trạng thái

    if (!user) throw new Error("Tài khoản không tồn tại.");

    // === KIỂM TRA TRẠNG THÁI ===
    // Lấy tên trạng thái, chuyển về chữ thường
    // Dùng .includes("locked") để bắt cả trường hợp "locked" và "locked"" (lỗi dư dấu nháy)
    const statusName = user.MaTT?.TenTT?.toLowerCase() || "";

    if (statusName.includes("locked") || statusName.includes("khoa")) {
        throw new Error("Tài khoản của bạn đã bị KHÓA. Vui lòng liên hệ Admin để mở khóa.");
    }

    // Nếu muốn chặt chẽ hơn: Chỉ cho phép "active" đăng nhập
    if (statusName !== "active") {
         // Nếu trạng thái rỗng hoặc lạ -> cũng chặn luôn cho an toàn
         // throw new Error("Trạng thái tài khoản không hợp lệ. Vui lòng liên hệ Admin.");
    }
    // =============================

    const isMatch = await bcrypt.compare(password, user.Password);
    if (!isMatch) throw new Error("Mật khẩu không đúng.");

    const token = jwt.sign(
      { id: user._id, Email: user.Email, role: user.isPhotographer ? "photographer" : "customer" },
      JWT_SECRET,
      { expiresIn: "24h" }
    );

    const refreshToken = jwt.sign(
      { id: user._id },
      JWT_REFRESH_SECRET,
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
        avatar: user.Avatar,
        role: user.isPhotographer ? "photographer" : "customer",
      },
    };
  }

  // --- Các hàm khác giữ nguyên ---
  async requestResetPassword(identifier) {
    const user = await khachHangModel.findOne({
      $or: [{ Email: identifier.trim() }, { SoDienThoai: identifier.trim() }],
    });
    if (!user) throw new Error("Không tìm thấy người dùng.");

    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); 

    await ResetToken.create({ userId: user._id, token: token, expiresAt });

    const resetLink = `${CLIENT_URL}/reset-password/${token}`;
    
    // Gửi mail thật
    const mailContent = `
      <h3>Yêu cầu đặt lại mật khẩu</h3>
      <p>Xin chào ${user.HoTen},</p>
      <p>Nhấn vào link dưới để đặt lại mật khẩu:</p>
      <a href="${resetLink}" style="color: blue;">${resetLink}</a>
    `;
    await sendMail(user.Email, "Khôi phục mật khẩu", mailContent);

    return { message: "Đã gửi link đặt lại mật khẩu vào email." };
  }

  async resetPassword(token, newPassword) {
    const resetDoc = await ResetToken.findOne({
      token: token, 
      expiresAt: { $gt: new Date() },
    });

    if (!resetDoc) throw new Error("Link không hợp lệ hoặc đã hết hạn.");

    const user = await khachHangModel.findById(resetDoc.userId);
    if (!user) throw new Error("User không tồn tại.");

    const salt = await bcrypt.genSalt(10);
    user.Password = await bcrypt.hash(newPassword, salt);
    await user.save();

    await ResetToken.deleteOne({ _id: resetDoc._id });
    return { message: "Đặt lại mật khẩu thành công." };
  }

  async refreshAccessToken(refreshToken) {
    if (!refreshToken) throw new Error("Thiếu token.");
    const decoded = jwt.verify(refreshToken, JWT_REFRESH_SECRET);
    const user = await khachHangModel.findById(decoded.id);
    if (!user || user.RefreshToken !== refreshToken) throw new Error("Token không hợp lệ.");

    const accessToken = jwt.sign(
      { id: user._id, Email: user.Email },
      JWT_SECRET,
      { expiresIn: "24h" }
    );
    return { token: accessToken };
  }
}

export default new AuthService();