import PaymentMethod from "../models/paymentmethod.model.js";

const paymentMethodController = {
  // Lấy tất cả
  getAllPaymentMethods: async (req, res) => {
    try {
      const { isActive } = req.query;
      const query = {};
      if (isActive !== undefined) query.isActive = isActive === 'true';

      const methods = await PaymentMethod.find(query).sort({ createdAt: -1 });
      res.json(methods);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },

  // Lấy chi tiết
  getPaymentMethodById: async (req, res) => {
    try {
      const method = await PaymentMethod.findById(req.params.id);
      if (!method) return res.status(404).json({ message: "Không tìm thấy" });
      res.json(method);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },

  // ✅ TẠO MỚI (CHỈ JSON)
  createPaymentMethod: async (req, res) => {
    try {
      const { fullName, accountNumber, bank, branch, isActive } = req.body;

      if (!fullName || !accountNumber || !bank) {
        return res.status(400).json({ message: "Thiếu thông tin bắt buộc" });
      }

      // Lấy ID người tạo từ token (req.user đã được verifyTokenUser gán vào)
      const createdBy = req.user ? req.user.id : null;

      const newMethod = new PaymentMethod({
        fullName,
        accountNumber,
        bank,
        branch,
        isActive: isActive === true, // Đảm bảo là boolean
        createdBy
      });

      await newMethod.save();
      res.status(201).json(newMethod);

    } catch (error) {
      console.error("Create Error:", error);
      res.status(500).json({ message: error.message });
    }
  },

  // ✅ CẬP NHẬT (CHỈ JSON)
  updatePaymentMethod: async (req, res) => {
    try {
      const { id } = req.params;
      const { fullName, accountNumber, bank, branch, isActive } = req.body;

      const method = await PaymentMethod.findById(id);
      if (!method) return res.status(404).json({ message: "Không tìm thấy" });

      if (fullName) method.fullName = fullName;
      if (accountNumber) method.accountNumber = accountNumber;
      if (bank) method.bank = bank;
      if (branch !== undefined) method.branch = branch;
      if (isActive !== undefined) method.isActive = isActive;

      await method.save();
      res.json(method);

    } catch (error) {
      console.error("Update Error:", error);
      res.status(500).json({ message: error.message });
    }
  },

  // Xóa
  deletePaymentMethod: async (req, res) => {
    try {
      const method = await PaymentMethod.findByIdAndDelete(req.params.id);
      if (!method) return res.status(404).json({ message: "Không tìm thấy" });
      res.json({ message: "Đã xóa thành công" });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },

  // Toggle Active
  toggleActiveStatus: async (req, res) => {
    try {
      const method = await PaymentMethod.findById(req.params.id);
      if (!method) return res.status(404).json({ message: "Không tìm thấy" });
      
      method.isActive = !method.isActive;
      await method.save();
      res.json(method);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
};

export default paymentMethodController;