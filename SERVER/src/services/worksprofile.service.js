import WorksProfile from "../models/worksprofile.model.js";

/**
 * ✅ Lấy tất cả hồ sơ tác phẩm (toàn bộ, không phân biệt user)
 */
export const getAllWorks = async () => {
  try {
    const works = await WorksProfile.find()
      .populate("userId", "HoTen Email")
      .sort({ createdAt: -1 });
    return works;
  } catch (error) {
    console.error("❌ Lỗi khi lấy tất cả hồ sơ:", error);
    throw new Error("Không thể lấy danh sách hồ sơ.");
  }
};

/**
 * ✅ Lấy hồ sơ tác phẩm theo ID
 */
export const getWorkById = async (id) => {
  try {
    const work = await WorksProfile.findById(id).populate("userId", "HoTen Email");
    if (!work) throw new Error("Không tìm thấy hồ sơ tác phẩm.");
    return work;
  } catch (error) {
    console.error("❌ Lỗi khi lấy hồ sơ theo ID:", error);
    throw new Error("Không thể lấy hồ sơ tác phẩm.");
  }
};

/**
 * ✅ Tạo mới hồ sơ tác phẩm
 */
export const createWork = async (data) => {
  try {
    const work = new WorksProfile(data);
    await work.save();
    return work;
  } catch (error) {
    console.error("❌ Lỗi khi tạo hồ sơ:", error);
    throw new Error("Không thể tạo hồ sơ tác phẩm mới.");
  }
};

/**
 * ✅ Cập nhật hồ sơ tác phẩm
 */
export const updateWork = async (id, data) => {
  try {
    const updated = await WorksProfile.findByIdAndUpdate(id, data, { new: true });
    if (!updated) throw new Error("Không tìm thấy hồ sơ để cập nhật.");
    return updated;
  } catch (error) {
    console.error("❌ Lỗi khi cập nhật hồ sơ:", error);
    throw new Error("Không thể cập nhật hồ sơ tác phẩm.");
  }
};

/**
 * ✅ Xóa hồ sơ tác phẩm
 */
export const deleteWork = async (id, userId = null) => {
  try {
    const filter = userId ? { _id: id, userId } : { _id: id };
    const deleted = await WorksProfile.findOneAndDelete(filter);
    if (!deleted) throw new Error("Không tìm thấy hồ sơ để xóa.");
    return deleted;
  } catch (error) {
    console.error("❌ Lỗi khi xóa hồ sơ:", error);
    throw new Error("Không thể xóa hồ sơ tác phẩm.");
  }
};
