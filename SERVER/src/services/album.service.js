import Album from "../models/album.model.js";
import Order from "../models/order.model.js";
import fs from 'fs';
import path from 'path';
import mongoose from 'mongoose';

// Helper: Tìm đơn hàng an toàn
const findOrderSafe = async (id) => {
    let query = {};
    if (mongoose.Types.ObjectId.isValid(id)) {
        query = { $or: [{ order_id: id }, { _id: id }] };
    } else {
        query = { order_id: id };
    }
    return await Order.findOne(query);
};

// 1. Upload ảnh (Đã cập nhật để nhận photographerId)
export const uploadPhotosToAlbum = async (orderIdParam, files, photographerId, albumInfo = {}) => {
    console.log("📸 Service: Uploading for Order:", orderIdParam, "By Photographer:", photographerId);
    
    // BƯỚC 1: Tìm đơn hàng
    const order = await findOrderSafe(orderIdParam);
    if (!order) {
        throw new Error(`Không tìm thấy đơn hàng với mã: ${orderIdParam}`);
    }

    // BƯỚC 2: Tìm album
    let album = await Album.findOne({ order_id: order._id });
    
    // Nếu chưa có album -> Tạo mới
    if (!album) {
        if (!photographerId) throw new Error("Thiếu ID thợ chụp ảnh khi tạo Album mới!");

        album = await Album.create({
            order_id: order._id, 
            photographer_id: photographerId, // ✅ Đảm bảo trường này có dữ liệu
            customer_id: order.customer_id,
            title: albumInfo.title || `Album đơn hàng ${order.order_id}`, 
            description: albumInfo.description || "",
            max_selection: 20,
            type: 'order',
            photos: []
        });
    } else {
        // Cập nhật thông tin nếu có
        if (albumInfo.title) album.title = albumInfo.title;
        if (albumInfo.description) album.description = albumInfo.description;
    }

    // Xử lý file
    const newPhotos = files.map(file => ({
        url: `/uploads/albums/${file.filename}`,
        filename: file.filename,
        is_selected: false
    }));

    album.photos.push(...newPhotos);
    album.status = 'sent_to_customer'; 
    await album.save();
    
    return album;
};

// 2. Lấy chi tiết Album
export const getAlbumByOrder = async (orderId) => {
    const order = await findOrderSafe(orderId);
    if (!order) return null;
    return await Album.findOne({ order_id: order._id });
};

// 3. Khách hàng gửi danh sách chọn ảnh
export const submitSelection = async (orderIdParam, selectedPhotoIds) => {
    const order = await findOrderSafe(orderIdParam);
    if (!order) throw new Error("Đơn hàng không tồn tại");

    const album = await Album.findOne({ order_id: order._id });
    if (!album) throw new Error("Album không tồn tại");

    album.photos.forEach(photo => photo.is_selected = false);
    album.photos.forEach(photo => {
        if (selectedPhotoIds.includes(photo._id.toString())) {
            photo.is_selected = true;
        }
    });

    album.status = 'selection_completed';
    await album.save();
    return album;
};

// 4. Xóa 1 ảnh cụ thể
export const deletePhoto = async (orderIdParam, photoId, userId) => {
    const order = await findOrderSafe(orderIdParam);
    let album = null;
    if (order) {
        album = await Album.findOne({ order_id: order._id });
    } else if (mongoose.Types.ObjectId.isValid(orderIdParam)) {
        album = await Album.findById(orderIdParam);
    }

    if (!album) throw new Error("Album không tồn tại");

    // Cho phép xóa nếu là chủ album
    if (album.photographer_id.toString() !== userId) {
        throw new Error("Bạn không có quyền xóa ảnh này");
    }

    const photo = album.photos.id(photoId);
    if (!photo) throw new Error("Ảnh không tồn tại");

    if (photo.filename) {
        const filePath = path.join('uploads/albums', photo.filename);
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }

    album.photos.pull(photoId);
    await album.save();
    return album;
};

// 5. Cập nhật thông tin Album
export const updateAlbumInfo = async (orderIdParam, data, userId) => {
    const order = await findOrderSafe(orderIdParam);
    let album = null;

    if (order) {
        album = await Album.findOne({ order_id: order._id });
    } else if (mongoose.Types.ObjectId.isValid(orderIdParam)) {
        album = await Album.findById(orderIdParam);
    }
    
    if (!album) throw new Error("Album không tồn tại");

    if (album.photographer_id.toString() !== userId) {
        throw new Error("Bạn không có quyền chỉnh sửa album này");
    }

    if (data.title) album.title = data.title;
    if (data.description) album.description = data.description;
    
    await album.save();
    return album;
};

// 6. Xóa toàn bộ Album
export const deleteAlbum = async (orderIdParam, userId) => {
    const order = await findOrderSafe(orderIdParam);
    let album = null;

    if (order) {
        album = await Album.findOne({ order_id: order._id });
    } else if (mongoose.Types.ObjectId.isValid(orderIdParam)) {
        album = await Album.findById(orderIdParam);
    }
    
    if (!album) throw new Error("Album không tồn tại");

    if (album.photographer_id.toString() !== userId) {
        throw new Error("Bạn không có quyền xóa album này");
    }

    album.photos.forEach(photo => {
        if (photo.filename) {
            const filePath = path.join('uploads/albums', photo.filename);
            if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
        }
    });

    await Album.findByIdAndDelete(album._id);
    return { message: "Đã xóa album thành công" };
};

// 7. Lấy danh sách tổng hợp (Album + Đơn chưa có Album)
export const getPhotographerAlbums = async (photographerId) => {
    // A. Lấy Album đã tạo
    const createdAlbums = await Album.find({ photographer_id: photographerId })
        .populate('customer_id', 'HoTen Email Phone')
        .sort({ createdAt: -1 });

    // B. Lấy Đơn hàng của thợ
    const assignedOrders = await Order.find({ photographer_id: photographerId })
        .populate('customer_id', 'HoTen Email Phone');

    // C. Tìm đơn chưa có album
    const existingOrderIds = new Set(
        createdAlbums.filter(a => a.order_id).map(a => a.order_id.toString())
    );

    const pendingAlbums = assignedOrders
        .filter(order => !existingOrderIds.has(order._id.toString()))
        .map(order => ({
            _id: order._id, // ID tạm để frontend dùng làm key
            order_id: order.order_id,
            title: `Đơn hàng ${order.order_id}`,
            client_name: order.customer_id?.HoTen || "Khách hàng",
            customer_id: order.customer_id,
            photographer_id: photographerId,
            description: "Chưa tạo album",
            photos: [], // Rỗng -> Frontend hiện nút Upload
            type: 'order',
            is_pending: true,
            createdAt: order.createdAt
        }));

    return [...createdAlbums, ...pendingAlbums];
};

export default {
    uploadPhotosToAlbum,
    getAlbumByOrder,
    submitSelection,
    deletePhoto,
    updateAlbumInfo,
    deleteAlbum,
    getPhotographerAlbums
};