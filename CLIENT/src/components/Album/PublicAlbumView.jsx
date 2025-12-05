import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import { 
    Loader2, Grid, Image as ImageIcon, X, 
    ChevronLeft, ChevronRight, CheckCircle2, Send, Maximize2, RefreshCw,
    Download, Layers, Check // ✅ Thêm icons mới
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
    
    // ✅ State mới: Quản lý Tab (raw: Ảnh gốc để chọn, edited: Ảnh đã chỉnh)
    const [activeTab, setActiveTab] = useState('raw'); // 'raw' | 'edited'

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

                    // Nếu có ảnh chỉnh sửa và trạng thái đã hoàn thành, có thể ưu tiên show tab edited (tuỳ chọn)
                    if (data.status === 'delivered' && data.edited_photos?.length > 0) {
                        setActiveTab('edited');
                    }
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

    // --- LOGIC TRẠNG THÁI ---
    const isLocked = album?.status === 'finalized';
    const hasSubmittedBefore = album?.status === 'selection_completed';
    const hasEditedPhotos = album?.edited_photos && album.edited_photos.length > 0;

    // --- LOGIC DOWNLOAD ---
    const handleDownload = async (url, filename) => {
        try {
            const response = await fetch(url);
            const blob = await response.blob();
            const link = document.createElement('a');
            link.href = window.URL.createObjectURL(blob);
            link.download = filename || `photo-${Date.now()}.jpg`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } catch (error) {
            console.error(error);
            // Fallback mở tab mới nếu fetch blob lỗi (do CORS)
            window.open(url, '_blank');
        }
    };

    // --- LOGIC CHỌN ẢNH ---
    const togglePhoto = (id) => {
        if (isLocked || activeTab === 'edited') return; // Không cho chọn ở tab Edited
        setSelectedIds(prev => 
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    const handleSubmit = async () => {
        if (selectedIds.length === 0) return toast.warning("Vui lòng chọn ít nhất 1 ảnh.");
        
        const confirmMsg = hasSubmittedBefore 
            ? `Bạn đang cập nhật lại danh sách chọn (${selectedIds.length} ảnh). Xác nhận gửi lại?`
            : `Xác nhận gửi ${selectedIds.length} ảnh này cho Nhiếp ảnh gia?`;

        if (!window.confirm(confirmMsg)) return;

        try {
            setSubmitting(true);
            await albumApi.submitPublicSelection(token, selectedIds);
            toast.success("Đã gửi lựa chọn thành công!");
            setAlbum(prev => ({ ...prev, status: 'selection_completed' }));
        } catch (err) {
            toast.error("Lỗi khi gửi lựa chọn.");
        } finally {
            setSubmitting(false);
        }
    };

    // --- LIGHTBOX HELPER ---
    // Xác định danh sách ảnh hiện tại dựa trên Tab đang active
    const currentPhotos = activeTab === 'raw' ? album?.photos : album?.edited_photos;

    const openLightbox = (index) => { setLightboxIndex(index); document.body.style.overflow = 'hidden'; };
    const closeLightbox = () => { setLightboxIndex(null); document.body.style.overflow = 'auto'; };
    
    const nextPhoto = (e) => { 
        e.stopPropagation(); 
        if (!currentPhotos) return;
        setLightboxIndex((prev) => (prev + 1) % currentPhotos.length); 
    };
    
    const prevPhoto = (e) => { 
        e.stopPropagation(); 
        if (!currentPhotos) return;
        setLightboxIndex((prev) => (prev - 1 + currentPhotos.length) % currentPhotos.length); 
    };

    if (loading) return <div className="public-loading"><Loader2 className="spinner" size={40}/></div>;
    if (error) return <div className="public-error"><h2>Oops!</h2><p>{error}</p></div>;

    return (
        <MainLayout>
            <div className="public-album-page">
                <div className="public-hero">
                    <div className="public-container">
                        <h1 className="public-title">{album.title}</h1>
                        <p className="public-desc">{album.description || "Khách hàng vui lòng chọn ảnh bên dưới"}</p>
                        <div className="public-meta">
                            <span>{album.photos.length} ảnh gốc</span>
                            {hasEditedPhotos && <span>• {album.edited_photos.length} ảnh chỉnh sửa</span>}
                            <span>• {new Date(album.createdAt).toLocaleDateString('vi-VN')}</span>
                            {album.photographer_id && ( <><span>•</span><span>By {album.photographer_id.HoTen}</span></> )}
                        </div>

                        {/* ✅ TAB NAVIGATION */}
                        <div className="public-tabs">
                            <button 
                                className={`tab-btn ${activeTab === 'raw' ? 'active' : ''}`}
                                onClick={() => setActiveTab('raw')}
                            >
                                <Grid size={18}/> Chọn Ảnh ({album.photos.length})
                            </button>
                            {hasEditedPhotos && (
                                <button 
                                    className={`tab-btn ${activeTab === 'edited' ? 'active' : ''}`}
                                    onClick={() => setActiveTab('edited')}
                                >
                                    <Layers size={18}/> Ảnh Đã Chỉnh ({album.edited_photos.length})
                                </button>
                            )}
                        </div>

                        {/* Trạng thái Alert */}
                        {activeTab === 'raw' && hasSubmittedBefore && !isLocked && (
                            <div className="status-alert success">
                                <CheckCircle2 size={16}/> Bạn đã gửi lựa chọn trước đó. Có thể chọn lại và gửi cập nhật.
                            </div>
                        )}
                    </div>
                </div>

                {/* ✅ THANH CÔNG CỤ CỐ ĐỊNH (Chỉ hiện ở Tab RAW và chưa khóa) */}
                {activeTab === 'raw' && !isLocked && (
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
                    {/* GRID ẢNH */}
                    {currentPhotos && currentPhotos.length > 0 ? (
                        <div className="public-grid">
                            {currentPhotos.map((photo, index) => {
                                const url = getPhotoUrl(photo.url);
                                // Logic check active chỉ áp dụng cho tab RAW
                                const isSelected = activeTab === 'raw' && selectedIds.includes(photo._id);
                                
                                return (
                                    <div key={photo._id} className={`public-item ${isSelected ? 'active' : ''}`}>
                                        <div className="img-wrap" onClick={() => openLightbox(index)}>
                                            <img src={url} alt="photo" loading="lazy" />
                                            <div className="item-overlay">
                                                <button className="btn-icon-overlay" title="Phóng to">
                                                    <Maximize2 size={20} color="white"/>
                                                </button>
                                                {/* ✅ Nút Download trên từng ảnh */}
                                                <button 
                                                    className="btn-icon-overlay" 
                                                    title="Tải xuống"
                                                    onClick={(e) => { e.stopPropagation(); handleDownload(url, `photo-${index}.jpg`); }}
                                                >
                                                    <Download size={20} color="white"/>
                                                </button>
                                            </div>
                                        </div>

                                        {/* Checkbox: Chỉ hiện ở Tab RAW và chưa khóa */}
                                        {activeTab === 'raw' && !isLocked && (
                                            <div className="checkbox-area" onClick={(e) => { e.stopPropagation(); togglePhoto(photo._id); }}>
                                                <div className={`custom-checkbox ${isSelected ? 'checked' : ''}`}>
                                                    {isSelected && <CheckCircle2 size={20} color="white"/>}
                                                </div>
                                            </div>
                                        )}
                                        
                                        {/* Tag Đã chọn (cho Tab Raw khi bị khóa) */}
                                        {activeTab === 'raw' && isSelected && isLocked && <div className="final-tag">Đã chọn</div>}
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="empty-tab-state">
                            <ImageIcon size={48} color="#cbd5e1"/>
                            <p>Chưa có ảnh nào trong mục này.</p>
                        </div>
                    )}
                </div>

                {/* ✅ LIGHTBOX */}
                {lightboxIndex !== null && currentPhotos && (
                    <div className="lightbox-overlay" onClick={closeLightbox}>
                        <button className="lb-close-btn"><X size={32}/></button>
                        
                        <div className="lb-content" onClick={e => e.stopPropagation()}>
                            <button className="lb-nav-btn prev" onClick={prevPhoto}><ChevronLeft size={40}/></button>
                            
                            <div className="lb-image-wrapper">
                                <img src={getPhotoUrl(currentPhotos[lightboxIndex].url)} className="lb-image" alt="" />
                                
                                {/* ACTIONS TRONG LIGHTBOX */}
                                <div className="lb-actions">
                                    {/* Nút Chọn (Chỉ hiện ở Tab Raw + Chưa khóa) */}
                                    {activeTab === 'raw' && !isLocked && (
                                        <button 
                                            className={`lb-btn lb-select-btn ${selectedIds.includes(currentPhotos[lightboxIndex]._id) ? 'selected' : ''}`}
                                            onClick={() => togglePhoto(currentPhotos[lightboxIndex]._id)}
                                        >
                                            {selectedIds.includes(currentPhotos[lightboxIndex]._id) ? 
                                                <><CheckCircle2 size={18}/> Đã chọn</> : "Chọn ảnh này"}
                                        </button>
                                    )}

                                    {/* ✅ Nút Download trong Lightbox */}
                                    <button 
                                        className="lb-btn lb-download-btn"
                                        onClick={() => handleDownload(getPhotoUrl(currentPhotos[lightboxIndex].url), `photo-${lightboxIndex}.jpg`)}
                                    >
                                        <Download size={18}/> Tải xuống
                                    </button>
                                </div>
                            </div>

                            <button className="lb-nav-btn next" onClick={nextPhoto}><ChevronRight size={40}/></button>
                        </div>
                        
                        {/* Chỉ số ảnh */}
                        <div className="lb-counter">
                            {lightboxIndex + 1} / {currentPhotos.length}
                        </div>
                    </div>
                )}
            </div>
        </MainLayout>
    );
}