import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import mongoose from "mongoose";

import khachHangModel from "../models/khachhang.model.js";
import trangThaiKhachHangModel from "../models/trangthaikhachhang.model.js";

dotenv.config();

class KhachHangService {
  // 🔹 Tạo token và lưu refresh token
  async generateAndSaveTokens(user) {
    try {
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

      console.log("✅ Tokens generated for user:", user._id);
      return { token, refreshToken, customerInfo };
    } catch (error) {
      console.error("❌ Error in generateAndSaveTokens:", error);
      throw error;
    }
  }

  // 🔹 Lấy thông tin tài khoản hiện tại
  async getMyAccount(id) {
    try {
      const objectId = typeof id === "string" ? new mongoose.Types.ObjectId(id) : id;

      const customer = await khachHangModel
        .findById(objectId)
        .select("-Password")
        .populate("MaTT");

      console.log("✅ getMyAccount result:", customer);

      if (!customer) {
        return { message: "Tài khoản độc giả không tồn tại." };
      }

      return { customer, message: "Lấy thông tin tài khoản thành công." };
    } catch (error) {
      console.error("❌ Lỗi trong getMyAccount:", error);
      throw error;
    }
  }

  // 🔹 Đăng ký
  async register(data) {
    try {
      console.log("📝 Register data:", data);

      const existing = await khachHangModel.findOne({
        $or: [
          { SoDienThoai: data.SoDienThoai?.trim() },
          { Email: data.Email?.trim().toLowerCase() },
        ],
      });

      if (existing) {
        return { message: "Số điện thoại hoặc email đã đăng ký tài khoản." };
      }

      if (!data.HoTen) {
        return { message: "Họ tên không được để trống." };
      }

      const status = await trangThaiKhachHangModel.findOne({ TenTT: "active" });
      data.MaTT = status?._id;

      data.Password = await bcrypt.hash(data.Password, 10);
      data.Email = data.Email.trim().toLowerCase();

      const newKH = new khachHangModel(data);
      await newKH.save();
      await newKH.populate("MaTT");

      const { Password, ...khachHangInfo } = newKH._doc;

      console.log("✅ New user registered:", khachHangInfo);

      return { khachhang: khachHangInfo, message: "Đăng ký tài khoản thành công." };
    } catch (error) {
      console.error("❌ Error in register:", error);
      throw error;
    }
  }

  // 🔹 Đăng nhập
  async login(data) {
    try {
      console.log("📝 Login data:", data);

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

      if (!customer) {
        return { message: "Username/Email/Số điện thoại chưa đăng ký tài khoản." };
      }

      if (customer.MaTT?.TenTT !== "active") {
        return { message: "Tài khoản bị khóa, liên hệ quản trị viên." };
      }

      const isMatch = await bcrypt.compare(data.Password, customer.Password);
      if (!isMatch) return { message: "Mật khẩu không đúng." };

      const { token, refreshToken, customerInfo } = await this.generateAndSaveTokens(customer);

      console.log("✅ User logged in:", customer._id);

      return { token, refreshToken, customer: customerInfo, message: "Đăng nhập thành công." };
    } catch (error) {
      console.error("❌ Error in login:", error);
      throw error;
    }
  }

  // 🔹 Cập nhật hồ sơ người dùng
  async updateAccount(id, data) {
    try {
      console.log('🔍 updateAccount received data:', data);

      if (!data || typeof data !== 'object') {
        throw new Error('No update data provided');
      }

      const objectId = typeof id === 'string' ? new mongoose.Types.ObjectId(id) : id;
      
      // ✅ CẬP NHẬT: Thêm các trường ngân hàng vào danh sách cho phép
      const allowedFields = [
        "HoTen", "Email", "SoDienThoai", "DiaChi", "NgaySinh", "GioiTinh", 
        "Avatar", "CoverImage",
        "SoTaiKhoan", "TenNganHang", "TenChuTaiKhoan", "ChiNhanhNganHang" // <--- Mới thêm
      ];

      const updateData = {};

      allowedFields.forEach(field => {
        // Chỉ bỏ qua nếu là undefined, chấp nhận cả giá trị rỗng
        if (data.hasOwnProperty(field) && data[field] !== undefined) {
          if (field === "NgaySinh") {
            const date = new Date(data[field]);
            if (!isNaN(date.getTime())) {
              updateData[field] = date;
            }
          } else if (field === "Email" && data[field]) {
            updateData[field] = data[field].trim().toLowerCase();
          } else {
            updateData[field] = data[field];
          }
        }
      });

      console.log('✅ updateData after processing:', updateData);

      if (Object.keys(updateData).length === 0) {
        return { message: "Không có dữ liệu hợp lệ để cập nhật." };
      }

      // Kiểm tra trùng Email/SĐT (chỉ khi có thay đổi)
      const orConditions = [];
      if (updateData.Email) orConditions.push({ Email: updateData.Email });
      if (updateData.SoDienThoai) orConditions.push({ SoDienThoai: updateData.SoDienThoai });

      if (orConditions.length > 0) {
        const duplicate = await khachHangModel.findOne({
          _id: { $ne: objectId },
          $or: orConditions
        });
        if (duplicate) {
          return { message: "Email hoặc Số điện thoại đã tồn tại." };
        }
      }

      const updatedCustomer = await khachHangModel.findByIdAndUpdate(
        objectId,
        updateData,
        { new: true, runValidators: true, context: 'query' }
      ).select("-Password").populate("MaTT");

      console.log('✅ Updated customer:', updatedCustomer);

      return { customer: updatedCustomer, message: "Cập nhật tài khoản thành công." };
    } catch (error) {
      console.error("❌ Error in updateAccount:", error);
      throw error;
    }
  }

  // 🔹 Đổi mật khẩu
  async changePassword(id, currentPassword, newPassword) {
    try {
      const customer = await khachHangModel.findById(id);
      if (!customer) return { message: "Người dùng không tồn tại." };

      const isMatch = await bcrypt.compare(currentPassword, customer.Password);
      if (!isMatch) return { message: "Mật khẩu cũ không đúng." };

      customer.Password = await bcrypt.hash(newPassword, 10);
      await customer.save();

      console.log("✅ Password changed for user:", customer._id);

      return { message: "Đổi mật khẩu thành công." };
    } catch (error) {
      console.error("❌ Error in changePassword:", error);
      throw error;
    }
  }
}

export default new KhachHangService();