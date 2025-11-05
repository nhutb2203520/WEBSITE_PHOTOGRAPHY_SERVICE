import KhachHang from "../models/khachhang.model.js";

// ✅ Upload ảnh đại diện
export const uploadAvatar = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: "Không có file được tải lên!" });

    const fileUrl = `${req.protocol}://${req.get("host")}/uploads/${req.file.filename}`;
    const userId = req.user.id || req.user._id || req.user.userId; // đảm bảo lấy đúng ID từ token

    const updated = await KhachHang.findByIdAndUpdate(
      userId,
      { Avatar: fileUrl },
      { new: true }
    );

    if (!updated) return res.status(404).json({ message: "Không tìm thấy người dùng!" });

    console.log("✅ Upload avatar thành công:", fileUrl);
    res.json({ message: "Cập nhật ảnh đại diện thành công!", fileUrl });
  } catch (error) {
    console.error("❌ Lỗi upload avatar:", error);
    res.status(500).json({ message: "Lỗi server khi tải ảnh đại diện." });
  }
};

// ✅ Upload ảnh bìa
export const uploadCover = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: "Không có file được tải lên!" });

    const fileUrl = `${req.protocol}://${req.get("host")}/uploads/${req.file.filename}`;
    const userId = req.user.id || req.user._id || req.user.userId;

    const updated = await KhachHang.findByIdAndUpdate(
      userId,
      { CoverImage: fileUrl },
      { new: true }
    );

    if (!updated) return res.status(404).json({ message: "Không tìm thấy người dùng!" });

    console.log("✅ Upload cover thành công:", fileUrl);
    res.json({ message: "Cập nhật ảnh bìa thành công!", fileUrl });
  } catch (error) {
    console.error("❌ Lỗi upload cover:", error);
    res.status(500).json({ message: "Lỗi server khi tải ảnh bìa." });
  }
};
