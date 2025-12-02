import Review from "../models/review.model.js";
import Order from "../models/order.model.js";
import ServicePackage from "../models/servicePackage.model.js";

// ✅ Import thông báo cho User (Thợ chụp)
import { createNotification } from "./notification.controller.js";

// [GET] Lấy danh sách đánh giá
export const getReviews = async (req, res) => {
  try {
    const { photographerId } = req.query;
    const query = { Status: 'approved' }; 

    if (photographerId) {
      query.PhotographerId = photographerId;
    }

    const reviews = await Review.find(query)
      .populate("CustomerId", "HoTen Avatar")
      .sort({ createdAt: -1 });

    res.status(200).json(reviews);
  } catch (error) {
    res.status(500).json({ message: "Lỗi server khi lấy đánh giá", error: error.message });
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
            message: `Khách hàng vừa đánh giá ${rating} sao cho đơn hàng #${order.order_id}.`,
            type: "SYSTEM", // Có thể dùng type khác nếu muốn icon khác
            link: "/photographer/my-services" // Link để thợ vào xem (hoặc link chi tiết)
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
    res.status(500).json({ message: "Lỗi khi cập nhật đánh giá", error: error.message });
  }
};