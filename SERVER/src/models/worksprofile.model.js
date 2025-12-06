import mongoose from "mongoose";

const worksProfileSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "bangKhachHang", // Đảm bảo tên ref khớp với Model User của bạn
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    images: [
      {
        type: String, // đường dẫn ảnh (ví dụ: /uploads/anh1.jpg hoặc https://...)
        required: true,
      },
    ],
    
    // ✅ PHẦN AI ĐẦY ĐỦ (Vector + Màu sắc)
    ai_features: {
       vector: { type: [Number], default: [] },       // CLIP Vector
       color_vector: { type: [Number], default: [] }, // Color Histogram Vector
       dominant_color: { type: String, default: "" }, // Màu chính (Hex)
       palette: { type: [String], default: [] },      // Bảng màu (Top 5 Hex)
       is_analyzed: { type: Boolean, default: false }
    }
  },
  { timestamps: true } 
);

const WorksProfile = mongoose.model("WorksProfile", worksProfileSchema);
export default WorksProfile;