import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Image as ImageIcon, Calendar, User, ArrowRight, UploadCloud, Eye } from 'lucide-react';
import axiosUser from '../../apis/axiosUser';
import Header from '../Header/Header';
import Sidebar from '../Sidebar/Sidebar';
import { toast } from 'react-toastify';
import './Album.css'; 

export default function PhotographerAlbumManager() {
    const navigate = useNavigate();
    const [albums, setAlbums] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    
    // State form tạo mới (Job ngoài)
    const [newAlbumData, setNewAlbumData] = useState({ title: '', client_name: '', description: '' });

    useEffect(() => {
        fetchMyAlbums();
    }, []);

    const fetchMyAlbums = async () => {
        try {
            setLoading(true);
            const res = await axiosUser.get('/albums/my-albums'); // API lấy danh sách album của thợ
            // Lưu ý: Backend cần trả về cả những đơn hàng CHƯA CÓ album (để hiện nút Giao ảnh)
            // Nếu backend chỉ trả về album đã tạo, bạn cần gọi thêm API lấy danh sách đơn hàng.
            
            // Giả sử API này trả về list mixed (Album đã tạo + Đơn hàng chưa tạo album)
            // Hoặc bạn phải tự merge ở frontend. 
            // Ở đây tôi giả định data trả về là danh sách ALBUM ĐÃ TẠO.
            setAlbums(res.data?.data || []);
        } catch (error) {
            console.error(error);
            toast.error("Lỗi tải danh sách album");
        } finally {
            setLoading(false);
        }
    };

    const handleCreateFreelance = async () => {
        if(!newAlbumData.title) return toast.warning("Nhập tên album!");
        try {
            await axiosUser.post('/albums/freelance', newAlbumData);
            toast.success("Tạo album thành công!");
            setShowCreateModal(false);
            setNewAlbumData({ title: '', client_name: '', description: '' });
            fetchMyAlbums(); 
        } catch (error) {
            toast.error("Lỗi tạo album");
        }
    };

    // Xử lý điều hướng thông minh
    const handleAction = (item) => {
        // Nếu item là một Album đã tồn tại
        if (item._id && item.photos) {
             // Dùng order_id nếu có (để URL đẹp), không thì dùng _id
             const idParam = item.type === 'order' ? item.order_id : item._id;
             navigate(`/albums/detail/${idParam}`);
        } 
        // Nếu item là một Đơn hàng chưa có Album (Giả sử bạn merge list)
        else if (item.order_id) {
             navigate(`/albums/detail/${item.order_id}`); // Trang Album.jsx sẽ tự hiện form tạo
        }
    };

    return (
        <>
            <Header />
            <div style={{ display: 'flex' }}>
                <Sidebar />
                <div style={{ flex: 1, padding: '30px', background: '#f8fafc', minHeight: '100vh' }}>
                    
                    <div className="flex justify-between items-center mb-8">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-800">Kho Album Ảnh</h1>
                            <p className="text-gray-500 text-sm mt-1">Quản lý tất cả album khách hàng và job ngoài</p>
                        </div>
                        <button 
                            className="bg-blue-600 text-white px-5 py-2.5 rounded-lg flex items-center gap-2 hover:bg-blue-700 shadow-md transition-all"
                            onClick={() => setShowCreateModal(true)}
                        >
                            <Plus size={20} /> Tạo Job Ngoài
                        </button>
                    </div>

                    {/* Modal Tạo Nhanh */}
                    {showCreateModal && (
                        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                            <div className="bg-white p-6 rounded-xl w-96 shadow-2xl animate-fade-in">
                                <h3 className="text-lg font-bold mb-4 text-gray-800">Tạo Album Job Ngoài</h3>
                                <div className="space-y-3">
                                    <input 
                                        className="w-full p-3 border border-gray-200 rounded-lg focus:border-blue-500 outline-none" 
                                        placeholder="Tên Album (VD: Kỷ yếu lớp 12A)"
                                        value={newAlbumData.title}
                                        onChange={e => setNewAlbumData({...newAlbumData, title: e.target.value})}
                                    />
                                    <input 
                                        className="w-full p-3 border border-gray-200 rounded-lg focus:border-blue-500 outline-none" 
                                        placeholder="Tên khách hàng (VD: Chị Lan)"
                                        value={newAlbumData.client_name}
                                        onChange={e => setNewAlbumData({...newAlbumData, client_name: e.target.value})}
                                    />
                                    <textarea 
                                        className="w-full p-3 border border-gray-200 rounded-lg focus:border-blue-500 outline-none" 
                                        placeholder="Mô tả..."
                                        rows={3}
                                        value={newAlbumData.description}
                                        onChange={e => setNewAlbumData({...newAlbumData, description: e.target.value})}
                                    />
                                </div>
                                <div className="flex justify-end gap-3 mt-6">
                                    <button onClick={() => setShowCreateModal(false)} className="px-4 py-2 text-gray-500 hover:bg-gray-100 rounded-lg">Hủy</button>
                                    <button onClick={handleCreateFreelance} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Tạo mới</button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Grid Album */}
                    {loading ? (
                        <div className="text-center py-20 text-gray-400">Đang tải dữ liệu...</div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {albums.map(album => {
                                const hasPhotos = album.photos && album.photos.length > 0;
                                const isOrder = album.type === 'order';
                                
                                return (
                                    <div 
                                        key={album._id} 
                                        className="group bg-white rounded-xl shadow-sm hover:shadow-xl transition-all duration-300 cursor-pointer overflow-hidden border border-gray-100 flex flex-col"
                                        onClick={() => handleAction(album)}
                                    >
                                        {/* Thumbnail Area */}
                                        <div className="h-48 bg-gray-100 relative overflow-hidden">
                                            {hasPhotos ? (
                                                <img 
                                                    src={album.photos[0].url} 
                                                    alt="" 
                                                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" 
                                                />
                                            ) : (
                                                <div className="flex flex-col items-center justify-center h-full text-gray-400 bg-gray-50">
                                                    <UploadCloud size={40} className="mb-2 opacity-50"/>
                                                    <span className="text-xs font-medium">Chưa có ảnh</span>
                                                </div>
                                            )}
                                            
                                            {/* Badge Loại Album */}
                                            <span className={`absolute top-3 left-3 text-xs px-2.5 py-1 rounded-full font-medium shadow-sm text-white ${isOrder ? 'bg-indigo-500' : 'bg-pink-500'}`}>
                                                {isOrder ? 'Đơn hàng' : 'Freelance'}
                                            </span>

                                            {/* Overlay Action khi hover */}
                                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                                <button className="bg-white text-gray-900 px-4 py-2 rounded-full font-medium flex items-center gap-2 hover:bg-gray-100 transform translate-y-2 group-hover:translate-y-0 transition-transform">
                                                    {hasPhotos ? <><Eye size={16}/> Xem Album</> : <><UploadCloud size={16}/> Giao Ảnh Ngay</>}
                                                </button>
                                            </div>
                                        </div>

                                        {/* Info Area */}
                                        <div className="p-5 flex-1 flex flex-col">
                                            <h3 className="font-bold text-gray-800 truncate text-lg mb-1">{album.title || "Album chưa đặt tên"}</h3>
                                            
                                            <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
                                                <User size={14} /> 
                                                <span className="truncate">
                                                    {isOrder ? (album.customer_id?.HoTen || "Khách hàng") : (album.client_name || "Khách lẻ")}
                                                </span>
                                            </div>

                                            <div className="mt-auto flex items-center justify-between text-xs text-gray-400 pt-4 border-t border-gray-50">
                                                <div className="flex items-center gap-1.5">
                                                    <Calendar size={12} /> 
                                                    {new Date(album.createdAt).toLocaleDateString('vi-VN')}
                                                </div>
                                                <div className={`font-medium px-2 py-0.5 rounded ${hasPhotos ? 'bg-blue-50 text-blue-600' : 'bg-orange-50 text-orange-600'}`}>
                                                    {album.photos?.length || 0} ảnh
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                    
                    {/* Empty State */}
                    {!loading && albums.length === 0 && (
                        <div className="text-center py-20">
                            <div className="bg-gray-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                                <ImageIcon size={40} className="text-gray-400"/>
                            </div>
                            <h3 className="text-xl font-bold text-gray-700">Chưa có album nào</h3>
                            <p className="text-gray-500 mt-2">Tạo album mới hoặc chờ đơn hàng hoàn thành để bắt đầu.</p>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}