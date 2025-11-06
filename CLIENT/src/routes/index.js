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
    path:'/signup',
    component: lazy(() => import('../components/Account/SignUp'))
  },
  {
    path:'/signin',
    component: lazy(() => import('../components/Account/SignIn'))
  },
  {
    path:'/forgot-password',
    component: lazy(() => import('../components/Account/ForgotPass'))
  },
  {
    path:'/my-account',
    component: lazy(() => import('../components/Account/MyAccount'))
  },
  {
    path:'/photographers',
    component: lazy(() => import('../components/PhotographerPage/Photographer'))
  },
  {
     path:'/service-package',
    component: lazy(() => import('../components/ServicePakage/ServicePakage'))
  },
  {
     path:'/activity',
    component: lazy(() => import('../components/Activity/Activity'))
  },
  {
     path:'/about-web',
    component: lazy(() => import('../components/AboutWeb/AboutWeb'))
  }
  
];

export default routes;