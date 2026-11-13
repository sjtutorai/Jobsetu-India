import React, { useState, useMemo, useEffect } from 'react';
import { useJobs } from '../../context/JobContext';
import { useAuth } from '../../context/AuthContext';
import { Job, SKILL_CATEGORIES_DATA } from '../../types';
import { calculateDistance } from '../../lib/geo';
import { InteractiveMapView, MapMarkerItem } from './InteractiveMapView';
import { ChangeLocationModal } from '../common/ChangeLocationModal';
import {
  MapPin,
  Search,
  Filter,
  Navigation,
  Briefcase,
  Building2,
  Calendar,
  Clock,
  IndianRupee,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
  Layers,
  ArrowRight,
  Sliders,
  Compass,
  AlertCircle
} from 'lucide-react';

interface JobsNearMeViewProps {
  onApplyJob: (job: Job) => void;
  onSaveJob?: (jobId: string) => void;
  savedJobIds?: string[];
}

export const JobsNearMeView: React.FC<JobsNearMeViewProps> = ({
  onApplyJob,
  onSaveJob,
  savedJobIds = []
}) => {
  const { jobs } = useJobs();
  const { currentUser, workerProfile } = useAuth();

  // Location resolution: Worker saved GPS or India center until GPS/pin is selected
  const defaultLat = workerProfile?.lat || 20.5937;
  const defaultLng = workerProfile?.lng || 78.9629;

  const [centerLat, setCenterLat] = useState<number>(defaultLat);
  const [centerLng, setCenterLng] = useState<number>(defaultLng);
  const [locationName, setLocationName] = useState<string>(
    workerProfile?.city
      ? `${workerProfile.city}${workerProfile.state ? `, ${workerProfile.state}` : ''}`
      : 'India (Tap Map or Allow GPS)'
  );

  // Search Radius: default 50 KM (supports 5, 10, 20, 30, 50 or custom)
  const [radiusKm, setRadiusKm] = useState<number>(50);
  const [isCustomRadius, setIsCustomRadius] = useState<boolean>(false);

  // View mode: 'split' | 'list' | 'map'
  const [viewMode, setViewMode] = useState<'split' | 'list' | 'map'>('split');

  // Filters
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedEmploymentType, setSelectedEmploymentType] = useState<string>('all');
  const [selectedPaymentFreq, setSelectedPaymentFreq] = useState<string>('all');
  const [minSalaryFilter, setMinSalaryFilter] = useState<number>(0);
  const [onlyVerifiedEmployers, setOnlyVerifiedEmployers] = useState<boolean>(false);
  const [onlyImmediateJoin, setOnlyImmediateJoin] = useState<boolean>(false);
  const [sortBy, setSortBy] = useState<'distance' | 'newest' | 'salary_high' | 'closing_soon'>('distance');

  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [detectingLocation, setDetectingLocation] = useState<boolean>(false);
  const [changeLocationOpen, setChangeLocationOpen] = useState<boolean>(false);

  // Auto detect user browser/mobile geolocation
  const handleDetectGPS = () => {
    if (!navigator.geolocation) {
      return;
    }
    setDetectingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCenterLat(pos.coords.latitude);
        setCenterLng(pos.coords.longitude);
        setLocationName('Your Current GPS Location');
        setDetectingLocation(false);
      },
      (err) => {
        console.warn('GPS error:', err);
        setDetectingLocation(false);
      },
      { timeout: 8000, enableHighAccuracy: true }
    );
  };

  useEffect(() => {
    if (workerProfile?.lat !== undefined && workerProfile?.lng !== undefined) {
      setCenterLat(workerProfile.lat);
      setCenterLng(workerProfile.lng);
    }
    if (workerProfile?.city || workerProfile?.state) {
      setLocationName(
        `${workerProfile.city || ''}${workerProfile.city && workerProfile.state ? ', ' : ''}${workerProfile.state || ''}`
      );
    }
    if (workerProfile?.jobPreferences?.preferredSearchRadiusKm) {
      setRadiusKm(workerProfile.jobPreferences.preferredSearchRadiusKm);
    }
  }, [
    workerProfile?.lat,
    workerProfile?.lng,
    workerProfile?.city,
    workerProfile?.state,
    workerProfile?.jobPreferences?.preferredSearchRadiusKm
  ]);

  useEffect(() => {
    if (!workerProfile?.lat && !workerProfile?.lng) {
      handleDetectGPS();
    }
  }, [workerProfile?.lat, workerProfile?.lng]);

  // Calculate distances & filter jobs
  const jobsWithDistance = useMemo(() => {
    return jobs.map((job) => {
      let dist: number | null = null;
      if (job.lat !== undefined && job.lng !== undefined) {
        dist = calculateDistance(centerLat, centerLng, job.lat, job.lng);
      } else {
        // Fallback distance based on matching city
        dist = job.city?.toLowerCase() === workerProfile?.city?.toLowerCase() ? 12 : 65;
      }
      return {
        ...job,
        distanceKm: dist
      };
    });
  }, [jobs, centerLat, centerLng, workerProfile]);

  // Apply all filters & sorting
  const filteredJobs = useMemo(() => {
    return jobsWithDistance
      .filter((job) => {
        // Radius filter
        if (job.distanceKm !== null && job.distanceKm > radiusKm) {
          return false;
        }

        // Search title/employer
        if (searchTerm) {
          const s = searchTerm.toLowerCase();
          const matchTitle = job.title.toLowerCase().includes(s);
          const matchEmp = job.employerName.toLowerCase().includes(s);
          const matchLoc = (job.city || '').toLowerCase().includes(s);
          if (!matchTitle && !matchEmp && !matchLoc) return false;
        }

        // Category filter
        if (selectedCategory !== 'all' && job.category !== selectedCategory) {
          return false;
        }

        // Employment type
        if (selectedEmploymentType !== 'all' && job.employmentType !== selectedEmploymentType) {
          return false;
        }

        // Payment frequency
        if (selectedPaymentFreq !== 'all' && job.paymentFrequency !== selectedPaymentFreq) {
          return false;
        }

        // Min salary
        if (minSalaryFilter > 0 && job.maxSalary < minSalaryFilter) {
          return false;
        }

        // Verified employer only
        if (onlyVerifiedEmployers && !job.isEmployerVerified) {
          return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'distance') {
          return (a.distanceKm || 999) - (b.distanceKm || 999);
        }
        if (sortBy === 'salary_high') {
          return (b.maxSalary || 0) - (a.maxSalary || 0);
        }
        if (sortBy === 'newest') {
          return (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0);
        }
        if (sortBy === 'closing_soon') {
          return (a.deadline || '9999').localeCompare(b.deadline || '9999');
        }
        return 0;
      });
  }, [
    jobsWithDistance,
    radiusKm,
    searchTerm,
    selectedCategory,
    selectedEmploymentType,
    selectedPaymentFreq,
    minSalaryFilter,
    onlyVerifiedEmployers,
    sortBy
  ]);

  // Markers for the Leaflet Map
  const mapMarkers: MapMarkerItem[] = useMemo(() => {
    return filteredJobs.map((j) => ({
      id: j.id,
      lat: j.lat || centerLat + (Math.random() - 0.5) * 0.05,
      lng: j.lng || centerLng + (Math.random() - 0.5) * 0.05,
      title: j.title,
      subtitle: `${j.employerName} • ₹${j.minSalary?.toLocaleString()} - ₹${j.maxSalary?.toLocaleString()}`,
      badge: j.paymentFrequency,
      type: 'job',
      verified: j.isEmployerVerified,
      distanceKm: j.distanceKm,
      onSelect: () => setSelectedJobId(j.id)
    }));
  }, [filteredJobs, centerLat, centerLng]);

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* Top Header Card */}
      <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-blue-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-80 h-80 bg-white/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs font-bold uppercase tracking-wider text-blue-200">
                50 KM Radius Live Radar & India Map
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              50 KM Radius — Jobs Near Me
            </h2>
            <p className="text-xs sm:text-sm text-blue-100 max-w-xl">
              Discover verified shops, enterprises, coaching classes, and local workplaces within a 50 KM radius across India.
            </p>
          </div>

          {/* Quick Location & GPS Badge */}
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={handleDetectGPS}
              disabled={detectingLocation}
              className="px-4 py-2.5 rounded-2xl bg-white text-blue-700 hover:bg-blue-50 font-bold text-xs shadow-md flex items-center gap-2 cursor-pointer transition-transform active:scale-95"
            >
              <Navigation className={`w-4 h-4 ${detectingLocation ? 'animate-spin' : ''}`} />
              <span>{detectingLocation ? 'Detecting GPS...' : 'Use My Exact Location'}</span>
            </button>

            {currentUser && (
              <button
                type="button"
                onClick={() => setChangeLocationOpen(true)}
                className="px-4 py-2.5 rounded-2xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs shadow-md flex items-center gap-1.5 cursor-pointer transition-transform active:scale-95"
              >
                <Compass className="w-4 h-4" />
                <span>Change City</span>
              </button>
            )}

            <div className="px-4 py-2.5 rounded-2xl bg-black/25 backdrop-blur-md border border-white/20 text-white text-xs font-semibold flex items-center gap-2">
              <MapPin className="w-4 h-4 text-amber-300 shrink-0" />
              <span className="truncate max-w-[200px]">{locationName}</span>
            </div>
          </div>
        </div>

        {/* Radius Selector Pills */}
        <div className="relative mt-6 pt-5 border-t border-white/15 flex flex-wrap items-center gap-2.5">
          <span className="text-xs font-bold text-blue-200 uppercase tracking-wider mr-2">
            Search Radius:
          </span>
          {[5, 10, 20, 30, 50].map((dist) => (
            <button
              key={dist}
              type="button"
              onClick={() => {
                setRadiusKm(dist);
                setIsCustomRadius(false);
              }}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                radiusKm === dist && !isCustomRadius
                  ? 'bg-amber-400 text-slate-950 shadow-md scale-105'
                  : 'bg-white/15 text-white hover:bg-white/25'
              }`}
            >
              {dist} KM
            </button>
          ))}

          <button
            type="button"
            onClick={() => setIsCustomRadius(!isCustomRadius)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center gap-1.5 ${
              isCustomRadius
                ? 'bg-amber-400 text-slate-950 shadow-md'
                : 'bg-white/15 text-white hover:bg-white/25'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Custom Radius ({radiusKm} KM)</span>
          </button>

          {isCustomRadius && (
            <div className="w-full sm:w-auto flex items-center gap-3 bg-white/20 px-4 py-2 rounded-xl backdrop-blur-md mt-2 sm:mt-0">
              <input
                type="range"
                min="1"
                max="100"
                value={radiusKm}
                onChange={(e) => setRadiusKm(Number(e.target.value))}
                className="w-32 accent-amber-400 cursor-pointer"
              />
              <span className="text-xs font-black text-amber-300 min-w-[50px]">
                {radiusKm} KM
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Filter and View Controls Bar */}
      <div className="bg-white rounded-3xl p-5 shadow-xs border border-gray-200 space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Search bar */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search local jobs, shop titles, roles (e.g. Electrician, Cashier, Delivery)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-gray-50 border border-gray-200 text-xs font-medium focus:bg-white focus:border-blue-600 focus:outline-hidden"
            />
          </div>

          {/* View mode toggle */}
          <div className="flex items-center gap-2 self-end lg:self-auto">
            <span className="text-xs font-bold text-gray-500 hidden sm:inline">View:</span>
            <div className="flex p-1 bg-gray-100 rounded-xl text-xs font-bold">
              <button
                type="button"
                onClick={() => setViewMode('split')}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  viewMode === 'split' ? 'bg-white text-blue-700 shadow-xs' : 'text-gray-600'
                }`}
              >
                Split Map
              </button>
              <button
                type="button"
                onClick={() => setViewMode('list')}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  viewMode === 'list' ? 'bg-white text-blue-700 shadow-xs' : 'text-gray-600'
                }`}
              >
                List Only
              </button>
              <button
                type="button"
                onClick={() => setViewMode('map')}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  viewMode === 'map' ? 'bg-white text-blue-700 shadow-xs' : 'text-gray-600'
                }`}
              >
                Map Only
              </button>
            </div>
          </div>
        </div>

        {/* Filter Dropdowns Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-2.5 pt-2 border-t border-gray-100 text-xs">
          {/* Category */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="p-2 rounded-xl bg-gray-50 border border-gray-200 text-gray-700 font-semibold focus:outline-hidden cursor-pointer"
          >
            <option value="all">All Categories</option>
            {Object.keys(SKILL_CATEGORIES_DATA).map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>

          {/* Employment Type */}
          <select
            value={selectedEmploymentType}
            onChange={(e) => setSelectedEmploymentType(e.target.value)}
            className="p-2 rounded-xl bg-gray-50 border border-gray-200 text-gray-700 font-semibold focus:outline-hidden cursor-pointer"
          >
            <option value="all">All Work Types</option>
            <option value="Full-time">Full-time</option>
            <option value="Part-time">Part-time</option>
            <option value="Contract">Contract</option>
            <option value="Temporary">Temporary</option>
          </select>

          {/* Payment Frequency */}
          <select
            value={selectedPaymentFreq}
            onChange={(e) => setSelectedPaymentFreq(e.target.value)}
            className="p-2 rounded-xl bg-gray-50 border border-gray-200 text-gray-700 font-semibold focus:outline-hidden cursor-pointer"
          >
            <option value="all">Any Pay Cycle</option>
            <option value="Per day">Daily Wage</option>
            <option value="Per month">Monthly Salary</option>
            <option value="Per week">Weekly Pay</option>
          </select>

          {/* Sort By */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="p-2 rounded-xl bg-gray-50 border border-gray-200 text-gray-700 font-semibold focus:outline-hidden cursor-pointer"
          >
            <option value="distance">Nearest First</option>
            <option value="newest">Recently Posted</option>
            <option value="salary_high">Highest Salary</option>
            <option value="closing_soon">Closing Soon</option>
          </select>

          {/* Verified Only Checkbox */}
          <label className="flex items-center gap-2 p-2 rounded-xl bg-gray-50 border border-gray-200 text-gray-700 cursor-pointer font-semibold">
            <input
              type="checkbox"
              checked={onlyVerifiedEmployers}
              onChange={(e) => setOnlyVerifiedEmployers(e.target.checked)}
              className="rounded-sm accent-blue-600"
            />
            <span className="truncate">Verified Only</span>
          </label>

          {/* Min Salary Input */}
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-gray-50 border border-gray-200">
            <span className="text-gray-400 font-bold">₹</span>
            <input
              type="number"
              placeholder="Min Pay"
              value={minSalaryFilter || ''}
              onChange={(e) => setMinSalaryFilter(Number(e.target.value) || 0)}
              className="w-full bg-transparent text-xs font-semibold focus:outline-hidden"
            />
          </div>
        </div>
      </div>

      {/* Main Content Area: Map and/or Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Map View */}
        {(viewMode === 'split' || viewMode === 'map') && (
          <div className={viewMode === 'split' ? 'lg:col-span-5 sticky top-24' : 'lg:col-span-12'}>
            <div className="bg-white rounded-3xl p-4 shadow-xs border border-gray-200 space-y-3">
              <div className="flex items-center justify-between px-1">
                <span className="text-xs font-bold text-gray-800 flex items-center gap-1.5">
                  <Compass className="w-4 h-4 text-blue-600" />
                  <span>Interactive Radius Map</span>
                </span>
                <span className="text-[11px] font-bold text-blue-600 bg-blue-50 px-2.5 py-0.5 rounded-full">
                  {radiusKm} KM Range
                </span>
              </div>

              <InteractiveMapView
                centerLat={centerLat}
                centerLng={centerLng}
                radiusKm={radiusKm}
                centerLabel={locationName}
                items={mapMarkers}
                selectedItemId={selectedJobId}
                onSelectItem={(id) => setSelectedJobId(id)}
                onLocationChange={(lat, lng) => {
                  setCenterLat(lat);
                  setCenterLng(lng);
                  setLocationName(`Custom Pin (${lat.toFixed(3)}, ${lng.toFixed(3)})`);
                }}
                className={viewMode === 'map' ? 'h-[580px] w-full rounded-2xl' : 'h-[440px] w-full rounded-2xl'}
              />
              <p className="text-[10px] text-gray-400 text-center">
                Click anywhere on the map to re-center search point or click job markers to view details.
              </p>
            </div>
          </div>
        )}

        {/* Job Cards List */}
        {(viewMode === 'split' || viewMode === 'list') && (
          <div className={viewMode === 'split' ? 'lg:col-span-7 space-y-4' : 'lg:col-span-12 space-y-4'}>
            <div className="flex items-center justify-between px-1">
              <span className="text-xs font-bold text-gray-700">
                Found <strong className="text-blue-600">{filteredJobs.length}</strong> vacancies within {radiusKm} KM
              </span>
              <span className="text-xs text-gray-400">
                Sorted by {sortBy.replace('_', ' ')}
              </span>
            </div>

            {filteredJobs.length === 0 ? (
              <div className="bg-white rounded-3xl p-12 text-center border border-gray-200 space-y-3">
                <MapPin className="w-12 h-12 text-gray-300 mx-auto" />
                <h4 className="text-base font-bold text-gray-900">No jobs found in this exact radius</h4>
                <p className="text-xs text-gray-500 max-w-sm mx-auto">
                  Try widening your search radius to 30 KM or 50 KM, or adjust your category and wage filters.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setRadiusKm(50);
                    setSelectedCategory('all');
                  }}
                  className="px-4 py-2 rounded-xl bg-blue-600 text-white font-bold text-xs hover:bg-blue-700 cursor-pointer"
                >
                  Expand to 50 KM Radius
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredJobs.map((job) => {
                  const isSelected = job.id === selectedJobId;
                  const isSaved = savedJobIds.includes(job.id);

                  return (
                    <div
                      key={job.id}
                      onClick={() => setSelectedJobId(job.id)}
                      className={`bg-white rounded-3xl p-6 shadow-xs border transition-all cursor-pointer ${
                        isSelected
                          ? 'border-blue-500 ring-2 ring-blue-500/20 bg-blue-50/20'
                          : 'border-gray-200 hover:border-gray-300 hover:shadow-md'
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                        <div className="flex items-start gap-4">
                          {job.employerLogo ? (
                            <img
                              src={job.employerLogo}
                              alt={job.employerName}
                              className="w-14 h-14 rounded-2xl object-cover border border-gray-200 shrink-0 bg-white"
                            />
                          ) : (
                            <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-700 flex items-center justify-center font-black text-xl shrink-0 border border-blue-100">
                              {(job.employerName || 'J').charAt(0)}
                            </div>
                          )}

                          <div className="space-y-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-blue-50 text-blue-700">
                                {job.category}
                              </span>
                              {job.isEmployerVerified && (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 flex items-center gap-1">
                                  <ShieldCheck className="w-3 h-3 text-emerald-600" />
                                  Verified Workplace
                                </span>
                              )}
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800">
                                {job.employmentType}
                              </span>
                            </div>

                            <h3 className="text-base font-extrabold text-gray-900 group-hover:text-blue-600">
                              {job.title}
                            </h3>

                            <p className="text-xs font-semibold text-gray-600 flex items-center gap-1.5">
                              <Building2 className="w-3.5 h-3.5 text-gray-400" />
                              <span>{job.employerName}</span>
                            </p>
                          </div>
                        </div>

                        {/* Salary and Distance Pill */}
                        <div className="flex sm:flex-col items-end justify-between sm:justify-start gap-1">
                          <div className="text-right">
                            <span className="text-sm sm:text-base font-black text-gray-900 block">
                              ₹{job.minSalary?.toLocaleString()} - ₹{job.maxSalary?.toLocaleString()}
                            </span>
                            <span className="text-[11px] font-bold text-gray-500">
                              {job.paymentFrequency}
                            </span>
                          </div>

                          {job.distanceKm !== null && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-blue-50 text-blue-700 text-xs font-bold mt-1">
                              <Navigation className="w-3 h-3" />
                              <span>{job.distanceKm.toFixed(1)} KM away</span>
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Job Description preview */}
                      <p className="text-xs text-gray-600 mt-3 line-clamp-2 leading-relaxed">
                        {job.description}
                      </p>

                      {/* Skills Tags */}
                      {job.requiredSkills && job.requiredSkills.length > 0 && (
                        <div className="flex flex-wrap items-center gap-1.5 mt-3">
                          {job.requiredSkills.slice(0, 4).map((skill, idx) => (
                            <span
                              key={idx}
                              className="px-2 py-0.5 rounded-md bg-gray-100 text-gray-700 text-[11px] font-medium"
                            >
                              {skill}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Card Footer with Details & Apply Button */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mt-4 pt-3 border-t border-gray-100">
                        <div className="flex items-center gap-4 text-[11px] text-gray-500">
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5 text-gray-400" />
                            <span>{job.city}, {job.state}</span>
                          </span>
                          {job.vacancies && (
                            <span className="font-semibold text-gray-700">
                              {job.vacancies} {job.vacancies === 1 ? 'Vacancy' : 'Vacancies'}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2">
                          {onSaveJob && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onSaveJob(job.id);
                              }}
                              className={`px-3 py-2 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
                                isSaved
                                  ? 'bg-amber-50 text-amber-800 border-amber-200'
                                  : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                              }`}
                            >
                              {isSaved ? 'Saved' : 'Save'}
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onApplyJob(job);
                            }}
                            className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
                          >
                            <span>APPLY NOW</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
      <ChangeLocationModal
        isOpen={changeLocationOpen}
        onClose={() => setChangeLocationOpen(false)}
        role="worker"
      />
    </div>
  );
};
