import mongoose from "mongoose";

const worksProfileSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "bangKhachHang", // Đảm bảo ref đúng với Model User
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    images: [
      {
        type: String, // đường dẫn ảnh
        required: true,
      },
    ],
    // ✅ MỚI: Phần chứa dữ liệu từ AI
    ai_features: {
       vector: { type: [Number], default: [] }, 
       dominant_color: { type: String, default: "" },
       is_analyzed: { type: Boolean, default: false }
    }
  },
  { timestamps: true } 
);

const WorksProfile = mongoose.model("WorksProfile", worksProfileSchema);
export default WorksProfile;