import React, { useState, useEffect, useRef } from 'react';
import { io } from "socket.io-client";
import { 
    Search, Send, Phone, Video, 
    Image as ImageIcon, Paperclip, Smile,
    Users, User, AlertTriangle, MessageSquare, Hash, X
} from 'lucide-react';
import axios from 'axios'; // ✅ Đảm bảo import axios

import adminAuthService from '../../apis/adminAuthService';
import chatApi from '../../apis/chatApi';
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
    
    // State upload
    const [selectedFiles, setSelectedFiles] = useState([]);
    const [previewImages, setPreviewImages] = useState([]);
    const fileInputRef = useRef();
    
    const socket = useRef();
    const scrollRef = useRef();

    // 1. Khởi tạo Socket & Lấy Info Admin
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

    // 2. Xử lý tin nhắn đến Real-time
    useEffect(() => {
        if (arrivalMessage && adminInfo) {
            const myId = adminInfo._id || adminInfo.id;
            const isMyMessage = arrivalMessage.senderId === myId;

            // Nếu đang mở đúng chat đó -> Thêm tin nhắn & Mark read
            if (currentChat && arrivalMessage.conversationId === currentChat._id && !isMyMessage) {
                setMessages((prev) => [...prev, arrivalMessage]);
                
                // Gọi API đánh dấu đã đọc
                axios.put(`${ENDPOINT}/api/chat/mark-read`, {
                    conversationId: currentChat._id,
                    userId: myId
                });
            }
            
            // Cập nhật Sidebar (Đưa lên đầu + Cập nhật trạng thái chưa đọc)
            setConversations(prev => {
                if (!Array.isArray(prev)) return [];
                const index = prev.findIndex(c => c._id === arrivalMessage.conversationId);
                
                if (index !== -1) {
                    const targetConv = prev[index];
                    const lastText = arrivalMessage.images && arrivalMessage.images.length > 0 
                        ? (arrivalMessage.text || "[Hình ảnh]") 
                        : arrivalMessage.text;

                    // --- LOGIC TRẠNG THÁI ĐỌC (READBY) ---
                    let newReadBy = targetConv.lastMessage?.readBy || [];
                    
                    if (isMyMessage) {
                        newReadBy = [myId]; // Nếu mình gửi -> Mình đã đọc
                    } else if (currentChat && currentChat._id === arrivalMessage.conversationId) {
                        if (!newReadBy.includes(myId)) newReadBy.push(myId); // Đang mở chat -> Đã đọc
                    } else {
                        // Tin đến mà không mở -> Reset về người gửi (nghĩa là mình chưa đọc)
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

    // 3. Lấy danh sách hội thoại
    useEffect(() => {
        if (adminInfo) {
            const getConversations = async () => {
                try {
                    const adminId = adminInfo._id || adminInfo.id;
                    const res = await chatApi.getConversationsAdmin(adminId);
                    const data = res.data ? res.data : res;

                    if (Array.isArray(data)) {
                        // Sắp xếp theo tin nhắn mới nhất
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

    // 4. Lấy tin nhắn chi tiết & Đánh dấu đã đọc
    useEffect(() => {
        if (currentChat && adminInfo) {
            const myId = adminInfo._id || adminInfo.id;

            const getMessages = async () => {
                try {
                    const res = await chatApi.getMessagesAdmin(currentChat._id);
                    const msgs = Array.isArray(res.data) ? res.data : [];
                    setMessages(msgs);
                    
                    // 🔥 Gọi API đánh dấu đã đọc
                    await axios.put(`${ENDPOINT}/api/chat/mark-read`, {
                        conversationId: currentChat._id,
                        userId: myId
                    });

                    // 🔥 Cập nhật UI Sidebar (Xóa trạng thái chưa đọc)
                    setConversations(prev => prev.map(c => {
                        if (c._id === currentChat._id && c.lastMessage) {
                            const currentReadBy = c.lastMessage.readBy || [];
                            if (!currentReadBy.includes(myId)) {
                                return {
                                    ...c,
                                    lastMessage: {
                                        ...c.lastMessage,
                                        readBy: [...currentReadBy, myId]
                                    }
                                };
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

    // 5. Scroll
    useEffect(() => {
        scrollRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, previewImages]);

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

    // 6. Gửi tin nhắn
    const handleSend = async (e) => {
        e.preventDefault();
        if ((!newMessage.trim() && selectedFiles.length === 0) || !adminInfo) return;

        const myId = adminInfo._id || adminInfo.id;
        
        const formData = new FormData();
        formData.append("senderId", myId);
        formData.append("conversationId", currentChat._id);
        formData.append("text", newMessage);
        selectedFiles.forEach(file => {
            formData.append("images", file);
        });

        const optimisticMsg = { 
            senderId: myId,
            conversationId: currentChat._id,
            text: newMessage,
            images: previewImages, 
            createdAt: Date.now() 
        };
        
        setMessages(prev => [...prev, optimisticMsg]); 
        setNewMessage("");
        setSelectedFiles([]);
        setPreviewImages([]);

        try {
            const res = await chatApi.addMessage(formData);
            const savedMsg = res.data || res;

            if (!savedMsg) {
                console.error("❌ Không nhận được phản hồi từ server");
                return;
            }

            if(socket.current) {
                socket.current.emit("send_message", {
                    senderId: myId,
                    conversationId: currentChat._id,
                    text: savedMsg.text,
                    images: savedMsg.images, 
                    createdAt: savedMsg.createdAt
                });
            }

            // Cập nhật Sidebar
            setConversations(prev => {
                const index = prev.findIndex(c => c._id === currentChat._id);
                if (index !== -1) {
                    const lastText = savedMsg.images && savedMsg.images.length > 0 
                        ? (savedMsg.text || "[Hình ảnh]") 
                        : savedMsg.text;

                    const updatedConv = { 
                        ...prev[index], 
                        lastMessage: { 
                            text: lastText, 
                            sender: myId, 
                            readBy: [myId], 
                            createdAt: Date.now() 
                        }, 
                        updatedAt: Date.now() 
                    };
                    const newConvs = [...prev];
                    newConvs.splice(index, 1);
                    newConvs.unshift(updatedConv);
                    return newConvs;
                }
                return prev;
            });

        } catch (error) {
            console.error("Lỗi gửi tin nhắn API:", error);
        }
    };

    const getImgUrl = (path) => {
        if (!path) return null;
        if (path.startsWith('blob:')) return path;
        return path.startsWith('http') ? path : `${ENDPOINT}${path}`;
    };

    // --- HELPER INFO ---
    const getChatInfo = (conversation) => {
        if (!conversation) return { name: "Đang tải...", avatar: "", isGroup: false };
        const myId = adminInfo?._id || adminInfo?.id;
        
        const complaintCode = conversation.complaint_id 
            ? (typeof conversation.complaint_id === 'object' ? (conversation.complaint_id._id || "Đơn hàng") : conversation.complaint_id)
            : "";
        const displayCode = complaintCode && complaintCode.length > 10 
            ? "#" + complaintCode.slice(-6).toUpperCase() 
            : (complaintCode ? "#" + complaintCode : "");

        if (conversation.isGroup || conversation.type === 'group' || conversation.type === 'complaint') {
            return {
                name: conversation.title || "Giải quyết khiếu nại",
                avatar: "",
                isGroup: true,
                isComplaint: true,
                subText: displayCode ? `Mã: ${displayCode}` : "Nhóm hỗ trợ"
            };
        }
        
        const validMembers = conversation.members?.filter(m => m !== null) || [];
        const otherMember = validMembers.find(m => {
            const memberId = typeof m === 'string' ? m : (m._id || m.id);
            return memberId !== myId;
        });

        if (otherMember && typeof otherMember === 'object') {
            return {
                name: otherMember.HoTen || otherMember.username || "Người dùng",
                avatar: otherMember.Avatar || "",
                isGroup: false,
                subText: otherMember.Email || ""
            };
        }
        return { name: `User #${String(otherMember || "Unknown").slice(-4)}`, avatar: "", isGroup: false };
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

    const filteredConversations = conversations.filter(c => {
        const info = getChatInfo(c);
        return (info.name || "").toLowerCase().includes(searchTerm.toLowerCase());
    });
    const complaintChats = filteredConversations.filter(c => getChatInfo(c).isComplaint);
    const normalChats = filteredConversations.filter(c => !getChatInfo(c).isComplaint);

    // ✅✅✅ COMPONENT ITEM SIDEBAR CÓ BADGE ✅✅✅
    const ChatItem = ({ c }) => {
        const info = getChatInfo(c);
        const isActive = currentChat?._id === c._id;
        const myId = adminInfo?._id || adminInfo?.id;

        // LOGIC CHECK UNREAD
        const lastMsg = c.lastMessage || {};
        const senderId = lastMsg.sender?._id || lastMsg.sender || lastMsg.senderId;
        const isMyLastMsg = String(senderId) === String(myId);
        
        // Kiểm tra xem mình đã đọc chưa
        const isRead = lastMsg.readBy?.includes(myId);

        // Hiển thị chưa đọc nếu: Có tin nhắn + Không phải mình gửi + Chưa có ID mình trong readBy
        const isUnread = lastMsg.text && !isMyLastMsg && !isRead;

        return (
             <div className={`chat-item ${isActive ? 'active' : ''}`} onClick={() => setCurrentChat(c)}>
                <div className="chat-item-avatar">
                    {info.isGroup ? (
                        <div className="group-avatar-placeholder" style={{background: '#fff3cd', color: '#856404'}}>
                            <AlertTriangle size={20}/>
                        </div>
                    ) : (
                        <img src={getImgUrl(info.avatar) || "https://via.placeholder.com/40"} alt="ava" onError={e => e.target.src="https://via.placeholder.com/40"}/>
                    )}
                </div>
                <div className="chat-item-info">
                    <div className="chat-item-top">
                        {/* Nếu chưa đọc thì in đậm tên */}
                        <span className={`chat-name ${isUnread ? 'unread-name' : ''}`}>{info.name}</span>
                        <span className="chat-time">
                            {c.updatedAt ? new Date(c.updatedAt).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'}) : ''}
                        </span>
                    </div>
                    {info.subText && <span className="text-xs text-orange-600 font-medium mb-1 block">{info.subText}</span>}
                    
                    <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                        <p className={`chat-preview ${isUnread ? 'unread-preview' : ''}`}>
                             {isMyLastMsg ? "Bạn: " : ""}
                             {c.lastMessage?.text || (c.lastMessage?.images?.length > 0 ? "[Hình ảnh]" : "...")}
                        </p>
                        
                        {/* 🔥 BADGE SỐ LƯỢNG TIN NHẮN CHƯA ĐỌC 🔥 */}
                        {isUnread && (
                            <div className="unread-dot-badge">1</div> 
                        )}
                    </div>
                </div>
            </div>
        )
    };

    return (
        <div className="admin-layout">
            <SidebarAdmin />
            <main className="admin-main no-padding-chat"> 
                <HeaderAdmin />

                <div className="admin-chat-container">
                    <div className="chat-sidebar-area">
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
                            {complaintChats.length === 0 && normalChats.length === 0 && (
                                <div style={{padding: 20, textAlign: 'center', color: '#888'}}>Không có tin nhắn nào.</div>
                            )}
                        </div>
                    </div>

                    <div className="chat-main-area">
                        {currentChat ? (
                            <>
                                <div className="current-chat-header">
                                    <div className="header-left">
                                        <div className="header-avatar">
                                            {getChatInfo(currentChat).isGroup ? (
                                                <div className="avatar-group-icon lg" style={{background: '#fff3cd', color: '#856404'}}><AlertTriangle size={24}/></div>
                                            ) : (
                                                <img src={getImgUrl(getChatInfo(currentChat).avatar)} onError={e => e.target.src="https://via.placeholder.com/40"} alt="" />
                                            )}
                                        </div>
                                        <div className="header-info">
                                            <h4>{getChatInfo(currentChat).name}</h4>
                                            <div className="flex items-center gap-2">
                                                <span className="status-dot online">{getChatInfo(currentChat).isGroup ? "Đang hoạt động" : "User Online"}</span>
                                                {getChatInfo(currentChat).isComplaint && (
                                                    <span className="bg-orange-100 text-orange-700 text-xs px-2 py-0.5 rounded-full flex items-center gap-1">
                                                        <Hash size={10} /> {getChatInfo(currentChat).subText.replace("Mã: ", "")}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="header-actions">
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
                                                {!isOwn && (
                                                    <div className="msg-avatar-container">
                                                        <img src={getImgUrl(sender.avatar) || "https://via.placeholder.com/40"} alt="" className="msg-avatar-img" onError={e => e.target.src="https://via.placeholder.com/40"}/>
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
                                                                        alt="attachment" 
                                                                        className="msg-attached-image"
                                                                        onClick={() => window.open(getImgUrl(img), '_blank')}
                                                                    />
                                                                ))}
                                                            </div>
                                                        )}

                                                        {m.text && <p className="msg-text" style={{margin:0}}>{m.text}</p>}
                                                        <span className="msg-timestamp">
                                                            {new Date(m.createdAt).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        )
                                    }) : (
                                        <div style={{textAlign:'center', marginTop: 50, color:'#999'}}>Bắt đầu cuộc trò chuyện.</div>
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
                                        <input type="text" placeholder="Nhập tin nhắn..." value={newMessage} onChange={(e) => setNewMessage(e.target.value)}/>
                                        <button type="button" className="emoji-btn"><Smile size={20}/></button>
                                    </div>
                                    <button type="submit" className="send-btn-primary"><Send size={18}/></button>
                                </form>
                            </>
                        ) : (
                            <div className="no-chat-selected">
                                <div className="empty-state-content">
                                    <h3>Admin Chat System</h3>
                                    <p>Chọn một cuộc hội thoại để xử lý.</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
};

export default AdminChat;