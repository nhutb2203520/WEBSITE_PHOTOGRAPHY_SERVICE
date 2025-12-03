import Favorite from "../models/favorite.model.js";
import mongoose from "mongoose";

const favoriteController = {
  // ❤️ Toggle: Thêm/Xóa yêu thích (Giữ nguyên logic của bạn)
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

  // 📋 Lấy danh sách yêu thích (ĐÃ VIẾT LẠI DÙNG AGGREGATE)
  getMyFavorites: async (req, res) => {
    try {
      const customerId = new mongoose.Types.ObjectId(req.user.id || req.user._id);

      const favorites = await Favorite.aggregate([
        // 1. Lọc theo CustomerId
        { $match: { CustomerId: customerId } },

        // 2. Chia luồng dữ liệu (Facet): 1 luồng xử lý Package, 1 luồng xử lý Photographer
        {
          $facet: {
            // === LUỒNG 1: XỬ LÝ GÓI DỊCH VỤ ===
            packages: [
              { $match: { Type: 'package' } },
              {
                $lookup: {
                  from: 'servicepackages', // Tên collection Gói trong DB
                  localField: 'ServicePackageId',
                  foreignField: '_id',
                  as: 'packageInfo'
                }
              },
              { $unwind: '$packageInfo' }, // Chỉ lấy gói còn tồn tại
              {
                $lookup: {
                  from: 'KHACHHANG', // Tên collection User trong DB
                  localField: 'packageInfo.PhotographerId',
                  foreignField: '_id',
                  as: 'pgInfo'
                }
              },
              {
                $project: {
                  _id: '$packageInfo._id', // ID gói
                  favoriteId: '$_id',      // ID yêu thích
                  TenGoi: '$packageInfo.TenGoi',
                  AnhBia: '$packageInfo.AnhBia',
                  Gia: '$packageInfo.Gia',
                  DichVu: '$packageInfo.DichVu',
                  LoaiGoi: '$packageInfo.LoaiGoi',
                  DanhGia: '$packageInfo.DanhGia',
                  SoLuotDanhGia: '$packageInfo.SoLuotDanhGia',
                  PhotographerId: { $arrayElemAt: ['$pgInfo', 0] } // Lấy object photographer
                }
              }
            ],

            // === LUỒNG 2: XỬ LÝ NHIẾP ẢNH GIA (Tính Rating/Reviews) ===
            photographers: [
              { $match: { Type: 'photographer' } },
              {
                $lookup: {
                  from: 'KHACHHANG',
                  localField: 'PhotographerId',
                  foreignField: '_id',
                  as: 'pgInfo'
                }
              },
              { $unwind: '$pgInfo' },
              
              // >>> JOIN REVIEWS <<<
              {
                $lookup: {
                  from: 'reviews',
                  let: { pid: '$pgInfo._id' },
                  pipeline: [
                    { $match: { $expr: { $and: [{ $eq: ['$PhotographerId', '$$pid'] }, { $eq: ['$Status', 'approved'] }] } } },
                    { $project: { Rating: 1 } }
                  ],
                  as: 'reviewData'
                }
              },
              
              // >>> JOIN PACKAGES (Đếm số gói) <<<
              {
                $lookup: {
                  from: 'servicepackages',
                  let: { pid: '$pgInfo._id' },
                  pipeline: [
                    { $match: { $expr: { $and: [{ $eq: ['$PhotographerId', '$$pid'] }, { $ne: ['$isDeleted', true] }] } } }
                  ],
                  as: 'pkgData'
                }
              },

              // >>> TÍNH TOÁN & TRẢ VỀ <<<
              {
                $project: {
                  _id: 1, // Favorite ID
                  photographer: {
                    _id: '$pgInfo._id',
                    TenDangNhap: '$pgInfo.TenDangNhap',
                    HoTen: '$pgInfo.HoTen',
                    Avatar: '$pgInfo.Avatar',
                    CoverImage: '$pgInfo.CoverImage',
                    DiaChi: '$pgInfo.DiaChi',
                    // Tính toán rating
                    rating: { $ifNull: [{ $round: [{ $avg: '$reviewData.Rating' }, 1] }, 5.0] },
                    reviews: { $size: '$reviewData' },
                    packages: { $size: '$pkgData' }
                  }
                }
              }
            ]
          }
        }
      ]);

      const result = favorites[0];
      
      // Lấy danh sách ID để tô đỏ nút tim
      const allIds = [
        ...result.packages.map(p => p._id.toString()),
        ...result.photographers.map(p => p.photographer._id.toString())
      ];

      return res.status(200).json({ 
          success: true, 
          data: {
              packages: result.packages,
              photographers: result.photographers, // Dữ liệu này giờ đã có rating, reviews chuẩn
              allIds: allIds
          }
      });

    } catch (error) {
      console.error("Get Favorites Error:", error);
      return res.status(200).json({ 
          success: true, 
          data: { packages: [], photographers: [], allIds: [] } 
      });
    }
  }
};

export default favoriteController;