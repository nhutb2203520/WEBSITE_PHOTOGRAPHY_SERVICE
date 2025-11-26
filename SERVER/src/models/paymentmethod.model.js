import mongoose from 'mongoose';

const paymentMethodSchema = new mongoose.Schema({
  fullName: {
    type: String,
    required: [true, 'Vui lòng nhập tên chủ tài khoản'],
    trim: true
  },
  accountNumber: {
    type: String,
    required: [true, 'Vui lòng nhập số tài khoản'],
    trim: true
  },
  bank: {
    type: String,
    required: [true, 'Vui lòng nhập tên ngân hàng'],
    trim: true
  },
  branch: {
    type: String,
    trim: true,
    default: ''
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

// Index để tìm kiếm nhanh
paymentMethodSchema.index({ bank: 1, accountNumber: 1 });
paymentMethodSchema.index({ isActive: 1 });

// Method để format số tài khoản (ẩn một phần)
paymentMethodSchema.methods.getMaskedAccountNumber = function() {
  const accNum = this.accountNumber;
  if (accNum.length <= 4) return accNum;
  return accNum.slice(0, 4) + '*'.repeat(accNum.length - 8) + accNum.slice(-4);
};

const PaymentMethod = mongoose.model('PaymentMethod', paymentMethodSchema);

export default PaymentMethod;