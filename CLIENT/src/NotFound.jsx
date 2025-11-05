import React from "react";
import { Link } from "react-router-dom";
import { AlertTriangle } from "lucide-react";

export default function NotFound() {
  return (
    <div className="relative flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-white text-center px-6 overflow-hidden">
      {/* Hiệu ứng nền nhẹ nhàng */}
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute top-20 left-20 w-72 h-72 bg-purple-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse-slow"></div>
        <div className="absolute bottom-20 right-20 w-72 h-72 bg-pink-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse-slow"></div>
      </div>

      {/* Icon */}
      <div className="mb-5">
        <AlertTriangle className="w-20 h-20 text-purple-600 drop-shadow-sm" />
      </div>

      {/* Mã lỗi */}
      <h1 className="text-7xl font-extrabold text-gray-800 mb-2 tracking-tight">
        404
      </h1>

      {/* Tiêu đề */}
      <h2 className="text-2xl font-semibold text-gray-700 mb-4">
        Oops! Trang không tồn tại
      </h2>

      {/* Mô tả */}
      <p className="text-gray-500 max-w-lg mb-8 leading-relaxed">
        Có vẻ như bạn đã truy cập vào một liên kết không hợp lệ hoặc trang này
        đã bị di chuyển. Hãy quay lại trang chủ để tiếp tục khám phá nhé!
      </p>

      {/* Nút quay lại */}
      <Link
        to="/"
        className="px-8 py-3 bg-gradient-to-r from-purple-600 to-pink-500 text-white font-medium rounded-xl shadow-md hover:shadow-lg hover:scale-105 transition-all duration-200 ease-out"
      >
        ← Quay về Trang chủ
      </Link>

      {/* Footer nhỏ */}
      <p className="text-sm text-gray-400 mt-10">
        © {new Date().getFullYear()} Photography Service. All rights reserved.
      </p>

      {/* CSS Custom cho animation nhẹ */}
      <style>{`
        @keyframes pulse-slow {
          0%, 100% { opacity: 0.2; transform: scale(1); }
          50% { opacity: 0.3; transform: scale(1.05); }
        }
        .animate-pulse-slow {
          animation: pulse-slow 6s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
