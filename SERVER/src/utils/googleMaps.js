// Backend: Tạo file utils/googleMaps.js
import axios from 'axios';

const GOOGLE_API_KEY = process.env.GOOGLE_MAPS_API_KEY;

export const getDistanceMatrix = async (origin, destination) => {
  const url = `https://maps.googleapis.com/maps/api/distancematrix/json`;
  
  const response = await axios.get(url, {
    params: {
      origins: `${origin.lat},${origin.lng}`,
      destinations: `${destination.lat},${destination.lng}`,
      key: GOOGLE_API_KEY,
      mode: 'driving'
    }
  });
  
  const element = response.data.rows[0]?.elements[0];
  
  if (element?.status === 'OK') {
    return {
      distance_km: element.distance.value / 1000,
      duration_minutes: element.duration.value / 60
    };
  }
  
  throw new Error('Không thể tính khoảng cách');
};