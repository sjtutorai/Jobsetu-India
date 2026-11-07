import React, { useState, useEffect, useRef, useCallback } from 'react';
import L from 'leaflet';
import {
  MapPin,
  Navigation,
  Search,
  Globe,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Compass,
  Smartphone
} from 'lucide-react';
import {
  INDIAN_STATES_AND_UTS
} from '../../types';
import {
  getCurrentBrowserCoordinates
} from '../../lib/geo';

interface LocationPickerProps {
  state: string;
  setState: (val: string) => void;
  district: string;
  setDistrict: (val: string) => void;
  city: string;
  setCity: (val: string) => void;
  area: string;
  setArea: (val: string) => void;
  pincode: string;
  setPincode: (val: string) => void;
  lat?: number;
  lng?: number;
  onCoordinatesChange?: (lat: number, lng: number) => void;
}

// Geographic center and bounds of India
const INDIA_CENTER: [number, number] = [20.5937, 78.9629];
const INDIA_BOUNDS: L.LatLngBoundsExpression = [
  [6.5546, 68.1113], // Southwest India
  [35.6745, 97.3956] // Northeast India
];

export const LocationPicker: React.FC<LocationPickerProps> = ({
  state,
  setState,
  district,
  setDistrict,
  city,
  setCity,
  area,
  setArea,
  pincode,
  setPincode,
  lat,
  lng,
  onCoordinatesChange
}) => {
  const [mode, setMode] = useState<'map' | 'gps' | 'manual'>('map');
  const [gpsLoading, setGpsLoading] = useState(false);
  const [reverseGeoLoading, setReverseGeoLoading] = useState(false);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [permissionStatus, setPermissionStatus] = useState<'prompt' | 'granted' | 'denied'>('prompt');
  const [stateSearch, setStateSearch] = useState('');

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const hasAutoPromptedRef = useRef(false);

  const hasValidCoords = typeof lat === 'number' && typeof lng === 'number' && !isNaN(lat) && !isNaN(lng);

  // Match an OSM state name to our official INDIAN_STATES_AND_UTS list
  const matchIndianState = useCallback((rawState?: string): string => {
    if (!rawState) return '';
    const cleaned = rawState.trim().toLowerCase();
    const exactOrPartial = INDIAN_STATES_AND_UTS.find(
      (s) =>
        s.toLowerCase() === cleaned ||
        cleaned.includes(s.toLowerCase()) ||
        s.toLowerCase().includes(cleaned)
    );
    return exactOrPartial || rawState;
  }, []);

  // Reverse geocode coordinates from pin selection or live GPS
  const reverseGeocodeCoordinates = useCallback(
    async (latitude: number, longitude: number) => {
      try {
        setReverseGeoLoading(true);
        const response = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`,
          {
            headers: {
              'Accept-Language': 'en'
            }
          }
        );
        if (!response.ok) return;
        const data = await response.json();
        const addr = data?.address;
        if (addr) {
          const detectedState = matchIndianState(addr.state || addr.state_district || addr.region);
          const detectedDistrict =
            addr.state_district || addr.county || addr.city_district || addr.town || '';
          const detectedCity =
            addr.city || addr.town || addr.village || addr.municipality || addr.suburb || '';
          const detectedArea =
            addr.suburb || addr.neighbourhood || addr.residential || addr.road || addr.hamlet || '';
          const detectedPostcode = addr.postcode ? String(addr.postcode).replace(/\D/g, '').slice(0, 6) : '';

          if (detectedState) setState(detectedState);
          if (detectedDistrict) setDistrict(detectedDistrict.replace(/ District$/i, ''));
          if (detectedCity) setCity(detectedCity);
          if (detectedArea) setArea(detectedArea);
          if (detectedPostcode && detectedPostcode.length === 6) setPincode(detectedPostcode);
        }
      } catch (err) {
        console.warn('Reverse geocoding failed:', err);
      } finally {
        setReverseGeoLoading(false);
      }
    },
    [matchIndianState, setState, setDistrict, setCity, setArea, setPincode]
  );

  const handleSelectCoordinates = useCallback(
    (newLat: number, newLng: number) => {
      if (onCoordinatesChange) {
        onCoordinatesChange(newLat, newLng);
      }
      reverseGeocodeCoordinates(newLat, newLng);
    },
    [onCoordinatesChange, reverseGeocodeCoordinates]
  );

  const handleUseCurrentLocation = useCallback(async () => {
    try {
      setGpsLoading(true);
      setGpsError(null);
      const coords = await getCurrentBrowserCoordinates();
      setPermissionStatus('granted');
      handleSelectCoordinates(coords.lat, coords.lng);
    } catch (err: any) {
      console.warn('GPS location error:', err);
      setPermissionStatus('denied');
      setGpsError(
        'Location permission was not granted or GPS signal is unavailable. Please allow location access in your browser/mobile settings, or tap directly on the Indian map below to place your pin.'
      );
    } finally {
      setGpsLoading(false);
    }
  }, [handleSelectCoordinates]);

  // Automatically check/request user location permission on mount if no coordinates exist yet
  useEffect(() => {
    if (hasAutoPromptedRef.current) return;
    hasAutoPromptedRef.current = true;

    if (typeof navigator !== 'undefined' && 'permissions' in navigator) {
      navigator.permissions
        .query({ name: 'geolocation' as PermissionName })
        .then((res) => {
          setPermissionStatus(res.state);
          if (res.state === 'granted' && !hasValidCoords) {
            handleUseCurrentLocation();
          }
          res.onchange = () => {
            setPermissionStatus(res.state);
          };
        })
        .catch(() => {
          // Fallback if Permissions API not supported on mobile WebView
          if (!hasValidCoords) {
            handleUseCurrentLocation();
          }
        });
    } else if (!hasValidCoords) {
      handleUseCurrentLocation();
    }
  }, [hasValidCoords, handleUseCurrentLocation]);

  // Initialize Interactive Indian Map when in 'map' mode
  useEffect(() => {
    if (mode !== 'map' || !mapContainerRef.current) return;

    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
      markerRef.current = null;
    }

    const initialCenter: [number, number] = hasValidCoords ? [lat!, lng!] : INDIA_CENTER;
    const initialZoom = hasValidCoords ? 13 : 5;

    const map = L.map(mapContainerRef.current, {
      center: initialCenter,
      zoom: initialZoom,
      minZoom: 4,
      maxBounds: INDIA_BOUNDS,
      maxBoundsViscosity: 0.8,
      zoomControl: false,
      attributionControl: false
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19
    }).addTo(map);

    L.control
      .attribution({ position: 'bottomright', prefix: 'Leaflet | © OpenStreetMap India' })
      .addTo(map);

    L.control.zoom({ position: 'topright' }).addTo(map);

    // Click anywhere on the map to drop/move the pin
    map.on('click', (e: L.LeafletMouseEvent) => {
      handleSelectCoordinates(e.latlng.lat, e.latlng.lng);
    });

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
      markerRef.current = null;
    };
  }, [mode]);

  // Update pin marker on the Indian Map whenever lat/lng change
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || mode !== 'map') return;

    if (hasValidCoords) {
      const pinIcon = L.divIcon({
        className: 'custom-india-pin',
        html: `
          <div style="position: relative; display: flex; flex-direction: column; align-items: center; transform: translateY(-14px);">
            <div style="width: 34px; height: 34px; background: #2563EB; border: 3px solid #ffffff; border-radius: 50% 50% 50% 0; transform: rotate(-45deg); box-shadow: 0 6px 14px rgba(37,99,235,0.45); display: flex; align-items: center; justify-content: center;">
              <div style="width: 10px; height: 10px; background: #ffffff; border-radius: 50%; transform: rotate(45deg);"></div>
            </div>
          </div>
        `,
        iconSize: [34, 34],
        iconAnchor: [17, 32]
      });

      if (markerRef.current) {
        markerRef.current.setLatLng([lat!, lng!]);
      } else {
        const marker = L.marker([lat!, lng!], {
          icon: pinIcon,
          draggable: true
        }).addTo(map);

        marker.on('dragend', () => {
          const pos = marker.getLatLng();
          handleSelectCoordinates(pos.lat, pos.lng);
        });

        markerRef.current = marker;
      }

      map.setView([lat!, lng!], Math.max(map.getZoom(), 13), { animate: true });
    } else if (markerRef.current) {
      markerRef.current.remove();
      markerRef.current = null;
    }
  }, [lat, lng, hasValidCoords, mode, handleSelectCoordinates]);

  const filteredStates = INDIAN_STATES_AND_UTS.filter((s) =>
    s.toLowerCase().includes(stateSearch.toLowerCase())
  );

  return (
    <div className="space-y-4">
      {/* Web & Mobile Location Permission Prompt Banner */}
      <div className="p-3.5 rounded-2xl bg-gradient-to-r from-blue-50 via-indigo-50/70 to-emerald-50/60 border border-blue-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#2563EB] text-white flex items-center justify-center shrink-0 shadow-xs">
            <Smartphone className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-xs font-extrabold text-gray-900">
                Allow Location Permission (Web & Mobile App)
              </h4>
              {permissionStatus === 'granted' && hasValidCoords && (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                  <CheckCircle2 className="w-3 h-3" /> Detected
                </span>
              )}
            </div>
            <p className="text-[11px] text-gray-600 mt-0.5">
              Grant device GPS permission to auto-detect your location, or tap anywhere on the Indian map below to drop your pin.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleUseCurrentLocation}
          disabled={gpsLoading}
          className="py-2 px-4 rounded-xl bg-[#2563EB] hover:bg-blue-700 text-white font-bold text-xs shadow-sm transition-all inline-flex items-center justify-center gap-1.5 shrink-0 cursor-pointer disabled:opacity-60"
        >
          {gpsLoading ? (
            <>
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              <span>Detecting GPS...</span>
            </>
          ) : (
            <>
              <Navigation className="w-3.5 h-3.5" />
              <span>{hasValidCoords ? 'Refresh GPS' : 'Allow Location Access'}</span>
            </>
          )}
        </button>
      </div>

      {gpsError && (
        <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-start gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-amber-600" />
          <span>{gpsError}</span>
        </div>
      )}

      {/* Mode Switcher */}
      <div className="flex p-1 rounded-xl bg-gray-100 border border-gray-200">
        <button
          type="button"
          onClick={() => setMode('map')}
          className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
            mode === 'map'
              ? 'bg-white text-[#2563EB] shadow-xs'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <Compass className="w-4 h-4" />
          <span>Pin on Indian Map</span>
        </button>
        <button
          type="button"
          onClick={() => {
            setMode('gps');
            handleUseCurrentLocation();
          }}
          className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
            mode === 'gps'
              ? 'bg-white text-[#2563EB] shadow-xs'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <Navigation className="w-4 h-4 text-emerald-600" />
          <span>Detect Live GPS</span>
        </button>
        <button
          type="button"
          onClick={() => setMode('manual')}
          className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
            mode === 'manual'
              ? 'bg-white text-[#2563EB] shadow-xs'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <Globe className="w-4 h-4" />
          <span>Enter Manually</span>
        </button>
      </div>

      {/* Mode 1: Real Interactive Indian Map with Pin Selection */}
      {mode === 'map' && (
        <div className="rounded-2xl border-2 border-blue-100 bg-white p-3 space-y-2.5 shadow-xs">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-[#2563EB]" />
              <span className="text-xs font-bold text-gray-900">
                Tap anywhere on the Indian Map to place or drag your location pin
              </span>
            </div>
            {reverseGeoLoading ? (
              <span className="text-[11px] font-semibold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                <RefreshCw className="w-3 h-3 animate-spin" /> Fetching address...
              </span>
            ) : hasValidCoords ? (
              <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                Pin: {city ? `${city}${state ? `, ${state}` : ''}` : `${lat!.toFixed(4)}° N, ${lng!.toFixed(4)}° E`}
              </span>
            ) : (
              <span className="text-[11px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-0.5 rounded-full">
                No pin selected yet — tap on the map
              </span>
            )}
          </div>

          {/* Interactive Leaflet Map of India */}
          <div className="relative w-full h-72 rounded-xl overflow-hidden border border-gray-300 shadow-inner">
            <div ref={mapContainerRef} className="w-full h-full z-0" />
          </div>
        </div>
      )}

      {/* Mode 2: Live Device Geolocation */}
      {mode === 'gps' && (
        <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200 text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto shadow-xs">
            <Navigation className="w-6 h-6" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-gray-900">Live Web & Mobile GPS Detection</h4>
            <p className="text-xs text-gray-600 mt-0.5">
              Detects your exact coordinates from your browser or mobile phone to match opportunities within 50 km.
            </p>
            {hasValidCoords && (
              <p className="text-xs font-bold text-emerald-800 mt-1.5">
                Current Pin: {lat!.toFixed(4)}° N, {lng!.toFixed(4)}° E {city ? `(${city}, ${state})` : ''}
              </p>
            )}
          </div>

          <button
            type="button"
            onClick={handleUseCurrentLocation}
            disabled={gpsLoading}
            className="py-2.5 px-5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition-all inline-flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {gpsLoading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Locating Device...</span>
              </>
            ) : (
              <>
                <Navigation className="w-4 h-4" />
                <span>Detect My Exact GPS Location</span>
              </>
            )}
          </button>
        </div>
      )}

      {/* Manual and Synchronized Address Fields */}
      <div className="space-y-4 pt-1">
        {/* State */}
        <div>
          <label className="block text-xs font-bold text-gray-700 mb-1">
            State / Union Territory <span className="text-red-500">*</span>
          </label>
          {mode === 'manual' && (
            <div className="relative mb-2">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
              <input
                type="text"
                value={stateSearch}
                onChange={(e) => setStateSearch(e.target.value)}
                placeholder="Search state..."
                className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-gray-200 outline-none focus:border-[#2563EB]"
              />
            </div>
          )}
          <select
            value={state}
            onChange={(e) => setState(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:border-[#2563EB] outline-none text-sm bg-white font-medium"
          >
            <option value="">Select State / Union Territory</option>
            {filteredStates.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>

        {/* District & City */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">District</label>
            <input
              type="text"
              value={district}
              onChange={(e) => setDistrict(e.target.value)}
              placeholder="Enter your district"
              className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:border-[#2563EB] outline-none text-sm font-medium"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">City / Town / Village</label>
            <input
              type="text"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="Enter your city, town, or village"
              className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:border-[#2563EB] outline-none text-sm font-medium"
            />
          </div>
        </div>

        {/* Area & PIN Code */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Area / Locality / Sector</label>
            <input
              type="text"
              value={area}
              onChange={(e) => setArea(e.target.value)}
              placeholder="Enter locality or street area"
              className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:border-[#2563EB] outline-none text-sm font-medium"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">
              6-Digit Indian PIN Code <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              maxLength={6}
              value={pincode}
              onChange={(e) => setPincode(e.target.value.replace(/\D/g, ''))}
              placeholder="6-digit PIN code"
              className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:border-[#2563EB] outline-none text-sm font-bold tracking-wider"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
