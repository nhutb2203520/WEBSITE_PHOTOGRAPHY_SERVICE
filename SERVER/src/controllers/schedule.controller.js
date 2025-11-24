import Schedule from "../models/schedule.model.js";

// ✅ Import các Model liên quan để Mongoose đăng ký Schema
// (Dù không dùng biến Order trực tiếp, việc import này giúp tránh lỗi MissingSchemaError)
import "../models/order.model.js"; 
import "../models/servicePackage.model.js"; 
import "../models/khachhang.model.js";

// [GET] Lấy lịch trình
export const getMySchedule = async (req, res) => {
  try {
    const photographerId = req.user.id || req.user._id;
    
    const schedules = await Schedule.find({ photographerId })
      .populate({
          path: "orderId",
          // ref trong ScheduleModel là "Orders", nên nó sẽ tìm đúng model Orders
          select: "order_id final_amount status location customer_id booking_date service_package_id",
          populate: [
            // Lưu ý: path này phải khớp với field trong Order Model
            // Trong order.model.js bạn gửi: customer_id ref "bangKhachHang", service_package_id ref "ServicePackage"
            { path: "customer_id", select: "HoTen SDT" }, 
            { path: "service_package_id", select: "TenGoi" }
          ]
      })
      .sort({ date: 1 });
    
    res.status(200).json({ success: true, data: schedules });
  } catch (error) {
    console.error("Get Schedule Error:", error);
    res.status(500).json({ message: error.message });
  }
};

// [POST] Thêm lịch cá nhân
export const addPersonalSchedule = async (req, res) => {
  try {
    const photographerId = req.user.id || req.user._id;
    const { title, date, description, type, isRemind } = req.body;

    const newEvent = new Schedule({
      photographerId,
      title,
      date: new Date(date),
      description,
      type: type || "personal",
      isRemind: isRemind || false
    });

    await newEvent.save();
    res.status(201).json({ success: true, message: "Thêm lịch thành công!", data: newEvent });
  } catch (error) {
    console.error("Add Schedule Error:", error);
    res.status(500).json({ message: error.message });
  }
};

// [DELETE] Xóa lịch
export const deleteSchedule = async (req, res) => {
  try {
    const { id } = req.params;
    const event = await Schedule.findById(id);

    if (!event) return res.status(404).json({ message: "Không tìm thấy" });
    
    if (event.type === 'order') {
        return res.status(400).json({ message: "Đây là lịch đơn hàng, vui lòng hủy đơn để xóa." });
    }

    await Schedule.findByIdAndDelete(id);
    res.status(200).json({ success: true, message: "Đã xóa lịch trình" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};