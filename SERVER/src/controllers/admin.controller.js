import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import adminService from "../services/admin.service.js";

const SECRET_KEY = process.env.JWT_SECRET || "MY_SECRET_KEY_DEFAULT";

export const loginAdmin = async (req, res) => {
  try {
    const { username, password } = req.body;

    const admin = await adminService.getAdminByUsername(username);
    if (!admin)
      return res.status(404).json({ message: "Admin không tồn tại" });

    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch)
      return res.status(400).json({ message: "Sai mật khẩu" });

    const token = jwt.sign(
      { id: admin._id, role: admin.role },
      SECRET_KEY,
      { expiresIn: "2d" }
    );

    return res.status(200).json({
      message: "Đăng nhập thành công",
      token,
      admin: {
        id: admin._id,
        username: admin.username,
        role: admin.role
      }
    });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};
