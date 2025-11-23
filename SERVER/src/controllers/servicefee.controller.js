import ServiceFee from "../models/servicefee.model.js";

// 🟢 Tạo phí mới
export const createFee = async (req, res) => {
  try {
    const { name, percentage, description } = req.body;
    
    // Check trùng tên
    const existingFee = await ServiceFee.findOne({ name });
    if (existingFee) {
      return res.status(400).json({ message: "Tên phí này đã tồn tại!" });
    }

    const newFee = new ServiceFee({ name, percentage, description });
    await newFee.save();

    res.status(201).json({ success: true, data: newFee, message: "Tạo phí thành công" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 🔵 Lấy danh sách phí
export const getAllFees = async (req, res) => {
  try {
    const fees = await ServiceFee.find().sort({ createdAt: -1 });
    res.json({ success: true, data: fees });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 🟠 Cập nhật phí
export const updateFee = async (req, res) => {
  try {
    const { id } = req.params;
    const updatedFee = await ServiceFee.findByIdAndUpdate(
      id,
      { $set: req.body },
      { new: true }
    );

    if (!updatedFee) return res.status(404).json({ message: "Không tìm thấy phí" });

    res.json({ success: true, data: updatedFee, message: "Cập nhật thành công" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 🔴 Xóa phí
export const deleteFee = async (req, res) => {
  try {
    const { id } = req.params;
    await ServiceFee.findByIdAndDelete(id);
    res.json({ success: true, message: "Đã xóa phí dịch vụ" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};