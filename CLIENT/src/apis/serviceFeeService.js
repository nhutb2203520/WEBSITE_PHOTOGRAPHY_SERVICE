// ✅ Đảm bảo import axiosInstance đúng cách (có dấu ngoặc nhọn)
import { axiosInstance } from "./adminAuthService";

const serviceFeeService = {
  getAllFees: () => {
    return axiosInstance.get("/service-fees");
  },
  createFee: (data) => {
    return axiosInstance.post("/service-fees", data);
  },
  updateFee: (id, data) => {
    return axiosInstance.put(`/service-fees/${id}`, data);
  },
  deleteFee: (id) => {
    return axiosInstance.delete(`/service-fees/${id}`);
  }
};

export default serviceFeeService;