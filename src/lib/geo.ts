export interface GeoLocation {
  city: string;
  district: string;
  state: string;
  pincode: string;
  lat: number;
  lng: number;
}

export const INDIAN_LOCATIONS_DATABASE: GeoLocation[] = [
  { city: 'New Delhi', district: 'New Delhi', state: 'Delhi', pincode: '110001', lat: 28.6139, lng: 77.2090 },
  { city: 'South Delhi', district: 'South Delhi', state: 'Delhi', pincode: '110017', lat: 28.5355, lng: 77.2185 },
  { city: 'Noida', district: 'Gautam Buddha Nagar', state: 'Uttar Pradesh', pincode: '201301', lat: 28.5355, lng: 77.3910 },
  { city: 'Gurugram', district: 'Gurugram', state: 'Haryana', pincode: '122001', lat: 28.4595, lng: 77.0266 },
  { city: 'Faridabad', district: 'Faridabad', state: 'Haryana', pincode: '121001', lat: 28.4089, lng: 77.3178 },
  { city: 'Ghaziabad', district: 'Ghaziabad', state: 'Uttar Pradesh', pincode: '201001', lat: 28.6692, lng: 77.4538 },
  { city: 'Mumbai', district: 'Mumbai City', state: 'Maharashtra', pincode: '400001', lat: 18.9388, lng: 72.8354 },
  { city: 'Andheri', district: 'Mumbai Suburban', state: 'Maharashtra', pincode: '400053', lat: 19.1197, lng: 72.8464 },
  { city: 'Thane', district: 'Thane', state: 'Maharashtra', pincode: '400601', lat: 19.2183, lng: 72.9781 },
  { city: 'Navi Mumbai', district: 'Thane', state: 'Maharashtra', pincode: '400703', lat: 19.0330, lng: 73.0297 },
  { city: 'Pune', district: 'Pune', state: 'Maharashtra', pincode: '411001', lat: 18.5204, lng: 73.8567 },
  { city: 'Nagpur', district: 'Nagpur', state: 'Maharashtra', pincode: '440001', lat: 21.1458, lng: 79.0882 },
  { city: 'Bengaluru', district: 'Bengaluru Urban', state: 'Karnataka', pincode: '560001', lat: 12.9716, lng: 77.5946 },
  { city: 'Whitefield', district: 'Bengaluru Urban', state: 'Karnataka', pincode: '560066', lat: 12.9698, lng: 77.7500 },
  { city: 'Hyderabad', district: 'Hyderabad', state: 'Telangana', pincode: '500001', lat: 17.3850, lng: 78.4867 },
  { city: 'Cyberabad', district: 'Rangareddy', state: 'Telangana', pincode: '500081', lat: 17.4435, lng: 78.3772 },
  { city: 'Chennai', district: 'Chennai', state: 'Tamil Nadu', pincode: '600001', lat: 13.0827, lng: 80.2707 },
  { city: 'Kolkata', district: 'Kolkata', state: 'West Bengal', pincode: '700001', lat: 22.5726, lng: 88.3639 },
  { city: 'Ahmedabad', district: 'Ahmedabad', state: 'Gujarat', pincode: '380001', lat: 23.0225, lng: 72.5714 },
  { city: 'Surat', district: 'Surat', state: 'Gujarat', pincode: '395001', lat: 21.1702, lng: 72.8311 },
  { city: 'Jaipur', district: 'Jaipur', state: 'Rajasthan', pincode: '302001', lat: 26.9124, lng: 75.7873 },
  { city: 'Lucknow', district: 'Lucknow', state: 'Uttar Pradesh', pincode: '226001', lat: 26.8467, lng: 80.9462 },
  { city: 'Kanpur', district: 'Kanpur Nagar', state: 'Uttar Pradesh', pincode: '208001', lat: 26.4499, lng: 80.3319 },
  { city: 'Patna', district: 'Patna', state: 'Bihar', pincode: '800001', lat: 25.5941, lng: 85.1376 },
  { city: 'Bhopal', district: 'Bhopal', state: 'Madhya Pradesh', pincode: '462001', lat: 23.2599, lng: 77.4126 },
  { city: 'Indore', district: 'Indore', state: 'Madhya Pradesh', pincode: '452001', lat: 22.7196, lng: 75.8577 },
  { city: 'Chandigarh', district: 'Chandigarh', state: 'Chandigarh', pincode: '160017', lat: 30.7333, lng: 76.7794 },
  { city: 'Ludhiana', district: 'Ludhiana', state: 'Punjab', pincode: '141001', lat: 30.9010, lng: 75.8573 },
  { city: 'Kochi', district: 'Ernakulam', state: 'Kerala', pincode: '682001', lat: 9.9312, lng: 76.2673 },
  { city: 'Thiruvananthapuram', district: 'Thiruvananthapuram', state: 'Kerala', pincode: '695001', lat: 8.5241, lng: 76.9366 },
  { city: 'Guwahati', district: 'Kamrup Metropolitan', state: 'Assam', pincode: '781001', lat: 26.1445, lng: 91.7362 },
  { city: 'Bhubaneswar', district: 'Khordha', state: 'Odisha', pincode: '751001', lat: 20.2961, lng: 85.8245 },
  { city: 'Ranchi', district: 'Ranchi', state: 'Jharkhand', pincode: '834001', lat: 23.3441, lng: 85.3096 },
  { city: 'Dehradun', district: 'Dehradun', state: 'Uttarakhand', pincode: '248001', lat: 30.3165, lng: 78.0322 },
  { city: 'Raipur', district: 'Raipur', state: 'Chhattisgarh', pincode: '492001', lat: 21.2514, lng: 81.6296 },
  { city: 'Goa (Panaji)', district: 'North Goa', state: 'Goa', pincode: '403001', lat: 15.4909, lng: 73.8278 }
];

/**
 * Haversine formula to compute distance between two latitude/longitude points in kilometers
 */
export function calculateDistance(
  lat1?: number,
  lon1?: number,
  lat2?: number,
  lon2?: number
): number | null {
  if (
    lat1 === undefined ||
    lon1 === undefined ||
    lat2 === undefined ||
    lon2 === undefined
  ) {
    return null;
  }

  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c;
  return Math.round(d * 10) / 10;
}

/**
 * Finds the nearest matching Indian location from the database
 */
export function getNearestIndianLocation(lat: number, lng: number): GeoLocation {
  let closest = INDIAN_LOCATIONS_DATABASE[0];
  let minDistance = Infinity;

  for (const loc of INDIAN_LOCATIONS_DATABASE) {
    const dist = calculateDistance(lat, lng, loc.lat, loc.lng) || Infinity;
    if (dist < minDistance) {
      minDistance = dist;
      closest = loc;
    }
  }

  return {
    ...closest,
    lat,
    lng
  };
}

/**
 * Browser GPS location fetcher
 */
export function getCurrentBrowserCoordinates(): Promise<{ lat: number; lng: number }> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported by your browser'));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          lat: position.coords.latitude,
          lng: position.coords.longitude
        });
      },
      (error) => {
        reject(error);
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  });
}
