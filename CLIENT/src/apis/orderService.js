import axiosUser from "./axiosUser";

const ORDER_URL = "/orders";

const orderApi = {
  createOrder: (data) => axiosUser.post(`${ORDER_URL}`, data),
  getMyOrders: () => axiosUser.get(`${ORDER_URL}/my-orders`),
  updateOrderStatus: (orderId, status) =>
    axiosUser.put(`${ORDER_URL}/${orderId}/status`, { status }),
};

export default orderApi;
