import React, { useState } from 'react';
import { useJobs } from '../../context/JobContext';
import {
  Briefcase,
  Building2,
  Calendar,
  Clock,
  MapPin,
  CheckCircle2,
  FileText,
  Phone,
  Mail,
  GraduationCap,
  IndianRupee,
  Printer,
  X
} from 'lucide-react';
import { Application, ApplicationStatus } from '../../types';

export const WorkerApplications: React.FC = () => {
  const { myApplications, updateApplicationStatus } = useJobs();
  const [filterStatus, setFilterStatus] = useState<string>('All');
  const [withdrawingId, setWithdrawingId] = useState<string | null>(null);
  const [confirmWithdrawId, setConfirmWithdrawId] = useState<string | null>(null);
  const [viewingApplication, setViewingApplication] = useState<Application | null>(null);

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
    try {
      setWithdrawingId(appId);
      await updateApplicationStatus(appId, 'Withdrawn');
      setConfirmWithdrawId(null);
    } finally {
      setWithdrawingId(null);
    }
  };

  const formatAppDate = (appliedAt: any) => {
    if (!appliedAt) return 'Recently';
    if (appliedAt.seconds) {
      return new Date(appliedAt.seconds * 1000).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      });
    }
    return new Date(appliedAt).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Header */}
      <div className="mb-6">
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-50 text-[#2563EB] border border-blue-200 text-[11px] font-black uppercase tracking-wider mb-1">
          <FileText className="w-3.5 h-3.5" /> Official Job Applications
        </span>
        <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
          My Submitted Applications
        </h1>
        <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
          View your structured formal application sheets and track real-time employer review and interview invitations.
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
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
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
              ? 'You have not applied for any jobs yet. Browse available jobs and submit your formal application!'
              : `No applications with status "${filterStatus}".`}
          </p>
        </div>
      ) : (
        <div className="space-y-5">
          {filteredApps.map((app) => (
            <div
              key={app.id}
              className="bg-white rounded-3xl p-6 sm:p-7 border border-gray-200 shadow-xs hover:shadow-md transition-all space-y-5"
            >
              {/* Formal Application Header */}
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-4 border-b border-gray-100">
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-md bg-slate-100 text-slate-700 font-mono text-[10px] font-bold">
                      APP REF #{app.id.slice(0, 8).toUpperCase()}
                    </span>
                    <span className="text-xs text-gray-400">•</span>
                    <span className="text-xs font-semibold text-gray-500">
                      Date: {formatAppDate(app.appliedAt)}
                    </span>
                  </div>
                  <p className="text-xs font-bold text-[#2563EB] pt-1">
                    To: The Hiring Manager, <span className="text-gray-900">{app.employerName}</span>
                  </p>
                  <h3 className="text-lg sm:text-xl font-black text-gray-900">
                    {app.applicationSubject || `Application for the post of ${app.jobTitle}`}
                  </h3>
                </div>

                <div className="flex flex-wrap items-center gap-2.5 shrink-0">
                  {getStatusBadge(app.status)}

                  <button
                    type="button"
                    onClick={() => setViewingApplication(app)}
                    className="px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-[#2563EB] text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>View Formal Sheet</span>
                  </button>

                  {['Applied', 'Under Review'].includes(app.status) && (
                    confirmWithdrawId === app.id ? (
                      <div className="flex items-center gap-1.5 bg-red-50 px-2.5 py-1 rounded-xl border border-red-200">
                        <button
                          type="button"
                          onClick={() => handleWithdraw(app.id)}
                          disabled={withdrawingId === app.id}
                          className="text-[11px] font-black text-red-700 hover:underline cursor-pointer"
                        >
                          {withdrawingId === app.id ? 'Withdrawing...' : 'Confirm'}
                        </button>
                        <span className="text-gray-300">|</span>
                        <button
                          type="button"
                          onClick={() => setConfirmWithdrawId(null)}
                          className="text-[11px] font-semibold text-gray-500 hover:text-gray-800 cursor-pointer"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setConfirmWithdrawId(app.id)}
                        className="text-xs font-bold text-gray-400 hover:text-red-600 transition-colors cursor-pointer"
                      >
                        Withdraw
                      </button>
                    )
                  )}
                </div>
              </div>

              {/* Structured Application Summary Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100">
                  <span className="text-[10px] font-bold uppercase text-gray-400 block">Applicant Name</span>
                  <span className="font-bold text-gray-900 mt-0.5 block">{app.workerName}</span>
                  {app.workerPhone && <span className="text-[11px] text-gray-500 block">{app.workerPhone}</span>}
                </div>
                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100">
                  <span className="text-[10px] font-bold uppercase text-gray-400 block">Qualification & Exp</span>
                  <span className="font-bold text-gray-900 mt-0.5 block">{app.workerEducation}</span>
                  <span className="text-[11px] text-gray-500 block">{app.workerExperience}</span>
                </div>
                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100">
                  <span className="text-[10px] font-bold uppercase text-gray-400 block">Expected Salary</span>
                  <span className="font-bold text-emerald-700 mt-0.5 block">
                    {app.expectedSalary || 'As per company standard'}
                  </span>
                </div>
                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100">
                  <span className="text-[10px] font-bold uppercase text-gray-400 block">Availability to Join</span>
                  <span className="font-bold text-blue-700 mt-0.5 block">
                    {app.availabilityToJoin || 'Immediate'}
                  </span>
                  {app.preferredShift && <span className="text-[10px] text-gray-500 block">{app.preferredShift}</span>}
                </div>
              </div>

              {/* Interview Details Card if Interview Scheduled */}
              {app.status === 'Interview Scheduled' && app.interviewDetails && (
                <div className="p-4 rounded-2xl bg-purple-50/80 border border-purple-200 text-xs text-purple-950 space-y-2">
                  <div className="flex items-center gap-2 font-bold text-purple-900 text-sm">
                    <Calendar className="w-4 h-4 text-purple-700" />
                    <span>Interview Invitation from {app.employerName}</span>
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

              {/* Formal Application Letter Preview */}
              {app.candidateNote && (
                <div className="text-xs text-gray-700 bg-slate-50/90 p-4 rounded-2xl border border-slate-200/80 whitespace-pre-line leading-relaxed">
                  <span className="font-extrabold text-slate-900 uppercase tracking-wider text-[10px] block mb-1.5">
                    Formal Application Statement / Cover Letter:
                  </span>
                  {app.candidateNote}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Printable Formal Application Sheet Modal */}
      {viewingApplication && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-10 shadow-2xl border border-gray-200 my-auto space-y-6 animate-in fade-in zoom-in-95">
            <div className="flex items-start justify-between border-b-2 border-gray-900 pb-4">
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-[#2563EB]">
                  JOBSETU INDIA • OFFICIAL EMPLOYMENT APPLICATION
                </span>
                <h2 className="text-xl sm:text-2xl font-black text-gray-900 mt-0.5">
                  FORMAL JOB APPLICATION SHEET
                </h2>
                <p className="text-xs text-gray-500">
                  Application Reference: #{viewingApplication.id.slice(0, 10).toUpperCase()} • Date: {formatAppDate(viewingApplication.appliedAt)}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setViewingApplication(null)}
                className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs sm:text-sm text-gray-800">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-200">
                <div>
                  <span className="text-[10px] font-bold uppercase text-gray-400 block">To (Employer)</span>
                  <p className="font-extrabold text-gray-900">The Hiring Manager</p>
                  <p className="font-bold text-[#2563EB]">{viewingApplication.employerName}</p>
                  <p className="text-xs text-gray-600">Post Applied: {viewingApplication.jobTitle}</p>
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase text-gray-400 block">From (Applicant)</span>
                  <p className="font-extrabold text-gray-900">{viewingApplication.workerName}</p>
                  {viewingApplication.workerPhone && <p className="text-xs text-gray-600">Phone: {viewingApplication.workerPhone}</p>}
                  {viewingApplication.workerEmail && <p className="text-xs text-gray-600">Email: {viewingApplication.workerEmail}</p>}
                  <p className="text-xs text-gray-600">
                    Location: {viewingApplication.workerCity ? `${viewingApplication.workerCity}, ` : ''}{viewingApplication.workerState || 'India'} {viewingApplication.workerPincode ? `- ${viewingApplication.workerPincode}` : ''}
                  </p>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-blue-50/70 border border-blue-200">
                <span className="text-[10px] font-black uppercase text-blue-700 block">Subject</span>
                <p className="font-extrabold text-gray-900">
                  {viewingApplication.applicationSubject || `Application for the post of ${viewingApplication.jobTitle} at ${viewingApplication.employerName}`}
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-white border border-gray-200 whitespace-pre-line leading-relaxed text-xs sm:text-sm font-medium text-gray-800">
                {viewingApplication.candidateNote ||
                  `Respected Sir/Madam,\n\nI wish to formally apply for the post of ${viewingApplication.jobTitle} at ${viewingApplication.employerName}. Kindly find my qualification and experience particulars below.\n\nYours sincerely,\n${viewingApplication.workerName}`}
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-gray-50 border border-gray-200">
                  <span className="text-[10px] font-bold text-gray-400 uppercase block">Qualification</span>
                  <span className="font-bold text-gray-900">{viewingApplication.workerEducation}</span>
                </div>
                <div className="p-3 rounded-xl bg-gray-50 border border-gray-200">
                  <span className="text-[10px] font-bold text-gray-400 uppercase block">Experience</span>
                  <span className="font-bold text-gray-900">{viewingApplication.workerExperience}</span>
                </div>
                <div className="p-3 rounded-xl bg-gray-50 border border-gray-200">
                  <span className="text-[10px] font-bold text-gray-400 uppercase block">Expected Salary</span>
                  <span className="font-bold text-emerald-700">{viewingApplication.expectedSalary || 'Standard'}</span>
                </div>
                <div className="p-3 rounded-xl bg-gray-50 border border-gray-200">
                  <span className="text-[10px] font-bold text-gray-400 uppercase block">Joining Notice</span>
                  <span className="font-bold text-blue-700">{viewingApplication.availabilityToJoin || 'Immediate'}</span>
                </div>
              </div>

              {viewingApplication.workerSkills && viewingApplication.workerSkills.length > 0 && (
                <div>
                  <span className="text-[10px] font-bold uppercase text-gray-400 block mb-1.5">Verified Skills</span>
                  <div className="flex flex-wrap gap-1.5">
                    {viewingApplication.workerSkills.map((s) => (
                      <span key={s} className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-800 text-xs font-bold">
                        ✓ {s}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-gray-100">
              <div>{getStatusBadge(viewingApplication.status)}</div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Application</span>
                </button>
                <button
                  type="button"
                  onClick={() => setViewingApplication(null)}
                  className="px-5 py-2 rounded-xl bg-[#2563EB] text-white text-xs font-bold cursor-pointer"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
