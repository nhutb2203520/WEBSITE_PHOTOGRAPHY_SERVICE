import mongoose from "mongoose"; // 👈 Cần import cái này để check ID
import Review from "../models/review.model.js";
import Order from "../models/order.model.js";

// ✅ Import thông báo
import { createNotification } from "./notification.controller.js";

// [GET] Lấy danh sách đánh giá
export const getReviews = async (req, res) => {
  try {
    const { photographerId } = req.query;
    
    // Tạo bộ lọc mặc định
    // ⚠️ LƯU Ý: Đảm bảo DB của bạn có trường "Status" là "approved". 
    // Nếu chưa có chức năng duyệt đánh giá, hãy tạm thời bỏ dòng này hoặc comment lại.
    const query = { Status: 'approved' }; 
    // const query = {}; // 👉 Dùng dòng này nếu bạn muốn lấy tất cả bất kể trạng thái

    // 1. Kiểm tra ID hợp lệ trước khi query (FIX LỖI 500)
    if (photographerId) {
      if (!mongoose.Types.ObjectId.isValid(photographerId)) {
        return res.status(400).json({ 
            message: "Photographer ID không hợp lệ", 
            success: false 
        });
      }
      query.PhotographerId = photographerId;
    }

    // 2. Thực hiện query
    const reviews = await Review.find(query)
      .populate("CustomerId", "HoTen Avatar") // Lấy thông tin người đánh giá
      .sort({ createdAt: -1 });

    // 3. Tính toán thống kê (Optional - giúp Frontend hiển thị đẹp hơn)
    let averageRating = 0;
    if (reviews.length > 0) {
      const total = reviews.reduce((acc, curr) => acc + (curr.Rating || 0), 0);
      averageRating = (total / reviews.length).toFixed(1);
    }

    res.status(200).json({
        success: true,
        count: reviews.length,
        averageRating: parseFloat(averageRating),
        data: reviews
    });

  } catch (error) {
    console.error("❌ Lỗi getReviews:", error); // Log lỗi ra terminal để debug
    res.status(500).json({ 
        message: "Lỗi server khi lấy đánh giá", 
        error: error.message 
    });
  }
};

// [POST] Tạo đánh giá mới
export const createReview = async (req, res) => {
  try {
    const { order_id, rating, comment } = req.body;
    
    // 1. Kiểm tra đơn hàng
    const order = await Order.findById(order_id);
    if (!order) return res.status(404).json({ message: "Đơn hàng không tồn tại" });

    // 2. Chuẩn bị dữ liệu
    const reviewData = {
        OrderId: order_id,
        PackageId: order.service_package_id,
        PhotographerId: order.photographer_id,
        CustomerId: req.user._id || req.user.id, 
        Rating: rating,
        Comment: comment,
        Status: 'approved', // Mặc định duyệt ngay (hoặc 'pending' nếu cần admin duyệt)
        Images: []
    };

    // 3. Xử lý ảnh (nếu có)
    if (req.files && req.files.length > 0) {
        reviewData.Images = req.files.map(file => `/uploads/reviews/${file.filename}`);
    }

    // 4. Lưu đánh giá
    const newReview = new Review(reviewData);
    const savedReview = await newReview.save();

    // 🔔 THÔNG BÁO CHO NHIẾP ẢNH GIA
    if (order.photographer_id) {
        await createNotification({
            userId: order.photographer_id,
            title: "⭐ Bạn có đánh giá mới!",
            message: `Khách hàng vừa đánh giá ${rating} sao cho đơn hàng #${order.order_id || 'Mới'}.`,
            type: "SYSTEM",
            link: "/photographer/my-services"
        });
    }

    res.status(201).json(savedReview);
  } catch (error) {
    console.error("❌ Error creating review:", error);
    res.status(400).json({ message: "Lỗi khi tạo đánh giá", error: error.message });
  }
};

// [PUT] Cập nhật đánh giá
export const updateReview = async (req, res) => {
  try {
    const { id } = req.params;
    const { rating, comment } = req.body;

    // Check ID hợp lệ
    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ message: "Review ID không hợp lệ" });
    }

    const review = await Review.findById(id);
    if (!review) return res.status(404).json({ message: "Không tìm thấy đánh giá" });

    const userId = req.user._id || req.user.id;
    
    // Kiểm tra quyền sở hữu
    if (review.CustomerId.toString() !== userId.toString()) {
        return res.status(403).json({ message: "Bạn không có quyền sửa đánh giá này" });
    }

    // Kiểm tra đã sửa lần nào chưa
    if (review.is_edited) {
        return res.status(400).json({ message: "Bạn chỉ được chỉnh sửa đánh giá 1 lần duy nhất." });
    }

    // Cập nhật thông tin
    review.Rating = rating;
    review.Comment = comment;
    review.is_edited = true; 

    // Cập nhật ảnh mới nếu có
    if (req.files && req.files.length > 0) {
        review.Images = req.files.map(file => `/uploads/reviews/${file.filename}`);
    }

    await review.save();
    res.status(200).json(review);

  } catch (error) {
    console.error("❌ Lỗi updateReview:", error);
    res.status(500).json({ message: "Lỗi khi cập nhật đánh giá", error: error.message });
  }
};