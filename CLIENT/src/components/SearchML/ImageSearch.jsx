import React, { useState } from 'react';
import { Upload, Search, X, Image as ImageIcon, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom'; // ✅ Import Link để điều hướng
import servicePackageApi from '../../apis/ServicePackageService';
import worksProfileApi from '../../apis/WorksProfileService'; 
import './ImageSearch.css';

const ImageSearch = () => {
  const [selectedImage, setSelectedImage] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  
  // Tách riêng 2 loại kết quả
  const [packageResults, setPackageResults] = useState([]);
  const [workResults, setWorkResults] = useState([]);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [hasSearched, setHasSearched] = useState(false);

  // Helper: Xử lý link ảnh
  const getImageUrl = (img) => {
    if (!img) return "https://placehold.co/600x400/png?text=No+Image";
    if (img.startsWith("http")) return img;
    return `http://localhost:5000/${img.replace(/^\/+/, "")}`;
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedImage(file);
      setPreviewUrl(URL.createObjectURL(file));
      setError(null);
      setPackageResults([]);
      setWorkResults([]);
      setHasSearched(false);
    }
  };

  const handleClearImage = () => {
    setSelectedImage(null);
    setPreviewUrl(null);
    setPackageResults([]);
    setWorkResults([]);
    setHasSearched(false);
    setError(null);
  };

  const handleSearch = async () => {
    if (!selectedImage) return;

    setLoading(true);
    setError(null);
    setHasSearched(true);

    const formData = new FormData();
    formData.append('image', selectedImage);

    try {
      // ✅ Gọi song song cả 2 API
      const [pkgRes, workRes] = await Promise.allSettled([
        servicePackageApi.searchByImage(formData),
        worksProfileApi.searchByImage(formData)
      ]);

      // Xử lý kết quả Gói dịch vụ
      if (pkgRes.status === 'fulfilled' && pkgRes.value.success) {
        // ⚡ LỌC KẾT QUẢ > 50%
        const filteredPkgs = (pkgRes.value.packages || []).filter(item => item.similarity_score > 0.5);
        setPackageResults(filteredPkgs);
      }

      // Xử lý kết quả Works Profile
      if (workRes.status === 'fulfilled' && workRes.value.success) {
        // ⚡ LỌC KẾT QUẢ > 50%
        const filteredWorks = (workRes.value.works || []).filter(item => item.similarity_score > 0.5);
        setWorkResults(filteredWorks);
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
      <div className="search-header">
          <h3>Tìm kiếm thông minh</h3>
          <p>Tải lên ảnh phong cách bạn muốn, hệ thống sẽ tìm gói chụp và album tương tự.</p>
      </div>
      
      <div className="search-box">
        {!previewUrl ? (
          <label className="upload-placeholder">
            <Upload size={40} strokeWidth={1.5} />
            <span>Nhấn để tải ảnh lên</span>
            <span className="sub-text">(JPG, PNG - Max 50MB)</span>
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
            {loading ? (
                <span className="loader"></span>
            ) : (
                <> Phân tích & Tìm kiếm</>
            )}
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}

      {/* KẾT QUẢ TÌM KIẾM */}
      {hasSearched && !loading && (
        <div className="search-results-container">
            
            {/* 1. SECTION: GÓI DỊCH VỤ */}
            <div className="result-section">
                <div className="section-title">
                    <h4>📦 Gói Dịch Vụ Gợi Ý ({packageResults.length})</h4>
                </div>
                {packageResults.length > 0 ? (
                    <div className="search-results-grid">
                        {packageResults.map((pkg) => (
                        <Link to={`/package/${pkg._id}`} key={pkg._id} className="result-card">
                            <div className="similarity-badge" style={{backgroundColor: pkg.similarity_score > 0.7 ? '#22c55e' : '#eab308'}}>
                                {Math.round(pkg.similarity_score * 100)}% Giống
                            </div>
                            <div className="card-img-box">
                                <img 
                                    src={getImageUrl(pkg.AnhBia || (pkg.Images && pkg.Images[0]))} 
                                    alt={pkg.TenGoi} 
                                />
                            </div>
                            <div className="result-info">
                                <h5>{pkg.TenGoi}</h5>
                                <p className="desc">{pkg.MoTa?.substring(0, 40)}...</p>
                                <div className="bottom-row">
                                    <span className="price">{pkg.DichVu?.[0]?.Gia?.toLocaleString()}đ</span>
                                    <ArrowRight size={14} className="arrow-icon"/>
                                </div>
                            </div>
                        </Link>
                        ))}
                    </div>
                ) : (
                    <p className="empty-text">Không tìm thấy gói dịch vụ nào phù hợp trên 50%.</p>
                )}
            </div>

            <div className="divider"></div>

            {/* 2. SECTION: WORKS PROFILE */}
            <div className="result-section">
                <div className="section-title">
                    <h4>📸 Album / Hồ Sơ Mẫu ({workResults.length})</h4>
                </div>
                {workResults.length > 0 ? (
                    <div className="search-results-grid">
                        {workResults.map((work) => (
                        <Link to={`/workprofile/${work._id}`} key={work._id} className="result-card work-card">
                            <div className="similarity-badge" style={{backgroundColor: work.similarity_score > 0.7 ? '#3b82f6' : '#6366f1'}}>
                                {Math.round(work.similarity_score * 100)}% Giống
                            </div>
                            <div className="card-img-box">
                                <img 
                                    src={getImageUrl(work.images?.[0])} 
                                    alt={work.title} 
                                />
                            </div>
                            <div className="result-info">
                                <h5>{work.title}</h5>
                                <div className="photographer-info">
                                    <img 
                                        src={getImageUrl(work.userId?.Avatar)} 
                                        onError={(e) => e.target.src="https://via.placeholder.com/30"}
                                        alt="avatar" 
                                    />
                                    <span>{work.userId?.HoTen || "Nhiếp ảnh gia"}</span>
                                </div>
                            </div>
                        </Link>
                        ))}
                    </div>
                ) : (
                    <p className="empty-text">Không tìm thấy album mẫu nào phù hợp trên 50%.</p>
                )}
            </div>

        </div>
      )}
    </div>
  );
};

export default ImageSearch;