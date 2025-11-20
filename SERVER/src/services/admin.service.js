import Admin from "../models/admin.model.js";

const adminService = {
  getAdminByUsername: async (username) => {
    return await Admin.findOne({ username });
  },

  createAdmin: async (username, hashedPassword) => {
    return await Admin.create({
      username,
      password: hashedPassword
    });
  }
};

export default adminService;
