import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import mongoose from "mongoose"; // ← Thêm dòng này

import khachHangModel from "../models/khachhang.model.js";
import trangThaiKhachHangModel from "../models/trangthaikhachhang.model.js";

dotenv.config();

class KhachHangService {
  async generateAndSaveTokens(user) {
    const { Password, ...customerInfo } = user._doc;
    const token = jwt.sign(
      customerInfo,
      process.env.JWT_SECRET || "Luan Van Tot Nghiep-B2203520",
      { expiresIn: "30s" }
    );
    const refreshToken = jwt.sign(
      { id: user._id },
      process.env.JWT_REFRESH_SECRET || "RefreshSecretKey",
      { expiresIn: "7d" }
    );
    await khachHangModel.findByIdAndUpdate(user._id, {
      RefreshToken: refreshToken,
    });
    return { token, refreshToken, customerInfo };
  }

  async getMyAccount(id) {
    try {
      
      // ✅ Chuyển đổi string thành ObjectId nếu cần
      const objectId = typeof id === 'string' ? new mongoose.Types.ObjectId(id) : id;
      
      const customer = await khachHangModel
        .findById(objectId)
        .select("-Password")
        .populate("MaTT");

      if (!customer) {
        return { message: "Tài khoản độc giả không tồn tại." };
      }

      return { customer, message: "Lấy thông tin tài khoản thành công." };
    } catch (error) {
      console.error("❌ Lỗi trong getMyAccount:", error);
      throw error;
    }
  }

  async register(data) {
    const kiemTraKH = await khachHangModel.findOne({
      $or: [
        { SoDienThoai: data.SoDienThoai.trim() },
        { Email: data.Email.trim().toLowerCase() },
      ],
    });

    if (kiemTraKH) {
      return { message: "Số điện thoại hoặc email đã đăng ký tài khoản." };
    }

    if (!data.HoTen) {
      return { message: "Họ tên không được để trống." };
    }

    const customerStatus = await trangThaiKhachHangModel.findOne({
      TenTT: "active",
    });

    data.MaTT = customerStatus?._id;
    const hashedPassword = await bcrypt.hash(data.Password, 10);
    data.Password = hashedPassword;
    data.Email = data.Email.trim().toLowerCase();

    const newKH = new khachHangModel(data);
    await newKH.save();
    await newKH.populate("MaTT");

    const { Password, ...khachHangInfo } = newKH._doc;

    return {
      khachhang: khachHangInfo,
      message: "Đăng ký tài khoản thành công.",
    };
  }

  async login(data) {
  if (!data.identifier) {
    return { message: "Vui lòng nhập username, số điện thoại hoặc email để đăng nhập." };
  }

  const customer = await khachHangModel
    .findOne({
      $or: [
        { TenDangNhap: data.identifier.trim() },
        { Email: data.identifier.trim().toLowerCase() },
        { SoDienThoai: data.identifier.trim() },
      ],
    })
    .populate("MaTT", "TenTT");

  if (customer && customer.MaTT?.TenTT !== "active") {
    return {
      message: "Tài khoản của bạn bị khóa, vui lòng liên hệ quản trị viên để giải quyết.",
    };
  }

  if (!customer) {
    return { message: "Username/Email/Số điện thoại chưa đăng ký tài khoản." };
  }

  const isMatch = await bcrypt.compare(data.Password, customer.Password);
  if (!isMatch) {
    return { message: "Mật khẩu không đúng." };
  }

  const { token, refreshToken, customerInfo } = await this.generateAndSaveTokens(customer);

  return {
    token,
    refreshToken,
    customer: customerInfo,
    message: "Đăng nhập thành công.",
  };
}


  async updateAccount(id, data) {
    const kiemTraCustomer = await khachHangModel.findOne({
      _id: { $ne: id },
      $or: [
        { SoDienThoai: data.SoDienThoai.trim() },
        { Email: data.Email.trim().toLowerCase() },
      ],
    });

    if (kiemTraCustomer) {
      return { message: "Số điện thoại hoặc Email đã tồn tại." };
    }

    const updatedCustomer = await khachHangModel
      .findByIdAndUpdate(id, data, { new: true })
      .select("-Password");

    if (!updatedCustomer) {
      return { message: "Độc giả không tồn tại." };
    }

    return { customer: updatedCustomer, message: "Cập nhật tài khoản thành công." };
  }

  async changePassword(id, currentPassword, newPassword) {
    const customer = await khachHangModel.findById(id);
    if (!customer) {
      return { message: "Người dùng không tồn tại." };
    }

    const isMatch = await bcrypt.compare(currentPassword, customer.Password);
    if (!isMatch) {
      return { message: "Mật khẩu cũ không đúng." };
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    customer.Password = hashedPassword;
    await customer.save();

    return { message: "Đổi mật khẩu thành công." };
  }
}

export default new KhachHangService();