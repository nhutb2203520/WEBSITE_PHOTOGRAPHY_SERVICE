import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { 
    CheckCircle2, Loader2, Send, ArrowLeft, Maximize2, X, 
    ChevronLeft, ChevronRight, Calendar, User, MapPin, Package 
} from "lucide-react";
import "./SelectionPhoto.css";
import axiosUser from "../../apis/axiosUser";

const SelectionPhoto = () => {
    const { orderId } = useParams();
    const navigate = useNavigate();

    // --- STATE ---
    const [album, setAlbum] = useState(null);
    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const [selectedIds, setSelectedIds] = useState([]);
    const [submitting, setSubmitting] = useState(false);

    // Lightbox State
    const [lightboxOpen, setLightboxOpen] = useState(false);
    const [currentIndex, setCurrentIndex] = useState(0);

    // --- FETCH DATA (ĐÃ SỬA LOGIC NHẬN DỮ LIỆU) ---
    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                console.log("🚀 Bắt đầu tải dữ liệu cho Order:", orderId);
                
                // Gọi song song 2 API
                const [albumRes, orderRes] = await Promise.all([
                    axiosUser.get(`/albums/${orderId}`).catch(err => {
                        console.warn("Lỗi lấy Album:", err);
                        return null;
                    }),
                    axiosUser.get(`/orders/${orderId}`).catch(err => {
                        console.warn("Lỗi lấy Order:", err);
                        return null;
                    })
                ]);

                // --- DEBUG LOG ---
                console.log("📦 Album Response:", albumRes);
                console.log("📦 Order Response:", orderRes);

                // --- XỬ LÝ ALBUM (FIX QUAN TRỌNG) ---
                let finalAlbum = null;
                if (albumRes) {
                    // Trường hợp 1: axios chuẩn + backend chuẩn ({success: true, data: {...}})
                    if (albumRes.data && albumRes.data.data) {
                        finalAlbum = albumRes.data.data;
                    } 
                    // Trường hợp 2: axios interceptor đã bóc 1 lớp ({success: true, data: {...}})
                    else if (albumRes.success === true && albumRes.data) {
                        finalAlbum = albumRes.data;
                    }
                    // Trường hợp 3: Trả về thẳng object
                    else if (albumRes.data && albumRes.data._id) {
                        finalAlbum = albumRes.data;
                    }
                    // Trường hợp 4: Interceptor bóc hết, trả về thẳng data
                    else if (albumRes._id) {
                        finalAlbum = albumRes;
                    }
                }

                if (finalAlbum) {
                    console.log("✅ Đã set Album vào State:", finalAlbum);
                    setAlbum(finalAlbum);
                    // Load ảnh đã chọn trước đó
                    if (finalAlbum.photos) {
                        const preSelected = finalAlbum.photos
                            .filter(p => p.is_selected).map(p => p._id);
                        setSelectedIds(preSelected);
                    }
                } else {
                    console.warn("⚠️ Không tìm thấy dữ liệu album hợp lệ.");
                }

                // --- XỬ LÝ ORDER ---
                if (orderRes) {
                    const orderData = orderRes.data?.data || orderRes.data || orderRes;
                    setOrder(orderData);
                }

            } catch (error) {
                console.error("❌ Lỗi fetch data:", error);
                toast.error("Lỗi tải dữ liệu.");
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [orderId]);

    // --- HANDLERS ---
    const togglePhoto = (id) => {
        if (album?.status === 'finalized' || album?.status === 'selection_completed') return; 
        setSelectedIds(prev => 
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    const handleSubmit = async () => {
        if (selectedIds.length === 0) return toast.warning("Vui lòng chọn ít nhất 1 ảnh.");
        if (!window.confirm(`Xác nhận gửi ${selectedIds.length} ảnh này cho nhiếp ảnh gia chỉnh sửa?`)) return;

        try {
            setSubmitting(true);
            await axiosUser.put(`/albums/${orderId}/selection`, { selectedIds });
            toast.success("Đã gửi lựa chọn thành công! Vui lòng chờ thợ chỉnh sửa.");
            navigate(-1); 
        } catch (error) {
            toast.error("Lỗi khi gửi.");
        } finally {
            setSubmitting(false);
        }
    };

    // Lightbox Helpers
    const openLightbox = (index) => { setCurrentIndex(index); setLightboxOpen(true); document.body.style.overflow = 'hidden'; };
    const closeLightbox = () => { setLightboxOpen(false); document.body.style.overflow = 'auto'; };
    const nextImg = (e) => { e.stopPropagation(); setCurrentIndex((currentIndex + 1) % album.photos.length); };
    const prevImg = (e) => { e.stopPropagation(); setCurrentIndex((currentIndex - 1 + album.photos.length) % album.photos.length); };
    
    const getImgUrl = (url) => {
        if (!url) return '';
        return url.startsWith('http') ? url : `http://localhost:5000${url}`;
    };

    if (loading) return <div className="sp-loading"><Loader2 className="spinner"/> Đang tải album...</div>;
    
    // Nếu không có album hoặc không có ảnh
    if (!album || !album.photos || album.photos.length === 0) {
        return (
            <div className="sp-error">
                <Package size={48} style={{marginBottom: 10, opacity: 0.5}}/>
                <p>Chưa có ảnh nào được tải lên cho đơn hàng này.</p>
                <button onClick={() => navigate(-1)} className="btn-back-error">Quay lại</button>
            </div>
        );
    }

    const isLocked = album.status === 'finalized' || album.status === 'selection_completed';

    return (
        <div className="sp-wrapper">
            <div className="sp-container">
                {/* HEADER MOBILE */}
                <div className="sp-header-mobile">
                    <button onClick={() => navigate(-1)} className="btn-back"><ArrowLeft size={20}/></button>
                    <h3>Chọn ảnh</h3>
                </div>

                <div className="sp-layout">
                    {/* --- SIDEBAR: THÔNG TIN ĐƠN HÀNG --- */}
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
                                <div className="info-item">
                                    <Package size={16} className="icon"/>
                                    <div>
                                        <label>Gói dịch vụ</label>
                                        <p>{order?.service_package_id?.TenGoi || "..."}</p>
                                    </div>
                                </div>
                                <div className="info-item">
                                    <User size={16} className="icon"/>
                                    <div>
                                        <label>Nhiếp ảnh gia</label>
                                        <p>{order?.photographer_id?.HoTen || "Chưa cập nhật"}</p>
                                    </div>
                                </div>
                                <div className="info-item">
                                    <Calendar size={16} className="icon"/>
                                    <div>
                                        <label>Ngày chụp</label>
                                        <p>{order ? new Date(order.booking_date).toLocaleDateString('vi-VN') : "..."}</p>
                                    </div>
                                </div>
                                <div className="info-item">
                                    <MapPin size={16} className="icon"/>
                                    <div>
                                        <label>Địa điểm</label>
                                        <p>{order?.location?.district || "..."}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="sp-stats-box">
                                <div className="stat-row">
                                    <span>Tổng số ảnh:</span>
                                    <strong>{album.photos.length}</strong>
                                </div>
                                <div className="stat-row highlight">
                                    <span>Bạn đã chọn:</span>
                                    <strong>{selectedIds.length} ảnh</strong>
                                </div>
                            </div>

                            {!isLocked ? (
                                <button className="btn-submit-side" onClick={handleSubmit} disabled={submitting}>
                                    {submitting ? <Loader2 className="spinner-sm"/> : <Send size={16}/>}
                                    Gửi cho Thợ chỉnh sửa
                                </button>
                            ) : (
                                <div className="locked-alert">
                                    <CheckCircle2 size={16}/> Bạn đã gửi lựa chọn.
                                </div>
                            )}
                        </div>
                    </div>

                    {/* --- MAIN: LƯỚI ẢNH --- */}
                    <div className="sp-main">
                        <div className="sp-grid-header">
                            <h3>Album ảnh gốc</h3>
                            <p>Hãy chọn những tấm ảnh bạn ưng ý nhất để chúng tôi chỉnh sửa.</p>
                        </div>

                        <div className="sp-masonry-grid">
                            {album.photos.map((photo, index) => {
                                const isSelected = selectedIds.includes(photo._id);
                                return (
                                    <div key={photo._id} className={`sp-photo-item ${isSelected ? 'selected' : ''}`}>
                                        <div className="img-wrapper" onClick={() => openLightbox(index)}>
                                            <img src={getImgUrl(photo.url)} alt="thumb" loading="lazy" />
                                            <div className="hover-overlay"><Maximize2 size={24} color="white"/></div>
                                        </div>
                                        
                                        {!isLocked && (
                                            <div className="select-indicator" onClick={(e) => { e.stopPropagation(); togglePhoto(photo._id); }}>
                                                <div className={`checkbox-circle ${isSelected ? 'checked' : ''}`}>
                                                    {isSelected && <CheckCircle2 size={16} color="white"/>}
                                                </div>
                                            </div>
                                        )}
                                        {isLocked && isSelected && <span className="badge-locked">Đã chọn</span>}
                                    </div>
                                )
                            })}
                        </div>
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
                            <img src={getImgUrl(album.photos[currentIndex].url)} alt="Full" />
                            <div className="lb-info-bar">
                                <span>{currentIndex + 1} / {album.photos.length}</span>
                                {!isLocked && (
                                    <button 
                                        className={`btn-lb-select ${selectedIds.includes(album.photos[currentIndex]._id) ? 'active' : ''}`}
                                        onClick={() => togglePhoto(album.photos[currentIndex]._id)}
                                    >
                                        {selectedIds.includes(album.photos[currentIndex]._id) ? 
                                            <><CheckCircle2 size={16}/> Đã chọn</> : "Chọn ảnh này"}
                                    </button>
                                )}
                            </div>
                        </div>

                        <button className="lb-nav next" onClick={nextImg}><ChevronRight size={40}/></button>
                    </div>
                </div>
            )}

            {/* MOBILE FOOTER (Chỉ hiện trên mobile) */}
            {!isLocked && (
                <div className="sp-mobile-footer">
                    <span>Đã chọn: <b>{selectedIds.length}</b></span>
                    <button onClick={handleSubmit} disabled={submitting}>
                        {submitting ? "..." : "Gửi đi"} <Send size={16}/>
                    </button>
                </div>
            )}
        </div>
    );
};

export default SelectionPhoto;