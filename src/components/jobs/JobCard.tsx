import React from 'react';
import {
  Building2,
  MapPin,
  Clock,
  IndianRupee,
  ShieldCheck,
  Bookmark,
  Briefcase,
  ArrowRight,
  CheckCircle2,
  Navigation
} from 'lucide-react';
import { Job } from '../../types';
import { calculateDistance } from '../../lib/geo';

interface JobCardProps {
  job: Job;
  workerLat?: number;
  workerLng?: number;
  isSaved?: boolean;
  hasApplied?: boolean;
  onApplyClick: (job: Job) => void;
  onSaveToggle: (jobId: string) => void;
  onViewDetails: (job: Job) => void;
}

export const JobCard: React.FC<JobCardProps> = ({
  job,
  workerLat,
  workerLng,
  isSaved = false,
  hasApplied = false,
  onApplyClick,
  onSaveToggle,
  onViewDetails
}) => {
  const distance = calculateDistance(workerLat, workerLng, job.lat, job.lng);

  return (
    <div className="relative group bg-white rounded-3xl p-6 border border-gray-100 hover:border-blue-200 shadow-xs hover:shadow-xl hover:shadow-blue-500/5 transition-all duration-300 flex flex-col justify-between">
      {/* Top Header */}
      <div>
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-3">
            {job.employerLogo ? (
              <img
                src={job.employerLogo}
                alt={job.employerName}
                className="w-12 h-12 rounded-2xl object-cover border border-gray-100 shadow-xs"
              />
            ) : (
              <div className="w-12 h-12 rounded-2xl bg-blue-50 text-[#2563EB] flex items-center justify-center font-bold text-base shadow-xs">
                <Building2 className="w-6 h-6" />
              </div>
            )}
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-gray-700 truncate max-w-[180px]">
                  {job.employerName}
                </span>
                {job.isEmployerVerified && (
                  <span title="Verified Employer">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 fill-emerald-100 shrink-0" />
                  </span>
                )}
              </div>
              <h3
                onClick={() => onViewDetails(job)}
                className="text-base sm:text-lg font-extrabold text-gray-900 group-hover:text-[#2563EB] transition-colors cursor-pointer line-clamp-1"
              >
                {job.title}
              </h3>
            </div>
          </div>

          {/* Bookmark Button */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onSaveToggle(job.id);
            }}
            className={`p-2 rounded-xl transition-colors cursor-pointer ${
              isSaved
                ? 'bg-amber-50 text-[#F59E0B]'
                : 'text-gray-400 hover:text-gray-700 hover:bg-gray-100'
            }`}
            title={isSaved ? 'Remove from saved' : 'Save job'}
          >
            <Bookmark className={`w-4 h-4 ${isSaved ? 'fill-current' : ''}`} />
          </button>
        </div>

        {/* Location & Distance Badge */}
        <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500 mb-3">
          <span className="flex items-center gap-1">
            <MapPin className="w-3.5 h-3.5 text-gray-400 shrink-0" />
            <span>
              {job.city}, {job.state}
            </span>
          </span>

          {distance !== null && (
            <span
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold ${
                distance <= 50
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : 'bg-gray-100 text-gray-600'
              }`}
            >
              <Navigation className="w-3 h-3 text-emerald-600" />
              <span>{distance} km away</span>
            </span>
          )}

          <span className="px-2 py-0.5 rounded-md bg-blue-50 text-[#2563EB] font-bold text-[11px]">
            {job.employmentType}
          </span>
        </div>

        {/* Short description */}
        <p className="text-xs text-gray-600 line-clamp-2 leading-relaxed mb-4">
          {job.description}
        </p>

        {/* Required Skills Chips */}
        <div className="flex flex-wrap gap-1.5 mb-5">
          {job.requiredSkills.slice(0, 3).map((skill) => (
            <span
              key={skill}
              className="px-2.5 py-0.5 rounded-lg bg-gray-50 border border-gray-200 text-gray-700 text-[11px] font-semibold"
            >
              {skill}
            </span>
          ))}
          {job.requiredSkills.length > 3 && (
            <span className="px-2 py-0.5 rounded-lg bg-gray-100 text-gray-500 text-[11px]">
              +{job.requiredSkills.length - 3}
            </span>
          )}
        </div>
      </div>

      {/* Bottom Footer: Salary and Action Button */}
      <div className="pt-4 border-t border-gray-100 flex items-center justify-between gap-3">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block">
            Salary
          </span>
          <span className="text-sm font-extrabold text-gray-900 flex items-center">
            ₹{job.minSalary.toLocaleString('en-IN')} - ₹{job.maxSalary.toLocaleString('en-IN')}
            <span className="text-[11px] font-normal text-gray-500 ml-1">/{job.paymentFrequency.replace('Per ', '')}</span>
          </span>
        </div>

        <div className="flex items-center gap-2">
          {hasApplied ? (
            <span className="px-3.5 py-2 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Applied</span>
            </span>
          ) : (
            <button
              type="button"
              onClick={() => onApplyClick(job)}
              className="py-2 px-4 rounded-xl bg-[#2563EB] hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-500/20 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <span>Apply</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}

          <button
            type="button"
            onClick={() => onViewDetails(job)}
            className="p-2 rounded-xl border border-gray-200 hover:bg-gray-50 text-gray-600 hover:text-gray-900 transition-colors text-xs font-semibold"
            title="View Details"
          >
            Details
          </button>
        </div>
      </div>
    </div>
  );
};
