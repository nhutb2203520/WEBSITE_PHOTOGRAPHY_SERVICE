import { lazy } from 'react';

const routes = [
  // ... (Giữ nguyên các route auth & photographer) ...
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

  // --- PHOTOGRAPHER ---
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

  // --- PUBLIC ---
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

  // --- ORDERS ---
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

  // --- ALBUMS ---
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

  // --- GENERAL ---
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

  // --- ADMIN ---
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

  // --- SHARE (NEW) ---
  {
    path: '/share/:token',
    component: lazy(() => import('../components/Album/PublicAlbumView'))
  },

  {
    path: '*',
    component: lazy(() => import('../NotFound'))
  },
];

export default routes;