import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import userApi from '../../apis/userService';
import { toast } from 'react-toastify';

/**
 * Lấy thông tin người dùng hiện tại
 */
export const getInfoUser = createAsyncThunk(
  'user/getInfoUser',
  async (_, { rejectWithValue }) => {
    try {
      const res = await userApi.getUserById();
      // ✅ Lưu username dạng string thường, không cần JSON.stringify
      if (res.customer) {
        sessionStorage.setItem('username', res.customer.HoTen || res.customer.TenDangNhap);
      }
      return res;
    } catch (err) {
      return rejectWithValue(err.response?.data);
    }
  }
);;

/**
 * Upload ảnh đại diện
 */
export const uploadAvatar = createAsyncThunk(
  'user/uploadAvatar',
  async (data, { rejectWithValue }) => {
    try {
      const res = await userApi.uploadAvatar(data);
      toast.success('Cập nhật ảnh đại diện thành công!');
      return res;
    } catch (err) {
      toast.error(err.response?.data?.message || 'Tải ảnh đại diện thất bại.');
      return rejectWithValue(err.response?.data);
    }
  }
);
/**
 * Upload ảnh bìa
 */
export const uploadCover = createAsyncThunk(
  'user/uploadCover',
  async (data, { rejectWithValue }) => {
    try {
      const res = await userApi.uploadCover(data);
      toast.success('Cập nhật ảnh bìa thành công!');
      return res;
    } catch (err) {
      toast.error(err.response?.data?.message || 'Tải ảnh bìa thất bại.');
      return rejectWithValue(err.response?.data);
    }
  }
);
/**
 * Cập nhật thông tin hồ sơ cá nhân
 */
export const updateProfile = createAsyncThunk(
  'user/updateProfile',
  async (data, { rejectWithValue }) => {
    try {
      const res = await userApi.updateProfile(data);
      toast.success('Cập nhật hồ sơ thành công!');
      return res;
    } catch (err) {
      toast.error(err.response?.data?.message || 'Cập nhật thất bại.');
      return rejectWithValue(err.response?.data);
    }
  }
);

/**
 * Đổi mật khẩu
 */
export const changePassword = createAsyncThunk(
  'user/changePassword',
  async (data, { rejectWithValue }) => {
    try {
      const res = await userApi.changePassword(data);
      toast.success('Đổi mật khẩu thành công.');
      return res;
    } catch (err) {
      toast.error(err.response?.data?.message || 'Đổi mật khẩu thất bại.');
      return rejectWithValue(err.response?.data?.message);
    }
  }
);

/**
 * Nâng cấp tài khoản thành nhà cung cấp
 */
export const upgradeToProvider = createAsyncThunk(
  'user/upgradeToProvider',
  async (data, { rejectWithValue }) => {
    try {
      const res = await userApi.upgradeToProvider(data);
      toast.success(res.message || 'Đăng ký nhà cung cấp thành công.');
      return res;
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Đăng ký thất bại.');
      return rejectWithValue(err.response?.data?.message);
    }
  }
);

/**
 * Slice quản lý người dùng
 */
const userSlice = createSlice({
  name: 'user',
  initialState: {
    user: null,
    avatar: null,
    loading: false,
    error: null
  },
  reducers: {
    logoutUser: (state) => {
      state.user = null;
      state.avatar = null;
      sessionStorage.removeItem('username');
      toast.info('Đã đăng xuất.');
    }
  },
  extraReducers: (builder) => {
    builder
      // Lấy thông tin người dùng
      .addCase(getInfoUser.pending, (state) => {
        state.loading = true;
      })
      .addCase(getInfoUser.fulfilled, (state, action) => {
        state.loading = false;
        // ✅ Backend trả về { customer: {...}, message: "..." }
        state.user = action.payload.customer; // ← Lấy customer từ payload
        state.avatar = action.payload.customer?.avatarUrl;
      })
      .addCase(getInfoUser.rejected, (state, action) => {
        state.loading = false;
        state.user = null;
        state.error = action.payload;
      })

      // Upload avatar
      .addCase(uploadAvatar.fulfilled, (state, action) => {
        state.avatar = action.payload.avatarUrl;
        if (state.user) {
          state.user.avatarUrl = action.payload.avatarUrl;
        }
      })
      //upload ảnh bìa
      .addCase(uploadCover.fulfilled, (state, action) => {
        if (state.user) {
          state.user.CoverImage = action.payload.fileUrl; // hoặc .coverUrl tùy backend
        }
      });

  }
});

export const { logoutUser } = userSlice.actions;
export default userSlice.reducer;
