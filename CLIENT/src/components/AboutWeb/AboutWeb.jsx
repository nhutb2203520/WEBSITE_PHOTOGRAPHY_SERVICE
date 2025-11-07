import React from 'react';
import Header from '../../components/Header/Header';
import Footer from '../../components/Footer/Footer';
import './AboutWeb.css';
import OWNER_IMG from '/src/assets/image/owner.jpg';
import PHOTO_IMG from '/src/assets/image/photographer.jpg';
import { Facebook, Instagram, Linkedin } from 'lucide-react';
import { CheckCircle } from 'lucide-react';
import Sidebar from '../Sidebar/Sidebar';
export default function AboutWeb() {
  return (
    <>
      <Header />
      <Sidebar />
      <div className="about-page">
        <div className="container">
          <h2>Về Website Chụp Ảnh</h2>

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
              <li>Chọn gói dịch vụ → chọn ngày giờ → đặt lịch.</li>
              <li>Nhiếp ảnh gia xem yêu cầu → xác nhận lịch.</li>
              <li>Thanh toán cọc trong 12h để giữ chỗ.</li>
              <li>Thực hiện buổi chụp → nhận sản phẩm.</li>
              <li>Thanh toán phần còn lại → hoàn tất đơn hàng.</li>
              <li>Đánh giá dịch vụ và nhắn tin phản hồi nếu cần.</li>
            </ol>
          </section>

          {/* Chủ sở hữu & Photographer */}
          <section className="team-section">
            <h3>Chủ sở hữu & Photographer chuyên nghiệp</h3>
            <div className="team-cards">

              {/* Chủ sở hữu */}
              <div className="team-card">
                <img src={OWNER_IMG} alt="Chủ sở hữu" className="team-img"/>
                <h4>Nguyễn Văn Quản</h4>
                <p className="role">Chủ sở hữu</p>
                <p className="description">
                  Người vận hành website, có nhiều năm kinh nghiệm trong quản lý studio và dịch vụ chụp ảnh chuyên nghiệp.
                </p>
                <div className="social-links">
                  <a href="https://www.facebook.com/owner" target="_blank" rel="noopener noreferrer"><Facebook size={20}/></a>
                  <a href="https://www.instagram.com/owner" target="_blank" rel="noopener noreferrer"><Instagram size={20}/></a>
                  <a href="https://www.linkedin.com/in/owner" target="_blank" rel="noopener noreferrer"><Linkedin size={20}/></a>
                </div>
              </div>

              {/* Photographer */}
              <div className="team-card">
                <img src={PHOTO_IMG} alt="Photographer" className="team-img"/>
                <h4>Trần Thị Bích</h4>
                <p className="role">Photographer chuyên nghiệp</p>
                <p className="description">
                  Sẵn sàng tư vấn khách hàng khi có khiếu nại hoặc yêu cầu đặc biệt về dịch vụ.
                </p>
                <div className="social-links">
                  <a href="https://www.facebook.com/photographer" target="_blank" rel="noopener noreferrer"><Facebook size={20}/></a>
                  <a href="https://www.instagram.com/photographer" target="_blank" rel="noopener noreferrer"><Instagram size={20}/></a>
                  <a href="https://www.linkedin.com/in/photographer" target="_blank" rel="noopener noreferrer"><Linkedin size={20}/></a>
                </div>
              </div>

            </div>
          </section>

          {/* Giá trị nổi bật */}
          <section className="about-section">
            <h3>Giá trị nổi bật</h3>
            <div className="values-grid">
              <div className="value-card"><CheckCircle size={24} color="#10b981"/> Tin cậy: Nhiếp ảnh gia kiểm duyệt</div>
              <div className="value-card"><CheckCircle size={24} color="#10b981"/> Tiện lợi: Đặt lịch online, thông báo tự động</div>
              <div className="value-card"><CheckCircle size={24} color="#10b981"/> Chất lượng: Hình ảnh xử lý chuyên nghiệp</div>
              <div className="value-card"><CheckCircle size={24} color="#10b981"/> Bảo mật: Dữ liệu khách hàng an toàn</div>
              <div className="value-card"><CheckCircle size={24} color="#10b981"/> Tư vấn chuyên nghiệp: Photographer luôn sẵn sàng hỗ trợ</div>
            </div>
          </section>

          {/* Thông tin pháp lý & liên hệ */}
          <section className="about-section">
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
      <Footer />
    </>
  );
}
