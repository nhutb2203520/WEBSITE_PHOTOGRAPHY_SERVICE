import React, { useState } from 'react';
import Header from '../../components/Header/Header';
import Footer from '../../components/Footer/Footer';
import Sidebar from '../../components/Sidebar/Sidebar';
import './MainLayout.css';

export default function MainLayout({ children }) {
  // Trạng thái Sidebar được quản lý tập trung tại đây
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  return (
    <div className="app-container">
      {/* Header luôn cố định ở trên */}
      <Header />

      {/* Sidebar nhận lệnh điều khiển từ Layout */}
      <Sidebar isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />

      {/* Phần nội dung thay đổi (children) sẽ được bọc và đẩy qua lại */}
      <main className={`main-content ${isSidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
        {children}
      </main>

      {/* Footer luôn ở cuối */}
      <Footer />
    </div>
  );
}