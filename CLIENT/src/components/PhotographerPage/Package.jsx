// Package.jsx
import React, { useState } from 'react';
import './Package.css';

export default function Package() {
  const [packages, setPackages] = useState([
    { id: 1, name: 'Gói Chụp Cưới', services: ['Chụp ngoại cảnh', 'Chụp studio', 'Dựng video hậu kỳ'] },
    { id: 2, name: 'Gói Chụp Sự Kiện', services: ['Chụp sự kiện', 'Ảnh hậu trường', 'In album'] },
  ]);

  const [showForm, setShowForm] = useState(false); // trạng thái hiện form
  const [newPackageName, setNewPackageName] = useState('');
  const [newServices, setNewServices] = useState(['']);

  const addServiceInput = () => setNewServices([...newServices, '']);

  const handleServiceChange = (index, value) => {
    const updated = [...newServices];
    updated[index] = value;
    setNewServices(updated);
  };

  const handleSavePackage = (e) => {
    e.preventDefault();
    if (!newPackageName.trim()) return alert('Vui lòng nhập tên gói!');
    const filteredServices = newServices.filter(s => s.trim() !== '');
    if (filteredServices.length === 0) return alert('Vui lòng nhập ít nhất 1 dịch vụ!');
    const newPackage = {
      id: Date.now(),
      name: newPackageName,
      services: filteredServices,
    };
    setPackages([...packages, newPackage]);
    // reset form
    setNewPackageName('');
    setNewServices(['']);
    setShowForm(false); // ẩn form sau khi lưu
  };

  const handleCancel = () => {
    // reset form và ẩn
    setNewPackageName('');
    setNewServices(['']);
    setShowForm(false);
  };

  return (
    <div className="packages-page">
      <div className="container">
        <h2>Danh sách Gói Dịch Vụ</h2>
        <div className="packages-grid">
          {packages.map(pkg => (
            <div key={pkg.id} className="package-card">
              <h3>{pkg.name}</h3>
              <ul>
                {pkg.services.map((s, idx) => (
                  <li key={idx}>{s}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Button hiện form */}
        {!showForm && (
          <button className="btn-show-form" onClick={() => setShowForm(true)}>
            + Thêm gói dịch vụ mới
          </button>
        )}

        {/* Form chỉ hiện khi showForm = true */}
        {showForm && (
          <div className="add-package-form">
            <h3>Thêm gói dịch vụ mới</h3>
            <form onSubmit={handleSavePackage}>
              <input
                type="text"
                placeholder="Tên gói dịch vụ"
                value={newPackageName}
                onChange={e => setNewPackageName(e.target.value)}
              />
              <div className="services-inputs">
                {newServices.map((s, idx) => (
                  <input
                    key={idx}
                    type="text"
                    placeholder={`Dịch vụ ${idx + 1}`}
                    value={s}
                    onChange={e => handleServiceChange(idx, e.target.value)}
                  />
                ))}
              </div>
              <div className="form-buttons">
                <button type="button" className="btn-cancel" onClick={handleCancel}>
                  Hủy
                </button>
                <button type="submit" className="btn-submit">
                  Lưu
                </button>
                <button type="button" className="btn-add-service" onClick={addServiceInput}>
                  + Thêm dịch vụ
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
