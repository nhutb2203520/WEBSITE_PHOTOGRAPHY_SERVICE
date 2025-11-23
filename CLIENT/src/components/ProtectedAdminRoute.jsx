import { Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";

export default function ProtectedRoute({ children, requiredRole = "admin" }) {
  const [shouldRedirect, setShouldRedirect] = useState(null);

  // Lấy refresh token từ session (nơi lưu trữ phiên đăng nhập dài hạn hơn access token)
  const refreshToken = sessionStorage.getItem("adminRefreshToken");

  useEffect(() => {
    // 1. Không có refresh token → chưa đăng nhập
    if (!refreshToken) {
      // Chỉ hiện toast nếu chưa redirect để tránh spam
      if (!shouldRedirect) toast.warning("Vui lòng đăng nhập để tiếp tục");
      setShouldRedirect("/admin/login");
      return;
    }

    try {
      // Giải mã token (Lấy phần payload ở giữa)
      const payload = JSON.parse(atob(refreshToken.split(".")[1]));
      const isExpired = Date.now() >= payload.exp * 1000;

      // 2. Refresh token hết hạn -> Bắt buộc đăng nhập lại
      if (isExpired) {
        sessionStorage.clear();
        toast.error("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.");
        setShouldRedirect("/admin/login");
        return;
      }

      // 3. Kiểm tra quyền (Role)
      // Lưu ý: Đảm bảo token của bạn có trường "role"
      if (requiredRole && payload.role !== requiredRole) {
        toast.error("Bạn không có quyền truy cập trang này");
        setShouldRedirect("/"); // Đá về trang chủ hoặc trang 403
        return;
      }

      // (Option) Log kiểm tra - Dùng dấu phẩy để tránh lỗi crash object
      console.log("🔐 Admin token payload:", payload);

    } catch (error) {
      console.error("Token error:", error);
      sessionStorage.clear();
      toast.error("Token không hợp lệ. Vui lòng đăng nhập lại.");
      setShouldRedirect("/admin/login");
    }
  }, [refreshToken, requiredRole]);

  // 4. Thực hiện redirect nếu cần
  if (shouldRedirect) {
    return <Navigate to={shouldRedirect} replace />;
  }

  // 5. Nếu token hợp lệ và đủ quyền -> Render trang con (children)
  // Nếu chưa có quyết định redirect (đang check), có thể return null hoặc loading spinner
  return children;
}