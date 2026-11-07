import React, { useState, useEffect, useMemo } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../context/AuthContext';
import { useJobs } from '../../context/JobContext';
import { WorkerProfile } from '../../types';
import { calculateDistance } from '../../lib/geo';
import {
  Users,
  Search,
  MapPin,
  Briefcase,
  GraduationCap,
  ShieldCheck,
  Bookmark,
  BookmarkCheck,
  MessageSquare,
  Sparkles,
  ExternalLink,
  Navigation,
  CheckCircle2,
  X,
  Clock,
  Filter
} from 'lucide-react';

interface CandidateDirectoryProps {
  onOpenChat?: (conversationId: string) => void;
  employerProfileCompletion?: number;
  onCompleteEmployerProfile?: () => void;
}

export const CandidateDirectory: React.FC<CandidateDirectoryProps> = ({
  onOpenChat,
  employerProfileCompletion = 100,
  onCompleteEmployerProfile
}) => {
  const { employerProfile } = useAuth();
  const { savedCandidateIds, toggleSaveCandidate, startConversation } = useJobs();

  const [candidates, setCandidates] = useState<WorkerProfile[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedState, setSelectedState] = useState<string>('All');
  const [selectedExperience, setSelectedExperience] = useState<string>('All');
  const [only50kmRadius, setOnly50kmRadius] = useState(false);

  // Detailed Profile Modal
  const [viewingCandidate, setViewingCandidate] = useState<WorkerProfile | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Employer coordinates for distance calculations
  const employerLat = employerProfile?.lat || 19.0760;
  const employerLng = employerProfile?.lng || 72.8777;

  useEffect(() => {
    // Subscribe to real worker profiles from Firestore
    const workersRef = collection(db, 'workerProfiles');
    const unsubscribe = onSnapshot(
      workersRef,
      (snapshot) => {
        const list: WorkerProfile[] = [];
        snapshot.forEach((doc) => {
          list.push(doc.data() as WorkerProfile);
        });
        setCandidates(list);
        setLoading(false);
      },
      (err) => {
        console.warn('Could not query workerProfiles directly:', err);
        setCandidates([]);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  // Filter candidates
  const filteredCandidates = candidates.filter((c) => {
    // 50km radius filter
    if (only50kmRadius) {
      if (!c.lat || !c.lng) return false;
      const dist = calculateDistance(employerLat, employerLng, c.lat, c.lng);
      if (dist === null || dist > 50) return false;
    }

    if (selectedState !== 'All' && c.state !== selectedState) return false;
    if (selectedExperience !== 'All' && c.experience !== selectedExperience) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const nameMatch = c.fullName.toLowerCase().includes(q);
      const skillMatch = (c.skills || []).some((s) => s.toLowerCase().includes(q));
      const customSkillMatch = (c.customSkills || []).some((s) => s.toLowerCase().includes(q));
      const cityMatch = (c.city || '').toLowerCase().includes(q);
      const educationMatch = (c.education || '').toLowerCase().includes(q);
      if (!nameMatch && !skillMatch && !customSkillMatch && !cityMatch && !educationMatch) {
        return false;
      }
    }

    return true;
  });

  const handleStartChat = async (c: WorkerProfile) => {
    try {
      setActionLoading(c.uid);
      const convId = await startConversation(
        c.uid,
        c.fullName,
        c.profilePhoto || '',
        'worker',
        'Direct Recruitment Inquiry'
      );
      if (onOpenChat) {
        onOpenChat(convId);
      }
    } catch (err) {
      console.error('Failed to open chat:', err);
    } finally {
      setActionLoading(null);
    }
  };

  const calculateProfileCompletion = (c: WorkerProfile): number => {
    let score = 40; // Basic details
    if (c.profilePhoto) score += 15;
    if (c.skills && c.skills.length >= 2) score += 20;
    if (c.experience) score += 15;
    if (c.pincode && c.city) score += 10;
    return Math.min(score, 100);
  };

  // Priority sorting:
  // Requirements: "where the top one will be the verified 100% with the first under 50 Km Radius"
  const sortedCandidates = useMemo(() => {
    return [...filteredCandidates].sort((a, b) => {
      const distA = a.lat && a.lng ? calculateDistance(employerLat, employerLng, a.lat, a.lng) : null;
      const distB = b.lat && b.lng ? calculateDistance(employerLat, employerLng, b.lat, b.lng) : null;
      const under50A = distA !== null && distA <= 50;
      const under50B = distB !== null && distB <= 50;
      const scoreA = calculateProfileCompletion(a);
      const scoreB = calculateProfileCompletion(b);
      const is100A = scoreA === 100;
      const is100B = scoreB === 100;

      // Tier 1: 100% complete AND within 50km placed AT THE TOP!
      if (under50A && is100A && !(under50B && is100B)) return -1;
      if (under50B && is100B && !(under50A && is100A)) return 1;

      // Tier 2: Under 50km radius
      if (under50A && !under50B) return -1;
      if (under50B && !under50A) return 1;

      // Tier 3: 100% profile completed
      if (is100A && !is100B) return -1;
      if (is100B && !is100A) return 1;

      // Tier 4: Closer distance first
      if (distA !== null && distB !== null) {
        return distA - distB;
      }
      return scoreB - scoreA;
    });
  }, [filteredCandidates, employerLat, employerLng]);

  // Employer profile completion unlock mechanism
  const isFullyUnlocked = employerProfileCompletion >= 100;
  const displayLimit = isFullyUnlocked
    ? sortedCandidates.length
    : Math.max(3, Math.ceil(sortedCandidates.length * (employerProfileCompletion / 100)));
  const visibleCandidates = sortedCandidates.slice(0, displayLimit);
  const lockedCount = Math.max(0, sortedCandidates.length - visibleCandidates.length);

  return (
    <div className="space-y-6">
      {/* Employer Business Profile Completion Unlock Banner */}
      {!isFullyUnlocked && lockedCount > 0 && (
        <div className="p-4 sm:p-5 rounded-3xl bg-gradient-to-r from-amber-50 via-amber-100/60 to-yellow-50 border border-amber-200/90 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500 text-white flex items-center justify-center font-bold text-sm shrink-0 shadow-xs">
              {employerProfileCompletion}%
            </div>
            <div>
              <p className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                <span>Business Profile Completion Unlock</span>
                <span className="text-[10px] bg-amber-200 text-amber-950 px-2 py-0.5 rounded-full font-black">
                  {lockedCount} Candidates Locked
                </span>
              </p>
              <p className="text-[11px] text-amber-800/90 mt-0.5">
                Showing {visibleCandidates.length} of {sortedCandidates.length} skilled employees. Complete your business profile to 100% to unlock all candidates within 50 km, candidate phone numbers & verified resumes!
              </p>
            </div>
          </div>

          {onCompleteEmployerProfile && (
            <button
              type="button"
              onClick={onCompleteEmployerProfile}
              className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-xs transition-all flex items-center gap-1.5 self-start sm:self-auto cursor-pointer shrink-0"
            >
              <span>Complete Business Profile (+{100 - employerProfileCompletion}%)</span>
            </button>
          )}
        </div>
      )}

      {isFullyUnlocked && (
        <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center justify-between gap-2">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>100% Complete Business Profile: Full Talent Pool Unlocked. Top 100% verified workers under 50 km radius prioritized first.</span>
          </span>
          <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-900 px-2 py-0.5 rounded-md">
            Full Access Unlocked
          </span>
        </div>
      )}

      {/* Header and Controls */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-xs border border-gray-200/80">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-gray-100">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <Users className="w-5 h-5 text-[#2563EB]" />
                <span>Find Skilled Candidates</span>
              </h1>
              <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-[#2563EB] text-xs font-bold">
                {visibleCandidates.length} of {sortedCandidates.length} Available
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Top candidates shown first are 100% verified workers located under a 50 km radius from your business location.
            </p>
          </div>

          {/* 50km Radius Toggle */}
          <button
            type="button"
            onClick={() => setOnly50kmRadius(!only50kmRadius)}
            className={`px-4 py-2.5 rounded-2xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer border ${
              only50kmRadius
                ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-500/20'
                : 'bg-blue-50 hover:bg-blue-100 text-[#2563EB] border-blue-200'
            }`}
          >
            <Navigation className="w-4 h-4" />
            <span>Near Me (Within 50 km)</span>
            {only50kmRadius && <CheckCircle2 className="w-3.5 h-3.5 ml-1" />}
          </button>
        </div>

        {/* Filter inputs */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4">
          <div className="sm:col-span-1">
            <label className="block text-xs font-bold text-gray-700 mb-1">Search Candidates or Skills</label>
            <div className="relative">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="e.g. Electrician, Driver, Mumbai, Retail..."
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-gray-200 text-xs outline-none focus:border-[#2563EB]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">State / Territory</label>
            <select
              value={selectedState}
              onChange={(e) => setSelectedState(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs font-medium bg-white outline-none focus:border-[#2563EB]"
            >
              <option value="All">All States in India</option>
              <option value="Maharashtra">Maharashtra</option>
              <option value="Delhi">Delhi NCR</option>
              <option value="Karnataka">Karnataka</option>
              <option value="Gujarat">Gujarat</option>
              <option value="Tamil Nadu">Tamil Nadu</option>
              <option value="Uttar Pradesh">Uttar Pradesh</option>
              <option value="West Bengal">West Bengal</option>
              <option value="Rajasthan">Rajasthan</option>
              <option value="Telangana">Telangana</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Experience Level</label>
            <select
              value={selectedExperience}
              onChange={(e) => setSelectedExperience(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs font-medium bg-white outline-none focus:border-[#2563EB]"
            >
              <option value="All">All Experience Levels</option>
              <option value="Fresher">Fresher (Entry Level)</option>
              <option value="Less than one year">&lt; 1 Year</option>
              <option value="1–3 years">1–3 Years</option>
              <option value="3–5 years">3–5 Years</option>
              <option value="More than five years">5+ Years</option>
            </select>
          </div>
        </div>
      </div>

      {/* Candidate Grid */}
      {loading ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-gray-200">
          <div className="w-8 h-8 border-3 border-[#2563EB] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs text-gray-500 font-medium">Finding verified candidates...</p>
        </div>
      ) : visibleCandidates.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-gray-200">
          <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-gray-800">No candidates match this criteria</h3>
          <p className="text-xs text-gray-500 max-w-sm mx-auto mt-1">
            Try expanding your search query or clearing the 50 km distance filter to discover talent nationwide.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {visibleCandidates.map((c) => {
            const isSaved = savedCandidateIds.includes(c.uid);
            const rawDist =
              c.lat && c.lng
                ? calculateDistance(employerLat, employerLng, c.lat, c.lng)
                : null;
            const dist = rawDist !== null ? Math.round(rawDist) : null;
            const completion = calculateProfileCompletion(c);
            const isTopVerifiedNear = dist !== null && dist <= 50 && completion === 100;

            return (
              <div
                key={c.uid}
                className={`bg-white rounded-3xl p-5 shadow-xs border transition-all flex flex-col justify-between ${
                  isTopVerifiedNear
                    ? 'border-emerald-300 bg-gradient-to-b from-emerald-50/20 to-white shadow-emerald-500/10 shadow-md ring-1 ring-emerald-400'
                    : 'border-gray-200 hover:shadow-md hover:border-blue-300'
                }`}
              >
                <div>
                  {isTopVerifiedNear && (
                    <div className="mb-2.5 inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black tracking-wide uppercase">
                      <span>★ Top Candidate · 100% Verified & Under 50 km</span>
                    </div>
                  )}

                  {/* Top Bar with Real Portrait & Badges */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        {c.profilePhoto ? (
                          <img
                            src={c.profilePhoto}
                            alt={c.fullName}
                            className="w-14 h-14 rounded-2xl object-cover border-2 border-[#2563EB] shadow-xs"
                          />
                        ) : (
                          <div className="w-14 h-14 rounded-2xl bg-blue-50 text-[#2563EB] font-bold text-lg flex items-center justify-center">
                            {c.fullName.charAt(0)}
                          </div>
                        )}
                        <span
                          className="absolute -bottom-1 -right-1 bg-emerald-500 text-white p-0.5 rounded-full shadow-xs"
                          title="Verified Real Person Photo"
                        >
                          <ShieldCheck className="w-3.5 h-3.5" />
                        </span>
                      </div>

                      <div>
                        <h3 className="text-sm font-bold text-gray-900 hover:text-[#2563EB] transition-colors line-clamp-1">
                          {c.fullName}
                        </h3>
                        <p className="text-[11px] text-gray-500 flex items-center gap-1 mt-0.5">
                          <MapPin className="w-3 h-3 text-amber-500" />
                          <span>{c.city ? `${c.city}, ` : ''}{c.state}</span>
                        </p>
                      </div>
                    </div>

                    {/* Bookmark Button */}
                    <button
                      type="button"
                      onClick={() => toggleSaveCandidate(c.uid)}
                      className={`p-2 rounded-xl transition-colors cursor-pointer ${
                        isSaved
                          ? 'bg-amber-50 text-amber-600'
                          : 'bg-gray-50 hover:bg-gray-100 text-gray-400 hover:text-gray-600'
                      }`}
                      title={isSaved ? 'Candidate Saved' : 'Save Candidate'}
                    >
                      {isSaved ? <BookmarkCheck className="w-4 h-4" /> : <Bookmark className="w-4 h-4" />}
                    </button>
                  </div>

                  {/* Distance and Availability Tag */}
                  <div className="flex flex-wrap items-center gap-2 mt-3 text-[11px]">
                    {dist !== null && (
                      <span
                        className={`px-2 py-0.5 rounded-md font-bold flex items-center gap-1 ${
                          dist <= 50 ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        <Navigation className="w-3 h-3" />
                        {dist} km away
                      </span>
                    )}
                    {c.jobPreferences?.availability && (
                      <span className="px-2 py-0.5 rounded-md bg-blue-50 text-[#2563EB] font-semibold flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {c.jobPreferences.availability}
                      </span>
                    )}
                  </div>

                  {/* Details */}
                  <div className="mt-3 space-y-1.5 text-xs text-gray-600">
                    <div className="flex items-center gap-1.5">
                      <Briefcase className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                      <span className="font-semibold text-gray-800">{c.experience || 'Fresher'}</span>
                    </div>
                    {c.education && (
                      <div className="flex items-center gap-1.5">
                        <GraduationCap className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                        <span>{c.education}</span>
                      </div>
                    )}
                  </div>

                  {/* Skills tags */}
                  <div className="mt-3">
                    <div className="flex flex-wrap gap-1">
                      {(c.skills || []).slice(0, 3).map((sk) => (
                        <span
                          key={sk}
                          className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[10px] font-medium"
                        >
                          {sk}
                        </span>
                      ))}
                      {(c.skills || []).length > 3 && (
                        <span className="px-1.5 py-0.5 rounded-md bg-gray-50 text-gray-500 text-[10px]">
                          +{(c.skills || []).length - 3}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Profile completeness progress */}
                  <div className="mt-4 pt-3 border-t border-gray-100">
                    <div className="flex items-center justify-between text-[10px] text-gray-500 font-bold mb-1">
                      <span>Profile Verification</span>
                      <span className="text-emerald-600">{completion}%</span>
                    </div>
                    <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden">
                      <div
                        className="bg-emerald-500 h-full rounded-full"
                        style={{ width: `${completion}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Bottom Actions */}
                <div className="mt-4 pt-3 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setViewingCandidate(c)}
                    className="flex-1 py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs transition-colors cursor-pointer text-center"
                  >
                    View Details
                  </button>
                  <button
                    type="button"
                    onClick={() => handleStartChat(c)}
                    disabled={actionLoading === c.uid}
                    className="flex-1 py-2 px-3 rounded-xl bg-[#2563EB] hover:bg-blue-700 text-white font-bold text-xs shadow-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>Contact</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Candidate Detail Modal */}
      {viewingCandidate && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-gray-100 max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95">
            <div className="flex items-start justify-between pb-4 border-b border-gray-100">
              <div className="flex items-center gap-4">
                {viewingCandidate.profilePhoto ? (
                  <img
                    src={viewingCandidate.profilePhoto}
                    alt={viewingCandidate.fullName}
                    className="w-16 h-16 rounded-2xl object-cover border-2 border-[#2563EB] shadow-xs"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-2xl bg-blue-50 text-[#2563EB] font-bold text-xl flex items-center justify-center">
                    {viewingCandidate.fullName.charAt(0)}
                  </div>
                )}
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-bold text-gray-900">{viewingCandidate.fullName}</h2>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3" /> Real Portrait Verified
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5 flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-amber-500" />
                    {viewingCandidate.city ? `${viewingCandidate.city}, ` : ''}{viewingCandidate.state} ({viewingCandidate.pincode})
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setViewingCandidate(null)}
                className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-600 font-bold"
              >
                ✕
              </button>
            </div>

            {/* Candidate Overview Details */}
            <div className="py-5 space-y-6">
              {/* Privacy Notice */}
              <div className="p-3.5 rounded-2xl bg-blue-50 border border-blue-200 text-xs text-blue-900 flex items-start gap-2.5">
                <ShieldCheck className="w-4 h-4 text-[#2563EB] shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold block">JOBSETU Privacy Protected Profile</span>
                  <p className="text-blue-800 text-[11px] mt-0.5">
                    Candidate phone number and residential street address remain private until an in-app interview is mutually scheduled to ensure female worker safety and harassment prevention.
                  </p>
                </div>
              </div>

              {/* Core Attributes */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-[10px] uppercase font-bold text-gray-400 block">Experience</span>
                  <span className="text-xs font-bold text-gray-900 mt-0.5 block">
                    {viewingCandidate.experience || 'Fresher'}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-[10px] uppercase font-bold text-gray-400 block">Education</span>
                  <span className="text-xs font-bold text-gray-900 mt-0.5 block">
                    {viewingCandidate.education || 'Secondary'}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-[10px] uppercase font-bold text-gray-400 block">Availability</span>
                  <span className="text-xs font-bold text-gray-900 mt-0.5 block">
                    {viewingCandidate.jobPreferences?.availability || 'Immediate'}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-[10px] uppercase font-bold text-gray-400 block">Age Eligibility</span>
                  <span className="text-xs font-bold text-emerald-700 mt-0.5 block flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> 18+ Certified
                  </span>
                </div>
              </div>

              {/* Skills */}
              <div>
                <h4 className="text-xs font-bold text-gray-800 uppercase tracking-wider mb-2">
                  Skills & Vocational Competencies
                </h4>
                <div className="flex flex-wrap gap-1.5">
                  {(viewingCandidate.skills || []).map((sk) => (
                    <span
                      key={sk}
                      className="px-3 py-1 rounded-lg bg-blue-50 text-[#2563EB] text-xs font-bold border border-blue-200"
                    >
                      {sk}
                    </span>
                  ))}
                  {(viewingCandidate.customSkills || []).map((sk) => (
                    <span
                      key={sk}
                      className="px-3 py-1 rounded-lg bg-amber-50 text-amber-700 text-xs font-bold border border-amber-200"
                    >
                      {sk}
                    </span>
                  ))}
                </div>
              </div>

              {/* Job Preferences */}
              <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200 space-y-2 text-xs">
                <h4 className="font-bold text-gray-900">Work Preferences</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-gray-600">
                  <p>
                    <strong>Expected Salary:</strong>{' '}
                    {viewingCandidate.jobPreferences?.expectedSalary || 'Negotiable'}
                  </p>
                  <p>
                    <strong>Preferred Job Types:</strong>{' '}
                    {(viewingCandidate.jobPreferences?.jobTypes || ['Full-time']).join(', ')}
                  </p>
                  {viewingCandidate.preferredLocations && viewingCandidate.preferredLocations.length > 0 && (
                    <p className="sm:col-span-2">
                      <strong>Willing to relocate to:</strong>{' '}
                      {viewingCandidate.preferredLocations.join(', ')}
                    </p>
                  )}
                </div>
              </div>

              {/* Verified Resume Attachment if uploaded */}
              {viewingCandidate.resumeUrl && (
                <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-between">
                  <div>
                    <h5 className="text-xs font-bold text-emerald-950 flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>{viewingCandidate.resumeName || 'Candidate Verified Resume'}</span>
                    </h5>
                    <p className="text-[11px] text-emerald-700 mt-0.5">
                      Full background, qualifications, and employment history document.
                    </p>
                  </div>
                  <a
                    href={viewingCandidate.resumeUrl}
                    download={viewingCandidate.resumeName || 'Resume.pdf'}
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition-colors cursor-pointer"
                  >
                    Download CV
                  </a>
                </div>
              )}
            </div>

            {/* Bottom Actions */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setViewingCandidate(null)}
                className="px-4 py-2.5 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-100 cursor-pointer"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => {
                  const c = viewingCandidate;
                  setViewingCandidate(null);
                  handleStartChat(c);
                }}
                className="px-5 py-2.5 rounded-xl bg-[#2563EB] hover:bg-blue-700 text-white font-bold text-xs shadow-md flex items-center gap-2 cursor-pointer"
              >
                <MessageSquare className="w-4 h-4" />
                <span>Message & Recruit</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
