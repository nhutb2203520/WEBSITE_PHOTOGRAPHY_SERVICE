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
// 📦 1. TẠO ĐƠN HÀNG MỚI
// ==============================================================================
export const createOrder = async (req, res) => {
    try {
        const customer_id = req.user.id;
        const {
            booking_date, start_time, photographer_id,
            service_package_id, package_name,
            selected_services
        } = req.body;

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

        // Check trùng lịch
        if (photographer_id) {
            const conflictOrder = await Order.findOne({
                photographer_id: photographer_id,
                status: {
                    $in: ['pending', 'confirmed', 'in_progress', 'processing', 'waiting_final_payment', 'final_payment_pending', 'delivered', 'completed', 'complaint']
                },
                booking_date: { $gte: startOfDay, $lte: endOfDay },
                start_time: start_time
            });

            if (conflictOrder) {
                return res.status(409).json({
                    message: `Rất tiếc, Nhiếp ảnh gia đã có lịch ĐÃ CHỐT vào lúc ${start_time}. Vui lòng chọn giờ khác.`
                });
            }

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

        await createNotification({
            userId: customer_id,
            title: "Đặt lịch thành công!",
            message: `Đơn hàng #${newOrder.order_id} đã được tạo. Vui lòng thanh toán cọc để giữ lịch.`,
            type: "ORDER",
            link: "/my-orders"
        });

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
// 💰 2. XÁC NHẬN THANH TOÁN (CỌC HOẶC FULL)
// ==============================================================================
export const confirmPayment = async (req, res) => {
    try {
        const { orderId } = req.params;
        const { amount, transaction_code } = req.body;

        if (!req.file) return res.status(400).json({ message: "Thiếu ảnh chuyển khoản!" });
        const fileUrl = `${req.protocol}://${req.get('host')}/uploads/orders/${req.file.filename}`;

        const order = await Order.findById(orderId)
            .populate('service_package_id', 'TenGoi')
            .populate('customer_id', 'HoTen');

        if (!order) return res.status(404).json({ message: "Đơn hàng không tồn tại" });

        if (order.status === 'pending_payment') {
            if (order.photographer_id) {
                // Check lại trùng lịch một lần nữa cho chắc
                const conflictOrder = await Order.findOne({
                    _id: { $ne: order._id },
                    photographer_id: order.photographer_id,
                    status: { $in: ['pending', 'confirmed', 'in_progress', 'processing', 'waiting_final_payment', 'final_payment_pending', 'delivered', 'completed', 'complaint'] },
                    booking_date: order.booking_date,
                    start_time: order.start_time
                });

                if (conflictOrder) {
                    return res.status(409).json({
                        message: "Rất tiếc, khung giờ này vừa bị khách khác đặt cọc trước! Vui lòng liên hệ Admin để hoàn tiền hoặc đổi giờ."
                    });
                }
            }

            order.payment_info.transfer_image = fileUrl;
            order.payment_info.transfer_date = new Date();
            order.payment_info.transaction_code = transaction_code;
            order.payment_info.deposit_amount = Number(amount);
            order.status = 'pending';
            order.status_history.push({ status: 'pending', changed_by: req.user.id, note: `Khách cọc: ${transaction_code}` });

            // 🔥 QUAN TRỌNG: TẠO LẠI LỊCH NẾU CHƯA CÓ
            // Nếu trước đó Admin từ chối, Schedule đã bị xóa.
            // Đoạn này sẽ tự động tạo lại Schedule mới cho thợ.
            if (order.photographer_id) {
                const existingSchedule = await Schedule.findOne({ orderId: order._id });
                if (!existingSchedule) {
                    await new Schedule({
                        photographerId: order.photographer_id,
                        title: `Chụp khách: ${order.customer_id?.HoTen || 'Khách'} (${order.start_time})`,
                        date: order.booking_date,
                        type: 'order',
                        orderId: order._id,
                        description: `Mã đơn: ${order.order_id} - Gói: ${order.service_package_id?.TenGoi}`
                    }).save();
                }
            }

        } else {
            order.payment_info.remaining_transfer_image = fileUrl;
            order.payment_info.remaining_status = 'pending';
            order.payment_info.remaining_paid_at = new Date();
            order.status = 'final_payment_pending';
            order.status_history.push({ status: 'final_payment_pending', changed_by: req.user.id, note: `Khách thanh toán: ${transaction_code}` });
        }

        await order.save();

        await createNotification({
            userId: order.customer_id._id,
            title: "Đã gửi xác nhận thanh toán",
            message: `Thanh toán đơn #${order.order_id} đang chờ duyệt.`,
            type: "PAYMENT",
            link: "/my-orders"
        });

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
// 📋 3. LẤY DANH SÁCH ĐƠN HÀNG (QUAN TRỌNG: TÍNH TOÁN PHÍ SÀN)
// ==============================================================================
export const getAllOrders = async (req, res) => {
    try {
        await autoCompleteOverdueOrders();

        // 1. Lấy % Phí sàn đang kích hoạt
        const activeFee = await ServiceFee.findOne({ isActive: true });
        const CURRENT_FEE_PERCENT = activeFee ? activeFee.percentage : 0;

        // 2. Lấy dữ liệu
        const orders = await Order.find()
            .populate({ path: "customer_id", select: "HoTen Email full_name email", model: "bangKhachHang" })
            .populate({ path: "photographer_id", select: "HoTen full_name TenNganHang SoTaiKhoan", model: "bangKhachHang" })
            .populate("service_package_id", "TenGoi price Gia")
            .sort({ createdAt: -1 })
            .lean();

        // 3. Chuẩn hóa dữ liệu trả về
        const ordersWithFee = orders.map(order => {
            const isCancelled = order.status === 'cancelled';
            const isPaid = order.settlement_status === 'paid';

            // --- A. XÁC ĐỊNH DOANH THU THỰC TẾ (BASE AMOUNT) ---
            let actualRevenue = 0;
            if (isCancelled) {
                // Đơn hủy: Chỉ tính trên Tiền Cọc
                actualRevenue = order.deposit_amount > 0 ? order.deposit_amount : (order.deposit_required || 0);
            } else {
                // Đơn thường: Tính trên Tổng Tiền (Final Amount)
                actualRevenue = order.final_amount || 0;
            }

            // --- B. TÍNH TOÁN PHÍ SÀN & THỰC NHẬN ---
            let feeAmount = 0;
            let feePercent = 0;
            let earning = 0;

            if (isPaid && order.platform_fee && order.photographer_earning) {
                // TRƯỜNG HỢP 1: Đã quyết toán (Lấy dữ liệu lịch sử từ DB để đảm bảo không đổi)
                feeAmount = order.platform_fee.amount || 0;
                feePercent = order.platform_fee.percentage || 0;
                earning = order.photographer_earning;
            } else {
                // TRƯỜNG HỢP 2: Chưa quyết toán (Tính toán lại theo logic hiện tại để hiển thị đúng)
                // Áp dụng cho cả đơn HỦY và đơn THƯỜNG
                feePercent = CURRENT_FEE_PERCENT; 
                feeAmount = Math.round((actualRevenue * feePercent) / 100);
                earning = actualRevenue - feeAmount;
            }

            return {
                ...order,
                // Ghi đè các trường tính toán để Frontend chỉ việc hiển thị
                photographer_earning: earning,
                platform_fee: {
                    amount: feeAmount,
                    percentage: feePercent
                },
                // Các trường hiển thị tên
                package_name_display: order.service_package_id?.TenGoi,
                customer_name_display: order.customer_id?.HoTen,
                photographer_name_display: order.photographer_id?.HoTen
            };
        });

        res.json({ success: true, data: ordersWithFee });
    } catch (error) {
        console.error("Get All Orders Error:", error);
        res.status(500).json({ message: "Lỗi lấy danh sách đơn" });
    }
};

// ==============================================================================
// 💰 4. QUYẾT TOÁN CHO THỢ (LƯU CỨNG SỐ LIỆU ĐÚNG VÀO DB)
// ==============================================================================
export const settleForPhotographer = async (req, res) => {
    try {
        const { orderId } = req.params;
        const order = await Order.findById(orderId);
        if (!order) return res.status(404).json({ message: "Không tìm thấy đơn hàng" });

        // Cho phép quyết toán cả đơn Hoàn thành và Đơn Hủy
        if (order.status !== 'completed' && order.status !== 'cancelled') {
            return res.status(400).json({ message: `❌ Không thể quyết toán! Đơn hàng đang '${order.status}'.` });
        }

        if (order.complaint && order.complaint.is_complained && order.complaint.status === 'pending') {
            return res.status(400).json({ message: "❌ Đơn hàng đang có khiếu nại." });
        }

        // 1. Lấy % phí hiện tại
        const activeFee = await ServiceFee.findOne({ isActive: true });
        const feePercent = activeFee ? activeFee.percentage : 0;

        // 2. Xác định doanh thu để tính phí
        let actualRevenue = 0;
        if (order.status === 'cancelled') {
             // Nếu hủy: Tính trên cọc
             actualRevenue = order.deposit_amount > 0 ? order.deposit_amount : (order.deposit_required || 0);
        } else {
             // Nếu xong: Tính trên tổng
             actualRevenue = order.final_amount || 0;
        }

        // 3. Tính toán con số cuối cùng
        const feeAmount = Math.round((actualRevenue * feePercent) / 100);
        const earning = actualRevenue - feeAmount;

        // 4. Cập nhật vào DB
        order.settlement_status = 'paid';
        order.settlement_date = new Date();
        
        // Lưu cứng phí và thực nhận vào DB
        order.platform_fee = {
            amount: feeAmount,
            percentage: feePercent
        };
        order.photographer_earning = earning; 

        await order.save();

        // 5. Thông báo
        if (order.photographer_id) {
            await createNotification({
                userId: order.photographer_id,
                title: "💰 Bạn đã được thanh toán",
                message: `Admin đã quyết toán thù lao cho đơn #${order.order_id}. Số tiền: ${earning.toLocaleString()}đ`,
                type: "PAYMENT",
                link: "/my-income"
            });
        }

        res.json({ success: true, message: "Đã quyết toán thành công!", data: order });

    } catch (error) {
        console.error("Settle Error:", error);
        res.status(500).json({ message: "Lỗi server khi quyết toán!" });
    }
};

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