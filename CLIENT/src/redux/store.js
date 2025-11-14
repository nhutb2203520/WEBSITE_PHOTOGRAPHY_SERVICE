import { configureStore } from '@reduxjs/toolkit';
import authReducer from './Slices/authSlice';
import userReducer from './Slices/userSlice';
import servicePackageReducer from './Slices/servicepackageSlice';
const store = configureStore({
  reducer: {
    auth: authReducer,
    user: userReducer,
     package: servicePackageReducer,
  },
});

export default store; 
