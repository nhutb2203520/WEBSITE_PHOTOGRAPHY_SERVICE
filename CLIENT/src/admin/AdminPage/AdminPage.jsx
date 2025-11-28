import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom"; 
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

// ✅ IMPORT API
import adminUserService from "../../apis/adminUserService";
import adminOrderService from "../../apis/adminOrderService";
import adminComplaintService from "../../apis/adminComplaintService";

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
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  // State lưu dữ liệu thống kê
  const [stats, setStats] = useState({
    customers: 0,
    photographers: 0,
    complaints: 0,
    orders: 0,
    totalRevenue: 0, // ✅ Doanh thu
  });

  const [chartData, setChartData] = useState({
    bar: { labels: [], datasets: [] },
    line: { labels: [], datasets: [] },
  });

  const [recentActivities, setRecentActivities] = useState([]);

  // --- HELPER 1: Format tiền tệ ---
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount || 0);
  };

  // --- HELPER 2: Lấy tên người dùng (Logic chuẩn) ---
  const resolveName = (source, customersList = [], photographersList = []) => {
    if (!source) return "Khách vãng lai";

    // TH1: API trả về Object
    if (typeof source === 'object') {
        if (source.HoTen) return source.HoTen;
        if (source.username) return source.username;
        if (source.TenDangNhap) return source.TenDangNhap;
        return "Người dùng";
    }

    // TH2: API trả về ID string -> Tìm trong danh sách
    const foundUser = customersList.find(c => c._id === source) || 
                      photographersList.find(p => p._id === source);
    
    if (foundUser && foundUser.HoTen) return foundUser.HoTen;

    return "Người dùng ẩn";
  };

  // --- HELPER 3: Xử lý mảng an toàn (Lấy logic từ code của bạn) ---
  const getSafeArray = (data, keyName = 'data') => {
    if (!data) return [];
    if (Array.isArray(data)) return data;
    if (data.data && Array.isArray(data.data)) return data.data;
    // ✅ QUAN TRỌNG: Kiểm tra keyName truyền vào (ví dụ: 'orders')
    if (keyName && data[keyName] && Array.isArray(data[keyName])) return data[keyName];
    if (data.data && data.data.data && Array.isArray(data.data.data)) return data.data.data;
    return [];
  };

  // --- HELPER 4: Format thời gian ---
  const formatTimeAgo = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);

    if (diffInSeconds < 60) return "Vừa xong";
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} phút trước`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} giờ trước`;
    return `${Math.floor(diffInSeconds / 86400)} ngày trước`;
  };

  // --- HELPER 5: Badge trạng thái ---
  const getStatusBadge = (status, type = 'order') => {
    if (!status) return <span className="badge info">Mới</span>;
    const s = status.toLowerCase();
    
    if (type === 'complaint') {
        if (s === 'resolved') return <span className="badge success">Đã giải quyết</span>;
        if (s === 'rejected') return <span className="badge danger">Đã từ chối</span>;
        return <span className="badge warning">Chờ xử lý</span>;
    }

    if (s === "completed" || s === "confirmed") return <span className="badge success">Hoàn thành</span>;
    if (s === "pending" || s === "processing" || s === "waiting_final_payment") return <span className="badge warning">Đang xử lý</span>;
    if (s === "cancelled") return <span className="badge danger">Đã hủy</span>;
    
    return <span className="badge info">{status}</span>;
  };

  useEffect(() => {
    const token = sessionStorage.getItem("adminToken");
    if (!token) {
      navigate("/admin-login");
      return;
    }

    const fetchData = async () => {
      try {
        setLoading(true);

        const [usersRes, photosRes, ordersRes, complaintsRes] = await Promise.all([
          adminUserService.getCustomers(),
          adminUserService.getPhotographers(),
          adminOrderService.getAllOrders(),
          adminComplaintService.getAllComplaints(),
        ]);

        // ✅ TRÍCH XUẤT DỮ LIỆU ĐÚNG (Theo code tham khảo của bạn)
        const customers = getSafeArray(usersRes, 'customers');
        const photographers = getSafeArray(photosRes, 'photographers');
        const orders = getSafeArray(ordersRes, 'orders'); // 👈 Quan trọng: key là 'orders'
        const complaints = getSafeArray(complaintsRes, 'complaints');

        console.log("✅ Orders loaded:", orders.length); // Kiểm tra log xem đã > 0 chưa

        // ✅ TÍNH TOÁN DOANH THU (Giữ nguyên logic của tôi)
        const revenue = orders.reduce((acc, order) => {
             let amount = 0;
             // Chỉ cộng tiền nếu đã thanh toán
             if (order.payment_info?.deposit_status === 'paid') {
                 amount += (order.payment_info.deposit_amount || 0);
             }
             if (order.payment_info?.remaining_status === 'paid') {
                 amount += (order.payment_info.remaining_amount || 0);
             }
             return acc + amount;
        }, 0);

        setStats({
          customers: customers.length,
          photographers: photographers.length,
          complaints: complaints.length,
          orders: orders.length, // ✅ Số lượng sẽ hiển thị đúng
          totalRevenue: revenue,
        });

        // --- Cập nhật Biểu đồ ---
        setChartData({
            bar: {
                labels: ["Khách hàng", "Nhiếp ảnh", "Khiếu nại", "Đơn hàng"],
                datasets: [{
                    label: "Số lượng",
                    backgroundColor: ["#6c5ce7", "#0984e3", "#d63031", "#fdcb6e"],
                    borderRadius: 8,
                    data: [customers.length, photographers.length, complaints.length, orders.length],
                }]
            },
            line: {
                labels: ["T2", "T3", "T4", "T5", "T6", "T7", "CN"], 
                datasets: [{
                    label: "Doanh thu tuần (Demo)",
                    data: [0, 0, 0, 500000, 1000000, 2500000, 0], // Demo data
                    borderColor: "#6c5ce7",
                    backgroundColor: "rgba(108, 92, 231, 0.2)",
                    borderWidth: 3,
                    tension: 0.3,
                }]
            }
        });

        // --- XỬ LÝ HOẠT ĐỘNG ---
        const orderActivities = orders.map(o => {
            const sourceUser = o.customer_id || o.customer;
            
            // Lấy tên gói (nếu có populate)
            let serviceInfo = "Gói dịch vụ";
            if (o.service_package_id && o.service_package_id.TenGoi) {
                serviceInfo = o.service_package_id.TenGoi;
            }

            return {
                id: o._id,
                user: resolveName(sourceUser, customers, photographers), 
                // Hiển thị giá tiền đơn hàng
                action: `Đơn: ${formatCurrency(o.final_amount)}`, 
                detail: serviceInfo, 
                time: o.createdAt,
                status: o.status,
                type: "order"
            };
        });

        const complaintActivities = complaints.map(c => {
            const sourceUser = c.customer_id || c.userId;
            return {
                id: c._id,
                user: resolveName(sourceUser, customers, photographers),
                action: "Gửi khiếu nại",
                detail: c.reason || "Không có lý do",
                time: c.createdAt,
                status: c.status,
                type: "complaint"
            };
        });

        const combined = [...orderActivities, ...complaintActivities]
          .sort((a, b) => new Date(b.time) - new Date(a.time))
          .slice(0, 10);

        setRecentActivities(combined);

      } catch (error) {
        console.error("❌ Lỗi Dashboard:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [navigate]);

  if (loading) return <div className="admin-loading">Đang tải dữ liệu hệ thống...</div>;

  return (
    <div className="admin-layout">
      <SidebarAdmin />
      <main className="admin-main">
        <HeaderAdmin />

        <div className="welcome-box">
          <h2>👋 Xin chào, Admin!</h2>
          <p>Dữ liệu hệ thống được cập nhật theo thời gian thực.</p>
        </div>

        {/* STAT CARDS */}
        <div className="stats-grid">
          <div className="stat-card purple">
            <span className="material-icons stat-icon">groups</span>
            <div><h3>Khách hàng</h3><p>{stats.customers}</p></div>
          </div>

          <div className="stat-card blue">
            <span className="material-icons stat-icon">photo_camera</span>
            <div><h3>Nhiếp ảnh gia</h3><p>{stats.photographers}</p></div>
          </div>

          <div className="stat-card teal">
            <span className="material-icons stat-icon">receipt_long</span>
            {/* ✅ ĐÃ SỬA: Hiển thị đúng số lượng đơn hàng */}
            <div><h3>Đơn hàng</h3><p>{stats.orders}</p></div>
          </div>

          <div className="stat-card yellow">
            <span className="material-icons stat-icon">payments</span>
            <div>
                 <h3>Doanh thu thực thu</h3>
                 <p style={{fontSize: '18px', fontWeight: 'bold'}}>
                    {formatCurrency(stats.totalRevenue)}
                 </p>
            </div>
          </div>
        </div>

        {/* CHARTS */}
        <div className="chart-row">
          <div className="chart-box">
            <h3>Thống kê số lượng</h3>
            {chartData.bar.labels.length > 0 && <Bar data={chartData.bar} />}
          </div>
          <div className="chart-box">
            <h3>Xu hướng doanh thu (Demo)</h3>
            {chartData.line.labels.length > 0 && <Line data={chartData.line} />}
          </div>
        </div>

        {/* TABLE HOẠT ĐỘNG */}
        <div className="table-box">
          <h3>Giao dịch & Hoạt động gần đây</h3>
          <table>
            <thead>
              <tr>
                <th>Người dùng</th>
                <th>Thông tin</th>
                <th>Chi tiết</th>
                <th>Thời gian</th>
                <th>Trạng thái</th>
              </tr>
            </thead>
            <tbody>
              {recentActivities.length > 0 ? (
                recentActivities.map((item, index) => (
                  <tr key={`${item.type}-${index}`}>
                    <td><strong>{item.user}</strong></td>
                    
                    <td>
                        {item.type === 'order' ? 
                            <span style={{color: '#2ecc71', fontWeight: 'bold'}}>{item.action}</span> : 
                            <span style={{color: '#e74c3c'}}>Khiếu nại</span>
                        }
                    </td>

                    <td>
                        <small style={{color: '#666'}}>{item.detail}</small>
                    </td>

                    <td>{formatTimeAgo(item.time)}</td>
                    <td>{getStatusBadge(item.status, item.type)}</td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan="5" style={{textAlign: "center"}}>Chưa có dữ liệu</td></tr>
              )}
            </tbody>
          </table>
        </div>

        <link href="https://fonts.googleapis.com/icon?family=Material+Icons" rel="stylesheet"/>
      </main>
    </div>
  );
}