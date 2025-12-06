import React, { useState, useEffect } from "react";
import { Plus, Edit, Trash2, Upload, Star, X, Info, Image as ImageIcon, CheckCircle, RefreshCw } from "lucide-react";
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
import TravelFeeConfig from "../TravelFeeConfig/TravelFeeConfig";
import userFeeService from "../../apis/userFeeService";

export default function Package() {
  const dispatch = useDispatch();
  const { packages, loading } = useSelector((state) => state.package);

  const [showModal, setShowModal] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [editingPackage, setEditingPackage] = useState(null);
  const [platformFeePercent, setPlatformFeePercent] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
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

  const [modalImages, setModalImages] = useState([]);

  useEffect(() => {
    dispatch(getMyPackages());
    fetchPlatformFee();
  }, [dispatch]);

  const fetchPlatformFee = async () => {
    try {
      const res = await userFeeService.getAllFees();
      const fees = res.data?.data || res.data || [];
      const activeFee = Array.isArray(fees) ? fees.find(f => f.isActive) : null;
      setPlatformFeePercent(activeFee ? activeFee.percentage : 0);
    } catch (error) {
      console.error("Lỗi lấy phí dịch vụ:", error);
    }
  };

  const calculateFinancials = () => {
    const totalServicePrice = formData.DichVu.reduce((sum, item) => {
        return sum + (Number(item.Gia) || 0);
    }, 0);
    const feeAmount = Math.round((totalServicePrice * platformFeePercent) / 100);
    const earning = totalServicePrice - feeAmount;
    return { totalServicePrice, feeAmount, earning };
  };

  const { totalServicePrice, feeAmount, earning } = calculateFinancials();

  const resetForm = () => {
    setFormData({
      TenGoi: "",
      MoTa: "",
      DichVu: [{ name: "", Gia: "" }],
      LoaiGoi: "Other",
      ThoiGianThucHien: "",
      baseLocation: { address: "", city: "", district: "", coordinates: { lat: null, lng: null }, mapLink: "" },
      travelFeeConfig: { enabled: false, freeDistanceKm: 10, feePerKm: 5000, tieredFees: [], maxFee: null, note: "" }
    });
    modalImages.forEach((img) => URL.revokeObjectURL(img.preview));
    setModalImages([]);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleTravelConfigChange = (newConfig) => {
    setFormData((prev) => ({
      ...prev,
      baseLocation: newConfig.baseLocation,
      travelFeeConfig: newConfig.travelFeeConfig
    }));
  };

  const handleServiceChange = (index, field, value) => {
    const newServices = formData.DichVu.map((service, i) => {
      if (i === index) return { ...service, [field]: value };
      return { ...service };
    });
    setFormData((prev) => ({ ...prev, DichVu: newServices }));
  };

  const addServiceField = () => {
    setFormData((prev) => ({ ...prev, DichVu: [...prev.DichVu, { name: "", Gia: "" }] }));
  };

  const removeServiceField = (index) => {
    setFormData((prev) => ({ ...prev, DichVu: prev.DichVu.filter((_, i) => i !== index) }));
  };

  const handleModalImageUpload = (e) => {
    const files = Array.from(e.target.files || []);
    const images = files.map((file) => ({ file, preview: URL.createObjectURL(file) }));
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

  // ✅ HÀM SUBMIT ĐÃ ĐƯỢC SỬA LỖI
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.TenGoi || !formData.MoTa) return alert("Vui lòng điền đầy đủ tên và mô tả!");
    
    const filteredServices = formData.DichVu.filter((s) => s.name.trim() !== "" && s.Gia !== "");
    if (filteredServices.length === 0) return alert("Vui lòng thêm ít nhất 1 dịch vụ có giá!");

    if (!editingPackage && modalImages.length === 0) {
      return alert("Vui lòng tải lên ít nhất 1 ảnh bìa cho gói dịch vụ!");
    }

    if (formData.travelFeeConfig.enabled) {
      if (!formData.baseLocation.coordinates?.lat || !formData.baseLocation.coordinates?.lng) {
        return alert("Vui lòng cập nhật vị trí cơ sở (lấy tọa độ) để tính phí di chuyển!");
      }
    }

    const packageData = {
      ...formData,
      DichVu: filteredServices.map((s) => ({ name: s.name, Gia: Number(s.Gia) })),
    };

    try {
      setIsSubmitting(true);
      let pkgId;

      // 1. TẠO HOẶC CẬP NHẬT GÓI
      if (editingPackage) {
        // Dùng .unwrap() để bắt lỗi chính xác từ Redux Toolkit
        await dispatch(updatePackage({ id: editingPackage._id, data: packageData })).unwrap();
        pkgId = editingPackage._id;
      } else {
        const resultAction = await dispatch(createPackage(packageData)).unwrap();
        // Lấy ID từ response (thường là resultAction.package._id hoặc resultAction._id tùy backend trả về)
        pkgId = resultAction.package?._id || resultAction._id || resultAction.id;
      }

      console.log("📦 Gói đã được lưu, ID:", pkgId);

      // 2. UPLOAD ẢNH (Nếu có ID và có ảnh trong modal)
      if (pkgId && modalImages.length > 0) {
        // Upload ảnh bìa (Ảnh đầu tiên)
        if (modalImages[0].file) {
           const coverImageFd = new FormData();
           coverImageFd.append("packageImage", modalImages[0].file);
           await dispatch(uploadPackageImage({ id: pkgId, formData: coverImageFd })).unwrap();
        }

        // Upload Gallery (Các ảnh còn lại)
        const galleryFiles = modalImages.slice(1).filter(img => img.file).map(img => img.file);
        if (galleryFiles.length > 0) {
           const galleryFd = new FormData();
           galleryFiles.forEach((file) => {
              galleryFd.append("packageImages", file);
           });
           await dispatch(uploadPackageImages({ id: pkgId, formData: galleryFd })).unwrap();
        }
      }

      // 3. THÀNH CÔNG -> RESET VÀ RELOAD
      resetForm();
      setShowModal(false);
      setEditingPackage(null);
      setShowSuccess(true);
      
      // Reload danh sách để cập nhật ảnh mới nhất
      dispatch(getMyPackages());

    } catch (err) {
      console.error("❌ Lỗi lưu gói:", err);
      alert(err.message || "Lưu gói thất bại. Vui lòng thử lại.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (pkg) => {
    setEditingPackage(pkg);
    setFormData({
      TenGoi: pkg.TenGoi || "",
      MoTa: pkg.MoTa || "",
      DichVu: pkg.DichVu?.length > 0 ? pkg.DichVu.map((s) => ({ name: s.name, Gia: s.Gia })) : [{ name: "", Gia: "" }],
      LoaiGoi: pkg.LoaiGoi || "Other",
      ThoiGianThucHien: pkg.ThoiGianThucHien || "",
      baseLocation: pkg.baseLocation || { address: "", city: "", district: "", coordinates: { lat: null, lng: null }, mapLink: "" },
      travelFeeConfig: pkg.travelFeeConfig || { enabled: false, freeDistanceKm: 10, feePerKm: 5000, tieredFees: [], maxFee: null, note: "" }
    });
    setModalImages([]);
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm("Bạn có chắc muốn xóa gói này?")) {
      await dispatch(deletePackage(id));
      dispatch(getMyPackages()); 
    }
  };

  const handleUploadCover = async (id, file) => {
    if (!file) return;
    const fd = new FormData();
    fd.append("packageImage", file);
    try {
      await dispatch(uploadPackageImage({ id, formData: fd })).unwrap();
      setShowSuccess(true); 
      dispatch(getMyPackages()); // Reload ảnh mới ngay
    } catch (err) {
      alert("Upload ảnh thất bại.");
    }
  };

  // ✅ HÀM XỬ LÝ URL ẢNH (FIX LỖI HIỂN THỊ)
  const getImageUrl = (imageUrl) => {
    if (!imageUrl) return "https://placehold.co/600x400/png?text=Chua+co+anh"; 
    if (imageUrl.startsWith("http")) return imageUrl;
    // Đảm bảo trỏ đúng port server backend của bạn (thường là 5000)
    return `http://localhost:5000/${imageUrl.replace(/^\/+/, "")}`;
  };

  const formatPriceRange = (dichVu) => {
    if (!dichVu || dichVu.length === 0) return "Chưa có giá";
    const prices = dichVu.map((s) => Number(s.Gia)).filter((p) => p > 0);
    if (prices.length === 0) return "Chưa có giá";
    const min = Math.min(...prices);
    const max = Math.max(...prices);
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
        {packages?.map((pkg) => {
           // Lấy ảnh bìa hoặc ảnh đầu tiên trong mảng Images
           const imgUrl = getImageUrl(pkg.AnhBia || (pkg.Images && pkg.Images[0]) || pkg.images?.[0]);
           return (
            <div key={pkg._id || pkg.id} className="package-card">
              <div className="package-image" style={{ backgroundColor: "#e5e7eb" }}>
                  <img
                    src={imgUrl}
                    alt={pkg.TenGoi}
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    onError={(e) => { 
                      e.target.onerror = null; // Tránh loop vô hạn
                      e.target.src = "https://placehold.co/600x400/png?text=Loi+anh";
                      e.target.parentElement.classList.add('img-error');
                    }} 
                  />
                
                <label className="upload-overlay">
                  <Upload size={20} />
                  <span>Đổi ảnh</span>
                  <input
                    type="file"
                    accept="image/*"
                    hidden
                    onChange={(e) => handleUploadCover(pkg._id || pkg.id, e.target.files[0])}
                  />
                </label>
              </div>

              <div className="package-body">
                <div className="package-badge">{pkg.LoaiGoi}</div>
                <h3>{pkg.TenGoi}</h3>
                <p className="package-description">{pkg.MoTa}</p>

                <div className="package-stats">
                  <div className="stat">
                    <Star size={16} fill="#fbbf24" color="#fbbf24" />
                    <span>{pkg.DanhGia?.toFixed(1) || 0}</span>
                    <span className="stat-label">({pkg.SoLuotDanhGia || 0})</span>
                  </div>
                  <div className="stat">
                    <span className="stat-number">{pkg.SoLuongDaDat || 0}</span>
                    <span className="stat-label">đã đặt</span>
                  </div>
                </div>

                <div className="package-services">
                  <strong>Dịch vụ:</strong>
                  <ul>
                    {pkg.DichVu?.slice(0, 3).map((s, i) => (
                      <li key={i}>{s.name} - {Number(s.Gia).toLocaleString()}đ</li>
                    ))}
                    {pkg.DichVu?.length > 3 && <li>...</li>}
                  </ul>
                  <div className="package-price-range">
                    <strong>Giá:</strong> <span className="price-highlight">{formatPriceRange(pkg.DichVu)}</span>
                  </div>
                  {pkg.travelFeeConfig?.enabled && (
                    <div className="travel-fee-badge"><span>🚗 Có tính phí di chuyển</span></div>
                  )}
                </div>

                <div className="package-footer">
                  <div className="package-actions">
                    <button onClick={() => handleEdit(pkg)}><Edit size={18} /></button>
                    <button onClick={() => handleDelete(pkg._id || pkg.id)}><Trash2 size={18} /></button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal Form */}
      {showModal && (
        <div className="modal-overlay" onClick={() => { resetForm(); setShowModal(false); }}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>{editingPackage ? "Chỉnh sửa" : "Tạo"} Gói Dịch Vụ</h3>
            <form onSubmit={handleSubmit}>
              {/* --- FORM FIELDS --- */}
              <div className="form-group">
                <label>Tên gói *</label>
                <input type="text" name="TenGoi" value={formData.TenGoi} onChange={handleInputChange} required />
              </div>
              <div className="form-group">
                <label>Mô tả *</label>
                <textarea name="MoTa" value={formData.MoTa} onChange={handleInputChange} required rows="3" />
              </div>
              <div className="form-group">
                <label>Loại gói</label>
                <select name="LoaiGoi" value={formData.LoaiGoi} onChange={handleInputChange}>
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
                <input type="text" name="ThoiGianThucHien" value={formData.ThoiGianThucHien} onChange={handleInputChange} placeholder="Ví dụ: 2-3 giờ" />
              </div>

              <div className="form-section-divider"></div>
              <TravelFeeConfig value={{ baseLocation: formData.baseLocation, travelFeeConfig: formData.travelFeeConfig }} onChange={handleTravelConfigChange} />
              <div className="form-section-divider"></div>

              <div className="form-group">
                <label>Hình ảnh (Bắt buộc)</label>
                <label className="upload-button">
                  <Upload size={16} /><span>Chọn ảnh</span>
                  <input type="file" accept="image/*" multiple hidden onChange={handleModalImageUpload} />
                </label>
                {modalImages.length > 0 && (
                  <DragDropContext onDragEnd={onDragEndModalImages}>
                    <Droppable droppableId="modal-images" direction="horizontal">
                      {(provided) => (
                        <div className="images-preview-dragdrop" {...provided.droppableProps} ref={provided.innerRef}>
                          {modalImages.map((img, idx) => (
                            <Draggable key={idx.toString()} draggableId={idx.toString()} index={idx}>
                              {(prov, snapshot) => (
                                <div className={`image-preview-item ${snapshot.isDragging ? "dragging" : ""}`} ref={prov.innerRef} {...prov.draggableProps} {...prov.dragHandleProps}>
                                  <img src={img.preview} alt={`preview-${idx}`} />
                                  <button type="button" className="btn-remove-image" onClick={() => removeModalImage(idx)}><X size={16} /></button>
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

              <div className="form-group">
                <label>Dịch vụ bao gồm *</label>
                {formData.DichVu.map((s, i) => (
                  <div key={i} className="service-input-group">
                    <input type="text" placeholder="Tên dịch vụ" value={s.name} onChange={(e) => handleServiceChange(i, "name", e.target.value)} />
                    <input type="number" placeholder="Giá" value={s.Gia} min="0" onChange={(e) => handleServiceChange(i, "Gia", e.target.value)} />
                    {formData.DichVu.length > 1 && <button type="button" onClick={() => removeServiceField(i)} className="btn-remove-service">✕</button>}
                  </div>
                ))}
                <button type="button" onClick={addServiceField} className="btn-add-service">+ Thêm dịch vụ</button>

                {totalServicePrice > 0 && (
                  <div className="financial-preview-box">
                    <div className="financial-row"><span>Tổng giá trị:</span><span className="font-bold text-blue-600">{totalServicePrice.toLocaleString()} VNĐ</span></div>
                    <div className="financial-row"><span><Info size={14}/> Phí sàn ({platformFeePercent}%):</span><span className="font-bold text-red-500">-{feeAmount.toLocaleString()} VNĐ</span></div>
                    <div className="financial-divider"></div>
                    <div className="financial-row total"><span>Thực nhận dự kiến:</span><span className="font-bold text-green-600">{earning.toLocaleString()} VNĐ</span></div>
                    <p className="financial-note">* Phí dịch vụ sẽ được khấu trừ khi hoàn thành đơn hàng.</p>
                  </div>
                )}
              </div>

              <div className="modal-actions">
                <button type="button" onClick={() => { resetForm(); setShowModal(false); }}>Hủy</button>
                <button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Đang xử lý..." : editingPackage ? "Cập nhật" : "Tạo mới"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ✅ MODAL THÔNG BÁO THÀNH CÔNG */}
      {showSuccess && (
        <div className="modal-overlay">
           <div className="modal-content success-content">
              <div className="success-icon-wrapper">
                 <CheckCircle size={64} strokeWidth={2} />
              </div>
              <h3>Lưu thành công!</h3>
              <p>Gói dịch vụ đã được lưu vào hệ thống. Vui lòng tải lại trang để cập nhật danh sách và hình ảnh mới nhất.</p>
              
              <button className="btn-reload-page" onClick={() => window.location.reload()}>
                 <RefreshCw size={18} /> Tải lại trang ngay
              </button>
              
              <button className="btn-close-success" onClick={() => setShowSuccess(false)}>
                 Đóng và làm việc tiếp
              </button>
           </div>
        </div>
      )}
    </div>
  );
}