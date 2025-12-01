import crypto from "crypto";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";

import khachHangModel from "../models/khachhang.model.js";
import trangThaiKhachHangModel from "../models/trangthaikhachhang.model.js";
import ResetToken from "../models/resettoken.model.js";

// ✅ [QUAN TRỌNG] Thêm dòng này để dùng được hàm gửi mail
import sendMail from "../utils/sendMail.js"; 

dotenv.config();

const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:5173"; 

const JWT_SECRET = process.env.JWT_SECRET || "Luan Van Tot Nghiep-B2203520";
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || "RefreshSecretKey";

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

    const existingEmail = await khachHangModel.findOne({ Email: email.trim().toLowerCase() });
    if (existingEmail) throw new Error("Email đã được đăng ký.");

    const existingPhone = await khachHangModel.findOne({ SoDienThoai: phone.trim() });
    if (existingPhone) throw new Error("Số điện thoại đã được đăng ký.");

    const existingUsername = await khachHangModel.findOne({ TenDangNhap: username.trim() });
    if (existingUsername) throw new Error("Tên đăng nhập đã tồn tại.");

    const phoneRegex = /^0\d{9}$/;
    if (!phoneRegex.test(phone)) {
      throw new Error("Số điện thoại không hợp lệ (phải gồm 10 số và bắt đầu bằng 0).");
    }

    let customerStatus = await trangThaiKhachHangModel.findOne({ TenTT: "active" });
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
        phone: newUser.SoDienThoai,
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

    console.log("✅ Token created with secret:", JWT_SECRET.substring(0, 10) + "...");
    
    return {
      message: "Đăng nhập thành công.",
      token,
      refreshToken,
      user: {
        id: user._id,
        username: user.TenDangNhap,
        email: user.Email,
        avatar: user.Avatar,
      },
    };
  }

  // --- Quên mật khẩu ---
  async requestResetPassword(identifier) {
    // Tìm user
    const user = await khachHangModel.findOne({
      $or: [{ Email: identifier.trim() }, { SoDienThoai: identifier.trim() }],
    });
    if (!user) throw new Error("Không tìm thấy người dùng.");

    // Tạo token ngẫu nhiên
    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 phút hết hạn

    // Lưu vào DB
    await ResetToken.create({
      userId: user._id,  
      token: token,      
      expiresAt,
    });

    const resetLink = `${CLIENT_URL}/reset-password/${token}`;
    
    // Log để debug
    console.log("====================================================");
    console.log("🔗 RESET PASSWORD LINK (Click để test):");
    console.log(resetLink);
    console.log("====================================================");
    
    // Gửi mail (Đã có import ở trên nên sẽ không lỗi nữa)
    const mailContent = `
      <h3>Yêu cầu đặt lại mật khẩu</h3>
      <p>Xin chào ${user.HoTen},</p>
      <p>Bạn vừa yêu cầu đặt lại mật khẩu. Vui lòng nhấn vào liên kết bên dưới để tiếp tục:</p>
      <a href="${resetLink}" style="padding: 10px 20px; background-color: #007bff; color: white; text-decoration: none; border-radius: 5px;">Đặt lại mật khẩu</a>
      <p>Liên kết này sẽ hết hạn sau 15 phút.</p>
    `;

    await sendMail(user.Email, "Khôi phục mật khẩu", mailContent);

    return { message: "Liên kết đặt lại mật khẩu đã được gửi đến email của bạn." };
  }

  // --- Đặt lại mật khẩu ---
  async resetPassword(token, newPassword) {
    const resetDoc = await ResetToken.findOne({
      token: token, 
      expiresAt: { $gt: new Date() },
    });

    if (!resetDoc) throw new Error("Token không hợp lệ hoặc đã hết hạn.");

    const user = await khachHangModel.findById(resetDoc.userId);
    if (!user) throw new Error("Không tìm thấy người dùng tương ứng với token này.");

    // Hash mật khẩu mới
    const salt = await bcrypt.genSalt(10);
    user.Password = await bcrypt.hash(newPassword, salt);
    await user.save();

    // Xóa token đã dùng
    await ResetToken.deleteOne({ _id: resetDoc._id });
    
    return { message: "Đặt lại mật khẩu thành công. Vui lòng đăng nhập lại." };
  }

  // --- Làm mới token ---
  async refreshAccessToken(refreshToken) {
    if (!refreshToken) throw new Error("Thiếu refresh token.");

    const decoded = jwt.verify(refreshToken, JWT_REFRESH_SECRET);

    const user = await khachHangModel.findById(decoded.id);
    if (!user || user.RefreshToken !== refreshToken)
      throw new Error("Refresh token không hợp lệ.");

    const accessToken = jwt.sign(
      { id: user._id, Email: user.Email },
      JWT_SECRET,
      { expiresIn: "24h" }
    );

    return { token: accessToken };
  }
}

export default new AuthService();