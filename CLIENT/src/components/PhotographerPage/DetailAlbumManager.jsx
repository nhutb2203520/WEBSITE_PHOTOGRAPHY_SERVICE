import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { 
    ArrowLeft, Calendar, User, Package, 
    UploadCloud, Trash2, Edit2, Save, X, Image as ImageIcon,
    ChevronLeft, ChevronRight, Share2, Copy, Check, Send, Star, PlusCircle,
    MapPin, Clock, FileText, ExternalLink // ✅ Thêm icons mới
} from 'lucide-react';

import MainLayout from '../../layouts/MainLayout/MainLayout';
import albumApi from '../../apis/albumApi'; 
import orderApi from '../../apis/orderService';
import './DetailAlbumManager.css';

export default function DetailAlbumManager() {
    const { orderId } = useParams(); // Note: Với job ngoài, orderId này chính là albumId
    const navigate = useNavigate();
    const fileInputRef = useRef(null);
    const deliverInputRef = useRef(null); 

    // State
    const [order, setOrder] = useState(null);
    const [album, setAlbum] = useState(null);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editData, setEditData] = useState({ title: '', description: '' });
    
    // Lightbox & Share
    const [lightboxIndex, setLightboxIndex] = useState(-1);
    const [lightboxSource, setLightboxSource] = useState('raw');
    const [showShareModal, setShowShareModal] = useState(false);
    const [shareLink, setShareLink] = useState('');
    const [copied, setCopied] = useState(false);

    // Deliver Modal State
    const [showDeliverModal, setShowDeliverModal] = useState(false);
    const [deliverFiles, setDeliverFiles] = useState([]);

    useEffect(() => { fetchData(); }, [orderId]);

    // Xử lý phím tắt Lightbox
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (lightboxIndex === -1) return;
            if (e.key === 'Escape') setLightboxIndex(-1);
            if (e.key === 'ArrowRight') navigateImage(1);
            if (e.key === 'ArrowLeft') navigateImage(-1);
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [lightboxIndex]);

    const fetchData = async () => {
        try {
            setLoading(true);
            
            let albumData = null;
            try {
                // Thử lấy album theo ID (ID này có thể là order_id hoặc album_id)
                const albumRes = await albumApi.getAlbumDetail(orderId);
                if (albumRes.data) albumData = albumRes.data.data || albumRes.data;
            } catch (e) { }

            let orderData = null;
            // Nếu album có order_id thì lấy detail order, nếu không thì thử lấy order bằng id từ URL (trường hợp URL là order_id)
            const idToCheckOrder = albumData?.order_id || orderId;
            try {
                if (idToCheckOrder) {
                    const orderRes = await orderApi.getOrderDetail(idToCheckOrder);
                    if (orderRes.data) orderData = orderRes.data.data || orderRes.data;
                }
            } catch (e) { 
                // Job ngoài không có order nên API này lỗi là bình thường
            }

            setAlbum(albumData);
            setOrder(orderData);

            if (albumData) {
                setEditData({ title: albumData.title || '', description: albumData.description || '' });
            } else if (orderData) {
                setEditData({ 
                    title: `Album đơn hàng #${orderData.order_id}`, 
                    description: `Ảnh chụp cho khách ${orderData.customer_id?.HoTen || ''}` 
                });
            }
        } catch (error) {
            console.error("Lỗi tải dữ liệu:", error);
        } finally {
            setLoading(false);
        }
    };

    // --- UTILS ---
    const getImgUrl = (path) => {
        if (!path) return null;
        if (path.startsWith('blob:')) return path;
        return path.startsWith('http') ? path : `http://localhost:5000${path}`;
    };

    // Helper Lightbox
    const getCurrentPhotos = () => lightboxSource === 'edited' ? (album?.edited_photos || []) : (album?.photos || []);
    
    const navigateImage = (direction) => {
        const photos = getCurrentPhotos();
        if (photos.length === 0) return;
        let newIndex = lightboxIndex + direction;
        if (newIndex < 0) newIndex = photos.length - 1;
        if (newIndex >= photos.length) newIndex = 0;
        setLightboxIndex(newIndex);
    };

    const openLightbox = (index, source) => {
        setLightboxSource(source);
        setLightboxIndex(index);
    };

    // --- Handlers CRUD ---
    const handleFileChange = async (e) => {
        const files = Array.from(e.target.files);
        if (files.length === 0) return;
        const formData = new FormData();
        files.forEach(file => formData.append('photos', file));
        if (!album && order) {
            formData.append('title', editData.title);
            formData.append('description', editData.description);
        }
        try {
            setUploading(true);
            const targetId = album ? album._id : orderId;
            const res = await albumApi.uploadPhotos(targetId, formData);
            toast.success(`Đã tải lên ${files.length} ảnh gốc!`);
            setAlbum(res.data?.data || res.data);
            if(fileInputRef.current) fileInputRef.current.value = '';
        } catch (error) { toast.error("Lỗi khi tải ảnh lên."); } finally { setUploading(false); }
    };

    const handleDeletePhoto = async (photoId) => {
        if (!window.confirm("Bạn xóa ảnh này?")) return;
        try {
            const targetId = album._id || orderId;
            await albumApi.deletePhoto(targetId, photoId);
            setAlbum(prev => ({
                ...prev,
                photos: prev.photos.filter(p => p._id !== photoId),
                edited_photos: prev.edited_photos ? prev.edited_photos.filter(p => p._id !== photoId) : []
            }));
            toast.success("Đã xóa ảnh.");
            if (lightboxIndex !== -1) setLightboxIndex(-1);
        } catch (error) { toast.error("Lỗi xóa ảnh."); }
    };

    const handleSaveInfo = async () => {
        try {
            const targetId = album._id || orderId;
            await albumApi.updateAlbumInfo(targetId, editData);
            setAlbum(prev => ({ ...prev, ...editData }));
            setIsEditing(false);
            toast.success("Đã lưu thông tin.");
        } catch (error) { toast.error("Lỗi cập nhật."); }
    };

    const handleDeleteAlbum = async () => {
        if (!window.confirm("CẢNH BÁO: Xóa album sẽ mất hết ảnh!")) return;
        try {
            const targetId = album._id || orderId;
            await albumApi.deleteAlbum(targetId);
            toast.success("Đã xóa album.");
            navigate('/photographer/albums-management');
        } catch (error) { toast.error("Lỗi xóa album."); }
    };

    const handleShare = async () => {
        if (!album) return toast.warning("Vui lòng tải ảnh lên trước khi chia sẻ.");
        try {
            const res = await albumApi.createShareLink(album._id);
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
            toast.error(error.response?.data?.message || "Lỗi tạo link chia sẻ."); 
        }
    };
    
    const copyToClipboard = () => { navigator.clipboard.writeText(shareLink); setCopied(true); setTimeout(() => setCopied(false), 2000); };

    // --- DELIVER ALBUM HANDLERS ---
    const handleDeliverClick = () => {
        if (!album) return toast.warning("Vui lòng tạo album trước.");
        setShowDeliverModal(true);
    };

    const handleDeliverFileSelect = (e) => {
        const files = Array.from(e.target.files);
        if (files.length > 0) {
            setDeliverFiles(prev => [...prev, ...files]);
        }
    };

    const removeDeliverFile = (index) => {
        setDeliverFiles(prev => prev.filter((_, i) => i !== index));
    };

    const handleConfirmDeliver = async () => {
        if (deliverFiles.length === 0) return toast.warning("Vui lòng chọn ảnh đã chỉnh sửa để giao!");
        try {
            setUploading(true);
            const formData = new FormData();
            deliverFiles.forEach(file => formData.append('photos', file));
            const targetId = album._id;
            const res = await albumApi.deliverAlbum(targetId, formData);
            toast.success("Đã thêm ảnh chỉnh sửa và cập nhật trạng thái giao hàng!");
            setAlbum(res.data?.data || res.data);
            if (order) setOrder(prev => ({ ...prev, status: 'delivered' }));
            setShowDeliverModal(false);
            setDeliverFiles([]);
        } catch (error) {
            console.error(error);
            toast.error("Lỗi khi giao album.");
        } finally {
            setUploading(false);
        }
    };

    if (loading) return <div className="pam-loading">Đang tải dữ liệu...</div>;
    if (!order && !album) return <div className="pam-error"><h3>Không tìm thấy dữ liệu!</h3><button onClick={() => navigate(-1)} className="btn-back-error">Quay lại</button></div>;

    const isDelivered = (order?.status === 'delivered' || order?.status === 'completed') || 
                        (album?.status === 'delivered' || album?.status === 'completed');

    return (
        <MainLayout>
            <div className="pam-container">
                <div className="pam-header">
                    <div style={{display:'flex', alignItems:'center', gap: 15}}>
                        <button onClick={() => navigate('/photographer/albums-management')} className="btn-back">
                            <ArrowLeft size={20} />
                        </button>
                        <h1>{order ? "Quản lý Album Đơn hàng" : "Quản lý Album Job Ngoài"}</h1>
                    </div>
                    
                    <div className="header-actions-right">
                        {album && (
                            <button 
                                className={`btn-deliver-main ${isDelivered ? 'secondary' : ''}`} 
                                onClick={handleDeliverClick}
                                title="Tải lên ảnh đã chỉnh sửa và giao cho khách"
                            >
                                {isDelivered ? <PlusCircle size={18}/> : <Send size={18}/>}
                                {isDelivered ? " Giao thêm ảnh" : " Giao Album"}
                            </button>
                        )}
                        {album && <button className="btn-share-main" onClick={handleShare}><Share2 size={18}/> Chia sẻ</button>}
                    </div>
                </div>

                <div className="pam-content">
                    {/* CỘT TRÁI: INFO */}
                    <div className="pam-info-column">
                        <div className="info-card">
                            <div className="card-header-row">
                                <h3 className="card-title">Thông tin</h3>
                                {isDelivered && <span className="status-badge success">Đã giao</span>}
                            </div>
                            
                            {order ? (
                                <>
                                    <div className="info-row"><span className="label">Mã đơn:</span><span className="value highlight">#{order.order_id}</span></div>
                                    
                                    <div className="info-group">
                                        {/* Khách hàng */}
                                        <div className="info-item">
                                            <User size={16}/>
                                            <div>
                                                <p className="sub-label">Khách hàng</p>
                                                <p className="main-text">{order.customer_id?.HoTen}</p>
                                                <p className="sub-text">{order.customer_id?.SoDienThoai}</p>
                                            </div>
                                        </div>

                                        {/* Gói dịch vụ */}
                                        <div className="info-item">
                                            <Package size={16}/>
                                            <div>
                                                <p className="sub-label">Gói dịch vụ</p>
                                                <p className="main-text">{order.service_package_id?.TenGoi}</p>
                                            </div>
                                        </div>

                                        {/* Thời gian */}
                                        <div className="info-item">
                                            <Clock size={16}/>
                                            <div>
                                                <p className="sub-label">Thời gian chụp</p>
                                                <p className="main-text">
                                                    {new Date(order.booking_date).toLocaleDateString('vi-VN')}
                                                    {order.start_time ? ` - ${order.start_time}` : ''}
                                                </p>
                                            </div>
                                        </div>

                                        {/* Địa điểm & Map */}
                                        <div className="info-item">
                                            <MapPin size={16}/>
                                            <div>
                                                <p className="sub-label">Địa điểm</p>
                                                <p className="main-text">{order.location?.address || order.location?.name || "Chưa cập nhật"}</p>
                                                <p className="sub-text">
                                                    {[order.location?.district, order.location?.city].filter(Boolean).join(', ')}
                                                </p>
                                                {order.location?.map_link && (
                                                    <a 
                                                        href={order.location.map_link} 
                                                        target="_blank" 
                                                        rel="noopener noreferrer"
                                                        className="map-link-btn"
                                                    >
                                                        <ExternalLink size={12}/> Xem bản đồ
                                                    </a>
                                                )}
                                            </div>
                                        </div>

                                        {/* Ghi chú */}
                                        {order.notes && (
                                            <div className="info-item">
                                                <FileText size={16}/>
                                                <div>
                                                    <p className="sub-label">Ghi chú khách hàng</p>
                                                    <p className="main-text italic text-gray-600">"{order.notes}"</p>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    <div className="price-box">
                                        <span>Tổng tiền:</span>
                                        <span className="price-value">{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(order.final_amount)}</span>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <div className="info-tag freelance">Job Ngoài</div>
                                    <div className="info-group mt-3">
                                        <div className="info-item"><User size={16}/><div><p className="sub-label">Khách hàng</p><p className="main-text">{album?.client_name}</p></div></div>
                                        <div className="info-item"><Calendar size={16}/><div><p className="sub-label">Ngày tạo</p><p className="main-text">{album ? new Date(album.createdAt).toLocaleDateString('vi-VN') : ""}</p></div></div>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>

                    {/* CỘT PHẢI: ẢNH */}
                    <div className="pam-album-column">
                        <div className="album-header-card">
                            {!album && !isEditing ? (
                                <div className="no-album-state"><h2>Chưa có ảnh</h2><p>Hãy tải lên ảnh gốc đầu tiên.</p></div>
                            ) : (
                                <div className="album-info-wrapper">
                                    <div className="album-info">
                                        {isEditing ? (
                                            <div className="edit-form">
                                                <input type="text" className="edit-input title" value={editData.title} onChange={(e) => setEditData({...editData, title: e.target.value})} />
                                                <textarea className="edit-input desc" value={editData.description} onChange={(e) => setEditData({...editData, description: e.target.value})} />
                                                <div className="edit-actions">
                                                    <button onClick={handleSaveInfo} className="btn-save"><Save size={16}/> Lưu</button>
                                                    <button onClick={() => setIsEditing(false)} className="btn-cancel"><X size={16}/> Hủy</button>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="view-info">
                                                <div className="title-row"><h2>{album ? album.title : editData.title}</h2><button onClick={() => setIsEditing(true)} className="btn-icon-edit"><Edit2 size={16}/></button></div>
                                                <p className="album-desc">{album ? album.description : editData.description}</p>
                                            </div>
                                        )}
                                        {album && <button onClick={handleDeleteAlbum} className="btn-delete-album"><Trash2 size={16}/> Xóa Album</button>}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* 2. KHU VỰC ẢNH ĐÃ CHỈNH SỬA (FINAL) */}
                        {album && album.edited_photos && album.edited_photos.length > 0 && (
                            <div className="photos-container edited-section">
                                <div className="section-header final-header">
                                    <div className="sh-title">
                                        <Star size={20} fill="#fbbf24" color="#fbbf24"/>
                                        <h3>Ảnh Đã Chỉnh Sửa (Final)</h3>
                                        <span className="count-badge">{album.edited_photos.length}</span>
                                    </div>
                                    <button className="btn-add-more-final" onClick={handleDeliverClick}><PlusCircle size={16}/> Thêm ảnh</button>
                                </div>
                                <div className="photo-grid">
                                    {album.edited_photos.map((photo, index) => (
                                        <div key={photo._id} className="photo-item group final" onClick={() => openLightbox(index, 'edited')}>
                                            <img src={getImgUrl(photo.url)} alt="" loading="lazy" />
                                            <div className="photo-overlay">
                                                <button className="btn-delete-photo" onClick={(e) => { e.stopPropagation(); handleDeletePhoto(photo._id); }}><Trash2 size={16} color="white"/></button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* 3. KHU VỰC ẢNH GỐC (RAW) */}
                        <div className="photos-container">
                            <div className="section-header">
                                <div className="sh-title">
                                    <ImageIcon size={20} color="#64748b"/>
                                    <h3>Ảnh Gốc</h3>
                                    <span className="count-badge">{album?.photos?.length || 0}</span>
                                </div>
                            </div>
                            
                            <div className="upload-zone">
                                <input type="file" multiple accept="image/*" ref={fileInputRef} onChange={handleFileChange} style={{ display: 'none' }} id="upload-input" />
                                <label htmlFor="upload-input" className={`upload-label ${uploading ? 'disabled' : ''}`}>
                                    {uploading ? <span>Đang tải lên...</span> : <><UploadCloud size={24}/><span>Thêm ảnh gốc</span></>}
                                </label>
                            </div>
                            
                            {album && album.photos && album.photos.length > 0 ? (
                                <div className="photo-grid">
                                    {album.photos.map((photo, index) => (
                                        <div key={photo._id} className="photo-item group" onClick={() => openLightbox(index, 'raw')}>
                                            <img src={getImgUrl(photo.url)} alt="" loading="lazy" />
                                            <div className="photo-overlay">
                                                <button className="btn-delete-photo" onClick={(e) => { e.stopPropagation(); handleDeletePhoto(photo._id); }}><Trash2 size={16} color="white"/></button>
                                            </div>
                                            {photo.is_selected && <span className="selected-badge">⭐</span>}
                                        </div>
                                    ))}
                                </div>
                            ) : <div className="empty-photos"><p>Trống</p></div>}
                        </div>
                    </div>
                </div>
            </div>

            {/* MODAL GIAO ALBUM */}
            {showDeliverModal && (
                <div className="modal-overlay" onClick={() => setShowDeliverModal(false)}>
                    <div className="modal-content deliver-modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header deliver-header">
                            <h2><Send size={20}/> {isDelivered ? "Cập nhật ảnh đã chỉnh" : "Giao Album Hoàn Thiện"}</h2>
                            <button onClick={() => setShowDeliverModal(false)}><X size={24}/></button>
                        </div>
                        <div className="modal-body">
                            <p className="modal-desc">
                                {isDelivered ? "Tải thêm ảnh đã chỉnh sửa để gửi cho khách hàng." : "Vui lòng tải lên các ảnh đã chỉnh sửa (Retouched) để giao cho khách hàng. Trạng thái đơn hàng sẽ chuyển thành 'Đã giao'."}
                            </p>
                            
                            <div className="deliver-upload-area" onClick={() => deliverInputRef.current.click()}>
                                <input type="file" multiple accept="image/*" ref={deliverInputRef} onChange={handleDeliverFileSelect} style={{display:'none'}} />
                                <UploadCloud size={40} color="#10b981"/>
                                <p>Nhấn để chọn ảnh từ máy tính</p>
                                <span className="sub-text-upload">(Có thể chọn nhiều ảnh cùng lúc)</span>
                            </div>

                            {deliverFiles.length > 0 && (
                                <div className="selected-files-list">
                                    <h4>Đã chọn {deliverFiles.length} ảnh:</h4>
                                    <div className="file-tags">
                                        {deliverFiles.map((f, i) => (
                                            <div key={i} className="file-tag">
                                                {f.name} 
                                                <button onClick={() => removeDeliverFile(i)}><X size={12}/></button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div className="modal-actions">
                                <button className="btn-cancel-modal" onClick={() => setShowDeliverModal(false)}>Hủy</button>
                                <button className="btn-confirm-deliver" onClick={handleConfirmDeliver} disabled={uploading || deliverFiles.length === 0}>
                                    {uploading ? "Đang tải lên..." : "Xác nhận Giao"}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Share Modal */}
            {showShareModal && (
                <div className="modal-overlay" onClick={() => setShowShareModal(false)}>
                    <div className="modal-content share-modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header"><h2>Chia sẻ Album</h2><button onClick={() => setShowShareModal(false)}><X size={24}/></button></div>
                        <div className="modal-body">
                            <p className="share-desc">Gửi liên kết này cho khách hàng:</p>
                            <div className="share-input-group">
                                <input type="text" readOnly value={shareLink} onClick={(e) => e.target.select()} />
                                <button onClick={copyToClipboard} className={copied ? "copied" : ""}>{copied ? <Check size={20}/> : <Copy size={20}/>}</button>
                            </div>
                            <div className="share-actions"><button className="btn-open-link" onClick={() => window.open(shareLink, '_blank')}>Mở liên kết ngay</button></div>
                        </div>
                    </div>
                </div>
            )}

            {/* Lightbox */}
            {lightboxIndex !== -1 && (
                <div className="image-zoom-overlay" onClick={() => setLightboxIndex(-1)}>
                    <button className="lb-nav-btn prev" onClick={(e) => { e.stopPropagation(); navigateImage(-1); }}>
                        <ChevronLeft size={40} />
                    </button>

                    <div className="image-zoom-content" onClick={(e) => e.stopPropagation()}>
                        <img src={getImgUrl(getCurrentPhotos()[lightboxIndex]?.url)} alt="Zoomed" />
                        <button className="close-zoom" onClick={() => setLightboxIndex(-1)}><X size={24}/></button>
                    </div>

                    <button className="lb-nav-btn next" onClick={(e) => { e.stopPropagation(); navigateImage(1); }}>
                        <ChevronRight size={40} />
                    </button>
                </div>
            )}
        </MainLayout>
    );
}