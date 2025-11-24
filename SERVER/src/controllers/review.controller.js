import Review from "../models/review.model.js";

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

// [POST] /api/reviews
export const createReview = async (req, res) => {
  try {
    const newReview = new Review(req.body);
    const savedReview = await newReview.save();
    res.status(201).json(savedReview);
  } catch (error) {
    console.error("❌ Error creating review:", error);
    res.status(400).json({ message: "Lỗi khi tạo đánh giá", error: error.message });
  }
};