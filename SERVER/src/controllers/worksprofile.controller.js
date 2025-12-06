import WorksProfile from "../models/worksprofile.model.js";
import fs from "fs";
import axios from 'axios'; // 📦 Cần cài: npm install axios

// ==========================================
// 🤖 AI HELPER: Gửi ảnh sang Python để học Vector
// ==========================================
const analyzeWorkImage = async (workId, imageUrl) => {
  try {
    const SERVER_URL = process.env.SERVER_URL || 'http://localhost:5000';
    const fullImageUrl = imageUrl.startsWith('http') ? imageUrl : `${SERVER_URL}${imageUrl}`;

    console.log(`🤖 [AI Work] Đang phân tích vector cho Work ID: ${workId}`);
    
    // Gọi sang Python Service (Port 8000)
    const response = await axios.post('http://localhost:8000/analyze', {
        image_url: fullImageUrl
    });

    if (response.data && response.data.success) {
        await WorksProfile.findByIdAndUpdate(workId, {
            ai_features: {
                vector: response.data.vector,
                dominant_color: response.data.dominant_color,
                is_analyzed: true
            }
        });
        console.log(`✅ [AI Work] Đã cập nhật vector thành công!`);
    }
  } catch (error) {
    console.error("⚠️ [AI Warning] Lỗi kết nối AI Service:", error.message);
  }
};

// ==========================================
// 🔍 AI SEARCH: TÌM KIẾM TÁC PHẨM
// ==========================================
export const searchByImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "Vui lòng upload ảnh để tìm kiếm" });
    }

    const fileUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
    console.log("📸 [Search Work] Đang tìm kiếm với ảnh:", fileUrl);

    // 1. Phân tích ảnh query
    const analyzeRes = await axios.post('http://localhost:8000/analyze', { image_url: fileUrl });
    if (!analyzeRes.data.success) return res.status(500).json({ message: "Lỗi AI phân tích" });
    
    const queryVector = analyzeRes.data.vector;

    // 2. Lấy ứng viên (Chỉ lấy work đã phân tích)
    const candidates = await WorksProfile.find({
      'ai_features.is_analyzed': true
    }).select('_id ai_features.vector');

    if (candidates.length === 0) return res.status(200).json({ success: true, works: [] });

    const candidateList = candidates.map(w => ({
      id: w._id.toString(),
      vector: w.ai_features.vector
    }));

    // 3. Xếp hạng (Ranking)
    const rankRes = await axios.post('http://localhost:8000/rank', {
      query_vector: queryVector,
      candidates: candidateList
    });

    const rankedResults = rankRes.data.ranked_results;
    const sortedIds = rankedResults.map(r => r.id);

    // 4. Lấy chi tiết & Sort
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

// ✅ Tạo mới hồ sơ tác phẩm
export const createWorksProfile = async (req, res) => {
  try {
    const { title } = req.body;
    const files = req.files;

    if (!title || !files || files.length === 0) {
      return res.status(400).json({ success: false, message: "Thiếu thông tin bắt buộc." });
    }

    const userId = req.user?.id || req.user?._id || req.user?.userId || req.userId;
    if (!userId) return res.status(401).json({ success: false, message: "Không xác định được user." });

    const imagePaths = files.map((file) => `/uploads/${file.filename}`);

    const newWork = await WorksProfile.create({
      userId,
      title,
      images: imagePaths,
    });

    // 🤖 TRIGGER AI: Lấy ảnh đầu tiên để phân tích
    if (imagePaths.length > 0) {
        analyzeWorkImage(newWork._id, imagePaths[0]);
    }

    res.status(201).json({ success: true, message: "Tạo hồ sơ thành công!", work: newWork });
  } catch (err) {
    console.error("❌ Lỗi tạo hồ sơ:", err);
    res.status(500).json({ success: false, message: "Lỗi server.", error: err.message });
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

// ✅ Lấy danh sách theo User ID
export const getWorksByUserId = async (req, res) => {
  try {
    const { userId } = req.params;
    const works = await WorksProfile.find({ userId }).sort({ createdAt: -1 });
    res.status(200).json({ success: true, works });
  } catch (err) {
    res.status(500).json({ success: false, message: "Lỗi server.", error: err.message });
  }
};

// ✅ Lấy chi tiết
export const getWorkById = async (req, res) => {
  try {
    const { id } = req.params;
    const work = await WorksProfile.findById(id).populate("userId", "HoTen Email Avatar");
    if (!work) return res.status(404).json({ success: false, message: "Không tìm thấy hồ sơ." });
    res.status(200).json({ success: true, work });
  } catch (err) {
    res.status(500).json({ success: false, message: "Lỗi server.", error: err.message });
  }
};

// ✅ Xóa hồ sơ
export const deleteWorkProfile = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id || req.user?._id || req.user?.userId || req.userId;

    const work = await WorksProfile.findOneAndDelete({ _id: id, userId });
    if (!work) return res.status(404).json({ success: false, message: "Không tìm thấy hoặc không có quyền xóa." });

    // Xóa file vật lý
    for (const imgPath of work.images) {
      const localPath = `.${imgPath}`; 
      if (fs.existsSync(localPath)) {
          try { fs.unlinkSync(localPath); } catch (e) { console.warn("Lỗi xóa file:", localPath); }
      }
    }

    res.status(200).json({ success: true, message: "Đã xóa hồ sơ thành công!" });
  } catch (err) {
    res.status(500).json({ success: false, message: "Lỗi server." });
  }
};