import React, { useState, useEffect } from "react";
import { Images, Plus, Edit, Trash2, Eye, X } from "lucide-react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify"; 
import "./WorksProfile.css";

export default function WorksProfile() {
  const navigate = useNavigate();
  const [works, setWorks] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // State quản lý form (Dùng chung cho Tạo mới & Chỉnh sửa)
  const [editingId, setEditingId] = useState(null); 
  const [newWork, setNewWork] = useState({ title: "", images: [] });

  const token = sessionStorage.getItem("token");
  const userRole = sessionStorage.getItem("role");
  const isPhotographer = userRole === "photographer";

  // 🔹 Helper: Xử lý URL ảnh (Localhost, Blob hoặc Link online)
  const getImageUrl = (img) => {
    if (!img) return "https://placehold.co/600x400/png?text=No+Image";
    if (img.startsWith("blob:") || img.startsWith("http")) return img;
    // Đảm bảo đúng port backend (5000)
    return `http://localhost:5000${img.startsWith('/') ? '' : '/'}${img}`;
  };

  // 🔹 1. Lấy danh sách hồ sơ (API thật)
  const fetchWorks = async () => {
    try {
      const res = await fetch("http://localhost:5000/api/worksprofile/my", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setWorks(data.works || []);
      }
    } catch (err) {
      console.error("❌ Lỗi load danh sách:", err);
    }
  };

  useEffect(() => {
    fetchWorks();
  }, []);

  // 🔹 2. Xử lý sự kiện Modal (Tạo mới)
  const handleCreateClick = () => {
    setEditingId(null);
    setNewWork({ title: "", images: [] });
    setShowModal(true);
  };

  // 🔹 3. Xử lý sự kiện Modal (Chỉnh sửa)
  const handleEditClick = (work) => {
    setEditingId(work._id);
    // Map ảnh cũ từ server sang cấu trúc object để hiển thị preview
    const existingImages = work.images.map(imgUrl => ({
      file: null, // Không có file object vì là ảnh cũ
      preview: getImageUrl(imgUrl),
      originalUrl: imgUrl, // Lưu URL gốc để gửi lên server nếu giữ lại
      isNew: false
    }));
    setNewWork({
      title: work.title,
      images: existingImages
    });
    setShowModal(true);
  };

  // 🔹 4. Chọn ảnh từ máy
  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    const newImages = files.map((file) => ({
      file, 
      preview: URL.createObjectURL(file),
      isNew: true
    }));
    setNewWork({ ...newWork, images: [...newWork.images, ...newImages] });
  };

  // 🔹 5. Xóa ảnh trong Modal (Xóa ảnh mới chọn hoặc ảnh cũ)
  const removeImageInModal = (index) => {
    const updatedImages = [...newWork.images];
    updatedImages.splice(index, 1);
    setNewWork({ ...newWork, images: updatedImages });
  };

  // 🔹 6. Kéo thả sắp xếp ảnh
  const handleDragEnd = (result) => {
    if (!result.destination) return;
    const reordered = Array.from(newWork.images);
    const [moved] = reordered.splice(result.source.index, 1);
    reordered.splice(result.destination.index, 0, moved);
    setNewWork({ ...newWork, images: reordered });
  };

  // 🔹 7. Lưu (Tạo mới hoặc Cập nhật)
  const handleSave = async () => {
    if (!newWork.title || newWork.images.length === 0) {
      alert("Vui lòng nhập tên và chọn ít nhất 1 ảnh!");
      return;
    }

    setLoading(true);
    const formData = new FormData();
    formData.append("title", newWork.title);

    // Tách ảnh mới và ảnh cũ để xử lý logic update
    const keptImages = [];
    
    newWork.images.forEach((img) => {
      if (img.isNew && img.file) {
        formData.append("images", img.file); // Gửi file mới lên
      } else if (!img.isNew && img.originalUrl) {
        keptImages.push(img.originalUrl); // Giữ lại URL ảnh cũ
      }
    });

    // Gửi danh sách ảnh cũ cần giữ lại (Backend cần xử lý field này nếu update)
    formData.append("keptImages", JSON.stringify(keptImages));

    // Xác định URL và Method
    const url = editingId 
      ? `http://localhost:5000/api/worksprofile/${editingId}` 
      : "http://localhost:5000/api/worksprofile/create";
    
    const method = editingId ? "PUT" : "POST";

    try {
      const res = await fetch(url, {
        method: method,
        headers: { Authorization: `Bearer ${token}` }, // Không set Content-Type khi dùng FormData
        body: formData,
      });

      const data = await res.json();
      if (data.success) {
        alert(editingId ? "✅ Cập nhật thành công!" : "✅ Tạo hồ sơ thành công!");
        setShowModal(false);
        fetchWorks(); // Reload danh sách
      } else {
        alert(data.message || "Có lỗi xảy ra!");
      }
    } catch (err) {
      console.error("❌", err);
      alert("Lỗi kết nối server!");
    } finally {
      setLoading(false);
    }
  };

  // 🔹 8. Xóa hồ sơ
  const handleDelete = async (id) => {
    if (!window.confirm("Bạn có chắc muốn xóa hồ sơ này?")) return;
    try {
      const res = await fetch(`http://localhost:5000/api/worksprofile/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        alert("🗑️ Đã xóa hồ sơ!");
        fetchWorks();
      } else {
        alert(data.message);
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className={`works-container ${isPhotographer ? "photographer-layout" : "center-layout"}`}>
      
      {/* Sidebar User Info (Chỉ hiện cho Photographer) */}
      {isPhotographer && (
        <div className="user-info">
          <img 
            src="/avatar.jpg" 
            alt="avatar" 
            className="avatar-circle-img" 
            onError={(e) => e.target.src="https://via.placeholder.com/150"} 
          />
          <h3>Thông tin của bạn</h3>
          <p>Photographer</p>
        </div>
      )}

      {/* Main Content */}
      <div className="works-card">
        <div className="works-header">
          <div className="works-title">
            <Images size={24} />
            <h2>Hồ sơ tác phẩm của bạn</h2>
          </div>
          <button className="add-work-btn" onClick={handleCreateClick}>
            <Plus size={18} /> Thêm hồ sơ mới
          </button>
        </div>

        {/* Danh sách hồ sơ */}
        <div className="works-gallery">
          {works.length === 0 ? (
            <p className="no-work">Chưa có hồ sơ nào. Hãy tạo hồ sơ đầu tiên!</p>
          ) : (
            works.map((item) => (
              <div key={item._id} className="work-item">
                {/* Click ảnh chuyển trang chi tiết */}
                <div className="work-img-wrapper" onClick={() => navigate(`/workprofile/${item._id}`)}>
                  <img
                    src={getImageUrl(item.images?.[0])}
                    alt={item.title}
                  />
                  <div className="img-overlay">
                    <span>{item.images?.length || 0} ảnh</span>
                  </div>
                </div>
                
                <div className="work-body">
                  <h4 onClick={() => navigate(`/workprofile/${item._id}`)}>{item.title}</h4>
                  
                  <div className="work-actions">
                    {/* Nút Xem chi tiết */}
                    <button className="action-btn view" title="Xem chi tiết" onClick={() => navigate(`/workprofile/${item._id}`)}>
                        <Eye size={16} />
                    </button>
                    
                    {/* Nút Chỉnh sửa */}
                    <button className="action-btn edit" title="Chỉnh sửa" onClick={() => handleEditClick(item)}>
                        <Edit size={16} />
                    </button>
                    
                    {/* Nút Xóa */}
                    <button className="action-btn delete" title="Xóa" onClick={() => handleDelete(item._id)}>
                        <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Modal Create/Edit */}
        {showModal && (
          <div className="modal-overlay">
            <div className="modal">
              <div className="modal-header">
                <h3>{editingId ? "Chỉnh Sửa Hồ Sơ" : "Thêm Hồ Sơ Mới"}</h3>
                <button onClick={() => setShowModal(false)} className="close-btn">
                  <X size={24} />
                </button>
              </div>

              <div className="modal-body">
                <label>Tên hồ sơ (Album):</label>
                <input
                  type="text"
                  value={newWork.title}
                  onChange={(e) => setNewWork({ ...newWork, title: e.target.value })}
                  placeholder="Ví dụ: Kỷ yếu 2024, Wedding Mr.A..."
                />

                <div className="file-input-group">
                    <label className="btn-select-file">
                        <Plus size={16} /> Thêm ảnh
                        <input
                            type="file"
                            multiple
                            accept="image/*"
                            onChange={handleFileChange}
                            hidden
                        />
                    </label>
                    <span className="file-hint">{newWork.images.length} ảnh đã chọn</span>
                </div>

                {/* Danh sách ảnh trong Modal (Có Drag & Drop) */}
                <DragDropContext onDragEnd={handleDragEnd}>
                  <Droppable droppableId="images" direction="horizontal">
                    {(provided) => (
                      <div
                        className="preview-list"
                        {...provided.droppableProps}
                        ref={provided.innerRef}
                      >
                        {newWork.images.map((img, index) => (
                          <Draggable key={index.toString()} draggableId={index.toString()} index={index}>
                            {(provided) => (
                              <div
                                className="preview-item"
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                                ref={provided.innerRef}
                              >
                                <img src={img.preview} alt="preview" />
                                <button className="remove-img-btn" onClick={() => removeImageInModal(index)}>
                                    <X size={12}/>
                                </button>
                              </div>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>
                </DragDropContext>
              </div>

              <div className="modal-footer">
                <button className="cancel-btn" onClick={() => setShowModal(false)}>Hủy</button>
                <button className="save-btn" onClick={handleSave} disabled={loading}>
                  {loading ? "Đang lưu..." : (editingId ? "Cập nhật" : "Lưu hồ sơ")}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}