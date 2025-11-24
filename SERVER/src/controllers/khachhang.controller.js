import ApiError from "../ApiError.js";
import KhachHangService from "../services/khachhang.service.js";
import KhachHangModel from "../models/khachhang.model.js"; 

// [GET] /api/khachhang/photographers
// ✅ HÀM MỚI: Lấy danh sách photographer kèm thống kê thực tế từ DB
export const getAllPhotographers = async (req, res, next) => {
  try {
    const photographers = await KhachHangModel.aggregate([
      // 1. Chỉ lấy User là Photographer
      { $match: { isPhotographer: true } },

      // 2. JOIN với bảng Reviews để lấy đánh giá đã duyệt
      {
        $lookup: {
          from: "reviews", // Tên collection trong DB (xem review.model.js)
          let: { pid: "$_id" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ["$PhotographerId", "$$pid"] },
                    { $eq: ["$Status", "approved"] } // Chỉ lấy review đã duyệt
                  ]
                }
              }
            },
            { $project: { Rating: 1 } }
          ],
          as: "reviewData"
        }
      },

      // 3. JOIN với bảng ServicePackages để đếm gói dịch vụ
      {
        $lookup: {
          from: "servicepackages", // Tên collection trong DB
          let: { pid: "$_id" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ["$PhotographerId", "$$pid"] },
                    { $eq: ["$TrangThai", "active"] }, // Chỉ lấy gói đang hoạt động
                    { $ne: ["$isDeleted", true] }
                  ]
                }
              }
            },
            { $project: { _id: 1 } }
          ],
          as: "packageData"
        }
      },

      // 4. Tính toán số liệu
      {
        $addFields: {
          avgRating: { $avg: "$reviewData.Rating" }, // Tính trung bình sao
          totalReviews: { $size: "$reviewData" },    // Đếm số lượng review
          totalPackages: { $size: "$packageData" }   // Đếm số lượng gói
        }
      },

      // 5. Chọn các trường trả về
      {
        $project: {
          _id: 1,
          TenDangNhap: 1,
          HoTen: 1,
          Avatar: 1,
          CoverImage: 1,
          // Nếu chưa có đánh giá thì mặc định 5.0 (để khích lệ) hoặc 0 tùy ý
          rating: { $ifNull: [ { $round: ["$avgRating", 1] }, 5.0 ] }, 
          reviews: "$totalReviews",
          packages: "$totalPackages"
        }
      }
    ]);

    return res.status(200).json(photographers);
  } catch (err) {
    console.error("❌ Error in getAllPhotographers:", err);
    return next(new ApiError(500, "Lỗi khi lấy danh sách photographer."));
  }
};

// [GET] /api/khachhang/me
export const getMyAccount = async (req, res, next) => {
  try {
    const userId = req.user.id || req.user._id;
    const result = await KhachHangService.getMyAccount(userId);
    return res.status(200).json(result.customer);
  } catch (err) {
    console.error("❌ Error in getMyAccount:", err);
    return next(new ApiError(500, "Lỗi khi lấy thông tin tài khoản người dùng."));
  }
};

// [PATCH] /api/khachhang/update
export const updateAccount = async (req, res, next) => {
  try {
    const userId = req.user.id || req.user._id;
    const data = req.body;

    const result = await KhachHangService.updateAccount(userId, data);
    return res.status(200).json(result);
  } catch (err) {
    console.error("❌ Error in updateAccount:", err);
    return next(new ApiError(500, "Lỗi khi cập nhật tài khoản người dùng."));
  }
};

// [POST] /api/khachhang/login
export const login = async (req, res, next) => {
  try {
    const result = await KhachHangService.login(req.body);
    return res.status(200).json(result);
  } catch (err) {
    console.error("❌ Error in login:", err);
    return next(new ApiError(500, "Lỗi khi đăng nhập."));
  }
};

// [POST] /api/khachhang/register
export const register = async (req, res, next) => {
  try {
    const result = await KhachHangService.register(req.body);
    return res.status(201).json(result);
  } catch (err) {
    console.error("❌ Error in register:", err);
    return next(new ApiError(500, "Lỗi khi đăng ký tài khoản."));
  }
};

// [PATCH] /api/khachhang/change-password
export const changePassword = async (req, res, next) => {
  try {
    const userId = req.user.id || req.user._id;
    const { currentPassword, newPassword } = req.body;
    const result = await KhachHangService.changePassword(userId, currentPassword, newPassword);
    return res.status(200).json(result);
  } catch (err) {
    console.error("❌ Error in changePassword:", err);
    return next(new ApiError(500, "Lỗi khi đổi mật khẩu."));
  }
};

export default {
  getMyAccount,
  register,
  login,
  updateAccount,
  changePassword,
  getAllPhotographers // ✅ Export thêm hàm mới
};