import axiosClient from "./axiosClient";

const albumApi = {
  // 1. Lấy danh sách Album của tôi (Cho Photographer quản lý)
  getMyAlbums: () => {
    return axiosClient.get("/albums/my-albums");
  },

  // 2. Tạo Album Job Ngoài (Freelance)
  createFreelanceAlbum: (data) => {
    // data: { title, client_name, description }
    return axiosClient.post("/albums/freelance", data);
  },

  // 3. Lấy chi tiết Album (bằng Order ID hoặc Album ID)
  getAlbumDetail: (id) => {
    return axiosClient.get(`/albums/${id}`);
  },

  // 4. Upload ảnh vào Album (Tự tạo nếu chưa có)
  uploadPhotos: (id, formData) => {
    return axiosClient.post(`/albums/${id}/upload`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
  },

  // 5. Khách hàng gửi lựa chọn ảnh
  submitSelection: (id, selectedIds) => {
    return axiosClient.put(`/albums/${id}/selection`, { selectedIds });
  },

  // 6. Xóa 1 ảnh
  deletePhoto: (id, photoId) => {
    return axiosClient.delete(`/albums/${id}/photos/${photoId}`);
  },

  // 7. Cập nhật thông tin Album (Tiêu đề, mô tả)
  updateAlbumInfo: (id, data) => {
    return axiosClient.put(`/albums/${id}/info`, data);
  },

  // 8. Xóa toàn bộ Album
  deleteAlbum: (id) => {
    return axiosClient.delete(`/albums/${id}`);
  }
};

export default albumApi;