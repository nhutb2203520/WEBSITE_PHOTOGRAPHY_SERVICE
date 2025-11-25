import mongoose from "mongoose";

const photoSchema = new mongoose.Schema({
  url: { type: String, required: true },
  filename: { type: String, default: "" },
  is_selected: { type: Boolean, default: false }, // Khách chọn để chỉnh sửa
  customer_note: { type: String, default: "" }    // Ghi chú chỉnh sửa (VD: "Làm trắng da")
});

const albumSchema = new mongoose.Schema(
  {
    // --- Thay đổi quan trọng: order_id không còn required ---
    order_id: { type: mongoose.Schema.Types.ObjectId, ref: "Orders", default: null },
    
    photographer_id: { type: mongoose.Schema.Types.ObjectId, ref: "bangThoChupAnh", required: true },
    customer_id: { type: mongoose.Schema.Types.ObjectId, ref: "bangKhachHang", default: null },
    
    // Thêm trường cho khách vãng lai (Job ngoài)
    client_name: { type: String, default: "" }, // Tên khách job ngoài
    client_contact: { type: String, default: "" }, // SĐT/Email (tùy chọn)
    
    type: { type: String, enum: ['order', 'freelance'], default: 'order' }, // Loại album

    title: { type: String, default: "Album ảnh" },
    description: { type: String, default: "" },
    photos: [photoSchema],
    
    status: { 
        type: String, 
        enum: ['draft', 'sent_to_customer', 'selection_completed', 'finalized'], 
        default: 'draft' 
    },
    
    // Link chia sẻ công khai (cho khách không có tài khoản)
    share_token: { type: String, default: null } 
  },
  { timestamps: true }
);

// Index để tìm kiếm nhanh
albumSchema.index({ photographer_id: 1 });
albumSchema.index({ share_token: 1 });

export default mongoose.model("Album", albumSchema);