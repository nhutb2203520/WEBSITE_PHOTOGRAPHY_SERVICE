import { Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";

export default function ProtectedRoute({ children, requiredRole = "admin" }) {
  const [shouldRedirect, setShouldRedirect] = useState(null);

  const refreshToken = sessionStorage.getItem("adminRefreshToken");

  useEffect(() => {
    // 1. Không có refresh token → bắt đăng nhập
    if (!refreshToken) {
      toast.warning("Vui lòng đăng nhập để tiếp tục");
      setShouldRedirect("/admin/login");
      return;
    }

    try {
      const payload = JSON.parse(atob(refreshToken.split(".")[1]));
      const isExpired = Date.now() >= payload.exp * 1000;

      // 2. Refresh token hết hạn
      if (isExpired) {
        sessionStorage.clear();
        toast.error("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.");
        setShouldRedirect("/admin/login");
        return;
      }

      // 3. Không đúng quyền
      if (requiredRole && payload.role !== requiredRole) {
        toast.error("Bạn không có quyền truy cập trang này");
        setShouldRedirect("/");
        return;
      }

      // (Option) log kiểm tra
      console.log("Admin token payload:", payload);

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

  // 5. Truy cập hợp lệ
  return children;
}
