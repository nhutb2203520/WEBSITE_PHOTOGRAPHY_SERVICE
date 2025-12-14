import { lazy } from 'react';

// ⚠️ QUAN TRỌNG: Import trực tiếp các component quan trọng hoặc Admin để tránh lỗi lazy load bất ngờ
import ComplaintManager from '../admin/ComplaintManager/ComplaintManager';

// Các component khác dùng lazy load để tối ưu hiệu năng trang web
const routes = [
  // =================================================================
  // 🏠 HOME & AUTHENTICATION
  // =================================================================
  {
    path: '/',
    component: lazy(() => import('../components/HomePageCustomer/HomePageCustomer'))
  },
  {
    path: '/signup',
    component: lazy(() => import('../components/Account/SignUp'))
  },
  {
    path: '/signin',
    component: lazy(() => import('../components/Account/SignIn'))
  },
  {
    path: '/forgot-password',
    component: lazy(() => import('../components/Account/ForgotPass'))
  },
  {
    path: '/reset-password/:token',
    component: lazy(() => import('../components/Account/ResetPassword'))
  },
  {
    path: '/my-account',
    component: lazy(() => import('../components/Account/MyAccount'))
  },
  {
    path: '/notifications',
    component: lazy(() => import('../components/Notification/NotificationPage'))
  },
  {
    path: '/messages',
    component: lazy(() => import('../components/ChatMessage/UserChatPage'))
  },
  {
    path: '/favorites',
    component: lazy(() => import('../components/Favorites/FavoritesPage'))
  },

  // =================================================================
  // 📸 PHOTOGRAPHER (PRIVATE AREA) - Đặt TRƯỚC các route public
  // =================================================================
  {
    path: '/photographer/orders-manage',
    component: lazy(() => import('../components/PhotographerPage/PhotographerOrderManagement'))
  },
  {
    path: '/photographer/albums-management',
    component: lazy(() => import('../components/PhotographerPage/AlbumsManage'))
  },
  // ✅ Route cụ thể phải nằm trên route động (:id)
  {
    path: '/photographer/service-packages',
    component: lazy(() => import('../components/PhotographerPage/ServicePackageManage'))
  },
  {
    path: '/photographer/schedule',
    component: lazy(() => import('../components/PhotographerPage/Schedule'))
  },
  /*
  {
    path: '/my-packages',
    component: lazy(() => import('../components/PhotographerPage/Package'))
  },*/
  // Route chi tiết Album của thợ (Moved UP để tránh xung đột với :username)
  {
    path: '/photographer/album-detail/:orderId',
    component: lazy(() => import('../components/PhotographerPage/DetailAlbumManager'))
  },

  // =================================================================
  // 🛒 ORDERS & PAYMENT - Đặt route con TRƯỚC route cha (:orderId)
  // =================================================================
  {
    path: '/order-service',
    component: lazy(() => import('../components/Order/OrderService'))
  },
  {
    path: '/payment',
    component: lazy(() => import('../components/Payment/PaymentServicePackage'))
  },
  {
    path: '/my-orders',
    component: lazy(() => import('../components/Order/MyOrder'))
  },
  // ✅ Các route con của Order (Select photos, Manage...) phải đặt TRƯỚC route chi tiết
  {
    path: '/orders/:orderId/select-photos',
    component: lazy(() => import('../components/Album/SelectionPhoto'))
  },
  {
    path: '/orders/:orderId/manage-selection',
    component: lazy(() => import('../components/Album/SelectionPhotoManage'))
  },
  // ⚠️ Route chi tiết đơn hàng (động) đặt SAU CÙNG trong nhóm Order
  {
    path: '/orders/:orderId',
    component: lazy(() => import('../components/Order/MyOrderDetail'))
  },

  // =================================================================
  // 🌏 PUBLIC INFO (SEARCH & DETAILS)
  // =================================================================
  {
    path: '/photographers',
    component: lazy(() => import('../components/PhotographerPage/Photographer'))
  },
  {
    path: '/service-package',
    component: lazy(() => import('../components/ServicePakage/ServicePakage'))
  },
  {
    path: '/package/:id',
    component: lazy(() => import('../components/ServicePakage/ServicePackageDetail'))
  },
  // ⚠️ Route động :username đặt SAU CÙNG của nhóm Photographer để không "nuốt" các route khác
  {
    path: '/photographer/:username',
    component: lazy(() => import('../components/PhotographerPage/PhotographerDetail'))
  },

  // =================================================================
  // 🖼️ ALBUMS & PHOTOS
  // =================================================================
  {
    path: '/albums/detail/:orderId',
    component: lazy(() => import('../components/Album/Album'))
  },

  // =================================================================
  // ℹ️ GENERAL PAGES
  // =================================================================
  {
    path: '/workprofile/:id',
    component: lazy(() => import('../components/WorksProfile/WorkProfileDetail'))
  },
  {
    path: '/activity',
    component: lazy(() => import('../components/Activity/Activity'))
  },
  {
    path: '/about-web',
    component: lazy(() => import('../components/AboutWeb/AboutWeb'))
  },

  // =================================================================
  // 🛡️ ADMIN DASHBOARD
  // =================================================================
  {
    path: '/admin/login',
    component: lazy(() => import('../admin/AdminPage/AdminLogin'))
  },
  {
    path: '/admin-page',
    component: lazy(() => import('../admin/AdminPage/AdminPage'))
  },
  {
    path: '/admin/payment-manage',
    component: lazy(() => import('../admin/AdminPage/PaymentManage'))
  },
  {
    path: '/admin/service-fee',
    component: lazy(() => import('../admin/AdminPage/ServiceFeeManage'))
  },
  {
    path: '/admin/order-manage',
    component: lazy(() => import('../admin/AdminPage/OrderManage'))
  },
  {
    path: '/admin/customer-manage',
    component: lazy(() => import('../admin/UserManage/CustomerManage'))
  },
  {
    path: '/admin/photographer-manage',
    component: lazy(() => import('../admin/UserManage/PhotographerManage'))
  },
  {
    path: '/admin/notifications',
    component: lazy(() => import('../admin/Notification/NotificationAdmin'))
  },
  {
    path: '/admin/complaint-manage',
    component: ComplaintManager
  },
  {
    path: '/admin/messages',
    component: lazy(() => import('../admin/Chat/AdminChat'))
  },

  // =================================================================
  // 🔗 SHARE (PUBLIC ALBUM)
  // =================================================================
  {
    path: '/share/:token',
    component: lazy(() => import('../components/Album/PublicAlbumView'))
  },

  // =================================================================
  // 🚫 404 NOT FOUND (Luôn ở cuối cùng)
  // =================================================================
  {
    path: '*',
    component: lazy(() => import('../NotFound'))
  },
];

export default routes;