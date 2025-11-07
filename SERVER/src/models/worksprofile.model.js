import mongoose from "mongoose";

const worksProfileSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "KhachHang",
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
  },
  { timestamps: true } // tự động thêm createdAt và updatedAt
);

const WorksProfile = mongoose.model("WorksProfile", worksProfileSchema);
export default WorksProfile;
