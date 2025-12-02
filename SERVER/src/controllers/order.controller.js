import Order from "../models/order.model.js";
import ServicePackage from "../models/servicePackage.model.js";
import Review from "../models/review.model.js";
import Schedule from "../models/schedule.model.js";
import Album from "../models/album.model.js";
import Admin from "../models/admin.model.js"; 
import mongoose from "mongoose"; 
import orderService from "../services/order.service.js";
import ServiceFee from "../models/servicefee.model.js"; 

// ✅ IMPORT THÔNG BÁO
import { createNotification } from "./notification.controller.js"; 
import { notifyAllAdmins } from "./notificationAdmin.controller.js"; 

// === HELPER: Lấy ID của Admin ===
const getAdminId = async () => {
    try {
        const admin = await Admin.findOne();
        return admin ? admin._id : null;
    } catch (error) {
        console.error("Error finding Admin ID:", error);
        return null;
    }
};

// ==============================================================================
// 🕒 HÀM TỰ ĐỘNG: DUYỆT ĐƠN QUÁ HẠN 3 NGÀY (AUTO-COMPLETE)
// ==============================================================================
const autoCompleteOverdueOrders = async () => {
    try {
        const threeDaysAgo = new Date();
        threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

        const overdueOrders = await Order.find({
            status: 'delivered',
            'delivery_info.delivered_at': { $lte: threeDaysAgo }
        });

        if (overdueOrders.length > 0) {
            console.log(`🔄 [System] Tìm thấy ${overdueOrders.length} đơn hàng cần tự động hoàn thành.`);
            
            for (const order of overdueOrders) {
                order.status = 'completed';
                order.completion_date = new Date();
                order.status_history.push({
                    status: 'completed',
                    changed_by: null, 
                    note: "Hệ thống tự động hoàn thành (Hết hạn 3 ngày khiếu nại)."
                });
                await order.save();

                await notifyAllAdmins({
                    title: "✅ Đơn hàng tự động hoàn thành",
                    message: `Đơn #${order.order_id} đã hết 3 ngày chờ khách xác nhận. Hệ thống đã chuyển sang hoàn tất.`,
                    type: "PAYMENT",
                    link: "/admin/payment-manage"
                });

                if (order.photographer_id) {
                    await createNotification({
                        userId: order.photographer_id,
                        title: "🎉 Đơn hàng hoàn tất (Tự động)",
                        message: `Đơn #${order.order_id} đã tự động hoàn thành sau 3 ngày. Bạn có thể nhận thanh toán.`,
                        type: "ORDER",
                        link: "/photographer/orders-manage"
                    });
                }

                await createNotification({
                    userId: order.customer_id,
                    title: "Đơn hàng đã hoàn tất",
                    message: `Đơn #${order.order_id} đã tự động hoàn tất sau 3 ngày giao ảnh. Cảm ơn bạn đã sử dụng dịch vụ.`,
                    type: "ORDER",
                    link: "/my-orders"
                });
            }
        }
    } catch (error) {
        console.error("❌ Auto complete error:", error);
    }
};

// ==============================================================================
// 📦 1. TẠO ĐƠN HÀNG MỚI (KHÔNG TẠO LỊCH TRÌNH + CHECK TRÙNG THOÁNG HƠN)
// ==============================================================================
export const createOrder = async (req, res) => {
    try {
        const customer_id = req.user.id;
        const { 
            booking_date, start_time, photographer_id, 
            service_package_id, package_name,
            selected_services 
        } = req.body;

        // Validate cơ bản
        if (!booking_date || !start_time) {
            return res.status(400).json({ message: "Vui lòng chọn ngày và giờ chụp!" });
        }

        if (!selected_services || !Array.isArray(selected_services) || selected_services.length === 0) {
            return res.status(400).json({ 
                message: "Vui lòng chọn ít nhất một dịch vụ (Option) trong gói để tiếp tục!" 
            });
        }

        const searchDate = new Date(booking_date);
        const startOfDay = new Date(searchDate); startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(searchDate); endOfDay.setHours(23, 59, 59, 999);

        // Tính thời gian kết thúc dự kiến (Mặc định 4 tiếng nếu không có estimated_duration_days)
        const [h, m] = start_time.split(':').map(Number);
        const bookingStart = new Date(searchDate);
        bookingStart.setHours(h, m, 0, 0);
        // Giả sử mỗi slot chụp khoảng 4 tiếng, hoặc lấy từ package nếu có
        const bookingEnd = new Date(bookingStart.getTime() + (4 * 60 * 60 * 1000)); 

        // 🛑 CHECK TRÙNG LỊCH VỚI CÁC ĐƠN ĐÃ CHỐT (Đã cọc tiền)
        if (photographer_id) {
            const conflictOrder = await Order.findOne({
                photographer_id: photographer_id,
                // Chỉ check các trạng thái "Đã có chủ" (đã cọc hoặc đang làm)
                // BỎ QUA 'pending_payment' -> Cho phép nhiều người cùng tạo đơn nháp
                status: { 
                    $in: ['pending', 'confirmed', 'in_progress', 'processing', 'waiting_final_payment', 'final_payment_pending', 'delivered', 'completed', 'complaint'] 
                },
                // Check trùng ngày & giờ (Ở đây check đơn giản theo ngày như yêu cầu cũ, nếu cần chính xác giờ thì dùng bookingStart/End)
                booking_date: { $gte: startOfDay, $lte: endOfDay },
                start_time: start_time 
            });

            if (conflictOrder) {
                return res.status(409).json({ 
                    message: `Rất tiếc, Nhiếp ảnh gia đã có lịch ĐÃ CHỐT vào lúc ${start_time}. Vui lòng chọn giờ khác.` 
                });
            }

            // Check lịch bận cá nhân (Busy/Personal) - Cái này phải check chặt
            const conflictSchedule = await Schedule.findOne({
                photographerId: photographer_id,
                date: { $gte: startOfDay, $lte: endOfDay },
                type: { $in: ['busy', 'personal'] }
            });
            if (conflictSchedule) {
                return res.status(409).json({ message: `Nhiếp ảnh gia báo bận vào ngày này.` });
            }
        }

        const payload = { customer_id, ...req.body };
        const newOrder = await orderService.createOrder(payload);

        // ❌ KHÔNG TẠO SCHEDULE Ở ĐÂY (Chờ cọc ở confirmPayment)

        // 🔔 Báo Khách
        await createNotification({
            userId: customer_id,
            title: "Đặt lịch thành công!",
            message: `Đơn hàng #${newOrder.order_id} đã được tạo. Vui lòng thanh toán cọc để giữ lịch.`,
            type: "ORDER",
            link: "/my-orders"
        });

        // 🔔 Báo Thợ
        if (newOrder.photographer_id) {
            await createNotification({
                userId: newOrder.photographer_id,
                title: "Bạn có đơn đặt hàng mới",
                message: `Đơn hàng #${newOrder.order_id} vừa được tạo. Chờ khách thanh toán cọc.`,
                type: "ORDER",
                link: "/photographer/orders-manage"
            });
        }

        res.status(201).json({ message: "Tạo đơn hàng thành công!", data: newOrder, payment_info: newOrder.payment_info });

    } catch (error) {
        console.error("Create order error:", error);
        res.status(error.status || 500).json({ message: error.message || "Lỗi server!" });
    }
};

// ==============================================================================
// 💰 6. XÁC NHẬN THANH TOÁN (TẠO LỊCH TRÌNH + CHECK RACE CONDITION)
// ==============================================================================
export const confirmPayment = async (req, res) => {
    try {
        const { orderId } = req.params;
        const { amount, transaction_code } = req.body;

        if (!req.file) return res.status(400).json({ message: "Thiếu ảnh chuyển khoản!" });
        const fileUrl = `${req.protocol}://${req.get('host')}/uploads/orders/${req.file.filename}`;

        // Populate để lấy tên gói và tên khách cho Schedule
        const order = await Order.findById(orderId)
            .populate('service_package_id', 'TenGoi')
            .populate('customer_id', 'HoTen');
            
        if (!order) return res.status(404).json({ message: "Đơn hàng không tồn tại" });

        // --- XỬ LÝ CỌC (GIAI ĐOẠN 1) ---
        if (order.status === 'pending_payment') {
            
            // 🛑 [QUAN TRỌNG] CHECK LẠI LẦN CUỐI XEM CÓ AI VỪA CỌC TRƯỚC ĐÓ KHÔNG (Race Condition)
            if (order.photographer_id) {
                const conflictOrder = await Order.findOne({
                    _id: { $ne: order._id }, // Không tính chính nó
                    photographer_id: order.photographer_id,
                    // Các trạng thái "Đã có chủ"
                    status: { $in: ['pending', 'confirmed', 'in_progress', 'processing', 'waiting_final_payment', 'final_payment_pending', 'delivered', 'completed', 'complaint'] },
                    // Check trùng ngày và giờ
                    booking_date: order.booking_date, 
                    start_time: order.start_time
                });

                if (conflictOrder) {
                    return res.status(409).json({ 
                        message: "Rất tiếc, khung giờ này vừa bị khách khác đặt cọc trước! Vui lòng liên hệ Admin để hoàn tiền hoặc đổi giờ." 
                    });
                }
            }

            // Update thông tin thanh toán
            order.payment_info.transfer_image = fileUrl;
            order.payment_info.transfer_date = new Date();
            order.payment_info.transaction_code = transaction_code;
            order.payment_info.deposit_amount = Number(amount);
            order.status = 'pending'; // Chuyển sang chờ duyệt
            
            order.status_history.push({ status: 'pending', changed_by: req.user.id, note: `Khách cọc: ${transaction_code}` });

            // ✅ CHỈ TẠO 1 LỊCH DUY NHẤT CHO PHOTOGRAPHER
            if (order.photographer_id) {
                const existingSchedule = await Schedule.findOne({ orderId: order._id });
                
                if (!existingSchedule) {
                    await new Schedule({
                        photographerId: order.photographer_id, // Chỉ ID thợ
                        title: `Chụp khách: ${order.customer_id?.HoTen || 'Khách'} (${order.start_time})`,
                        date: order.booking_date,
                        type: 'order',
                        orderId: order._id,
                        description: `Mã đơn: ${order.order_id} - Gói: ${order.service_package_id?.TenGoi}`
                    }).save();
                    console.log(`📅 Đã tạo lịch trình cho Photographer đơn hàng #${order.order_id}`);
                }
            }

        } else {
            // --- XỬ LÝ THANH TOÁN NỐT (GIAI ĐOẠN 2) ---
            order.payment_info.remaining_transfer_image = fileUrl;
            order.payment_info.remaining_status = 'pending';
            order.payment_info.remaining_paid_at = new Date();
            order.status = 'final_payment_pending';
            order.status_history.push({ status: 'final_payment_pending', changed_by: req.user.id, note: `Khách thanh toán: ${transaction_code}` });
        }

        await order.save();

        // 🔔 Thông báo cho khách
        await createNotification({
            userId: order.customer_id._id, // Lưu ý: customer_id là object do populate
            title: "Đã gửi xác nhận thanh toán",
            message: `Thanh toán đơn #${order.order_id} đang chờ duyệt.`,
            type: "PAYMENT",
            link: "/my-orders"
        });

        // 🔔 Thông báo cho Admin
        await notifyAllAdmins({
            title: "💰 Yêu cầu duyệt thanh toán",
            message: `Đơn #${order.order_id} vừa gửi thanh toán ${Number(amount).toLocaleString()}đ.`,
            type: "PAYMENT",
            link: "/admin/payment-manage"
        });

        res.json({ success: true, message: "Đã gửi xác nhận.", data: { status: order.status } });

    } catch (error) {
        console.error("Confirm payment error:", error);
        res.status(500).json({ message: error.message });
    }
};

// ==============================================================================
// 📋 CÁC HÀM KHÁC (GIỮ NGUYÊN ĐỂ FILE HOÀN CHỈNH)
// ==============================================================================

export const getMyOrders = async (req, res) => {
    try {
        await autoCompleteOverdueOrders();
        const userId = req.user._id || req.user.id;
        const orders = await Order.find({ customer_id: userId })
            .populate({ path: "service_package_id", select: "TenGoi AnhBia Gia LoaiGoi" })
            .populate({ path: "photographer_id", select: "HoTen", model: "bangKhachHang" })
            .sort({ createdAt: -1 });
        const ordersWithData = await Promise.all(orders.map(async (order) => {
            const orderObj = order.toObject();
            const album = await Album.findOne({ order_id: order._id }).select('_id status');
            const reviewData = await Review.findOne({ OrderId: order._id });
            if (reviewData) {
                orderObj.review = {
                    is_reviewed: true, rating: reviewData.Rating, comment: reviewData.Comment,
                    images: reviewData.Images, is_edited: reviewData.is_edited, _id: reviewData._id 
                };
            }
            return { ...orderObj, has_album: !!album, album_id: album?._id };
        }));
        res.status(200).json({ success: true, data: ordersWithData });
    } catch (error) {
        res.status(500).json({ message: "Lỗi server!" });
    }
};

export const getMyOrdersPhotographer = async (req, res) => {
    try {
        await autoCompleteOverdueOrders();
        const userId = req.user._id || req.user.id;
        const orders = await Order.find({ photographer_id: userId })
            .populate({ path: "service_package_id", select: "TenGoi AnhBia Gia" })
            .populate({ path: "customer_id", select: "HoTen Email SoDienThoai Avatar", model: "bangKhachHang" })
            .sort({ createdAt: -1 });
        const ordersWithAlbumStatus = await Promise.all(orders.map(async (order) => {
            const album = await Album.findOne({ order_id: order._id }).select('_id status');
            return { ...order.toObject(), has_album: !!album, album_id: album?._id };
        }));
        res.status(200).json({ success: true, data: ordersWithAlbumStatus });
    } catch (error) {
        res.status(500).json({ message: "Lỗi server!" });
    }
};

export const getOrderDetailPhotographer = async (req, res) => {
    try {
        const { orderId } = req.params;
        let query = mongoose.Types.ObjectId.isValid(orderId) ? { $or: [{ order_id: orderId }, { _id: orderId }] } : { order_id: orderId };
        const order = await Order.findOne(query).populate({ path: "service_package_id", select: "TenGoi AnhBia Gia MoTa" }).populate({ path: "customer_id", select: "HoTen Email SoDienThoai Avatar", model: "bangKhachHang" });
        if (!order) return res.status(404).json({ message: "Không tìm thấy đơn hàng" });
        res.json({ data: order });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const updateOrderStatus = async (req, res) => {
    try {
        const { status, note } = req.body;
        const userId = req.user?.id || null;
        const updated = await orderService.updateOrderStatus(req.params.orderId, status, userId, note);

        if (updated) {
            let notiTitle = "", notiMessage = "", notiType = "ORDER", notiLink = "/my-orders";
            if (status === 'confirmed') {
                notiTitle = "Đơn hàng đã được duyệt!";
                notiMessage = `Đơn #${updated.order_id} đã được xác nhận.`;
            } else if (status === 'processing') {
                notiTitle = "Đang xử lý ảnh";
                notiMessage = `Buổi chụp #${updated.order_id} đã xong. Đang hậu kỳ.`;
                notiType = "ALBUM";
            } else if (status === 'cancelled') {
                notiTitle = "Đơn hàng bị hủy";
                notiMessage = `Đơn #${updated.order_id} đã hủy. Lý do: ${note}`;
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
        res.json({ message: "Cập nhật thành công", data: updated });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const getOrderDetail = async (req, res) => {
    try {
        const { orderId } = req.params;
        let query = mongoose.Types.ObjectId.isValid(orderId) ? { $or: [{ order_id: orderId }, { _id: orderId }] } : { order_id: orderId };
        const order = await Order.findOne(query)
            .populate({ path: "service_package_id", select: "TenGoi AnhBia Gia MoTa" })
            .populate({ path: "photographer_id", select: "HoTen Avatar", model: "bangKhachHang" })
            .populate({ path: "customer_id", select: "HoTen Email SoDienThoai Avatar", model: "bangKhachHang" });
        if (!order) return res.status(404).json({ message: "Không tìm thấy đơn hàng" });
        res.json({ data: order });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const calculateTravelFee = async (req, res) => {
    try {
        const { packageId, lat, lng } = req.body;
        if (!packageId) return res.status(400).json({ message: "Thiếu packageId" });
        const result = await orderService.calculateTravelFeePreview(packageId, { lat, lng });
        res.json({ success: true, data: result });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const submitComplaint = async (req, res) => {
    try {
        const { orderId } = req.params;
        const { reason } = req.body;
        const userId = req.user.id;
        const result = await orderService.submitComplaint(orderId, reason, userId);
        await notifyAllAdmins({
            title: "⚠️ Có khiếu nại mới!",
            message: `Đơn #${orderId} có khiếu nại: "${reason}".`,
            type: "COMPLAINT",
            link: "/admin/complaint-manage"
        });
        res.json({ success: true, message: "Đã gửi khiếu nại", data: result });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

export const submitReview = async (req, res) => {
    try {
        const { orderId } = req.params;
        const { rating, comment } = req.body;
        const userId = req.user.id;
        const result = await orderService.submitReview(orderId, rating, comment, userId);
        res.json({ success: true, message: "Đánh giá thành công!", data: result });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

export const resolveComplaint = async (req, res) => {
    try {
        const { orderId } = req.params;
        const { status, response } = req.body;
        const adminId = req.user.id;
        const result = await orderService.resolveComplaint(orderId, status, response, adminId);
        res.json({ success: true, message: "Đã xử lý khiếu nại", data: result });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const getAllOrders = async (req, res) => {
    try {
        await autoCompleteOverdueOrders();
        const activeFee = await ServiceFee.findOne({ isActive: true });
        const PLATFORM_FEE_PERCENT = activeFee ? activeFee.percentage : 0;
        const orders = await Order.find()
            .populate({ path: "customer_id", select: "HoTen Email full_name email", model: "bangKhachHang" })
            .populate({ path: "photographer_id", select: "HoTen full_name TenNganHang SoTaiKhoan", model: "bangKhachHang" })
            .populate("service_package_id", "TenGoi price Gia")
            .sort({ createdAt: -1 }).lean(); 

        const ordersWithFee = orders.map(order => {
            const baseAmount = order.service_amount || order.final_amount || 0;
            const platformFeeAmount = Math.round((baseAmount * PLATFORM_FEE_PERCENT) / 100);
            const photographerEarning = (order.final_amount || 0) - platformFeeAmount;
            return {
                ...order,
                photographer_earning: photographerEarning,
                platform_fee: { amount: platformFeeAmount },
                package_name_display: order.service_package_id?.TenGoi,
                customer_name_display: order.customer_id?.HoTen,
                photographer_name_display: order.photographer_id?.HoTen
            };
        });
        res.json({ success: true, data: ordersWithFee });
    } catch (error) {
        res.status(500).json({ message: "Lỗi lấy danh sách đơn" });
    }
};

export const settleForPhotographer = async (req, res) => {
    try {
        const { orderId } = req.params;
        const order = await Order.findById(orderId);
        if (!order) return res.status(404).json({ message: "Không tìm thấy đơn hàng" });

        if (order.status !== 'completed') {
            return res.status(400).json({ message: `❌ Không thể quyết toán! Đơn hàng đang '${order.status}'.` });
        }

        if (order.complaint && order.complaint.is_complained && order.complaint.status === 'pending') {
            return res.status(400).json({ message: "❌ Đơn hàng đang có khiếu nại." });
        }

        order.settlement_status = 'paid'; 
        order.settlement_date = new Date(); 
        await order.save();

        if (order.photographer_id) {
            await createNotification({
                userId: order.photographer_id,
                title: "💰 Bạn đã được thanh toán",
                message: `Admin đã quyết toán thù lao cho đơn #${order.order_id}.`,
                type: "PAYMENT",
                link: "/my-income"
            });
        }

        res.json({ success: true, message: "Đã quyết toán thành công!", data: order });

    } catch (error) {
        res.status(500).json({ message: "Lỗi server khi quyết toán!" });
    }
};

export const userConfirmCompletion = async (req, res) => {
    try {
        const { orderId } = req.params;
        const userId = req.user.id || req.user._id;

        const order = await Order.findById(orderId);
        if (!order) return res.status(404).json({ message: "Không tìm thấy đơn hàng" });

        if (order.customer_id.toString() !== userId.toString()) {
            return res.status(403).json({ message: "Bạn không có quyền thao tác đơn này" });
        }

        if (order.status !== 'delivered') {
            return res.status(400).json({ message: "Đơn hàng chưa giao hoặc đã hoàn thành." });
        }

        order.status = 'completed';
        order.completion_date = new Date();
        order.status_history.push({
            status: 'completed',
            changed_by: userId,
            note: "Khách hàng xác nhận hoàn thành (Hài lòng)."
        });

        await order.save();

        await notifyAllAdmins({
            title: "✅ Khách đã xác nhận hài lòng",
            message: `Đơn hàng #${order.order_id} đã hoàn tất. Bạn có thể quyết toán cho thợ ngay.`,
            type: "PAYMENT",
            link: "/admin/payment-manage"
        });

        if (order.photographer_id) {
            await createNotification({
                userId: order.photographer_id,
                title: "🎉 Đơn hàng hoàn tất!",
                message: `Khách đã hài lòng với đơn #${order.order_id}. Số dư sẽ sớm được cộng.`,
                type: "ORDER",
                link: "/photographer/orders-manage"
            });
        }

        res.json({ success: true, message: "Đã xác nhận hoàn thành đơn hàng!" });

    } catch (error) {
        console.error("User Confirm Error:", error);
        res.status(500).json({ message: "Lỗi server" });
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
    settleForPhotographer,
    userConfirmCompletion
};