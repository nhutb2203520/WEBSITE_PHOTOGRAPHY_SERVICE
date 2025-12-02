import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import { 
    Loader2, Grid, Image as ImageIcon, X, 
    ChevronLeft, ChevronRight, CheckCircle2, Send, Maximize2, RefreshCw 
} from 'lucide-react';
import albumApi from '../../apis/albumApi';
import './PublicAlbumView.css';

// ✅ Import MainLayout
import MainLayout from '../../layouts/MainLayout/MainLayout';

export default function PublicAlbumView() {
    const { token } = useParams();
    
    const [album, setAlbum] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    
    const [selectedIds, setSelectedIds] = useState([]);
    const [submitting, setSubmitting] = useState(false);
    
    // Lightbox
    const [lightboxIndex, setLightboxIndex] = useState(null);

    useEffect(() => {
        const fetchPublicAlbum = async () => {
            try {
                setLoading(true);
                const res = await albumApi.getPublicAlbum(token);
                if (res.data && res.data.success) {
                    const data = res.data.data;
                    setAlbum(data);
                    
                    // Load danh sách đã chọn trước đó
                    const preSelected = data.photos.filter(p => p.is_selected).map(p => p._id);
                    setSelectedIds(preSelected);
                } else {
                    setError("Không thể tải dữ liệu.");
                }
            } catch (err) {
                setError("Album không tồn tại hoặc liên kết đã hết hạn.");
            } finally {
                setLoading(false);
            }
        };
        fetchPublicAlbum();
    }, [token]);

    const getPhotoUrl = (url) => url.startsWith('http') ? url : `http://localhost:5000${url}`;

    // ✅ LOGIC MỚI: Chỉ khóa khi trạng thái là 'finalized' (Thợ đã chốt cứng)
    // Trạng thái 'selection_completed' vẫn cho phép sửa và gửi lại
    const isLocked = album?.status === 'finalized';
    const hasSubmittedBefore = album?.status === 'selection_completed';

    const togglePhoto = (id) => {
        if (isLocked) return; 
        setSelectedIds(prev => 
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    const handleSubmit = async () => {
        if (selectedIds.length === 0) return toast.warning("Vui lòng chọn ít nhất 1 ảnh.");
        
        // Thông báo khác nhau tùy trường hợp
        const confirmMsg = hasSubmittedBefore 
            ? `Bạn đang cập nhật lại danh sách chọn (${selectedIds.length} ảnh). Xác nhận gửi lại?`
            : `Xác nhận gửi ${selectedIds.length} ảnh này cho Nhiếp ảnh gia?`;

        if (!window.confirm(confirmMsg)) return;

        try {
            setSubmitting(true);
            await albumApi.submitPublicSelection(token, selectedIds);
            toast.success("Đã gửi lựa chọn thành công!");
            
            // Cập nhật lại trạng thái local để UI hiển thị đúng
            setAlbum(prev => ({ ...prev, status: 'selection_completed' }));
            
        } catch (err) {
            toast.error("Lỗi khi gửi lựa chọn.");
        } finally {
            setSubmitting(false);
        }
    };

    // Lightbox
    const openLightbox = (index) => { setLightboxIndex(index); document.body.style.overflow = 'hidden'; };
    const closeLightbox = () => { setLightboxIndex(null); document.body.style.overflow = 'auto'; };
    const nextPhoto = (e) => { e.stopPropagation(); setLightboxIndex((prev) => (prev + 1) % album.photos.length); };
    const prevPhoto = (e) => { e.stopPropagation(); setLightboxIndex((prev) => (prev - 1 + album.photos.length) % album.photos.length); };

    if (loading) return <div className="public-loading"><Loader2 className="spinner" size={40}/></div>;
    if (error) return <div className="public-error"><h2>Oops!</h2><p>{error}</p></div>;

    return (
        // ✅ Bọc trong MainLayout
        <MainLayout>
            <div className="public-album-page">
                <div className="public-hero">
                    <div className="public-container">
                        <h1 className="public-title">{album.title}</h1>
                        <p className="public-desc">{album.description || "Khách hàng vui lòng chọn ảnh bên dưới"}</p>
                        <div className="public-meta">
                            <span>{album.photos.length} ảnh</span>
                            <span>•</span>
                            <span>{new Date(album.createdAt).toLocaleDateString('vi-VN')}</span>
                            {album.photographer_id && ( <><span>•</span><span>By {album.photographer_id.HoTen}</span></> )}
                        </div>

                        {/* Hiển thị trạng thái */}
                        {hasSubmittedBefore && !isLocked && (
                            <div className="status-alert success">
                                <CheckCircle2 size={16}/> Bạn đã gửi lựa chọn trước đó. Có thể chọn lại và gửi cập nhật.
                            </div>
                        )}
                        {isLocked && (
                            <div className="status-alert locked">
                                <CheckCircle2 size={16}/> Album đã được chốt. Không thể chỉnh sửa.
                            </div>
                        )}
                    </div>
                </div>

                {/* THANH CÔNG CỤ CỐ ĐỊNH (Chỉ hiện khi chưa bị khóa cứng) */}
                {!isLocked && (
                    <div className="selection-sticky-bar">
                        <div className="public-container bar-content">
                            <div className="bar-info">
                                <span>Đang chọn: <b className="highlight">{selectedIds.length}</b> ảnh</span>
                            </div>
                            <button 
                                className="btn-submit-public" 
                                onClick={handleSubmit} 
                                disabled={submitting}
                            >
                                {submitting ? <Loader2 className="spinner-sm"/> : (hasSubmittedBefore ? <RefreshCw size={18}/> : <Send size={18}/>)}
                                {hasSubmittedBefore ? " Cập nhật lựa chọn" : " Gửi lựa chọn"}
                            </button>
                        </div>
                    </div>
                )}

                <div className="public-container gallery-section">
                    <div className="public-grid">
                        {album.photos.map((photo, index) => {
                            const isSelected = selectedIds.includes(photo._id);
                            return (
                                <div key={photo._id} className={`public-item ${isSelected ? 'active' : ''}`}>
                                    <div className="img-wrap" onClick={() => openLightbox(index)}>
                                        <img src={getPhotoUrl(photo.url)} alt="photo" loading="lazy" />
                                        <div className="item-overlay"><Maximize2 size={24} color="white"/></div>
                                    </div>

                                    {/* Checkbox: Ẩn nếu bị khóa cứng */}
                                    {!isLocked && (
                                        <div className="checkbox-area" onClick={(e) => { e.stopPropagation(); togglePhoto(photo._id); }}>
                                            <div className={`custom-checkbox ${isSelected ? 'checked' : ''}`}>
                                                {isSelected && <CheckCircle2 size={20} color="white"/>}
                                            </div>
                                        </div>
                                    )}
                                    
                                    {isSelected && isLocked && <div className="final-tag">Đã chọn</div>}
                                </div>
                            );
                        })}
                    </div>
                </div>

                 {lightboxIndex !== null && (
                    <div className="lightbox-overlay" onClick={closeLightbox}>
                        <button className="lb-close-btn"><X size={32}/></button>
                        <div className="lb-content" onClick={e => e.stopPropagation()}>
                            <button className="lb-nav-btn prev" onClick={prevPhoto}><ChevronLeft size={40}/></button>
                            
                            <div className="lb-image-wrapper">
                                <img src={getPhotoUrl(album.photos[lightboxIndex].url)} className="lb-image" alt="" />
                                
                                {/* Nút chọn trong Lightbox */}
                                {!isLocked && (
                                    <div className="lb-actions">
                                        <button 
                                            className={`lb-select-btn ${selectedIds.includes(album.photos[lightboxIndex]._id) ? 'selected' : ''}`}
                                            onClick={() => togglePhoto(album.photos[lightboxIndex]._id)}
                                        >
                                            {selectedIds.includes(album.photos[lightboxIndex]._id) ? 
                                                <><CheckCircle2 size={18}/> Đã chọn</> : "Chọn ảnh này"}
                                        </button>
                                    </div>
                                )}
                            </div>

                            <button className="lb-nav-btn next" onClick={nextPhoto}><ChevronRight size={40}/></button>
                        </div>
                    </div>
                )}
            </div>
        </MainLayout>
    );
}