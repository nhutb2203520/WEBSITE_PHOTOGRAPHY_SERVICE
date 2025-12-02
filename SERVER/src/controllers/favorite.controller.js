import Favorite from "../models/favorite.model.js";

const favoriteController = {
  // ❤️ Toggle: Thêm/Xóa yêu thích
  toggleFavorite: async (req, res) => {
    try {
      const { type, itemId } = req.body; 
      const customerId = req.user.id || req.user._id;

      if (!['package', 'photographer'].includes(type)) {
        return res.status(400).json({ message: "Type không hợp lệ" });
      }

      const query = {
        CustomerId: customerId,
        Type: type,
        ...(type === 'package' ? { ServicePackageId: itemId } : { PhotographerId: itemId })
      };

      const existing = await Favorite.findOne(query);

      if (existing) {
        await Favorite.findByIdAndDelete(existing._id);
        return res.status(200).json({ success: true, isFavorited: false, message: "Đã xóa yêu thích" });
      } else {
        const newFav = new Favorite(query);
        await newFav.save();
        return res.status(201).json({ success: true, isFavorited: true, message: "Đã thêm yêu thích" });
      }

    } catch (error) {
      console.error("Toggle Favorite Error:", error);
      res.status(500).json({ message: "Lỗi server" });
    }
  },

  // 📋 Lấy danh sách yêu thích
  getMyFavorites: async (req, res) => {
    try {
      const customerId = req.user.id || req.user._id;

      // ✅ FIX QUAN TRỌNG: Thêm model: 'bangKhachHang' vào populate
      const favorites = await Favorite.find({ CustomerId: customerId })
        .populate({
            path: 'ServicePackageId',
            select: 'TenGoi AnhBia Gia DichVu MoTa DanhGia SoLuotDanhGia LoaiGoi PhotographerId',
            populate: { 
                path: 'PhotographerId', 
                select: 'HoTen Avatar',
                model: 'bangKhachHang' // ⚠️ Bắt buộc phải có dòng này để tránh lỗi
            }
        })
        .populate({
            path: 'PhotographerId',
            select: 'HoTen Avatar CoverImage DiaChi',
            model: 'bangKhachHang' // ⚠️ Bắt buộc phải có dòng này
        })
        .sort({ createdAt: -1 });

      // Lọc bỏ các mục bị null (do gói/thợ đã bị xóa)
      const favoritePackages = favorites
        .filter(f => f.Type === 'package' && f.ServicePackageId)
        .map(f => ({ ...f.ServicePackageId.toObject(), favoriteId: f._id }));

      const favoritePhotographers = favorites
        .filter(f => f.Type === 'photographer' && f.PhotographerId)
        .map(f => ({ ...f.PhotographerId.toObject(), favoriteId: f._id }));

      // Lấy danh sách ID để tô đỏ nút tim ở Frontend
      const allIds = favorites.map(f => 
        f.Type === 'package' ? f.ServicePackageId?._id?.toString() : f.PhotographerId?._id?.toString()
      ).filter(Boolean);

      return res.status(200).json({ 
          success: true, 
          data: {
              packages: favoritePackages,
              photographers: favoritePhotographers,
              allIds: allIds
          }
      });

    } catch (error) {
      console.error("Get Favorites Error:", error);
      // Trả về mảng rỗng thay vì lỗi 500 để Frontend không bị crash
      return res.status(200).json({ 
          success: true, 
          data: { packages: [], photographers: [], allIds: [] } 
      });
    }
  }
};

export default favoriteController;