import { lazy } from 'react';

const routes = [
  // --- HOME & AUTH ---
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

  // --- PHOTOGRAPHER MANAGEMENT ---
  {
    path: '/photographer/orders-manage',
    component: lazy(() => import('../components/PhotographerPage/PhotographerOrderManagement'))
  },
  {
    path: '/photographer/albums-manage',
    component: lazy(() => import('../components/Album/PhotographerAlbumManager')) 
  },
  {
    path: '/photographer/schedule',
    component: lazy(() => import('../components/PhotographerPage/Schedule'))
  },
  {
    path: '/my-packages',
    component: lazy(() => import('../components/PhotographerPage/Package'))
  },

  // --- PUBLIC PHOTOGRAPHER PAGES ---
  {
    path: '/photographers',
    component: lazy(() => import('../components/PhotographerPage/Photographer'))
  },
  {
    path: '/photographer/:username',
    component: lazy(() => import('../components/PhotographerPage/PhotographerDetail'))
  },

  // --- SERVICES & PACKAGES ---
  {
    path: '/service-package',
    component: lazy(() => import('../components/ServicePakage/ServicePakage'))
  },
  {
    path: '/package/:id',
    component: lazy(() => import('../components/ServicePakage/ServicePackageDetail'))
  },

  // --- ORDERS & PAYMENT ---
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
  
  //album
  {
    path: '/albums/detail/:orderId',
    component: lazy(() => import('../components/Album/Album')) 
  },
  {
    // Dành cho KHÁCH HÀNG vào chọn ảnh
    path: '/orders/:orderId/select-photos',
    component: lazy(() => import('../components/Album/SelectionPhoto')) 
},
{
    // Dành cho PHOTOGRAPHER xem danh sách đã chọn
    path: '/orders/:orderId/manage-selection',
    component: lazy(() => import('../components/Album/SelectionPhotoManage')) 
},
{
    // Dành cho PHOTOGRAPHER xem đơn hàng +album ảnh
    path: '/photographer/album-manager/:orderId',
    component: lazy(() => import('../components/Album/PhotographerAlbumManager')) 
},


  // --- GENERAL PAGES ---
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
  
  // --- ADMIN ROUTES ---
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

  // --- 404 NOT FOUND ---
  {
    path: '*',
    component: lazy(() => import('../NotFound'))
  },
];

export default routes;