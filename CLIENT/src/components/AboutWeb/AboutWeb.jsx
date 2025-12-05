import React from 'react';
import { Facebook, Instagram, Linkedin, CheckCircle } from 'lucide-react';

// ✅ Import MainLayout
import MainLayout from '../../layouts/MainLayout/MainLayout';

import './AboutWeb.css';

// Import hình ảnh (Đảm bảo đường dẫn đúng)
import OWNER_IMG from '../../assets/image/MinhNhut.jpg';
import PHOTO_IMG from '../../assets/image/YenTrung.jpg';

export default function AboutWeb() {
  return (
    // ✅ Bọc toàn bộ trong MainLayout
    <MainLayout>
      <div className="about-page">
        <div className="container">
          
          <div className="about-header">
            <h2>Về Website Chụp Ảnh</h2>
            <p className="subtitle">Nền tảng kết nối đam mê và khoảnh khắc</p>
          </div>

          {/* Thông tin chung */}
          <section className="about-section">
            <h3>Thông tin chung</h3>
            <p>
              Đây là nền tảng dịch vụ chụp ảnh trực tuyến chuyên nghiệp, nơi khách hàng có thể chọn gói dịch vụ 
              phù hợp, đặt lịch chụp, và kết nối trực tiếp với nhiếp ảnh gia. Hệ thống hỗ trợ thông báo tự động, 
              thanh toán linh hoạt, và giao diện thân thiện trên cả desktop, tablet và mobile.
            </p>
          </section>

          {/* Quy trình dịch vụ */}
          <section className="about-section">
            <h3>Quy trình dịch vụ</h3>
            <ol>
              <li>Chọn gói dịch vụ → chọn ngày giờ → Vị trí → Đặt lịch → Thanh toán cọc (30%) </li>
              <li>Admin xác nhận thanh toán cọc</li>
              <li>Khách hàng, nhiếp ảnh gia có thể trao đổi bằng tin nhắn</li>
              <li>Thực hiện buổi chụp → Thanh toán phần còn lại (70%).</li>
              <li>Nhiếp ảnh gia giao ảnh chỉnh → Khách hàng kiểm tra</li>
              <li>Ưng ý → Xác nhận hoàn thành và đánh giá</li>
              <li>Không ưng ý có thể trao đổi lại nhiếp ảnh gia</li>
              <li>2 bên thỏa thuận không thành công → Khiếu nại</li>
              <li>Admin xem xét khiếu nại → Thảo luận lại và đưa ra hướng giải quyết</li>
              <li>Admin xác nhận giải quyết khiếu nại → Hoàn thành đơn hàng</li>
            </ol>
          </section>

          {/* Chủ sở hữu & Photographer */}
          <section className="team-section">
            <h3>Chủ sở hữu & Photographer chuyên nghiệp</h3>
            <div className="team-cards">

              {/* Chủ sở hữu */}
              <div className="team-card">
                {/* ✅ Thêm wrapper để giới hạn kích thước ảnh */}
                <div className="team-img-wrapper">
                    <img 
                        src={OWNER_IMG} 
                        alt="Chủ sở hữu" 
                        className="team-img"
                        onError={(e) => e.target.src = 'https://via.placeholder.com/150'} 
                    />
                </div>
                <h4>MINH NHỰT</h4>
                <p className="role">Chủ sở hữu</p>
                <p className="description">
                  Người vận hành website, có nhiều năm kinh nghiệm trong quản lý studio và dịch vụ chụp ảnh chuyên nghiệp.
                </p>
                <div className="social-links">
                  <a href="https://www.facebook.com/minh.nhut.428229/" target="_blank" rel="noreferrer"><Facebook size={20}/></a>
                  <a href="https://www.facebook.com/minh.nhut.428229/" target="_blank" rel="noreferrer"><Instagram size={20}/></a>
                  <a href="https://www.facebook.com/minh.nhut.428229/" target="_blank" rel="noreferrer"><Linkedin size={20}/></a>
                </div>
              </div>

              {/* Photographer */}
              <div className="team-card">
                {/* ✅ Thêm wrapper để giới hạn kích thước ảnh */}
                <div className="team-img-wrapper">
                    <img 
                        src={PHOTO_IMG} 
                        alt="Photographer" 
                        className="team-img"
                        onError={(e) => e.target.src = 'https://via.placeholder.com/150'} 
                    />
                </div>
                <h4>HUỲNH YÊN TRUNG</h4>
                <p className="role">Photographer chuyên nghiệp</p>
                <p className="description">
                  Sẵn sàng tư vấn khách hàng khi có khiếu nại hoặc yêu cầu đặc biệt về dịch vụ.
                </p>
                <div className="social-links">
                  <a href="https://www.facebook.com/trunghuynh0209" target="_blank" rel="noreferrer"><Facebook size={20}/></a>
                  <a href="https://www.facebook.com/trunghuynh0209" target="_blank" rel="noreferrer"><Instagram size={20}/></a>
                  <a href="https://www.facebook.com/trunghuynh0209" target="_blank" rel="noreferrer"><Linkedin size={20}/></a>
                </div>
              </div>

            </div>
          </section>

          {/* Giá trị nổi bật */}
          <section className="about-section">
            <h3>Giá trị nổi bật</h3>
            <div className="values-grid">
              <div className="value-card"><CheckCircle size={24} color="#10b981"/> <span>Tin cậy: Nhiếp ảnh gia kiểm duyệt</span></div>
              <div className="value-card"><CheckCircle size={24} color="#3b82f6"/> <span>Tiện lợi: Đặt lịch online, thông báo tự động</span></div>
              <div className="value-card"><CheckCircle size={24} color="#f59e0b"/> <span>Chất lượng: Hình ảnh xử lý chuyên nghiệp</span></div>
              <div className="value-card"><CheckCircle size={24} color="#ef4444"/> <span>Bảo mật: Dữ liệu khách hàng an toàn</span></div>
              <div className="value-card"><CheckCircle size={24} color="#8b5cf6"/> <span>Tư vấn chuyên nghiệp: Hỗ trợ tận tâm</span></div>
            </div>
          </section>

          {/* Thông tin pháp lý & liên hệ */}
          <section className="about-section contact-info">
            <h3>Thông tin pháp lý & liên hệ</h3>
            <ul>
              <li>Điều khoản sử dụng và chính sách bảo mật đảm bảo quyền lợi khách hàng.</li>
              <li>Xử lý khiếu nại minh bạch, nhanh chóng.</li>
              <li>Liên hệ qua email: <a href="mailto:Nhutnhut716@gmail.com">Nhutnhut716@gmail.com</a></li>
              <li>Hotline: <strong>+84 776 560 730</strong></li>
            </ul>
          </section>

        </div>
      </div>
    </MainLayout>
  );
}