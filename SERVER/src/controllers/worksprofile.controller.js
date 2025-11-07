import WorksProfile from "../models/worksprofile.model.js";
import fs from "fs";

// ✅ Tạo mới hồ sơ tác phẩm
export const createWorksProfile = async (req, res) => {
  try {
    const { title } = req.body;
    const files = req.files;

    if (!title || !files || files.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Thiếu thông tin bắt buộc (title hoặc images).",
      });
    }

    const userId =
      req.user?.id || req.user?._id || req.user?.userId || req.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Không xác định được user ID. Vui lòng đăng nhập lại.",
      });
    }

    const imagePaths = files.map((file) => `/uploads/${file.filename}`);

    const newWork = await WorksProfile.create({
      userId,
      title,
      images: imagePaths,
    });

    res.status(201).json({
      success: true,
      message: "Tạo hồ sơ tác phẩm thành công!",
      work: newWork,
    });
  } catch (err) {
    console.error("❌ Lỗi tạo hồ sơ:", err);
    res.status(500).json({
      success: false,
      message: "Lỗi server khi tạo hồ sơ.",
      error: err.message,
    });
  }
};

// ✅ Lấy tất cả hồ sơ của user
export const getMyWorksProfiles = async (req, res) => {
  try {
    const userId =
      req.user?.id || req.user?._id || req.user?.userId || req.userId;

    const works = await WorksProfile.find({ userId }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      works,
    });
  } catch (err) {
    console.error("❌ Lỗi lấy danh sách:", err);
    res.status(500).json({
      success: false,
      message: "Lỗi server khi lấy danh sách hồ sơ.",
    });
  }
};

// ✅ Xóa hồ sơ tác phẩm
export const deleteWorkProfile = async (req, res) => {
  try {
    const { id } = req.params;
    const userId =
      req.user?.id || req.user?._id || req.user?.userId || req.userId;

    const work = await WorksProfile.findOneAndDelete({ _id: id, userId });

    if (!work) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy hồ sơ hoặc bạn không có quyền xóa.",
      });
    }

    // Xóa ảnh trong thư mục uploads
    for (const imgPath of work.images) {
      const localPath = `.${imgPath}`;
      if (fs.existsSync(localPath)) fs.unlinkSync(localPath);
    }

    res.status(200).json({ success: true, message: "Đã xóa hồ sơ thành công!" });
  } catch (err) {
    console.error("❌ Lỗi xóa hồ sơ:", err);
    res.status(500).json({
      success: false,
      message: "Lỗi server khi xóa hồ sơ.",
    });
  }
};
