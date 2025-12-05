import React, { useState, useEffect, useRef, useMemo } from 'react';
import { io } from "socket.io-client";
import { 
    Search, Send, Phone, Video, 
    Image as ImageIcon, Paperclip, Smile,
    AlertTriangle, Hash, X,
    FileText, CheckCircle, UploadCloud,
    ChevronLeft, ChevronRight // ✅ Thêm icon điều hướng
} from 'lucide-react';
import axios from 'axios'; 

import adminAuthService from '../../apis/adminAuthService';
import chatApi from '../../apis/chatApi';
import adminComplaintService from '../../apis/adminComplaintService';
import SidebarAdmin from "../AdminPage/SidebarAdmin";
import HeaderAdmin from "../AdminPage/HeaderAdmin";
import './AdminChat.css';

const ENDPOINT = "http://localhost:5000"; 

const AdminChat = () => {
    const [conversations, setConversations] = useState([]);
    const [currentChat, setCurrentChat] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState("");
    const [searchTerm, setSearchTerm] = useState("");
    const [arrivalMessage, setArrivalMessage] = useState(null);
    const [adminInfo, setAdminInfo] = useState(null);
    
    // State upload chat images
    const [selectedFiles, setSelectedFiles] = useState([]);
    const [previewImages, setPreviewImages] = useState([]);
    const fileInputRef = useRef();
    
    // State Modal Giải quyết
    const [showResolveModal, setShowResolveModal] = useState(false);
    const [refundPercent, setRefundPercent] = useState(50);
    const [photographerPercent, setPhotographerPercent] = useState(40);
    const [refundProof, setRefundProof] = useState(null);
    const [payoutProof, setPayoutProof] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // ✅ State Lightbox Mới (Lưu index thay vì url)
    const [lightboxIndex, setLightboxIndex] = useState(-1);

    const socket = useRef();
    const scrollRef = useRef();

    // --- UTILS ---
    const getImgUrl = (path) => {
        if (!path) return null;
        if (path.startsWith('blob:')) return path;
        return path.startsWith('http') ? path : `${ENDPOINT}${path}`;
    };

    // ✅ Gom tất cả ảnh trong chat thành 1 mảng phẳng để slide
    const allChatImages = useMemo(() => {
        return messages.reduce((acc, msg) => {
            if (msg.images && msg.images.length > 0) {
                // Đảo ngược thứ tự ảnh trong 1 tin nhắn để khớp với hiển thị grid (nếu cần)
                const imgUrls = msg.images.map(img => getImgUrl(img));
                return [...acc, ...imgUrls];
            }
            return acc;
        }, []);
    }, [messages]);

    // 1. Init Socket & Info
    useEffect(() => {
        const admin = adminAuthService.getCurrentAdmin();
        if (admin) {
            setAdminInfo(admin);
            socket.current = io(ENDPOINT);
            socket.current.emit("add_user", admin._id || admin.id);

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
        return () => socket.current?.disconnect();
    }, []);

    // 2. Handle Incoming Message
    useEffect(() => {
        if (arrivalMessage && adminInfo) {
            const myId = adminInfo._id || adminInfo.id;
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
    }, [arrivalMessage, currentChat, adminInfo]);

    // 3. Get Conversations
    useEffect(() => {
        if (adminInfo) {
            const getConversations = async () => {
                try {
                    const adminId = adminInfo._id || adminInfo.id;
                    const res = await chatApi.getConversationsAdmin(adminId);
                    const data = res.data ? res.data : res;

                    if (Array.isArray(data)) {
                        const sorted = data.sort((a, b) => {
                            const dateA = a.lastMessage?.createdAt ? new Date(a.lastMessage.createdAt) : new Date(a.updatedAt);
                            const dateB = b.lastMessage?.createdAt ? new Date(b.lastMessage.createdAt) : new Date(b.updatedAt);
                            return dateB - dateA;
                        });
                        setConversations(sorted);
                    }
                } catch (err) {
                    console.error("❌ Lỗi lấy list chat:", err);
                    setConversations([]);
                }
            };
            getConversations();
        }
    }, [adminInfo]);

    // 4. Get Messages
    useEffect(() => {
        if (currentChat && adminInfo) {
            const myId = adminInfo._id || adminInfo.id;
            const getMessages = async () => {
                try {
                    const res = await chatApi.getMessagesAdmin(currentChat._id);
                    const msgs = Array.isArray(res.data) ? res.data : [];
                    setMessages(msgs);
                    
                    await axios.put(`${ENDPOINT}/api/chat/mark-read`, {
                        conversationId: currentChat._id,
                        userId: myId
                    });

                    setConversations(prev => prev.map(c => {
                        if (c._id === currentChat._id && c.lastMessage) {
                            const currentReadBy = c.lastMessage.readBy || [];
                            if (!currentReadBy.includes(myId)) {
                                return { ...c, lastMessage: { ...c.lastMessage, readBy: [...currentReadBy, myId] } };
                            }
                        }
                        return c;
                    }));

                    socket.current.emit("join_room", currentChat._id);
                    setSelectedFiles([]);
                    setPreviewImages([]);
                } catch (err) {
                    console.error("❌ Lỗi lấy tin nhắn:", err);
                    setMessages([]);
                }
            };
            getMessages();
        }
    }, [currentChat, adminInfo]);

    useEffect(() => {
        scrollRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, previewImages]);

    // ✅ Handle Keyboard for Lightbox
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

    // --- HELPER INFO ---
    const getChatInfo = (conversation) => {
        if (!conversation) return { name: "Đang tải...", avatar: "", isGroup: false };
        const myId = adminInfo?._id || adminInfo?.id;
        
        const complaintObj = conversation.complaint_id; 
        const complaintId = typeof complaintObj === 'object' ? complaintObj?._id : complaintObj;
        const complaintStatus = typeof complaintObj === 'object' ? complaintObj?.status : null;

        const displayCode = complaintId && complaintId.length > 10 
            ? "#" + complaintId.slice(-6).toUpperCase() 
            : (complaintId ? "#" + complaintId : "");

        const isComplaint = conversation.type === 'complaint' || !!conversation.complaint_id;

        if (conversation.isGroup || conversation.type === 'group' || isComplaint) {
            return {
                name: conversation.title || "Giải quyết khiếu nại",
                avatar: "",
                isGroup: true,
                isComplaint: true,
                subText: displayCode ? `Mã: ${displayCode}` : "Nhóm hỗ trợ",
                complaintId: complaintId,
                complaintStatus: complaintStatus 
            };
        }
        
        const validMembers = conversation.members?.filter(m => m !== null) || [];
        const otherMember = validMembers.find(m => {
            const memberId = typeof m === 'string' ? m : (m._id || m.id);
            return memberId !== myId;
        });
        if (otherMember && typeof otherMember === 'object') {
            return { name: otherMember.HoTen || "Người dùng", avatar: otherMember.Avatar || "", isGroup: false, subText: otherMember.Email || "" };
        }
        return { name: "User", avatar: "", isGroup: false };
    };

    const getSenderDetails = (senderId) => {
        const myId = adminInfo?._id || adminInfo?.id;
        if (senderId === myId) return { name: "Admin (Bạn)", avatar: adminInfo?.Avatar };
        if (currentChat && currentChat.members) {
            const member = currentChat.members.find(m => m && (m._id === senderId || m.id === senderId));
            if (member) return { name: member.HoTen || member.username || "Người dùng", avatar: member.Avatar };
        }
        return { name: "Người dùng", avatar: null };
    };

    // --- FILTER ---
    const filteredConversations = conversations.filter(c => {
        const info = getChatInfo(c);
        return (info.name || "").toLowerCase().includes(searchTerm.toLowerCase());
    });
    const complaintChats = filteredConversations.filter(c => getChatInfo(c).isComplaint);
    const normalChats = filteredConversations.filter(c => !getChatInfo(c).isComplaint);

    // --- CHAT ACTIONS ---
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
        if ((!newMessage.trim() && selectedFiles.length === 0) || !adminInfo) return;
        const myId = adminInfo._id || adminInfo.id;
        
        const formData = new FormData();
        formData.append("senderId", myId);
        formData.append("conversationId", currentChat._id);
        formData.append("text", newMessage);
        selectedFiles.forEach(file => formData.append("images", file));

        const optimisticMsg = { 
            senderId: myId, conversationId: currentChat._id, text: newMessage,
            images: previewImages, createdAt: Date.now() 
        };
        setMessages(prev => [...prev, optimisticMsg]); 
        setNewMessage(""); setSelectedFiles([]); setPreviewImages([]);

        try {
            const res = await chatApi.addMessage(formData);
            const savedMsg = res.data || res;
            if (savedMsg && socket.current) {
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
        } catch (error) { console.error("Lỗi gửi tin nhắn:", error); }
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

    // --- HANDLE RESOLVE COMPLAINT ---
    const handleResolveSubmit = async () => {
        // ... (Logic giữ nguyên)
        if (!refundProof || !payoutProof) return alert("Vui lòng tải lên đầy đủ biên lai!");
        if ((Number(refundPercent) + Number(photographerPercent)) > 100) return alert("Tổng % không được quá 100%!");

        setIsSubmitting(true);
        try {
            const complaintId = getChatInfo(currentChat).complaintId;
            if (!complaintId) return alert("Lỗi ID khiếu nại");

            const formData = new FormData();
            formData.append("complaintId", complaintId);
            formData.append("refundPercent", refundPercent);
            formData.append("photographerPercent", photographerPercent);
            formData.append("refundProof", refundProof);
            formData.append("payoutProof", payoutProof);

            await adminComplaintService.resolveComplaintManual(formData);
            alert("Thành công!");
            setShowResolveModal(false);

            if (currentChat && typeof currentChat.complaint_id === 'object') {
                setCurrentChat(prev => ({ ...prev, complaint_id: { ...prev.complaint_id, status: 'resolved' } }));
            }
            setConversations(prev => prev.map(c => {
                if (c._id === currentChat._id && typeof c.complaint_id === 'object') {
                    return { ...c, complaint_id: { ...c.complaint_id, status: 'resolved' } };
                }
                return c;
            }));
        } catch (error) {
            alert("Lỗi: " + (error.message || "Thử lại"));
        } finally {
            setIsSubmitting(false);
        }
    };

    // UI Component
    const ChatItem = ({ c }) => {
        const info = getChatInfo(c);
        const isActive = currentChat?._id === c._id;
        const myId = adminInfo?._id || adminInfo?.id;
        const lastMsg = c.lastMessage || {};
        const senderId = lastMsg.sender?._id || lastMsg.sender || lastMsg.senderId;
        const isMyLastMsg = String(senderId) === String(myId);
        const isRead = lastMsg.readBy?.includes(myId);
        const isUnread = lastMsg.text && !isMyLastMsg && !isRead;

        return (
             <div className={`chat-item ${isActive ? 'active' : ''}`} onClick={() => setCurrentChat(c)}>
                <div className="chat-item-avatar">
                    {info.isGroup ? (
                        <div className="group-avatar-placeholder" style={{background: '#fff3cd', color: '#856404'}}><AlertTriangle size={20}/></div>
                    ) : (
                        <img src={getImgUrl(info.avatar) || "https://via.placeholder.com/40"} alt="" onError={e => e.target.src="https://via.placeholder.com/40"}/>
                    )}
                </div>
                <div className="chat-item-info">
                    <div className="chat-item-top">
                        <span className={`chat-name ${isUnread ? 'unread-name' : ''}`}>{info.name}</span>
                        <span className="chat-time">{c.updatedAt ? new Date(c.updatedAt).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'}) : ''}</span>
                    </div>
                    {info.subText && <span className="text-xs text-orange-600 font-medium mb-1 block">{info.subText}</span>}
                    <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                        <p className={`chat-preview ${isUnread ? 'unread-preview' : ''}`}>
                             {isMyLastMsg ? "Bạn: " : ""}
                             {c.lastMessage?.text || (c.lastMessage?.images?.length > 0 ? "[Hình ảnh]" : "...")}
                        </p>
                        {isUnread && <div className="unread-dot-badge">1</div>}
                    </div>
                </div>
            </div>
        )
    };

    const currentChatInfo = getChatInfo(currentChat);
    const isResolved = currentChatInfo.complaintStatus === 'resolved' || currentChatInfo.complaintStatus === 'completed';

    return (
        <div className="admin-layout">
            <SidebarAdmin />
            <main className="admin-main no-padding-chat"> 
                <HeaderAdmin />

                <div className="admin-chat-container">
                    <div className="chat-sidebar-area">
                        {/* ... Sidebar content (giữ nguyên) ... */}
                        <div className="chat-sidebar-header">
                            <h3>Hỗ trợ khách hàng</h3>
                            <div className="chat-search-wrapper">
                                <Search size={16} />
                                <input type="text" placeholder="Tìm kiếm..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}/>
                            </div>
                        </div>
                        <div className="chat-list">
                             {complaintChats.length > 0 && (
                                <div className="sidebar-section">
                                    <div className="sidebar-section-title">Khiếu nại cần xử lý</div>
                                    {complaintChats.map(c => <ChatItem key={c._id} c={c} />)}
                                </div>
                            )}
                            {normalChats.length > 0 && (
                                <div className="sidebar-section">
                                    <div className="sidebar-section-title">Tin nhắn khách hàng</div>
                                    {normalChats.map(c => <ChatItem key={c._id} c={c} />)}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="chat-main-area">
                        {currentChat ? (
                            <>
                                <div className="current-chat-header">
                                    {/* ... Header content ... */}
                                    <div className="header-left">
                                        <div className="header-avatar">
                                            {currentChatInfo.isGroup ? (
                                                <div className="avatar-group-icon lg" style={{background: '#fff3cd', color: '#856404'}}><AlertTriangle size={24}/></div>
                                            ) : (
                                                <img src={getImgUrl(currentChatInfo.avatar)} onError={e => e.target.src="https://via.placeholder.com/40"} alt="" />
                                            )}
                                        </div>
                                        <div className="header-info">
                                            <h4>{currentChatInfo.name}</h4>
                                            <div className="flex items-center gap-2">
                                                <span className="status-dot online">{currentChatInfo.isGroup ? "Đang hoạt động" : "User Online"}</span>
                                                {currentChatInfo.isComplaint && (
                                                    <span className="bg-orange-100 text-orange-700 text-xs px-2 py-0.5 rounded-full flex items-center gap-1">
                                                        <Hash size={10} /> {currentChatInfo.subText.replace("Mã: ", "")}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="header-actions">
                                        {currentChatInfo.isComplaint && (
                                            <button 
                                                className={`resolve-btn ${isResolved ? 'resolved' : ''}`} 
                                                onClick={() => { if (!isResolved) setShowResolveModal(true); }}
                                                disabled={isResolved}
                                            >
                                                {isResolved ? <><CheckCircle size={16} style={{marginRight: 5}}/> Đã giải quyết</> : <><FileText size={16} style={{marginRight: 5}}/> Giải quyết & Hoàn tiền</>}
                                            </button>
                                        )}
                                        <button className="icon-btn"><Phone size={20}/></button>
                                        <button className="icon-btn"><Video size={20}/></button>
                                    </div>
                                </div>

                                <div className="messages-container">
                                    {messages.length > 0 ? messages.map((m, idx) => {
                                        const isOwn = m.senderId === (adminInfo?._id || adminInfo?.id);
                                        const sender = getSenderDetails(m.senderId);
                                        return (
                                            <div key={idx} className={`msg-row ${isOwn ? 'msg-own' : 'msg-other'}`}>
                                                {!isOwn && <div className="msg-avatar-container"><img src={getImgUrl(sender.avatar)} alt="" className="msg-avatar-img"/></div>}
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
                                    }) : (<div style={{textAlign:'center', marginTop: 50, color:'#999'}}>Bắt đầu cuộc trò chuyện.</div>)}
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
                                        <input type="text" placeholder="Nhập tin nhắn..." value={newMessage} onChange={(e) => setNewMessage(e.target.value)}/>
                                        <button type="button" className="emoji-btn"><Smile size={20}/></button>
                                    </div>
                                    <button type="submit" className="send-btn-primary"><Send size={18}/></button>
                                </form>
                            </>
                        ) : (
                            <div className="no-chat-selected">
                                <div className="empty-state-content"><h3>Admin Chat System</h3><p>Chọn một cuộc hội thoại để xử lý.</p></div>
                            </div>
                        )}
                    </div>
                </div>

                {/* MODAL GIẢI QUYẾT */}
                {showResolveModal && (
                    <div className="modal-overlay">
                        <div className="modal-content resolve-modal">
                            <div className="modal-header">
                                <h3>Giải quyết & Hoàn tiền</h3>
                                <button className="close-btn" onClick={() => setShowResolveModal(false)}><X size={24}/></button>
                            </div>
                            <div className="modal-body">
                                <p className="modal-note">Vui lòng nhập tỷ lệ % hoàn tiền theo thỏa thuận và tải lên biên lai chuyển khoản.</p>
                                <div className="form-row">
                                    <div className="form-group"><label>% Hoàn Khách</label><input type="number" value={refundPercent} onChange={(e) => setRefundPercent(e.target.value)} min="0" max="100" /></div>
                                    <div className="form-group"><label>% Trả Thợ</label><input type="number" value={photographerPercent} onChange={(e) => setPhotographerPercent(e.target.value)} min="0" max="100" /></div>
                                </div>
                                <div className="system-fee-info"><span>Còn lại: </span><b>{100 - Number(refundPercent) - Number(photographerPercent)}%</b></div>
                                <div className="upload-section">
                                    <div className="upload-box"><label>Biên lai Khách</label><div className="file-input-wrapper"><input type="file" accept="image/*" onChange={(e) => setRefundProof(e.target.files[0])} />{refundProof ? <span className="file-name text-green"><CheckCircle size={14}/> {refundProof.name}</span> : <span className="file-placeholder"><UploadCloud size={16}/> Chọn ảnh</span>}</div></div>
                                    <div className="upload-box"><label>Biên lai Thợ</label><div className="file-input-wrapper"><input type="file" accept="image/*" onChange={(e) => setPayoutProof(e.target.files[0])} />{payoutProof ? <span className="file-name text-green"><CheckCircle size={14}/> {payoutProof.name}</span> : <span className="file-placeholder"><UploadCloud size={16}/> Chọn ảnh</span>}</div></div>
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button className="btn-cancel" onClick={() => setShowResolveModal(false)}>Hủy</button>
                                <button className="btn-confirm" onClick={handleResolveSubmit} disabled={isSubmitting}>{isSubmitting ? "Xử lý..." : "Xác nhận"}</button>
                            </div>
                        </div>
                    </div>
                )}

                {/* ✅ LIGHTBOX MODAL CÓ NÚT CHUYỂN */}
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

            </main>
        </div>
    );
};

export default AdminChat;