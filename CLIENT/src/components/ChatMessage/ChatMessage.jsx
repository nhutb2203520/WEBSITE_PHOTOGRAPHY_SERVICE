import React, { useState, useEffect, useRef } from 'react';
import { io } from "socket.io-client";
import { Send, X, MessageSquare } from 'lucide-react'; // Thêm icon cho đẹp
import chatApi from "../../apis/chatApi";
import './ChatMessage.css';

const ENDPOINT = "http://localhost:5000"; 

const ChatMessage = ({ conversation, currentUser, onClose, isAdmin = false }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [socket, setSocket] = useState(null);
  const scrollRef = useRef();

  // 1. Kết nối Socket
  useEffect(() => {
    console.log("🟢 ChatWindow mở với Conversation ID:", conversation._id);
    const newSocket = io(ENDPOINT);
    setSocket(newSocket);
    newSocket.emit("join_room", conversation._id);
    
    // Lắng nghe tin nhắn đến
    newSocket.on("receive_message", (incomingMessage) => {
      // Chỉ nhận tin nhắn từ người khác (tin mình gửi đã tự thêm vào state rồi)
      const myId = currentUser._id || currentUser.id;
      if (incomingMessage.senderId !== myId) {
         setMessages((prev) => [...prev, incomingMessage]);
      }
    });

    return () => newSocket.disconnect();
  }, [conversation._id, currentUser]);

  // 2. Lấy lịch sử tin nhắn
  useEffect(() => {
    const fetchMessages = async () => {
      try {
        let res;
        if (isAdmin) {
          res = await chatApi.getMessagesAdmin(conversation._id);
        } else {
          res = await chatApi.getMessages(conversation._id);
        }
        if(res.data) setMessages(res.data);
      } catch (err) {
        console.error("❌ Lỗi tải tin nhắn:", err);
      }
    };
    fetchMessages();
  }, [conversation._id, isAdmin]);

  // 3. Scroll xuống cuối khi có tin mới
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // 4. Xử lý Gửi tin nhắn (QUAN TRỌNG)
  const handleSend = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    const senderId = currentUser._id || currentUser.id;
    const textToSend = newMessage;

    // Bước 1: Cập nhật UI ngay lập tức (Optimistic Update)
    const optimisticMsg = {
        _id: Date.now(), // ID tạm
        senderId: senderId,
        conversationId: conversation._id,
        text: textToSend,
        createdAt: new Date().toISOString()
    };
    setMessages((prev) => [...prev, optimisticMsg]);
    setNewMessage(""); // Xóa ô nhập liệu

    try {
      // Bước 2: Gọi API Lưu vào Database (Bắt buộc)
      // Nếu API nhận FormData (để hỗ trợ ảnh sau này), ta dùng FormData. Nếu JSON thì dùng object.
      // Ở đây ta dùng logic giống AdminChat để an toàn.
      const formData = new FormData();
      formData.append("senderId", senderId);
      formData.append("conversationId", conversation._id);
      formData.append("text", textToSend);

      const res = await chatApi.addMessage(formData); 
      const savedMsg = res.data || res;

      // Bước 3: Bắn Socket để người khác nhận được
      if (socket) {
        socket.emit("send_message", {
          senderId: senderId,
          conversationId: conversation._id,
          text: textToSend,
          createdAt: savedMsg.createdAt // Dùng thời gian chuẩn từ server
        });
      }

    } catch (error) {
      console.error("Lỗi gửi tin nhắn:", error);
      // (Tuỳ chọn) Hiển thị thông báo lỗi hoặc hoàn tác tin nhắn trong state
    }
  };

  const getSenderName = (senderId) => {
    if (senderId === (currentUser._id || currentUser.id)) return "Bạn";
    const member = conversation.members.find(m => (m._id || m) === senderId);
    return member?.HoTen || "Người dùng";
  };

  return (
    <div className="chat-window-overlay" onClick={onClose}>
      <div className="chat-box" onClick={(e) => e.stopPropagation()}>
        
        {/* Header */}
        <div className="chat-header">
          <div className="header-info">
             <div className="header-icon">
                <MessageSquare size={20} color="white"/>
             </div>
             <div style={{display:'flex', flexDirection:'column'}}>
                 <h3>Thảo luận nhóm {isAdmin ? '(Admin)' : ''}</h3>
                 <small className="header-sub">Mã: #{conversation._id.slice(-6).toUpperCase()}</small>
             </div>
          </div>
          <button className="close-chat-btn" onClick={onClose}><X size={20}/></button>
        </div>

        {/* Message List */}
        <div className="chat-messages">
          {messages.length > 0 ? messages.map((m, index) => {
            const isOwn = m.senderId === (currentUser._id || currentUser.id);
            return (
              <div key={index} className={`message-row ${isOwn ? 'own' : 'other'}`}>
                {!isOwn && <span className="message-sender">{getSenderName(m.senderId)}</span>}
                <div className="message-bubble">
                    {m.text}
                    <span className="message-time">
                        {new Date(m.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    </span>
                </div>
              </div>
            );
          }) : (
             <div className="empty-chat">
                <p>Chưa có tin nhắn nào. Bắt đầu cuộc trò chuyện!</p>
             </div>
          )}
          <div ref={scrollRef} />
        </div>

        {/* Input Area */}
        <form className="chat-input-area" onSubmit={handleSend}>
          <input 
            type="text" 
            placeholder="Nhập tin nhắn..." 
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            autoFocus
          />
          <button type="submit" className="chat-send-btn">
            <Send size={18} />
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChatMessage;