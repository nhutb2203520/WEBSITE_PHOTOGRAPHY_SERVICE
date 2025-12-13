import mongoose from "mongoose";

const photoSchema = new mongoose.Schema({
  url: { type: String, required: true },
  filename: { type: String, default: "" },
  is_selected: { type: Boolean, default: false },
  customer_note: { type: String, default: "" }
});

const albumSchema = new mongoose.Schema(
  {
    order_id: { type: mongoose.Schema.Types.ObjectId, ref: "Orders", },
    
    // 👇 SỬA DÒNG NÀY: Thay "bangThoChupAnh" thành "bangKhachHang"
    photographer_id: { type: mongoose.Schema.Types.ObjectId, ref: "bangKhachHang", required: true },
    
    customer_id: { type: mongoose.Schema.Types.ObjectId, ref: "bangKhachHang", default: null },
    
    client_name: { type: String, default: "" }, 
    client_contact: { type: String, default: "" }, 
    
    type: { type: String, enum: ['order', 'freelance'], default: 'order' },

    title: { type: String, default: "Album ảnh" },
    description: { type: String, default: "" },
    
    photos: [photoSchema],
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

// Index giúp tìm kiếm nhanh hơn
albumSchema.index({ photographer_id: 1 });
albumSchema.index({ share_token: 1 });

export default mongoose.model("Album", albumSchema);