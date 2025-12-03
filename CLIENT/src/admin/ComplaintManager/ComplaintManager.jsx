import React, { useState, useEffect } from 'react';
import { 
  Search, Filter, Eye, CheckCircle, XCircle, 
  AlertTriangle, MessageSquare 
} from 'lucide-react';
import { toast } from 'react-toastify';
import adminComplaintService from '../../apis/adminComplaintService';

// 👇 IMPORT LAYOUT COMPONENTS
import SidebarAdmin from "../AdminPage/SidebarAdmin";
import HeaderAdmin from "../AdminPage/HeaderAdmin";
import './ComplaintManager.css'; 

const ComplaintManager = () => {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // 1. Thêm State tìm kiếm
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  
  // Modal State
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [adminResponse, setAdminResponse] = useState('');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchComplaints();
  }, []);

  const fetchComplaints = async () => {
    try {
      setLoading(true);
      const res = await adminComplaintService.getAllComplaints();
      if (res && res.data) {
        console.log("Dữ liệu khiếu nại:", res.data);
        setComplaints(res.data); 
      } else {
          setComplaints([]);
      }
    } catch (error) {
      console.error("Fetch Error:", error);
      toast.error("Lỗi tải danh sách khiếu nại");
    } finally {
      setLoading(false);
    }
  };

  // 2. Logic lọc: Kết hợp Status + Search
  const filteredList = complaints.filter(item => {
    // Lọc theo trạng thái
    const matchStatus = filterStatus === 'all' ? true : item.status === filterStatus;

    // Lọc theo từ khóa (Mã đơn, Tên, Email)
    const term = searchTerm.toLowerCase();
    const matchSearch = 
        (item.order_id?.order_id || '').toLowerCase().includes(term) ||
        (item.customer_id?.HoTen || '').toLowerCase().includes(term) ||
        (item.customer_id?.Email || '').toLowerCase().includes(term);

    return matchStatus && matchSearch;
  });

  // Handlers
  const openDetail = (item) => {
    setSelectedComplaint(item);
    setAdminResponse(item.admin_response || ''); 
    setShowModal(true);
  };

  const handleProcess = async (status) => {
    if (!adminResponse.trim()) {
      toast.warning("Vui lòng nhập phản hồi cho khách hàng!");
      return;
    }
    
    try {
      setProcessing(true);
      await adminComplaintService.processComplaint(selectedComplaint._id, status, adminResponse);
      toast.success(status === 'resolved' ? "Đã chấp thuận khiếu nại" : "Đã từ chối khiếu nại");
      setShowModal(false);
      fetchComplaints(); 
    } catch (error) {
      toast.error("Lỗi khi xử lý");
    } finally {
      setProcessing(false);
    }
  };

  const getStatusBadge = (status) => {
    switch(status) {
      case 'pending': return <span className="badge badge-pending">Chờ xử lý</span>;
      case 'resolved': return <span className="badge badge-resolved">Thành công (Khách thắng)</span>;
      case 'rejected': return <span className="badge badge-rejected">Đã từ chối (Admin đóng)</span>;
      default: return <span>{status}</span>;
    }
  };

  const formatPrice = (price) => Number(price || 0).toLocaleString('vi-VN') + ' đ';
  
  const getImgUrl = (path) => {
      if (!path) return '';
      if (path.startsWith('http')) return path;
      return `http://localhost:5000${path}`;
  };

  return (
    <div className="admin-layout">
      <SidebarAdmin />
      
      <main className="admin-main">
        <HeaderAdmin />
        
        <div className="admin-content-container">
            
          <div className="page-header-flex">
            <h2>Quản lý Khiếu nại</h2>
            
            {/* 👇 KHU VỰC ACTION: TÌM KIẾM & LỌC */}
            <div className="header-actions">
                {/* Ô tìm kiếm */}
                <div className="search-box">
                    <Search size={18} className="search-icon" />
                    <input 
                        type="text" 
                        placeholder="Tìm mã đơn, tên khách..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    {searchTerm && (
                        <button className="clear-search" onClick={() => setSearchTerm('')}>
                            <XCircle size={16} />
                        </button>
                    )}
                </div>

                {/* Bộ lọc trạng thái */}
                <div className="filter-group">
                    <Filter size={18} className="text-gray-500" />
                    <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
                        <option value="all">Tất cả trạng thái</option>
                        <option value="pending">Chờ xử lý</option>
                        <option value="resolved">Đã chấp thuận</option>
                        <option value="rejected">Đã từ chối</option>
                    </select>
                </div>
            </div>
          </div>

          <div className="admin-table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Mã đơn</th>
                  <th>Khách hàng</th>
                  <th>Lý do khiếu nại</th>
                  <th>Ngày tạo</th>
                  <th>Trạng thái</th>
                  <th>Hành động</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan="6" className="text-center">Đang tải...</td></tr>
                ) : filteredList.length > 0 ? (
                  filteredList.map(item => (
                    <tr key={item._id}>
                      {/* Highlight mã đơn nếu khớp tìm kiếm */}
                      <td><strong>#{item.order_id?.order_id || 'N/A'}</strong></td>
                      <td>
                        <div className="user-cell">
                          <img 
                            src={getImgUrl(item.customer_id?.Avatar) || 'https://via.placeholder.com/30'} 
                            alt="" 
                            className="avatar-sm"
                            onError={(e) => e.target.src = 'https://via.placeholder.com/30'}
                          />
                          <div style={{display:'flex', flexDirection:'column'}}>
                            <span style={{fontWeight:500}}>{item.customer_id?.HoTen || 'Unknown'}</span>
                            <span style={{fontSize:12, color:'#666'}}>{item.customer_id?.Email}</span>
                          </div>
                        </div>
                      </td>
                      <td className="truncate-text" title={item.reason}>{item.reason}</td>
                      <td>{new Date(item.createdAt).toLocaleDateString('vi-VN')}</td>
                      <td>{getStatusBadge(item.status)}</td>
                      <td>
                        <button className="btn-icon" onClick={() => openDetail(item)} title="Xem chi tiết">
                          <Eye size={18} />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr><td colSpan="6" className="text-center">
                      {searchTerm ? 'Không tìm thấy kết quả phù hợp' : 'Không có dữ liệu'}
                  </td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* --- MODAL (GIỮ NGUYÊN CODE CŨ CỦA BẠN) --- */}
      {showModal && selectedComplaint && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content complaint-modal-lg" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Chi tiết khiếu nại - Đơn #{selectedComplaint.order_id?.order_id}</h3>
              <button className="close-btn" onClick={() => setShowModal(false)}>×</button>
            </div>
            
            <div className="modal-body-split">
              <div className="split-left">
                <div className="info-card">
                  <h4><AlertTriangle size={16}/> Nội dung khiếu nại</h4>
                  <p className="complaint-reason-text">"{selectedComplaint.reason}"</p>
                  <div className="complaint-images-grid">
                    {selectedComplaint.images?.map((img, idx) => (
                      <img 
                        key={idx} 
                        src={getImgUrl(img)} 
                        alt="Proof" 
                        onClick={() => window.open(getImgUrl(img))} 
                        onError={(e) => e.target.style.display = 'none'}
                      />
                    ))}
                  </div>
                </div>

                <div className="info-card">
                  <h4><MessageSquare size={16}/> Phản hồi của Admin</h4>
                  {selectedComplaint.status === 'pending' ? (
                    <div className="admin-action-form">
                      <textarea 
                        rows="4" 
                        placeholder="Nhập lý do chấp thuận hoặc từ chối..." 
                        value={adminResponse}
                        onChange={(e) => setAdminResponse(e.target.value)}
                      ></textarea>
                      <div className="action-buttons">
                        <button 
                          className="btn-reject" 
                          onClick={() => handleProcess('rejected')}
                          disabled={processing}
                        >
                          <XCircle size={16}/> Từ chối
                        </button>
                        <button 
                          className="btn-resolve" 
                          onClick={() => handleProcess('resolved')}
                          disabled={processing}
                        >
                          <CheckCircle size={16}/> Chấp thuận
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className={`admin-response-static ${selectedComplaint.status}`}>
                      <p><strong>Kết quả:</strong> {selectedComplaint.status === 'resolved' ? 'Chấp thuận' : 'Từ chối'}</p>
                      <p><strong>Nội dung:</strong> {selectedComplaint.admin_response}</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="split-right">
                <h4>Thông tin đơn hàng</h4>
                {selectedComplaint.order_id ? (
                  <div className="order-mini-detail">
                    <div className="order-row">
                      <span className="label">Khách hàng:</span>
                      <span className="value">{selectedComplaint.customer_id?.HoTen}</span>
                    </div>
                    <div className="order-row">
                      <span className="label">SĐT:</span>
                      <span className="value">{selectedComplaint.customer_id?.SoDienThoai}</span>
                    </div>
                    <hr/>
                    <div className="order-row">
                      <span className="label">Gói dịch vụ:</span>
                      <span className="value">{selectedComplaint.order_id.package_name || 'Gói chụp ảnh'}</span>
                    </div>
                    <div className="order-row">
                      <span className="label">Tổng tiền:</span>
                      <span className="value highlight">{formatPrice(selectedComplaint.order_id.final_amount)}</span>
                    </div>
                    <div className="order-row">
                      <span className="label">Thợ chụp:</span>
                      <span className="value">{selectedComplaint.photographer_id?.HoTen || 'Không rõ'}</span>
                    </div>
                  </div>
                ) : (
                  <p>Không tìm thấy thông tin đơn hàng.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ComplaintManager;