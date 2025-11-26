import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { 
    ArrowLeft, Calendar, MapPin, Clock, User, Package, 
    UploadCloud, Trash2, Edit2, Save, X, Image as ImageIcon,
    ChevronLeft, ChevronRight
} from 'lucide-react';

// API & Components
import albumApi from '../../apis/albumApi'; 
import orderApi from '../../apis/orderService';
import Header from '../Header/Header';
import Sidebar from '../Sidebar/Sidebar';
import Footer from '../Footer/Footer';

// ✅ SỬA LỖI TẠI ĐÂY: Thêm "./" và đảm bảo tên file CSS đúng với file bạn đang có
// Nếu bạn vẫn dùng file css cũ, hãy đổi thành: import './PhotographerAlbumManager.css';
import './DetailAlbumManager.css'; 

export default function DetailAlbumManager() { // Đổi tên function component cho khớp tên file
    const { orderId } = useParams();
    const navigate = useNavigate();
    const fileInputRef = useRef(null);

    // --- State ---
    const [order, setOrder] = useState(null);
    const [album, setAlbum] = useState(null);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editData, setEditData] = useState({ title: '', description: '' });
    const [lightboxIndex, setLightboxIndex] = useState(null);

    // --- Effects ---
    useEffect(() => {
        fetchData();
    }, [orderId]);

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (lightboxIndex === null) return;
            if (e.key === 'Escape') closeLightbox();
            if (e.key === 'ArrowRight') nextPhoto(e);
            if (e.key === 'ArrowLeft') prevPhoto(e);
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [lightboxIndex]);

    // --- Fetch Data ---
    const fetchData = async () => {
        try {
            setLoading(true);
            const [orderRes, albumRes] = await Promise.all([
                orderApi.getOrderDetail(orderId).catch(() => null),
                albumApi.getAlbumDetail(orderId).catch(() => null)
            ]);

            if (orderRes) {
                const orderData = orderRes.data?.data || orderRes.data || orderRes;
                setOrder(orderData);
            }

            let finalAlbumData = null;
            if (albumRes) {
                if (albumRes.data && albumRes.data.data) finalAlbumData = albumRes.data.data;
                else if (albumRes.success === true && albumRes.data) finalAlbumData = albumRes.data;
                else if (albumRes.data && albumRes.data._id) finalAlbumData = albumRes.data;
            }

            if (finalAlbumData) {
                setAlbum(finalAlbumData);
                setEditData({ title: finalAlbumData.title || '', description: finalAlbumData.description || '' });
            } else {
                setAlbum(null);
            }
        } catch (error) {
            console.error(error);
            toast.error("Không thể tải thông tin.");
        } finally {
            setLoading(false);
        }
    };

    // --- Handlers ---
    const handleFileChange = async (e) => {
        const files = Array.from(e.target.files);
        if (files.length === 0) return;
        const formData = new FormData();
        files.forEach(file => formData.append('photos', file));
        if (!album) {
            formData.append('title', `Album đơn hàng #${order?.order_id}`);
            formData.append('description', `Ảnh chụp cho khách hàng ${order?.customer_id?.HoTen || ''}`);
        }
        try {
            setUploading(true);
            const res = await albumApi.uploadPhotos(orderId, formData);
            toast.success(`Đã tải lên ${files.length} ảnh!`);
            const newAlbumData = res.data?.data || res.data;
            setAlbum(newAlbumData);
            if(fileInputRef.current) fileInputRef.current.value = '';
        } catch (error) {
            toast.error("Lỗi khi tải ảnh lên.");
        } finally {
            setUploading(false);
        }
    };

    const handleDeletePhoto = async (photoId) => {
        if (!window.confirm("Bạn xóa ảnh này?")) return;
        try {
            await albumApi.deletePhoto(orderId, photoId);
            setAlbum(prev => ({ ...prev, photos: prev.photos.filter(p => p._id !== photoId) }));
            toast.success("Đã xóa ảnh.");
            if (lightboxIndex !== null) closeLightbox();
        } catch (error) { toast.error("Lỗi xóa ảnh."); }
    };

    const handleSaveInfo = async () => {
        try {
            await albumApi.updateAlbumInfo(orderId, editData);
            setAlbum(prev => ({ ...prev, ...editData }));
            setIsEditing(false);
            toast.success("Đã lưu thông tin.");
        } catch (error) { toast.error("Lỗi cập nhật."); }
    };

    const handleDeleteAlbum = async () => {
        if (!window.confirm("CẢNH BÁO: Xóa album sẽ mất hết ảnh!")) return;
        try {
            await albumApi.deleteAlbum(orderId);
            setAlbum(null);
            toast.success("Đã xóa album.");
        } catch (error) { toast.error("Lỗi xóa album."); }
    };

    // --- Lightbox Helpers ---
    const getPhotoUrl = (url) => url.startsWith('http') ? url : `http://localhost:5000${url}`;
    const openLightbox = (index) => { setLightboxIndex(index); document.body.style.overflow = 'hidden'; };
    const closeLightbox = () => { setLightboxIndex(null); document.body.style.overflow = 'auto'; };
    const nextPhoto = (e) => { e?.stopPropagation(); if (album?.photos) setLightboxIndex((prev) => (prev + 1) % album.photos.length); };
    const prevPhoto = (e) => { e?.stopPropagation(); if (album?.photos) setLightboxIndex((prev) => (prev - 1 + album.photos.length) % album.photos.length); };

    if (loading) return <div className="pam-loading">Đang tải dữ liệu...</div>;
    if (!order) return <div className="pam-error">Không tìm thấy đơn hàng!</div>;

    return (
        <div className="layout-wrapper">
            {/* Header Toàn cục */}
            <Header />

            <div className="layout-body">
                {/* Sidebar Menu (Trái) */}
                <div className="layout-sidebar">
                    <Sidebar />
                </div>

                {/* Nội dung chính (Phải) */}
                <main className="layout-content">
                    <div className="pam-container">
                        <div className="pam-header">
                            <button onClick={() => navigate(-1)} className="btn-back">
                                <ArrowLeft size={20} /> Quay lại
                            </button>
                            <h1>Chi tiết quản lý đơn hàng</h1>
                        </div>

                        <div className="pam-content">
                            {/* Cột trái: Thông tin đơn hàng (Info Sidebar) */}
                            <div className="pam-info-column">
                                <div className="info-card">
                                    <h3 className="card-title">Thông tin đơn hàng</h3>
                                    <div className="info-row">
                                        <span className="label">Mã đơn:</span>
                                        <span className="value highlight">#{order.order_id}</span>
                                    </div>
                                    <div className="info-group">
                                        <div className="info-item">
                                            <User size={16} className="icon"/>
                                            <div>
                                                <p className="sub-label">Khách hàng</p>
                                                <p className="main-text">{order.customer_id?.HoTen || "Khách vãng lai"}</p>
                                                <p className="sub-text">{order.customer_id?.Email}</p>
                                            </div>
                                        </div>
                                        <div className="info-item">
                                            <Package size={16} className="icon"/>
                                            <div>
                                                <p className="sub-label">Gói dịch vụ</p>
                                                <p className="main-text">{order.service_package_id?.TenGoi}</p>
                                            </div>
                                        </div>
                                        <div className="info-item">
                                            <Calendar size={16} className="icon"/>
                                            <div>
                                                <p className="sub-label">Thời gian</p>
                                                <p className="main-text">{new Date(order.booking_date).toLocaleDateString('vi-VN')} - {order.start_time}</p>
                                            </div>
                                        </div>
                                        <div className="info-item">
                                            <MapPin size={16} className="icon"/>
                                            <div>
                                                <p className="sub-label">Địa điểm</p>
                                                <p className="main-text">{order.location?.district || "N/A"}</p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="price-box">
                                        <span>Tổng tiền:</span>
                                        <span className="price-value">
                                            {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(order.final_amount)}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Cột phải: Album và Ảnh */}
                            <div className="pam-album-column">
                                <div className="album-header-card">
                                    {!album ? (
                                        <div className="no-album-state">
                                            <h2>Chưa có Album ảnh</h2>
                                            <p>Hãy tải lên ảnh đầu tiên.</p>
                                        </div>
                                    ) : (
                                        <div className="album-info-wrapper">
                                            <div className="album-info">
                                                {isEditing ? (
                                                    <div className="edit-form">
                                                        <input type="text" className="edit-input title" value={editData.title} onChange={(e) => setEditData({...editData, title: e.target.value})} placeholder="Tên Album" />
                                                        <textarea className="edit-input desc" value={editData.description} onChange={(e) => setEditData({...editData, description: e.target.value})} placeholder="Mô tả..." />
                                                        <div className="edit-actions">
                                                            <button onClick={handleSaveInfo} className="btn-save"><Save size={16}/> Lưu</button>
                                                            <button onClick={() => setIsEditing(false)} className="btn-cancel"><X size={16}/> Hủy</button>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="view-info">
                                                        <div className="title-row">
                                                            <h2>{album.title}</h2>
                                                            <button onClick={() => setIsEditing(true)} className="btn-icon-edit"><Edit2 size={16}/></button>
                                                        </div>
                                                        <p className="album-desc">{album.description || "Chưa có mô tả"}</p>
                                                        <p className="album-meta">{album.photos?.length || 0} ảnh • {new Date(album.createdAt).toLocaleDateString('vi-VN')}</p>
                                                    </div>
                                                )}
                                                <button onClick={handleDeleteAlbum} className="btn-delete-album"><Trash2 size={16}/> Xóa</button>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="photos-container">
                                    <div className="upload-zone">
                                        <input type="file" multiple accept="image/*" ref={fileInputRef} onChange={handleFileChange} style={{ display: 'none' }} id="upload-input" />
                                        <label htmlFor="upload-input" className={`upload-label ${uploading ? 'disabled' : ''}`}>
                                            {uploading ? <span>Đang tải lên...</span> : <><UploadCloud size={24}/><span>Thêm ảnh mới</span></>}
                                        </label>
                                    </div>

                                    {album && album.photos && album.photos.length > 0 ? (
                                        <div className="photo-grid">
                                            {album.photos.map((photo, index) => (
                                                <div key={photo._id} className="photo-item group" onClick={() => openLightbox(index)}>
                                                    <img src={getPhotoUrl(photo.url)} alt={photo.filename} loading="lazy" />
                                                    <div className="photo-overlay">
                                                        <button className="btn-delete-photo" onClick={(e) => { e.stopPropagation(); handleDeletePhoto(photo._id); }}>
                                                            <Trash2 size={16} color="white"/>
                                                        </button>
                                                    </div>
                                                    {photo.is_selected && <span className="selected-badge">⭐</span>}
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="empty-photos"><ImageIcon size={48} className="text-gray-300 mb-2"/><p>Chưa có ảnh nào.</p></div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <Footer />
                </main>
            </div>

            {/* Lightbox */}
            {lightboxIndex !== null && album?.photos && (
                <div className="lightbox-overlay" onClick={closeLightbox}>
                    <button className="lb-close-btn" onClick={closeLightbox}><X size={32} /></button>
                    <div className="lb-content" onClick={(e) => e.stopPropagation()}>
                        <button className="lb-nav-btn prev" onClick={prevPhoto}><ChevronLeft size={40} /></button>
                        <div className="lb-image-wrapper">
                            <img src={getPhotoUrl(album.photos[lightboxIndex].url)} alt="Full view" className="lb-image" />
                            <div className="lb-caption">{lightboxIndex + 1} / {album.photos.length} — {album.photos[lightboxIndex].filename}</div>
                        </div>
                        <button className="lb-nav-btn next" onClick={nextPhoto}><ChevronRight size={40} /></button>
                    </div>
                </div>
            )}
        </div>
    );
}