import React, { useState, useEffect } from 'react';
import {
  MapPin,
  Search,
  Navigation,
  X,
  CheckCircle2,
  Compass,
  RefreshCw,
  ArrowRight,
  Building2,
  User
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { UserRole, SearchRadiusKm, INDIAN_STATES_AND_UTS } from '../../types';
import { LocationPicker } from './LocationPicker';

interface ChangeLocationModalProps {
  isOpen: boolean;
  onClose: () => void;
  role: UserRole;
  onLocationUpdated?: (summary: string) => void;
}

interface CityPreset {
  city: string;
  district: string;
  state: string;
  pincode: string;
  lat: number;
  lng: number;
}

const POPULAR_INDIAN_CITIES: CityPreset[] = [
  { city: 'Delhi NCR', district: 'New Delhi', state: 'Delhi', pincode: '110001', lat: 28.6139, lng: 77.209 },
  { city: 'Mumbai', district: 'Mumbai Suburban', state: 'Maharashtra', pincode: '400001', lat: 19.076, lng: 72.8777 },
  { city: 'Bengaluru', district: 'Bengaluru Urban', state: 'Karnataka', pincode: '560001', lat: 12.9716, lng: 77.5946 },
  { city: 'Hyderabad', district: 'Hyderabad', state: 'Telangana', pincode: '500001', lat: 17.385, lng: 78.4867 },
  { city: 'Pune', district: 'Pune', state: 'Maharashtra', pincode: '411001', lat: 18.5204, lng: 73.8567 },
  { city: 'Chennai', district: 'Chennai', state: 'Tamil Nadu', pincode: '600001', lat: 13.0827, lng: 80.2707 },
  { city: 'Ahmedabad', district: 'Ahmedabad', state: 'Gujarat', pincode: '380001', lat: 23.0225, lng: 72.5714 },
  { city: 'Jaipur', district: 'Jaipur', state: 'Rajasthan', pincode: '302001', lat: 26.9124, lng: 75.7873 },
  { city: 'Surat', district: 'Surat', state: 'Gujarat', pincode: '395003', lat: 21.1702, lng: 72.8311 },
  { city: 'Lucknow', district: 'Lucknow', state: 'Uttar Pradesh', pincode: '226001', lat: 26.8467, lng: 80.9462 },
  { city: 'Indore', district: 'Indore', state: 'Madhya Pradesh', pincode: '452001', lat: 22.7196, lng: 75.8577 },
  { city: 'Patna', district: 'Patna', state: 'Bihar', pincode: '800001', lat: 25.5941, lng: 85.1376 },
  { city: 'Kolkata', district: 'Kolkata', state: 'West Bengal', pincode: '700001', lat: 22.5726, lng: 88.3639 },
  { city: 'Chandigarh', district: 'Chandigarh', state: 'Chandigarh', pincode: '160001', lat: 30.7333, lng: 76.7794 },
  { city: 'Nagpur', district: 'Nagpur', state: 'Maharashtra', pincode: '440001', lat: 21.1458, lng: 79.0882 },
  { city: 'Kochi', district: 'Ernakulam', state: 'Kerala', pincode: '682001', lat: 9.9312, lng: 76.2673 }
];

const RADIUS_OPTIONS: SearchRadiusKm[] = [5, 10, 25, 50, 100];

export const ChangeLocationModal: React.FC<ChangeLocationModalProps> = ({
  isOpen,
  onClose,
  role,
  onLocationUpdated
}) => {
  const { workerProfile, employerProfile, updateUserLocation } = useAuth();

  const [state, setState] = useState('');
  const [district, setDistrict] = useState('');
  const [city, setCity] = useState('');
  const [area, setArea] = useState('');
  const [pincode, setPincode] = useState('');
  const [address, setAddress] = useState('');
  const [lat, setLat] = useState<number | undefined>(undefined);
  const [lng, setLng] = useState<number | undefined>(undefined);
  const [searchRadiusKm, setSearchRadiusKm] = useState<SearchRadiusKm>(50);
  const [addToPreferred, setAddToPreferred] = useState(true);

  const [cityQuery, setCityQuery] = useState('');
  const [searchResults, setSearchResults] = useState<
    Array<{
      displayName: string;
      city: string;
      district: string;
      state: string;
      pincode: string;
      lat: number;
      lng: number;
    }>
  >([]);
  const [searching, setSearching] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    setErrorMsg('');
    setSearchResults([]);
    setCityQuery('');
    if (role === 'worker') {
      setState(workerProfile?.state || '');
      setDistrict(workerProfile?.district || '');
      setCity(workerProfile?.city || '');
      setArea(workerProfile?.area || '');
      setPincode(workerProfile?.pincode || '');
      setAddress(workerProfile?.currentAddress || '');
      setLat(workerProfile?.lat);
      setLng(workerProfile?.lng);
      setSearchRadiusKm(workerProfile?.jobPreferences?.preferredSearchRadiusKm || 50);
    } else {
      setState(employerProfile?.state || '');
      setDistrict(employerProfile?.district || '');
      setCity(employerProfile?.city || '');
      setArea(employerProfile?.area || '');
      setPincode(employerProfile?.pincode || '');
      setAddress(employerProfile?.businessAddress || employerProfile?.worksiteLocation || '');
      setLat(employerProfile?.lat);
      setLng(employerProfile?.lng);
      setSearchRadiusKm(employerProfile?.discoveryRadiusKm || 50);
    }
  }, [isOpen, role, workerProfile, employerProfile]);

  if (!isOpen) return null;

  const matchIndianState = (raw?: string) => {
    if (!raw) return '';
    const cleaned = raw.trim().toLowerCase();
    return (
      INDIAN_STATES_AND_UTS.find(
        (s) =>
          s.toLowerCase() === cleaned ||
          cleaned.includes(s.toLowerCase()) ||
          s.toLowerCase().includes(cleaned)
      ) || raw
    );
  };

  const handleSearchCity = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const q = cityQuery.trim();
    if (!q) return;
    setSearching(true);
    setErrorMsg('');
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&countrycodes=in&addressdetails=1&limit=5&q=${encodeURIComponent(
          q
        )}`,
        { headers: { 'Accept-Language': 'en' } }
      );
      if (!res.ok) throw new Error('Search service unavailable');
      const data = await res.json();
      const mapped = (data || []).map((item: any) => {
        const addr = item.address || {};
        return {
          displayName: item.display_name,
          city:
            addr.city ||
            addr.town ||
            addr.village ||
            addr.municipality ||
            addr.state_district ||
            q,
          district: (addr.state_district || addr.county || addr.city_district || '').replace(
            / District$/i,
            ''
          ),
          state: matchIndianState(addr.state || addr.region),
          pincode: addr.postcode ? String(addr.postcode).replace(/\D/g, '').slice(0, 6) : '',
          lat: parseFloat(item.lat),
          lng: parseFloat(item.lon)
        };
      });
      if (mapped.length === 0) {
        setErrorMsg(`No exact location matched "${q}" in India. Try tapping your new city on the map below or selecting a quick city.`);
      }
      setSearchResults(mapped);
    } catch {
      setErrorMsg('Could not reach live city search. Please select from Popular Cities or tap on the Indian map below.');
    } finally {
      setSearching(false);
    }
  };

  const applyPresetOrResult = (loc: {
    city: string;
    district: string;
    state: string;
    pincode: string;
    lat: number;
    lng: number;
  }) => {
    setCity(loc.city);
    setDistrict(loc.district || loc.city);
    if (loc.state) setState(loc.state);
    if (loc.pincode) setPincode(loc.pincode);
    setLat(loc.lat);
    setLng(loc.lng);
    setAddress(`${loc.city}${loc.state ? `, ${loc.state}` : ''}`);
    setSearchResults([]);
    setErrorMsg('');
  };

  const currentCityLabel =
    role === 'worker'
      ? [workerProfile?.city, workerProfile?.state].filter(Boolean).join(', ')
      : [employerProfile?.city, employerProfile?.state].filter(Boolean).join(', ');

  const handleSaveNewLocation = async () => {
    setErrorMsg('');
    if (!state.trim()) {
      setErrorMsg('Please select your new State / Union Territory.');
      return;
    }
    if (!city.trim()) {
      setErrorMsg('Please enter your new City, Town, or Village.');
      return;
    }
    if (!pincode.trim() || !/^\d{6}$/.test(pincode.trim())) {
      setErrorMsg('Please enter a valid 6-digit Indian PIN Code for accurate nearby matching.');
      return;
    }

    setSaving(true);
    try {
      await updateUserLocation(role, {
        state: state.trim(),
        district: district.trim(),
        city: city.trim(),
        area: area.trim(),
        pincode: pincode.trim(),
        address: address.trim(),
        lat,
        lng,
        searchRadiusKm,
        addToPreferredLocations: addToPreferred
      });
      const summary = `${city.trim()}, ${state.trim()} (${pincode.trim()})`;
      onLocationUpdated?.(summary);
      onClose();
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to update location. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="bg-white w-full max-w-3xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-auto max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-slate-900 px-6 py-5 text-white flex items-start justify-between gap-4 shrink-0">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full bg-white/15 text-[10px] font-black uppercase tracking-wider flex items-center gap-1">
                {role === 'worker' ? <User className="w-3 h-3" /> : <Building2 className="w-3 h-3" />}
                {role === 'worker' ? 'City Shift & Job Radar Update' : 'Relocate Business / Worksite Location'}
              </span>
              {currentCityLabel && (
                <span className="px-2.5 py-0.5 rounded-full bg-amber-400/20 text-amber-200 text-[10px] font-bold">
                  Current: {currentCityLabel}
                </span>
              )}
            </div>
            <h2 className="text-lg sm:text-xl font-black tracking-tight">
              Shifted to Another City? Change Your Location
            </h2>
            <p className="text-xs text-blue-100 mt-0.5">
              {role === 'worker'
                ? 'Update your city, PIN code, or GPS pin to immediately see verified jobs within 5–100 km of your new city.'
                : 'Move your worksite or company hub to a new city so local skilled workers near your new site can find you.'}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white cursor-pointer transition-colors"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5 flex-1">
          {errorMsg && (
            <div className="p-3.5 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold flex items-center justify-between gap-2">
              <span>{errorMsg}</span>
              <button type="button" onClick={() => setErrorMsg('')} className="cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* City Search Bar */}
          <form onSubmit={handleSearchCity} className="space-y-2">
            <label className="block text-xs font-extrabold text-slate-800">
              Search Your New City, Area, or PIN Code in India
            </label>
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={cityQuery}
                  onChange={(e) => setCityQuery(e.target.value)}
                  placeholder="Type city or locality (e.g. Pune, Indore, Noida Sector 62, 302001)..."
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 focus:border-[#2563EB] outline-none text-sm font-medium"
                />
              </div>
              <button
                type="submit"
                disabled={searching}
                className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-60 shrink-0"
              >
                {searching ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Searching...</span>
                  </>
                ) : (
                  <>
                    <Compass className="w-3.5 h-3.5 text-amber-400" />
                    <span>Find City</span>
                  </>
                )}
              </button>
            </div>

            {searchResults.length > 0 && (
              <div className="bg-blue-50/70 border border-blue-200 rounded-2xl p-2 space-y-1.5">
                <p className="text-[11px] font-bold text-blue-900 px-2 pt-1">
                  Select a matching location to pin:
                </p>
                {searchResults.map((item, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => applyPresetOrResult(item)}
                    className="w-full text-left px-3 py-2 rounded-xl bg-white hover:bg-blue-100/70 border border-blue-100 text-xs flex items-center justify-between gap-2 cursor-pointer transition-colors"
                  >
                    <span className="font-semibold text-slate-800 truncate">{item.displayName}</span>
                    <span className="text-[11px] font-bold text-[#2563EB] shrink-0">Select &rarr;</span>
                  </button>
                ))}
              </div>
            )}
          </form>

          {/* Quick Popular Indian Cities */}
          <div className="space-y-2">
            <span className="block text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Quick Switch to Major Indian Cities
            </span>
            <div className="flex flex-wrap gap-1.5">
              {POPULAR_INDIAN_CITIES.map((preset) => {
                const isSelected = city.toLowerCase() === preset.city.toLowerCase();
                return (
                  <button
                    key={preset.city}
                    type="button"
                    onClick={() => applyPresetOrResult(preset)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-[#2563EB] text-white border-[#2563EB] shadow-xs'
                        : 'bg-slate-50 hover:bg-blue-50 text-slate-700 border-slate-200'
                    }`}
                  >
                    {preset.city}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Interactive Map Pin + GPS + Manual Fields */}
          <LocationPicker
            state={state}
            setState={setState}
            district={district}
            setDistrict={setDistrict}
            city={city}
            setCity={setCity}
            area={area}
            setArea={setArea}
            pincode={pincode}
            setPincode={setPincode}
            lat={lat}
            lng={lng}
            onCoordinatesChange={(newLat, newLng) => {
              setLat(newLat);
              setLng(newLng);
            }}
          />

          {/* Full Street / Residence / Worksite Address & Discovery Radius */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {role === 'worker' ? 'New Local Residence / Landmark Address' : 'New Worksite / Office Address'}
              </label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="House / Plot No., Street, Near Landmark"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:border-[#2563EB] outline-none text-sm font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Preferred Search Radius Around New City
              </label>
              <div className="flex flex-wrap gap-1.5 pt-1">
                {RADIUS_OPTIONS.map((km) => (
                  <button
                    key={km}
                    type="button"
                    onClick={() => setSearchRadiusKm(km)}
                    className={`px-3 py-2 rounded-xl text-xs font-extrabold border transition-all cursor-pointer ${
                      searchRadiusKm === km
                        ? 'bg-amber-500 text-slate-950 border-amber-500 shadow-xs'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {km} KM
                  </button>
                ))}
              </div>
            </div>
          </div>

          {role === 'worker' && (
            <label className="flex items-center gap-2.5 p-3 rounded-2xl bg-blue-50/70 border border-blue-100 text-xs font-semibold text-slate-800 cursor-pointer">
              <input
                type="checkbox"
                checked={addToPreferred}
                onChange={(e) => setAddToPreferred(e.target.checked)}
                className="rounded-sm accent-[#2563EB]"
              />
              <span>
                Also add <strong>{city || 'this new city'}</strong> to my Preferred Job Locations list
              </span>
            </label>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="text-xs text-slate-600 flex items-center gap-1.5">
            <MapPin className="w-4 h-4 text-[#2563EB]" />
            <span>
              New City:{' '}
              <strong className="text-slate-900">
                {city ? `${city}${state ? `, ${state}` : ''}` : state || 'Not selected yet'}
                {pincode ? ` (${pincode})` : ''}
              </strong>
            </span>
          </div>

          <div className="flex items-center gap-2.5 ml-auto">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 font-bold text-xs cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSaveNewLocation}
              disabled={saving}
              className="px-6 py-2.5 rounded-xl bg-[#2563EB] hover:bg-blue-700 text-white font-extrabold text-xs shadow-md flex items-center gap-2 cursor-pointer disabled:opacity-60"
            >
              {saving ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Updating Location...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Save New Location & Refresh Radar</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
