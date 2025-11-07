import WorksProfile from "../models/worksprofile.model.js";
import fs from "fs";

// ✅ Tạo mới hồ sơ tác phẩm
export const createWorksProfile = async (req, res) => {
  try {
    console.log("📝 Creating work profile...");
    console.log("👤 req.user:", req.user);
    console.log("👤 req.userId:", req.userId);
    console.log("📦 req.body:", req.body);
    console.log("📷 req.files:", req.files?.length);

    const { title } = req.body;
    const files = req.files;

    if (!title || !files || files.length === 0) {
      return res.status(400).json({ 
        success: false,
        message: "Thiếu thông tin bắt buộc (title hoặc images)." 
      });
    }

    // ✅ Lấy userId từ nhiều nguồn
    const userId = req.userId || req.user?.id || req.user?._id || req.user?.userId;
    
    console.log("✅ Final userId to use:", userId);

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Không xác định được user ID. Vui lòng đăng nhập lại."
      });
    }

    const imagePaths = files.map((file) => `/uploads/${file.filename}`);

    const newWork = await WorksProfile.create({
      userId: userId,
      title,
      images: imagePaths,
    });

    console.log("✅ Work profile created successfully:", newWork._id);

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
      error: err.message 
    });
  }
};

// ✅ Lấy tất cả hồ sơ của người dùng hiện tại
export const getMyWorksProfiles = async (req, res) => {
  try {
    const userId = req.userId || req.user?.id || req.user?._id || req.user?.userId;
    
    console.log("📋 Getting works for userId:", userId);

    const works = await WorksProfile.find({ userId }).sort({
      createdAt: -1,
    });
    
    console.log("✅ Found works:", works.length);
    
    res.status(200).json({ success: true, works });
  } catch (err) {
    console.error("❌ Lỗi lấy danh sách hồ sơ:", err);
    res.status(500).json({ 
      success: false,
      message: "Lỗi server khi lấy danh sách hồ sơ." 
    });
  }
};

// ✅ Xóa hồ sơ tác phẩm
export const deleteWorkProfile = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId || req.user?.id || req.user?._id || req.user?.userId;

    console.log("🗑️ Deleting work:", id, "for user:", userId);

    const work = await WorksProfile.findOneAndDelete({
      _id: id,
      userId: userId,
    });

    if (!work) {
      return res.status(404).json({ 
        success: false,
        message: "Không tìm thấy hồ sơ hoặc bạn không có quyền xóa." 
      });
    }

    // Xóa ảnh trong thư mục uploads
    work.images.forEach((imgPath) => {
      const localPath = `.${imgPath}`;
      if (fs.existsSync(localPath)) {
        fs.unlinkSync(localPath);
        console.log("🗑️ Deleted image:", localPath);
      }
    });

    res.status(200).json({ 
      success: true, 
      message: "Đã xóa hồ sơ thành công!" 
    });
  } catch (err) {
    console.error("❌ Lỗi xóa hồ sơ:", err);
    res.status(500).json({ 
      success: false,
      message: "Lỗi server khi xóa hồ sơ." 
    });
  }
};