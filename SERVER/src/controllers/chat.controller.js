import Conversation from "../models/conversation.model.js";
import Message from "../models/message.model.js";

// Tạo cuộc hội thoại
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
      lastMessage: {
          readBy: [senderId] // Người tạo coi như đã đọc
      }
    });
    const saved = await newConv.save();
    res.status(200).json(saved);
  } catch (err) {
    res.status(500).json(err);
  }
};

// Lấy danh sách chat (Sắp xếp theo tin nhắn mới nhất)
export const getConversations = async (req, res) => {
  try {
    const userId = req.params.userId;
    const conversations = await Conversation.find({
      members: { $in: [userId] },
    })
    .populate("members", "HoTen Avatar Email")
    .sort({ "lastMessage.createdAt": -1 }); // Sort theo thời gian tin nhắn cuối
    
    res.status(200).json(conversations);
  } catch (err) {
    console.error("❌ Lỗi getConversations:", err);
    res.status(500).json(err);
  }
};

// Lấy tin nhắn chi tiết & ĐÁNH DẤU LÀ ĐÃ ĐỌC
export const getMessages = async (req, res) => {
  try {
    const { conversationId } = req.params;
    // Lấy userId từ query hoặc middleware (giả sử bạn gửi kèm userId hoặc lấy từ token)
    // Để đơn giản, ta sẽ lấy từ req.query.userId nếu frontend gửi lên, hoặc bỏ qua bước đánh dấu ở đây nếu không có
    const userId = req.query.userId; 

    const messages = await Message.find({ conversationId });

    // 🔥 CẬP NHẬT TRẠNG THÁI ĐÃ ĐỌC (READ)
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

// API đánh dấu đã đọc (Gọi khi user click vào chat)
export const markAsRead = async (req, res) => {
    try {
        const { conversationId, userId } = req.body;
        await Conversation.findByIdAndUpdate(conversationId, {
            $addToSet: { "lastMessage.readBy": userId }
        });
        res.status(200).json({ success: true });
    } catch (error) {
        res.status(500).json(error);
    }
};

// Tạo/Lấy nhóm chat KHIẾU NẠI
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

// Gửi tin nhắn
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

    // 🔥 Cập nhật Last Message và RESET mảng readBy (chỉ có người gửi là đã đọc)
    await Conversation.findByIdAndUpdate(conversationId, {
        lastMessage: {
            text: lastMsgContent,
            sender: senderId,
            readBy: [senderId], // Reset người đã đọc
            createdAt: Date.now()
        },
        updatedAt: Date.now()
    });

    res.status(200).json(savedMessage);
  } catch (err) {
    console.error("❌ Lỗi Backend addMessage:", err);
    res.status(500).json(err);
  }
};

// [GET] Lấy số lượng tin nhắn chưa đọc (Dựa trên readBy)
export const getUnreadCount = async (req, res) => {
    try {
        const userId = req.params.userId;

        // Đếm số cuộc hội thoại mà user LÀ thành viên NHƯNG KHÔNG nằm trong readBy của lastMessage
        // Và tin nhắn đó phải tồn tại
        const count = await Conversation.countDocuments({
            members: { $in: [userId] },
            "lastMessage.sender": { $ne: null }, // Đảm bảo có tin nhắn
            "lastMessage.readBy": { $ne: userId } // ID chưa nằm trong mảng readBy
        });

        res.status(200).json({ count });
    } catch (err) {
        console.error("❌ Lỗi getUnreadCount:", err);
        res.status(500).json(err);
    }
};