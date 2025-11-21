import { Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import { toast } from 'react-toastify';

export default function ProtectedRoute({ children, requiredRole = 'admin' }) {
  // ✅ Đọc từ sessionStorage (đóng tab = mất token)
  const refreshToken = sessionStorage.getItem('adminRefreshToken');
  const adminInfo = JSON.parse(sessionStorage.getItem('adminInfo') || '{}');

  // 1. Kiểm tra refresh token có tồn tại không
  if (!refreshToken) {
    console.warn('⚠️ No refresh token found, redirecting to login');
    
    // ✅ FIX: Dùng useEffect để tránh setState trong render
    useEffect(() => {
      toast.warning('Vui lòng đăng nhập để tiếp tục');
    }, []);
    
    return <Navigate to="/admin/login" replace />;
  }

  // 2. Kiểm tra refresh token có hợp lệ và còn hạn không
  try {
    const payload = JSON.parse(atob(refreshToken.split('.')[1]));
    const isExpired = Date.now() >= payload.exp * 1000;
    
    if (isExpired) {
      console.warn('⚠️ Refresh token expired, redirecting to login');
      
      // Xóa tất cả tokens
      sessionStorage.clear();
      
      // ✅ FIX: Dùng useEffect để tránh setState trong render
      useEffect(() => {
        toast.error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
      }, []);
      
      return <Navigate to="/admin/login" replace />;
    }

    // 3. Kiểm tra role nếu cần
    if (requiredRole && payload.role !== requiredRole) {
      console.warn(`⚠️ Access denied. Required role: ${requiredRole}, User role: ${payload.role}`);
      
      // ✅ FIX: Dùng useEffect để tránh setState trong render
      useEffect(() => {
        toast.error('Bạn không có quyền truy cập trang này');
      }, []);
      
      return <Navigate to="/" replace />;
    }

    console.log('✅ Access granted:', {
      userId: payload.id,
      role: payload.role,
      refreshTokenExpiresAt: new Date(payload.exp * 1000).toLocaleString()
    });

  } catch (error) {
    console.error('❌ Invalid token format:', error);
    
    sessionStorage.clear();
    
    // ✅ FIX: Dùng useEffect để tránh setState trong render
    useEffect(() => {
      toast.error('Token không hợp lệ. Vui lòng đăng nhập lại.');
    }, []);
    
    return <Navigate to="/admin/login" replace />;
  }

  // 4. Token hợp lệ → cho phép truy cập
  return children;
}