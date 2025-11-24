import axiosUser from "./axiosUser";

const scheduleApi = {
  getMySchedule: () => axiosUser.get("/schedule"),
  addPersonalSchedule: (data) => axiosUser.post("/schedule", data),
  deleteSchedule: (id) => axiosUser.delete(`/schedule/${id}`),
};

export default scheduleApi;