import React from 'react';
import './Activity.css';
import Header from '../../components/Header/Header';
import Footer from '../../components/Footer/Footer';
import Sidebar from '../Sidebar/Sidebar';

export default function Activity() {
  const steps = [
    {
      id: 1,
      title: 'Chọn gói dịch vụ',
      description: 'Khách hàng chọn gói dịch vụ phù hợp với nhu cầu.',
    },
    {
      id: 2,
      title: 'Chọn dịch vụ & đăng ký lịch chụp',
      description: 'Chọn dịch vụ và đặt lịch chụp phù hợp với thời gian mong muốn.',
    },
    {
      id: 3,
      title: 'Chờ nhiếp ảnh gia xác nhận',
      description: 'Nhiếp ảnh gia sẽ xác nhận lịch chụp trong thời gian sớm nhất.',
    },
    {
      id: 4,
      title: 'Cọc tiền trong vòng 12 giờ',
      description: 'Khách hàng thanh toán cọc để giữ lịch chụp.',
    },
    {
      id: 5,
      title: 'Nhận sản phẩm & thanh toán phần còn lại',
      description: 'Sau khi nhận sản phẩm, khách hàng thanh toán phần còn lại.',
    },
    {
      id: 6,
      title: 'Nhắn tin với nhiếp ảnh gia',
      description: 'Khách hàng có thể nhắn tin trao đổi chi tiết về gói chụp.',
    },
    {
      id: 7,
      title: 'Hủy dịch vụ',
      description: 'Nếu chưa xác nhận, khách hàng có thể hủy ngay; đã xác nhận phải chờ nhiếp ảnh gia duyệt hủy.',
    },
  ];

  return (
    <>
      <Header />
      <Sidebar />
      <div className="activity-page">
        <div className="container">
          <h2>Cách thức hoạt động</h2>
          <p className="activity-intro">
            Dưới đây là các bước để sử dụng dịch vụ trên trang web của chúng tôi.
          </p>

          <div className="activity-steps">
            {steps.map(step => (
              <div key={step.id} className="activity-step">
                <div className="step-number">{step.id}</div>
                <div className="step-content">
                  <h3>{step.title}</h3>
                  <p>{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}
