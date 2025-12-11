import mongoose from "mongoose";
import Review from "../models/review.model.js";
import Order from "../models/order.model.js";

// ✅ IMPORT ĐẦY ĐỦ MODEL LIÊN QUAN ĐỂ TRÁNH LỖI POPULATE
import "../models/khachhang.model.js"; 

// [GET] Lấy danh sách đánh giá
export const getReviews = async (req, res) => {
  try {
    // ✅ Lấy thêm packageId từ query params
    const { photographerId, packageId } = req.query;
    
    // Mặc định lọc status approved
    const query = { Status: 'approved' }; 

    // ✅ Ưu tiên lọc theo PackageId nếu có
    if (packageId) {
        if (!mongoose.Types.ObjectId.isValid(packageId)) {
            return res.status(400).json({ message: "Package ID không hợp lệ" });
        }
        query.PackageId = new mongoose.Types.ObjectId(packageId);
    } 
    // Nếu không có PackageId thì mới lọc theo PhotographerId
    else if (photographerId) {
      if (!mongoose.Types.ObjectId.isValid(photographerId)) {
        return res.status(400).json({ message: "Photographer ID không hợp lệ" });
      }
      query.PhotographerId = new mongoose.Types.ObjectId(photographerId);
    }

    console.log("🔍 Đang tìm review với query:", JSON.stringify(query));

    const reviews = await Review.find(query)
      .populate("CustomerId", "HoTen Avatar") // Populate thông tin người đánh giá
      .sort({ createdAt: -1 });
    
    console.log(`✅ Tìm thấy ${reviews.length} đánh giá.`);

    res.status(200).json({
        success: true,
        count: reviews.length,
        data: reviews
    });

  } catch (error) {
    console.error("❌ Lỗi getReviews:", error);
    res.status(500).json({ message: "Lỗi server khi lấy đánh giá: " + error.message });
  }
};

// [POST] Tạo đánh giá mới
export const createReview = async (req, res) => {
  try {
    const { order_id, rating, comment } = req.body;
    const userId = req.user._id || req.user.id;

    console.log("📝 Tạo review cho đơn:", order_id);

    // Kiểm tra đơn hàng
    const order = await Order.findOne({ 
        $or: [{ _id: order_id }, { order_id: order_id }] 
    });

    if (!order) return res.status(404).json({ message: "Đơn hàng không tồn tại" });

    // Kiểm tra quyền (chỉ khách hàng trong đơn mới được đánh giá)
    if (order.customer_id.toString() !== userId.toString()) {
        return res.status(403).json({ message: "Bạn không có quyền đánh giá đơn hàng này" });
    }

    // Kiểm tra trùng lặp
    const existing = await Review.findOne({ OrderId: order._id });
    if (existing) return res.status(400).json({ message: "Bạn đã đánh giá đơn hàng này rồi!" });

    const reviewData = {
        OrderId: order._id,
        PackageId: order.service_package_id,
        PhotographerId: order.photographer_id,
        CustomerId: userId,
        Rating: Number(rating),
        Comment: comment,
        Status: 'approved',
        Images: []
    };

    if (req.files && req.files.length > 0) {
        reviewData.Images = req.files.map(file => `/uploads/reviews/${file.filename}`);
    }

    const newReview = new Review(reviewData);
    await newReview.save();

    console.log("✅ Đánh giá thành công ID:", newReview._id);
    res.status(201).json(newReview);

  } catch (error) {
    console.error("❌ Error creating review:", error);
    res.status(500).json({ message: "Lỗi khi tạo đánh giá", error: error.message });
  }
};

// [PUT] Cập nhật đánh giá
export const updateReview = async (req, res) => {
  try {
    const { id } = req.params;
    const { rating, comment } = req.body;
    const userId = req.user._id || req.user.id;

    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ message: "Review ID không hợp lệ" });
    }

    const review = await Review.findById(id);
    if (!review) return res.status(404).json({ message: "Không tìm thấy đánh giá" });

    if (review.CustomerId.toString() !== userId.toString()) {
        return res.status(403).json({ message: "Bạn không có quyền sửa đánh giá này" });
    }

    if (review.is_edited) {
        return res.status(400).json({ message: "Bạn chỉ được chỉnh sửa đánh giá 1 lần duy nhất." });
    }

    review.Rating = Number(rating);
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