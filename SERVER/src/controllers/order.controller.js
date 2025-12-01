import Order from "../models/order.model.js";
import ServicePackage from "../models/servicePackage.model.js";
import Review from "../models/review.model.js";
import Schedule from "../models/schedule.model.js";
import Album from "../models/album.model.js";
import mongoose from "mongoose"; 
import orderService from "../services/order.service.js";

// 👇 QUAN TRỌNG: PHẢI CÓ DÒNG NÀY MỚI LẤY ĐƯỢC PHÍ SÀN
import ServiceFee from "../models/servicefee.model.js"; 

// ✅ IMPORT HÀM TẠO THÔNG BÁO
import { createNotification } from "./notification.controller.js";

// ==============================================================================
// 📦 1. TẠO ĐƠN HÀNG MỚI
// ==============================================================================
export const createOrder = async (req, res) => {
    try {
        const customer_id = req.user.id;
        const { booking_date, start_time, photographer_id, service_package_id, package_name } = req.body;

        if (!booking_date || !start_time) {
            return res.status(400).json({ message: "Vui lòng chọn ngày và giờ chụp!" });
        }

        const searchDate = new Date(booking_date);
        const startOfDay = new Date(searchDate); startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(searchDate); endOfDay.setHours(23, 59, 59, 999);

        const orderQuery = {
            booking_date: { $gte: startOfDay, $lte: endOfDay },
            start_time: start_time,
            status: { $nin: ['cancelled', 'refund_pending', 'rejected'] }
        };

        if (photographer_id) {
            orderQuery.photographer_id = photographer_id;
            const duplicateOrder = await Order.findOne(orderQuery);
            if (duplicateOrder) {
                return res.status(409).json({
                    message: `Nhiếp ảnh gia đã có đơn hàng vào lúc ${start_time} ngày này.`
                });
            }
        } else {
            orderQuery.customer_id = customer_id;
            const duplicateMyOrder = await Order.findOne(orderQuery);
            if (duplicateMyOrder) {
                return res.status(409).json({
                    message: `Bạn đã có một đơn hàng khác vào khung giờ này rồi!`
                });
            }
        }

        if (photographer_id) {
            const conflictSchedule = await Schedule.findOne({
                photographerId: photographer_id,
                date: { $gte: startOfDay, $lte: endOfDay },
                type: { $in: ['busy', 'personal'] }
            });

            if (conflictSchedule) {
                return res.status(409).json({
                    message: `Nhiếp ảnh gia có lịch cá nhân/báo bận vào ngày này ("${conflictSchedule.title}"). Vui lòng chọn ngày khác.`
                });
            }
        }

        const payload = { customer_id, ...req.body };
        const newOrder = await orderService.createOrder(payload);

        // Tạo lịch cho khách
        await new Schedule({
            photographerId: customer_id,
            title: `Đơn hàng #${newOrder.order_id}`,
            date: searchDate,
            type: 'order',
            orderId: newOrder._id,
            description: `Gói: ${package_name || 'Dịch vụ chụp ảnh'}`
        }).save();

        // Tạo lịch cho thợ (nếu có)
        if (newOrder.photographer_id) {
            await new Schedule({
                photographerId: newOrder.photographer_id,
                title: `Chụp khách: ${req.user.last_name || 'Khách'} (${start_time})`,
                date: searchDate,
                type: 'order',
                orderId: newOrder._id
            }).save();
        }

        // 🔔 THÔNG BÁO: Gửi cho khách hàng
        await createNotification({
            userId: customer_id,
            title: "Đặt lịch thành công!",
            message: `Đơn hàng #${newOrder.order_id} của bạn đã được tạo. Vui lòng thanh toán cọc để giữ lịch.`,
            type: "ORDER",
            link: "/my-orders"
        });

        // 🔔 THÔNG BÁO: Gửi cho thợ chụp (nếu có)
        if (newOrder.photographer_id) {
            await createNotification({
                userId: newOrder.photographer_id,
                title: "Bạn có lịch chụp mới!",
                message: `Bạn nhận được đơn hàng #${newOrder.order_id} vào ngày ${new Date(booking_date).toLocaleDateString('vi-VN')}.`,
                type: "ORDER",
                link: "/photographer/orders-manage"
            });
        }

        res.status(201).json({
            message: "Tạo đơn hàng thành công!",
            data: newOrder,
            payment_info: newOrder.payment_info
        });

    } catch (error) {
        console.error("Create order error:", error);
        res.status(error.status || 500).json({ message: error.message || "Lỗi server!" });
    }
};

// ==============================================================================
// 📋 2. LẤY DANH SÁCH ĐƠN HÀNG CỦA TÔI (Dùng cho Khách Hàng)
// ==============================================================================
export const getMyOrders = async (req, res) => {
    try {
        const userId = req.user._id || req.user.id;

        const orders = await Order.find({ customer_id: userId })
            .populate({
                path: "service_package_id",
                select: "TenGoi AnhBia Gia LoaiGoi"
            })
            .populate({
                path: "photographer_id",
                select: "HoTen",
                model: "bangKhachHang"
            })
            .sort({ createdAt: -1 });

        const ordersWithData = await Promise.all(orders.map(async (order) => {
            const orderObj = order.toObject();
            const album = await Album.findOne({ order_id: order._id }).select('_id status');
            const reviewData = await Review.findOne({ OrderId: order._id });

            if (reviewData) {
                orderObj.review = {
                    is_reviewed: true, 
                    rating: reviewData.Rating,
                    comment: reviewData.Comment,
                    images: reviewData.Images,
                    is_edited: reviewData.is_edited,
                    _id: reviewData._id 
                };
            }

            return {
                ...orderObj,
                has_album: !!album,
                album_id: album?._id
            };
        }));

        res.status(200).json({
            success: true,
            message: "Danh sách đơn hàng của bạn",
            data: ordersWithData
        });

    } catch (error) {
        console.error("❌ Get my orders error:", error);
        res.status(500).json({ message: "Lỗi server khi lấy danh sách đơn!" });
    }
};

// ==============================================================================
// 📸 LẤY DANH SÁCH ĐƠN CỦA PHOTOGRAPHER
// ==============================================================================
export const getMyOrdersPhotographer = async (req, res) => {
    try {
        const userId = req.user._id || req.user.id;

        const orders = await Order.find({ photographer_id: userId })
            .populate({
                path: "service_package_id",
                select: "TenGoi AnhBia Gia"
            })
            .populate({
                path: "customer_id",
                select: "HoTen Email SoDienThoai Avatar",
                model: "bangKhachHang"
            })
            .sort({ createdAt: -1 });

        const ordersWithAlbumStatus = await Promise.all(orders.map(async (order) => {
            const album = await Album.findOne({ order_id: order._id }).select('_id status');
            return {
                ...order.toObject(),
                has_album: !!album,
                album_id: album?._id
            };
        }));

        res.status(200).json({
            success: true,
            message: "Danh sách đơn hàng của thợ",
            data: ordersWithAlbumStatus
        });
    } catch (error) {
        console.error("❌ Photographer orders error:", error);
        res.status(500).json({ message: "Lỗi server!" });
    }
};

// ==============================================================================
// 📸 LẤY CHI TIẾT ĐƠN CỦA PHOTOGRAPHER
// ==============================================================================
export const getOrderDetailPhotographer = async (req, res) => {
    try {
        const { orderId } = req.params;
        let query = {};
        if (mongoose.Types.ObjectId.isValid(orderId)) {
            query = { $or: [{ order_id: orderId }, { _id: orderId }] };
        } else {
            query = { order_id: orderId };
        }

        const order = await Order.findOne(query)
            .populate({
                path: "service_package_id",
                select: "TenGoi AnhBia Gia MoTa"
            })
            .populate({
                path: "customer_id",
                select: "HoTen Email SoDienThoai Avatar",
                model: "bangKhachHang"
            });

        if (!order) return res.status(404).json({ message: "Không tìm thấy đơn hàng" });

        res.json({ data: order });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// ==============================================================================
// 🔄 3. CẬP NHẬT TRẠNG THÁI ĐƠN
// ==============================================================================
export const updateOrderStatus = async (req, res) => {
    try {
        const { status, note } = req.body;
        const userId = req.user?.id || null;

        const updated = await orderService.updateOrderStatus(
            req.params.orderId,
            status,
            userId,
            note
        );

        // 🔔 THÔNG BÁO: Gửi cho khách hàng khi trạng thái thay đổi
        if (updated) {
            let notiTitle = "";
            let notiMessage = "";
            let notiType = "ORDER";
            let notiLink = "/my-orders";

            if (status === 'confirmed') {
                notiTitle = "Đơn hàng đã được duyệt!";
                notiMessage = `Đơn hàng #${updated.order_id} của bạn đã được xác nhận. Hãy chuẩn bị cho buổi chụp nhé!`;
            } else if (status === 'processing') {
                notiTitle = "Đang xử lý ảnh";
                notiMessage = `Buổi chụp #${updated.order_id} đã hoàn tất. Chúng tôi đang xử lý hậu kỳ ảnh.`;
                notiType = "ALBUM";
            } else if (status === 'delivered') {
                notiTitle = "Ảnh của bạn đã có!";
                notiMessage = `Album ảnh cho đơn hàng #${updated.order_id} đã hoàn thành. Xem ngay!`;
                notiType = "ALBUM";
                notiLink = `/albums/detail/${updated._id}`;
            } else if (status === 'cancelled') {
                notiTitle = "Đơn hàng bị hủy";
                notiMessage = `Đơn hàng #${updated.order_id} đã bị hủy. Lý do: ${note || 'Không có'}`;
            }

            if (notiTitle) {
                await createNotification({
                    userId: updated.customer_id,
                    title: notiTitle,
                    message: notiMessage,
                    type: notiType,
                    link: notiLink
                });
            }
        }

        res.json({ message: "Cập nhật trạng thái thành công", data: updated });
    } catch (error) {
        console.error("Update order status error:", error);
        res.status(error.status || 500).json({ message: error.message || "Lỗi server!" });
    }
};

// ==============================================================================
// 🔍 4. LẤY CHI TIẾT ĐƠN HÀNG (chung)
// ==============================================================================
export const getOrderDetail = async (req, res) => {
    try {
        const { orderId } = req.params;
        let query = {};
        if (mongoose.Types.ObjectId.isValid(orderId)) {
            query = { $or: [{ order_id: orderId }, { _id: orderId }] };
        } else {
            query = { order_id: orderId };
        }

        const order = await Order.findOne(query)
            .populate({
                path: "service_package_id",
                select: "TenGoi AnhBia Gia MoTa"
            })
            .populate({
                path: "photographer_id",
                select: "HoTen Avatar",
                model: "bangKhachHang"
            })
            .populate({
                path: "customer_id",
                select: "HoTen Email SoDienThoai Avatar",
                model: "bangKhachHang"
            });

        if (!order) {
            return res.status(404).json({ message: "Không tìm thấy đơn hàng" });
        }

        res.json({ data: order });

    } catch (error) {
        console.error("❌ [DEBUG] Lỗi Server:", error);
        res.status(500).json({ message: error.message || "Lỗi server!" });
    }
};

// ==============================================================================
// 🚚 5. TÍNH PHÍ DI CHUYỂN
// ==============================================================================
export const calculateTravelFee = async (req, res) => {
    try {
        const { packageId, lat, lng } = req.body;
        if (!packageId) return res.status(400).json({ message: "Vui lòng cung cấp packageId" });

        const result = await orderService.calculateTravelFeePreview(packageId, { lat, lng });
        res.json({ success: true, data: result });
    } catch (error) {
        console.error("Calculate travel fee error:", error);
        res.status(error.status || 500).json({ message: error.message || "Lỗi server!" });
    }
};

// ==============================================================================
// 💰 6. XÁC NHẬN THANH TOÁN
// ==============================================================================
export const confirmPayment = async (req, res) => {
    try {
        const { orderId } = req.params;
        const { method, amount, transaction_code } = req.body;

        if (method === 'banking' && !req.file) {
            return res.status(400).json({ message: "Vui lòng tải lên ảnh xác thực chuyển khoản!" });
        }

        let fileUrl = null;
        if (req.file) {
            fileUrl = `${req.protocol}://${req.get('host')}/uploads/orders/${req.file.filename}`;
        }

        const order = await Order.findById(orderId);
        if (!order) return res.status(404).json({ message: "Không tìm thấy đơn hàng" });

        if (order.status === 'pending_payment') {
            order.payment_info.transfer_image = fileUrl;
            order.payment_info.transfer_date = new Date();
            order.payment_info.transaction_code = transaction_code;
            order.payment_info.deposit_amount = Number(amount);
            order.status = 'pending';

            order.status_history.push({
                status: 'pending',
                changed_by: req.user.id,
                note: `Khách hàng xác nhận cọc (Mã GD: ${transaction_code})`
            });
        } else {
            order.payment_info.remaining_transfer_image = fileUrl;
            order.payment_info.remaining_status = 'pending';
            order.payment_info.remaining_paid_at = new Date();
            order.status = 'final_payment_pending';

            order.status_history.push({
                status: 'final_payment_pending',
                changed_by: req.user.id,
                note: `Khách hàng thanh toán phần còn lại (Mã GD: ${transaction_code})`
            });
        }

        await order.save();

        // 🔔 THÔNG BÁO: Gửi cho khách hàng đã xác nhận thanh toán
        await createNotification({
            userId: order.customer_id,
            title: "Đã gửi xác nhận thanh toán",
            message: `Thanh toán cho đơn hàng #${order.order_id} (Mã GD: ${transaction_code}) đang chờ Admin duyệt.`,
            type: "PAYMENT",
            link: "/my-orders"
        });

        res.json({
            success: true,
            message: "Đã gửi xác nhận thanh toán. Vui lòng chờ Admin duyệt.",
            data: {
                order_id: order.order_id,
                transfer_image: fileUrl,
                status: order.status
            }
        });

    } catch (error) {
        console.error("Confirm payment error:", error);
        res.status(500).json({ message: "Lỗi khi xác nhận thanh toán", error: error.message });
    }
};

// ==============================================================================
// 📢 7. GỬI KHIẾU NẠI
// ==============================================================================
export const submitComplaint = async (req, res) => {
    try {
        const { orderId } = req.params;
        const { reason } = req.body;
        const userId = req.user.id;

        const result = await orderService.submitComplaint(orderId, reason, userId);
        res.json({ success: true, message: "Đã gửi khiếu nại thành công", data: result });
    } catch (error) {
        console.error("Submit complaint error:", error);
        res.status(400).json({ message: error.message });
    }
};

// ==============================================================================
// ⭐ 8. GỬI ĐÁNH GIÁ
// ==============================================================================
export const submitReview = async (req, res) => {
    try {
        const { orderId } = req.params;
        const { rating, comment } = req.body;
        const userId = req.user.id;

        const result = await orderService.submitReview(orderId, rating, comment, userId);
        res.json({ success: true, message: "Cảm ơn bạn đã đánh giá dịch vụ!", data: result });
    } catch (error) {
        console.error("Submit review error:", error);
        res.status(400).json({ message: error.message });
    }
};

// ==============================================================================
// 👮 9. ADMIN GIẢI QUYẾT KHIẾU NẠI
// ==============================================================================
export const resolveComplaint = async (req, res) => {
    try {
        const { orderId } = req.params;
        const { status, response } = req.body;
        const adminId = req.user.id;

        const result = await orderService.resolveComplaint(orderId, status, response, adminId);

        res.json({
            success: true,
            message: status === 'resolved' ? "Đã chấp nhận khiếu nại" : "Đã từ chối khiếu nại",
            data: result
        });
    } catch (error) {
        console.error("Resolve complaint error:", error);
        res.status(500).json({ message: error.message });
    }
};

// 📋 10. LẤY TẤT CẢ ĐƠN HÀNG (ADMIN)
// ==============================================================================
export const getAllOrders = async (req, res) => {
    try {
        // 1. Lấy thông tin Phí Sàn đang kích hoạt
        const activeFee = await ServiceFee.findOne({ isActive: true });
        const PLATFORM_FEE_PERCENT = activeFee ? activeFee.percentage : 0;

        // 2. Lấy danh sách đơn hàng từ DB
        const orders = await Order.find()
            .populate({
                path: "customer_id",
                select: "HoTen Email SoDienThoai full_name email",
                model: "bangKhachHang"
            })
            // 👇 ĐOẠN NÀY QUAN TRỌNG NHẤT 👇
            .populate({
                path: "photographer_id",
                select: "HoTen full_name TenNganHang SoTaiKhoan TenChuTaiKhoan", 
                model: "bangKhachHang"
            })
            // 👆 ĐÃ THÊM CÁC TRƯỜNG NGÂN HÀNG 👆
            .populate("service_package_id", "TenGoi name price Gia")
            .sort({ createdAt: -1 })
            .lean(); 

        // 3. Tính toán tiền nong
        const ordersWithFee = orders.map(order => {
            const baseAmount = order.service_amount || order.final_amount || 0;
            const platformFeeAmount = Math.round((baseAmount * PLATFORM_FEE_PERCENT) / 100);
            const photographerEarning = (order.final_amount || 0) - platformFeeAmount;

            return {
                ...order,
                platform_fee: {
                    amount: platformFeeAmount,
                    percentage: PLATFORM_FEE_PERCENT 
                },
                photographer_earning: photographerEarning,
                
                package_name_display: order.service_package_id?.TenGoi || order.service_package_id?.name || "Gói tùy chỉnh",
                customer_name_display: order.customer_id?.HoTen || order.customer_id?.full_name || "Khách vãng lai",
                photographer_name_display: order.photographer_id?.HoTen || order.photographer_id?.full_name || "Chưa nhận"
            };
        });

        res.json({ success: true, data: ordersWithFee });
    } catch (error) {
        console.error("Get all orders error:", error);
        res.status(500).json({ message: "Lỗi server khi lấy danh sách đơn!" });
    }
};
// ==============================================================================
// 💰 11. QUYẾT TOÁN CHO THỢ ẢNH (ADMIN)
// ==============================================================================
export const settleForPhotographer = async (req, res) => {
    try {
        const { orderId } = req.params;

        // Tìm đơn hàng
        const order = await Order.findById(orderId);
        if (!order) {
            return res.status(404).json({ message: "Không tìm thấy đơn hàng" });
        }

        // Cập nhật trạng thái quyết toán
        order.settlement_status = 'paid'; 
        order.settlement_date = new Date(); // Lưu ngày quyết toán
        
        // (Tuỳ chọn) Lưu vết người thực hiện nếu cần
        // order.settled_by = req.user.id; 

        await order.save();

        res.json({ 
            success: true, 
            message: "Đã xác nhận quyết toán cho thợ ảnh thành công!",
            data: order 
        });

    } catch (error) {
        console.error("Settle order error:", error);
        res.status(500).json({ message: "Lỗi server khi quyết toán!" });
    }
};
export default {
    createOrder,
    getMyOrders,
    getMyOrdersPhotographer,
    getOrderDetailPhotographer,
    updateOrderStatus,
    getOrderDetail,
    calculateTravelFee,
    confirmPayment,
    submitComplaint,
    submitReview,
    resolveComplaint,
    getAllOrders,
    settleForPhotographer
};