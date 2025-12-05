import mongoose from "mongoose"; // 🔥 [QUAN TRỌNG] Phải có dòng này
import Review from "../models/review.model.js";
import Order from "../models/order.model.js";

// 🔥 Import model User để tránh lỗi populate không tìm thấy Schema
import "../models/khachhang.model.js"; 

// [GET] Lấy danh sách đánh giá
export const getReviews = async (req, res) => {
  try {
    const { photographerId } = req.query;
    
    // Mặc định lọc status approved
    const query = { Status: 'approved' }; 

    if (photographerId) {
      if (!mongoose.Types.ObjectId.isValid(photographerId)) {
        return res.status(400).json({ 
            message: "Photographer ID không hợp lệ", 
            success: false 
        });
      }
      // 🔥 [SỬA TẠI ĐÂY] Ép kiểu thủ công sang ObjectId
      query.PhotographerId = new mongoose.Types.ObjectId(photographerId);
    }

    // 🔍 Log ra xem Backend thực sự tìm kiếm gì
    console.log("🔍 Đang tìm review với query:", JSON.stringify(query));

    const reviews = await Review.find(query)
      .populate("CustomerId", "HoTen Avatar") 
      .sort({ createdAt: -1 });
    
    console.log(`✅ Tìm thấy ${reviews.length} đánh giá.`);

    res.status(200).json({
        success: true,
        count: reviews.length,
        data: reviews
    });

  } catch (error) {
    console.error("❌ Lỗi getReviews:", error);
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
    
    const order = await Order.findById(order_id);
    if (!order) return res.status(404).json({ message: "Đơn hàng không tồn tại" });

    const reviewData = {
        OrderId: order_id,
        PackageId: order.service_package_id,
        PhotographerId: order.photographer_id,
        CustomerId: req.user._id || req.user.id, 
        Rating: rating,
        Comment: comment,
        Status: 'approved',
        Images: []
    };

    if (req.files && req.files.length > 0) {
        reviewData.Images = req.files.map(file => `/uploads/reviews/${file.filename}`);
    }

    const newReview = new Review(reviewData);
    const savedReview = await newReview.save();

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

    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ message: "Review ID không hợp lệ" });
    }

    const review = await Review.findById(id);
    if (!review) return res.status(404).json({ message: "Không tìm thấy đánh giá" });

    const userId = req.user._id || req.user.id;
    if (review.CustomerId.toString() !== userId.toString()) {
        return res.status(403).json({ message: "Bạn không có quyền sửa đánh giá này" });
    }

    if (review.is_edited) {
        return res.status(400).json({ message: "Bạn chỉ được chỉnh sửa đánh giá 1 lần duy nhất." });
    }

    review.Rating = rating;
    review.Comment = comment;
    review.is_edited = true; 

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