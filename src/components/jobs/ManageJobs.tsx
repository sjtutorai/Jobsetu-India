import React, { useState } from 'react';
import { useJobs } from '../../context/JobContext';
import {
  Briefcase,
  Plus,
  Search,
  MoreVertical,
  Users,
  Clock,
  MapPin,
  PauseCircle,
  PlayCircle,
  XCircle,
  Trash2,
  Edit,
  Eye,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { Job, JobStatus } from '../../types';

interface ManageJobsProps {
  onPostNewJob: () => void;
  onEditJob: (job: Job) => void;
  onViewApplicants: (jobId: string) => void;
}

export const ManageJobs: React.FC<ManageJobsProps> = ({
  onPostNewJob,
  onEditJob,
  onViewApplicants
}) => {
  const { myJobs, changeJobStatus, deleteJob } = useJobs();

  const [activeTab, setActiveTab] = useState<'all' | 'active' | 'draft' | 'paused' | 'closed'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [actionMenuOpen, setActionMenuOpen] = useState<string | null>(null);

  const filteredJobs = myJobs.filter((job) => {
    if (activeTab !== 'all' && job.status !== activeTab) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        job.title.toLowerCase().includes(q) ||
        job.city.toLowerCase().includes(q) ||
        job.category.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const getStatusBadge = (status: JobStatus) => {
    switch (status) {
      case 'active':
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">Active</span>;
      case 'draft':
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-700">Draft</span>;
      case 'paused':
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800">Paused</span>;
      case 'closed':
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-red-100 text-red-800">Closed</span>;
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
            Manage Job Listings
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
            Track applications, edit specifications, and manage recruitment pipeline.
          </p>
        </div>

        <button
          onClick={onPostNewJob}
          className="py-3 px-5 rounded-2xl bg-[#F59E0B] hover:bg-amber-600 text-white font-bold text-xs shadow-md shadow-amber-500/25 flex items-center gap-2 cursor-pointer transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Post a New Job</span>
        </button>
      </div>

      {/* Tabs & Search Strip */}
      <div className="bg-white p-4 rounded-3xl border border-gray-100 shadow-sm mb-6 flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto scrollbar-none pb-1 md:pb-0">
          {(['all', 'active', 'draft', 'paused', 'closed'] as const).map((tab) => {
            const count = tab === 'all' ? myJobs.length : myJobs.filter(j => j.status === tab).length;
            const isSelected = activeTab === tab;
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold capitalize whitespace-nowrap transition-all ${
                  isSelected
                    ? 'bg-[#111827] text-white shadow-xs'
                    : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                }`}
              >
                <span>{tab}</span>
                <span className={`ml-1.5 px-1.5 py-0.2 rounded-full text-[10px] ${
                  isSelected ? 'bg-white/20 text-white' : 'bg-gray-200 text-gray-700'
                }`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Search */}
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search my jobs..."
            className="w-full pl-9 pr-3 py-2 rounded-xl border border-gray-200 text-xs outline-none focus:border-[#F59E0B]"
          />
        </div>
      </div>

      {/* Jobs List */}
      {filteredJobs.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-gray-100 shadow-xs max-w-md mx-auto space-y-3">
          <Briefcase className="w-10 h-10 text-gray-300 mx-auto" />
          <h3 className="text-base font-bold text-gray-900">No job listings found</h3>
          <p className="text-xs text-gray-500">
            {activeTab === 'all'
              ? 'You have not posted any jobs yet. Click "Post a New Job" to recruit talent across India.'
              : `No jobs in "${activeTab}" status.`}
          </p>
          <button
            onClick={onPostNewJob}
            className="py-2.5 px-5 rounded-xl bg-[#F59E0B] text-white text-xs font-bold shadow-md cursor-pointer"
          >
            Create Your First Job
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredJobs.map((job) => (
            <div
              key={job.id}
              className="bg-white rounded-3xl p-6 border border-gray-100 hover:border-amber-200 shadow-xs hover:shadow-md transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
              <div className="space-y-2 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded">
                    {job.category}
                  </span>
                  {getStatusBadge(job.status)}
                  <span className="text-xs text-gray-400">•</span>
                  <span className="text-xs text-gray-500">
                    Posted on {job.createdAt?.seconds ? new Date(job.createdAt.seconds * 1000).toLocaleDateString('en-IN') : 'Recently'}
                  </span>
                </div>

                <h3 className="text-lg font-black text-gray-900">{job.title}</h3>

                <div className="flex flex-wrap items-center gap-4 text-xs text-gray-600">
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-gray-400" />
                    <span>{job.city}, {job.state} ({job.pincode})</span>
                  </span>
                  <span>
                    ₹{job.minSalary.toLocaleString('en-IN')} - ₹{job.maxSalary.toLocaleString('en-IN')} /{job.paymentFrequency.replace('Per ', '')}
                  </span>
                  <span>{job.vacancies} Vacancies</span>
                </div>
              </div>

              {/* Stats & Actions */}
              <div className="flex items-center gap-3 pt-3 md:pt-0 border-t md:border-t-0 border-gray-100">
                {/* Applicants Counter Button */}
                <button
                  onClick={() => onViewApplicants(job.id)}
                  className="py-2.5 px-4 rounded-xl bg-blue-50 hover:bg-blue-100 text-[#2563EB] font-bold text-xs flex items-center gap-2 cursor-pointer transition-colors"
                >
                  <Users className="w-4 h-4" />
                  <span>{job.applicationsCount || 0} Applicants</span>
                </button>

                {/* Edit Button */}
                <button
                  onClick={() => onEditJob(job)}
                  className="p-2.5 rounded-xl border border-gray-200 hover:bg-gray-50 text-gray-700 cursor-pointer"
                  title="Edit Job"
                >
                  <Edit className="w-4 h-4" />
                </button>

                {/* Status Toggles */}
                {job.status === 'active' && (
                  <button
                    onClick={() => changeJobStatus(job.id, 'paused')}
                    className="p-2.5 rounded-xl border border-amber-200 text-amber-700 hover:bg-amber-50 cursor-pointer"
                    title="Pause Job"
                  >
                    <PauseCircle className="w-4 h-4" />
                  </button>
                )}
                {job.status === 'paused' && (
                  <button
                    onClick={() => changeJobStatus(job.id, 'active')}
                    className="p-2.5 rounded-xl border border-emerald-200 text-emerald-700 hover:bg-emerald-50 cursor-pointer"
                    title="Reopen / Activate Job"
                  >
                    <PlayCircle className="w-4 h-4" />
                  </button>
                )}
                {job.status === 'draft' && (
                  <button
                    onClick={() => changeJobStatus(job.id, 'active')}
                    className="p-2.5 rounded-xl bg-emerald-600 text-white font-bold text-xs cursor-pointer"
                  >
                    Publish
                  </button>
                )}
                {job.status !== 'closed' && (
                  <button
                    onClick={() => changeJobStatus(job.id, 'closed')}
                    className="p-2.5 rounded-xl border border-gray-200 hover:bg-red-50 hover:text-red-600 text-gray-500 cursor-pointer"
                    title="Close Job"
                  >
                    <XCircle className="w-4 h-4" />
                  </button>
                )}

                {/* Delete */}
                <button
                  onClick={() => {
                    if (window.confirm(`Are you sure you want to delete "${job.title}"?`)) {
                      deleteJob(job.id);
                    }
                  }}
                  className="p-2.5 rounded-xl border border-red-100 hover:bg-red-50 text-red-600 cursor-pointer"
                  title="Delete Job"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
