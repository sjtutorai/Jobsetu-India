import React, { useState } from 'react';
import { useJobs } from '../../context/JobContext';
import {
  Briefcase,
  Building2,
  Calendar,
  Clock,
  MapPin,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Video,
  Phone,
  UserCheck,
  Search,
  ExternalLink
} from 'lucide-react';
import { Application, ApplicationStatus } from '../../types';

export const WorkerApplications: React.FC = () => {
  const { myApplications, updateApplicationStatus } = useJobs();
  const [filterStatus, setFilterStatus] = useState<string>('All');
  const [withdrawingId, setWithdrawingId] = useState<string | null>(null);

  const filteredApps = myApplications.filter(app => {
    if (filterStatus === 'All') return true;
    return app.status === filterStatus;
  });

  const getStatusBadge = (status: ApplicationStatus) => {
    switch (status) {
      case 'Applied':
        return <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-[#2563EB]">Applied</span>;
      case 'Under Review':
        return <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800">Under Review</span>;
      case 'Shortlisted':
        return <span className="px-3 py-1 rounded-full text-xs font-bold bg-indigo-100 text-indigo-800">Shortlisted ★</span>;
      case 'Interview Scheduled':
        return <span className="px-3 py-1 rounded-full text-xs font-bold bg-purple-100 text-purple-800 animate-pulse">Interview Scheduled 📅</span>;
      case 'Selected':
        return <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">Selected 🎉</span>;
      case 'Rejected':
        return <span className="px-3 py-1 rounded-full text-xs font-bold bg-red-100 text-red-800">Not Selected</span>;
      case 'Withdrawn':
        return <span className="px-3 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-600">Withdrawn</span>;
    }
  };

  const handleWithdraw = async (appId: string) => {
    if (window.confirm('Are you sure you want to withdraw this application?')) {
      try {
        setWithdrawingId(appId);
        await updateApplicationStatus(appId, 'Withdrawn');
      } finally {
        setWithdrawingId(null);
      }
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
          My Applications
        </h1>
        <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
          Track the live review and interview status of all jobs you have applied for.
        </p>
      </div>

      {/* Filter Tabs */}
      <div className="bg-white p-3 rounded-2xl border border-gray-100 shadow-sm mb-6 flex items-center gap-1.5 overflow-x-auto scrollbar-none">
        {['All', 'Applied', 'Under Review', 'Shortlisted', 'Interview Scheduled', 'Selected', 'Rejected', 'Withdrawn'].map((st) => {
          const count = st === 'All' ? myApplications.length : myApplications.filter(a => a.status === st).length;
          const isSelected = filterStatus === st;
          return (
            <button
              key={st}
              onClick={() => setFilterStatus(st)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                isSelected
                  ? 'bg-[#2563EB] text-white shadow-xs'
                  : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
              }`}
            >
              <span>{st}</span>
              <span className={`ml-1.5 px-1.5 py-0.2 rounded-full text-[10px] ${
                isSelected ? 'bg-white/20 text-white' : 'bg-gray-200 text-gray-700'
              }`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Applications List */}
      {filteredApps.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-gray-100 shadow-sm max-w-md mx-auto space-y-3">
          <Briefcase className="w-12 h-12 text-gray-300 mx-auto" />
          <h3 className="text-base font-bold text-gray-900">No applications in this category</h3>
          <p className="text-xs text-gray-500">
            {filterStatus === 'All'
              ? 'You have not applied for any jobs yet. Browse available jobs and apply in one click!'
              : `No applications with status "${filterStatus}".`}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredApps.map((app) => (
            <div
              key={app.id}
              className="bg-white rounded-3xl p-6 border border-gray-100 shadow-xs hover:shadow-md transition-all space-y-4"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-gray-100">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-gray-700">{app.employerName}</span>
                    <span className="text-xs text-gray-400">•</span>
                    <span className="text-xs text-gray-500">
                      Applied on {app.appliedAt?.seconds ? new Date(app.appliedAt.seconds * 1000).toLocaleDateString('en-IN') : 'Recently'}
                    </span>
                  </div>
                  <h3 className="text-lg font-black text-gray-900">{app.jobTitle}</h3>
                </div>

                <div className="flex items-center gap-3">
                  {getStatusBadge(app.status)}

                  {['Applied', 'Under Review'].includes(app.status) && (
                    <button
                      onClick={() => handleWithdraw(app.id)}
                      disabled={withdrawingId === app.id}
                      className="text-xs font-bold text-gray-400 hover:text-red-600 transition-colors cursor-pointer"
                    >
                      {withdrawingId === app.id ? 'Withdrawing...' : 'Withdraw'}
                    </button>
                  )}
                </div>
              </div>

              {/* Interview Details Card if Interview Scheduled */}
              {app.status === 'Interview Scheduled' && app.interviewDetails && (
                <div className="p-4 rounded-2xl bg-purple-50/80 border border-purple-200 text-xs text-purple-950 space-y-2">
                  <div className="flex items-center gap-2 font-bold text-purple-900 text-sm">
                    <Calendar className="w-4 h-4 text-purple-700" />
                    <span>Interview Scheduled</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                    <div>
                      <span className="font-bold text-purple-700 block">Date & Time</span>
                      <span>{app.interviewDetails.date} at {app.interviewDetails.time}</span>
                    </div>
                    <div>
                      <span className="font-bold text-purple-700 block">Interview Mode</span>
                      <span className="capitalize">{app.interviewDetails.mode}</span>
                    </div>
                    <div>
                      <span className="font-bold text-purple-700 block">Venue / Meeting Link</span>
                      <span className="font-mono">{app.interviewDetails.venueOrLink}</span>
                    </div>
                  </div>
                  {app.interviewDetails.notes && (
                    <p className="text-[11px] text-purple-800 italic pt-1">
                      Note from employer: {app.interviewDetails.notes}
                    </p>
                  )}
                </div>
              )}

              {/* Candidate Note Sent */}
              {app.candidateNote && (
                <div className="text-xs text-gray-600 bg-gray-50 p-3 rounded-xl border border-gray-100">
                  <span className="font-bold text-gray-700">Your application note: </span>
                  <span>{app.candidateNote}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
