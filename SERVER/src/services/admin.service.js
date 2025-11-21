import Admin from "../models/admin.model.js";

const getAdminByUsername = async (username) => {
  return await Admin.findOne({ username });
};

// Hàm mới: tìm admin theo username / email / phone
const getAdminByLoginKey = async (loginKey) => {
  return await Admin.findOne({
    $or: [
      { username: loginKey },
      { email: loginKey },
      { phone: loginKey }
    ]
  });
};

export default {
  getAdminByUsername,
  getAdminByLoginKey,
};
