import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { 
    Search, Plus, Image as ImageIcon, 
    Calendar, Loader2, X, Eye, CheckSquare
} from 'lucide-react';

import albumApi from '../../apis/albumApi';
import './AlbumsManage.css';

// ✅ Import MainLayout
import MainLayout from '../../layouts/MainLayout/MainLayout';

export default function AlbumsManage() {
    const navigate = useNavigate();
    
    // --- State ---
    const [albums, setAlbums] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    
    // Modal State
    const [showModal, setShowModal] = useState(false);
    const [newAlbumData, setNewAlbumData] = useState({ title: '', client_name: '', description: '' });
    const [creating, setCreating] = useState(false);

    useEffect(() => {
        fetchData();
    }, []);

    // --- FIX LOGIC FETCH DATA ---
    const fetchData = async () => {
        try {
            setLoading(true);
            const res = await albumApi.getMyAlbums(); 
            console.log("📦 API Albums Response:", res);

            let albumsData = [];

            // Bóc tách dữ liệu thông minh
            if (res) {
                if (Array.isArray(res)) {
                    albumsData = res;
                } else if (res.data && Array.isArray(res.data)) {
                    albumsData = res.data;
                } else if (res.data && res.data.data && Array.isArray(res.data.data)) {
                    albumsData = res.data.data;
                }
            }

            if (albumsData.length > 0) {
                // Lọc bỏ các mục pending, chỉ lấy album thực tế đã tạo
                const realAlbums = albumsData.filter(item => !item.is_pending);
                setAlbums(realAlbums);
            } else {
                setAlbums([]);
            }

        } catch (error) {
            console.error("❌ Lỗi tải album:", error);
            toast.error("Lỗi tải danh sách album");
        } finally {
            setLoading(false);
        }
    };

    // --- HANDLERS ---
    const handleCreateFreelance = async () => {
        if (!newAlbumData.title || !newAlbumData.client_name) return toast.warning("Vui lòng nhập đủ thông tin");
        try {
            setCreating(true);
            const res = await albumApi.createFreelanceAlbum(newAlbumData);
            toast.success("Tạo album thành công!");
            setShowModal(false);
            setNewAlbumData({ title: '', client_name: '', description: '' });
            
            const newId = res.data?.data?._id || res.data?._id;
            // ✅ Cập nhật route: chuyển hướng đến trang chi tiết album mới tạo
            if(newId) navigate(`/photographer/album-detail/${newId}`);
            
            // Reload list nếu không navigate
            fetchData();
        } catch (error) {
            toast.error("Lỗi tạo album.");
        } finally {
            setCreating(false);
        }
    };

    // Chuyển đến trang Quản lý/Upload ảnh cho Album
    const handleViewDetail = (e, item) => {
        e && e.stopPropagation(); 
        // Ưu tiên lấy order_id nếu có (để giữ logic cũ), nếu là freelance thì lấy _id của album
        const id = item.order_id || item._id;
        navigate(`/photographer/album-detail/${id}`);
    };

    // Chuyển đến trang Xem ảnh khách đã chọn
    const handleViewSelection = (e, item) => {
        e && e.stopPropagation();
        // ✅ CẬP NHẬT: Cho phép xem chọn với cả Job ngoài (dùng _id album)
        const targetId = item.order_id || item._id;
        navigate(`/orders/${targetId}/manage-selection`);
    };

    // --- FILTER & HELPER ---
    const filteredList = albums.filter(item => 
        item.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.client_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.order_id && item.order_id.toString().includes(searchTerm))
    );

    const getCoverImg = (item) => {
        if (item.photos && item.photos.length > 0) {
            const url = item.photos[0].url;
            return url.startsWith('http') ? url : `http://localhost:5000${url}`;
        }
        return null;
    };

    return (
        <MainLayout>
            <div className="am-container">
                <div className="am-header">
                    <div>
                        <h1>Kho Album ảnh</h1>
                        <p>Quản lý tất cả album đã tạo</p>
                    </div>
                    <button className="btn-create-freelance" onClick={() => setShowModal(true)}>
                        <Plus size={20}/> Tạo Album Job Ngoài
                    </button>
                </div>

                <div className="am-search-bar">
                    <Search size={20} className="search-icon"/>
                    <input 
                        type="text" 
                        placeholder="Tìm theo tên album, tên khách, mã đơn..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)} 
                    />
                </div>

                {loading ? <div className="am-loading"><Loader2 className="spinner"/> Đang tải...</div> : (
                    <div className="am-grid">
                        {filteredList.length > 0 ? filteredList.map((item) => (
                            <div key={item._id} className="am-card" onClick={(e) => handleViewDetail(e, item)}>
                                    
                                {/* ẢNH BÌA */}
                                <div className="am-card-img">
                                    {getCoverImg(item) ? (
                                        <img src={getCoverImg(item)} alt={item.title} loading="lazy"/>
                                    ) : (
                                        <div className="empty-placeholder">
                                            <ImageIcon size={40}/>
                                            <span>Trống</span>
                                        </div>
                                    )}
                                    {item.type === 'freelance' ? 
                                        <span className="badge-freelance">Job Ngoài</span> : 
                                        <span className="badge-order">Đơn Hàng</span>
                                    }
                                </div>

                                {/* THÔNG TIN */}
                                <div className="am-card-body">
                                    <h3 className="am-title" title={item.title}>{item.title}</h3>
                                    
                                    <div className="am-meta">
                                        {item.order_id && (
                                            <div className="meta-row">
                                                <span className="label">Mã đơn:</span>
                                                <span className="val">#{item.order_id}</span>
                                            </div>
                                        )}
                                        <div className="meta-row">
                                            <Calendar size={14}/>
                                            <span>{new Date(item.createdAt).toLocaleDateString('vi-VN')}</span>
                                        </div>
                                    </div>

                                    <div className="am-stats">
                                        <span className="photo-count">
                                            {item.photos?.length || 0} ảnh
                                        </span>
                                        {(item.status === 'selection_completed' || item.status === 'finalized') && (
                                            <span className="status-selected">Khách đã chọn</span>
                                        )}
                                    </div>

                                    {/* ACTIONS */}
                                    <div className="am-actions">
                                        <button 
                                            className="btn-action-card secondary"
                                            onClick={(e) => handleViewDetail(e, item)}
                                            title="Quản lý Album (Upload/Xóa)"
                                        >
                                            <Eye size={16}/> Chi tiết
                                        </button>

                                        {/* ✅ CẬP NHẬT: Hiển thị nút Xem Chọn cho cả Job ngoài */}
                                        <button 
                                            className={`btn-action-card ${item.status === 'selection_completed' ? 'highlight' : ''}`}
                                            onClick={(e) => handleViewSelection(e, item)}
                                            title="Xem danh sách ảnh khách đã chọn"
                                        >
                                            <CheckSquare size={16}/> Xem Chọn
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )) : (
                            <div className="am-empty">Không tìm thấy album nào.</div>
                        )}
                    </div>
                )}
            </div>

            {/* MODAL */}
            {showModal && (
                <div className="modal-overlay">
                    <div className="modal-content create-album-modal">
                        <div className="modal-header">
                            <h2>Tạo Album Job Ngoài</h2>
                            <button onClick={() => setShowModal(false)}><X size={24}/></button>
                        </div>
                        <div className="modal-body">
                            <div className="form-group">
                                <label>Tên Album</label>
                                <input type="text" value={newAlbumData.title} onChange={e => setNewAlbumData({...newAlbumData, title: e.target.value})}/>
                            </div>
                            <div className="form-group">
                                <label>Tên Khách Hàng</label>
                                <input type="text" value={newAlbumData.client_name} onChange={e => setNewAlbumData({...newAlbumData, client_name: e.target.value})}/>
                            </div>
                            <div className="form-group">
                                <label>Mô tả</label>
                                <textarea value={newAlbumData.description} onChange={e => setNewAlbumData({...newAlbumData, description: e.target.value})}/>
                            </div>
                            <button className="btn-submit-create" onClick={handleCreateFreelance} disabled={creating}>
                                {creating ? 'Đang tạo...' : 'Tạo Album & Upload Ảnh'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </MainLayout>
    );
}