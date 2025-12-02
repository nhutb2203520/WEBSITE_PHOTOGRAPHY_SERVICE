import KhachHang from "../models/khachhang.model.js";
import Order from "../models/order.model.js";
import Review from "../models/review.model.js";

const homeController = {
  // 📊 Lấy số liệu thống kê tổng quan (Dashboard Stats)
  getSystemStats: async (req, res) => {
    try {
      // 1. Đếm số lượng Khách hàng (isPhotographer: false)
      const totalClients = await KhachHang.countDocuments({ 
        isPhotographer: false 
      });

      // 2. Đếm số lượng Photographer (isPhotographer: true)
      const totalPhotographers = await KhachHang.countDocuments({ 
        isPhotographer: true 
      });

      // 3. ✅ Đếm số dự án hoàn thành (Chỉ lấy đơn có status: 'completed')
      const totalOrders = await Order.countDocuments({ 
        status: 'completed' 
      });

      // 4. Tính điểm đánh giá trung bình hệ thống (Từ bảng Reviews đã duyệt)
      const ratingStats = await Review.aggregate([
        { 
          $match: { Status: 'approved' } // Chỉ lấy review đã duyệt
        },
        { 
          $group: { 
            _id: null, 
            avgRating: { $avg: "$Rating" } // Tính trung bình cộng
          } 
        }
      ]);

      // Mặc định 5.0 nếu chưa có đánh giá nào
      const averageRating = ratingStats.length > 0 ? ratingStats[0].avgRating : 5.0;

      return res.status(200).json({
        success: true,
        data: {
          totalClients,         // Số khách hàng
          totalPhotographers,   // Số photographer
          totalOrders,          // Số dự án hoàn thành
          averageRating: parseFloat(averageRating.toFixed(1)) // VD: 4.8
        }
      });

    } catch (error) {
      console.error("❌ Lỗi lấy thống kê trang chủ:", error);
      return res.status(500).json({ 
        success: false, 
        message: "Lỗi server khi lấy thống kê" 
      });
    }
  }
};

export default homeController;