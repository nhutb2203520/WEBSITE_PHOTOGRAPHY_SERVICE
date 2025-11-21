import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { Suspense, useEffect } from 'react';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import routes from './routes';
import ProtectedRoute from './components/ProtectedAdminRoute';
import adminAuthService from './apis/adminAuthService';

function App() {
  // ✅ Khởi động auth service khi app mount
  useEffect(() => {
    console.log('🚀 App initialized - Starting auth service');
    
    // Khởi động auto-refresh nếu đã đăng nhập
    if (adminAuthService.isAuthenticated()) {
      console.log('✅ User already authenticated, starting auto-refresh');
      adminAuthService.initAutoRefresh();
    } else {
      console.log('ℹ️ User not authenticated');
    }

    // Cleanup khi app unmount
    return () => {
      console.log('🛑 App unmounting');
    };
  }, []);

  return (
    <BrowserRouter>
      <Suspense fallback={<div>Loading...</div>}>
        <Routes>
          {routes.map((item, index) => {
            const Component = item.component;
            
            // ✅ Bảo vệ các route admin (trừ login)
            if (item.path.startsWith('/admin') && item.path !== '/admin/login') {
              return (
                <Route
                  key={index}
                  path={item.path}
                  element={
                    <ProtectedRoute requiredRole="admin">
                      <Component />
                    </ProtectedRoute>
                  }
                />
              );
            }

            // Route thông thường
            return (
              <Route
                key={index}
                path={item.path}
                element={<Component />}
              />
            );
          })}
        </Routes>
      </Suspense>
      
      {/* Toast hiển thị */}
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