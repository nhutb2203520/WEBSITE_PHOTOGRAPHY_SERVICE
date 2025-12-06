import ServicePackage from '../models/servicePackage.model.js';
import mongoose from 'mongoose';
import axios from 'axios'; // Đừng quên: npm install axios

/**
 * 🤖 HÀM NỘI BỘ: Gọi Python Service để phân tích ảnh gói dịch vụ
 */
const analyzePackageImage = async (packageId, imageUrl) => {
  try {
    const SERVER_URL = process.env.SERVER_URL || 'http://localhost:5000';
    const fullImageUrl = imageUrl.startsWith('http') ? imageUrl : `${SERVER_URL}${imageUrl}`;

    console.log(`🤖 Đang phân tích ảnh cho Gói dịch vụ: ${fullImageUrl}`);

    const response = await axios.post('http://localhost:8000/analyze', {
        image_url: fullImageUrl
    });

    if (response.data && response.data.success) {
        await ServicePackage.findByIdAndUpdate(packageId, {
            ai_features: {
                vector: response.data.vector,
                dominant_color: response.data.dominant_color,
                is_analyzed: true
            }
        });
        console.log(`✅ AI đã cập nhật xong cho Package ID: ${packageId}`);
    }
  } catch (error) {
    console.error("⚠️ Lỗi AI Service (ServicePackage):", error.message);
  }
};

const servicePackageService = {
  
  /**
   * Tạo gói dịch vụ mới (CÓ GỌI AI)
   */
  createPackage: async (packageData, photographerId) => {
    try {
      const newPackage = await ServicePackage.create({
        ...packageData,
        PhotographerId: photographerId,
      });

      // 🔥 GỌI AI: Ưu tiên lấy AnhBia, nếu không có thì lấy ảnh đầu tiên trong mảng Images
      const imageToAnalyze = newPackage.AnhBia || (newPackage.Images && newPackage.Images.length > 0 ? newPackage.Images[0] : null);
      
      if (imageToAnalyze) {
          analyzePackageImage(newPackage._id, imageToAnalyze);
      }

      return {
        success: true,
        package: newPackage,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  },

  /**
   * Lấy tất cả gói dịch vụ với filter
   */
  getAllPackages: async (filters = {}) => {
    try {
      const query = { TrangThai: 'active', isDeleted: false };

      // Apply filters
      if (filters.loaiGoi) query.LoaiGoi = filters.loaiGoi;
      if (filters.photographerId) query.PhotographerId = filters.photographerId;
      if (filters.minPrice || filters.maxPrice) {
        query.Gia = {};
        if (filters.minPrice) query.Gia.$gte = Number(filters.minPrice);
        if (filters.maxPrice) query.Gia.$lte = Number(filters.maxPrice);
      }

      const packages = await ServicePackage.find(query)
        .populate('PhotographerId', 'HoTen Avatar TenDangNhap')
        .sort({ createdAt: -1 })
        .lean();

      return {
        success: true,
        total: packages.length,
        packages,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  },

  /**
   * Lấy gói theo ID
   */
  getPackageById: async (packageId) => {
    try {
      if (!mongoose.Types.ObjectId.isValid(packageId)) {
        return { success: false, error: 'ID không hợp lệ' };
      }

      const package_data = await ServicePackage.findById(packageId)
        .populate('PhotographerId', 'HoTen Avatar TenDangNhap Email SDT DiaChi');

      if (!package_data) {
        return { success: false, error: 'Không tìm thấy gói dịch vụ' };
      }

      return {
        success: true,
        package: package_data,
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  /**
   * Lấy gói của photographer
   */
  getPackagesByPhotographer: async (photographerId) => {
    try {
      const packages = await ServicePackage.find({
        PhotographerId: photographerId,
        TrangThai: 'active',
        isDeleted: false,
      }).sort({ createdAt: -1 });

      return {
        success: true,
        total: packages.length,
        packages,
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  /**
   * Cập nhật gói dịch vụ (CÓ GỌI AI)
   */
  updatePackage: async (packageId, photographerId, updates) => {
    try {
      // Kiểm tra quyền sở hữu
      const package_data = await ServicePackage.findById(packageId);
      
      if (!package_data) {
        return { success: false, error: 'Không tìm thấy gói dịch vụ' };
      }

      if (package_data.PhotographerId.toString() !== photographerId.toString()) {
        return { success: false, error: 'Bạn không có quyền chỉnh sửa gói này' };
      }

      // Cập nhật
      const updatedPackage = await ServicePackage.findByIdAndUpdate(
        packageId,
        updates,
        { new: true, runValidators: true }
      );

      // 🔥 GỌI AI: Nếu cập nhật ảnh bìa hoặc danh sách ảnh, chạy lại phân tích
      const imageToAnalyze = updates.AnhBia || (updates.Images && updates.Images.length > 0 ? updates.Images[0] : null);
      
      if (imageToAnalyze) {
          analyzePackageImage(updatedPackage._id, imageToAnalyze);
      }

      return {
        success: true,
        package: updatedPackage,
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  /**
   * Xóa gói dịch vụ (soft delete)
   */
  deletePackage: async (packageId, photographerId) => {
    try {
      const package_data = await ServicePackage.findById(packageId);
      
      if (!package_data) {
        return { success: false, error: 'Không tìm thấy gói dịch vụ' };
      }

      if (package_data.PhotographerId.toString() !== photographerId.toString()) {
        return { success: false, error: 'Bạn không có quyền xóa gói này' };
      }

      await ServicePackage.findByIdAndUpdate(packageId, {
        isDeleted: true,
        TrangThai: 'deleted',
      });

      return { success: true, message: 'Xóa gói dịch vụ thành công' };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  /**
   * Đánh giá gói dịch vụ
   */
  ratePackage: async (packageId, rating) => {
    try {
      if (rating < 1 || rating > 5) {
        return { success: false, error: 'Đánh giá phải từ 1 đến 5 sao' };
      }

      const package_data = await ServicePackage.findById(packageId);
      
      if (!package_data) {
        return { success: false, error: 'Không tìm thấy gói dịch vụ' };
      }

      const currentTotal = package_data.DanhGia * package_data.SoLuotDanhGia;
      const newTotal = currentTotal + rating;
      const newCount = package_data.SoLuotDanhGia + 1;
      const newAvgRating = newTotal / newCount;

      await ServicePackage.findByIdAndUpdate(packageId, {
        DanhGia: newAvgRating,
        SoLuotDanhGia: newCount,
      });

      return {
        success: true,
        newRating: newAvgRating.toFixed(1),
        totalReviews: newCount,
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  /**
   * Tăng số lượng đã đặt
   */
  incrementBookingCount: async (packageId) => {
    try {
      await ServicePackage.findByIdAndUpdate(packageId, {
        $inc: { SoLuongDaDat: 1 },
      });

      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  /**
   * Tìm kiếm gói dịch vụ (Text Search thông thường)
   */
  searchPackages: async (searchTerm) => {
    try {
      const packages = await ServicePackage.find({
        $or: [
          { TenGoi: { $regex: searchTerm, $options: 'i' } },
          { MoTa: { $regex: searchTerm, $options: 'i' } },
        ],
        TrangThai: 'active',
        isDeleted: false,
      })
        .populate('PhotographerId', 'HoTen Avatar TenDangNhap')
        .lean();

      return {
        success: true,
        total: packages.length,
        packages,
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  /**
   * Lấy gói phổ biến nhất
   */
  getPopularPackages: async (limit = 10) => {
    try {
      const packages = await ServicePackage.find({
        TrangThai: 'active',
        isDeleted: false,
      })
        .sort({ SoLuongDaDat: -1, DanhGia: -1 })
        .limit(limit)
        .populate('PhotographerId', 'HoTen Avatar TenDangNhap')
        .lean();

      return { success: true, packages };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  /**
   * Lấy gói mới nhất
   */
  getLatestPackages: async (limit = 10) => {
    try {
      const packages = await ServicePackage.find({
        TrangThai: 'active',
        isDeleted: false,
      })
        .sort({ createdAt: -1 })
        .limit(limit)
        .populate('PhotographerId', 'HoTen Avatar TenDangNhap')
        .lean();

      return { success: true, packages };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

};

export default servicePackageService;