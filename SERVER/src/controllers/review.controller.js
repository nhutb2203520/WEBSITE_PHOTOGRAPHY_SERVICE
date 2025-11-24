import Review from "../models/review.model.js";
import Order from "../models/order.model.js"; // Nếu cần update trạng thái đơn

// [GET] /api/reviews?photographerId=...
export const getReviews = async (req, res) => {
  try {
    const { photographerId } = req.query;
    const query = { Status: 'approved' }; // Mặc định chỉ lấy review đã duyệt

    if (photographerId) {
      query.PhotographerId = photographerId;
    }

    // Populate để lấy tên và avatar người đánh giá
    const reviews = await Review.find(query)
      .populate("CustomerId", "HoTen Avatar")
      .sort({ createdAt: -1 });

    res.status(200).json(reviews);
  } catch (error) {
    console.error("❌ Error fetching reviews:", error);
    res.status(500).json({ message: "Lỗi server khi lấy đánh giá", error: error.message });
  }
};

// [POST] /api/reviews - Tạo đánh giá mới
export const createReview = async (req, res) => {
  try {
    const { order_id, rating, comment, ...otherData } = req.body;
    
    // 1. Tìm đơn hàng để lấy thông tin Photographer & Package
    const order = await Order.findById(order_id);
    if (!order) return res.status(404).json({ message: "Đơn hàng không tồn tại" });

    // 2. Chuẩn bị dữ liệu review
    const reviewData = {
        OrderId: order_id,
        PackageId: order.service_package_id,
        PhotographerId: order.photographer_id,
        CustomerId: req.user._id || req.user.id, // Lấy từ token
        Rating: rating,
        Comment: comment,
        Images: []
    };

    // 3. Xử lý ảnh upload (nếu có)
    if (req.files && req.files.length > 0) {
        reviewData.Images = req.files.map(file => `/uploads/reviews/${file.filename}`);
    }

    const newReview = new Review(reviewData);
    const savedReview = await newReview.save();

    // 4. Cập nhật lại đơn hàng (nếu cần flag đã review)
    // await Order.findByIdAndUpdate(order_id, { isReviewed: true });

    res.status(201).json(savedReview);
  } catch (error) {
    console.error("❌ Error creating review:", error);
    res.status(400).json({ message: "Lỗi khi tạo đánh giá", error: error.message });
  }
};

// [PUT] /api/reviews/:id - Sửa đánh giá
export const updateReview = async (req, res) => {
  try {
    const { id } = req.params;
    const { rating, comment } = req.body;

    const review = await Review.findById(id);
    if (!review) return res.status(404).json({ message: "Không tìm thấy đánh giá" });

    // Kiểm tra quyền (chỉ người tạo mới được sửa)
    const userId = req.user._id || req.user.id;
    if (review.CustomerId.toString() !== userId.toString()) {
        return res.status(403).json({ message: "Bạn không có quyền sửa đánh giá này" });
    }

    // Kiểm tra đã sửa lần nào chưa (nếu có logic giới hạn 1 lần)
    if (review.is_edited) {
        return res.status(400).json({ message: "Bạn chỉ được chỉnh sửa đánh giá 1 lần duy nhất." });
    }

    // Update thông tin
    review.Rating = rating;
    review.Comment = comment;
    review.is_edited = true; // Đánh dấu đã sửa

    // Xử lý ảnh mới (nếu upload lại toàn bộ ảnh)
    if (req.files && req.files.length > 0) {
        // Có thể xóa ảnh cũ ở đây nếu cần
        review.Images = req.files.map(file => `/uploads/reviews/${file.filename}`);
    }

    await review.save();
    res.status(200).json(review);

  } catch (error) {
    console.error("❌ Error updating review:", error);
    res.status(500).json({ message: "Lỗi khi cập nhật đánh giá", error: error.message });
  }
};