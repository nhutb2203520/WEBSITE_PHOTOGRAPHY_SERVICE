import path from "path";
import fs from "fs";
import Conversation from "../models/conversation.model.js";
import Message from "../models/message.model.js";
// Import để đảm bảo Model đã được đăng ký với Mongoose
import "../models/complaint.model.js"; 

// ============================================================
// 1. TẠO CUỘC HỘI THOẠI (PRIVATE)
// ============================================================
export const createConversation = async (req, res) => {
  try {
    const { senderId, receiverId } = req.body;
    
    const exist = await Conversation.findOne({
      members: { $all: [senderId, receiverId] },
      type: 'private'
    });
    
    if(exist) return res.status(200).json(exist);
    
    const newConv = new Conversation({
      members: [senderId, receiverId],
      type: 'private',
      lastMessage: { readBy: [senderId] }
    });
    
    const saved = await newConv.save();
    res.status(200).json(saved);
  } catch (err) {
    res.status(500).json(err);
  }
};

// ============================================================
// 2. LẤY DANH SÁCH CHAT (USER THƯỜNG)
// ============================================================
export const getConversations = async (req, res) => {
  try {
    const userId = req.params.userId;
    const conversations = await Conversation.find({
      members: { $in: [userId] },
    })
    .populate("members", "HoTen Avatar Email")
    .sort({ "lastMessage.createdAt": -1 })
    .lean(); 
    
    res.status(200).json(conversations);
  } catch (err) {
    console.error("❌ Lỗi getConversations:", err);
    res.status(500).json(err);
  }
};

// ============================================================
// 3. [CORE FIX] LẤY DANH SÁCH CHAT CHO ADMIN
// ============================================================
export const getConversationsAdmin = async (req, res) => {
  try {
    const adminId = req.params.userId;
    
    const conversations = await Conversation.find({
      $or: [
        { members: { $in: [adminId] } },
        { type: 'complaint' },          
        { type: 'group' }                
      ]
    })
    .populate("members", "HoTen Avatar Email username") 
    .populate("lastMessage.sender", "HoTen Avatar")
    
    // ❌ [XÓA DÒNG NÀY ĐI] Nó chính là nguyên nhân gây lỗi!
    // .populate("lastMessage.readBy", "_id") 
    // -----------------------------------------------------

    .populate("complaint_id") 
    .sort({ "updatedAt": -1 })
    .lean(); 

    res.status(200).json(conversations);
  } catch (err) {
    console.error("❌ Lỗi getConversationsAdmin:", err);
    res.status(500).json(err);
  }
};

// ============================================================
// 4. LẤY TIN NHẮN CHI TIẾT
// ============================================================
export const getMessages = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const userId = req.query.userId; 

    const messages = await Message.find({ conversationId }).lean();

    // Logic này chỉ chạy nếu Frontend gửi kèm ?userId=... (thường là không gửi)
    // Frontend dùng API markAsRead riêng bên dưới nên đoạn này dự phòng thôi
    if (userId) {
        await Conversation.findByIdAndUpdate(conversationId, {
            $addToSet: { "lastMessage.readBy": userId }
        });
    }

    res.status(200).json(messages);
  } catch (err) {
    res.status(500).json(err);
  }
};

// ============================================================
// 5. API ĐÁNH DẤU ĐÃ ĐỌC (QUAN TRỌNG)
// ============================================================
export const markAsRead = async (req, res) => {
    try {
        const { conversationId, userId } = req.body;
        
        // Sử dụng $addToSet để đảm bảo ID không bị trùng
        await Conversation.findByIdAndUpdate(conversationId, {
            $addToSet: { "lastMessage.readBy": userId }
        });
        
        res.status(200).json({ success: true });
    } catch (error) {
        res.status(500).json(error);
    }
};

// ============================================================
// 6. TẠO/LẤY NHÓM CHAT KHIẾU NẠI
// ============================================================
export const getComplaintConversation = async (req, res) => {
    try {
        const { complaintId, customerId, photographerId, adminId } = req.body;
        
        let conversation = await Conversation.findOne({
            complaint_id: complaintId,
            type: 'complaint'
        });

        if (!conversation) {
            const rawMembers = [customerId, photographerId, adminId].filter(id => id);
            conversation = new Conversation({
                members: rawMembers, 
                type: 'complaint',
                complaint_id: complaintId,
                lastMessage: { readBy: rawMembers } 
            });
            await conversation.save();
        } else {
             if (adminId && !conversation.members.includes(adminId)) {
                conversation.members.push(adminId);
                await conversation.save();
             }
        }
        res.status(200).json(conversation);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// ============================================================
// 7. GỬI TIN NHẮN
// ============================================================
export const addMessage = async (req, res) => {
  try {
    const { conversationId, senderId, text } = req.body;
    
    let images = [];
    if (req.files && req.files.length > 0) {
      images = req.files.map(file => `/uploads/${file.filename}`);
    }

    const newMessage = new Message({
      conversationId,
      senderId,
      text: text || "", 
      images: images 
    });

    const savedMessage = await newMessage.save();
    
    let lastMsgContent = text;
    if (images.length > 0 && (!text || text.trim() === "")) {
        lastMsgContent = "[Hình ảnh]";
    }

    // Khi có tin nhắn mới, reset mảng readBy chỉ còn người gửi
    await Conversation.findByIdAndUpdate(conversationId, {
        lastMessage: {
            text: lastMsgContent,
            sender: senderId,
            readBy: [senderId], 
            createdAt: Date.now(),
            images: images
        },
        updatedAt: Date.now()
    });

    res.status(200).json(savedMessage);
  } catch (err) {
    console.error("❌ Lỗi Backend addMessage:", err);
    res.status(500).json(err);
  }
};

// ============================================================
// 8. LẤY SỐ LƯỢNG TIN NHẮN CHƯA ĐỌC
// ============================================================
export const getUnreadCount = async (req, res) => {
    try {
        const userId = req.params.userId;
        const count = await Conversation.countDocuments({
            members: { $in: [userId] },
            "lastMessage.sender": { $ne: null },
            "lastMessage.readBy": { $ne: userId }
        });
        res.status(200).json({ count });
    } catch (err) {
        console.error("❌ Lỗi getUnreadCount:", err);
        res.status(500).json(err);
    }
};