import { lazy } from 'react';

const routes = [
  {
    path: '*',
    component: lazy(() => import('../NotFound'))
  },
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
  // ✅ Service Package Detail Route
  {
    path: '/package/:id',
    component: lazy(() => import('../components/ServicePakage/ServicePackageDetail'))
  },
  // ✅ Order Service Route
  {
    path: '/order-service',
    component: lazy(() => import('../components/Order/OrderService'))
  },
  // ✅ NEW: Payment Route (Trang thanh toán)
  {
    path: '/payment',
    // Lưu ý: Hãy đảm bảo đường dẫn import đúng với nơi bạn lưu file PaymentServicePackage
    component: lazy(() => import('../components/Payment/PaymentServicePackage'))
  },
  {
    path: '/my-packages',
    component: lazy(() => import('../components/PhotographerPage/Package'))
  },
  // ✅ My Orders Route (Xem đơn hàng đã đặt)
  {
    path: '/my-orders',
    component: lazy(() => import('../components/Order/MyOrder'))
  },
  {
    path: '/activity',
    component: lazy(() => import('../components/Activity/Activity'))
  },
  {
    path: '/about-web',
    component: lazy(() => import('../components/AboutWeb/AboutWeb'))
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
    path: '/admin/login',
    component: lazy(() => import('../admin/AdminPage/AdminLogin'))
  },
];

export default routes;