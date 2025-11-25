import mongoose from "mongoose";
import albumService from "../services/album.service.js";
import Album from "../models/album.model.js";
import Order from "../models/order.model.js";

// ✅ FIX QUAN TRỌNG: Kiểm tra chặt chẽ ID
// Chỉ chấp nhận chuỗi Hex 24 ký tự (0-9, a-f). 
// Tránh trường hợp mã "ORD-29DE44A6" (12 ký tự) bị nhận nhầm là ObjectId.
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

// 3. UPLOAD ẢNH
export const uploadPhotos = async (req, res) => {
    try {
        const { id } = req.params;
        const photographerId = req.user.id || req.user._id;
        const { title, description } = req.body;

        if (!photographerId) {
            return res.status(401).json({ message: "Lỗi xác thực: Không tìm thấy ID thợ chụp ảnh" });
        }

        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ message: "Vui lòng chọn file ảnh!" });
        }

        let album = null;
        
        // 1. Tìm album (Logic an toàn với regex mới)
        if (isMongoId(id)) {
            album = await Album.findById(id);
            if (!album) album = await Album.findOne({ order_id: id });
        } 
        
        // 2. Nếu chưa thấy -> Tìm thông qua Order
        if (!album) {
            // Tìm order theo _id (nếu là hex) hoặc order_id (nếu là string)
            const orderQuery = isMongoId(id) ? { _id: id } : { order_id: id };
            const order = await Order.findOne(orderQuery);
            
            if (order) {
                // Dùng ObjectId thật của order để tìm album
                album = await Album.findOne({ order_id: order._id });
            }
        }

        // 3. Xử lý tạo mới hoặc cập nhật
        if (!album) {
            album = await albumService.uploadPhotosToAlbum(
                id,                 
                req.files,          
                photographerId,     
                { title, description } 
            );
        } else {
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

// 4. Lấy chi tiết Album (ĐÃ FIX LỖI 500 do nhận nhầm ID)
export const getAlbum = async (req, res) => {
    try {
        const { id } = req.params;
        console.log(`========== DEBUG GET ALBUM ==========`);
        console.log(`1. Input ID: ${id}`);
        console.log(`2. Is Valid MongoID?: ${isMongoId(id)}`);

        let album = null;

        // BƯỚC 1: Tìm trực tiếp bằng ID Album
        if (isMongoId(id)) {
            album = await Album.findById(id);
            console.log(`3. Search by Album ID result: ${album ? "Found" : "Not Found"}`);
            if (!album) {
                album = await Album.findOne({ order_id: id });
                console.log(`4. Search by Order ObjectID result: ${album ? "Found" : "Not Found"}`);
            }
        }

        // BƯỚC 2: Nếu chưa thấy -> Tìm thông qua Order Code (ORD-...)
        if (!album) {
            const orderQuery = isMongoId(id) ? { _id: id } : { order_id: id };
            console.log("5. Order Query:", JSON.stringify(orderQuery));
            
            const order = await Order.findOne(orderQuery);
            
            if (order) {
                console.log(`6. Order Found: _id=${order._id}, code=${order.order_id}`);
                // Dùng ObjectId thật của Order để tìm Album
                album = await Album.findOne({ order_id: order._id });
                console.log(`7. Search Album by Order._id (${order._id}) result: ${album ? "Found" : "NOT FOUND"}`);
            } else {
                console.log("6. Order NOT FOUND with this ID/Code");
            }
        }

        if (!album) {
            console.log("=> KẾT QUẢ: Không tìm thấy album nào.");
            return res.json({ success: true, data: null, message: "Chưa có album" });
        }

        console.log("=> KẾT QUẢ: Đã tìm thấy Album:", album._id);
        res.json({ success: true, data: album });

    } catch (error) {
        console.error("❌ Lỗi getAlbum:", error);
        res.status(500).json({ message: error.message });
    }
};

// Các hàm khác giữ nguyên
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