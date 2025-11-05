// src/models/counter.js
import mongoose from "mongoose";

const counterSchema = new mongoose.Schema(
  {
    _id: { type: String, required: true }, // Tên collection, ví dụ: 'khachhang'
    seq: { type: Number, default: 0 }, // Bộ đếm tự tăng
  },
  {
    collection: "COUNTER", // Tên collection trong MongoDB
  }
);

const Counter = mongoose.model("Counter", counterSchema);

export default Counter;
