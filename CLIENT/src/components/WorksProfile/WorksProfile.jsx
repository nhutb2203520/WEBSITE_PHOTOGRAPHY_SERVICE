import React, { useState } from "react";
import { Images, Plus, X } from "lucide-react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import "./WorksProfile.css";

export default function WorksProfile() {
  const [works, setWorks] = useState([]); // Không có dữ liệu giả lập
  const [showModal, setShowModal] = useState(false);
  const [newWork, setNewWork] = useState({ title: "", images: [] });

  // 🧩 Xử lý khi kéo thả để sắp xếp ảnh
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
    const token = localStorage.getItem("accessToken"); // hoặc sessionStorage
    const res = await fetch("http://localhost:5000/api/worksprofile/create", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });

    const data = await res.json();
    if (res.ok) {
      alert("Tạo hồ sơ thành công!");
      setWorks([...works, data.data]);
      setNewWork({ title: "", images: [] });
      setShowModal(false);
    } else {
      alert(data.message || "Lỗi khi tạo hồ sơ!");
    }
  } catch (err) {
    console.error(err);
    alert("Không thể kết nối server!");
  }
};


  return (
    <div className="works-card">
      <div className="works-header">
        <div className="works-title">
          <Images size={22} />
          <h2>Hồ sơ tác phẩm của bạn</h2>
        </div>
        <button className="add-work-btn" onClick={() => setShowModal(true)}>
          + Thêm hồ sơ
        </button>
      </div>

      {/* Danh sách hồ sơ */}
      <div className="works-gallery">
        {works.map((item) => (
          <div key={item.id} className="work-item">
            <div className="work-img-wrapper">
              <img
                src={item.images[0]?.preview}
                alt={item.title}
              />
            </div>
            <div className="work-body">
              <h4>{item.title}</h4>
              <button className="detail-btn">Xem chi tiết</button>
            </div>
          </div>
        ))}
      </div>

      {/* Popup thêm hồ sơ */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3>Thêm Hồ Sơ Tác Phẩm</h3>
              <button onClick={() => setShowModal(false)} className="close-btn">
                <X size={20} />
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
              <input type="file" multiple accept="image/*" onChange={handleFileChange} />

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
  );
}
