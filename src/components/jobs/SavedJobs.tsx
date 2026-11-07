import React, { useState } from 'react';
import { useJobs } from '../../context/JobContext';
import { useAuth } from '../../context/AuthContext';
import { JobCard } from './JobCard';
import { JobDetailModal } from './JobDetailModal';
import { Job } from '../../types';
import { Bookmark, Search, ArrowRight } from 'lucide-react';

interface SavedJobsProps {
  onDiscoverJobs: () => void;
}

export const SavedJobs: React.FC<SavedJobsProps> = ({ onDiscoverJobs }) => {
  const { jobs, savedJobIds, myApplications, applyToJob, toggleSaveJob, reportItem } = useJobs();
  const { workerProfile } = useAuth();
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const savedJobsList = jobs.filter((job) => savedJobIds.includes(job.id));

  const filteredList = savedJobsList.filter((job) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      job.title.toLowerCase().includes(q) ||
      job.employerName.toLowerCase().includes(q) ||
      job.city.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-xs border border-gray-200/80">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-gray-100">
          <div>
            <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <Bookmark className="w-5 h-5 text-amber-500 fill-amber-500" />
              <span>Saved Job Opportunities</span>
            </h1>
            <p className="text-xs text-gray-500 mt-0.5">
              Review and apply to employment openings you bookmarked for later.
            </p>
          </div>
          <span className="px-3 py-1 rounded-full bg-amber-50 text-amber-700 text-xs font-bold self-start sm:self-auto">
            {savedJobsList.length} Saved
          </span>
        </div>

        {savedJobsList.length > 0 && (
          <div className="pt-4">
            <div className="relative max-w-md">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search saved jobs..."
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-gray-200 outline-none focus:border-[#2563EB]"
              />
            </div>
          </div>
        )}
      </div>

      {savedJobsList.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-gray-200">
          <Bookmark className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-gray-800">No saved jobs yet</h3>
          <p className="text-xs text-gray-500 max-w-sm mx-auto mt-1 mb-5">
            When browsing vacancies in Find Jobs, click the bookmark icon on any job card to save it here.
          </p>
          <button
            type="button"
            onClick={onDiscoverJobs}
            className="px-5 py-2.5 rounded-xl bg-[#2563EB] hover:bg-blue-700 text-white font-bold text-xs shadow-md transition-all inline-flex items-center gap-2 cursor-pointer"
          >
            <span>Explore Open Jobs</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      ) : filteredList.length === 0 ? (
        <div className="bg-white rounded-3xl p-8 text-center border border-gray-200">
          <p className="text-xs text-gray-500">No saved jobs match your search query.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredList.map((job) => (
            <JobCard
              key={job.id}
              job={job}
              isSaved={true}
              hasApplied={myApplications.some((a) => a.jobId === job.id)}
              onApplyClick={(j) => setSelectedJob(j)}
              onSaveToggle={(id) => toggleSaveJob(id)}
              onViewDetails={(j) => setSelectedJob(j)}
            />
          ))}
        </div>
      )}

      {selectedJob && (
        <JobDetailModal
          job={selectedJob}
          onClose={() => setSelectedJob(null)}
          workerProfile={workerProfile}
          isSaved={savedJobIds.includes(selectedJob.id)}
          hasApplied={myApplications.some((a) => a.jobId === selectedJob.id)}
          onApply={applyToJob}
          onToggleSave={toggleSaveJob}
          onReport={(jobId, reason) => reportItem('job', jobId, reason)}
        />
      )}
    </div>
  );
};
