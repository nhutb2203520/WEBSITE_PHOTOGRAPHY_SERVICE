import mongoose from "mongoose";

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Đã kết nối MongoDB");
  } catch (error) {
    console.error("❌ Lỗi kết nối DB:", error.message);
    process.exit(1);
  }
};

export default connectDB;
