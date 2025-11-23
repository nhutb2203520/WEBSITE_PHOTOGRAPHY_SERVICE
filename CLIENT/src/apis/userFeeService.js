import axiosClient from "./axiosUser"; 

const userFeeService = {
  // Lấy danh sách phí (Dành cho user đã đăng nhập)
  getAllFees: () => {
    return axiosClient.get("/service-fees");
  },
};

export default userFeeService;