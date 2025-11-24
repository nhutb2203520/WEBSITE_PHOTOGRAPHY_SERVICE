import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { 
  ArrowLeft, X, ZoomIn, Calendar, User,
  ChevronLeft, ChevronRight
} from "lucide-react";

import Header from "../Header/Header";
import Sidebar from "../Sidebar/Sidebar";
import Footer from "../Footer/Footer";

import "./WorkProfileDetail.css";

export default function WorkProfileDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [work, setWork] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedIndex, setSelectedIndex] = useState(-1);

  const token = sessionStorage.getItem("token");

  const getImageUrl = (img) => {
    if (!img) return "";
    if (img.startsWith("http")) return img;
    return `http://localhost:5000${img}`;
  };

  useEffect(() => {
    const fetchWorkDetail = async () => {
      try {
        const res = await fetch(`http://localhost:5000/api/worksprofile/${id}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        const data = await res.json();
        if (data.success || data.work) {
          setWork(data.work || data);
        } else {
          navigate(-1);
        }
      } catch (err) {
        console.error("Lỗi tải chi tiết:", err);
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchWorkDetail();
  }, [id, navigate, token]);


  /* ========= LIGHTBOX NAV ========= */
  const showNextImage = useCallback(
    (e) => {
      e?.stopPropagation();
      if (work?.images?.length > 0) {
        setSelectedIndex((prev) => (prev + 1) % work.images.length);
      }
    },
    [work]
  );

  const showPrevImage = useCallback(
    (e) => {
      e?.stopPropagation();
      if (work?.images?.length > 0) {
        setSelectedIndex((prev) => (prev - 1 + work.images.length) % work.images.length);
      }
    },
    [work]
  );

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (selectedIndex === -1) return;
      if (e.key === "ArrowRight") showNextImage();
      if (e.key === "ArrowLeft") showPrevImage();
      if (e.key === "Escape") setSelectedIndex(-1);
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedIndex, showNextImage, showPrevImage]);


  if (loading) return <div className="loading-screen"><div className="spinner"></div></div>;
  if (!work) return <div className="error-msg">Không có dữ liệu.</div>;

  const photographer = work.photographerId || work.userId || {};

  return (
    <>
      <Header />
      <Sidebar />

      <div className="wpd-container">

        {/* BACK BTN */}
        <div className="wpd-back">
          <button onClick={() => navigate(-1)}>
            <ArrowLeft size={18} /> Trở về
          </button>
        </div>

        {/* HEADING BLOCK */}
        <div className="wpd-header-card">
          
          {/* 1. AVATAR (Trên cùng) */}
          <div className="wpd-avatar">
            {photographer.Avatar ? (
              <img src={getImageUrl(photographer.Avatar)} alt="avatar" />
            ) : (
              <div className="wpd-avatar-placeholder">
                <User size={38} />
              </div>
            )}
          </div>

          {/* 2. META INFO (Ở giữa: Tên tác giả & Ngày) */}
          <div className="wpd-meta">
            <span><User size={16}/> {photographer.HoTen || "Nhiếp ảnh gia"}</span>
            <span className="divider">•</span>
            <span><Calendar size={16}/> {new Date(work.createdAt).toLocaleDateString("vi-VN")}</span>
          </div>

          {/* 3. TÊN TÁC PHẨM (Ở dưới Meta) */}
          <h1 className="wpd-title">{work.title}</h1>

          {/* 4. MÔ TẢ (Cuối cùng) */}
          {work.description && 
            <p className="wpd-desc">{work.description}</p>
          }
        </div>

        {/* GALLERY */}
        <div className="wpd-gallery-wrapper">
          <h3 className="wpd-gallery-title">
            Bộ sưu tập ({work.images?.length || 0} ảnh)
          </h3>

          <div className="wpd-masonry">
            {work.images?.map((img, index) => (
              <div 
                key={index}
                className="wpd-item"
                onClick={() => setSelectedIndex(index)}
              >
                <img src={getImageUrl(img)} alt="" loading="lazy" />
                <div className="wpd-overlay">
                  <ZoomIn size={26} color="#fff" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* LIGHTBOX */}
        {selectedIndex !== -1 && (
          <div className="wpd-lightbox" onClick={() => setSelectedIndex(-1)}>

            <button className="wpd-lb-close" onClick={() => setSelectedIndex(-1)}>
              <X size={32} />
            </button>

            <button className="wpd-lb-nav prev" onClick={showPrevImage}>
              <ChevronLeft size={38} />
            </button>

            <div className="wpd-lb-content" onClick={(e) => e.stopPropagation()}>
              <img src={getImageUrl(work.images[selectedIndex])} alt="Full view" className="wpd-lb-image" />
              <div className="wpd-lb-counter">
                {selectedIndex + 1} / {work.images.length}
              </div>
            </div>

            <button className="wpd-lb-nav next" onClick={showNextImage}>
              <ChevronRight size={38} />
            </button>
          </div>
        )}
      </div>

      <Footer />
    </>
  );
}