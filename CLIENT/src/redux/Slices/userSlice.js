import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import userApi from '../../apis/userService';
import { toast } from 'react-toastify';

/** 🔹 Lấy thông tin user hiện tại */
export const getInfoUser = createAsyncThunk('user/getInfoUser', async (_, { rejectWithValue }) => {
  try {
    console.log('📩 [Thunk] Gửi yêu cầu lấy thông tin user hiện tại...');
    const res = await userApi.getInfo();
    console.log('✅ [Thunk] Nhận dữ liệu user:', res);

    if (res?.HoTen || res?.TenDangNhap)
      sessionStorage.setItem('username', res.HoTen || res.TenDangNhap);

    return res;
  } catch (err) {
    console.error('❌ [Thunk] Lỗi khi lấy thông tin user:', err.response?.data || err);
    return rejectWithValue(err.response?.data || { message: 'Không thể lấy thông tin user' });
  }
});

/** 🔹 Upload avatar */
export const uploadAvatar = createAsyncThunk('user/uploadAvatar', async (formData, { rejectWithValue }) => {
  try {
    console.log('📤 [Thunk] Upload avatar...');
    const res = await userApi.uploadAvatar(formData);
    toast.success('Cập nhật ảnh đại diện thành công!');
    return res;
  } catch (err) {
    console.error('❌ [Thunk] Lỗi upload avatar:', err.response?.data || err);
    toast.error(err.response?.data?.message || 'Tải ảnh đại diện thất bại.');
    return rejectWithValue(err.response?.data);
  }
});

/** 🔹 Upload ảnh bìa */
export const uploadCover = createAsyncThunk('user/uploadCover', async (formData, { rejectWithValue }) => {
  try {
    console.log('📤 [Thunk] Upload cover...');
    const res = await userApi.uploadCover(formData);
    toast.success('Cập nhật ảnh bìa thành công!');
    return res;
  } catch (err) {
    console.error('❌ [Thunk] Lỗi upload cover:', err.response?.data || err);
    toast.error(err.response?.data?.message || 'Tải ảnh bìa thất bại.');
    return rejectWithValue(err.response?.data);
  }
});

/** 🔹 Cập nhật hồ sơ cá nhân */
export const updateProfile = createAsyncThunk('user/updateProfile', async (data, { rejectWithValue }) => {
  try {
    console.log('📤 [Thunk] Gửi yêu cầu cập nhật hồ sơ:', data);
    const res = await userApi.updateProfile(data);
    console.log('✅ [Thunk] Hồ sơ đã được cập nhật:', res);

    toast.success(res.message || 'Cập nhật hồ sơ thành công!');
    return res;
  } catch (err) {
    console.error('❌ [Thunk] Lỗi cập nhật hồ sơ:', err.response?.data || err);
    toast.error(err.response?.data?.message || 'Cập nhật thất bại.');
    return rejectWithValue(err.response?.data);
  }
});

/** 🔹 Đổi mật khẩu */
export const changePassword = createAsyncThunk('user/changePassword', async (data, { rejectWithValue }) => {
  try {
    console.log('📤 [Thunk] Gửi yêu cầu đổi mật khẩu');
    const res = await userApi.changePassword(data);
    toast.success('Đổi mật khẩu thành công!');
    return res;
  } catch (err) {
    console.error('❌ [Thunk] Lỗi đổi mật khẩu:', err.response?.data || err);
    toast.error(err.response?.data?.message || 'Đổi mật khẩu thất bại.');
    return rejectWithValue(err.response?.data?.message);
  }
});

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
      sessionStorage.removeItem('token');
      toast.info('Đã đăng xuất.');
    }
  },
  extraReducers: (builder) => {
    builder
      /** 🔸 GET INFO */
      .addCase(getInfoUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getInfoUser.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload;
        state.avatar = action.payload?.Avatar || null;
      })
      .addCase(getInfoUser.rejected, (state, action) => {
        state.loading = false;
        state.user = null;
        state.error = action.payload;
      })

      /** 🔸 UPLOAD AVATAR */
      .addCase(uploadAvatar.fulfilled, (state, action) => {
        const avatarUrl = action.payload?.avatarUrl || action.payload?.fileUrl;
        if (state.user) state.user.Avatar = avatarUrl;
        state.avatar = avatarUrl;
      })

      /** 🔸 UPLOAD COVER */
      .addCase(uploadCover.fulfilled, (state, action) => {
        const coverUrl = action.payload?.fileUrl;
        if (state.user) state.user.CoverImage = coverUrl;
      })

      /** 🔸 UPDATE PROFILE */
      .addCase(updateProfile.pending, (state) => {
        state.loading = true;
      })
      .addCase(updateProfile.fulfilled, (state, action) => {
        state.loading = false;
        const updated = action.payload?.customer || action.payload;
        if (updated) state.user = updated;
      })
      .addCase(updateProfile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      /** 🔸 CHANGE PASSWORD */
      .addCase(changePassword.pending, (state) => {
        state.loading = true;
      })
      .addCase(changePassword.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(changePassword.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  }
});

export const { logoutUser } = userSlice.actions;
export default userSlice.reducer;
