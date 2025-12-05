import React, { useState, useEffect, useRef, useMemo } from 'react';
import { io } from "socket.io-client";
import { 
    Search, Send, Image as ImageIcon, Paperclip, Smile,
    ArrowLeft, AlertTriangle, Users, MessageSquare, Hash, X,
    ChevronLeft, ChevronRight // ✅ Thêm icon điều hướng
} from 'lucide-react';
import axios from 'axios'; 

import chatApi from '../../apis/chatApi'; 
import userApi from '../../apis/UserService'; 
import MainLayout from '../../layouts/MainLayout/MainLayout'; 
import './UserChatPage.css';

const ENDPOINT = "http://localhost:5000"; 

const UserChatPage = () => {
    const [conversations, setConversations] = useState([]);
    const [currentChat, setCurrentChat] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState("");
    const [searchTerm, setSearchTerm] = useState("");
    const [arrivalMessage, setArrivalMessage] = useState(null);
    const [userInfo, setUserInfo] = useState(null);
    const [isMobileChatOpen, setIsMobileChatOpen] = useState(false);
    
    // State upload
    const [selectedFiles, setSelectedFiles] = useState([]);
    const [previewImages, setPreviewImages] = useState([]);
    
    // ✅ State Lightbox
    const [lightboxIndex, setLightboxIndex] = useState(-1);
    
    const socket = useRef();
    const scrollRef = useRef();
    const fileInputRef = useRef();

    // --- UTILS ---
    const getImgUrl = (path) => {
        if (!path) return null;
        if (path.startsWith('blob:')) return path;
        return path.startsWith('http') ? path : `${ENDPOINT}${path}`;
    };

    // ✅ Gom ảnh để slide
    const allChatImages = useMemo(() => {
        return messages.reduce((acc, msg) => {
            if (msg.images && msg.images.length > 0) {
                const imgUrls = msg.images.map(img => getImgUrl(img));
                return [...acc, ...imgUrls];
            }
            return acc;
        }, []);
    }, [messages]);

    // 1. Lấy thông tin User & Kết nối Socket
    useEffect(() => {
        const fetchUserInfo = async () => {
            try {
                const userData = await userApi.getInfo();
                if (userData) {
                    setUserInfo(userData);
                    socket.current = io(ENDPOINT);
                    socket.current.emit("add_user", userData._id || userData.id);
                    socket.current.on("receive_message", (data) => {
                        setArrivalMessage({
                            senderId: data.senderId,
                            text: data.text,
                            images: data.images,
                            createdAt: Date.now(),
                            conversationId: data.conversationId
                        });
                    });
                }
            } catch (error) {
                console.error("❌ Lỗi user:", error);
            }
        };
        fetchUserInfo();
        return () => { if (socket.current) socket.current.disconnect(); };
    }, []);

    // 2. Lấy danh sách chat
    useEffect(() => {
        if (userInfo) {
            const getConversations = async () => {
                try {
                    const userId = userInfo._id || userInfo.id;
                    const res = await chatApi.getUserConversations(userId);
                    const data = res.data || res; 
                    if (Array.isArray(data)) {
                        const sorted = data.sort((a, b) => {
                            const dateA = a.lastMessage?.createdAt ? new Date(a.lastMessage.createdAt) : new Date(a.updatedAt);
                            const dateB = b.lastMessage?.createdAt ? new Date(b.lastMessage.createdAt) : new Date(b.updatedAt);
                            return dateB - dateA;
                        });
                        setConversations(sorted);
                    } else {
                        setConversations([]);
                    }
                } catch (err) {
                    console.error("❌ Lỗi lấy danh sách chat:", err);
                    setConversations([]);
                }
            };
            getConversations();
        }
    }, [userInfo]);

    // 3. Xử lý tin nhắn đến (Realtime)
    useEffect(() => {
        if (arrivalMessage && userInfo) {
            const myId = userInfo._id || userInfo.id;
            const isMyMessage = arrivalMessage.senderId === myId;

            if (currentChat && arrivalMessage.conversationId === currentChat._id && !isMyMessage) {
                setMessages((prev) => [...prev, arrivalMessage]);
                axios.put(`${ENDPOINT}/api/chat/mark-read`, {
                    conversationId: currentChat._id,
                    userId: myId
                });
            }
            
            setConversations(prev => {
                if (!Array.isArray(prev)) return [];
                const index = prev.findIndex(c => c._id === arrivalMessage.conversationId);
                
                if (index !== -1) {
                    const targetConv = prev[index];
                    const lastText = arrivalMessage.images && arrivalMessage.images.length > 0 
                        ? (arrivalMessage.text || "[Hình ảnh]") 
                        : arrivalMessage.text;

                    let newReadBy = targetConv.lastMessage?.readBy || [];
                    if (isMyMessage) {
                        newReadBy = [myId]; 
                    } else if (currentChat && currentChat._id === arrivalMessage.conversationId) {
                        if (!newReadBy.includes(myId)) newReadBy.push(myId); 
                    } else {
                        newReadBy = [arrivalMessage.senderId]; 
                    }

                    const updatedConv = { 
                        ...targetConv, 
                        lastMessage: { 
                            text: lastText, 
                            sender: arrivalMessage.senderId, 
                            senderId: arrivalMessage.senderId,
                            readBy: newReadBy,
                            createdAt: arrivalMessage.createdAt 
                        }, 
                        updatedAt: arrivalMessage.createdAt 
                    };

                    const newConvs = [...prev];
                    newConvs.splice(index, 1);
                    newConvs.unshift(updatedConv);
                    return newConvs;
                }
                return prev;
            });
        }
    }, [arrivalMessage, currentChat, userInfo]);

    // 4. Lấy tin nhắn chi tiết
    useEffect(() => {
        if (currentChat && userInfo) {
            const myId = userInfo._id || userInfo.id;

            const fetchMessages = async () => {
                try {
                    const res = await chatApi.getMessages(currentChat._id);
                    const msgs = Array.isArray(res.data) ? res.data : (Array.isArray(res) ? res : []);
                    setMessages(msgs);
                    
                    await axios.put(`${ENDPOINT}/api/chat/mark-read`, {
                        conversationId: currentChat._id,
                        userId: myId
                    });

                    setConversations(prev => prev.map(c => {
                        if (c._id === currentChat._id && c.lastMessage) {
                            const currentReadBy = c.lastMessage.readBy || [];
                            if (!currentReadBy.includes(myId)) {
                                return {
                                    ...c,
                                    lastMessage: { ...c.lastMessage, readBy: [...currentReadBy, myId] }
                                };
                            }
                        }
                        return c;
                    }));

                    socket.current.emit("join_room", currentChat._id);
                    setIsMobileChatOpen(true);
                    setSelectedFiles([]);
                    setPreviewImages([]);
                } catch (err) {
                    console.error("❌ Lỗi lấy tin nhắn:", err);
                    setMessages([]);
                }
            };
            fetchMessages();
        }
    }, [currentChat, userInfo]);

    useEffect(() => {
        scrollRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }, [messages, previewImages]);

    // ✅ Handle Keyboard
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (lightboxIndex === -1) return;
            if (e.key === 'Escape') setLightboxIndex(-1);
            if (e.key === 'ArrowRight') navigateImage(1);
            if (e.key === 'ArrowLeft') navigateImage(-1);
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [lightboxIndex, allChatImages]);

    // --- XỬ LÝ FILE ---
    const handleFileChange = (e) => {
        const files = Array.from(e.target.files);
        if (files.length === 0) return;
        setSelectedFiles(prev => [...prev, ...files]);
        const newPreviews = files.map(file => URL.createObjectURL(file));
        setPreviewImages(prev => [...prev, ...newPreviews]);
    };

    const removeImage = (index) => {
        const newFiles = [...selectedFiles];
        newFiles.splice(index, 1);
        setSelectedFiles(newFiles);
        const newPreviews = [...previewImages];
        URL.revokeObjectURL(newPreviews[index]); 
        newPreviews.splice(index, 1);
        setPreviewImages(newPreviews);
    };

    const handleSend = async (e) => {
        e.preventDefault();
        if ((!newMessage.trim() && selectedFiles.length === 0) || !userInfo) return;

        const myId = userInfo._id || userInfo.id;
        const formData = new FormData();
        formData.append("senderId", myId);
        formData.append("conversationId", currentChat._id);
        formData.append("text", newMessage);
        selectedFiles.forEach(file => {
            formData.append("images", file);
        });

        const optimisticMsg = { 
            senderId: myId, conversationId: currentChat._id, text: newMessage,
            images: previewImages, createdAt: Date.now() 
        };

        setMessages(prev => [...prev, optimisticMsg]);
        setNewMessage(""); setSelectedFiles([]); setPreviewImages([]);

        try {
            const res = await chatApi.addMessage(formData);
            const savedMsg = res.data || res;

            if (!savedMsg) {
                console.error("❌ Không nhận được phản hồi từ server");
                return;
            }

            if (socket.current) {
                socket.current.emit("send_message", {
                    senderId: myId, conversationId: currentChat._id,
                    text: savedMsg.text, images: savedMsg.images, createdAt: savedMsg.createdAt
                });
            }
            
            setConversations(prev => {
                const index = prev.findIndex(c => c._id === currentChat._id);
                if (index !== -1) {
                    const lastText = savedMsg.images && savedMsg.images.length > 0 ? (savedMsg.text || "[Hình ảnh]") : savedMsg.text;
                    const updatedConv = { ...prev[index], lastMessage: { text: lastText, sender: myId, readBy: [myId], createdAt: Date.now() }, updatedAt: Date.now() };
                    const newConvs = [...prev]; newConvs.splice(index, 1); newConvs.unshift(updatedConv); return newConvs;
                }
                return prev;
            });

        } catch (error) { console.error("❌ API addMessage lỗi:", error); }
    };

    // --- LIGHTBOX ACTIONS ---
    const openLightbox = (imgUrl) => {
        const idx = allChatImages.indexOf(imgUrl);
        if (idx !== -1) setLightboxIndex(idx);
    };

    const navigateImage = (direction) => {
        if (lightboxIndex === -1) return;
        let newIndex = lightboxIndex + direction;
        if (newIndex < 0) newIndex = allChatImages.length - 1;
        if (newIndex >= allChatImages.length) newIndex = 0;
        setLightboxIndex(newIndex);
    };

    // --- HELPER INFO ---
    const getChatInfo = (conversation) => {
        if (!conversation) return { name: "Đang tải...", avatar: "", type: "unknown" };
        const myId = String(userInfo?._id || userInfo?.id);
        const members = conversation.members || [];
        const complaintCode = conversation.complaint_id 
            ? (typeof conversation.complaint_id === 'object' ? (conversation.complaint_id._id || "Đơn hàng") : conversation.complaint_id)
            : "";
        const displayCode = complaintCode && complaintCode.length > 10 
            ? "#" + complaintCode.slice(-6).toUpperCase() 
            : (complaintCode ? "#" + complaintCode : "");

        if (conversation.type === 'complaint' || conversation.title || members.length > 2) {
            return { 
                name: conversation.title || "Giải quyết khiếu nại", 
                avatar: "", isGroup: true, isComplaint: true, 
                subText: displayCode ? `Mã: ${displayCode}` : "Admin, Thợ & Khách"
            };
        }
        const otherMember = members.find(m => {
            if (!m) return false; 
            const mId = String(m._id || m);
            return mId !== myId;
        });
        if (otherMember) {
            return {
                name: otherMember.HoTen || otherMember.username || "Người dùng",
                avatar: otherMember.Avatar || "", isGroup: false, isComplaint: false, subText: ""
            };
        }
        if (members.some(m => m === null)) {
             return {
                name: "Hỗ trợ viên (Admin)", avatar: "", isGroup: false, isAdmin: true, isComplaint: true, subText: "Hỗ trợ hệ thống"
            };
        }
        return { name: "Cuộc trò chuyện", avatar: "", isGroup: false };
    };

    const getSenderDetails = (senderId) => {
        const myId = userInfo?._id || userInfo?.id;
        if (senderId === myId) return { name: "Bạn", avatar: userInfo?.Avatar };
        if (currentChat && currentChat.members) {
            const member = currentChat.members.find(m => m && (m._id === senderId || m.id === senderId));
            if (member) return { name: member.HoTen || member.username || "Người dùng", avatar: member.Avatar };
        }
        return { name: "Admin / Hỗ trợ", avatar: null, isAdmin: true };
    };

    const filteredConversations = (conversations || []).filter(c => {
        const info = getChatInfo(c);
        return (info.name || "").toLowerCase().includes(searchTerm.toLowerCase());
    });
    const supportChats = filteredConversations.filter(c => {
        const info = getChatInfo(c);
        return info.isComplaint || info.isAdmin || info.isGroup;
    });
    const directChats = filteredConversations.filter(c => {
        const info = getChatInfo(c);
        return !info.isComplaint && !info.isAdmin && !info.isGroup;
    });

    const ChatItem = ({ c }) => {
        const info = getChatInfo(c);
        const isActive = currentChat?._id === c._id;
        const myId = userInfo?._id || userInfo?.id;
        const lastMsg = c.lastMessage || {};
        const senderId = lastMsg.sender?._id || lastMsg.sender || lastMsg.senderId;
        const isMyLastMsg = String(senderId) === String(myId);
        const isRead = lastMsg.readBy?.includes(myId);
        const isUnread = lastMsg.text && !isMyLastMsg && !isRead;

        return (
            <div className={`chat-item ${isActive ? 'active' : ''}`} onClick={() => setCurrentChat(c)}>
                <div className="chat-item-avatar">
                    {(info.isGroup || info.isAdmin) ? (
                        <div className="group-avatar-placeholder" style={{ background: info.isComplaint ? '#fff3cd' : '#dbeafe', color: info.isComplaint ? '#856404' : '#1e40af' }}>
                            {info.isComplaint ? <AlertTriangle size={20} /> : <MessageSquare size={20} />}
                        </div>
                    ) : (
                        <img src={getImgUrl(info.avatar) || "https://placehold.co/150"} alt="ava" onError={e => e.target.src="https://placehold.co/150"}/>
                    )}
                </div>
                <div className="chat-item-info">
                    <div className="chat-item-top">
                        <span className={`chat-name ${isUnread ? 'unread-name' : ''}`}>{info.name}</span>
                        <span className="chat-time">{c.lastMessage?.createdAt ? new Date(c.lastMessage.createdAt).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'}) : ''}</span>
                    </div>
                    {info.subText && <span className={`text-xs font-medium mb-1 block ${info.isComplaint ? 'text-orange-600' : 'text-blue-600'}`}>{info.subText}</span>}
                    <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                        <p className={`chat-preview ${isUnread ? 'unread-preview' : ''}`}>
                            {isMyLastMsg ? "Bạn: " : ""}
                            {c.lastMessage?.text || (c.lastMessage?.images?.length > 0 ? "[Hình ảnh]" : "Chạm để bắt đầu...")}
                        </p>
                        {isUnread && <div className="unread-dot-badge">1</div>}
                    </div>
                </div>
            </div>
        );
    };

    return (
        <MainLayout>
            <div className="user-chat-layout">
                <div className="user-chat-container">
                    <div className={`chat-sidebar-area ${isMobileChatOpen ? 'hidden-on-mobile' : ''}`}>
                        <div className="chat-sidebar-header">
                            <h3>Tin nhắn</h3>
                            <div className="chat-search-wrapper">
                                <Search size={16} />
                                <input type="text" placeholder="Tìm kiếm..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                            </div>
                        </div>
                        <div className="chat-list">
                            {supportChats.length > 0 && <div className="sidebar-section"><div className="sidebar-section-title">Hỗ trợ & Khiếu nại</div>{supportChats.map(c => <ChatItem key={c._id} c={c} />)}</div>}
                            {directChats.length > 0 && <div className="sidebar-section"><div className="sidebar-section-title">Tin nhắn cá nhân</div>{directChats.map(c => <ChatItem key={c._id} c={c} />)}</div>}
                        </div>
                    </div>

                    <div className={`chat-main-area ${!isMobileChatOpen ? 'hidden-on-mobile' : ''}`}>
                        {currentChat ? (
                            <>
                                <div className="current-chat-header">
                                    <div className="header-left">
                                        <button className="back-btn-mobile" onClick={() => setIsMobileChatOpen(false)}><ArrowLeft size={24} /></button>
                                        <div className="header-avatar">
                                            {(getChatInfo(currentChat).isGroup || getChatInfo(currentChat).isAdmin) ? (
                                                 <div style={{ background: getChatInfo(currentChat).isComplaint ? '#fff3cd' : '#e0e7ff', color: getChatInfo(currentChat).isComplaint ? '#856404' : '#4f46e5', width:'40px', height:'40px', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center' }}>
                                                    {getChatInfo(currentChat).isComplaint ? <AlertTriangle size={20} /> : <Users size={20} />}
                                                </div>
                                            ) : (
                                                <img src={getImgUrl(getChatInfo(currentChat).avatar) || "https://placehold.co/150"} onError={e => e.target.src="https://placehold.co/150"} alt="" />
                                            )}
                                        </div>
                                        <div className="header-info">
                                            <h4>{getChatInfo(currentChat).name}</h4>
                                            <div className="flex items-center gap-2">
                                                <span className="status-dot online">{getChatInfo(currentChat).isGroup ? "Đang hoạt động" : "Trực tuyến"}</span>
                                                {getChatInfo(currentChat).isComplaint && <span className="bg-orange-100 text-orange-700 text-xs px-2 py-0.5 rounded-full flex items-center gap-1"><Hash size={10} /> {getChatInfo(currentChat).subText.replace("Mã: ", "")}</span>}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="messages-container">
                                    {messages?.length > 0 ? messages.map((m, idx) => {
                                        const isOwn = m.senderId === (userInfo?._id || userInfo?.id);
                                        const sender = getSenderDetails(m.senderId);

                                        return (
                                            <div key={idx} className={`msg-row ${isOwn ? 'msg-own' : 'msg-other'}`}>
                                                {!isOwn && (
                                                    <div className="msg-avatar-container">
                                                        <img src={getImgUrl(sender.avatar) || "https://placehold.co/150"} alt="" className="msg-avatar-img" onError={e => e.target.src="https://placehold.co/150"}/>
                                                    </div>
                                                )}
                                                <div className="msg-content-wrapper">
                                                    {!isOwn && <span className="msg-sender-name">{sender.name}</span>}
                                                    <div className={`msg-bubble ${m.images?.length > 0 ? 'has-images' : ''}`}>
                                                        {m.images && m.images.length > 0 && (
                                                            <div className="msg-images-grid">
                                                                {m.images.map((img, i) => (
                                                                    <img 
                                                                        key={i} 
                                                                        src={getImgUrl(img)} 
                                                                        alt="" 
                                                                        className="msg-attached-image" 
                                                                        onClick={() => openLightbox(getImgUrl(img))} // ✅ Click mở Lightbox
                                                                    />
                                                                ))}
                                                            </div>
                                                        )}
                                                        {m.text && <p className="msg-text" style={{margin:0}}>{m.text}</p>}
                                                        <span className="msg-timestamp">{new Date(m.createdAt).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        )
                                    }) : (
                                        <div className="empty-msg-state">
                                            <div className="icon-circle small"><Send size={24} color="#6c5ce7"/></div>
                                            <p>Gửi tin nhắn để bắt đầu.</p>
                                        </div>
                                    )}
                                    <div ref={scrollRef} /> 
                                </div>

                                {previewImages.length > 0 && (
                                    <div className="image-preview-area">
                                        {previewImages.map((src, index) => (
                                            <div key={index} className="preview-item">
                                                <img src={src} alt="preview" />
                                                <button className="remove-preview-btn" onClick={() => removeImage(index)}><X size={14} /></button>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                <form className="chat-input-bar" onSubmit={handleSend}>
                                    <div className="input-actions">
                                        <input type="file" multiple accept="image/*" ref={fileInputRef} onChange={handleFileChange} style={{display: 'none'}} />
                                        <button type="button" onClick={() => fileInputRef.current.click()}><ImageIcon size={20}/></button>
                                        <button type="button"><Paperclip size={20}/></button>
                                    </div>
                                    <div className="input-wrapper">
                                        <input type="text" placeholder="Nhập tin nhắn..." value={newMessage} onChange={(e) => setNewMessage(e.target.value)} />
                                        <button type="button" className="emoji-btn"><Smile size={20}/></button>
                                    </div>
                                    <button type="submit" className="send-btn-primary"><Send size={18}/></button>
                                </form>
                            </>
                        ) : (
                            <div className="no-chat-selected">
                                <div className="empty-state-content">
                                    <div className="icon-circle"><Send size={40} color="#6c5ce7"/></div>
                                    <h3>Tin nhắn hỗ trợ</h3>
                                    <p>Chọn một cuộc hội thoại từ danh sách bên trái.</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* ✅ LIGHTBOX MODAL CHO USER */}
                {lightboxIndex !== -1 && (
                    <div className="image-zoom-overlay" onClick={() => setLightboxIndex(-1)}>
                        {/* Nút Prev */}
                        <button className="lb-nav-btn prev" onClick={(e) => { e.stopPropagation(); navigateImage(-1); }}>
                            <ChevronLeft size={40} />
                        </button>

                        <div className="image-zoom-content" onClick={(e) => e.stopPropagation()}>
                            <img src={allChatImages[lightboxIndex]} alt="Zoomed" />
                            <button className="close-zoom" onClick={() => setLightboxIndex(-1)}><X size={24}/></button>
                        </div>

                        {/* Nút Next */}
                        <button className="lb-nav-btn next" onClick={(e) => { e.stopPropagation(); navigateImage(1); }}>
                            <ChevronRight size={40} />
                        </button>
                    </div>
                )}
            </div>
        </MainLayout>
    );
};

export default UserChatPage;