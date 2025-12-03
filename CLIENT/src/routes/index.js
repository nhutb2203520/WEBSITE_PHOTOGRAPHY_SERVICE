import { lazy } from 'react';

// ⚠️ QUAN TRỌNG: Import trực tiếp ComplaintManager để tránh lỗi lazy load khi thiếu file dependency
import ComplaintManager from '../admin/ComplaintManager/ComplaintManager';

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
  // ✅ Trang yêu thích
  {
    path: '/favorites',
    component: lazy(() => import('../components/Favorites/FavoritesPage'))
  },

  // =================================================================
  // 📸 PHOTOGRAPHER (PRIVATE AREA)
  // =================================================================
  {
    path: '/photographer/orders-manage',
    component: lazy(() => import('../components/PhotographerPage/PhotographerOrderManagement'))
  },
  {
    path: '/photographer/albums-detail',
    component: lazy(() => import('../components/Album/DetailAlbumManager')) 
  },
  {
    path: '/photographer/albums-management',
    component: lazy(() => import('../components/PhotographerPage/AlbumsManage')) 
  },
  {
    path: '/photographer/schedule',
    component: lazy(() => import('../components/PhotographerPage/Schedule'))
  },
  {
    path: '/my-packages',
    component: lazy(() => import('../components/PhotographerPage/Package'))
  },

  // =================================================================
  // 🌏 PUBLIC INFO (SEARCH & DETAILS)
  // =================================================================
  {
    path: '/photographers',
    component: lazy(() => import('../components/PhotographerPage/Photographer'))
  },
  {
    path: '/photographer/:username',
    component: lazy(() => import('../components/PhotographerPage/PhotographerDetail'))
  },
  {
    path: '/service-package',
    component: lazy(() => import('../components/ServicePakage/ServicePakage'))
  },
  {
    path: '/package/:id',
    component: lazy(() => import('../components/ServicePakage/ServicePackageDetail'))
  },

  // =================================================================
  // 🛒 ORDERS & PAYMENT
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
  // ✅ [MỚI] Chi tiết đơn hàng (xử lý link: orders/ORD-xxxx)
  {
    path: '/orders/:orderId',
    component: lazy(() => import('../components/Order/MyOrderDetail')) 
  },

  // =================================================================
  // 🖼️ ALBUMS & PHOTOS
  // =================================================================
  {
    path: '/albums/detail/:orderId',
    component: lazy(() => import('../components/Album/Album')) 
  },
  {
    path: '/orders/:orderId/select-photos',
    component: lazy(() => import('../components/Album/SelectionPhoto')) 
  },
  {
    path: '/orders/:orderId/manage-selection',
    component: lazy(() => import('../components/Album/SelectionPhotoManage')) 
  },
  {
    path: '/photographer/album-detail/:orderId',
    component: lazy(() => import('../components/Album/DetailAlbumManager')) 
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

  // =================================================================
  // 🔗 SHARE (PUBLIC ALBUM)
  // =================================================================
  {
    path: '/share/:token',
    component: lazy(() => import('../components/Album/PublicAlbumView'))
  },

  // =================================================================
  // 🚫 404 NOT FOUND
  // =================================================================
  {
    path: '*',
    component: lazy(() => import('../NotFound'))
  },
];

export default routes;