import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import authApi from '../../apis/authUser';
import { getInfoUser } from './userSlice';

// ==========================
// 🔹 Đăng ký tài khoản
// ==========================
export const registerUser = createAsyncThunk(
  'auth/registerUser',
  async (userData, { rejectWithValue }) => {
    try {
      const res = await authApi.register(userData);
      return res; // Dữ liệu trả về từ server
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Đăng ký thất bại');
    }
  }
);

// ==========================
// 🔹 Đăng nhập
// ==========================
export const login = createAsyncThunk(
  'auth/login',
  async (credentials, { dispatch, rejectWithValue }) => {
    try {
      const res = await authApi.login(credentials);

      // Lưu token và refreshToken
      sessionStorage.setItem('token', res.token);
      sessionStorage.setItem('refreshToken', res.refreshToken);
      if (res.role) sessionStorage.setItem('role', res.role);

      // Gọi API lấy thông tin user
      await dispatch(getInfoUser());
      return res;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Đăng nhập thất bại');
    }
  }
);

// ==========================
// 🔹 State ban đầu
// ==========================
const initialState = {
  token: sessionStorage.getItem('token') || null,
  refreshToken: sessionStorage.getItem('refreshToken') || null,
  role: sessionStorage.getItem('role') || null,
  username: JSON.parse(sessionStorage.getItem('username')) || null,
  isLoading: false,   // ✅ Trạng thái loading toàn cục
  isSuccess: false,   // ✅ Báo hiệu thao tác thành công (cho toast)
  error: null,        // ✅ Lưu thông báo lỗi
};

// ==========================
// 🔹 Slice chính
// ==========================
const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    // ✅ Xóa lỗi
    clearError(state) {
      state.error = null;
    },

    // ✅ Xóa trạng thái thành công
    clearSuccess(state) {
      state.isSuccess = false;
    },

    // ✅ Đăng xuất chung
    logout(state) {
      state.token = null;
      state.refreshToken = null;
      state.role = null;
      state.username = null;
      state.isLoading = false;
      state.isSuccess = false;
      state.error = null;

      sessionStorage.removeItem('token');
      sessionStorage.removeItem('refreshToken');
      sessionStorage.removeItem('role');
      sessionStorage.removeItem('username');

      window.location.replace('/');
    },

    // ✅ Đăng xuất riêng cho admin
    logoutForAdmin(state) {
      state.token = null;
      state.refreshToken = null;
      state.role = null;
      state.username = null;
      state.isLoading = false;
      state.isSuccess = false;
      state.error = null;

      sessionStorage.removeItem('token');
      sessionStorage.removeItem('refreshToken');
      sessionStorage.removeItem('role');
      sessionStorage.removeItem('username');
    },
  },

  // ==========================
  // 🔹 Xử lý async actions
  // ==========================
  extraReducers: (builder) => {
    // Đăng ký
    builder
      .addCase(registerUser.pending, (state) => {
        state.isLoading = true;
        state.isSuccess = false;
        state.error = null;
      })
      .addCase(registerUser.fulfilled, (state) => {
        state.isLoading = false;
        state.isSuccess = true; // ✅ Cho phép hiển thị toast success
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.isLoading = false;
        state.isSuccess = false;
        state.error = action.payload || 'Đăng ký thất bại';
      });

    // Đăng nhập
    builder
      .addCase(login.pending, (state) => {
        state.isLoading = true;
        state.error = null;
        state.isSuccess = false;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.token = action.payload.token;
        state.refreshToken = action.payload.refreshToken;
        state.role = action.payload.role || null;
      })
      .addCase(login.rejected, (state, action) => {
        state.isLoading = false;
        state.isSuccess = false;
        state.error = action.payload || 'Đăng nhập thất bại';
      });
  },
});

export const { clearError, clearSuccess, logout, logoutForAdmin } = authSlice.actions;
export default authSlice.reducer;
