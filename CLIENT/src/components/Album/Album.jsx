import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { useSelector } from "react-redux";
import { 
  Loader2, Send, ArrowLeft, UploadCloud, FileImage,
  Package, Calendar, User, Phone, MapPin, AlertTriangle, ExternalLink
} from "lucide-react";
import "./Album.css";
import axiosUser from "../../apis/axiosUser";

// --- COMPONENT: ORDER INFO CARD ---
const OrderInfoCard = ({ order, loading }) => {
    if (loading) {
        return (
            <div className="order-info-card loading-skeleton">
                <div className="skeleton-line title"></div>
                <div className="skeleton-line text"></div>
                <div className="skeleton-line text"></div>
                <p className="loading-text"><Loader2 size={14} className="spinner"/> Đang tải thông tin đơn hàng...</p>
            </div>
        );
    }

    if (!order) return null;

    return (
      <div className="order-info-card">
          <div className="order-info-header">
              <div className="order-id-badge">
                  <Package size={18}/> 
                  <span>Đơn hàng #{order.order_id}</span>
              </div>
              <span className="order-date">
                  <Calendar size={14}/> {new Date(order.booking_date).toLocaleDateString('vi-VN')}
              </span>
          </div>
          <div className="order-info-body">
              <div className="info-row">
                  <div className="info-item">
                      <User size={14} className="icon-gray"/> 
                      <span className="info-label">Khách:</span>
                      <span className="info-value highlight">{order.customer_id?.HoTen || "N/A"}</span>
                  </div>
                  <div className="info-item">
                      <Phone size={14} className="icon-gray"/> 
                      <span className="info-label">SĐT:</span>
                      <span className="info-value">{order.customer_id?.SoDienThoai || "---"}</span>
                  </div>
              </div>
              <div className="info-row">
                  <div className="info-item">
                      <Package size={14} className="icon-gray"/> 
                      <span className="info-label">Gói:</span>
                      <span className="info-value text-blue">{order.service_package_id?.TenGoi}</span>
                  </div>
              </div>
              <div className="info-row full">
                  <div className="info-item">
                      <MapPin size={14} className="icon-gray"/> 
                      <span className="info-label">Địa điểm:</span>
                      <span className="info-value address">
                          {order.location?.address} {order.location?.district && `, ${order.location.district}`}
                      </span>
                  </div>
              </div>
          </div>
      </div>
    );
};

// --- MAIN COMPONENT ---
const Album = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const { user } = useSelector(state => state.user || {});

  const [loading, setLoading] = useState(true);
  const [loadingOrder, setLoadingOrder] = useState(true);
  const [orderInfo, setOrderInfo] = useState(null);
  
  // Upload State
  const [uploading, setUploading] = useState(false);
  const [newAlbumTitle, setNewAlbumTitle] = useState("Album ảnh gốc");
  const [newAlbumDesc, setNewAlbumDesc] = useState("");
  const [selectedFiles, setSelectedFiles] = useState([]); 
  const fileInputRef = useRef(null);

  // Dev Mode Force
  const [forcePhotographerMode, setForcePhotographerMode] = useState(false);

  // Kiểm tra quyền
  const isPhotographer = forcePhotographerMode || (user && (user.isPhotographer === true || user.role === 'photographer'));

  useEffect(() => {
    const fetchData = async () => {
        if (!orderId) return;
        setLoading(true);
        setLoadingOrder(true);

        try {
            // 1. Lấy thông tin Đơn Hàng
            const orderRes = await axiosUser.get(`/orders/${orderId}`);
            let orderData = orderRes.data?.data || orderRes.data;
            if (!orderData && orderRes.order_id) orderData = orderRes; // Fallback
            
            if (orderData) {
                setOrderInfo(orderData);
            }
            setLoadingOrder(false); // Đã có thông tin đơn

            // 2. Kiểm tra xem đã có Album chưa
            const albumRes = await axiosUser.get(`/albums/${orderId}`);
            const albumData = albumRes.data?.data || albumRes.data;

            if (albumData && albumData._id) {
                // 🚨 NẾU ĐÃ CÓ ALBUM -> CHUYỂN HƯỚNG NGAY LẬP TỨC
                toast.info("Đơn hàng đã có album, đang chuyển đến trang quản lý...");
                if (isPhotographer) {
                    navigate(`/orders/${orderId}/manage-selection`);
                } else {
                    navigate(`/orders/${orderId}/select-photos`);
                }
                return; // Dừng render trang này
            }

        } catch (error) {
            // Nếu lỗi 404 Album -> Nghĩa là chưa có album -> Ở lại trang này để tạo
            if (error.response?.status === 404) {
                // Do nothing, stay here to create album
            } else {
                console.error("Lỗi data:", error);
            }
        } finally {
            setLoading(false);
        }
    };
    fetchData();
  }, [orderId, isPhotographer, navigate]);

  // --- UPLOAD HANDLERS ---
  const handleFileSelect = (e) => {
      const files = Array.from(e.target.files);
      if (files.length > 0) setSelectedFiles(prev => [...prev, ...files]);
      e.target.value = null;
  };

  const removeFileFromQueue = (index) => setSelectedFiles(prev => prev.filter((_, i) => i !== index));

  const handleCreateAndUpload = async (e) => {
    e.preventDefault();
    if (selectedFiles.length === 0) return toast.warning("Vui lòng chọn ít nhất 1 ảnh!");

    const formData = new FormData();
    formData.append("title", newAlbumTitle);
    formData.append("description", newAlbumDesc);
    selectedFiles.forEach(file => formData.append("photos", file));

    try {
        setUploading(true);
        await axiosUser.post(`/albums/${orderId}/upload`, formData, {
            headers: { "Content-Type": "multipart/form-data" }
        });
        toast.success("Khởi tạo Album thành công!");
        
        // Sau khi tạo xong -> Chuyển hướng sang trang quản lý
        navigate(`/orders/${orderId}/manage-selection`);
        
    } catch (error) {
        toast.error("Lỗi upload. File quá lớn hoặc server lỗi.");
        setUploading(false);
    }
  };

  if (loading) return <div className="album-loading"><Loader2 className="spinner" size={40}/></div>;

  // ============================================================
  // CASE 1: PHOTOGRAPHER (CHƯA CÓ ALBUM -> HIỆN FORM TẠO)
  // ============================================================
  if (isPhotographer) {
      return (
        <div className="album-container create-mode">
            <div className="album-header-simple">
                <button className="btn-icon-back" onClick={() => navigate(-1)}><ArrowLeft size={20}/> Quay lại</button>
                <h2>Khởi tạo Album mới</h2>
            </div>

            {/* Hiển thị thông tin đơn hàng */}
            <OrderInfoCard order={orderInfo} loading={loadingOrder} />

            <div className="create-album-form">
                <div className="form-group">
                    <label>Tên Album</label>
                    <input type="text" value={newAlbumTitle} onChange={(e) => setNewAlbumTitle(e.target.value)} />
                </div>
                
                <div className="form-group">
                    <label>Lời nhắn cho khách (Tùy chọn)</label>
                    <textarea value={newAlbumDesc} onChange={(e) => setNewAlbumDesc(e.target.value)} rows={3} placeholder="Nhập mô tả..."/>
                </div>

                <div className="upload-area">
                    <input type="file" multiple accept="image/*" id="initial-upload" className="hidden-input" onChange={handleFileSelect} />
                    <label htmlFor="initial-upload" className="upload-dropzone">
                        <UploadCloud size={48} className="text-blue-500"/>
                        <p className="upload-text">Nhấn để chọn ảnh hoặc kéo thả vào đây</p>
                        <p className="upload-hint">(Không giới hạn số lượng ảnh. Hỗ trợ JPG, PNG)</p>
                    </label>
                </div>

                {/* Preview danh sách file */}
                {selectedFiles.length > 0 && (
                    <div className="file-preview-list">
                        <h4>Sẵn sàng tải lên ({selectedFiles.length} ảnh):</h4>
                        <div className="preview-grid">
                            {selectedFiles.map((file, idx) => (
                                <div key={idx} className="preview-item">
                                    <FileImage size={20} color="#64748b"/>
                                    <span className="file-name">{file.name}</span>
                                    <button onClick={() => removeFileFromQueue(idx)} className="btn-remove-file">×</button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                <button className="btn-create-album" onClick={handleCreateAndUpload} disabled={uploading || selectedFiles.length === 0}>
                    {uploading ? <Loader2 className="spinner" size={20}/> : <Send size={20}/>}
                    {uploading ? "Đang khởi tạo & Upload..." : "Tạo Album & Giao Ảnh"}
                </button>
            </div>
        </div>
      );
  }

  // ============================================================
  // CASE 2: KHÁCH HÀNG (CHƯA CÓ ALBUM -> HIỆN THÔNG BÁO)
  // ============================================================
  return (
     <div className="album-container">
        <div className="album-header-simple">
           <button className="btn-icon-back" onClick={() => navigate(-1)}><ArrowLeft size={20}/> Quay lại</button>
           <h2>Chi tiết Album</h2>
        </div>
        
        <OrderInfoCard order={orderInfo} loading={loadingOrder} />
        
        <div className="album-empty-state">
           <div className="empty-icon-wrapper">
                <ImageIcon size={48} strokeWidth={1.5}/>
           </div>
           <h3>Chưa có ảnh nào</h3>
           <p>Nhiếp ảnh gia đang xử lý hình ảnh. Vui lòng quay lại sau.</p>
           
           {/* Dev Tool: Nút để test giao diện Thợ */}
           <button onClick={() => setForcePhotographerMode(true)} className="btn-dev-tool">
               🛠 (Dev) Switch to Photographer
           </button>
        </div>
     </div>
  );
};

export default Album;