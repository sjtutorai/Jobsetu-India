import React, { useState, useMemo } from 'react';
import { useJobs } from '../../context/JobContext';
import { useAuth } from '../../context/AuthContext';
import {
  Search,
  Filter,
  MapPin,
  Briefcase,
  IndianRupee,
  Navigation,
  SlidersHorizontal,
  X,
  RefreshCw,
  Sparkles,
  ArrowUpDown
} from 'lucide-react';
import { Job, INDIAN_STATES_AND_UTS, SKILL_CATEGORIES_DATA } from '../../types';
import { JobCard } from './JobCard';
import { JobDetailModal } from './JobDetailModal';
import { calculateDistance } from '../../lib/geo';

interface JobDiscoveryProps {
  onOpenAuth: () => void;
  profileCompletion?: number;
  onCompleteProfile?: () => void;
}

export const JobDiscovery: React.FC<JobDiscoveryProps> = ({
  onOpenAuth,
  profileCompletion = 100,
  onCompleteProfile
}) => {
  const { jobs, myApplications, savedJobIds, applyToJob, toggleSaveJob, reportItem, loadingJobs } = useJobs();
  const { currentUser, workerProfile } = useAuth();

  const workerLat = workerProfile?.lat;
  const workerLng = workerProfile?.lng;

  // Search & Filters state - default 50km if worker location is known
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedState, setSelectedState] = useState<string>('All');
  const [selectedJobType, setSelectedJobType] = useState<string>('All');
  const [selectedExperience, setSelectedExperience] = useState<string>('All');
  const [selectedSkill, setSelectedSkill] = useState<string>('All');
  const [minSalaryFilter, setMinSalaryFilter] = useState<number>(0);
  const [under50kmOnly, setUnder50kmOnly] = useState<boolean>(Boolean(workerLat && workerLng));
  const [sortBy, setSortBy] = useState<'nearest' | 'newest' | 'salary_high' | 'salary_low'>(
    workerLat && workerLng ? 'nearest' : 'newest'
  );
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);

  // Modal state
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);

  // Flatten all skills for filter dropdown
  const allSkills = useMemo(() => {
    const set = new Set<string>();
    Object.values(SKILL_CATEGORIES_DATA).forEach(list => list.forEach(s => set.add(s)));
    return Array.from(set).sort();
  }, []);

  // Filter and sort jobs
  const filteredJobs = useMemo(() => {
    return jobs.filter((job) => {
      // 1. Text search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = job.title.toLowerCase().includes(q);
        const matchesCompany = job.employerName.toLowerCase().includes(q);
        const matchesCity = job.city.toLowerCase().includes(q);
        const matchesSkills = job.requiredSkills.some(s => s.toLowerCase().includes(q));
        if (!matchesTitle && !matchesCompany && !matchesCity && !matchesSkills) {
          return false;
        }
      }

      // 2. Category
      if (selectedCategory !== 'All' && job.category !== selectedCategory) {
        return false;
      }

      // 3. State
      if (selectedState !== 'All' && job.state !== selectedState) {
        return false;
      }

      // 4. Job type
      if (selectedJobType !== 'All' && job.employmentType !== selectedJobType) {
        return false;
      }

      // 5. Experience
      if (selectedExperience !== 'All' && job.experience !== selectedExperience) {
        return false;
      }

      // 6. Skill
      if (selectedSkill !== 'All' && !job.requiredSkills.includes(selectedSkill)) {
        return false;
      }

      // 7. Salary
      if (minSalaryFilter > 0 && job.maxSalary < minSalaryFilter) {
        return false;
      }

      // 8. Under 50km radius filter
      if (under50kmOnly) {
        const dist = calculateDistance(workerLat, workerLng, job.lat, job.lng);
        if (dist === null || dist > 50) {
          return false;
        }
      }

      return true;
    }).sort((a, b) => {
      if (sortBy === 'nearest') {
        const distA = calculateDistance(workerLat, workerLng, a.lat, a.lng) ?? Infinity;
        const distB = calculateDistance(workerLat, workerLng, b.lat, b.lng) ?? Infinity;
        return distA - distB;
      }
      if (sortBy === 'salary_high') {
        return b.maxSalary - a.maxSalary;
      }
      if (sortBy === 'salary_low') {
        return a.minSalary - b.minSalary;
      }
      // Newest
      return (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0);
    });
  }, [
    jobs,
    searchQuery,
    selectedCategory,
    selectedState,
    selectedJobType,
    selectedExperience,
    selectedSkill,
    minSalaryFilter,
    under50kmOnly,
    sortBy,
    workerLat,
    workerLng
  ]);

  const handleApplyClick = (job: Job) => {
    if (!currentUser) {
      onOpenAuth();
      return;
    }
    setSelectedJob(job);
  };

  const resetFilters = () => {
    setSearchQuery('');
    setSelectedCategory('All');
    setSelectedState('All');
    setSelectedJobType('All');
    setSelectedExperience('All');
    setSelectedSkill('All');
    setMinSalaryFilter(0);
    setUnder50kmOnly(false);
    setSortBy('newest');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-[#2563EB] bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200">
                Pan-India Opportunities
              </span>
              {workerProfile?.city && (
                <span className="text-xs text-gray-500 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-amber-500" />
                  Your location: {workerProfile.city}, {workerProfile.state}
                </span>
              )}
            </div>
            <h1 className="text-3xl font-black text-gray-900 tracking-tight mt-1">
              Find Suitable Jobs Across India
            </h1>
            <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
              Discover verified employment opportunities directly from employers with zero fee cuts.
            </p>
          </div>

          {/* Quick 50km Radius Filter Toggle */}
          <div className="flex items-center gap-3 bg-white p-2.5 rounded-2xl border border-gray-200 shadow-xs">
            <button
              type="button"
              onClick={() => setUnder50kmOnly(!under50kmOnly)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                under50kmOnly
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Navigation className="w-3.5 h-3.5" />
              <span>Jobs under 50 km radius</span>
              {under50kmOnly && <span className="bg-white/20 px-1.5 py-0.2 rounded text-[10px]">ON</span>}
            </button>
          </div>
        </div>
      </div>

      {/* Main Search Bar & Quick Filter Strip */}
      <div className="bg-white p-4 rounded-3xl border border-gray-100 shadow-sm mb-6 space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-5 h-5 text-gray-400 absolute left-3.5 top-3.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by job title, skill (e.g. Electrician, Sales), or company..."
              className="w-full pl-11 pr-4 py-3 rounded-2xl border border-gray-200 focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB] outline-none text-sm font-medium"
            />
          </div>

          <div className="flex items-center gap-2">
            {/* Sort Dropdown */}
            <div className="relative">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="px-4 py-3 rounded-2xl border border-gray-200 bg-white text-xs font-bold text-gray-700 outline-none focus:border-[#2563EB] cursor-pointer"
              >
                <option value="newest">Newest First</option>
                <option value="nearest">Nearest (by Distance)</option>
                <option value="salary_high">Salary: High to Low</option>
                <option value="salary_low">Salary: Low to High</option>
              </select>
            </div>

            {/* Mobile Filter Drawer Trigger */}
            <button
              onClick={() => setFilterDrawerOpen(!filterDrawerOpen)}
              className="py-3 px-4 rounded-2xl bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold text-xs flex items-center gap-2 cursor-pointer transition-colors"
            >
              <SlidersHorizontal className="w-4 h-4" />
              <span>Filters</span>
            </button>
          </div>
        </div>

        {/* Quick Sector Filter Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
          <button
            onClick={() => setSelectedCategory('All')}
            className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-colors ${
              selectedCategory === 'All'
                ? 'bg-[#2563EB] text-white shadow-xs'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            All Sectors
          </button>
          {['Retail', 'Hospitality', 'Technical', 'Transport', 'Office', 'Education', 'Digital', 'Agriculture'].map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-colors ${
                selectedCategory === cat
                  ? 'bg-[#2563EB] text-white shadow-xs'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Advanced Filters Drawer / Section */}
      {filterDrawerOpen && (
        <div className="bg-slate-50 p-6 rounded-3xl border border-gray-200 mb-6 space-y-4 animate-in fade-in duration-150">
          <div className="flex items-center justify-between pb-3 border-b border-gray-200">
            <h3 className="font-extrabold text-sm text-gray-900 flex items-center gap-2">
              <Filter className="w-4 h-4 text-[#2563EB]" />
              <span>Refine Job Search Filters</span>
            </h3>
            <button
              onClick={resetFilters}
              className="text-xs font-bold text-red-600 hover:underline"
            >
              Reset all filters
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
            {/* State */}
            <div>
              <label className="font-bold text-gray-700 block mb-1">State / Union Territory</label>
              <select
                value={selectedState}
                onChange={(e) => setSelectedState(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-gray-300 bg-white font-medium outline-none focus:border-[#2563EB]"
              >
                <option value="All">All Indian States & UTs</option>
                {INDIAN_STATES_AND_UTS.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            {/* Employment Type */}
            <div>
              <label className="font-bold text-gray-700 block mb-1">Employment Type</label>
              <select
                value={selectedJobType}
                onChange={(e) => setSelectedJobType(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-gray-300 bg-white font-medium outline-none focus:border-[#2563EB]"
              >
                <option value="All">All Types</option>
                <option value="Full-time">Full-time</option>
                <option value="Part-time">Part-time</option>
                <option value="Temporary">Temporary</option>
                <option value="Contract">Contract</option>
                <option value="Work from home">Work from home</option>
              </select>
            </div>

            {/* Experience Level */}
            <div>
              <label className="font-bold text-gray-700 block mb-1">Experience Level</label>
              <select
                value={selectedExperience}
                onChange={(e) => setSelectedExperience(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-gray-300 bg-white font-medium outline-none focus:border-[#2563EB]"
              >
                <option value="All">Any Experience</option>
                <option value="Fresher">Fresher</option>
                <option value="Less than one year">Less than 1 year</option>
                <option value="1–3 years">1–3 years</option>
                <option value="3–5 years">3–5 years</option>
                <option value="More than five years">5+ years</option>
              </select>
            </div>

            {/* Specific Skill Filter */}
            <div>
              <label className="font-bold text-gray-700 block mb-1">Specific Skill</label>
              <select
                value={selectedSkill}
                onChange={(e) => setSelectedSkill(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-gray-300 bg-white font-medium outline-none focus:border-[#2563EB]"
              >
                <option value="All">All Skills</option>
                {allSkills.map((sk) => (
                  <option key={sk} value={sk}>
                    {sk}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Profile Completion Unlock Tier Banner */}
      {profileCompletion < 100 && (
        <div className="p-4 sm:p-5 rounded-3xl bg-gradient-to-r from-amber-50 via-amber-100/60 to-yellow-50 border border-amber-200/90 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500 text-white flex items-center justify-center font-bold text-sm shrink-0 shadow-xs">
              {profileCompletion}%
            </div>
            <div>
              <p className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                <span>Profile Completion Unlock</span>
                <span className="text-[10px] bg-amber-200 text-amber-950 px-2 py-0.5 rounded-full font-black">
                  {Math.max(0, filteredJobs.length - Math.max(3, Math.ceil(filteredJobs.length * (profileCompletion / 100))))} Shops/Jobs Locked
                </span>
              </p>
              <p className="text-[11px] text-amber-800/90 mt-0.5">
                Showing {Math.min(filteredJobs.length, Math.max(3, Math.ceil(filteredJobs.length * (profileCompletion / 100))))} of {filteredJobs.length} opportunities. Complete your profile to 100% to unlock all local shops, contact details & priority employer recommendations!
              </p>
            </div>
          </div>

          {onCompleteProfile && (
            <button
              type="button"
              onClick={onCompleteProfile}
              className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-xs transition-all flex items-center gap-1.5 self-start sm:self-auto cursor-pointer shrink-0"
            >
              <span>Complete Profile (+{100 - profileCompletion}%)</span>
            </button>
          )}
        </div>
      )}

      {profileCompletion >= 100 && (
        <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center justify-between gap-2">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>100% Complete Profile: Full Access to all local shops & employer vacancies within 50 km radius unlocked without limitations.</span>
          </span>
          <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-900 px-2 py-0.5 rounded-md">
            All Openings Unlocked
          </span>
        </div>
      )}

      {/* Results Header */}
      <div className="flex items-center justify-between mb-4 text-xs text-gray-500 font-semibold px-1">
        <span>
          Showing{' '}
          <strong className="text-gray-900">
            {profileCompletion < 100
              ? Math.min(filteredJobs.length, Math.max(3, Math.ceil(filteredJobs.length * (profileCompletion / 100))))
              : filteredJobs.length}
          </strong>{' '}
          of <strong className="text-gray-900">{filteredJobs.length}</strong> active opportunities
        </span>
        {under50kmOnly && (
          <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
            Filtered within 50 km of your coordinates
          </span>
        )}
      </div>

      {/* Jobs Grid */}
      {loadingJobs ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <div key={n} className="bg-white rounded-3xl p-6 border border-gray-100 shadow-xs animate-pulse space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-gray-200" />
                <div className="space-y-2 flex-1">
                  <div className="h-4 bg-gray-200 rounded w-3/4" />
                  <div className="h-3 bg-gray-100 rounded w-1/2" />
                </div>
              </div>
              <div className="h-10 bg-gray-100 rounded-xl" />
              <div className="h-8 bg-gray-200 rounded-xl w-1/3" />
            </div>
          ))}
        </div>
      ) : filteredJobs.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-gray-100 shadow-sm max-w-lg mx-auto space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-blue-50 text-[#2563EB] flex items-center justify-center mx-auto">
            <Search className="w-7 h-7" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900">No jobs match your criteria</h3>
            <p className="text-xs text-gray-500 mt-1 leading-relaxed">
              Try turning off the 50 km distance filter or broadening your sector / skill selections.
            </p>
          </div>
          <button
            onClick={resetFilters}
            className="py-2.5 px-5 rounded-xl bg-[#2563EB] text-white text-xs font-bold shadow-md cursor-pointer"
          >
            Clear All Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {(profileCompletion < 100
            ? filteredJobs.slice(0, Math.max(3, Math.ceil(filteredJobs.length * (profileCompletion / 100))))
            : filteredJobs
          ).map((job) => {
            const hasApplied = myApplications.some(a => a.jobId === job.id && a.status !== 'Withdrawn');
            const isSaved = savedJobIds.includes(job.id);

            return (
              <JobCard
                key={job.id}
                job={job}
                workerLat={workerLat}
                workerLng={workerLng}
                isSaved={isSaved}
                hasApplied={hasApplied}
                onApplyClick={handleApplyClick}
                onSaveToggle={toggleSaveJob}
                onViewDetails={(j) => setSelectedJob(j)}
              />
            );
          })}
        </div>
      )}

      {/* Detailed Modal */}
      <JobDetailModal
        job={selectedJob}
        onClose={() => setSelectedJob(null)}
        workerProfile={workerProfile}
        workerLat={workerLat}
        workerLng={workerLng}
        isSaved={selectedJob ? savedJobIds.includes(selectedJob.id) : false}
        hasApplied={selectedJob ? myApplications.some(a => a.jobId === selectedJob.id && a.status !== 'Withdrawn') : false}
        onApply={applyToJob}
        onToggleSave={toggleSaveJob}
        onReport={(id, r) => reportItem('job', id, r)}
      />
    </div>
  );
};
