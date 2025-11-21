import { ServicePackage } from '../models/index.js'; // Đảm bảo đường dẫn import đúng
import mongoose from 'mongoose';

const servicePackageController = {
  
  // 📦 Tạo gói dịch vụ mới
  createPackage: async (req, res) => {
    try {
      const photographerId = req.user._id || req.user.id;
      
      // Lấy thêm baseLocation và travelFeeConfig từ req.body
      const { TenGoi, MoTa, DichVu, LoaiGoi, ThoiGianThucHien, baseLocation, travelFeeConfig } = req.body;

      if (!TenGoi || !MoTa || !DichVu || !Array.isArray(DichVu) || DichVu.length === 0) {
        return res.status(400).json({
          message: 'Vui lòng điền đầy đủ thông tin: Tên gói, Mô tả, Dịch vụ'
        });
      }

      const invalidServices = DichVu.filter(s => !s.name || !s.Gia || s.Gia <= 0);
      if (invalidServices.length > 0) {
        return res.status(400).json({
          message: 'Mỗi dịch vụ phải có tên và giá hợp lệ (> 0)'
        });
      }

      // === XỬ LÝ VỊ TRÍ (FIX LỖI GEOJSON) ===
      let formattedLocation = {
        type: 'Point',
        coordinates: [0, 0], // Mặc định an toàn
        address: '',
        city: '',
        district: '',
        mapLink: ''
      };

      if (baseLocation) {
        // Nếu có tọa độ từ frontend gửi lên (thường là lat, lng)
        if (baseLocation.coordinates?.lat && baseLocation.coordinates?.lng) {
          formattedLocation.coordinates = [
            parseFloat(baseLocation.coordinates.lng), 
            parseFloat(baseLocation.coordinates.lat)
          ];
        }
        formattedLocation.address = baseLocation.address || '';
        formattedLocation.city = baseLocation.city || '';
        formattedLocation.district = baseLocation.district || '';
        formattedLocation.mapLink = baseLocation.mapLink || '';
      }
      // ======================================

      const newPackage = await ServicePackage.create({
        TenGoi,
        MoTa,
        DichVu: DichVu.map(s => ({
          name: s.name.trim(),
          Gia: Number(s.Gia)
        })),
        LoaiGoi: LoaiGoi || 'Other',
        ThoiGianThucHien,
        baseLocation: formattedLocation, // Lưu vị trí đã format
        travelFeeConfig: travelFeeConfig || {}, // Lưu cấu hình phí di chuyển
        PhotographerId: photographerId,
        TrangThai: 'active'
      });

      res.status(201).json({
        message: 'Tạo gói dịch vụ thành công!',
        package: newPackage
      });

    } catch (error) {
      console.error('❌ Error creating package:', error);
      res.status(500).json({
        message: 'Lỗi khi tạo gói dịch vụ',
        error: error.message
      });
    }
  },

  // 📋 Lấy tất cả gói dịch vụ
  getAllPackages: async (req, res) => {
    try {
      const { loaiGoi, minPrice, maxPrice, photographerId, sort, search } = req.query;

      let query = { TrangThai: 'active', isDeleted: false };

      if (loaiGoi) query.LoaiGoi = loaiGoi;
      if (photographerId) query.PhotographerId = photographerId;

      if (search) {
        query.$or = [
          { TenGoi: { $regex: search, $options: 'i' } },
          { MoTa: { $regex: search, $options: 'i' } }
        ];
      }

      let packages;
      
      if (minPrice || maxPrice) {
        const matchStage = { ...query };
        const pipeline = [
          { $match: matchStage },
          {
            $addFields: {
              MinPrice: { $min: "$DichVu.Gia" },
              MaxPrice: { $max: "$DichVu.Gia" }
            }
          },
          {
            $match: {
              ...(minPrice ? { MaxPrice: { $gte: Number(minPrice) } } : {}),
              ...(maxPrice ? { MinPrice: { $lte: Number(maxPrice) } } : {})
            }
          }
        ];

        packages = await ServicePackage.aggregate(pipeline);
        
        // Populate thủ công sau khi aggregate
        for (let i = 0; i < packages.length; i++) {
          const photographer = await mongoose.connection.db.collection('KHACHHANG')
            .findOne(
              { _id: packages[i].PhotographerId },
              { projection: { HoTen: 1, Avatar: 1, TenDangNhap: 1 } }
            );
          packages[i].PhotographerId = photographer;
        }
      } else {
        let sortOption = {};
        if (sort === 'rating') sortOption.DanhGia = -1;
        else if (sort === 'popular') sortOption.SoLuongDaDat = -1;
        else sortOption.createdAt = -1;

        packages = await ServicePackage.find(query)
          .populate({
            path: 'PhotographerId',
            select: 'HoTen Avatar TenDangNhap',
            model: 'bangKhachHang' // Đảm bảo model name đúng
          })
          .sort(sortOption)
          .lean();
      }

      console.log('✅ Fetched packages:', packages.length);

      res.status(200).json({
        success: true,
        total: packages.length,
        packages
      });

    } catch (error) {
      console.error('❌ Error fetching packages:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi khi lấy danh sách gói dịch vụ',
        error: error.message
      });
    }
  },

  // 🔍 Lấy chi tiết 1 gói dịch vụ
  getPackageById: async (req, res) => {
    try {
      const { id } = req.params;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ message: 'ID không hợp lệ' });
      }

      const package_data = await ServicePackage.findById(id)
        .populate({
          path: 'PhotographerId',
          select: 'HoTen Avatar TenDangNhap Email SDT DiaChi',
          model: 'bangKhachHang'
        });

      if (!package_data) {
        return res.status(404).json({ message: 'Không tìm thấy gói dịch vụ' });
      }

      res.status(200).json(package_data);

    } catch (error) {
      console.error('❌ Error fetching package:', error);
      res.status(500).json({
        message: 'Lỗi khi lấy thông tin gói dịch vụ',
        error: error.message
      });
    }
  },

  // 🔍 Lấy gói dịch vụ của photographer hiện tại
  getMyPackages: async (req, res) => {
    try {
      const photographerId = req.user._id || req.user.id;

      const packages = await ServicePackage.find({ 
        PhotographerId: photographerId,
        isDeleted: false
      }).sort({ createdAt: -1 });

      console.log('✅ My packages:', packages.length);

      res.status(200).json({
        total: packages.length,
        packages
      });

    } catch (error) {
      console.error('❌ Error fetching my packages:', error);
      res.status(500).json({
        message: 'Lỗi khi lấy danh sách gói dịch vụ của bạn',
        error: error.message
      });
    }
  },

  // 🔍 Lấy gói dịch vụ theo photographer username
  getPackagesByPhotographer: async (req, res) => {
    try {
      const { username } = req.params;

      const photographer = await mongoose.connection.db.collection('KHACHHANG')
        .findOne({ TenDangNhap: username });

      if (!photographer) {
        return res.status(404).json({ message: 'Không tìm thấy photographer' });
      }

      const packages = await ServicePackage.find({
        PhotographerId: photographer._id,
        TrangThai: 'active',
        isDeleted: false
      }).sort({ createdAt: -1 });

      res.status(200).json({
        total: packages.length,
        packages
      });

    } catch (error) {
      console.error('❌ Error fetching photographer packages:', error);
      res.status(500).json({
        message: 'Lỗi khi lấy gói dịch vụ của photographer',
        error: error.message
      });
    }
  },

  // ✏️ Cập nhật gói dịch vụ
  updatePackage: async (req, res) => {
    try {
      const { id } = req.params;
      const photographerId = req.user._id || req.user.id;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ message: 'ID không hợp lệ' });
      }

      const package_data = await ServicePackage.findById(id);
      if (!package_data) {
        return res.status(404).json({ message: 'Không tìm thấy gói dịch vụ' });
      }

      if (package_data.PhotographerId.toString() !== photographerId.toString()) {
        return res.status(403).json({ message: 'Bạn không có quyền chỉnh sửa gói này' });
      }

      // Validate Dịch vụ nếu có update
      if (req.body.DichVu) {
        if (!Array.isArray(req.body.DichVu) || req.body.DichVu.length === 0) {
          return res.status(400).json({ message: 'Dịch vụ phải là mảng và không được rỗng' });
        }
        const invalidServices = req.body.DichVu.filter(s => !s.name || !s.Gia || s.Gia <= 0);
        if (invalidServices.length > 0) {
          return res.status(400).json({ message: 'Mỗi dịch vụ phải có tên và giá hợp lệ' });
        }
      }

      const allowedUpdates = ['TenGoi', 'MoTa', 'DichVu', 'LoaiGoi', 'ThoiGianThucHien', 'TrangThai', 'travelFeeConfig'];
      const updates = {};
      
      allowedUpdates.forEach(field => {
        if (req.body[field] !== undefined) {
          updates[field] = req.body[field];
        }
      });

      // === XỬ LÝ UPDATE VỊ TRÍ ===
      if (req.body.baseLocation) {
        const rawLoc = req.body.baseLocation;
        // Giữ lại data cũ nếu không có data mới, hoặc tạo mới
        let newLoc = { 
           ...package_data.baseLocation.toObject(), 
           ...rawLoc,
           type: 'Point' // Đảm bảo luôn là Point
        };

        // Nếu update tọa độ
        if (rawLoc.coordinates?.lat && rawLoc.coordinates?.lng) {
            newLoc.coordinates = [
                parseFloat(rawLoc.coordinates.lng),
                parseFloat(rawLoc.coordinates.lat)
            ];
        }
        updates.baseLocation = newLoc;
      }
      // ==========================

      const updatedPackage = await ServicePackage.findByIdAndUpdate(
        id,
        updates,
        { new: true, runValidators: true }
      );

      res.status(200).json({
        message: 'Cập nhật gói dịch vụ thành công!',
        package: updatedPackage
      });

    } catch (error) {
      console.error('❌ Error updating package:', error);
      res.status(500).json({
        message: 'Lỗi khi cập nhật gói dịch vụ',
        error: error.message
      });
    }
  },

  // 🗑️ Xóa gói dịch vụ (Soft delete)
  deletePackage: async (req, res) => {
    try {
      const { id } = req.params;
      const photographerId = req.user._id || req.user.id;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ message: 'ID không hợp lệ' });
      }

      const package_data = await ServicePackage.findById(id);
      if (!package_data) {
        return res.status(404).json({ message: 'Không tìm thấy gói dịch vụ' });
      }

      if (package_data.PhotographerId.toString() !== photographerId.toString()) {
        return res.status(403).json({ message: 'Bạn không có quyền xóa gói này' });
      }

      await ServicePackage.findByIdAndUpdate(id, {
        isDeleted: true,
        TrangThai: 'deleted'
      });

      res.status(200).json({
        message: 'Xóa gói dịch vụ thành công!'
      });

    } catch (error) {
      console.error('❌ Error deleting package:', error);
      res.status(500).json({
        message: 'Lỗi khi xóa gói dịch vụ',
        error: error.message
      });
    }
  },

  // ⭐ Đánh giá gói dịch vụ
  ratePackage: async (req, res) => {
    try {
      const { id } = req.params;
      const { rating } = req.body;

      if (!rating || rating < 1 || rating > 5) {
        return res.status(400).json({ message: 'Đánh giá phải từ 1 đến 5 sao' });
      }

      const package_data = await ServicePackage.findById(id);
      if (!package_data) {
        return res.status(404).json({ message: 'Không tìm thấy gói dịch vụ' });
      }

      const currentTotal = package_data.DanhGia * package_data.SoLuotDanhGia;
      const newTotal = currentTotal + rating;
      const newCount = package_data.SoLuotDanhGia + 1;
      const newAvgRating = newTotal / newCount;

      await ServicePackage.findByIdAndUpdate(id, {
        DanhGia: newAvgRating,
        SoLuotDanhGia: newCount
      });

      res.status(200).json({
        message: 'Đánh giá thành công!',
        newRating: newAvgRating.toFixed(1),
        totalReviews: newCount
      });

    } catch (error) {
      console.error('❌ Error rating package:', error);
      res.status(500).json({
        message: 'Lỗi khi đánh giá gói dịch vụ',
        error: error.message
      });
    }
  },

};

export default servicePackageController;