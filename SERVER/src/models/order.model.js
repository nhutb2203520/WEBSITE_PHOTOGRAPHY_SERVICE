import mongoose from "mongoose";

const orderSchema = new mongoose.Schema(
  {
    order_id: {
      type: String,
      required: true,
      unique: true,
    },

    customer_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "bangKhachHang",
      required: true,
    },

    photographer_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "bangThoChupAnh",
      required: true,
    },

    service_package_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ServicePackage",
      required: true,
    },

    booking_date: { type: Date, required: true },
    booking_time: { type: String, required: true },

    guest_count: { type: Number, required: true },

    total_amount: { type: Number, required: true },
    discount_amount: { type: Number, default: 0 },
    final_amount: { type: Number, required: true },

    special_requests: { type: String, default: "" },

    status: {
      type: String,
      enum: ["pending", "confirmed", "completed", "cancelled"],
      default: "pending",
    },
  },
  { timestamps: true }
);

export default mongoose.model("Orders", orderSchema);
