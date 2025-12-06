import WorksProfile from "../models/worksprofile.model.js";
import axios from 'axios'; 

/**
 * 🤖 HÀM NỘI BỘ: Gọi Python Service để phân tích ảnh (Chạy ngầm)
 * Hàm này xử lý bất đồng bộ, không bắt User phải chờ.
 */
const analyzeImageAndUpdate = async (workId, imageUrl) => {
  try {
    // Xử lý đường dẫn ảnh: Nếu ảnh lưu local (/uploads/...) thì cần thêm domain vào
    // Hãy thay 'http://localhost:5000' bằng domain thực tế của backend Node.js bạn đang chạy
    const SERVER_URL = process.env.SERVER_URL || 'http://localhost:5000';
    
    const fullImageUrl = imageUrl.startsWith('http') 
        ? imageUrl 
        : `${SERVER_URL}${imageUrl}`; // Ví dụ: http://localhost:5000/uploads/img1.jpg

    console.log(`🤖 Đang gửi yêu cầu phân tích AI cho ảnh: ${fullImageUrl}`);

    // Gọi sang Python Service (Giả sử đang chạy ở port 8000)
    const response = await axios.post('http://localhost:8000/analyze', {
        image_url: fullImageUrl
    });

    // Nếu Python trả về thành công, cập nhật vào Database
    if (response.data && response.data.success) {
        await WorksProfile.findByIdAndUpdate(workId, {
            ai_features: {
                vector: response.data.vector,
                dominant_color: response.data.dominant_color,
                is_analyzed: true
            }
        });
        console.log(`✅ AI đã phân tích xong cho Work ID: ${workId}`);
    }
  } catch (error) {
    // Chỉ log lỗi server console, không làm crash ứng dụng
    console.error("⚠️ Không thể kết nối tới AI Service:", error.message);
  }
};

/**
 * ✅ Lấy tất cả hồ sơ tác phẩm
 */
export const getAllWorks = async () => {
  try {
    const works = await WorksProfile.find()
      .populate("userId", "HoTen Email")
      .sort({ createdAt: -1 });
    return works;
  } catch (error) {
    console.error("❌ Lỗi khi lấy tất cả hồ sơ:", error);
    throw new Error("Không thể lấy danh sách hồ sơ.");
  }
};

/**
 * ✅ Lấy hồ sơ tác phẩm theo ID
 */
export const getWorkById = async (id) => {
  try {
    const work = await WorksProfile.findById(id).populate("userId", "HoTen Email");
    if (!work) throw new Error("Không tìm thấy hồ sơ tác phẩm.");
    return work;
  } catch (error) {
    console.error("❌ Lỗi khi lấy hồ sơ theo ID:", error);
    throw new Error("Không thể lấy hồ sơ tác phẩm.");
  }
};

/**
 * ✅ Tạo mới hồ sơ tác phẩm (CÓ GỌI AI)
 */
export const createWork = async (data) => {
  try {
    // 1. Lưu vào DB trước để User không phải chờ
    const work = new WorksProfile(data);
    await work.save();

    // 2. Gọi AI chạy ngầm (Fire and Forget)
    // Chỉ lấy ảnh đầu tiên làm đại diện để phân tích
    if (data.images && data.images.length > 0) {
        analyzeImageAndUpdate(work._id, data.images[0]);
    }

    return work;
  } catch (error) {
    console.error("❌ Lỗi khi tạo hồ sơ:", error);
    throw new Error("Không thể tạo hồ sơ tác phẩm mới.");
  }
};

/**
 * ✅ Cập nhật hồ sơ tác phẩm (CÓ GỌI AI)
 */
export const updateWork = async (id, data) => {
  try {
    const updated = await WorksProfile.findByIdAndUpdate(id, data, { new: true });
    if (!updated) throw new Error("Không tìm thấy hồ sơ để cập nhật.");

    // Nếu người dùng có cập nhật danh sách ảnh mới, chạy lại AI
    if (data.images && data.images.length > 0) {
        analyzeImageAndUpdate(updated._id, data.images[0]);
    }

    return updated;
  } catch (error) {
    console.error("❌ Lỗi khi cập nhật hồ sơ:", error);
    throw new Error("Không thể cập nhật hồ sơ tác phẩm.");
  }
};

/**
 * ✅ Xóa hồ sơ tác phẩm
 */
export const deleteWork = async (id, userId = null) => {
  try {
    const filter = userId ? { _id: id, userId } : { _id: id };
    const deleted = await WorksProfile.findOneAndDelete(filter);
    if (!deleted) throw new Error("Không tìm thấy hồ sơ để xóa.");
    return deleted;
  } catch (error) {
    console.error("❌ Lỗi khi xóa hồ sơ:", error);
    throw new Error("Không thể xóa hồ sơ tác phẩm.");
  }
};