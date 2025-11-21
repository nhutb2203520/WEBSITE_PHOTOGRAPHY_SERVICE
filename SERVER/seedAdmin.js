import mongoose from "mongoose";
import Admin from "./src/models/admin.model.js";
import bcrypt from "bcryptjs";

const MONGO_URI = "mongodb://127.0.0.1:27017/website_photocomerce";

async function seedAdmin() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("✅ MongoDB connected");

    // Thông tin admin mặc định
    const adminData = {
      username: "minhnhut",              // tên đăng nhập
      email: "admin@gmail.com",
      phone: "0776560730",
      plainPassword: "123456",
    };

    // Kiểm tra admin đã tồn tại
    const exists = await Admin.findOne({
      $or: [
        { username: adminData.username },
        { email: adminData.email },
      ],
    });

    if (exists) {
      console.log("❌ Admin already exists!");
      return;
    }

    // Hash mật khẩu
    const hashedPassword = await bcrypt.hash(adminData.plainPassword, 10);

    // Tạo admin mới
    const admin = await Admin.create({
      username: adminData.username,
      email: adminData.email,
      phone: adminData.phone,
      password: hashedPassword,
      role: "admin",
    });

    console.log("🎉 Admin created successfully!");
    console.log(admin);
  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    mongoose.disconnect();
  }
}

seedAdmin();
