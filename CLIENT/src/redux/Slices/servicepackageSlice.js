import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import servicePackageApi from '../../apis/ServicePackageService';
import { toast } from 'react-toastify';

// ==================== THUNKS ====================

/** 🔹 Lấy tất cả gói dịch vụ công khai */
export const getAllPackages = createAsyncThunk('package/getAllPackages', async (filters = {}, { rejectWithValue }) => {
  try {
    const res = await servicePackageApi.getAllPackages(filters);
    return res.packages || [];
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Không thể tải danh sách gói dịch vụ');
  }
});

/** 🔹 Lấy chi tiết 1 gói (Dùng cho trang Detail) */
export const getPackageById = createAsyncThunk('package/getPackageById', async (id, { rejectWithValue }) => {
  try {
    const res = await servicePackageApi.getPackageById(id);
    return res;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Không thể tải thông tin gói');
  }
});

/** 🔹 Lấy gói của photographer hiện tại */
export const getMyPackages = createAsyncThunk('package/getMyPackages', async (_, { rejectWithValue }) => {
  try {
    const res = await servicePackageApi.getMyPackages();
    return res.packages || [];
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Không thể tải danh sách gói của bạn');
  }
});

/** 🔹 Tạo gói mới */
export const createPackage = createAsyncThunk('package/createPackage', async (data, { rejectWithValue }) => {
  try {
    const res = await servicePackageApi.createPackage(data);
    toast.success('Tạo gói dịch vụ thành công!');
    return res.package || res;
  } catch (err) {
    toast.error(err.response?.data?.message || 'Tạo gói thất bại.');
    return rejectWithValue(err.response?.data);
  }
});

/** 🔹 Cập nhật gói */
export const updatePackage = createAsyncThunk('package/updatePackage', async ({ id, data }, { rejectWithValue }) => {
  try {
    const res = await servicePackageApi.updatePackage(id, data);
    toast.success('Cập nhật gói dịch vụ thành công!');
    return res.package || res;
  } catch (err) {
    toast.error(err.response?.data?.message || 'Cập nhật thất bại.');
    return rejectWithValue(err.response?.data);
  }
});

/** 🔹 Xóa gói */
export const deletePackage = createAsyncThunk('package/deletePackage', async (id, { rejectWithValue }) => {
  try {
    await servicePackageApi.deletePackage(id);
    toast.success('Xóa gói dịch vụ thành công!');
    return id;
  } catch (err) {
    toast.error(err.response?.data?.message || 'Xóa gói thất bại.');
    return rejectWithValue(err.response?.data);
  }
});

/** 🔹 Đánh giá gói dịch vụ (Rating) */
export const ratePackage = createAsyncThunk('package/ratePackage', async ({ id, rating }, { rejectWithValue }) => {
  try {
    const res = await servicePackageApi.ratePackage(id, rating);
    return res; // Trả về gói đã update
  } catch (err) {
    return rejectWithValue(err.response?.data);
  }
});

/** 🔹 Upload ảnh bìa */
export const uploadPackageImage = createAsyncThunk('package/uploadPackageImage', async ({ id, formData }, { rejectWithValue }) => {
  try {
    const res = await servicePackageApi.uploadPackageImage(id, formData);
    return { id, imageUrl: res.fileUrl || res.imageUrl };
  } catch (err) {
    return rejectWithValue(err.response?.data);
  }
});

/** 🔹 Upload nhiều ảnh gallery */
export const uploadPackageImages = createAsyncThunk('package/uploadPackageImages', async ({ id, formData }, { rejectWithValue }) => {
  try {
    const res = await servicePackageApi.uploadPackageImages(id, formData);
    return { id, imageUrls: res.fileUrls || res.imageUrls || [] };
  } catch (err) {
    return rejectWithValue(err.response?.data);
  }
});

/** 🔹 Xóa ảnh khỏi gallery */
export const deletePackageImage = createAsyncThunk('package/deletePackageImage', async ({ id, imageUrl }, { rejectWithValue }) => {
  try {
    await servicePackageApi.deletePackageImage(id, imageUrl);
    toast.success('Xóa ảnh thành công!');
    return { id, imageUrl };
  } catch (err) {
    toast.error('Không thể xóa ảnh.');
    return rejectWithValue(err.response?.data);
  }
});

// ==================== SLICE ====================

const servicePackageSlice = createSlice({
  name: 'package',
  initialState: {
    packages: [],       // Danh sách gói public
    myPackages: [],     // Danh sách gói của photographer
    currentPackage: null, // Chi tiết 1 gói đang xem
    loading: false,
    error: null,
  },
  reducers: {
    clearCurrentPackage: (state) => {
      state.currentPackage = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // --- GET ALL ---
      .addCase(getAllPackages.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(getAllPackages.fulfilled, (state, action) => {
        state.loading = false;
        state.packages = action.payload;
      })
      .addCase(getAllPackages.rejected, (state, action) => { state.loading = false; state.error = action.payload; })

      // --- GET BY ID ---
      .addCase(getPackageById.pending, (state) => { state.loading = true; })
      .addCase(getPackageById.fulfilled, (state, action) => {
        state.loading = false;
        state.currentPackage = action.payload;
      })
      .addCase(getPackageById.rejected, (state, action) => { state.loading = false; state.error = action.payload; })

      // --- GET MY PACKAGES ---
      .addCase(getMyPackages.pending, (state) => { state.loading = true; })
      .addCase(getMyPackages.fulfilled, (state, action) => {
        state.loading = false;
        state.myPackages = action.payload;
      })
      .addCase(getMyPackages.rejected, (state, action) => { state.loading = false; state.error = action.payload; })

      // --- CREATE ---
      .addCase(createPackage.pending, (state) => { state.loading = true; })
      .addCase(createPackage.fulfilled, (state, action) => {
        state.loading = false;
        state.myPackages.push(action.payload);
        state.packages.push(action.payload); // Cập nhật luôn list public nếu cần
      })
      .addCase(createPackage.rejected, (state, action) => { state.loading = false; state.error = action.payload; })

      // --- UPDATE ---
      .addCase(updatePackage.pending, (state) => { state.loading = true; })
      .addCase(updatePackage.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.myPackages.findIndex(p => p._id === action.payload._id);
        if (index !== -1) state.myPackages[index] = action.payload;
        
        // Cập nhật cả currentPackage nếu đang xem
        if (state.currentPackage?._id === action.payload._id) {
          state.currentPackage = action.payload;
        }
      })
      .addCase(updatePackage.rejected, (state, action) => { state.loading = false; state.error = action.payload; })

      // --- DELETE ---
      .addCase(deletePackage.fulfilled, (state, action) => {
        state.myPackages = state.myPackages.filter(pkg => pkg._id !== action.payload);
        state.packages = state.packages.filter(pkg => pkg._id !== action.payload);
      })

      // --- RATE (Cập nhật lại điểm đánh giá trong list) ---
      .addCase(ratePackage.fulfilled, (state, action) => {
        const updatedPkg = action.payload;
        // Cập nhật trong list public
        const index = state.packages.findIndex(p => p._id === updatedPkg._id);
        if (index !== -1) state.packages[index] = updatedPkg;
        
        // Cập nhật trong list photographer
        const myIndex = state.myPackages.findIndex(p => p._id === updatedPkg._id);
        if (myIndex !== -1) state.myPackages[myIndex] = updatedPkg;

        // Cập nhật currentPackage
        if (state.currentPackage?._id === updatedPkg._id) {
          state.currentPackage = updatedPkg;
        }
      })

      // --- UPLOAD COVER IMAGE ---
      .addCase(uploadPackageImage.fulfilled, (state, action) => {
        const pkg = state.myPackages.find(p => p._id === action.payload.id);
        if (pkg) pkg.AnhBia = action.payload.imageUrl;
      })

      // --- UPLOAD GALLERY ---
      .addCase(uploadPackageImages.fulfilled, (state, action) => {
        const pkg = state.myPackages.find(p => p._id === action.payload.id);
        if (pkg) {
          if (!pkg.Images) pkg.Images = [];
          pkg.Images.push(...action.payload.imageUrls);
        }
      })

      // --- DELETE GALLERY IMAGE ---
      .addCase(deletePackageImage.fulfilled, (state, action) => {
        const pkg = state.myPackages.find(p => p._id === action.payload.id);
        if (pkg && pkg.Images) {
          pkg.Images = pkg.Images.filter(img => img !== action.payload.imageUrl);
        }
      });
  },
});

export const { clearCurrentPackage } = servicePackageSlice.actions;
export default servicePackageSlice.reducer;