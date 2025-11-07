import React, { useState, useEffect } from "react";
import { Images, Plus } from "lucide-react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import "./WorksProfile.css";

export default function WorksProfile() {
  const [works, setWorks] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [newWork, setNewWork] = useState({ title: "", images: [] });

  const token = sessionStorage.getItem("token");
  const userRole = sessionStorage.getItem("role"); // 'photographer' hoặc 'user'
  const isPhotographer = userRole === "photographer";

  // 🔹 Lấy danh sách hồ sơ khi vào trang
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

  // 🧩 Kéo thả sắp xếp ảnh
  const handleDragEnd = (result) => {
    if (!result.destination) return;
    const reordered = Array.from(newWork.images);
    const [moved] = reordered.splice(result.source.index, 1);
    reordered.splice(result.destination.index, 0, moved);
    setNewWork({ ...newWork, images: reordered });
  };

  // 📂 Khi chọn nhiều ảnh
  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    const images = files.map((file) => ({
      file,
      preview: URL.createObjectURL(file),
    }));
    setNewWork({ ...newWork, images: [...newWork.images, ...images] });
  };

  // ➕ Lưu hồ sơ mới
  const handleSave = async () => {
    if (!newWork.title || newWork.images.length === 0) {
      alert("Vui lòng nhập tên và chọn ít nhất 1 ảnh!");
      return;
    }

    const formData = new FormData();
    formData.append("title", newWork.title);
    newWork.images.forEach((img) => formData.append("images", img.file));

    try {
      const res = await fetch("http://localhost:5000/api/worksprofile/create", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      const data = await res.json();
      if (data.success) {
        alert("✅ Tạo hồ sơ thành công!");
        setShowModal(false);
        setNewWork({ title: "", images: [] });
        fetchWorks(); // load lại danh sách
      } else {
        alert(data.message || "Lỗi khi tạo hồ sơ!");
      }
    } catch (err) {
      console.error("❌", err);
      alert("Không thể kết nối server!");
    }
  };

  // 🗑️ Xóa hồ sơ
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
    <div
      className={`works-container ${
        isPhotographer ? "photographer-layout" : "center-layout"
      }`}
    >
      {/* Thông tin tài khoản (chỉ hiện khi là photographer) */}
      {isPhotographer && (
        <div className="user-info">
          <img src="/avatar.jpg" alt="avatar" className="avatar-circle-img" />
          <h3>Nguyễn Văn A</h3>
          <p>Photographer</p>
        </div>
      )}

      {/* Portfolio */}
      <div className="works-card">
        <div className="works-header">
          <div className="works-title">
            <Images size={22} />
            <h2>Hồ sơ tác phẩm của bạn</h2>
          </div>
          <button className="add-work-btn" onClick={() => setShowModal(true)}>
            <Plus size={18} /> Thêm hồ sơ
          </button>
        </div>

        {/* Danh sách hồ sơ */}
        <div className="works-gallery">
          {works.length === 0 ? (
            <p className="no-work">Chưa có hồ sơ nào.</p>
          ) : (
            works.map((item) => (
              <div key={item._id} className="work-item">
                <div className="work-img-wrapper">
                  <img
                    src={
                      Array.isArray(item.images) && item.images.length > 0
                        ? `http://localhost:5000${item.images[0]}`
                        : "/placeholder.jpg"
                    }
                    alt={item.title}
                  />
                </div>
                <div className="work-body">
                  <h4>{item.title}</h4>
                  <div className="work-actions">
                    <button className="detail-btn">Xem chi tiết</button>
                    <button
                      className="delete-btn"
                      onClick={() => handleDelete(item._id)}
                    >
                      Xóa
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Popup thêm hồ sơ */}
        {showModal && (
          <div className="modal-overlay">
            <div className="modal">
              <div className="modal-header">
                <h3>Thêm Hồ Sơ Tác Phẩm</h3>
                <button
                  onClick={() => setShowModal(false)}
                  className="close-btn"
                >
                  ✖
                </button>
              </div>

              <div className="modal-body">
                <label>Tên hồ sơ:</label>
                <input
                  type="text"
                  value={newWork.title}
                  onChange={(e) =>
                    setNewWork({ ...newWork, title: e.target.value })
                  }
                  placeholder="Nhập tên hồ sơ..."
                />

                <label>Chọn ảnh:</label>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleFileChange}
                />

                {/* Danh sách ảnh kéo thả */}
                <DragDropContext onDragEnd={handleDragEnd}>
                  <Droppable droppableId="images" direction="horizontal">
                    {(provided) => (
                      <div
                        className="preview-list"
                        {...provided.droppableProps}
                        ref={provided.innerRef}
                      >
                        {newWork.images.map((img, index) => (
                          <Draggable
                            key={index.toString()}
                            draggableId={index.toString()}
                            index={index}
                          >
                            {(provided) => (
                              <div
                                className="preview-item"
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                                ref={provided.innerRef}
                              >
                                <img src={img.preview} alt="preview" />
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
                <button className="save-btn" onClick={handleSave}>
                  Lưu hồ sơ
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
