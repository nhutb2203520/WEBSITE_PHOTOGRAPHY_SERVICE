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
      return res;
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

      // 🔹 Backend của bạn trả về res.token hoặc res.accessToken
      const token = res.token || res.accessToken;
      const refreshToken = res.refreshToken;
      const role = res.role || null;
      const username = res.user?.HoTen || res.user?.TenDangNhap || null;

      // ✅ Lưu session chính xác
      sessionStorage.setItem('token', token);
      sessionStorage.setItem('refreshToken', refreshToken);
      sessionStorage.setItem('role', role);
      
      // ❌ BỎ JSON.stringify ở đây, lưu thẳng string
      if (username) sessionStorage.setItem('username', username); 

      // Gọi API lấy thông tin người dùng
      await dispatch(getInfoUser());

      return { token, refreshToken, role, username };
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
  // ❌ BỎ JSON.parse ở đây, lấy thẳng string
  // ✅ SỬA THÀNH:
  username: sessionStorage.getItem('username') || null, 
  
  isLoading: false,
  isSuccess: false,
  error: null,
};

// ==========================
// 🔹 Slice chính
// ==========================
const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearError(state) {
      state.error = null;
    },
    clearSuccess(state) {
      state.isSuccess = false;
    },
    logout(state) {
      state.token = null;
      state.refreshToken = null;
      state.role = null;
      state.username = null;
      state.isLoading = false;
      state.isSuccess = false;
      state.error = null;

      sessionStorage.clear();
      window.location.replace('/');
    },
    logoutForAdmin(state) {
      state.token = null;
      state.refreshToken = null;
      state.role = null;
      state.username = null;
      state.isLoading = false;
      state.isSuccess = false;
      state.error = null;
      sessionStorage.clear();
    },
  },

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
        state.isSuccess = true;
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
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
        state.role = action.payload.role;
        state.username = action.payload.username;
      })
      .addCase(login.rejected, (state, action) => {
        state.isLoading = false;
        state.isSuccess = false;
        state.error = action.payload;
      });
  },
});

export const { clearError, clearSuccess, logout, logoutForAdmin } = authSlice.actions;
export default authSlice.reducer;