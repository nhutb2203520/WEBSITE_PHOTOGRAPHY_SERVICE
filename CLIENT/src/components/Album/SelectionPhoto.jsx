import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { 
    CheckCircle2, Loader2, Send, ArrowLeft, Maximize2, X, 
    ChevronLeft, ChevronRight, Calendar, User, MapPin, Package, RefreshCw,
    Download, Image as ImageIcon, Star
} from "lucide-react";
import "./SelectionPhoto.css";
import axiosUser from "../../apis/axiosUser";

// --- IMPORT LAYOUT COMPONENTS ---
import Header from "../Header/Header";
import Sidebar from "../Sidebar/Sidebar";
import Footer from "../Footer/Footer";

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

    // --- FETCH DATA ---
    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                console.log("🚀 Bắt đầu tải dữ liệu cho Order:", orderId);
                
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
                    
                    // Nếu có ảnh đã chỉnh sửa -> Mặc định tab Edited để khách xem thành quả
                    if (finalAlbum.edited_photos && finalAlbum.edited_photos.length > 0) {
                        setActiveTab('edited');
                    }

                    // Load ảnh gốc đã chọn từ trước
                    if (finalAlbum.photos) {
                        const preSelected = finalAlbum.photos
                            .filter(p => p.is_selected).map(p => p._id);
                        setSelectedIds(preSelected);
                    }
                }

                // Xử lý Order
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
    // hasSubmitted: Khách đã từng gửi lựa chọn -> Hiện nút "Cập nhật"
    const hasSubmitted = album?.status === 'selection_completed' || album?.status === 'finalized';
    
    // Helper lấy danh sách ảnh hiện tại theo Tab
    const currentPhotos = activeTab === 'edited' ? (album?.edited_photos || []) : (album?.photos || []);

    // --- HANDLERS ---
    const togglePhoto = (id) => {
        // Chỉ cho phép chọn ở tab Ảnh Gốc
        if (activeTab !== 'raw') return;
        
        // Luôn cho phép chọn (Không khóa)
        setSelectedIds(prev => 
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    const handleSubmit = async () => {
        if (selectedIds.length === 0) return toast.warning("Vui lòng chọn ít nhất 1 ảnh gốc.");
        
        const confirmMsg = hasSubmitted 
            ? `Bạn đang cập nhật lại danh sách chọn (${selectedIds.length} ảnh). Xác nhận gửi lại?`
            : `Xác nhận gửi ${selectedIds.length} ảnh này cho nhiếp ảnh gia?`;

        if (!window.confirm(confirmMsg)) return;

        try {
            setSubmitting(true);
            await axiosUser.put(`/albums/${orderId}/selection`, { selectedIds });
            toast.success("Đã gửi lựa chọn thành công!");
            
            // Cập nhật trạng thái local
            setAlbum(prev => ({ ...prev, status: 'selection_completed' }));
        } catch (error) {
            toast.error("Lỗi khi gửi.");
        } finally {
            setSubmitting(false);
        }
    };

    // --- DOWNLOAD HANDLER ---
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
            <div className="layout-wrapper">
                <Header />
                <div className="layout-body">
                    <div className="layout-sidebar"><Sidebar /></div>
                    <main className="layout-content">
                        <div className="sp-error">
                            <Package size={48} style={{marginBottom: 10, opacity: 0.5}}/>
                            <p>Không tìm thấy album.</p>
                            <button onClick={() => navigate(-1)} className="btn-back-error">Quay lại</button>
                        </div>
                    </main>
                </div>
            </div>
        );
    }

    return (
        <div className="layout-wrapper">
            <Header />
            <div className="layout-body">
                <div className="layout-sidebar">
                    <Sidebar />
                </div>

                <main className="layout-content">
                    <div className="sp-wrapper">
                        <div className="sp-container">
                            
                            <div className="sp-header-mobile">
                                <button onClick={() => navigate(-1)} className="btn-back"><ArrowLeft size={20}/></button>
                                <h3>Chi tiết Album</h3>
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
                                            <span className="order-id">#{order?.order_id}</span>
                                        </div>

                                        <div className="sp-info-list">
                                            <div className="info-item"><Package size={16} className="icon"/><div><label>Gói dịch vụ</label><p>{order?.service_package_id?.TenGoi || "..."}</p></div></div>
                                            <div className="info-item"><User size={16} className="icon"/><div><label>Nhiếp ảnh gia</label><p>{order?.photographer_id?.HoTen || "..."}</p></div></div>
                                            <div className="info-item"><Calendar size={16} className="icon"/><div><label>Ngày chụp</label><p>{order ? new Date(order.booking_date).toLocaleDateString('vi-VN') : "..."}</p></div></div>
                                        </div>

                                        {/* Thống kê */}
                                        <div className="sp-stats-box">
                                            <div className="stat-row"><span>Tổng ảnh gốc:</span><strong>{album.photos?.length || 0}</strong></div>
                                            <div className="stat-row highlight"><span>Bạn đã chọn:</span><strong>{selectedIds.length} ảnh</strong></div>
                                            {album.edited_photos?.length > 0 && (
                                                <div className="stat-row final"><span>Ảnh đã chỉnh:</span><strong>{album.edited_photos.length} ảnh</strong></div>
                                            )}
                                        </div>

                                        {/* Nút Gửi (Chỉ hiện ở tab Raw để khách chọn ảnh) */}
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
                                    {/* TABS SWITCHER */}
                                    <div className="sp-tabs">
                                        <button 
                                            className={`sp-tab-btn ${activeTab === 'raw' ? 'active' : ''}`}
                                            onClick={() => setActiveTab('raw')}
                                        >
                                            <ImageIcon size={18}/> Ảnh Gốc ({album.photos?.length || 0})
                                        </button>
                                        
                                        {album.edited_photos && album.edited_photos.length > 0 && (
                                            <button 
                                                className={`sp-tab-btn ${activeTab === 'edited' ? 'active' : ''}`}
                                                onClick={() => setActiveTab('edited')}
                                            >
                                                <Star size={18}/> Ảnh Đã Chỉnh ({album.edited_photos.length})
                                            </button>
                                        )}
                                    </div>

                                    {/* GRID HEADER */}
                                    <div className="sp-grid-header">
                                        <h3>{activeTab === 'raw' ? "Kho ảnh gốc" : "Ảnh đã chỉnh sửa (Hoàn thiện)"}</h3>
                                        <p>
                                            {activeTab === 'raw' 
                                                ? "Hãy chọn những tấm ảnh bạn ưng ý nhất để thợ chỉnh sửa." 
                                                : "Đây là những bức ảnh đã được chỉnh sửa hoàn thiện. Bạn có thể tải về."}
                                        </p>
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
                                                        
                                                        {/* Nút Download (Luôn hiện) */}
                                                        <button 
                                                            className="btn-download-mini" 
                                                            onClick={(e) => {e.stopPropagation(); handleDownload(photo.url, photo.filename)}}
                                                            title="Tải ảnh này"
                                                        >
                                                            <Download size={14}/>
                                                        </button>

                                                        {/* Checkbox (Chỉ hiện ở tab Raw, không khóa) */}
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
                                                {/* Nút Chọn (Chỉ hiện ở tab Raw) */}
                                                {activeTab === 'raw' && (
                                                    <button 
                                                        className={`btn-lb-select ${selectedIds.includes(currentPhotos[currentIndex]._id) ? 'active' : ''}`}
                                                        onClick={() => togglePhoto(currentPhotos[currentIndex]._id)}
                                                    >
                                                        {selectedIds.includes(currentPhotos[currentIndex]._id) ? 
                                                            <><CheckCircle2 size={16}/> Đã chọn</> : "Chọn ảnh này"}
                                                    </button>
                                                )}

                                                {/* Nút Tải về */}
                                                <button 
                                                    className="btn-lb-download"
                                                    onClick={() => handleDownload(currentPhotos[currentIndex].url, currentPhotos[currentIndex].filename)}
                                                >
                                                    <Download size={16}/> Tải về
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                    <button className="lb-nav next" onClick={nextImg}><ChevronRight size={40}/></button>
                                </div>
                            </div>
                        )}

                        {/* MOBILE FOOTER (Chỉ hiện ở tab Raw) */}
                        {activeTab === 'raw' && (
                            <div className="sp-mobile-footer">
                                <span>Đã chọn: <b>{selectedIds.length}</b></span>
                                <button onClick={handleSubmit} disabled={submitting}>
                                    {submitting ? "..." : (hasSubmitted ? "Gửi lại" : "Gửi đi")} <Send size={16}/>
                                </button>
                            </div>
                        )}
                    </div>
                    
                    <Footer />
                </main>
            </div>
        </div>
    );
};

export default SelectionPhoto;