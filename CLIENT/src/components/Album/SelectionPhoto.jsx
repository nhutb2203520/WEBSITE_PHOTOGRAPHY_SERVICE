import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { 
  CheckCircle2, Loader2, Send, ArrowLeft, Maximize2, X, ChevronLeft, ChevronRight 
} from "lucide-react";
import "./SelectionPhoto.css";
import axiosUser from "../../apis/axiosUser";

const SelectionPhoto = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();

  const [album, setAlbum] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  // Lightbox State
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Tìm Album theo Order ID
        // Lưu ý: Backend cần hỗ trợ tìm album qua orderId
        const res = await axiosUser.get(`/albums/${orderId}`);
        if (res.data?.data) {
          setAlbum(res.data.data);
          // Load những ảnh đã chọn trước đó
          const preSelected = res.data.data.photos
            .filter(p => p.is_selected).map(p => p._id);
          setSelectedIds(preSelected);
        }
      } catch (error) {
        toast.error("Không tìm thấy album ảnh.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [orderId]);

  // Toggle chọn ảnh
  const togglePhoto = (id) => {
    if (album?.status === 'finalized') return; // Đã chốt thì không sửa
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  // Gửi lựa chọn
  const handleSubmit = async () => {
    if (selectedIds.length === 0) return toast.warning("Vui lòng chọn ít nhất 1 ảnh.");
    if (!window.confirm(`Xác nhận gửi ${selectedIds.length} ảnh này cho nhiếp ảnh gia?`)) return;

    try {
      setSubmitting(true);
      await axiosUser.put(`/albums/${orderId}/selection`, { selectedIds });
      toast.success("Đã gửi lựa chọn thành công!");
      navigate(-1); // Quay lại trang chi tiết đơn
    } catch (error) {
      toast.error("Lỗi khi gửi.");
    } finally {
      setSubmitting(false);
    }
  };

  // Lightbox helpers
  const openLightbox = (index) => { setCurrentIndex(index); setLightboxOpen(true); };
  const closeLightbox = () => setLightboxOpen(false);
  const nextImg = (e) => { e.stopPropagation(); setCurrentIndex((currentIndex + 1) % album.photos.length); };
  const prevImg = (e) => { e.stopPropagation(); setCurrentIndex((currentIndex - 1 + album.photos.length) % album.photos.length); };

  if (loading) return <div className="sp-loading"><Loader2 className="spinner"/></div>;
  if (!album) return <div className="sp-error">Chưa có ảnh nào được tải lên.</div>;

  const isFinalized = album.status === 'finalized' || album.status === 'selection_completed';

  return (
    <div className="sp-container">
      {/* HEADER */}
      <div className="sp-header">
        <button onClick={() => navigate(-1)} className="btn-back"><ArrowLeft size={20}/> Quay lại</button>
        <div className="sp-title">
            <h1>Chọn ảnh chỉnh sửa</h1>
            <p>Vui lòng tích chọn những tấm ảnh bạn ưng ý nhất</p>
        </div>
        <div className="sp-count">
            Đã chọn: <b className="highlight">{selectedIds.length}</b> ảnh
        </div>
      </div>

      {/* GRID */}
      <div className="sp-grid">
        {album.photos.map((photo, index) => {
          const isSelected = selectedIds.includes(photo._id);
          return (
            <div key={photo._id} className={`sp-card ${isSelected ? 'active' : ''}`}>
              <div className="img-wrap" onClick={() => openLightbox(index)}>
                 <img src={photo.url} alt="" loading="lazy" />
                 <div className="zoom-hint"><Maximize2 size={20}/></div>
              </div>
              
              {!isFinalized && (
                  <div className="checkbox-area" onClick={() => togglePhoto(photo._id)}>
                      <div className={`custom-checkbox ${isSelected ? 'checked' : ''}`}>
                          {isSelected && <CheckCircle2 size={20} color="white"/>}
                      </div>
                  </div>
              )}
              {isFinalized && isSelected && <div className="final-tag">Đã chọn</div>}
            </div>
          )
        })}
      </div>

      {/* FOOTER ACTION */}
      {!isFinalized && (
          <div className="sp-footer">
              <div className="sp-footer-content">
                  <span>Bạn đã chọn <b>{selectedIds.length}</b> ảnh</span>
                  <button className="btn-confirm-select" onClick={handleSubmit} disabled={submitting}>
                      {submitting ? <Loader2 className="spinner"/> : <Send size={18}/>} Gửi cho Thợ
                  </button>
              </div>
          </div>
      )}

      {/* LIGHTBOX */}
      {lightboxOpen && (
        <div className="lb-overlay" onClick={closeLightbox}>
            <button className="lb-close"><X size={30}/></button>
            <div className="lb-content" onClick={e => e.stopPropagation()}>
                <img src={album.photos[currentIndex].url} alt="Zoom" />
                
                <button className="lb-nav prev" onClick={prevImg}><ChevronLeft size={40}/></button>
                <button className="lb-nav next" onClick={nextImg}><ChevronRight size={40}/></button>

                {/* Select Button inside Lightbox */}
                {!isFinalized && (
                    <button 
                        className={`lb-select-btn ${selectedIds.includes(album.photos[currentIndex]._id) ? 'selected' : ''}`}
                        onClick={() => togglePhoto(album.photos[currentIndex]._id)}
                    >
                        {selectedIds.includes(album.photos[currentIndex]._id) ? "Bỏ chọn" : "Chọn ảnh này"}
                    </button>
                )}
            </div>
        </div>
      )}
    </div>
  );
};

export default SelectionPhoto;