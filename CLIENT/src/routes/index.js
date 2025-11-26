import { lazy } from 'react';

const routes = [
  // ==============================
  // 1. HOME & AUTHENTICATION
  // ==============================
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
    path: '/my-account',
    component: lazy(() => import('../components/Account/MyAccount'))
  },

  // ==============================
  // 2. PHOTOGRAPHER MANAGEMENT
  // ==============================
  {
    path: '/photographer/orders-manage',
    component: lazy(() => import('../components/PhotographerPage/PhotographerOrderManagement'))
  },
  {
    // Route này dành cho chi tiết Album 
    path: '/photographer/albums-detail',
    component: lazy(() => import('../components/Album/DetailAlbumManager')) 
  },

  {
    // Route này dành cho danh sách Album
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

  // ==============================
  // 3. PUBLIC PAGES (Tim tho, Xem goi)
  // ==============================
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

  // ==============================
  // 4. ORDERS & PAYMENT (CUSTOMER)
  // ==============================
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

  // ==============================
  // 5. ALBUM & SELECTION FLOW (NEW)
  // ==============================
  {
    // Khách hàng: Xem chi tiết Album (Slide ảnh, Tải ảnh)
    path: '/albums/detail/:orderId',
    component: lazy(() => import('../components/Album/Album')) 
  },
  {
    // Khách hàng: Giao diện chọn ảnh để gửi cho thợ (SelectionPhoto.jsx)
    path: '/orders/:orderId/select-photos',
    component: lazy(() => import('../components/Album/SelectionPhoto')) 
  },
  {
    // Photographer: Xem danh sách ảnh khách đã chọn (SelectionPhotoManage.jsx)
    path: '/orders/:orderId/manage-selection',
    component: lazy(() => import('../components/Album/SelectionPhotoManage')) 
  },
  {
    // Photographer: Quản lý, Upload ảnh, Xóa ảnh của 1 đơn hàng (PhotographerAlbumManager.jsx)
    path: '/photographer/album-detail/:orderId',
    component: lazy(() => import('../components/Album/DetailAlbumManager')) 
  },

  // ==============================
  // 6. GENERAL PAGES
  // ==============================
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

  // ==============================
  // 7. ADMIN ROUTES
  // ==============================
  {
    path: '/admin-page',
    component: lazy(() => import('../admin/AdminPage/AdminPage'))
  },
  {
    path: '/admin/payment-manage',
    component: lazy(() => import('../admin/AdminPage/PaymentManage'))
  },
  {
    path: '/admin/login',
    component: lazy(() => import('../admin/AdminPage/AdminLogin'))
  },
  {
    path: '/admin/service-fee',
    component: lazy(() => import('../admin/AdminPage/ServiceFeeManage'))
  },
  {
    path: '/admin/order-manage',
    component: lazy(() => import('../admin/AdminPage/OrderManage'))
  },

  // ==============================
  // 8. 404 NOT FOUND
  // ==============================
  {
    path: '*',
    component: lazy(() => import('../NotFound'))
  },
];

export default routes;