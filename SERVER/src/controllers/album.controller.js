import mongoose from "mongoose";
import albumService from "../services/album.service.js";
import Album from "../models/album.model.js";
import Order from "../models/order.model.js";

const isMongoId = (id) => mongoose.Types.ObjectId.isValid(id);

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
            order_id: null
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

// 3. UPLOAD ẢNH (QUAN TRỌNG: SỬA LỖI VALIDATION)
export const uploadPhotos = async (req, res) => {
    try {
        const { id } = req.params;
        const photographerId = req.user.id || req.user._id;
        const { title, description } = req.body;

        // Debug log để kiểm tra
        console.log("🚀 Upload Controller -> User ID:", photographerId);

        if (!photographerId) {
            return res.status(401).json({ message: "Lỗi xác thực: Không tìm thấy ID thợ chụp ảnh" });
        }

        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ message: "Vui lòng chọn file ảnh!" });
        }

        let album = null;
        if (isMongoId(id)) {
            album = await Album.findById(id);
            if (!album) album = await Album.findOne({ order_id: id });
        }

        // Nếu chưa có album -> Gọi Service tạo mới
        if (!album) {
            // ✅ Đảm bảo truyền đúng thứ tự tham số khớp với Service
            album = await albumService.uploadPhotosToAlbum(
                id,                 // orderIdParam
                req.files,          // files
                photographerId,     // photographerId (Bắt buộc)
                { title, description } // albumInfo
            );
        } else {
            // Nếu đã có album -> Push ảnh trực tiếp
            const newPhotos = req.files.map(file => ({
                url: `/uploads/albums/${file.filename}`,
                filename: file.filename,
                is_selected: false
            }));
            album.photos.push(...newPhotos);
            if (title) album.title = title;
            if (description) album.description = description;
            await album.save();
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
            const order = await Order.findOne({ order_id: id });
            if (order) album = await Album.findOne({ order_id: order._id });
        }

        if (!album) return res.json({ success: true, data: null, message: "Chưa có album" });

        res.json({ success: true, data: album });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Các hàm khác giữ nguyên, gọi qua Service hoặc xử lý đơn giản
export const selectPhotos = async (req, res) => {
    try {
        const result = await albumService.submitSelection(req.params.id, req.body.selectedIds);
        res.json({ success: true, message: "Đã gửi lựa chọn!", data: result });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const deletePhoto = async (req, res) => {
    try {
        const userId = req.user.id || req.user._id;
        const result = await albumService.deletePhoto(req.params.id, req.params.photoId, userId);
        res.json({ success: true, message: "Đã xóa ảnh", data: result });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const updateAlbumInfo = async (req, res) => {
    try {
        const userId = req.user.id || req.user._id;
        const result = await albumService.updateAlbumInfo(req.params.id, req.body, userId);
        res.json({ success: true, message: "Cập nhật thành công", data: result });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const deleteAlbum = async (req, res) => {
    try {
        const userId = req.user.id || req.user._id;
        const result = await albumService.deleteAlbum(req.params.id, userId);
        res.json({ success: true, message: result.message });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};