import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { Copy, ArrowLeft, Image as ImageIcon, CheckCircle2, Loader2 } from "lucide-react";
import "./SelectionPhotoManage.css";
import axiosUser from "../../apis/axiosUser"; 

// ✅ Import MainLayout
import MainLayout from "../../layouts/MainLayout/MainLayout";

// ❌ Đã xóa import Header, Sidebar, Footer lẻ tẻ

const SelectionPhotoManage = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [albumInfo, setAlbumInfo] = useState(null);
  const [copying, setCopying] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const res = await axiosUser.get(`/albums/${orderId}`);
        
        // Logic xử lý data an toàn
        let albumData = null;
        if (res.data && res.data.data) albumData = res.data.data;
        else if (res.data && res.data._id) albumData = res.data;
        else if (res.data) albumData = res.data;

        if (albumData) {
          setAlbumInfo(albumData);
          if (albumData.photos && Array.isArray(albumData.photos)) {
              const selected = albumData.photos.filter(p => p.is_selected === true);
              setPhotos(selected);
          } else {
              setPhotos([]);
          }
        }
      } catch (error) {
        console.error("Fetch error:", error);
        toast.error("Không thể tải dữ liệu");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [orderId]);

  const copyFilenames = async () => {
    if (photos.length === 0) return;
    setCopying(true);
    
    try {
      const filenames = photos.map(p => p.filename || p.url.split('/').pop()).join('; ');
      await navigator.clipboard.writeText(filenames);
      toast.success("✓ Đã copy danh sách tên file", {
        position: "top-right",
        autoClose: 2000,
      });
    } catch (error) {
      toast.error("Lỗi khi copy");
    } finally {
      setTimeout(() => setCopying(false), 500);
    }
  };

  const getImgUrl = (url) => url.startsWith('http') ? url : `http://localhost:5000${url}`;

  return (
    // ✅ Bọc nội dung trong MainLayout
    <MainLayout>
        <div className="pm-container">
            {loading ? (
                <div className="pm-loading">
                    <Loader2 size={40} className="spinner"/> 
                    <span>Đang tải dữ liệu...</span>
                </div>
            ) : (
                <>
                    <div className="pm-header">
                        <button onClick={() => navigate(-1)} className="pm-back-btn">
                            <ArrowLeft size={18}/> Quay lại
                        </button>
                        
                        <div className="pm-header-content">
                            <div className="pm-header-left">
                                <h2>
                                    Danh sách khách chọn
                                    {photos.length > 0 && (
                                        <span className="photo-count-badge">
                                            {photos.length}
                                        </span>
                                    )}
                                </h2>
                                <div className="pm-order-info">
                                    <span>
                                        Đơn hàng: <span className="order-id">#{albumInfo?.order_id || orderId}</span>
                                    </span>
                                    {albumInfo?.customer_name && (
                                        <>
                                            <span className="divider"></span>
                                            <span>Khách hàng: {albumInfo.customer_name}</span>
                                        </>
                                    )}
                                </div>
                            </div>
                            
                            <button 
                                className="btn-copy" 
                                onClick={copyFilenames} 
                                disabled={photos.length === 0 || copying}
                            >
                                {copying ? (
                                    <>
                                        <Loader2 size={16} className="spinner"/>
                                        Đang copy...
                                    </>
                                ) : (
                                    <>
                                        <Copy size={16}/>
                                        Copy tên file
                                    </>
                                )}
                            </button>
                        </div>
                    </div>

                    {photos.length === 0 ? (
                        <div className="pm-empty">
                            <div className="pm-empty-icon">
                                <ImageIcon size={40} strokeWidth={1.5}/>
                            </div>
                            <h3>Chưa có ảnh được chọn</h3>
                            <p>Khách hàng chưa chọn ảnh nào hoặc chưa gửi danh sách cho thợ</p>
                        </div>
                    ) : (
                        <>
                            <div className="pm-list">
                                <div className="pm-table-header">
                                    <span>Hình ảnh</span>
                                    <span>Tên file</span>
                                    <span>Trạng thái</span>
                                </div>
                                <div className="pm-table-body">
                                    {photos.map((photo, index) => (
                                        <div 
                                            key={photo._id} 
                                            className="pm-row"
                                            style={{
                                                animation: `fadeInUp 0.3s ease ${index * 0.03}s both`
                                            }}
                                        >
                                            <div className="pm-thumb">
                                                <img 
                                                    src={getImgUrl(photo.url)} 
                                                    alt={`Photo ${index + 1}`} 
                                                    loading="lazy" 
                                                />
                                            </div>
                                            <div className="pm-name">
                                                {photo.filename || photo.url.split('/').pop()}
                                            </div>
                                            <div className="pm-status">
                                                <span className="badge-selected">
                                                    <CheckCircle2 size={14}/>
                                                    Selected
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="pm-raw-text">
                                <h4>Chuỗi tên file (Dùng cho Search Lightroom)</h4>
                                <textarea 
                                    readOnly 
                                    value={photos.map(p => p.filename || p.url.split('/').pop()).join('; ')}
                                    onClick={(e) => e.target.select()} 
                                    placeholder="Danh sách tên file..."
                                />
                            </div>
                        </>
                    )}
                </>
            )}
        </div>
    </MainLayout>
  );
};

export default SelectionPhotoManage;