import "./AdminPage.css";
import SidebarAdmin from "./SideBarAdmin";
import HeaderAdmin from "./HeaderAdmin";
import { Bar, Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Tooltip,
  Legend
);

export default function AdminPage() {
  const barData = {
    labels: ["Khách hàng", "Nhiếp ảnh", "Khiếu nại", "Thanh toán"],
    datasets: [
      {
        label: "Số lượng",
        backgroundColor: ["#6c5ce7", "#0984e3", "#00cec9", "#fdcb6e"],
        borderRadius: 8,
        data: [120, 80, 14, 65],
      },
    ],
  };

  const lineData = {
    labels: ["T1", "T2", "T3", "T4", "T5", "T6"],
    datasets: [
      {
        label: "Hoạt động hệ thống",
        data: [30, 45, 55, 70, 65, 80],
        borderColor: "#6c5ce7",
        backgroundColor: "rgba(108, 92, 231, 0.2)",
        borderWidth: 3,
        tension: 0.3,
      },
    ],
  };

  return (
    <div className="admin-layout">
      <SidebarAdmin />

      <main className="admin-main">
        <HeaderAdmin />

        {/* WELCOME SECTION */}
        <div className="welcome-box">
          <h2>👋 Xin chào, Admin!</h2>
          <p>Chúc bạn một ngày làm việc hiệu quả. Đây là tổng quan hôm nay.</p>
        </div>

        {/* STAT CARDS */}
        <div className="stats-grid">
          <div className="stat-card purple">
            <span className="material-icons stat-icon">groups</span>
            <div>
              <h3>Khách hàng</h3>
              <p>120</p>
            </div>
          </div>

          <div className="stat-card blue">
            <span className="material-icons stat-icon">photo_camera</span>
            <div>
              <h3>Nhiếp ảnh gia</h3>
              <p>80</p>
            </div>
          </div>

          <div className="stat-card teal">
            <span className="material-icons stat-icon">report</span>
            <div>
              <h3>Khiếu nại</h3>
              <p>14</p>
            </div>
          </div>

          <div className="stat-card yellow">
            <span className="material-icons stat-icon">payments</span>
            <div>
              <h3>Thanh toán</h3>
              <p>65</p>
            </div>
          </div>
        </div>

        {/* CHARTS ROW */}
        <div className="chart-row">
          <div className="chart-box">
            <h3>Biểu đồ thống kê</h3>
            <Bar data={barData} />
          </div>

          <div className="chart-box">
            <h3>Hoạt động hệ thống</h3>
            <Line data={lineData} />
          </div>
        </div>

        {/* RECENT TABLE */}
        <div className="table-box">
          <h3>Hoạt động gần đây</h3>
          <table>
            <thead>
              <tr>
                <th>Người dùng</th>
                <th>Hành động</th>
                <th>Thời gian</th>
                <th>Trạng thái</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Nguyễn Minh</td>
                <td>Tạo yêu cầu chụp ảnh</td>
                <td>2 giờ trước</td>
                <td><span className="badge success">Hoàn thành</span></td>
              </tr>
              <tr>
                <td>Trần Duy</td>
                <td>Báo cáo nhiếp ảnh</td>
                <td>5 giờ trước</td>
                <td><span className="badge warning">Đang xử lý</span></td>
              </tr>
              <tr>
                <td>Admin</td>
                <td>Cập nhật gói dịch vụ</td>
                <td>1 ngày trước</td>
                <td><span className="badge info">Đã lưu</span></td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* SYSTEM OVERVIEW */}
        <div className="system-box">
          <h3>Tổng quan hệ thống</h3>
          <p>
            Hệ thống vận hành ổn định. Hiện tại có hơn <strong>265</strong> thao tác được xử lý mỗi ngày.
          </p>
        </div>

        <link
          href="https://fonts.googleapis.com/icon?family=Material+Icons"
          rel="stylesheet"
        />
      </main>
    </div>
  );
}
