import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import servicePackageApi from '../../apis/ServicePackageService';
import { toast } from 'react-toastify';

/** 🔹 Lấy tất cả gói dịch vụ công khai */
export const getAllPackages = createAsyncThunk('package/getAllPackages', async (filters = {}, { rejectWithValue }) => {
  try {
    console.log('📥 [Thunk] Fetch all packages with filters:', filters);
    const res = await servicePackageApi.getAllPackages(filters);
    return res.packages || [];
  } catch (err) {
    console.error('❌ [Thunk] Lỗi getAllPackages:', err.response?.data || err);
    return rejectWithValue(err.response?.data?.message || 'Không thể tải danh sách gói dịch vụ');
  }
});

/** 🔹 Lấy gói của photographer hiện tại */
export const getMyPackages = createAsyncThunk('package/getMyPackages', async (_, { rejectWithValue }) => {
  try {
    console.log('📥 [Thunk] Fetch my packages...');
    const res = await servicePackageApi.getMyPackages();
    return res.packages || [];
  } catch (err) {
    console.error('❌ [Thunk] Lỗi getMyPackages:', err.response?.data || err);
    return rejectWithValue(err.response?.data?.message || 'Không thể tải danh sách gói dịch vụ');
  }
});

/** 🔹 Tạo gói mới */
export const createPackage = createAsyncThunk('package/createPackage', async (data, { rejectWithValue }) => {
  try {
    console.log('📤 [Thunk] Create package:', data);
    const res = await servicePackageApi.createPackage(data);
    toast.success('Tạo gói dịch vụ thành công!');
    return res.package || res;
  } catch (err) {
    console.error('❌ [Thunk] Lỗi createPackage:', err.response?.data || err);
    toast.error(err.response?.data?.message || 'Tạo gói thất bại.');
    return rejectWithValue(err.response?.data);
  }
});

/** 🔹 Cập nhật gói */
export const updatePackage = createAsyncThunk('package/updatePackage', async ({ id, data }, { rejectWithValue }) => {
  try {
    console.log('📤 [Thunk] Update package:', id);
    const res = await servicePackageApi.updatePackage(id, data);
    toast.success('Cập nhật gói dịch vụ thành công!');
    return res.package || res;
  } catch (err) {
    console.error('❌ [Thunk] Lỗi updatePackage:', err.response?.data || err);
    toast.error(err.response?.data?.message || 'Cập nhật thất bại.');
    return rejectWithValue(err.response?.data);
  }
});

/** 🔹 Xóa gói */
export const deletePackage = createAsyncThunk('package/deletePackage', async (id, { rejectWithValue }) => {
  try {
    console.log('🗑️ [Thunk] Delete package:', id);
    await servicePackageApi.deletePackage(id);
    toast.success('Xóa gói dịch vụ thành công!');
    return id;
  } catch (err) {
    console.error('❌ [Thunk] Lỗi deletePackage:', err.response?.data || err);
    toast.error(err.response?.data?.message || 'Xóa gói thất bại.');
    return rejectWithValue(err.response?.data);
  }
});

/** 🔹 Upload ảnh bìa (single) */
export const uploadPackageImage = createAsyncThunk('package/uploadPackageImage', async ({ id, formData }, { rejectWithValue }) => {
  try {
    console.log('📤 [Thunk] Upload package cover image for:', id);
    const res = await servicePackageApi.uploadPackageImage(id, formData);
    return { id, imageUrl: res.fileUrl || res.imageUrl || res.url };
  } catch (err) {
    console.error('❌ [Thunk] Lỗi uploadPackageImage:', err.response?.data || err);
    return rejectWithValue(err.response?.data);
  }
});

/** 🔹 NEW: Upload nhiều ảnh gallery (multiple) */
export const uploadPackageImages = createAsyncThunk('package/uploadPackageImages', async ({ id, formData }, { rejectWithValue }) => {
  try {
    console.log('📤 [Thunk] Upload package gallery images for:', id);
    const res = await servicePackageApi.uploadPackageImages(id, formData);
    return { 
      id, 
      imageUrls: res.fileUrls || res.imageUrls || res.urls || [] 
    };
  } catch (err) {
    console.error('❌ [Thunk] Lỗi uploadPackageImages:', err.response?.data || err);
    return rejectWithValue(err.response?.data);
  }
});

/** 🔹 NEW: Xóa ảnh khỏi gallery */
export const deletePackageImage = createAsyncThunk('package/deletePackageImage', async ({ id, imageUrl }, { rejectWithValue }) => {
  try {
    console.log('🗑️ [Thunk] Delete image:', imageUrl);
    //const res = await servicePackageApi.deletePackageImage(id, imageUrl);
    toast.success('Xóa ảnh thành công!');
    return { id, imageUrl };
  } catch (err) {
    console.error('❌ [Thunk] Lỗi deletePackageImage:', err.response?.data || err);
    toast.error(err.response?.data?.message || 'Không thể xóa ảnh.');
    return rejectWithValue(err.response?.data);
  }
});

const servicePackageSlice = createSlice({
  name: 'package',
  initialState: {
    packages: [],
    myPackages: [],
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      // 📦 GET ALL PACKAGES (Public)
      .addCase(getAllPackages.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getAllPackages.fulfilled, (state, action) => {
        state.loading = false;
        state.packages = action.payload;
      })
      .addCase(getAllPackages.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // 📦 GET MY PACKAGES
      .addCase(getMyPackages.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getMyPackages.fulfilled, (state, action) => {
        state.loading = false;
        state.myPackages = action.payload;
      })
      .addCase(getMyPackages.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // ➕ CREATE
      .addCase(createPackage.pending, (state) => {
        state.loading = true;
      })
      .addCase(createPackage.fulfilled, (state, action) => {
        state.loading = false;
        state.myPackages.push(action.payload);
      })
      .addCase(createPackage.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // ✏️ UPDATE
      .addCase(updatePackage.fulfilled, (state, action) => {
        const index = state.myPackages.findIndex(p => p._id === action.payload._id);
        if (index !== -1) state.myPackages[index] = action.payload;
      })

      // 🗑️ DELETE
      .addCase(deletePackage.fulfilled, (state, action) => {
        state.myPackages = state.myPackages.filter(pkg => pkg._id !== action.payload);
      })

      // 📸 UPLOAD COVER IMAGE
      .addCase(uploadPackageImage.fulfilled, (state, action) => {
        const pkg = state.myPackages.find(p => p._id === action.payload.id);
        if (pkg) pkg.AnhBia = action.payload.imageUrl;
      })

      // 📸 NEW: UPLOAD GALLERY IMAGES
      .addCase(uploadPackageImages.fulfilled, (state, action) => {
        const pkg = state.myPackages.find(p => p._id === action.payload.id);
        if (pkg) {
          if (!pkg.Images) pkg.Images = [];
          pkg.Images.push(...action.payload.imageUrls);
        }
      })

      // 🗑️ NEW: DELETE IMAGE
      .addCase(deletePackageImage.fulfilled, (state, action) => {
        const pkg = state.myPackages.find(p => p._id === action.payload.id);
        if (pkg && pkg.Images) {
          pkg.Images = pkg.Images.filter(img => img !== action.payload.imageUrl);
        }
      });
  },
});

export default servicePackageSlice.reducer;