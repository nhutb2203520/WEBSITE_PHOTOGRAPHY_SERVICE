import mongoose from "mongoose";

const photoSchema = new mongoose.Schema({
  url: { type: String, required: true },
  filename: { type: String, default: "" },
  is_selected: { type: Boolean, default: false }, // Khách chọn
  customer_note: { type: String, default: "" }    // Ghi chú của khách
});

const albumSchema = new mongoose.Schema(
  {
    order_id: { type: mongoose.Schema.Types.ObjectId, ref: "Orders", default: null },
    photographer_id: { type: mongoose.Schema.Types.ObjectId, ref: "bangThoChupAnh", required: true },
    customer_id: { type: mongoose.Schema.Types.ObjectId, ref: "bangKhachHang", default: null },
    
    // Thông tin cho Job ngoài
    client_name: { type: String, default: "" }, 
    client_contact: { type: String, default: "" }, 
    
    type: { type: String, enum: ['order', 'freelance'], default: 'order' },

    title: { type: String, default: "Album ảnh" },
    description: { type: String, default: "" },
    
    // Ảnh gốc (Raw)
    photos: [photoSchema],

    // [NEW] Ảnh đã chỉnh sửa (Final) - Nhiếp ảnh gia upload khi giao
    edited_photos: [photoSchema], 
    
    status: { 
        type: String, 
        enum: ['draft', 'sent_to_customer', 'selection_completed', 'finalized'], 
        default: 'draft' 
    },
    
    share_token: { type: String, default: null } 
  },
  { timestamps: true }
);

albumSchema.index({ photographer_id: 1 });
albumSchema.index({ share_token: 1 });

export default mongoose.model("Album", albumSchema);