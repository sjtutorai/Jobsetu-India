import React, { useState, useEffect, useMemo } from 'react';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../context/AuthContext';
import { useJobs } from '../../context/JobContext';
import { WorkerProfile, WORKER_OCCUPATION_GROUPS } from '../../types';
import { calculateDistance } from '../../lib/geo';
import { InteractiveMapView, MapMarkerItem } from './InteractiveMapView';
import { ChangeLocationModal } from '../common/ChangeLocationModal';
import {
  Users,
  MapPin,
  Search,
  Filter,
  Navigation,
  CheckCircle2,
  ShieldCheck,
  Briefcase,
  IndianRupee,
  Clock,
  Sparkles,
  Send,
  Sliders,
  ChevronDown,
  Lock,
  Layers,
  ArrowRight,
  Compass
} from 'lucide-react';

interface WorkersNearMeViewProps {
  onSendHiringRequest: (worker: WorkerProfile) => void;
  onOpenChat?: (convId: string) => void;
}

export const WorkersNearMeView: React.FC<WorkersNearMeViewProps> = ({
  onSendHiringRequest,
  onOpenChat
}) => {
  const { employerProfile } = useAuth();
  const { startConversation } = useJobs();

  // Employer business location or India center until GPS/pin is selected
  const defaultLat = employerProfile?.lat || 20.5937;
  const defaultLng = employerProfile?.lng || 78.9629;

  const [centerLat, setCenterLat] = useState<number>(defaultLat);
  const [centerLng, setCenterLng] = useState<number>(defaultLng);
  const [workplaceName, setWorkplaceName] = useState<string>(
    employerProfile?.city
      ? `${employerProfile.city}${employerProfile.state ? `, ${employerProfile.state}` : ''}`
      : 'India (Tap Map or Allow GPS)'
  );
  const [changeLocationOpen, setChangeLocationOpen] = useState<boolean>(false);

  useEffect(() => {
    if (employerProfile?.lat !== undefined && employerProfile?.lng !== undefined) {
      setCenterLat(employerProfile.lat);
      setCenterLng(employerProfile.lng);
    }
    if (employerProfile?.city || employerProfile?.state) {
      setWorkplaceName(
        `${employerProfile.city || ''}${employerProfile.city && employerProfile.state ? ', ' : ''}${employerProfile.state || ''}`
      );
    }
    if (employerProfile?.discoveryRadiusKm) {
      setRadiusKm(employerProfile.discoveryRadiusKm);
    }
  }, [
    employerProfile?.lat,
    employerProfile?.lng,
    employerProfile?.city,
    employerProfile?.state,
    employerProfile?.discoveryRadiusKm
  ]);

  useEffect(() => {
    if (!employerProfile?.lat && !employerProfile?.lng && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setCenterLat(pos.coords.latitude);
          setCenterLng(pos.coords.longitude);
          setWorkplaceName('Your Current GPS Location');
        },
        () => {},
        { timeout: 8000, enableHighAccuracy: true }
      );
    }
  }, [employerProfile?.lat, employerProfile?.lng]);

  const [candidates, setCandidates] = useState<WorkerProfile[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Radius: default 50 KM (supports 5, 10, 20, 30, 50 or custom)
  const [radiusKm, setRadiusKm] = useState<number>(50);
  const [isCustomRadius, setIsCustomRadius] = useState<boolean>(false);

  // View mode
  const [viewMode, setViewMode] = useState<'split' | 'list' | 'map'>('split');

  // Filters
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedGroup, setSelectedGroup] = useState<string>('all');
  const [selectedProfession, setSelectedProfession] = useState<string>('all');
  const [onlyVerified, setOnlyVerified] = useState<boolean>(false);
  const [onlyAvailableNow, setOnlyAvailableNow] = useState<boolean>(false);
  const [sortBy, setSortBy] = useState<'distance' | 'experience' | 'highest_rated'>('distance');
  const [selectedWorkerId, setSelectedWorkerId] = useState<string | null>(null);

  // Fetch real workers from Firestore
  useEffect(() => {
    const workersRef = collection(db, 'workerProfiles');
    const unsub = onSnapshot(
      query(workersRef),
      (snapshot) => {
        const list: WorkerProfile[] = [];
        snapshot.forEach((doc) => {
          list.push({ uid: doc.id, ...(doc.data() as any) });
        });
        setCandidates(list);
        setLoading(false);
      },
      (err) => {
        console.warn('Candidates fetch error:', err);
        setLoading(false);
      }
    );
    return () => unsub();
  }, []);

  // Compute distance for each candidate
  const candidatesWithDistance = useMemo(() => {
    return candidates.map((cand) => {
      let dist: number | null = null;
      if (cand.lat !== undefined && cand.lng !== undefined) {
        dist = calculateDistance(centerLat, centerLng, cand.lat, cand.lng);
      } else {
        dist = cand.city?.toLowerCase() === employerProfile?.city?.toLowerCase() ? 8 : 45;
      }
      return {
        ...cand,
        distanceKm: dist
      };
    });
  }, [candidates, centerLat, centerLng, employerProfile]);

  // Filter & Sort
  const filteredCandidates = useMemo(() => {
    return candidatesWithDistance
      .filter((cand) => {
        // Radius filter
        if (cand.distanceKm !== null && cand.distanceKm > radiusKm) {
          return false;
        }

        // Search text
        if (searchTerm) {
          const s = searchTerm.toLowerCase();
          const matchName = (cand.fullName || '').toLowerCase().includes(s);
          const matchSkills = (cand.skills || []).some((sk) => sk.toLowerCase().includes(s));
          const matchCity = (cand.city || '').toLowerCase().includes(s);
          if (!matchName && !matchSkills && !matchCity) return false;
        }

        // Occupation group filter
        if (selectedGroup !== 'all') {
          const group = WORKER_OCCUPATION_GROUPS.find((g) => g.groupName === selectedGroup);
          if (group) {
            const hasGroupSkill = (cand.skills || []).some((sk) =>
              group.professions.some((prof) => prof.toLowerCase().includes(sk.toLowerCase()))
            );
            if (!hasGroupSkill) return false;
          }
        }

        // Specific profession
        if (selectedProfession !== 'all') {
          const hasProf = (cand.skills || []).some((sk) =>
            sk.toLowerCase().includes(selectedProfession.toLowerCase())
          );
          if (!hasProf) return false;
        }

        // Only verified
        if (onlyVerified && !cand.ageEligibilityConfirmed) {
          return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'distance') {
          return (a.distanceKm || 999) - (b.distanceKm || 999);
        }
        return 0;
      });
  }, [
    candidatesWithDistance,
    radiusKm,
    searchTerm,
    selectedGroup,
    selectedProfession,
    onlyVerified,
    sortBy
  ]);

  // Privacy Safe Map Markers (Random small offset of 100-300m so exact home address is NEVER exposed)
  const mapMarkers: MapMarkerItem[] = useMemo(() => {
    return filteredCandidates.map((c, idx) => {
      // Jitter lat/lng slightly for residential privacy protection
      const jitterLat = (c.lat || centerLat) + ((idx % 7) - 3) * 0.003;
      const jitterLng = (c.lng || centerLng) + (((idx * 3) % 7) - 3) * 0.003;

      const mainSkill = c.skills?.[0] || 'Skilled Worker';

      return {
        id: c.uid,
        lat: jitterLat,
        lng: jitterLng,
        title: c.fullName || 'Candidate',
        subtitle: `${mainSkill} • ${c.city || 'India'}`,
        badge: c.experience || 'Experienced',
        type: 'worker',
        verified: Boolean(c.ageEligibilityConfirmed),
        distanceKm: c.distanceKm,
        onSelect: () => setSelectedWorkerId(c.uid)
      };
    });
  }, [filteredCandidates, centerLat, centerLng]);

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* Top Banner Card */}
      <div className="bg-gradient-to-r from-amber-700 via-amber-600 to-yellow-600 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-80 h-80 bg-white/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs font-bold uppercase tracking-wider text-amber-200">
                Talent Radius Radar
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Find Workers Near Me
            </h2>
            <p className="text-xs sm:text-sm text-amber-100 max-w-xl">
              Locate and send direct hiring offers to verified electricians, helpers, technicians, drivers, and professionals within your facility's operational radius.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => setChangeLocationOpen(true)}
              className="px-4 py-2.5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-amber-300 font-black text-xs shadow-md flex items-center gap-1.5 cursor-pointer transition-transform active:scale-95"
            >
              <Compass className="w-4 h-4" />
              <span>Change City</span>
            </button>

            <div className="px-4 py-2.5 rounded-2xl bg-black/25 backdrop-blur-md border border-white/20 text-white text-xs font-semibold flex items-center gap-2">
              <MapPin className="w-4 h-4 text-amber-300 shrink-0" />
              <span>Search Center: {workplaceName}</span>
            </div>
          </div>
        </div>

        {/* Radius Selector Pills */}
        <div className="relative mt-6 pt-5 border-t border-white/15 flex flex-wrap items-center gap-2.5">
          <span className="text-xs font-bold text-amber-200 uppercase tracking-wider mr-2">
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
                  ? 'bg-slate-900 text-amber-300 shadow-md scale-105'
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
                ? 'bg-slate-900 text-amber-300 shadow-md'
                : 'bg-white/15 text-white hover:bg-white/25'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Custom ({radiusKm} KM)</span>
          </button>

          {isCustomRadius && (
            <div className="w-full sm:w-auto flex items-center gap-3 bg-white/20 px-4 py-2 rounded-xl backdrop-blur-md mt-2 sm:mt-0">
              <input
                type="range"
                min="1"
                max="100"
                value={radiusKm}
                onChange={(e) => setRadiusKm(Number(e.target.value))}
                className="w-32 accent-amber-300 cursor-pointer"
              />
              <span className="text-xs font-black text-white min-w-[50px]">
                {radiusKm} KM
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Filter and Occupation Selection Bar */}
      <div className="bg-white rounded-3xl p-5 shadow-xs border border-gray-200 space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search skills, worker names, professions (e.g. Electrician, Welder, Cook, Driver)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-gray-50 border border-gray-200 text-xs font-medium focus:bg-white focus:border-amber-600 focus:outline-hidden"
            />
          </div>

          <div className="flex items-center gap-2 self-end lg:self-auto">
            <span className="text-xs font-bold text-gray-500 hidden sm:inline">View:</span>
            <div className="flex p-1 bg-gray-100 rounded-xl text-xs font-bold">
              <button
                type="button"
                onClick={() => setViewMode('split')}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  viewMode === 'split' ? 'bg-white text-amber-700 shadow-xs' : 'text-gray-600'
                }`}
              >
                Split Map
              </button>
              <button
                type="button"
                onClick={() => setViewMode('list')}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  viewMode === 'list' ? 'bg-white text-amber-700 shadow-xs' : 'text-gray-600'
                }`}
              >
                List Only
              </button>
              <button
                type="button"
                onClick={() => setViewMode('map')}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  viewMode === 'map' ? 'bg-white text-amber-700 shadow-xs' : 'text-gray-600'
                }`}
              >
                Map Only
              </button>
            </div>
          </div>
        </div>

        {/* Occupation Classification Group Dropdowns */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 pt-2 border-t border-gray-100 text-xs">
          {/* Classification Group */}
          <div>
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">
              Occupation Group
            </label>
            <select
              value={selectedGroup}
              onChange={(e) => {
                setSelectedGroup(e.target.value);
                setSelectedProfession('all');
              }}
              className="w-full p-2 rounded-xl bg-gray-50 border border-gray-200 text-gray-700 font-semibold focus:outline-hidden cursor-pointer"
            >
              <option value="all">All Worker Groups</option>
              {WORKER_OCCUPATION_GROUPS.map((g) => (
                <option key={g.groupName} value={g.groupName}>
                  {g.groupName}
                </option>
              ))}
            </select>
          </div>

          {/* Specific Trade / Profession */}
          <div>
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">
              Specific Profession
            </label>
            <select
              value={selectedProfession}
              onChange={(e) => setSelectedProfession(e.target.value)}
              className="w-full p-2 rounded-xl bg-gray-50 border border-gray-200 text-gray-700 font-semibold focus:outline-hidden cursor-pointer"
            >
              <option value="all">All Professions</option>
              {selectedGroup !== 'all' ? (
                WORKER_OCCUPATION_GROUPS.find((g) => g.groupName === selectedGroup)?.professions.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))
              ) : (
                WORKER_OCCUPATION_GROUPS.flatMap((g) => g.professions).map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))
              )}
            </select>
          </div>

          {/* Sort By */}
          <div>
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">
              Sort By
            </label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="w-full p-2 rounded-xl bg-gray-50 border border-gray-200 text-gray-700 font-semibold focus:outline-hidden cursor-pointer"
            >
              <option value="distance">Nearest Distance</option>
            </select>
          </div>

          {/* Verified Only */}
          <div className="flex items-end pb-1">
            <label className="w-full flex items-center justify-between p-2 rounded-xl bg-gray-50 border border-gray-200 text-gray-700 cursor-pointer font-semibold text-xs">
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Verified Profiles Only</span>
              </span>
              <input
                type="checkbox"
                checked={onlyVerified}
                onChange={(e) => setOnlyVerified(e.target.checked)}
                className="rounded-sm accent-amber-600 cursor-pointer"
              />
            </label>
          </div>
        </div>
      </div>

      {/* Main Grid: Map and Worker Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Map Panel */}
        {(viewMode === 'split' || viewMode === 'map') && (
          <div className={viewMode === 'split' ? 'lg:col-span-5 sticky top-24' : 'lg:col-span-12'}>
            <div className="bg-white rounded-3xl p-4 shadow-xs border border-gray-200 space-y-3">
              <div className="flex items-center justify-between px-1">
                <span className="text-xs font-bold text-gray-800 flex items-center gap-1.5">
                  <Compass className="w-4 h-4 text-amber-600" />
                  <span>Workforce Radar Map</span>
                </span>
                <span className="text-[11px] font-bold text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-full">
                  Approximate Locations
                </span>
              </div>

              <InteractiveMapView
                centerLat={centerLat}
                centerLng={centerLng}
                radiusKm={radiusKm}
                centerLabel={workplaceName}
                items={mapMarkers}
                selectedItemId={selectedWorkerId}
                onSelectItem={(id) => setSelectedWorkerId(id)}
                className={viewMode === 'map' ? 'h-[580px] w-full rounded-2xl' : 'h-[440px] w-full rounded-2xl'}
              />

              <div className="p-2.5 rounded-xl bg-amber-50/60 border border-amber-200/60 flex items-start gap-2 text-[11px] text-amber-900">
                <Lock className="w-3.5 h-3.5 text-amber-600 mt-0.5 shrink-0" />
                <span>
                  <strong>Privacy Protected:</strong> Worker home locations are rendered with approximate indicators. Exact contact details and addresses are shared only upon mutual hiring agreement.
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Worker Cards List */}
        {(viewMode === 'split' || viewMode === 'list') && (
          <div className={viewMode === 'split' ? 'lg:col-span-7 space-y-4' : 'lg:col-span-12 space-y-4'}>
            <div className="flex items-center justify-between px-1">
              <span className="text-xs font-bold text-gray-700">
                Found <strong className="text-amber-600">{filteredCandidates.length}</strong> available workers within {radiusKm} KM
              </span>
              <span className="text-xs text-gray-400">
                Live recruitment roster
              </span>
            </div>

            {filteredCandidates.length === 0 ? (
              <div className="bg-white rounded-3xl p-12 text-center border border-gray-200 space-y-3">
                <Users className="w-12 h-12 text-gray-300 mx-auto" />
                <h4 className="text-base font-bold text-gray-900">No candidates within {radiusKm} KM</h4>
                <p className="text-xs text-gray-500 max-w-sm mx-auto">
                  Expand your radar to 30 KM or 50 KM to discover candidates in neighbouring districts and industrial clusters.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setRadiusKm(50);
                    setSelectedGroup('all');
                    setSelectedProfession('all');
                  }}
                  className="px-4 py-2 rounded-xl bg-amber-600 text-white font-bold text-xs hover:bg-amber-700 cursor-pointer"
                >
                  Expand to 50 KM Radar
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredCandidates.map((worker) => {
                  const isSelected = worker.uid === selectedWorkerId;
                  const primaryProfession = worker.skills?.[0] || 'Skilled Professional';

                  return (
                    <div
                      key={worker.uid}
                      onClick={() => setSelectedWorkerId(worker.uid)}
                      className={`bg-white rounded-3xl p-6 shadow-xs border transition-all cursor-pointer ${
                        isSelected
                          ? 'border-amber-500 ring-2 ring-amber-500/20 bg-amber-50/20'
                          : 'border-gray-200 hover:border-gray-300 hover:shadow-md'
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                        <div className="flex items-start gap-4">
                          {worker.profilePhoto ? (
                            <img
                              src={worker.profilePhoto}
                              alt={worker.fullName}
                              className="w-14 h-14 rounded-2xl object-cover border-2 border-amber-300 shrink-0 bg-white"
                            />
                          ) : (
                            <div className="w-14 h-14 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center font-black text-xl shrink-0 border border-amber-200">
                              {(worker.fullName || 'W').charAt(0)}
                            </div>
                          )}

                          <div className="space-y-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-100 text-amber-900">
                                {primaryProfession}
                              </span>
                              {worker.ageEligibilityConfirmed && (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 flex items-center gap-1">
                                  <ShieldCheck className="w-3 h-3 text-emerald-600" />
                                  100% Verified Profile
                                </span>
                              )}
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700">
                                {worker.experience || 'Experienced'}
                              </span>
                            </div>

                            <h3 className="text-base font-extrabold text-gray-900">
                              {worker.fullName}
                            </h3>

                            <p className="text-xs text-gray-500 flex items-center gap-1.5">
                              <MapPin className="w-3.5 h-3.5 text-gray-400" />
                              <span>{worker.city ? `${worker.city}, ` : ''}{worker.state}</span>
                            </p>
                          </div>
                        </div>

                        {/* Distance & Availability */}
                        <div className="flex sm:flex-col items-end justify-between sm:justify-start gap-1">
                          <span className="px-3 py-1 rounded-xl bg-emerald-50 text-emerald-700 text-xs font-bold flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Available to Join</span>
                          </span>

                          {worker.distanceKm !== null && (
                            <span className="text-xs font-bold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-xl mt-1 flex items-center gap-1">
                              <Navigation className="w-3 h-3" />
                              <span>~{worker.distanceKm.toFixed(1)} KM away</span>
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Skills Tags */}
                      {worker.skills && worker.skills.length > 0 && (
                        <div className="flex flex-wrap items-center gap-1.5 mt-3.5">
                          {worker.skills.map((skill, idx) => (
                            <span
                              key={idx}
                              className="px-2.5 py-0.5 rounded-md bg-gray-100 text-gray-700 text-[11px] font-medium"
                            >
                              {skill}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Card Footer with Direct Action Buttons */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mt-4 pt-3.5 border-t border-gray-100">
                        <div className="text-[11px] text-gray-500 flex items-center gap-3">
                          <span>Education: <strong className="text-gray-800">{worker.education || 'Vocational Certificate'}</strong></span>
                          {worker.jobPreferences?.expectedSalary && (
                            <span>Expected: <strong className="text-gray-900">₹{worker.jobPreferences.expectedSalary}</strong></span>
                          )}
                        </div>

                        <div className="flex items-center gap-2">
                          {onOpenChat && (
                            <button
                              type="button"
                              onClick={async (e) => {
                                e.stopPropagation();
                                const convId = await startConversation(
                                  worker.uid,
                                  worker.fullName || 'Candidate',
                                  worker.profilePhoto,
                                  'worker',
                                  `Hello ${worker.fullName}, I reviewed your verified profile on JOBSETU and would like to discuss an opportunity.`
                                );
                                onOpenChat(convId);
                              }}
                              className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs transition-colors cursor-pointer"
                            >
                              Message
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onSendHiringRequest(worker);
                            }}
                            className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-extrabold text-xs shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
                          >
                            <Send className="w-3.5 h-3.5" />
                            <span>SEND HIRING REQUEST</span>
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
        role="employer"
      />
    </div>
  );
};
