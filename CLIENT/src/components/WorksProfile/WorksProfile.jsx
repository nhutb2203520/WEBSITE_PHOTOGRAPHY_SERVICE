import React, { useState, useEffect } from "react";
import { Images, Plus, Edit, Trash2, Eye, X } from "lucide-react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify"; 
import "./WorksProfile.css";
// Giả sử bạn đã tạo WorksProfileService.js như hướng dẫn trước đó
// Nếu chưa có, hãy tạo nó và import vào đây
import worksProfileApi from "../../apis/WorksProfileService"; 

export default function WorksProfile() {
  const navigate = useNavigate();
  const [works, setWorks] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const [editingId, setEditingId] = useState(null); 
  const [newWork, setNewWork] = useState({ title: "", images: [] });

  const token = sessionStorage.getItem("token");
  const userRole = sessionStorage.getItem("role");
  const isPhotographer = userRole === "photographer";

  // Helper: Xử lý URL ảnh
  const getImageUrl = (img) => {
    if (!img) return "https://placehold.co/600x400/png?text=No+Image";
    if (img.startsWith("blob:")) return img; 
    if (img.startsWith("http")) return img; 
    return `http://localhost:5000${img.startsWith('/') ? '' : '/'}${img}`;
  };

  const fetchWorks = async () => {
    try {
      // Sử dụng API Service cho gọn gàng và chuẩn
      const data = await worksProfileApi.getMyWorks();
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

  const handleCreateClick = () => {
    setEditingId(null);
    setNewWork({ title: "", images: [] });
    setShowModal(true);
  };

  const handleEditClick = (work) => {
    setEditingId(work._id);
    const existingImages = work.images.map(imgUrl => ({
      file: null,
      preview: getImageUrl(imgUrl),
      originalUrl: imgUrl,
      isNew: false
    }));
    setNewWork({
      title: work.title,
      images: existingImages
    });
    setShowModal(true);
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    const newImages = files.map((file) => ({
      file, 
      preview: URL.createObjectURL(file),
      isNew: true
    }));
    setNewWork({ ...newWork, images: [...newWork.images, ...newImages] });
  };

  const removeImageInModal = (index) => {
    const updatedImages = [...newWork.images];
    updatedImages.splice(index, 1);
    setNewWork({ ...newWork, images: updatedImages });
  };

  const handleDragEnd = (result) => {
    if (!result.destination) return;
    const reordered = Array.from(newWork.images);
    const [moved] = reordered.splice(result.source.index, 1);
    reordered.splice(result.destination.index, 0, moved);
    setNewWork({ ...newWork, images: reordered });
  };

  // ✅ LOGIC LƯU CHUẨN: GỬI QUA API SERVICE
  const handleSave = async () => {
    if (!newWork.title || newWork.images.length === 0) {
      alert("Vui lòng nhập tên và chọn ít nhất 1 ảnh!");
      return;
    }

    setLoading(true);

    const formData = new FormData();
    formData.append("title", newWork.title);

    // Xử lý ảnh:
    // Backend đang mong đợi "images" là mảng file
    const newFiles = [];
    const keptUrls = [];

    newWork.images.forEach((img) => {
      if (img.isNew && img.file) {
        formData.append("images", img.file); // Append từng file vào "images"
      } else if (!img.isNew && img.originalUrl) {
        keptUrls.push(img.originalUrl);
      }
    });

    // Nếu cần gửi danh sách ảnh cũ để backend biết đường giữ lại (cho Update)
    if (keptUrls.length > 0) {
        formData.append("keptImages", JSON.stringify(keptUrls));
    }

    try {
      let res;
      if (editingId) {
        res = await worksProfileApi.updateWork(editingId, formData);
      } else {
        res = await worksProfileApi.createWork(formData);
      }

      if (res.success) {
        toast.success(editingId ? "Cập nhật thành công!" : "Tạo hồ sơ thành công!");
        setShowModal(false);
        fetchWorks();
      } else {
        alert(res.message || "Có lỗi xảy ra!");
      }
    } catch (err) {
      console.error("❌ Lỗi save:", err);
      alert("Lỗi kết nối server hoặc upload ảnh!");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Bạn có chắc muốn xóa hồ sơ này?")) return;
    try {
      const res = await worksProfileApi.deleteWork(id);
      if (res.success) {
        toast.success("Đã xóa hồ sơ!");
        fetchWorks();
      } else {
        alert(res.message);
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className={`works-container ${isPhotographer ? "photographer-layout" : "center-layout"}`}>
      
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

        <div className="works-gallery">
          {works.length === 0 ? (
            <p className="no-work">Chưa có hồ sơ nào. Hãy tạo hồ sơ đầu tiên!</p>
          ) : (
            works.map((item) => (
              <div key={item._id} className="work-item">
                <div className="work-img-wrapper" onClick={() => navigate(`/workprofile/${item._id}`)}>
                  <img
                    src={getImageUrl(item.images?.[0])}
                    alt={item.title}
                    onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = "https://placehold.co/600x400/png?text=Error";
                    }}
                  />
                  <div className="img-overlay">
                    <span>{item.images?.length || 0} ảnh</span>
                  </div>
                </div>
                
                <div className="work-body">
                  <h4 onClick={() => navigate(`/workprofile/${item._id}`)}>{item.title}</h4>
                  
                  <div className="work-actions">
                    <button className="action-btn view" title="Xem chi tiết" onClick={() => navigate(`/workprofile/${item._id}`)}>
                        <Eye size={16} />
                    </button>
                    
                    <button className="action-btn edit" title="Chỉnh sửa" onClick={() => handleEditClick(item)}>
                        <Edit size={16} />
                    </button>
                    
                    <button className="action-btn delete" title="Xóa" onClick={() => handleDelete(item._id)}>
                        <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

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