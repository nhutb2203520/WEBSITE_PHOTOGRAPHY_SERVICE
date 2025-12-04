import React, { useState, useEffect, useRef } from 'react';
import { io } from "socket.io-client";
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
    return () => newSocket.disconnect();
  }, [conversation._id]);

  // 2. Lấy tin nhắn
  useEffect(() => {
    const fetchMessages = async () => {
      try {
        let res;
        if (isAdmin) {
          console.log("👮 Admin fetch messages for:", conversation._id);
          res = await chatApi.getMessagesAdmin(conversation._id);
        } else {
          res = await chatApi.getMessages(conversation._id);
        }
        
        console.log("📥 Messages loaded:", res.data);
        if(res.data) setMessages(res.data);
      } catch (err) {
        console.error("❌ Lỗi tải tin nhắn:", err);
      }
    };
    fetchMessages();
  }, [conversation._id, isAdmin]);

  // 3. Socket nhận tin
  useEffect(() => {
    if (!socket) return;
    socket.on("receive_message", (incomingMessage) => {
      setMessages((prev) => [...prev, incomingMessage]);
    });
  }, [socket]);

  // 4. Scroll
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // 5. Gửi tin
  const handleSend = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    const messageData = {
      senderId: currentUser._id || currentUser.id,
      conversationId: conversation._id,
      text: newMessage,
      type: 'text'
    };

    socket.emit("send_message", messageData);
    setNewMessage("");
  };

  const getSenderName = (senderId) => {
    if (senderId === (currentUser._id || currentUser.id)) return "Bạn";
    // Nếu members chỉ là mảng ID string, hàm này sẽ trả về undefined tên
    const member = conversation.members.find(m => (m._id || m) === senderId);
    return member?.HoTen || "Người dùng";
  };

  return (
    <div className="chat-window-overlay" onClick={onClose}>
      <div className="chat-box" onClick={(e) => e.stopPropagation()}>
        <div className="chat-header">
          <div style={{display:'flex', flexDirection:'column'}}>
             <h3>💬 Chat hỗ trợ {isAdmin ? '(Admin)' : ''}</h3>
             <small style={{fontSize: 10, opacity: 0.8}}>ID: {conversation._id}</small>
          </div>
          <button className="close-chat-btn" onClick={onClose}>&times;</button>
        </div>

        <div className="chat-messages">
          {messages.length > 0 ? messages.map((m, index) => {
            const isOwn = m.senderId === (currentUser._id || currentUser.id);
            return (
              <div ref={scrollRef} key={index} className={`message ${isOwn ? 'own' : 'other'}`}>
                {!isOwn && <span className="message-meta">{getSenderName(m.senderId)}</span>}
                <div className="message-text">{m.text}</div>
                <span className="message-time">{new Date(m.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
              </div>
            );
          }) : (
             <div style={{textAlign: 'center', color: '#999', marginTop: 20}}>Chưa có tin nhắn nào</div>
          )}
        </div>

        <form className="chat-input-area" onSubmit={handleSend}>
          <input 
            type="text" 
            placeholder="Nhập tin nhắn..." 
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
          />
          <button type="submit" className="chat-send-btn">Gửi</button>
        </form>
      </div>
    </div>
  );
};

export default ChatMessage;