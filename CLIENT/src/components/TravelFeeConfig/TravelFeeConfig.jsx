import React, { useState, useEffect } from 'react';
import { MapPin, Navigation, Truck, Info, AlertCircle } from 'lucide-react';
import { toast } from 'react-toastify';
import './TravelFeeConfig.css'; // File CSS riêng cho component này

export default function TravelFeeConfig({ value, onChange }) {
  // State local để quản lý hiển thị
  const [config, setConfig] = useState({
    baseLocation: {
      address: '',
      city: '',
      district: '',
      coordinates: { lat: null, lng: null },
      mapLink: '',
      ...value?.baseLocation
    },
    travelFeeConfig: {
      enabled: false,
      freeDistanceKm: 10,
      feePerKm: 5000,
      maxFee: null,
      ...value?.travelFeeConfig
    }
  });

  // Đồng bộ khi props value thay đổi từ bên ngoài (nếu cần)
  useEffect(() => {
    if (value) {
      setConfig(prev => ({
        ...prev,
        baseLocation: { ...prev.baseLocation, ...value.baseLocation },
        travelFeeConfig: { ...prev.travelFeeConfig, ...value.travelFeeConfig }
      }));
    }
  }, [value]);

  // Hàm helper để gửi dữ liệu ra ngoài cho form cha
  const emitChange = (newConfig) => {
    setConfig(newConfig);
    if (onChange) {
      onChange(newConfig);
    }
  };

  // 1. Xử lý lấy vị trí GPS
  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
      return toast.error("Trình duyệt không hỗ trợ định vị!");
    }

    toast.info("Đang lấy vị trí...");
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        const { latitude, longitude } = coords;
        const link = `https://www.google.com/maps?q=${latitude},${longitude}`;
        
        // ✅ Cập nhật state và GỬI NGAY cho form cha
        const newConfig = {
          ...config,
          baseLocation: {
            ...config.baseLocation,
            coordinates: { lat: latitude, lng: longitude },
            mapLink: link
          }
        };
        
        emitChange(newConfig); // Quan trọng: Gọi hàm này để update formData ở cha
        toast.success(`Đã lấy tọa độ: ${latitude.toFixed(6)}, ${longitude.toFixed(6)}`);
      },
      (err) => {
        console.error("Geolocation error:", err);
        toast.error("Không thể lấy vị trí. Hãy kiểm tra quyền truy cập.");
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  // 2. Xử lý nhập Link Map
  const handleMapLinkChange = (e) => {
    const link = e.target.value;
    let newCoords = config.baseLocation.coordinates;

    // Thử parse tọa độ từ link (nếu user paste link google map)
    const patterns = [
      /[?&]q=(-?\d+\.?\d*),(-?\d+\.?\d*)/,
      /@(-?\d+\.?\d*),(-?\d+\.?\d*)/
    ];

    for (const pattern of patterns) {
      const match = link.match(pattern);
      if (match) {
        newCoords = { lat: parseFloat(match[1]), lng: parseFloat(match[2]) };
        toast.success("Đã nhận diện tọa độ từ link!");
        break;
      }
    }

    const newConfig = {
      ...config,
      baseLocation: {
        ...config.baseLocation,
        mapLink: link,
        coordinates: newCoords
      }
    };
    emitChange(newConfig);
  };

  // 3. Xử lý các input text/number khác
  const handleChange = (section, field, val) => {
    const newConfig = {
      ...config,
      [section]: {
        ...config[section],
        [field]: val
      }
    };
    emitChange(newConfig);
  };

  return (
    <div className="travel-fee-wrapper">
      {/* --- Phần Vị Trí --- */}
      <div className="tf-section">
        <div className="tf-header">
          <MapPin className="tf-icon" size={20} />
          <h4>Vị trí cơ sở của bạn</h4>
        </div>
        <p className="tf-desc">
          Địa điểm này dùng làm mốc để tính khoảng cách di chuyển đến khách hàng.
        </p>

        <div className="tf-grid">
          <div className="tf-input-group">
            <label>Địa chỉ chi tiết</label>
            <input 
              type="text" 
              value={config.baseLocation.address}
              onChange={(e) => handleChange('baseLocation', 'address', e.target.value)}
              placeholder="VD: 123 Đường ABC, Quận 1..."
            />
          </div>
          
          <div className="tf-row">
            <div className="tf-input-group">
              <label>Thành phố</label>
              <input 
                type="text" 
                value={config.baseLocation.city}
                onChange={(e) => handleChange('baseLocation', 'city', e.target.value)}
              />
            </div>
            <div className="tf-input-group">
              <label>Quận/Huyện</label>
              <input 
                type="text" 
                value={config.baseLocation.district}
                onChange={(e) => handleChange('baseLocation', 'district', e.target.value)}
              />
            </div>
          </div>

          <div className="tf-input-group">
            <label>Link Google Maps / Tọa độ GPS</label>
            <div className="map-input-wrapper">
              <input 
                type="text"
                value={config.baseLocation.mapLink}
                onChange={handleMapLinkChange}
                placeholder="Dán link Google Maps hoặc bấm nút lấy vị trí"
              />
              <button type="button" onClick={handleGetCurrentLocation} className="btn-get-location">
                <Navigation size={16} /> Lấy vị trí
              </button>
            </div>
            {/* Hiển thị tọa độ đã lấy được */}
            {config.baseLocation.coordinates?.lat && (
              <div className="coords-badge">
                <MapPin size={12} />
                Tọa độ: <strong>{config.baseLocation.coordinates.lat}, {config.baseLocation.coordinates.lng}</strong>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* --- Phần Cấu Hình Phí --- */}
      <div className="tf-section">
        <div className="tf-header">
          <Truck className="tf-icon" size={20} />
          <h4>Cấu hình phí di chuyển</h4>
        </div>

        <label className="tf-toggle">
          <input 
            type="checkbox"
            checked={config.travelFeeConfig.enabled}
            onChange={(e) => handleChange('travelFeeConfig', 'enabled', e.target.checked)}
          />
          <span className="tf-toggle-slider"></span>
          <span className="tf-toggle-label">Bật tính phí di chuyển tự động</span>
        </label>

        {config.travelFeeConfig.enabled && (
          <div className="tf-fee-options">
            <div className="tf-row">
              <div className="tf-input-group">
                <label>Miễn phí trong (km)</label>
                <input 
                  type="number" 
                  min="0"
                  value={config.travelFeeConfig.freeDistanceKm}
                  onChange={(e) => handleChange('travelFeeConfig', 'freeDistanceKm', Number(e.target.value))}
                />
              </div>
              <div className="tf-input-group">
                <label>Phí mỗi km tiếp theo (VNĐ)</label>
                <input 
                  type="number" 
                  min="0" step="1000"
                  value={config.travelFeeConfig.feePerKm}
                  onChange={(e) => handleChange('travelFeeConfig', 'feePerKm', Number(e.target.value))}
                />
              </div>
            </div>
            
            <div className="tf-input-group">
              <label>Phí tối đa (VNĐ) - Tùy chọn</label>
              <input 
                type="number" 
                placeholder="Không giới hạn"
                value={config.travelFeeConfig.maxFee || ''}
                onChange={(e) => handleChange('travelFeeConfig', 'maxFee', e.target.value ? Number(e.target.value) : null)}
              />
            </div>

            <div className="tf-preview">
              <Info size={16} />
              <span>
                Ví dụ: Khách cách 15km. Miễn phí 10km đầu. Tính phí 5km x {Number(config.travelFeeConfig.feePerKm).toLocaleString()}đ 
                = <strong>{(5 * config.travelFeeConfig.feePerKm).toLocaleString()} VNĐ</strong>
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}