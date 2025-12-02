import albumService from "../services/album.service.js";
import Album from "../models/album.model.js";
import Order from "../models/order.model.js";
import mongoose from "mongoose";
import crypto from "crypto"; 

// ✅ IMPORT HỆ THỐNG THÔNG BÁO
import { createNotification } from "./notification.controller.js"; // Cho Khách/Thợ
import { notifyAllAdmins } from "./notificationAdmin.controller.js"; // Cho Admin

// Helper check ID
const isMongoId = (id) => mongoose.Types.ObjectId.isValid(id) && /^[0-9a-fA-F]{24}$/.test(id);

// 1. Tạo Album Freelance
export const createFreelanceAlbum = async (req, res) => {
    try {
        const { title, client_name, description } = req.body;
        const photographerId = req.user.id || req.user._id;

        if (!photographerId) return res.status(401).json({ message: "Không tìm thấy User ID" });

        const newAlbum = new Album({
            photographer_id: photographerId,
            title: title || "Album Job Ngoài",
            client_name: client_name || "Khách lẻ",
            description: description || "",
            type: 'freelance',
            status: 'draft',
            order_id: null,
            photos: []
        });

        await newAlbum.save();
        res.status(201).json({ success: true, message: "Tạo album thành công", data: newAlbum });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// 2. Lấy danh sách Album
export const getMyAlbums = async (req, res) => {
    try {
        const photographerId = req.user.id || req.user._id;
        const albums = await albumService.getPhotographerAlbums(photographerId);
        res.json({ success: true, data: albums });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// 3. Upload ảnh (GIAO ẢNH GỐC)
export const uploadPhotos = async (req, res) => {
    try {
        const { id } = req.params;
        const photographerId = req.user.id || req.user._id;
        const { title, description } = req.body;

        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ message: "Vui lòng chọn file ảnh!" });
        }

        let album = null;
        if (isMongoId(id)) {
            album = await Album.findById(id);
            if (!album) album = await Album.findOne({ order_id: id });
        } 
        if (!album) {
            const orderQuery = isMongoId(id) ? { _id: id } : { order_id: id };
            const order = await Order.findOne(orderQuery);
            if (order) album = await Album.findOne({ order_id: order._id });
        }

        if (!album) {
            album = await albumService.uploadPhotosToAlbum(id, req.files, photographerId, { title, description });
        } else {
            const newPhotos = req.files.map(file => ({
                url: `/uploads/albums/${file.filename}`,
                filename: file.filename,
                is_selected: false
            }));
            album.photos.push(...newPhotos);
            if (title) album.title = title;
            if (description) album.description = description;
            album.status = 'sent_to_customer'; // Cập nhật trạng thái
            await album.save();
        }

        // 🔔 THÔNG BÁO CHO KHÁCH HÀNG: Đã có ảnh gốc
        if (album.customer_id) {
            await createNotification({
                userId: album.customer_id,
                title: "📸 Ảnh gốc đã sẵn sàng!",
                message: `Nhiếp ảnh gia đã tải lên ảnh gốc cho album "${album.title}". Vào chọn ảnh ngay nhé!`,
                type: "ALBUM",
                link: `/albums/detail/${album.order_id || album._id}`
            });
        }

        res.json({ success: true, message: "Upload thành công", data: album });
    } catch (error) {
        console.error("Upload Error:", error);
        res.status(500).json({ message: error.message });
    }
};

// 4. Lấy chi tiết Album
export const getAlbum = async (req, res) => {
    try {
        const { id } = req.params;
        let album = null;
        if (isMongoId(id)) {
            album = await Album.findById(id);
            if (!album) album = await Album.findOne({ order_id: id });
        }
        if (!album) {
            const orderQuery = isMongoId(id) ? { _id: id } : { order_id: id };
            const order = await Order.findOne(orderQuery);
            if (order) album = await Album.findOne({ order_id: order._id });
        }
        if (!album) return res.json({ success: true, data: null, message: "Chưa có album" });
        res.json({ success: true, data: album });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// 5. Khách chọn ảnh
export const selectPhotos = async (req, res) => {
    try {
        const result = await albumService.submitSelection(req.params.id, req.body.selectedIds);
        res.json({ success: true, message: "Đã gửi lựa chọn!", data: result });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// 6. Xóa ảnh
export const deletePhoto = async (req, res) => {
    try {
        const userId = req.user.id || req.user._id;
        const result = await albumService.deletePhoto(req.params.id, req.params.photoId, userId);
        res.json({ success: true, message: "Đã xóa ảnh", data: result });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// 7. Cập nhật thông tin Album
export const updateAlbumInfo = async (req, res) => {
    try {
        const userId = req.user.id || req.user._id;
        const result = await albumService.updateAlbumInfo(req.params.id, req.body, userId);
        res.json({ success: true, message: "Cập nhật thành công", data: result });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// 8. Xóa Album
export const deleteAlbum = async (req, res) => {
    try {
        const userId = req.user.id || req.user._id;
        const result = await albumService.deleteAlbum(req.params.id, userId);
        res.json({ success: true, message: result.message });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// 9. Tạo link chia sẻ
export const createShareLink = async (req, res) => {
    try {
        const { id } = req.params; 
        const userId = req.user.id || req.user._id;
        let album = null;
        if (isMongoId(id)) {
            album = await Album.findById(id);
            if (!album) album = await Album.findOne({ order_id: id });
        } else {
            const order = await Order.findOne({ order_id: id });
            if (order) album = await Album.findOne({ order_id: order._id });
        }
        if (!album) return res.status(404).json({ message: "Không tìm thấy album" });
        const isOwner = album.photographer_id.toString() === userId;
        const isCustomer = album.customer_id && album.customer_id.toString() === userId;
        if (!isOwner && !isCustomer) {
            return res.status(403).json({ message: "Bạn không có quyền chia sẻ album này" });
        }
        if (!album.share_token) {
            album.share_token = crypto.randomBytes(16).toString('hex');
            await album.save();
        }
        const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
        const shareLink = `${clientUrl}/share/${album.share_token}`;
        res.json({ success: true, shareLink, shareToken: album.share_token });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Lỗi tạo link chia sẻ" });
    }
};

// 10. Lấy Album công khai
export const getPublicAlbum = async (req, res) => {
    try {
        const { token } = req.params;
        const album = await Album.findOne({ share_token: token })
            .populate({ path: 'photographer_id', select: 'HoTen Avatar', model: 'bangKhachHang' })
            .select('-__v');
        if (!album) return res.status(404).json({ message: "Link chia sẻ không hợp lệ" });
        res.json({ success: true, data: album });
    } catch (error) {
        res.status(500).json({ message: "Lỗi server: " + error.message });
    }
};

// 11. Submit lựa chọn công khai
export const submitPublicSelection = async (req, res) => {
    try {
        const { token } = req.params;
        const { selectedIds } = req.body; 
        const album = await Album.findOne({ share_token: token });
        if (!album) return res.status(404).json({ message: "Link chia sẻ không hợp lệ" });
        album.photos.forEach(photo => photo.is_selected = false);
        let count = 0;
        album.photos.forEach(photo => {
            if (selectedIds.includes(photo._id.toString())) {
                photo.is_selected = true;
                count++;
            }
        });
        album.status = 'selection_completed'; 
        await album.save();
        res.json({ success: true, message: `Đã gửi ${count} ảnh thành công!` });
    } catch (error) {
        res.status(500).json({ message: "Lỗi server khi gửi lựa chọn" });
    }
};

// =========================================================
// [NEW] Giao Album (Upload ảnh đã chỉnh + Thông báo)
// =========================================================
export const deliverAlbum = async (req, res) => {
    try {
        const { id } = req.params; // Album ID hoặc Order ID
        const photographerId = req.user.id || req.user._id;

        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ message: "Vui lòng tải lên ảnh đã chỉnh sửa!" });
        }

        // 1. Tìm Album
        let album = null;
        if (isMongoId(id)) {
            album = await Album.findById(id);
            if (!album) album = await Album.findOne({ order_id: id });
        } else {
            const order = await Order.findOne({ order_id: id });
            if (order) album = await Album.findOne({ order_id: order._id });
        }

        if (!album) return res.status(404).json({ message: "Không tìm thấy Album" });

        // 2. Xử lý file ảnh đã chỉnh
        const editedPhotos = req.files.map(file => ({
            url: `/uploads/albums/${file.filename}`,
            filename: file.filename,
            is_selected: false
        }));

        // 3. Lưu vào mảng edited_photos
        album.edited_photos.push(...editedPhotos);
        album.status = 'finalized'; // Đánh dấu album đã hoàn tất
        await album.save();

        let order = null;
        // 4. Cập nhật trạng thái đơn hàng sang 'delivered'
        if (album.order_id) {
            order = await Order.findByIdAndUpdate(album.order_id, { 
                status: 'delivered',
            }, { new: true });
        }

        // 🔔 THÔNG BÁO CHO KHÁCH HÀNG: Ảnh đã xong
        if (album.customer_id) {
            await createNotification({
                userId: album.customer_id,
                title: "✨ Album ảnh hoàn chỉnh đã có!",
                message: `Nhiếp ảnh gia đã giao ảnh chỉnh sửa cho album "${album.title}". Bạn có thể xem và tải về ngay.`,
                type: "ALBUM",
                link: `/albums/detail/${album.order_id || album._id}`
            });
        }

        // ✅ [MỚI] THÔNG BÁO CHO TẤT CẢ ADMIN: Đơn hoàn thành -> Quyết toán
        if (order) {
            await notifyAllAdmins({
                title: "✅ Đơn hàng đã hoàn thành",
                message: `Photographer đã giao ảnh cho đơn #${order.order_id}. Vui lòng kiểm tra và quyết toán tiền.`,
                type: "ORDER",
                link: "/admin/payment-manage" // Link tới trang thanh toán để Admin trả lương thợ
            });
        }

        res.json({ success: true, message: "Đã giao album thành công!", data: album });
    } catch (error) {
        console.error("Deliver Error:", error);
        res.status(500).json({ message: error.message });
    }
};

export default {
    createFreelanceAlbum,
    getMyAlbums,
    uploadPhotos,
    getAlbum,
    selectPhotos,
    deletePhoto,
    updateAlbumInfo,
    deleteAlbum,
    createShareLink,
    getPublicAlbum,
    submitPublicSelection,
    deliverAlbum
};