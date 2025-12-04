import axiosClient from "./axiosUser"; 
import { axiosInstance as axiosAdmin } from "./adminAuthService"; 

const chatApi = {
  // --- USER APIS ---
  createConversation: (senderId, receiverId) => {
    return axiosClient.post("/chat", { senderId, receiverId });
  },
  getUserConversations: (userId) => {
    return axiosClient.get(`/chat/${userId}`);
  },
  getMessages: (conversationId) => {
    return axiosClient.get(`/chat/message/${conversationId}`);
  },
  
  // 🔥 Gửi tin nhắn (Text + Ảnh)
  addMessage: (data) => {
    return axiosClient.post("/chat/message", data, {
        headers: { "Content-Type": "multipart/form-data" }
    });
  },

  getComplaintGroup: (data) => {
    return axiosClient.post("/chat/complaint-group", data);
  },

  // --- ADMIN APIS ---
  getConversationsAdmin: (adminId) => {
    return axiosAdmin.get(`/chat/${adminId}`);
  },
  getComplaintGroupAdmin: (data) => {
    return axiosAdmin.post("/chat/complaint-group", data);
  },
  getMessagesAdmin: (conversationId) => {
    return axiosAdmin.get(`/chat/message/${conversationId}`);
  }
};

export default chatApi;