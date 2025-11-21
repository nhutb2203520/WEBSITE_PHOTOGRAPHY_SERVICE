import React, { useState, useEffect } from "react";
import { Plus, Edit, Trash2, Upload, Star, X } from "lucide-react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import "./Package.css";
import { useDispatch, useSelector } from "react-redux";
import {
  getMyPackages,
  createPackage,
  updatePackage,
  deletePackage,
  uploadPackageImage,
  uploadPackageImages,
} from "../../redux/Slices/servicepackageSlice";
// ✅ Import component cấu hình phí di chuyển
import TravelFeeConfig from "../TravelFeeConfig/TravelFeeConfig"; 

export default function Package() {
  const dispatch = useDispatch();
  const { packages, loading } = useSelector((state) => state.package);

  const [showModal, setShowModal] = useState(false);
  const [editingPackage, setEditingPackage] = useState(null);

  // ✅ Cập nhật state khởi tạo với trường cấu hình vị trí & phí
  const [formData, setFormData] = useState({
    TenGoi: "",
    MoTa: "",
    DichVu: [{ name: "", Gia: "" }],
    LoaiGoi: "Other",
    ThoiGianThucHien: "",
    // Thêm cấu hình mặc định cho TravelFeeConfig
    baseLocation: {
      address: "",
      city: "",
      district: "",
      coordinates: { lat: null, lng: null },
      mapLink: ""
    },
    travelFeeConfig: {
      enabled: false,
      freeDistanceKm: 10,
      feePerKm: 5000,
      tieredFees: [],
      maxFee: null,
      note: ""
    }
  });

  const [modalImages, setModalImages] = useState([]);

  useEffect(() => {
    dispatch(getMyPackages());
  }, [dispatch]);

  const resetForm = () => {
    setFormData({
      TenGoi: "",
      MoTa: "",
      DichVu: [{ name: "", Gia: "" }],
      LoaiGoi: "Other",
      ThoiGianThucHien: "",
      baseLocation: {
        address: "",
        city: "",
        district: "",
        coordinates: { lat: null, lng: null },
        mapLink: ""
      },
      travelFeeConfig: {
        enabled: false,
        freeDistanceKm: 10,
        feePerKm: 5000,
        tieredFees: [],
        maxFee: null,
        note: ""
      }
    });
    modalImages.forEach((img) => URL.revokeObjectURL(img.preview));
    setModalImages([]);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // ✅ Hàm xử lý thay đổi từ component TravelFeeConfig
  const handleTravelConfigChange = (newConfig) => {
    setFormData((prev) => ({
      ...prev,
      baseLocation: newConfig.baseLocation,
      travelFeeConfig: newConfig.travelFeeConfig
    }));
  };

  const handleServiceChange = (index, field, value) => {
    const newServices = formData.DichVu.map((service, i) => {
      if (i === index) {
        return { ...service, [field]: value };
      }
      return { ...service };
    });
    setFormData((prev) => ({ ...prev, DichVu: newServices }));
  };

  const addServiceField = () => {
    setFormData((prev) => ({
      ...prev,
      DichVu: [...prev.DichVu, { name: "", Gia: "" }],
    }));
  };

  const removeServiceField = (index) => {
    setFormData((prev) => ({
      ...prev,
      DichVu: prev.DichVu.filter((_, i) => i !== index),
    }));
  };

  const handleModalImageUpload = (e) => {
    const files = Array.from(e.target.files || []);
    const images = files.map((file) => ({
      file,
      preview: URL.createObjectURL(file),
    }));
    setModalImages((prev) => [...prev, ...images]);
  };

  const removeModalImage = (index) => {
    URL.revokeObjectURL(modalImages[index].preview);
    setModalImages((prev) => prev.filter((_, i) => i !== index));
  };

  const onDragEndModalImages = (result) => {
    if (!result.destination) return;
    const items = Array.from(modalImages);
    const [moved] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, moved);
    setModalImages(items);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.TenGoi || !formData.MoTa) {
      alert("Vui lòng điền đầy đủ thông tin!");
      return;
    }

    const filteredServices = formData.DichVu.filter(
      (s) => s.name.trim() !== "" && s.Gia !== ""
    );

    if (filteredServices.length === 0) {
      alert("Vui lòng thêm ít nhất 1 dịch vụ có giá!");
      return;
    }

    // Kiểm tra Travel Fee Config (nếu bật thì phải có tọa độ)
    if (formData.travelFeeConfig.enabled) {
      if (!formData.baseLocation.coordinates?.lat || !formData.baseLocation.coordinates?.lng) {
        alert("Vui lòng cập nhật vị trí cơ sở (lấy tọa độ) để tính phí di chuyển!");
        return;
      }
    }

    const packageData = {
      ...formData,
      DichVu: filteredServices.map((s) => ({
        name: s.name,
        Gia: Number(s.Gia),
      })),
    };

    try {
      let resultAction;
      if (editingPackage) {
        resultAction = await dispatch(
          updatePackage({ id: editingPackage._id, data: packageData })
        );
      } else {
        resultAction = await dispatch(createPackage(packageData));
      }

      const createdPkg = resultAction?.payload;
      const pkgId =
        createdPkg?._id || createdPkg?.id || (editingPackage && editingPackage._id);

      if (pkgId && modalImages.length > 0) {
        console.log(`📤 Uploading ${modalImages.length} images...`);

        const coverImageFd = new FormData();
        coverImageFd.append("packageImage", modalImages[0].file);
        await dispatch(uploadPackageImage({ id: pkgId, formData: coverImageFd }));

        if (modalImages.length > 1) {
          const galleryFd = new FormData();
          for (let i = 1; i < modalImages.length; i++) {
            galleryFd.append("packageImages", modalImages[i].file);
          }

          await dispatch(uploadPackageImages({ id: pkgId, formData: galleryFd }));
        }
      }

      resetForm();
      setShowModal(false);
      setEditingPackage(null);
      dispatch(getMyPackages());
    } catch (err) {
      console.error("❌ Lỗi lưu gói:", err);
      alert("Lưu gói thất bại. Kiểm tra console.");
    }
  };

  const handleEdit = (pkg) => {
    setEditingPackage(pkg);
    setFormData({
      TenGoi: pkg.TenGoi || "",
      MoTa: pkg.MoTa || "",
      DichVu:
        pkg.DichVu?.length > 0
          ? pkg.DichVu.map((s) => ({ name: s.name, Gia: s.Gia }))
          : [{ name: "", Gia: "" }],
      LoaiGoi: pkg.LoaiGoi || "Other",
      ThoiGianThucHien: pkg.ThoiGianThucHien || "",
      // Load lại cấu hình cũ hoặc mặc định
      baseLocation: pkg.baseLocation || {
        address: "",
        city: "",
        district: "",
        coordinates: { lat: null, lng: null },
        mapLink: ""
      },
      travelFeeConfig: pkg.travelFeeConfig || {
        enabled: false,
        freeDistanceKm: 10,
        feePerKm: 5000,
        tieredFees: [],
        maxFee: null,
        note: ""
      }
    });
    setModalImages([]);
    setShowModal(true);
  };

  const handleDelete = (id) => {
    if (window.confirm("Bạn có chắc muốn xóa gói này?")) {
      dispatch(deletePackage(id));
    }
  };

  const handleUploadCover = async (id, file) => {
    if (!file) return;
    const fd = new FormData();
    fd.append("packageImage", file);
    try {
      await dispatch(uploadPackageImage({ id, formData: fd }));
      dispatch(getMyPackages());
    } catch (err) {
      console.error("❌ Lỗi upload cover:", err);
      alert("Upload ảnh thất bại.");
    }
  };

  const getImageUrl = (imageUrl) => {
    if (!imageUrl) return "https://via.placeholder.com/600x400?text=No+Image";
    if (imageUrl.startsWith("http")) return imageUrl;
    return `http://localhost:5000/${imageUrl.replace(/^\/+/, "")}`;
  };

  const getPriceRange = (dichVu) => {
    if (!dichVu || dichVu.length === 0) return { min: 0, max: 0 };
    const prices = dichVu.map((s) => Number(s.Gia)).filter((p) => p > 0);
    if (prices.length === 0) return { min: 0, max: 0 };
    return { min: Math.min(...prices), max: Math.max(...prices) };
  };

  const formatPriceRange = (dichVu) => {
    const { min, max } = getPriceRange(dichVu);
    if (min === 0 && max === 0) return "Chưa có giá";
    if (min === max) return `${min.toLocaleString("vi-VN")} VNĐ`;
    return `${min.toLocaleString("vi-VN")} - ${max.toLocaleString("vi-VN")} VNĐ`;
  };

  return (
    <div className="package-management">
      <div className="package-header">
        <h2>Quản lý Gói Dịch Vụ</h2>
        <button
          className="btn-add-package"
          onClick={() => {
            setEditingPackage(null);
            resetForm();
            setShowModal(true);
          }}
        >
          <Plus size={20} />
          Thêm Gói Mới
        </button>
      </div>

      {loading && <div className="loading">Đang tải...</div>}

      {!loading && (!packages || packages.length === 0) && (
        <div className="no-packages">
          <p>Bạn chưa có gói dịch vụ nào.</p>
          <button onClick={() => setShowModal(true)}>Tạo gói đầu tiên</button>
        </div>
      )}

      <div className="packages-grid">
        {packages?.map((pkg) => (
          <div key={pkg._id || pkg.id} className="package-card">
            <div className="package-image">
              <img
                src={getImageUrl(pkg.AnhBia || pkg.images?.[0])}
                alt={pkg.TenGoi || pkg.name}
                onError={(e) =>
                  (e.target.src =
                    "https://via.placeholder.com/600x400?text=No+Image")
                }
              />
              <label className="upload-overlay">
                <Upload size={20} />
                <span>Đổi ảnh</span>
                <input
                  type="file"
                  accept="image/*"
                  hidden
                  onChange={(e) =>
                    handleUploadCover(pkg._id || pkg.id, e.target.files[0])
                  }
                />
              </label>
            </div>

            <div className="package-body">
              <div className="package-badge">{pkg.LoaiGoi}</div>
              <h3>{pkg.TenGoi || pkg.name}</h3>
              <p className="package-description">{pkg.MoTa || pkg.description}</p>

              <div className="package-stats">
                <div className="stat">
                  <Star size={16} fill="#fbbf24" color="#fbbf24" />
                  <span>
                    {pkg.DanhGia?.toFixed
                      ? pkg.DanhGia.toFixed(1)
                      : pkg.DanhGia || 0}
                  </span>
                  <span className="stat-label">({pkg.SoLuotDanhGia || 0})</span>
                </div>
                <div className="stat">
                  <span className="stat-number">{pkg.SoLuongDaDat || 0}</span>
                  <span className="stat-label">đã đặt</span>
                </div>
              </div>

              <div className="package-services">
                <strong>Dịch vụ bao gồm:</strong>
                <ul>
                  {pkg.DichVu?.map((s, i) => (
                    <li key={i}>
                      {s.name} - {Number(s.Gia).toLocaleString("vi-VN")} VNĐ
                    </li>
                  ))}
                </ul>

                <div className="package-price-range">
                  <strong>Khoảng giá:</strong>{" "}
                  <span className="price-highlight">
                    {formatPriceRange(pkg.DichVu)}
                  </span>
                </div>
                
                {/* Hiển thị badge nếu có tính phí di chuyển */}
                {pkg.travelFeeConfig?.enabled && (
                  <div className="travel-fee-badge">
                    <span>🚗 Có tính phí di chuyển</span>
                  </div>
                )}
              </div>

              <div className="package-footer">
                <div className="package-actions">
                  <button onClick={() => handleEdit(pkg)} title="Chỉnh sửa">
                    <Edit size={18} />
                  </button>
                  <button
                    onClick={() => handleDelete(pkg._id || pkg.id)}
                    title="Xóa"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal Form */}
      {showModal && (
        <div
          className="modal-overlay"
          onClick={() => {
            resetForm();
            setShowModal(false);
          }}
        >
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>{editingPackage ? "Chỉnh sửa" : "Tạo"} Gói Dịch Vụ</h3>

            <form onSubmit={handleSubmit}>
              {/* Các trường nhập liệu cơ bản */}
              <div className="form-group">
                <label>Tên gói *</label>
                <input
                  type="text"
                  name="TenGoi"
                  value={formData.TenGoi}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="form-group">
                <label>Mô tả *</label>
                <textarea
                  name="MoTa"
                  value={formData.MoTa}
                  onChange={handleInputChange}
                  required
                  rows="3"
                />
              </div>

              <div className="form-group">
                <label>Loại gói</label>
                <select
                  name="LoaiGoi"
                  value={formData.LoaiGoi}
                  onChange={handleInputChange}
                >
                  <option value="Wedding">Wedding</option>
                  <option value="Event">Event</option>
                  <option value="Family">Family</option>
                  <option value="Portrait">Portrait</option>
                  <option value="Product">Product</option>
                  <option value="Fashion">Fashion</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div className="form-group">
                <label>Thời gian thực hiện</label>
                <input
                  type="text"
                  name="ThoiGianThucHien"
                  value={formData.ThoiGianThucHien}
                  onChange={handleInputChange}
                  placeholder="Ví dụ: 2-3 giờ"
                />
              </div>

              {/* ✅ PHẦN CẤU HÌNH PHÍ DI CHUYỂN */}
              <div className="form-section-divider"></div>
              <TravelFeeConfig 
                value={{
                  baseLocation: formData.baseLocation,
                  travelFeeConfig: formData.travelFeeConfig
                }}
                onChange={handleTravelConfigChange}
              />
              <div className="form-section-divider"></div>

              {/* Upload ảnh */}
              <div className="form-group">
                <label>Hình ảnh (chọn nhiều)</label>
                <label className="upload-button">
                  <Upload size={16} />
                  <span>Chọn ảnh</span>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    hidden
                    onChange={handleModalImageUpload}
                  />
                </label>

                {modalImages.length > 0 && (
                  <DragDropContext onDragEnd={onDragEndModalImages}>
                    <Droppable droppableId="modal-images" direction="horizontal">
                      {(provided) => (
                        <div
                          className="images-preview-dragdrop"
                          {...provided.droppableProps}
                          ref={provided.innerRef}
                        >
                          {modalImages.map((img, idx) => (
                            <Draggable
                              key={idx.toString()}
                              draggableId={idx.toString()}
                              index={idx}
                            >
                              {(prov, snapshot) => (
                                <div
                                  className={`image-preview-item ${
                                    snapshot.isDragging ? "dragging" : ""
                                  }`}
                                  ref={prov.innerRef}
                                  {...prov.draggableProps}
                                  {...prov.dragHandleProps}
                                >
                                  <img src={img.preview} alt={`preview-${idx}`} />
                                  <button
                                    type="button"
                                    className="btn-remove-image"
                                    onClick={() => removeModalImage(idx)}
                                  >
                                    <X size={16} />
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
                )}
              </div>

              {/* Dịch vụ */}
              <div className="form-group">
                <label>Dịch vụ bao gồm *</label>
                {formData.DichVu.map((s, i) => (
                  <div key={i} className="service-input-group">
                    <input
                      type="text"
                      placeholder="Tên dịch vụ"
                      value={s.name}
                      onChange={(e) =>
                        handleServiceChange(i, "name", e.target.value)
                      }
                    />
                    <input
                      type="number"
                      placeholder="Giá (VNĐ)"
                      value={s.Gia}
                      min="0"
                      onChange={(e) =>
                        handleServiceChange(i, "Gia", e.target.value)
                      }
                    />
                    {formData.DichVu.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeServiceField(i)}
                        className="btn-remove-service"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addServiceField}
                  className="btn-add-service"
                >
                  + Thêm dịch vụ
                </button>

                {formData.DichVu.some((s) => s.Gia) && (
                  <div className="form-price-preview">
                    <strong>Khoảng giá:</strong>{" "}
                    <span className="price-highlight">
                      {formatPriceRange(formData.DichVu)}
                    </span>
                  </div>
                )}
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  onClick={() => {
                    resetForm();
                    setShowModal(false);
                  }}
                >
                  Hủy
                </button>
                <button type="submit" disabled={loading}>
                  {loading
                    ? "Đang lưu..."
                    : editingPackage
                    ? "Cập nhật"
                    : "Tạo mới"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}