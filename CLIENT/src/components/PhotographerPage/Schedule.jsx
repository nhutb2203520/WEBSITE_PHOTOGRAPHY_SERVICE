import React, { useState, useEffect } from 'react';
import { 
  ChevronLeft, ChevronRight, Plus, X, 
  Calendar as CalendarIcon, Briefcase, User, Bell, 
  DollarSign, MapPin, AlertTriangle, Clock
} from 'lucide-react';
import './Schedule.css';
import Header from '../../components/Header/Header';
import Footer from '../../components/Footer/Footer';
import Sidebar from '../../components/Sidebar/Sidebar'; 
import scheduleApi from '../../apis/ScheduleService';
import orderApi from '../../apis/OrderService';
import { toast } from 'react-toastify';

export default function Schedule() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Modal States
  const [showAddModal, setShowAddModal] = useState(false);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);

  // Form State
  const [newEvent, setNewEvent] = useState({
    title: '',
    date: new Date().toISOString().split('T')[0],
    description: '',
    type: 'personal',
    isRemind: false 
  });

  useEffect(() => {
    fetchSchedule();
  }, []);

  const fetchSchedule = async () => {
    try {
      setLoading(true);
      const res = await scheduleApi.getMySchedule();
      // Xử lý dữ liệu an toàn
      const scheduleData = Array.isArray(res.data) ? res.data : (res.data?.data || []);
      setEvents(scheduleData);
    } catch (error) {
      console.error("Lỗi fetch lịch:", error);
    } finally {
      setLoading(false);
    }
  };

  // --- LOGIC LỊCH ---
  const getDaysInMonth = (date) => new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  const getFirstDayOfMonth = (date) => new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  
  const handlePrevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  const handleNextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  
  // So sánh ngày (Fix Timezone bằng cách so sánh chuỗi YYYY-MM-DD)
  const isSameDay = (dateStr, dateObj) => {
    if (!dateStr) return false;
    const d1 = new Date(dateStr);
    // So sánh theo ngày địa phương
    return d1.getDate() === dateObj.getDate() &&
           d1.getMonth() === dateObj.getMonth() &&
           d1.getFullYear() === dateObj.getFullYear();
  };
  
  const getEventsForDay = (day) => {
    const checkDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    return events.filter(event => isSameDay(event.date, checkDate));
  };

  // --- EVENTS ---
  const handleDayClick = (day) => {
    const selectedDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    // Fix lệch múi giờ khi set vào input date
    const offset = selectedDate.getTimezoneOffset();
    const localDate = new Date(selectedDate.getTime() - (offset * 60 * 1000));
    const dateString = localDate.toISOString().split('T')[0];

    setNewEvent(prev => ({ ...prev, date: dateString }));
    setShowAddModal(true);
  };

  const handleEventClick = async (e, event) => {
    e.stopPropagation();
    
    if (event.type === 'order') {
        if (!event.orderId) return toast.error("Không tìm thấy thông tin đơn hàng");
        
        // Kiểm tra nếu orderId đã được populate (là object) hay chưa (là string)
        const orderId = event.orderId._id || event.orderId;
        
        if (typeof event.orderId === 'object') {
             setSelectedOrder(event.orderId); // Đã có data sẵn từ populate
             setShowOrderModal(true);
        } else {
            try {
                const res = await orderApi.getOrderDetail(orderId);
                setSelectedOrder(res.data); 
                setShowOrderModal(true);
            } catch (err) {
                toast.error("Lỗi tải đơn hàng.");
            }
        }
    } else {
        if (window.confirm(`Xóa lịch trình: "${event.title}"?`)) {
            try {
                await scheduleApi.deleteSchedule(event._id);
                toast.success("Đã xóa");
                fetchSchedule(); // Load lại ngay
            } catch (error) {
                toast.error("Lỗi xóa lịch");
            }
        }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newEvent.title.trim()) return toast.warning("Vui lòng nhập tiêu đề");

    try {
      await scheduleApi.addPersonalSchedule(newEvent);
      toast.success("Thêm lịch thành công!");
      setShowAddModal(false);
      
      // Load lại lịch ngay lập tức
      await fetchSchedule(); 
      
      // Reset form
      const today = new Date();
      const offset = today.getTimezoneOffset();
      const localToday = new Date(today.getTime() - (offset * 60 * 1000)).toISOString().split('T')[0];
      
      setNewEvent({ 
          title: '', 
          date: localToday, 
          description: '', 
          type: 'personal', 
          isRemind: false 
      });
    } catch (error) {
      console.error(error);
      toast.error("Lỗi khi thêm lịch");
    }
  };

  const renderCalendar = () => {
    const daysInMonth = getDaysInMonth(currentDate);
    const firstDay = getFirstDayOfMonth(currentDate);
    const days = [];

    for (let i = 0; i < firstDay; i++) days.push(<div key={`empty-${i}`} className="calendar-day empty"></div>);

    for (let i = 1; i <= daysInMonth; i++) {
      const dayEvents = getEventsForDay(i);
      const isToday = isSameDay(new Date(), new Date(currentDate.getFullYear(), currentDate.getMonth(), i));

      days.push(
        <div 
            key={i} 
            className={`calendar-day ${isToday ? 'today' : ''}`}
            onClick={() => handleDayClick(i)}
        >
          <div className="day-header">
             <span className="day-number">{i}</span>
             {dayEvents.length > 0 && <span className="event-dot-indicator"></span>}
          </div>
          
          <div className="day-events-list">
            {dayEvents.map(ev => (
              <div 
                key={ev._id} 
                className={`event-badge ${ev.type}`} 
                title={ev.description}
                onClick={(e) => handleEventClick(e, ev)}
              >
                {ev.type === 'order' ? <Briefcase size={10} strokeWidth={2.5}/> : <User size={10} strokeWidth={2.5}/>}
                <span className="event-title">
                    {/* Nếu là order và đã populate thì hiện mã đơn, không thì hiện title */}
                    {ev.type === 'order' && ev.orderId?.order_id 
                        ? ev.orderId.order_id 
                        : ev.title
                    }
                </span>
                {ev.isRemind && <Bell size={9} className="remind-icon"/>}
              </div>
            ))}
          </div>
        </div>
      );
    }
    return days;
  };

  const monthNames = ["Tháng 1", "Tháng 2", "Tháng 3", "Tháng 4", "Tháng 5", "Tháng 6", "Tháng 7", "Tháng 8", "Tháng 9", "Tháng 10", "Tháng 11", "Tháng 12"];

  return (
    <>
      <Header /><Sidebar />
      <div className="schedule-page">
        <div className="container">
          <div className="schedule-header">
            <div className="header-title">
              <h1>Lịch trình của tôi</h1>
              <p>Quản lý lịch chụp và công việc cá nhân</p>
            </div>
            <button className="btn-add-event" onClick={() => setShowAddModal(true)}>
              <Plus size={20} /> Thêm lịch trình
            </button>
          </div>

          <div className="calendar-container">
            <div className="calendar-controls">
              <button onClick={handlePrevMonth}><ChevronLeft /></button>
              <h2>{monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}</h2>
              <button onClick={handleNextMonth}><ChevronRight /></button>
            </div>
            <div className="calendar-grid-header">
              <div>CN</div><div>T2</div><div>T3</div><div>T4</div><div>T5</div><div>T6</div><div>T7</div>
            </div>
            <div className="calendar-grid-body">
              {loading ? <div className="loading-text">Đang tải lịch...</div> : renderCalendar()}
            </div>
          </div>
        </div>
      </div>

      {/* MODAL THÊM LỊCH */}
      {showAddModal && (
        <div className="modal-overlay-custom" onClick={() => setShowAddModal(false)}>
          <div className="modal-content-custom schedule-modal-box" onClick={e => e.stopPropagation()}>
            <div className="modal-header-custom">
              <div className="modal-title-group">
                 <div className="icon-box"><CalendarIcon size={24} color="#3b82f6"/></div>
                 <h3>Thêm lịch trình mới</h3>
              </div>
              <button className="btn-close-custom" onClick={() => setShowAddModal(false)}><X size={24}/></button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body-custom">
                  <div className="form-row">
                      <div className="form-group col-12">
                        <label>Tiêu đề <span className="text-red">*</span></label>
                        <input type="text" required value={newEvent.title} onChange={e => setNewEvent({...newEvent, title: e.target.value})} placeholder="VD: Chụp ảnh cưới..." className="input-lg"/>
                      </div>
                  </div>
                  <div className="form-row two-col">
                      <div className="form-group">
                        <label>Ngày <span className="text-red">*</span></label>
                        <input type="date" required value={newEvent.date} onChange={e => setNewEvent({...newEvent, date: e.target.value})} />
                      </div>
                      <div className="form-group">
                        <label>Loại lịch</label>
                        <select value={newEvent.type} onChange={e => setNewEvent({...newEvent, type: e.target.value})}>
                          <option value="personal">Cá nhân / Khác</option>
                          <option value="busy">Báo bận</option>
                        </select>
                      </div>
                  </div>
                  <div className="form-group checkbox-group">
                     <label className="switch">
                        <input type="checkbox" checked={newEvent.isRemind} onChange={e => setNewEvent({...newEvent, isRemind: e.target.checked})}/>
                        <span className="slider round"></span>
                     </label>
                     <span className="checkbox-label">Gửi thông báo nhắc nhở</span>
                  </div>
                  <div className="form-group">
                    <label>Ghi chú</label>
                    <textarea value={newEvent.description} onChange={e => setNewEvent({...newEvent, description: e.target.value})} rows="3" placeholder="Chi tiết..."></textarea>
                  </div>
              </div>
              <div className="modal-footer-custom">
                <button type="button" className="btn-cancel-custom" onClick={() => setShowAddModal(false)}>Hủy</button>
                <button type="submit" className="btn-submit-custom">Lưu</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL CHI TIẾT ĐƠN HÀNG */}
      {showOrderModal && selectedOrder && (
        <div className="modal-overlay-custom" onClick={() => setShowOrderModal(false)}>
          <div className="modal-content-custom order-detail-modal-box" onClick={e => e.stopPropagation()}>
             <div className="modal-header-custom order-header-bg">
                <h3>Đơn hàng: {selectedOrder.order_id}</h3>
                <button className="btn-close-white" onClick={() => setShowOrderModal(false)}><X size={24}/></button>
             </div>
             <div className="modal-body-custom">
                <div className="info-card">
                    <div className="detail-row"><span className="label"><User size={16}/> Khách hàng</span><span className="value">{selectedOrder.customer_id?.HoTen || 'N/A'}</span></div>
                    <div className="detail-row"><span className="label"><Briefcase size={16}/> Dịch vụ</span><span className="value">{selectedOrder.service_package_id?.TenGoi || 'N/A'}</span></div>
                    <div className="detail-row"><span className="label"><Clock size={16}/> Ngày chụp</span><span className="value">{new Date(selectedOrder.booking_date).toLocaleDateString('vi-VN')}</span></div>
                    <div className="detail-row"><span className="label"><MapPin size={16}/> Địa điểm</span><span className="value">{selectedOrder.location || 'N/A'}</span></div>
                    <div className="detail-row highlight-row"><span className="label"><DollarSign size={16}/> Tổng tiền</span><span className="value price">{Number(selectedOrder.final_amount).toLocaleString()} đ</span></div>
                    <div className="detail-row"><span className="label"><AlertTriangle size={16}/> Trạng thái</span><span className={`value status-tag ${selectedOrder.status}`}>{selectedOrder.status}</span></div>
                </div>
             </div>
             <div className="modal-footer-custom">
                <button className="btn-cancel-custom" onClick={() => setShowOrderModal(false)}>Đóng</button>
                <button className="btn-submit-custom" onClick={() => window.location.href = `/photographer/orders`}>Quản lý đơn</button>
             </div>
          </div>
        </div>
      )}

      <Footer />
    </>
  );
}