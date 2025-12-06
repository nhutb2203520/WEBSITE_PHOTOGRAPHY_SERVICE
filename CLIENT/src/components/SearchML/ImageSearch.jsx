import React, { useState } from 'react';
import { Upload, Search, X, ImageIcon } from 'lucide-react';
import servicePackageApi from '../../apis/ServicePackageService'; // Import đúng đường dẫn file api của bạn
import './ImageSearch.css'; // File CSS bạn tự tạo nhé

const ImageSearch = () => {
  const [selectedImage, setSelectedImage] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedImage(file);
      setPreviewUrl(URL.createObjectURL(file));
      setError(null);
      setSearchResults([]); // Reset kết quả cũ
    }
  };

  const handleClearImage = () => {
    setSelectedImage(null);
    setPreviewUrl(null);
    setSearchResults([]);
    setError(null);
  };

  const handleSearch = async () => {
    if (!selectedImage) return;

    setLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append('image', selectedImage);

    try {
      const res = await servicePackageApi.searchByImage(formData);
      if (res.success) {
        setSearchResults(res.packages || []);
        if (res.packages.length === 0) {
            setError("Không tìm thấy gói dịch vụ nào tương tự.");
        }
      } else {
        setError("Lỗi khi tìm kiếm.");
      }
    } catch (err) {
      console.error(err);
      setError("Có lỗi xảy ra khi kết nối server.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="image-search-container">
      <h3>Tìm kiếm bằng hình ảnh</h3>
      
      <div className="search-box">
        {!previewUrl ? (
          <label className="upload-placeholder">
            <Upload size={32} />
            <span>Tải ảnh mẫu lên để tìm gói tương tự</span>
            <input type="file" accept="image/*" onChange={handleImageChange} hidden />
          </label>
        ) : (
          <div className="image-preview-wrapper">
            <img src={previewUrl} alt="Search preview" className="search-preview-img" />
            <button className="btn-clear" onClick={handleClearImage}><X size={16} /></button>
          </div>
        )}

        <button 
            className="btn-search-ai" 
            onClick={handleSearch} 
            disabled={!selectedImage || loading}
        >
            {loading ? 'Đang phân tích...' : <><Search size={18} /> Tìm kiếm ngay</>}
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}

      {/* HIỂN THỊ KẾT QUẢ */}
      <div className="search-results-grid">
        {searchResults.map((pkg) => (
          <div key={pkg._id} className="result-card">
             <div className="similarity-badge">
                Độ giống: {(pkg.similarity_score * 100).toFixed(0)}%
             </div>
             <img 
                src={pkg.AnhBia || (pkg.Images && pkg.Images[0])} 
                alt={pkg.TenGoi} 
                className="result-img"
             />
             <div className="result-info">
                <h4>{pkg.TenGoi}</h4>
                <p>{pkg.MoTa?.substring(0, 50)}...</p>
                <div className="price-tag">
                    {pkg.DichVu?.[0]?.Gia?.toLocaleString()} VNĐ
                </div>
             </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ImageSearch;