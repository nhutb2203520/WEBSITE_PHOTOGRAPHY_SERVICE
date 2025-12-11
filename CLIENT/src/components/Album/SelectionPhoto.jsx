import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { 
    CheckCircle2, Loader2, Send, ArrowLeft, Maximize2, X, 
    ChevronLeft, ChevronRight, Calendar, User, MapPin, Package, RefreshCw,
    Download, Image as ImageIcon, Star,
    Share2, Copy, Check // ✅ [THÊM] Icon cho tính năng chia sẻ
} from "lucide-react";
import "./SelectionPhoto.css";
import axiosUser from "../../apis/axiosUser";

// ✅ Import MainLayout
import MainLayout from "../../layouts/MainLayout/MainLayout";

const SelectionPhoto = () => {
    const { orderId } = useParams();
    const navigate = useNavigate();

    // --- STATE ---
    const [album, setAlbum] = useState(null);
    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const [selectedIds, setSelectedIds] = useState([]);
    const [submitting, setSubmitting] = useState(false);
    
    // Tab State: 'raw' (Gốc) | 'edited' (Đã chỉnh)
    const [activeTab, setActiveTab] = useState('raw');

    // Lightbox State
    const [lightboxOpen, setLightboxOpen] = useState(false);
    const [currentIndex, setCurrentIndex] = useState(0);

    // ✅ [THÊM] State cho chức năng Chia sẻ
    const [showShareModal, setShowShareModal] = useState(false);
    const [shareLink, setShareLink] = useState('');
    const [copied, setCopied] = useState(false);

    // --- FETCH DATA ---
    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                
                const [albumRes, orderRes] = await Promise.all([
                    axiosUser.get(`/albums/${orderId}`).catch(() => null),
                    axiosUser.get(`/orders/${orderId}`).catch(() => null)
                ]);

                // Xử lý Album
                let finalAlbum = null;
                if (albumRes) {
                    if (albumRes.data && albumRes.data.data) finalAlbum = albumRes.data.data;
                    else if (albumRes.success === true && albumRes.data) finalAlbum = albumRes.data;
                    else if (albumRes.data && albumRes.data._id) finalAlbum = albumRes.data;
                }

                if (finalAlbum) {
                    setAlbum(finalAlbum);
                    
                    if (finalAlbum.edited_photos && finalAlbum.edited_photos.length > 0) {
                        setActiveTab('edited');
                    }

                    if (finalAlbum.photos) {
                        const preSelected = finalAlbum.photos
                            .filter(p => p.is_selected).map(p => p._id);
                        setSelectedIds(preSelected);
                    }
                }

                if (orderRes) {
                    const orderData = orderRes.data?.data || orderRes.data || orderRes;
                    setOrder(orderData);
                }

            } catch (error) {
                console.error("Lỗi fetch data:", error);
                toast.error("Lỗi tải dữ liệu.");
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [orderId]);

    // --- LOGIC TRẠNG THÁI ---
    const hasSubmitted = album?.status === 'selection_completed' || album?.status === 'finalized';
    const currentPhotos = activeTab === 'edited' ? (album?.edited_photos || []) : (album?.photos || []);

    // --- HANDLERS ---
    const togglePhoto = (id) => {
        if (activeTab !== 'raw') return;
        setSelectedIds(prev => 
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    const handleSubmit = async () => {
        if (selectedIds.length === 0) return toast.warning("Vui lòng chọn ít nhất 1 ảnh gốc.");
        
        try {
            setSubmitting(true);
            await axiosUser.put(`/albums/${orderId}/selection`, { selectedIds });
            toast.success("Đã gửi lựa chọn thành công!");
            setAlbum(prev => ({ ...prev, status: 'selection_completed' }));
        } catch (error) {
            toast.error("Lỗi khi gửi.");
        } finally {
            setSubmitting(false);
        }
    };

    const handleDownload = async (url, filename) => {
        try {
            const fullUrl = url.startsWith('http') ? url : `http://localhost:5000${url}`;
            const response = await fetch(fullUrl);
            const blob = await response.blob();
            const link = document.createElement("a");
            link.href = window.URL.createObjectURL(blob);
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } catch (error) {
            console.error(error);
            toast.error("Lỗi khi tải ảnh.");
        }
    };

    // ✅ [THÊM] Các hàm xử lý Chia sẻ
    const handleShare = async () => {
        if (!album) return toast.warning("Chưa có album để chia sẻ.");
        try {
            // Gọi API tạo link chia sẻ
            const res = await axiosUser.post(`/albums/${album._id}/share`);
            const data = res.data || res; 
            
            if (data && data.shareLink) {
                setShareLink(data.shareLink);
                setShowShareModal(true);
                setCopied(false);
                toast.success("Đã tạo link chia sẻ!");
            } else {
                toast.error("Server không trả về link chia sẻ.");
            }
        } catch (error) { 
            console.error(error);
            toast.error(error.response?.data?.message || "Lỗi tạo link chia sẻ."); 
        }
    };
    
    const copyToClipboard = () => { 
        navigator.clipboard.writeText(shareLink); 
        setCopied(true); 
        setTimeout(() => setCopied(false), 2000); 
    };

    // Lightbox Helpers
    const openLightbox = (index) => { setCurrentIndex(index); setLightboxOpen(true); document.body.style.overflow = 'hidden'; };
    const closeLightbox = () => { setLightboxOpen(false); document.body.style.overflow = 'auto'; };
    const nextImg = (e) => { e.stopPropagation(); setCurrentIndex((prev) => (prev + 1) % currentPhotos.length); };
    const prevImg = (e) => { e.stopPropagation(); setCurrentIndex((prev) => (prev - 1 + currentPhotos.length) % currentPhotos.length); };
    
    const getImgUrl = (url) => {
        if (!url) return '';
        return url.startsWith('http') ? url : `http://localhost:5000${url}`;
    };

    // --- RENDER ---
    if (loading) return <div className="sp-loading"><Loader2 className="spinner"/> Đang tải album...</div>;
    
    if (!album) {
        return (
            <MainLayout>
                <div className="sp-error">
                    <Package size={48} style={{marginBottom: 10, opacity: 0.5}}/>
                    <p>Không tìm thấy album.</p>
                    <button onClick={() => navigate(-1)} className="btn-back-error">Quay lại</button>
                </div>
            </MainLayout>
        );
    }

    return (
        <MainLayout>
            <div className="sp-wrapper">
                <div className="sp-container">
                    
                    <div className="sp-header-mobile">
                        <button onClick={() => navigate(-1)} className="btn-back"><ArrowLeft size={20}/></button>
                        <h3>Chi tiết Album</h3>
                        {/* ✅ [THÊM] Nút Share Mobile */}
                        <button onClick={handleShare} className="btn-icon-only" style={{marginLeft: 'auto', background:'none', border:'none'}}>
                            <Share2 size={20} color="#374151"/>
                        </button>
                    </div>

                    <div className="sp-layout">
                        {/* --- SIDEBAR INFO --- */}
                        <div className="sp-sidebar">
                            <div className="sp-info-card">
                                <button onClick={() => navigate(-1)} className="btn-back-desktop">
                                    <ArrowLeft size={18}/> Quay lại
                                </button>
                                
                                <div className="sp-info-header">
                                    <h2>Thông tin đơn hàng</h2>
                                    <span className="order-id">#{order?.order_id || "FREELANCE"}</span>
                                </div>

                                <div className="sp-info-list">
                                    <div className="info-item"><Package size={16} className="icon"/><div><label>Gói dịch vụ</label><p>{order?.service_package_id?.TenGoi || "Job Ngoài"}</p></div></div>
                                    <div className="info-item"><User size={16} className="icon"/><div><label>Nhiếp ảnh gia</label><p>{album.photographer_id?.HoTen || "..."}</p></div></div>
                                    <div className="info-item"><Calendar size={16} className="icon"/><div><label>Ngày tạo</label><p>{new Date(album.createdAt).toLocaleDateString('vi-VN')}</p></div></div>
                                </div>

                                {/* Thống kê */}
                                <div className="sp-stats-box">
                                    <div className="stat-row"><span>Tổng ảnh gốc:</span><strong>{album.photos?.length || 0}</strong></div>
                                    <div className="stat-row highlight"><span>Bạn đã chọn:</span><strong>{selectedIds.length} ảnh</strong></div>
                                    {album.edited_photos?.length > 0 && (
                                        <div className="stat-row final"><span>Ảnh đã chỉnh:</span><strong>{album.edited_photos.length} ảnh</strong></div>
                                    )}
                                </div>

                                {/* ✅ [THÊM] Nút Chia Sẻ Desktop */}
                                <button 
                                    onClick={handleShare}
                                    style={{
                                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                                        width: '100%', padding: '10px', borderRadius: '8px',
                                        backgroundColor: '#f3f4f6', color: '#374151', border: '1px solid #e5e7eb',
                                        cursor: 'pointer', fontWeight: 500, marginTop: '15px'
                                    }}
                                >
                                    <Share2 size={16}/> Chia sẻ Album
                                </button>

                                {/* Nút Gửi */}
                                {activeTab === 'raw' && (
                                    <button className="btn-submit-side" onClick={handleSubmit} disabled={submitting}>
                                        {submitting ? <Loader2 className="spinner-sm"/> : (hasSubmitted ? <RefreshCw size={16}/> : <Send size={16}/>)}
                                        {hasSubmitted ? " Cập nhật lựa chọn" : " Gửi cho Thợ"}
                                    </button>
                                )}
                                
                                {hasSubmitted && activeTab === 'raw' && (
                                    <p style={{marginTop: 10, fontSize: '0.85rem', color: '#10b981', textAlign: 'center'}}>
                                        Bạn đã gửi trước đó. Có thể chọn lại và gửi cập nhật.
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* --- MAIN CONTENT --- */}
                        <div className="sp-main">
                            <div className="sp-tabs">
                                <button className={`sp-tab-btn ${activeTab === 'raw' ? 'active' : ''}`} onClick={() => setActiveTab('raw')}>
                                    <ImageIcon size={18}/> Ảnh Gốc ({album.photos?.length || 0})
                                </button>
                                
                                {album.edited_photos && album.edited_photos.length > 0 && (
                                    <button className={`sp-tab-btn ${activeTab === 'edited' ? 'active' : ''}`} onClick={() => setActiveTab('edited')}>
                                        <Star size={18}/> Ảnh Đã Chỉnh ({album.edited_photos.length})
                                    </button>
                                )}
                            </div>

                            <div className="sp-grid-header">
                                <h3>{activeTab === 'raw' ? "Kho ảnh gốc" : "Ảnh đã chỉnh sửa (Hoàn thiện)"}</h3>
                                <p>{activeTab === 'raw' ? "Hãy chọn những tấm ảnh bạn ưng ý nhất để thợ chỉnh sửa." : "Đây là những bức ảnh đã được chỉnh sửa hoàn thiện. Bạn có thể tải về."}</p>
                            </div>

                            {/* GRID PHOTOS */}
                            {currentPhotos.length > 0 ? (
                                <div className="sp-masonry-grid">
                                    {currentPhotos.map((photo, index) => {
                                        const isSelected = activeTab === 'raw' && selectedIds.includes(photo._id);
                                        return (
                                            <div key={photo._id} className={`sp-photo-item ${isSelected ? 'selected' : ''}`}>
                                                <div className="img-wrapper" onClick={() => openLightbox(index)}>
                                                    <img src={getImgUrl(photo.url)} alt="thumb" loading="lazy" />
                                                    <div className="hover-overlay">
                                                        <Maximize2 size={24} color="white"/>
                                                    </div>
                                                </div>
                                                <button className="btn-download-mini" onClick={(e) => {e.stopPropagation(); handleDownload(photo.url, photo.filename)}} title="Tải ảnh này">
                                                    <Download size={14}/>
                                                </button>
                                                {activeTab === 'raw' && (
                                                    <div className="select-indicator" onClick={(e) => { e.stopPropagation(); togglePhoto(photo._id); }}>
                                                        <div className={`checkbox-circle ${isSelected ? 'checked' : ''}`}>
                                                            {isSelected && <CheckCircle2 size={16} color="white"/>}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        )
                                    })}
                                </div>
                            ) : (
                                <div className="empty-state">
                                    <p>Chưa có ảnh nào trong mục này.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* --- LIGHTBOX --- */}
                {lightboxOpen && (
                    <div className="lb-overlay" onClick={closeLightbox}>
                        <button className="lb-close"><X size={30}/></button>
                        <div className="lb-content" onClick={e => e.stopPropagation()}>
                            <button className="lb-nav prev" onClick={prevImg}><ChevronLeft size={40}/></button>
                            <div className="lb-img-container">
                                <img src={getImgUrl(currentPhotos[currentIndex].url)} alt="Full" />
                                <div className="lb-info-bar">
                                    <span>{currentIndex + 1} / {currentPhotos.length}</span>
                                    <div className="lb-actions-group">
                                        {activeTab === 'raw' && (
                                            <button className={`btn-lb-select ${selectedIds.includes(currentPhotos[currentIndex]._id) ? 'active' : ''}`} onClick={() => togglePhoto(currentPhotos[currentIndex]._id)}>
                                                {selectedIds.includes(currentPhotos[currentIndex]._id) ? <><CheckCircle2 size={16}/> Đã chọn</> : "Chọn ảnh này"}
                                            </button>
                                        )}
                                        <button className="btn-lb-download" onClick={() => handleDownload(currentPhotos[currentIndex].url, currentPhotos[currentIndex].filename)}>
                                            <Download size={16}/> Tải về
                                        </button>
                                    </div>
                                </div>
                            </div>
                            <button className="lb-nav next" onClick={nextImg}><ChevronRight size={40}/></button>
                        </div>
                    </div>
                )}

                {/* ✅ [THÊM] MODAL CHIA SẺ */}
                {showShareModal && (
                    <div className="modal-overlay" style={{position:'fixed', top:0, left:0, right:0, bottom:0, background:'rgba(0,0,0,0.5)', zIndex:9999, display:'flex', alignItems:'center', justifyContent:'center'}} onClick={() => setShowShareModal(false)}>
                        <div className="modal-content share-modal" style={{background:'white', padding:'24px', borderRadius:'12px', width:'90%', maxWidth:'400px'}} onClick={e => e.stopPropagation()}>
                            <div className="modal-header" style={{display:'flex', justifyContent:'space-between', marginBottom:'16px'}}>
                                <h2 style={{fontSize:'1.25rem', fontWeight:600}}>Chia sẻ Album</h2>
                                <button onClick={() => setShowShareModal(false)} style={{background:'none', border:'none', cursor:'pointer'}}><X size={24}/></button>
                            </div>
                            <div className="modal-body">
                                <p className="share-desc" style={{marginBottom:'12px', color:'#4b5563'}}>Gửi liên kết này cho bạn bè hoặc người thân:</p>
                                <div className="share-input-group" style={{display:'flex', gap:'8px', marginBottom:'16px'}}>
                                    <input 
                                        type="text" 
                                        readOnly 
                                        value={shareLink} 
                                        onClick={(e) => e.target.select()} 
                                        style={{flex:1, padding:'8px 12px', border:'1px solid #d1d5db', borderRadius:'6px', outline:'none'}}
                                    />
                                    <button 
                                        onClick={copyToClipboard} 
                                        className={copied ? "copied" : ""}
                                        style={{padding:'8px 12px', border:'1px solid #d1d5db', borderRadius:'6px', background: copied ? '#10b981' : '#f3f4f6', color: copied ? 'white' : 'inherit', cursor:'pointer', display:'flex', alignItems:'center'}}
                                    >
                                        {copied ? <Check size={20}/> : <Copy size={20}/>}
                                    </button>
                                </div>
                                <div className="share-actions">
                                    <button 
                                        className="btn-open-link" 
                                        onClick={() => window.open(shareLink, '_blank')}
                                        style={{width:'100%', padding:'10px', background:'#2563eb', color:'white', border:'none', borderRadius:'6px', cursor:'pointer', fontWeight:500}}
                                    >
                                        Mở liên kết ngay
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

            </div>
        </MainLayout>
    );
};

export default SelectionPhoto;