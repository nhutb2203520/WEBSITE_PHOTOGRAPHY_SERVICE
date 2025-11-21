import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import orderApi from "../../apis/orderService";

export const fetchMyOrders = createAsyncThunk(
  "orders/fetchMyOrders",
  async () => {
    const res = await orderApi.getMyOrders();
    return res.data;
  }
);

const orderSlice = createSlice({
  name: "orders",
  initialState: {
    myOrders: [],
    loading: false,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchMyOrders.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchMyOrders.fulfilled, (state, action) => {
        state.loading = false;
        state.myOrders = action.payload;
      })
      .addCase(fetchMyOrders.rejected, (state) => {
        state.loading = false;
      });
  },
});

export default orderSlice.reducer;