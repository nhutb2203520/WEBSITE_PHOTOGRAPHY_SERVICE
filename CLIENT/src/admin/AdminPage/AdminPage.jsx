import "./AdminPage.css";
import SidebarAdmin from "./SideBarAdmin";
import HeaderAdmin from "./HeaderAdmin";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

export default function AdminPage() {
  const chartData = {
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

  return (
    <div className="admin-layout">
      <SidebarAdmin />

      <main className="admin-main">
        <HeaderAdmin />

        {/* STAT CARDS */}
        <div className="stats-grid">
          <div className="stat-card purple">
            <h3>Khách hàng</h3>
            <p>120</p>
          </div>

          <div className="stat-card blue">
            <h3>Nhiếp ảnh gia</h3>
            <p>80</p>
          </div>

          <div className="stat-card teal">
            <h3>Khiếu nại</h3>
            <p>14</p>
          </div>

          <div className="stat-card yellow">
            <h3>Thanh toán</h3>
            <p>65</p>
          </div>
        </div>

        {/* CHART */}
        <div className="chart-box">
          <Bar data={chartData} />
        </div>
      </main>
    </div>
  );
}
