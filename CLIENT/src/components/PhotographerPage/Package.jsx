// Package.jsx
import React, { useState } from 'react';
import { Star, Heart, X, Upload } from 'lucide-react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import './Package.css';

export default function Package() {
  const [packages, setPackages] = useState([
    { 
      id: 1, 
      name: 'Gói Chụp Cưới', 
      description: 'Gói chụp ảnh cưới cao cấp với đội ngũ chuyên nghiệp',
      services: ['Chụp ngoại cảnh', 'Chụp studio', 'Dựng video hậu kỳ'],
      images: [
        'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?w=600&h=400&fit=crop',
        'https://images.unsplash.com/photo-1519741497674-611481863552?w=600&h=400&fit=crop'
      ],
      rating: 4.9,
      reviews: 45,
      price: 300,
      favorites: 128
    },
    { 
      id: 2, 
      name: 'Gói Chụp Sự Kiện', 
      description: 'Chụp ảnh sự kiện chuyên nghiệp, lưu giữ mọi khoảnh khắc đẹp',
      services: ['Chụp sự kiện', 'Ảnh hậu trường', 'In album'],
      images: [
        'https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?w=600&h=400&fit=crop'
      ],
      rating: 4.8,
      reviews: 67,
      price: 250,
      favorites: 95
    },
  ]);

  const [showForm, setShowForm] = useState(false);
  const [newPackageName, setNewPackageName] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newServices, setNewServices] = useState(['']);
  const [newPrice, setNewPrice] = useState('');
  const [newImages, setNewImages] = useState([]);

  const addServiceInput = () => setNewServices([...newServices, '']);

  const removeServiceInput = (index) => {
    if (newServices.length > 1) {
      setNewServices(newServices.filter((_, i) => i !== index));
    }
  };

  const handleServiceChange = (index, value) => {
    const updated = [...newServices];
    updated[index] = value;
    setNewServices(updated);
  };

  // Xử lý kéo thả ảnh
  const handleDragEnd = (result) => {
    if (!result.destination) return;
    
    const reordered = Array.from(newImages);
    const [moved] = reordered.splice(result.source.index, 1);
    reordered.splice(result.destination.index, 0, moved);
    setNewImages(reordered);
  };

  // Upload nhiều ảnh
  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    const images = files.map(file => ({
      file,
      preview: URL.createObjectURL(file)
    }));
    setNewImages([...newImages, ...images]);
  };

  // Xóa ảnh
  const removeImage = (index) => {
    const updated = newImages.filter((_, i) => i !== index);
    // Giải phóng URL
    URL.revokeObjectURL(newImages[index].preview);
    setNewImages(updated);
  };

  const handleSavePackage = (e) => {
    e.preventDefault();
    if (!newPackageName.trim()) return alert('Vui lòng nhập tên gói!');
    if (!newDescription.trim()) return alert('Vui lòng nhập mô tả!');
    if (!newPrice || newPrice <= 0) return alert('Vui lòng nhập giá hợp lệ!');
    if (newImages.length === 0) return alert('Vui lòng thêm ít nhất 1 ảnh!');
    
    const filteredServices = newServices.filter(s => s.trim() !== '');
    if (filteredServices.length === 0) return alert('Vui lòng nhập ít nhất 1 dịch vụ!');
    
    const newPackage = {
      id: Date.now(),
      name: newPackageName,
      description: newDescription,
      services: filteredServices,
      images: newImages.map(img => img.preview),
      rating: 5.0,
      reviews: 0,
      price: parseFloat(newPrice),
      favorites: 0
    };
    setPackages([...packages, newPackage]);
    
    // Reset form
    newImages.forEach(img => URL.revokeObjectURL(img.preview));
    setNewPackageName('');
    setNewDescription('');
    setNewServices(['']);
    setNewPrice('');
    setNewImages([]);
    setShowForm(false);
  };

  const handleCancel = () => {
    // Giải phóng URL
    newImages.forEach(img => URL.revokeObjectURL(img.preview));
    setNewPackageName('');
    setNewDescription('');
    setNewServices(['']);
    setNewPrice('');
    setNewImages([]);
    setShowForm(false);
  };

  return (
    <div className="photographer-packages-section">
      <div className="photographer-header">
        <h3>Gói Dịch Vụ Của Tôi</h3>
        {!showForm && (
          <button className="btn-add-package" onClick={() => setShowForm(true)}>
            + Thêm gói mới
          </button>
        )}
      </div>

      {/* Form thêm gói */}
      {showForm && (
        <div className="add-package-form">
          <div className="form-header">
            <h4>Thêm gói dịch vụ mới</h4>
            <button className="btn-close-form" onClick={handleCancel}>
              <X size={20} />
            </button>
          </div>

          <form onSubmit={handleSavePackage}>
            
            {/* Tên gói */}
            <div className="form-group">
              <label>Tên gói dịch vụ *</label>
              <input
                type="text"
                placeholder="Ví dụ: Gói Chụp Cưới"
                value={newPackageName}
                onChange={e => setNewPackageName(e.target.value)}
              />
            </div>

            {/* Giá */}
            <div className="form-group">
              <label>Giá (USD) *</label>
              <input
                type="number"
                placeholder="Ví dụ: 300"
                value={newPrice}
                onChange={e => setNewPrice(e.target.value)}
                min="0"
                step="0.01"
              />
            </div>

            {/* Mô tả */}
            <div className="form-group">
              <label>Mô tả gói dịch vụ *</label>
              <textarea
                placeholder="Mô tả chi tiết về gói dịch vụ..."
                value={newDescription}
                onChange={e => setNewDescription(e.target.value)}
                rows="3"
              />
            </div>

            {/* Upload ảnh */}
            <div className="form-group">
              <label>Hình ảnh * (Kéo thả để sắp xếp)</label>
              <label className="upload-button">
                <Upload className="upload-icon" />
                <span>Chọn nhiều ảnh</span>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageUpload}
                  style={{ display: 'none' }}
                />
              </label>

              {/* Drag and Drop Preview */}
              {newImages.length > 0 && (
                <DragDropContext onDragEnd={handleDragEnd}>
                  <Droppable droppableId="images" direction="horizontal">
                    {(provided) => (
                      <div
                        className="images-preview-dragdrop"
                        {...provided.droppableProps}
                        ref={provided.innerRef}
                      >
                        {newImages.map((img, index) => (
                          <Draggable
                            key={index.toString()}
                            draggableId={index.toString()}
                            index={index}
                          >
                            {(provided, snapshot) => (
                              <div
                                className={`image-preview-item ${
                                  snapshot.isDragging ? 'dragging' : ''
                                }`}
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                              >
                                <img src={img.preview} alt={`Preview ${index + 1}`} />
                                <button
                                  type="button"
                                  className="btn-remove-image"
                                  onClick={() => removeImage(index)}
                                >
                                  <X size={16} />
                                </button>
                                <span className="image-order">#{index + 1}</span>
                              </div>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>
                </DragDropContext>
              )}
            </div>

            {/* Dịch vụ */}
            <div className="form-group">
              <label>Các dịch vụ trong gói *</label>
              <div className="services-inputs">
                {newServices.map((s, idx) => (
                  <div key={idx} className="service-input-row">
                    <input
                      type="text"
                      placeholder={`Dịch vụ ${idx + 1}`}
                      value={s}
                      onChange={e => handleServiceChange(idx, e.target.value)}
                    />
                    {newServices.length > 1 && (
                      <button
                        type="button"
                        className="btn-remove-service"
                        onClick={() => removeServiceInput(idx)}
                      >
                        <X size={18} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
              <button type="button" className="btn-add-service" onClick={addServiceInput}>
                + Thêm dịch vụ
              </button>
            </div>

            {/* Nút hành động */}
            <div className="form-buttons">
              <button type="button" className="btn-cancel" onClick={handleCancel}>
                Hủy
              </button>
              <button type="submit" className="btn-submit">
                Lưu gói dịch vụ
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Grid gói dịch vụ */}
      <div className="photographer-packages-grid">
        {packages.map(pkg => (
          <div key={pkg.id} className="photographer-package-card">
            <div className="package-image">
              <img src={pkg.images[0]} alt={pkg.name} />
              <div className="favorite-display">
                <Heart className="heart-icon" />
                <span className="favorite-count">{pkg.favorites}</span>
              </div>
              {pkg.images.length > 1 && (
                <span className="image-count">+{pkg.images.length - 1} ảnh</span>
              )}
            </div>

            <div className="package-content">
              <h4 className="package-name">{pkg.name}</h4>
              
              <p className="package-description">{pkg.description}</p>

              <div className="package-rating">
                <Star className="star-icon" fill="#fbbf24" color="#fbbf24" />
                <span className="rating-value">{pkg.rating}</span>
                <span className="rating-reviews">({pkg.reviews} đánh giá)</span>
              </div>

              <div className="package-info">
                <span className="package-price">${pkg.price}</span>
                <span className="package-services">{pkg.services.length} dịch vụ</span>
              </div>

              <button className="btn-view-detail">
                Xem chi tiết
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}