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
  // ✅ NEW: Order Service Route
  {
  path: '/order-service',
  component: lazy(() => import('../components/Order/OrderService'))
  },
  {
    path: '/my-packages',
    component: lazy(() => import('../components/PhotographerPage/Package'))
  },
  // ✅ NEW: My Orders Route (để xem đơn hàng đã đặt)
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
];

export default routes;