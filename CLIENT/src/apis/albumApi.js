import axiosUser from "./axiosUser";
import axios from "axios";

const albumApi = {
  getMyAlbums: () => axiosUser.get("/albums/my-albums"),
  createFreelanceAlbum: (data) => axiosUser.post("/albums/freelance", data),
  getAlbumDetail: (id) => axiosUser.get(`/albums/${id}`),
  
  // Upload ảnh gốc
  uploadPhotos: (id, formData) => {
    return axiosUser.post(`/albums/${id}/upload`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },

  // [NEW] Giao Album (Upload ảnh chỉnh sửa)
  deliverAlbum: (id, formData) => {
    return axiosUser.post(`/albums/${id}/deliver`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },

  submitSelection: (id, selectedIds) => axiosUser.put(`/albums/${id}/selection`, { selectedIds }),
  deletePhoto: (id, photoId) => axiosUser.delete(`/albums/${id}/photos/${photoId}`),
  updateAlbumInfo: (id, data) => axiosUser.put(`/albums/${id}/info`, data),
  deleteAlbum: (id) => axiosUser.delete(`/albums/${id}`),
  createShareLink: (id) => axiosUser.post(`/albums/${id}/share`),
  
  getPublicAlbum: (token) => {
    const BASE_URL = 'http://localhost:5000/api'; 
    return axios.get(`${BASE_URL}/albums/public/${token}`);
  },
  submitPublicSelection: (token, selectedIds) => {
    const BASE_URL = 'http://localhost:5000/api';
    return axios.put(`${BASE_URL}/albums/public/${token}/selection`, { selectedIds });
  }
};

export default albumApi;