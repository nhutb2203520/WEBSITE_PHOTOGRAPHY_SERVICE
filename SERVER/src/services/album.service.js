import Album from "../models/album.model.js";
import Order from "../models/order.model.js";
import fs from 'fs';
import path from 'path';
import mongoose from 'mongoose';

const findOrderSafe = async (id) => {
    let query = {};
    if (mongoose.Types.ObjectId.isValid(id)) {
        query = { $or: [{ order_id: id }, { _id: id }] };
    } else {
        query = { order_id: id };
    }
    return await Order.findOne(query);
};

// 1. Lấy danh sách album
export const getPhotographerAlbums = async (photographerId) => {
    // A. Lấy Album đã tạo
    const createdAlbums = await Album.find({ photographer_id: photographerId })
        .populate('customer_id', 'HoTen Email Phone')
        .sort({ createdAt: -1 });

    // B. Lấy Đơn hàng của thợ
    const assignedOrders = await Order.find({ photographer_id: photographerId })
        .populate('customer_id', 'HoTen Email Phone');

    // C. Ghép dữ liệu
    const existingOrderIds = new Set(
        createdAlbums.filter(a => a.order_id).map(a => a.order_id.toString())
    );

    const pendingAlbums = assignedOrders
        .filter(order => !existingOrderIds.has(order._id.toString()))
        .map(order => ({
            _id: order._id,
            order_id: order.order_id,
            title: `Đơn hàng ${order.order_id}`,
            client_name: order.customer_id?.HoTen || "Khách hàng",
            customer_id: order.customer_id,
            photographer_id: photographerId,
            description: "Chưa tạo album",
            photos: [],
            type: 'order',
            is_pending: true,
            createdAt: order.createdAt
        }));
    
    return [...createdAlbums, ...pendingAlbums];
};

// 2. Upload ảnh
export const uploadPhotosToAlbum = async (orderIdParam, files, photographerId, albumInfo = {}) => {
    const order = await findOrderSafe(orderIdParam);
    if (!order) throw new Error(`Không tìm thấy đơn hàng: ${orderIdParam}`);

    let album = await Album.findOne({ order_id: order._id });
    if (!album) {
        if (!photographerId) throw new Error("Thiếu ID thợ ảnh!");
        album = await Album.create({
            order_id: order._id, 
            photographer_id: photographerId,
            customer_id: order.customer_id,
            title: albumInfo.title || `Album đơn hàng ${order.order_id}`, 
            description: albumInfo.description || "",
            max_selection: 20,
            type: 'order',
            photos: []
        });
    } else {
        if (albumInfo.title) album.title = albumInfo.title;
        if (albumInfo.description) album.description = albumInfo.description;
    }

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

// 3. Xóa ảnh (ĐÃ NÂNG CẤP: HỖ TRỢ XÓA CẢ ẢNH GỐC VÀ ẢNH CHỈNH SỬA)
export const deletePhoto = async (orderIdParam, photoId, userId) => {
    // Tìm album
    const order = await findOrderSafe(orderIdParam);
    let album = null;
    if (order) album = await Album.findOne({ order_id: order._id });
    else if (mongoose.Types.ObjectId.isValid(orderIdParam)) album = await Album.findById(orderIdParam);

    if (!album) throw new Error("Album không tồn tại");
    if (album.photographer_id.toString() !== userId) throw new Error("Không có quyền xóa");

    // --- LOGIC MỚI ---
    let photo = null;
    let isEdited = false;

    // 1. Tìm trong mảng ảnh gốc (photos)
    photo = album.photos.id(photoId);

    // 2. Nếu không thấy, tìm trong mảng ảnh đã chỉnh (edited_photos)
    if (!photo && album.edited_photos) {
        photo = album.edited_photos.id(photoId);
        isEdited = true;
    }

    if (!photo) throw new Error("Ảnh không tìm thấy để xóa");

    // 3. Xóa file vật lý
    if (photo.filename) {
        const filePath = path.join('uploads/albums', photo.filename);
        try {
            if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
        } catch (err) {
            console.warn("⚠️ Không thể xóa file vật lý (có thể đã mất):", err.message);
        }
    }

    // 4. Xóa khỏi mảng tương ứng trong DB
    if (isEdited) {
        album.edited_photos.pull(photoId);
    } else {
        album.photos.pull(photoId);
    }

    await album.save();
    return album;
};

export const getAlbumByOrder = async (orderId) => {
    const order = await findOrderSafe(orderId);
    if (!order) return null;
    return await Album.findOne({ order_id: order._id });
};

export const submitSelection = async (orderIdParam, selectedPhotoIds) => {
    const order = await findOrderSafe(orderIdParam);
    if (!order) throw new Error("Đơn hàng không tồn tại");
    const album = await Album.findOne({ order_id: order._id });
    if (!album) throw new Error("Album không tồn tại");

    album.photos.forEach(photo => photo.is_selected = false);
    album.photos.forEach(photo => {
        if (selectedPhotoIds.includes(photo._id.toString())) photo.is_selected = true;
    });
    album.status = 'selection_completed';
    await album.save();
    return album;
};

export const updateAlbumInfo = async (orderIdParam, data, userId) => {
    const order = await findOrderSafe(orderIdParam);
    let album = null;
    if (order) album = await Album.findOne({ order_id: order._id });
    else if (mongoose.Types.ObjectId.isValid(orderIdParam)) album = await Album.findById(orderIdParam);
    
    if (!album) throw new Error("Album không tồn tại");
    if (album.photographer_id.toString() !== userId) throw new Error("Không có quyền sửa");

    if (data.title) album.title = data.title;
    if (data.description) album.description = data.description;
    await album.save();
    return album;
};

export const deleteAlbum = async (orderIdParam, userId) => {
    const order = await findOrderSafe(orderIdParam);
    let album = null;
    if (order) album = await Album.findOne({ order_id: order._id });
    else if (mongoose.Types.ObjectId.isValid(orderIdParam)) album = await Album.findById(orderIdParam);
    
    if (!album) throw new Error("Album không tồn tại");
    if (album.photographer_id.toString() !== userId) throw new Error("Không có quyền xóa");

    // Xóa tất cả ảnh gốc
    album.photos.forEach(photo => {
        if (photo.filename) {
            const filePath = path.join('uploads/albums', photo.filename);
            if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
        }
    });

    // Xóa tất cả ảnh đã chỉnh (nếu có)
    if (album.edited_photos) {
        album.edited_photos.forEach(photo => {
            if (photo.filename) {
                const filePath = path.join('uploads/albums', photo.filename);
                if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
            }
        });
    }

    await Album.findByIdAndDelete(album._id);
    return { message: "Đã xóa album thành công" };
};

export default {
    uploadPhotosToAlbum, getAlbumByOrder, submitSelection, deletePhoto, 
    updateAlbumInfo, deleteAlbum, getPhotographerAlbums
};