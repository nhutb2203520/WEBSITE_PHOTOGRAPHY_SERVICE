import React from 'react';
import './Activity.css';

// ✅ Import MainLayout
import MainLayout from '../../layouts/MainLayout/MainLayout';

// ❌ Đã xóa import Header, Footer, Sidebar lẻ tẻ

export default function Activity() {
  const steps = [
    {
      id: 1,
      title: 'Chọn gói dịch vụ',
      description: 'Khách hàng chọn gói dịch vụ phù hợp với nhu cầu.',
    },
    {
      id: 2,
      title: 'Đặt hàng ngay',
      description: 'Chọn dịch vụ và đặt lịch chụp phù hợp với thời gian mong muốn, nhập các thông tin, lấy tọa độ Google Maps',
    },
  
    {
      id: 3,
      title: 'Thanh toán cọc để tạo lịch trình',
      description: 'Khách hàng thanh toán cọc để giữ lịch chụp.',
    },
    {
      id: 4,
      title: 'Admin xác nhận cọc và chờ ngày chụp',
      description: 'Sau khi nhận sản phẩm, khách hàng thanh toán phần còn lại.',
    },
    {
      id: 5,
      title: 'Nhắn tin với nhiếp ảnh gia',
      description: 'Khách hàng có thể nhắn tin trao đổi chi tiết về gói chụp.',
    },
    {
      id: 6,
      title: 'Hủy dịch vụ',
      description: 'Nếu chưa xác nhận, khách hàng có thể hủy ngay không mất cọc. Nếu đơn đã xác nhận, hủy sẽ mất cọc',
    },
    {
      id: 7,
      title: 'Sau khi chụp ảnh thanh toán phần còn lại',
      description: 'Sau buổi chụp khách hàng thanh toán 70% tiền còn lại trên hệ thống',
    },
    {
      id: 8,
      title: 'Nhận ảnh gốc, sau đó chọn ảnh và nhiếp ảnh gia sẽ xử lý và giao ảnh chỉnh',
      description: 'Có thể trao đổi với nhiếp ành gia bằng tin nhắn',
    },
    {
      id: 9,
      title: 'Nhận ảnh xong, xác nhận và đánh giá hoặc khiếu nại',
      description: 'Nếu ảnh ưng ý có thể xác nhận và đánh giá, nếu ảnh không ưng ý có thể trao đổi thêm với nhiếp ảnh gia. Không thỏa thuận được thì sẽ khiếu nại',
    },
    {
      id: 10,
      title: 'Khiếu nại đơn hàng, mô tả và tải ảnh minh chứng lên',
      description: 'Nếu khiếu nại không hợp lệ, admin hủy khiếu nại. Nếu hợp lệ admin tạo nhóm chat để thảo luận đưa ra hướng giải quyết',
    },
    {
      id: 11,
      title: 'Thỏa thuận thành công',
      description: 'Thảo thuận thành công, admin sẽ giải quyết khiếu nại và thanh toán tiền theo thỏa thuận',
    },
  ];

  return (
    // ✅ Bọc toàn bộ nội dung trong MainLayout
    <MainLayout>
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
    </MainLayout>
  );
}