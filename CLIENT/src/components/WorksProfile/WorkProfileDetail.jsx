import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { 
  ArrowLeft, X, ZoomIn, Calendar, User,
  ChevronLeft, ChevronRight, MessageCircle // ✅ Import MessageCircle
} from "lucide-react";
import { useSelector } from "react-redux"; // ✅ Import Redux
import { toast } from "react-toastify"; // ✅ Import Toast

// ✅ Import MainLayout
import MainLayout from "../../layouts/MainLayout/MainLayout";

// ✅ Import Chat related
import chatApi from "../../apis/chatApi";
import ChatMessage from "../ChatMessage/ChatMessage"; 

import "./WorkProfileDetail.css";

export default function WorkProfileDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  // ✅ Lấy user hiện tại từ Redux
  const { user } = useSelector((state) => state.user);

  const [work, setWork] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedIndex, setSelectedIndex] = useState(-1);

  // ✅ State cho Chat
  const [showChat, setShowChat] = useState(false);
  const [chatConversation, setChatConversation] = useState(null);
  const [isCreatingChat, setIsCreatingChat] = useState(false);

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

  /* ========= CHAT FUNCTION ========= */
  const handleStartChat = async () => {
    if (!user) {
      toast.info("Vui lòng đăng nhập để nhắn tin!");
      // Có thể navigate sang trang login nếu cần
      return;
    }

    const photographer = work?.photographerId || work?.userId;
    if (!photographer) return;

    const photographerId = photographer._id || photographer.id;
    const myId = user._id || user.id;

    if (photographerId === myId) {
      toast.info("Đây là tác phẩm của bạn.");
      return;
    }

    setIsCreatingChat(true);
    try {
      const res = await chatApi.createConversation(myId, photographerId);
      const conversationData = res.data || res;
      setChatConversation(conversationData);
      setShowChat(true);
    } catch (err) {
      console.error("Lỗi tạo hội thoại:", err);
      toast.error("Không thể kết nối trò chuyện.");
    } finally {
      setIsCreatingChat(false);
    }
  };

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


  if (loading) return (
    <MainLayout>
        <div className="loading-screen"><div className="spinner"></div></div>
    </MainLayout>
  );

  if (!work) return (
    <MainLayout>
        <div className="error-msg">Không có dữ liệu.</div>
    </MainLayout>
  );

  const photographer = work.photographerId || work.userId || {};

  return (
    <MainLayout>
      <div className="wpd-container">

        {/* BACK BTN */}
        <div className="wpd-back">
          <button onClick={() => navigate(-1)}>
            <ArrowLeft size={18} /> Trở về
          </button>
        </div>

        {/* HEADING BLOCK */}
        <div className="wpd-header-card">
          
          {/* 1. AVATAR */}
          <div className="wpd-avatar">
            {photographer.Avatar ? (
              <img src={getImageUrl(photographer.Avatar)} alt="avatar" />
            ) : (
              <div className="wpd-avatar-placeholder">
                <User size={38} />
              </div>
            )}
          </div>

          {/* 2. META INFO */}
          <div className="wpd-meta">
            <span><User size={16}/> {photographer.HoTen || "Nhiếp ảnh gia"}</span>
            <span className="divider">•</span>
            <span><Calendar size={16}/> {new Date(work.createdAt).toLocaleDateString("vi-VN")}</span>
          </div>

          {/* ✅ 3. NÚT NHẮN TIN (MỚI) */}
          <div style={{ display: 'flex', justifyContent: 'center', marginTop: '12px', marginBottom: '16px' }}>
            <button 
              className="wpd-chat-btn" 
              onClick={handleStartChat}
              disabled={isCreatingChat}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 20px',
                borderRadius: '20px',
                border: '1px solid #3b82f6',
                background: '#eff6ff',
                color: '#3b82f6',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.background = '#3b82f6';
                e.currentTarget.style.color = '#fff';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.background = '#eff6ff';
                e.currentTarget.style.color = '#3b82f6';
              }}
            >
              <MessageCircle size={18} />
              {isCreatingChat ? 'Đang kết nối...' : 'Nhắn tin'}
            </button>
          </div>

          {/* 4. TÊN TÁC PHẨM */}
          <h1 className="wpd-title">{work.title}</h1>

          {/* 5. MÔ TẢ */}
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

      {/* ✅ RENDER CHAT MODAL */}
      {showChat && chatConversation && (
        <ChatMessage 
            conversation={chatConversation}
            currentUser={user}
            onClose={() => setShowChat(false)}
        />
      )}

    </MainLayout>
  );
}