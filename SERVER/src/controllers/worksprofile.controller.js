import WorksProfile from "../models/worksprofile.model.js";
import fs from "fs";
import axios from 'axios'; 

// ==========================================
// 🤖 AI HELPER: Gửi ảnh sang Python để học Vector (Content + Color)
// ==========================================
const analyzeImageAndUpdate = async (workId, imageUrl) => {
  try {
    const SERVER_URL = process.env.SERVER_URL || 'http://localhost:5000';
    // Đảm bảo URL ảnh là tuyệt đối
    const fullImageUrl = imageUrl.startsWith('http') ? imageUrl : `${SERVER_URL}${imageUrl}`;

    console.log(`🤖 [AI Work] Đang phân tích vector cho Work ID: ${workId}`);
    
    // Gọi sang Python Service (Port 8000)
    const response = await axios.post('http://localhost:8000/analyze', {
        image_url: fullImageUrl
    });

    if (response.data && response.data.success) {
        // Cập nhật Vector vào MongoDB
        await WorksProfile.findByIdAndUpdate(workId, {
            ai_features: {
                vector: response.data.vector,
                color_vector: response.data.color_vector, // ✅ Lưu vector màu
                dominant_color: response.data.dominant_color,
                palette: response.data.palette,           // ✅ Lưu bảng màu
                is_analyzed: true
            }
        });
        console.log(`✅ [AI Work] Đã cập nhật xong (Vector + Color)!`);
    }
  } catch (error) {
    console.error("⚠️ [AI Warning] Không thể kết nối AI Service:", error.message);
  }
};

// ==========================================
// 🔍 AI SEARCH: TÌM KIẾM TÁC PHẨM (HYBRID)
// ==========================================
export const searchByImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "Vui lòng upload ảnh để tìm kiếm" });
    }

    // 1. Tạo URL cho ảnh khách vừa upload
    const fileUrl = `${req.protocol}://${req.get('host')}/uploads/works/${req.file.filename}`;
    console.log("📸 [Search Work] Đang tìm kiếm với ảnh:", fileUrl);

    // 2. Phân tích ảnh Query
    const analyzeRes = await axios.post('http://localhost:8000/analyze', { image_url: fileUrl });
    if (!analyzeRes.data.success) return res.status(500).json({ message: "Lỗi AI phân tích" });
    
    const queryVector = analyzeRes.data.vector;
    const queryColorVector = analyzeRes.data.color_vector; // ✅ Lấy màu query

    // 3. Lấy Candidates (Select cả color_vector)
    const candidates = await WorksProfile.find({
      'ai_features.is_analyzed': true
    }).select('_id ai_features.vector ai_features.color_vector');

    if (candidates.length === 0) return res.status(200).json({ success: true, works: [] });

    // Format dữ liệu gửi đi
    const candidateList = candidates.map(w => ({
      id: w._id.toString(),
      vector: w.ai_features.vector,
      color_vector: w.ai_features.color_vector || [] // ✅ Gửi đi
    }));

    // 4. Gọi Python Ranking (Hybrid Search)
    const rankRes = await axios.post('http://localhost:8000/rank', {
      query_vector: queryVector,
      query_color_vector: queryColorVector, // ✅ Gửi đi
      candidates: candidateList
    });

    const rankedResults = rankRes.data.ranked_results;
    const sortedIds = rankedResults.map(r => r.id);

    // 5. Lấy chi tiết & Sort
    const resultWorks = await WorksProfile.find({ _id: { $in: sortedIds } })
      .populate("userId", "HoTen Avatar")
      .lean();

    const finalResults = sortedIds.map(id => {
      const work = resultWorks.find(w => w._id.toString() === id);
      const scoreInfo = rankedResults.find(r => r.id === id);
      return work ? { ...work, similarity_score: scoreInfo.score } : null;
    }).filter(item => item !== null);

    return res.status(200).json({ success: true, total: finalResults.length, works: finalResults });

  } catch (error) {
    console.error("❌ Lỗi Search Work:", error.message);
    return res.status(500).json({ message: "Lỗi server" });
  }
};

// ==========================================
// 📦 CRUD OPERATIONS
// ==========================================

// ✅ Tạo mới hồ sơ tác phẩm
export const createWorksProfile = async (req, res) => {
  try {
    const { title } = req.body;
    const files = req.files;

    if (!title || !files || files.length === 0) {
      return res.status(400).json({ success: false, message: "Thiếu thông tin bắt buộc (title hoặc images)." });
    }

    const userId = req.user?.id || req.user?._id || req.user?.userId || req.userId;

    if (!userId) {
      return res.status(401).json({ success: false, message: "Không xác định được user ID." });
    }

    // Lưu ý: Path này phải tương ứng với cấu hình Multer trong Route (uploads/works)
    // Nếu bạn dùng chung 1 folder uploads thì để /uploads/
    // Nếu tách folder works thì để /uploads/works/
    const imagePaths = files.map((file) => `/uploads/works/${file.filename}`);

    const newWork = await WorksProfile.create({
      userId,
      title,
      images: imagePaths,
    });

    // 🤖 TRIGGER AI: Lấy ảnh đầu tiên để phân tích
    if (imagePaths.length > 0) {
        analyzeImageAndUpdate(newWork._id, imagePaths[0]);
    }

    res.status(201).json({
      success: true,
      message: "Tạo hồ sơ tác phẩm thành công!",
      work: newWork,
    });
  } catch (err) {
    console.error("❌ Lỗi tạo hồ sơ:", err);
    res.status(500).json({ success: false, message: "Lỗi server.", error: err.message });
  }
};

// ✅ Lấy tất cả hồ sơ (Public)
export const getAllWorks = async (req, res) => {
  try {
    const works = await WorksProfile.find()
      .populate("userId", "HoTen Email")
      .sort({ createdAt: -1 });
    res.status(200).json({ success: true, works });
  } catch (error) {
    res.status(500).json({ success: false, message: "Lỗi server." });
  }
};

// ✅ Lấy tất cả hồ sơ của user (My Works)
export const getMyWorksProfiles = async (req, res) => {
  try {
    const userId = req.user?.id || req.user?._id || req.user?.userId || req.userId;
    const works = await WorksProfile.find({ userId }).sort({ createdAt: -1 });

    res.status(200).json({ success: true, works });
  } catch (err) {
    res.status(500).json({ success: false, message: "Lỗi server." });
  }
};

// ✅ Lấy danh sách theo User ID (Public)
export const getWorksByUserId = async (req, res) => {
  try {
    const { userId } = req.params;
    const works = await WorksProfile.find({ userId }).sort({ createdAt: -1 });
    res.status(200).json({ success: true, works });
  } catch (err) {
    res.status(500).json({ success: false, message: "Lỗi server." });
  }
};

// ✅ Lấy chi tiết hồ sơ theo ID
export const getWorkById = async (req, res) => {
  try {
    const { id } = req.params;
    const work = await WorksProfile.findById(id).populate("userId", "HoTen Email Avatar");

    if (!work) return res.status(404).json({ success: false, message: "Không tìm thấy hồ sơ." });

    res.status(200).json({ success: true, work });
  } catch (err) {
    res.status(500).json({ success: false, message: "Lỗi server." });
  }
};

// ✅ Cập nhật hồ sơ (MỚI THÊM VÀO ĐỂ TRIGGER AI)
export const updateWork = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id || req.user?._id;
    const updates = req.body; // Chỉ update title, logic ảnh xử lý riêng nếu cần

    const work = await WorksProfile.findById(id);
    if (!work) return res.status(404).json({ success: false, message: "Not found" });
    if (work.userId.toString() !== userId.toString()) return res.status(403).json({ success: false, message: "Forbidden" });

    const updatedWork = await WorksProfile.findByIdAndUpdate(id, updates, { new: true });

    // Nếu update có thay đổi ảnh (ví dụ: gửi list ảnh mới), chạy lại AI
    // (Logic này tùy thuộc vào frontend gửi gì, ở đây giả sử nếu có field images mới)
    if (updates.images && updates.images.length > 0) {
       analyzeImageAndUpdate(updatedWork._id, updates.images[0]);
    }

    res.status(200).json({ success: true, work: updatedWork });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error updating" });
  }
};

// ✅ Xóa hồ sơ tác phẩm
export const deleteWorkProfile = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id || req.user?._id || req.user?.userId || req.userId;

    const work = await WorksProfile.findOneAndDelete({ _id: id, userId });

    if (!work) {
      return res.status(404).json({ success: false, message: "Không tìm thấy hoặc không có quyền xóa." });
    }

    // Xóa file vật lý
    for (const imgPath of work.images) {
      // imgPath dạng /uploads/works/abc.jpg -> cần xóa file ./uploads/works/abc.jpg
      // Cần xử lý đường dẫn tương đối cho đúng với thư mục gốc server
      const localPath = `.${imgPath}`; 
      if (fs.existsSync(localPath)) {
          try { fs.unlinkSync(localPath); } catch (e) { console.warn("Không thể xóa file ảnh:", localPath); }
      }
    }

    res.status(200).json({ success: true, message: "Đã xóa hồ sơ thành công!" });
  } catch (err) {
    console.error("❌ Lỗi xóa hồ sơ:", err);
    res.status(500).json({ success: false, message: "Lỗi server." });
  }
};