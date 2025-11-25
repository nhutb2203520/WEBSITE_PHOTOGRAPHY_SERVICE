import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { Copy, ArrowLeft, Download, Image as ImageIcon, CheckCircle2 } from "lucide-react";
import "./SelectionPhotoManage.css";
import axiosUser from "../../apis/axiosUser";

const SelectionPhotoManage = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await axiosUser.get(`/albums/${orderId}`);
        if (res.data?.data) {
          // Chỉ lọc ra các ảnh được chọn
          const selected = res.data.data.photos.filter(p => p.is_selected);
          setPhotos(selected);
        }
      } catch (error) {
        toast.error("Lỗi tải dữ liệu album.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [orderId]);

  // Tính năng Copy tên file để paste vào Lightroom
  const copyFilenames = () => {
    if (photos.length === 0) return;
    // Tạo chuỗi tên file cách nhau bởi dấu phẩy hoặc xuống dòng
    const filenames = photos.map(p => p.filename || p.url.split('/').pop()).join('; ');
    
    navigator.clipboard.writeText(filenames)
      .then(() => toast.success("Đã copy danh sách tên file!"))
      .catch(() => toast.error("Lỗi copy."));
  };

  if (loading) return <div className="pm-loading">Đang tải danh sách chọn...</div>;

  return (
    <div className="pm-container">
        <div className="pm-header">
            <button onClick={() => navigate(-1)} className="pm-back-btn"><ArrowLeft size={18}/> Quay lại</button>
            <h2>Danh sách khách chọn ({photos.length} ảnh)</h2>
            <div className="pm-actions">
                <button className="btn-copy" onClick={copyFilenames} disabled={photos.length === 0}>
                    <Copy size={16}/> Copy Tên File
                </button>
                {/* Nút download demo (nếu cần) */}
                <button className="btn-download" disabled><Download size={16}/> Tải về (Zip)</button>
            </div>
        </div>

        {photos.length === 0 ? (
            <div className="pm-empty">
                <ImageIcon size={48}/>
                <p>Khách hàng chưa chọn ảnh nào.</p>
            </div>
        ) : (
            <div className="pm-list">
                {/* Hiển thị dạng list để dễ nhìn tên file */}
                <div className="pm-table-header">
                    <span>Hình ảnh</span>
                    <span>Tên file</span>
                    <span>Trạng thái</span>
                </div>
                <div className="pm-table-body">
                    {photos.map((photo) => (
                        <div key={photo._id} className="pm-row">
                            <div className="pm-thumb">
                                <img src={photo.url} alt="thumb" />
                            </div>
                            <div className="pm-name">
                                {photo.filename || photo.url.split('/').pop()}
                            </div>
                            <div className="pm-status">
                                <span className="badge-selected"><CheckCircle2 size={12}/> Selected</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        )}
        
        {/* Khung chứa text tên file để thợ nhìn nhanh */}
        {photos.length > 0 && (
            <div className="pm-raw-text">
                <h4>Chuỗi tên file (Dùng cho Search Lightroom):</h4>
                <textarea 
                    readOnly 
                    value={photos.map(p => p.filename || p.url.split('/').pop()).join('; ')}
                />
            </div>
        )}
    </div>
  );
};

export default SelectionPhotoManage;