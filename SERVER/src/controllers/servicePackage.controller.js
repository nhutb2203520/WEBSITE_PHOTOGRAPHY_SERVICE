import { ServicePackage } from '../models/index.js'; // Đảm bảo đường dẫn import đúng
import mongoose from 'mongoose';
import axios from 'axios'; // 📦 Cần cài: npm install axios

// ==========================================
// 🤖 AI HELPER: HỌC VECTOR (Content + Color)
// ==========================================
export const analyzePackageImage = async (packageId, imageUrl) => {
  try {
    const SERVER_URL = process.env.SERVER_URL || 'http://localhost:5000';
    // Đảm bảo URL ảnh là tuyệt đối
    const fullImageUrl = imageUrl.startsWith('http') ? imageUrl : `${SERVER_URL}${imageUrl}`;

    console.log(`🤖 [AI] Đang phân tích gói: ${packageId}`);
    
    // Gọi sang Python Service (Port 8000)
    const response = await axios.post('http://localhost:8000/analyze', {
        image_url: fullImageUrl
    });

    if (response.data && response.data.success) {
        await ServicePackage.findByIdAndUpdate(packageId, {
            ai_features: {
                vector: response.data.vector,
                color_vector: response.data.color_vector, // ✅ Lưu vector màu
                dominant_color: response.data.dominant_color,
                palette: response.data.palette,           // ✅ Lưu bảng màu
                is_analyzed: true
            }
        });
        console.log(`✅ [AI] Đã cập nhật xong (Vector + Color)!`);
    }
  } catch (error) {
    console.error("⚠️ [AI Warning]:", error.message);
  }
};

const servicePackageController = {

  // ==========================================
  // 🔍 AI SEARCH (HYBRID: Content + Color)
  // ==========================================
  searchByImage: async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "Vui lòng upload ảnh để tìm kiếm" });
      }

      // 1. Tạo URL cho ảnh khách vừa upload
      const fileUrl = `${req.protocol}://${req.get('host')}/uploads/packages/${req.file.filename}`;
      console.log("📸 [Search] Đang tìm kiếm:", fileUrl);

      // 2. Phân tích ảnh Query
      const analyzeRes = await axios.post('http://localhost:8000/analyze', {
        image_url: fileUrl
      });

      if (!analyzeRes.data.success) {
        return res.status(500).json({ message: "Lỗi phân tích ảnh từ AI Service" });
      }
      const queryVector = analyzeRes.data.vector;
      const queryColorVector = analyzeRes.data.color_vector; // ✅ Lấy màu query

      // 3. Lấy danh sách Vector ứng viên từ DB
      const candidates = await ServicePackage.find({
        TrangThai: 'active',
        isDeleted: false,
        'ai_features.is_analyzed': true
      }).select('_id ai_features.vector ai_features.color_vector'); // ✅ Select thêm color_vector

      if (candidates.length === 0) {
        return res.status(200).json({ success: true, packages: [] });
      }

      // Format dữ liệu gửi đi
      const candidateList = candidates.map(pkg => ({
        id: pkg._id.toString(),
        vector: pkg.ai_features.vector,
        color_vector: pkg.ai_features.color_vector || [] // ✅ Gửi đi
      }));

      // 4. Gọi Python Ranking
      const rankRes = await axios.post('http://localhost:8000/rank', {
        query_vector: queryVector,
        query_color_vector: queryColorVector, // ✅ Gửi đi
        candidates: candidateList
      });

      const rankedResults = rankRes.data.ranked_results;

      // 5. Lấy thông tin chi tiết các gói từ DB
      const sortedIds = rankedResults.map(r => r.id);
      
      const resultPackages = await ServicePackage.find({
        _id: { $in: sortedIds }
      }).populate({
        path: 'PhotographerId',
        select: 'HoTen Avatar TenDangNhap',
        model: 'bangKhachHang'
      }).lean();

      // Sắp xếp lại kết quả theo điểm số
      const finalResults = sortedIds.map(id => {
        const pkg = resultPackages.find(p => p._id.toString() === id);
        const scoreInfo = rankedResults.find(r => r.id === id);
        return pkg ? { ...pkg, similarity_score: scoreInfo.score } : null;
      }).filter(item => item !== null);

      return res.status(200).json({
        success: true,
        total: finalResults.length,
        packages: finalResults
      });

    } catch (error) {
      console.error("❌ Lỗi Search Image:", error.message);
      return res.status(500).json({ message: "Lỗi server khi tìm kiếm ảnh" });
    }
  },
  
  // ==========================================
  // 📦 TẠO GÓI DỊCH VỤ MỚI
  // ==========================================
  createPackage: async (req, res) => {
    try {
      const photographerId = req.user._id || req.user.id;
      
      const { TenGoi, MoTa, DichVu, LoaiGoi, ThoiGianThucHien, baseLocation, travelFeeConfig, AnhBia } = req.body;

      if (!TenGoi || !MoTa || !DichVu || !Array.isArray(DichVu) || DichVu.length === 0) {
        return res.status(400).json({ message: 'Vui lòng điền đầy đủ thông tin: Tên gói, Mô tả, Dịch vụ' });
      }

      const invalidServices = DichVu.filter(s => !s.name || !s.Gia || s.Gia <= 0);
      if (invalidServices.length > 0) {
        return res.status(400).json({ message: 'Mỗi dịch vụ phải có tên và giá hợp lệ (> 0)' });
      }

      // === ✅ FIX LỖI GEOJSON: Xử lý an toàn hơn ===
      let formattedLocation = {
        type: 'Point',
        coordinates: [0, 0], 
        address: '', city: '', district: '', mapLink: ''
      };

      if (baseLocation) {
        // Map các trường string
        formattedLocation.address = baseLocation.address || '';
        formattedLocation.city = baseLocation.city || '';
        formattedLocation.district = baseLocation.district || '';
        formattedLocation.mapLink = baseLocation.mapLink || '';

        // Xử lý tọa độ (Chấp nhận cả Object {lat, lng} hoặc Array [{lat, lng}])
        const coords = baseLocation.coordinates;
        let lat, lng;

        if (coords) {
             // Trường hợp 1: { lat: 10, lng: 105 }
             if (coords.lat !== undefined && coords.lng !== undefined) {
                 lat = coords.lat; lng = coords.lng;
             } 
             // Trường hợp 2: [{ lat: 10, lng: 105 }]
             else if (Array.isArray(coords) && coords.length > 0 && coords[0].lat) {
                 lat = coords[0].lat; lng = coords[0].lng;
             }

             if (lat && lng) {
                 formattedLocation.coordinates = [parseFloat(lng), parseFloat(lat)];
             }
        }
      }
      // ======================================

      const newPackage = await ServicePackage.create({
        TenGoi,
        MoTa,
        DichVu: DichVu.map(s => ({ name: s.name.trim(), Gia: Number(s.Gia) })),
        LoaiGoi: LoaiGoi || 'Other',
        ThoiGianThucHien,
        baseLocation: formattedLocation,
        travelFeeConfig: travelFeeConfig || {},
        PhotographerId: photographerId,
        TrangThai: 'active',
        AnhBia: AnhBia || null
      });

      // 🤖 TRIGGER AI: Nếu có ảnh bìa (dạng link string), chạy AI ngay
      if (AnhBia && typeof AnhBia === 'string') {
        analyzePackageImage(newPackage._id, AnhBia);
      }

      res.status(201).json({
        message: 'Tạo gói dịch vụ thành công!',
        package: newPackage
      });

    } catch (error) {
      console.error('❌ Error creating package:', error);
      res.status(500).json({ message: 'Lỗi khi tạo gói dịch vụ', error: error.message });
    }
  },

  // ==========================================
  // 📋 LẤY TẤT CẢ GÓI (FILTER, SORT, AGGREGATE)
  // ==========================================
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
      
      // LOGIC 1: LỌC THEO GIÁ (Dùng Aggregate)
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

      // LOGIC 2: LẤY THƯỜNG (Có Sort)
      } else {
        let sortOption = {};
        if (sort === 'rating') sortOption.DanhGia = -1;
        else if (sort === 'popular') sortOption.SoLuongDaDat = -1;
        else sortOption.createdAt = -1;

        packages = await ServicePackage.find(query)
          .populate({
            path: 'PhotographerId',
            select: 'HoTen Avatar TenDangNhap',
            model: 'bangKhachHang'
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
      res.status(500).json({ message: 'Lỗi khi lấy danh sách gói dịch vụ', error: error.message });
    }
  },

  // ==========================================
  // 🔍 LẤY CHI TIẾT GÓI
  // ==========================================
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
      res.status(500).json({ message: 'Lỗi khi lấy thông tin gói dịch vụ', error: error.message });
    }
  },

  // ==========================================
  // 👤 LẤY GÓI CỦA TÔI
  // ==========================================
  getMyPackages: async (req, res) => {
    try {
      const photographerId = req.user._id || req.user.id;

      const packages = await ServicePackage.find({ 
        PhotographerId: photographerId,
        isDeleted: false
      }).sort({ createdAt: -1 });

      console.log('✅ My packages:', packages.length);
      res.status(200).json({ total: packages.length, packages });

    } catch (error) {
      console.error('❌ Error fetching my packages:', error);
      res.status(500).json({ message: 'Lỗi khi lấy danh sách gói dịch vụ của bạn', error: error.message });
    }
  },

  // ==========================================
  // 👤 LẤY GÓI CỦA PHOTOGRAPHER (PUBLIC)
  // ==========================================
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

      res.status(200).json({ total: packages.length, packages });

    } catch (error) {
      console.error('❌ Error fetching photographer packages:', error);
      res.status(500).json({ message: 'Lỗi khi lấy gói dịch vụ của photographer', error: error.message });
    }
  },

  // ==========================================
  // ✏️ CẬP NHẬT GÓI DỊCH VỤ
  // ==========================================
  updatePackage: async (req, res) => {
    try {
      const { id } = req.params;
      const photographerId = req.user._id || req.user.id;

      if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ message: 'ID không hợp lệ' });

      const package_data = await ServicePackage.findById(id);
      if (!package_data) return res.status(404).json({ message: 'Không tìm thấy gói dịch vụ' });

      if (package_data.PhotographerId.toString() !== photographerId.toString()) {
        return res.status(403).json({ message: 'Bạn không có quyền chỉnh sửa gói này' });
      }

      // Validate Dịch vụ
      if (req.body.DichVu) {
        if (!Array.isArray(req.body.DichVu) || req.body.DichVu.length === 0) {
          return res.status(400).json({ message: 'Dịch vụ phải là mảng và không được rỗng' });
        }
        const invalidServices = req.body.DichVu.filter(s => !s.name || !s.Gia || s.Gia <= 0);
        if (invalidServices.length > 0) {
          return res.status(400).json({ message: 'Mỗi dịch vụ phải có tên và giá hợp lệ' });
        }
      }

      const allowedUpdates = ['TenGoi', 'MoTa', 'DichVu', 'LoaiGoi', 'ThoiGianThucHien', 'TrangThai', 'travelFeeConfig', 'AnhBia'];
      const updates = {};
      
      allowedUpdates.forEach(field => {
        if (req.body[field] !== undefined) {
          updates[field] = req.body[field];
        }
      });

      // === ✅ FIX LỖI GEOJSON CHO UPDATE ===
      if (req.body.baseLocation) {
        const rawLoc = req.body.baseLocation;
        let newLoc = { 
           ...package_data.baseLocation.toObject(), 
           ...rawLoc,
           type: 'Point' 
        };

        const coords = rawLoc.coordinates;
        let lat, lng;
        
        if (coords) {
             // Trường hợp 1: { lat, lng }
             if (coords.lat !== undefined && coords.lng !== undefined) {
                 lat = coords.lat; lng = coords.lng;
             } 
             // Trường hợp 2: [{ lat, lng }]
             else if (Array.isArray(coords) && coords.length > 0 && coords[0].lat) {
                 lat = coords[0].lat; lng = coords[0].lng;
             }

             if (lat && lng) {
                 newLoc.coordinates = [parseFloat(lng), parseFloat(lat)];
             }
        }
        updates.baseLocation = newLoc;
      }
      // =====================================

      const updatedPackage = await ServicePackage.findByIdAndUpdate(
        id,
        updates,
        { new: true, runValidators: true }
      );

      // 🤖 TRIGGER AI: Nếu update ảnh bìa, chạy AI
      if (updates.AnhBia && typeof updates.AnhBia === 'string') {
        analyzePackageImage(updatedPackage._id, updates.AnhBia);
      }

      res.status(200).json({
        message: 'Cập nhật gói dịch vụ thành công!',
        package: updatedPackage
      });

    } catch (error) {
      console.error('❌ Error updating package:', error);
      res.status(500).json({ message: 'Lỗi khi cập nhật gói dịch vụ', error: error.message });
    }
  },

  // ==========================================
  // 🗑️ XÓA GÓI
  // ==========================================
  deletePackage: async (req, res) => {
    try {
      const { id } = req.params;
      const photographerId = req.user._id || req.user.id;

      if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ message: 'ID không hợp lệ' });

      const package_data = await ServicePackage.findById(id);
      if (!package_data) return res.status(404).json({ message: 'Không tìm thấy gói dịch vụ' });

      if (package_data.PhotographerId.toString() !== photographerId.toString()) {
        return res.status(403).json({ message: 'Bạn không có quyền xóa gói này' });
      }

      await ServicePackage.findByIdAndUpdate(id, {
        isDeleted: true,
        TrangThai: 'deleted'
      });

      res.status(200).json({ message: 'Xóa gói dịch vụ thành công!' });

    } catch (error) {
      console.error('❌ Error deleting package:', error);
      res.status(500).json({ message: 'Lỗi khi xóa gói dịch vụ', error: error.message });
    }
  },

  // ==========================================
  // ⭐ ĐÁNH GIÁ
  // ==========================================
  ratePackage: async (req, res) => {
    try {
      const { id } = req.params;
      const { rating } = req.body;

      if (!rating || rating < 1 || rating > 5) {
        return res.status(400).json({ message: 'Đánh giá phải từ 1 đến 5 sao' });
      }

      const package_data = await ServicePackage.findById(id);
      if (!package_data) return res.status(404).json({ message: 'Không tìm thấy gói dịch vụ' });

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
      res.status(500).json({ message: 'Lỗi khi đánh giá gói dịch vụ', error: error.message });
    }
  },

};

export default servicePackageController;