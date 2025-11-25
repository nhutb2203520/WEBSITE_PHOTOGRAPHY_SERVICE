import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { 
    ArrowLeft, Calendar, MapPin, Clock, User, Package, 
    UploadCloud, Trash2, Edit2, Save, X, Image as ImageIcon 
} from 'lucide-react';

// Import API
import albumApi from '../../apis/albumApi'; // Hoặc đường dẫn tới file albumApi bạn gửi
import orderApi from '../../apis/orderService';
import './PhotographerAlbumManager.css';

export default function PhotographerAlbumManager() {
    const { orderId } = useParams();
    const navigate = useNavigate();
    const fileInputRef = useRef(null);

    // State
    const [order, setOrder] = useState(null);
    const [album, setAlbum] = useState(null);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editData, setEditData] = useState({ title: '', description: '' });

    useEffect(() => {
        fetchData();
    }, [orderId]);

    const fetchData = async () => {
        try {
            setLoading(true);
            console.log("🚀 Bắt đầu tải dữ liệu cho đơn:", orderId);

            // Gọi song song API
            const [orderRes, albumRes] = await Promise.all([
                orderApi.getOrderDetail(orderId).catch((err) => {
                    console.error("Lỗi Order:", err);
                    return null;
                }),
                albumApi.getAlbumDetail(orderId).catch((err) => {
                    console.warn("Lỗi Album (có thể chưa có):", err);
                    return null;
                })
            ]);

            // --- XỬ LÝ ORDER ---
            if (orderRes) {
                // Kiểm tra linh hoạt cấu trúc trả về (có thể qua interceptor hoặc không)
                const orderData = orderRes.data?.data || orderRes.data || orderRes;
                setOrder(orderData);
            }

            // --- XỬ LÝ ALBUM (QUAN TRỌNG) ---
            console.log("📦 Raw Album Response:", albumRes); // Xem log này trên Chrome Console (F12)

            let finalAlbumData = null;

            if (albumRes) {
                // Trường hợp 1: Axios chuẩn (response.data.data) -> Backend trả về { success: true, data: {...} }
                if (albumRes.data && albumRes.data.data) {
                    finalAlbumData = albumRes.data.data;
                } 
                // Trường hợp 2: Axios Interceptor đã lấy data (res.data) -> Backend trả về { success: true, data: {...} }
                else if (albumRes.success === true && albumRes.data) {
                    finalAlbumData = albumRes.data;
                }
                // Trường hợp 3: Backend trả về object Album trực tiếp (ít gặp nhưng đề phòng)
                else if (albumRes.data && albumRes.data._id) {
                    finalAlbumData = albumRes.data;
                }
            }

            if (finalAlbumData) {
                console.log("✅ Đã set Album vào State:", finalAlbumData);
                setAlbum(finalAlbumData);
                setEditData({ 
                    title: finalAlbumData.title || '', 
                    description: finalAlbumData.description || '' 
                });
            } else {
                console.warn("⚠️ Không tìm thấy data album hợp lệ trong response.");
                setAlbum(null);
            }

        } catch (error) {
            console.error("❌ Lỗi tải dữ liệu tổng quát:", error);
            toast.error("Không thể tải thông tin chi tiết.");
        } finally {
            setLoading(false);
        }
    };

    // 1. Upload ảnh
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
            // Sử dụng albumApi
            const res = await albumApi.uploadPhotos(orderId, formData);
            
            toast.success(`Đã tải lên ${files.length} ảnh thành công!`);
            setAlbum(res.data.data);
            setEditData({ title: res.data.data.title, description: res.data.data.description });
            
            if(fileInputRef.current) fileInputRef.current.value = '';
        } catch (error) {
            console.error(error);
            toast.error("Lỗi khi tải ảnh lên.");
        } finally {
            setUploading(false);
        }
    };

    // 2. Xóa 1 ảnh
    const handleDeletePhoto = async (photoId) => {
        if (!window.confirm("Bạn có chắc chắn muốn xóa ảnh này?")) return;
        try {
            await albumApi.deletePhoto(orderId, photoId);
            
            setAlbum(prev => ({
                ...prev,
                photos: prev.photos.filter(p => p._id !== photoId)
            }));
            toast.success("Đã xóa ảnh.");
        } catch (error) {
            toast.error("Lỗi khi xóa ảnh.");
        }
    };

    // 3. Cập nhật thông tin
    const handleSaveInfo = async () => {
        try {
            await albumApi.updateAlbumInfo(orderId, editData);
            setAlbum(prev => ({ ...prev, ...editData }));
            setIsEditing(false);
            toast.success("Cập nhật thông tin thành công!");
        } catch (error) {
            toast.error("Lỗi cập nhật thông tin.");
        }
    };

    // 4. Xóa toàn bộ Album
    const handleDeleteAlbum = async () => {
        if (!window.confirm("CẢNH BÁO: Xóa album sẽ mất toàn bộ ảnh. Bạn chắc chắn không?")) return;
        try {
            await albumApi.deleteAlbum(orderId);
            setAlbum(null);
            toast.success("Đã xóa album thành công.");
        } catch (error) {
            toast.error("Lỗi khi xóa album.");
        }
    };

    if (loading) return <div className="pam-loading">Đang tải dữ liệu...</div>;
    if (!order) return <div className="pam-error">Không tìm thấy đơn hàng!</div>;

    return (
        <div className="pam-container">
            <div className="pam-header">
                <button onClick={() => navigate(-1)} className="btn-back">
                    <ArrowLeft size={20} /> Quay lại
                </button>
                <h1>Chi tiết quản lý đơn hàng</h1>
            </div>

            <div className="pam-content">
                {/* CỘT TRÁI: THÔNG TIN */}
                <div className="pam-sidebar">
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
                                    <p className="sub-label">Thời gian chụp</p>
                                    <p className="main-text">
                                        {new Date(order.booking_date).toLocaleDateString('vi-VN')} - {order.start_time}
                                    </p>
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

                {/* CỘT PHẢI: ALBUM */}
                <div className="pam-main">
                    <div className="album-header-card">
                        {!album ? (
                            <div className="no-album-state">
                                <h2>Chưa có Album ảnh</h2>
                                <p>Hãy tải lên những bức ảnh đầu tiên để tạo Album cho đơn hàng này.</p>
                            </div>
                        ) : (
                            <div className="album-info">
                                {isEditing ? (
                                    <div className="edit-form">
                                        <input 
                                            type="text" className="edit-input title"
                                            value={editData.title}
                                            onChange={(e) => setEditData({...editData, title: e.target.value})}
                                            placeholder="Tên Album"
                                        />
                                        <textarea 
                                            className="edit-input desc"
                                            value={editData.description}
                                            onChange={(e) => setEditData({...editData, description: e.target.value})}
                                            placeholder="Mô tả album..."
                                        />
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
                                        <p className="album-meta">
                                            {album.photos?.length || 0} ảnh • Tạo ngày {new Date(album.createdAt).toLocaleDateString('vi-VN')}
                                        </p>
                                    </div>
                                )}
                                <div className="album-actions-top">
                                    <button onClick={handleDeleteAlbum} className="btn-delete-album">
                                        <Trash2 size={16}/> Xóa Album
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Photos Grid */}
                    <div className="photos-container">
                        <div className="upload-zone">
                            <input 
                                type="file" multiple accept="image/*" 
                                ref={fileInputRef}
                                onChange={handleFileChange}
                                style={{ display: 'none' }}
                                id="upload-input"
                            />
                            <label htmlFor="upload-input" className={`upload-label ${uploading ? 'disabled' : ''}`}>
                                {uploading ? (
                                    <span>Đang tải lên...</span>
                                ) : (
                                    <>
                                        <UploadCloud size={24}/>
                                        <span>Thêm ảnh mới</span>
                                    </>
                                )}
                            </label>
                        </div>

                        {album && album.photos && album.photos.length > 0 ? (
                            <div className="photo-grid">
                                {album.photos.map((photo) => (
                                    <div key={photo._id} className="photo-item group">
                                        <img 
                                            src={photo.url.startsWith('http') ? photo.url : `http://localhost:5000${photo.url}`} 
                                            alt={photo.filename} 
                                            loading="lazy"
                                        />
                                        <div className="photo-overlay">
                                            <span className="photo-name">{photo.filename}</span>
                                            <button 
                                                className="btn-delete-photo" 
                                                onClick={() => handleDeletePhoto(photo._id)}
                                                title="Xóa ảnh này"
                                            >
                                                <Trash2 size={16} color="white"/>
                                            </button>
                                        </div>
                                        {photo.is_selected && (
                                            <span className="selected-badge" title="Khách đã chọn ảnh này">⭐</span>
                                        )}
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="empty-photos">
                                <ImageIcon size={48} className="text-gray-300 mb-2"/>
                                <p>Chưa có ảnh nào trong album.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}