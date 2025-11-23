import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { Suspense, useEffect } from 'react';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import routes from './routes';
import ProtectedRoute from './components/ProtectedAdminRoute';
import adminAuthService from './apis/adminAuthService';

// Component Loading xoay tròn (Spinner)
const LoadingFallback = () => (
  <div className="loading-screen" style={{ 
    display: 'flex', 
    justifyContent: 'center', 
    alignItems: 'center', 
    height: '100vh',
    backgroundColor: '#f8f9fa' 
  }}>
    <div className="spinner" style={{
      width: '40px',
      height: '40px',
      border: '4px solid #e5e7eb',
      borderTop: '4px solid #2563eb',
      borderRadius: '50%',
      animation: 'spin 1s linear infinite'
    }}></div>
    <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
  </div>
);

function App() {
  useEffect(() => {
    // console.log('🚀 App initialized');
    
    // Kiểm tra an toàn trước khi gọi service
    if (adminAuthService && typeof adminAuthService.isAuthenticated === 'function') {
      if (adminAuthService.isAuthenticated()) {
        // console.log('✅ User authenticated, starting refresh timer');
        if (typeof adminAuthService.initAutoRefresh === 'function') {
           adminAuthService.initAutoRefresh();
        }
      }
    }
  }, []);

  return (
    <BrowserRouter>
      {/* Suspense bọc ngoài để xử lý lazy loading cho toàn bộ routes */}
      <Suspense fallback={<LoadingFallback />}>
        <Routes>
          {routes.map((item, index) => {
            const PageComponent = item.component;

            // Bỏ qua nếu route không có component hợp lệ
            if (!PageComponent) return null;

            // Xử lý Route Admin (Protected)
            // Logic: Đường dẫn bắt đầu bằng /admin VÀ không phải là trang login
            if (item.path && item.path.startsWith('/admin') && item.path !== '/admin/login') {
              return (
                <Route
                  key={index}
                  path={item.path}
                  element={
                    <ProtectedRoute requiredRole="admin">
                      <PageComponent />
                    </ProtectedRoute>
                  }
                />
              );
            }

            // Route thông thường (Public)
            return (
              <Route
                key={index}
                path={item.path}
                element={<PageComponent />}
              />
            );
          })}
        </Routes>
      </Suspense>
      
      <ToastContainer
        position='top-right'
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme='colored'
      />
    </BrowserRouter>
  );
}

export default App;