import React, { useState } from 'react';
import { useJobs } from '../../context/JobContext';
import { useAuth } from '../../context/AuthContext';
import { Application, ApplicationStatus } from '../../types';
import {
  Users,
  Search,
  Filter,
  Calendar,
  Clock,
  MapPin,
  Briefcase,
  GraduationCap,
  CheckCircle2,
  XCircle,
  MessageSquare,
  Video,
  Phone,
  ChevronRight,
  Sparkles,
  AlertCircle,
  FileText
} from 'lucide-react';

interface EmployerApplicationsProps {
  onOpenChat?: (conversationId: string) => void;
}

export const EmployerApplications: React.FC<EmployerApplicationsProps> = ({ onOpenChat }) => {
  const { employerApplications, myJobs, updateApplicationStatus, startConversation } = useJobs();
  const { userProfile, employerProfile } = useAuth();

  const [selectedJobId, setSelectedJobId] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Interview Schedule Modal state
  const [schedulingApp, setSchedulingApp] = useState<Application | null>(null);
  const [interviewDate, setInterviewDate] = useState('');
  const [interviewTime, setInterviewTime] = useState('');
  const [interviewMode, setInterviewMode] = useState<'video' | 'in_person' | 'phone'>('video');
  const [interviewLocationOrLink, setInterviewLocationOrLink] = useState('');
  const [interviewNotes, setInterviewNotes] = useState('');

  // Filter applications
  const filteredApplications = employerApplications.filter((app) => {
    if (selectedJobId !== 'all' && app.jobId !== selectedJobId) return false;
    if (selectedStatus !== 'all' && app.status !== selectedStatus) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const nameMatch = app.workerName.toLowerCase().includes(q);
      const titleMatch = app.jobTitle.toLowerCase().includes(q);
      const skillMatch = app.workerSkills.some((s) => s.toLowerCase().includes(q));
      if (!nameMatch && !titleMatch && !skillMatch) return false;
    }
    return true;
  });

  const handleStatusChange = async (applicationId: string, newStatus: ApplicationStatus) => {
    try {
      setActionLoading(applicationId);
      await updateApplicationStatus(applicationId, newStatus);
    } catch (err) {
      console.error('Failed to update status:', err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleOpenInterviewModal = (app: Application) => {
    setSchedulingApp(app);
    setInterviewDate(new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0]);
    setInterviewTime('11:00');
    setInterviewMode('video');
    setInterviewLocationOrLink('Google Meet / JOBSETU Tele-link');
    setInterviewNotes('Please be available 5 minutes prior with any work certificates.');
  };

  const handleConfirmInterview = async () => {
    if (!schedulingApp) return;
    try {
      setActionLoading(schedulingApp.id);
      const mappedMode: 'In-person' | 'Phone Call' | 'Video Call' =
        interviewMode === 'in_person'
          ? 'In-person'
          : interviewMode === 'phone'
          ? 'Phone Call'
          : 'Video Call';

      await updateApplicationStatus(schedulingApp.id, 'Interview Scheduled', {
        date: interviewDate,
        time: interviewTime,
        mode: mappedMode,
        venueOrLink: interviewLocationOrLink,
        notes: interviewNotes
      });
      setSchedulingApp(null);
    } catch (err) {
      console.error('Failed to schedule interview:', err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleStartMessage = async (app: Application) => {
    try {
      setActionLoading(app.id);
      const convId = await startConversation(
        app.workerId,
        app.workerName,
        app.workerPhoto || '',
        'worker',
        `Regarding your application for ${app.jobTitle}`
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

  const getStatusBadge = (status: ApplicationStatus) => {
    switch (status) {
      case 'Applied':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
            Applied
          </span>
        );
      case 'Under Review':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
            Under Review
          </span>
        );
      case 'Shortlisted':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
            Shortlisted
          </span>
        );
      case 'Interview Scheduled':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-purple-50 text-purple-700 border border-purple-200">
            Interview Scheduled
          </span>
        );
      case 'Selected':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            Selected / Hired
          </span>
        );
      case 'Rejected':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-red-50 text-red-600 border border-red-200">
            Rejected
          </span>
        );
      case 'Withdrawn':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-600 border border-gray-200">
            Withdrawn by Candidate
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header and Filter Controls */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200/80">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-gray-100">
          <div>
            <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <Users className="w-5 h-5 text-[#2563EB]" />
              <span>Applicant Pipeline</span>
            </h1>
            <p className="text-xs text-gray-500 mt-0.5">
              Review received resumes, evaluate candidates, schedule interviews, and finalize hiring.
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs font-semibold text-gray-600">
            <span>Total Applicants:</span>
            <span className="px-2.5 py-1 rounded-full bg-blue-50 text-[#2563EB] font-bold">
              {employerApplications.length}
            </span>
          </div>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4">
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Filter by Job Posting</label>
            <select
              value={selectedJobId}
              onChange={(e) => setSelectedJobId(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs font-medium bg-white outline-none focus:border-[#2563EB]"
            >
              <option value="all">All Jobs ({employerApplications.length})</option>
              {myJobs.map((job) => (
                <option key={job.id} value={job.id}>
                  {job.title} ({job.applicationsCount || 0})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Candidate Status</label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs font-medium bg-white outline-none focus:border-[#2563EB]"
            >
              <option value="all">All Statuses</option>
              <option value="Applied">Applied (New)</option>
              <option value="Under Review">Under Review</option>
              <option value="Shortlisted">Shortlisted</option>
              <option value="Interview Scheduled">Interview Scheduled</option>
              <option value="Selected">Selected / Hired</option>
              <option value="Rejected">Rejected</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Search Candidates</label>
            <div className="relative">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search candidate name or skill..."
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-gray-200 text-xs outline-none focus:border-[#2563EB]"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Applications List */}
      {filteredApplications.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-gray-200">
          <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-gray-800">No applications match your filter</h3>
          <p className="text-xs text-gray-500 max-w-md mx-auto mt-1">
            When candidates discover and apply to your job vacancies, their verified profiles will appear here for review.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredApplications.map((app) => (
            <div
              key={app.id}
              className="bg-white rounded-2xl p-6 shadow-xs border border-gray-200 hover:border-blue-200 transition-all"
            >
              <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-5">
                {/* Candidate Info */}
                <div className="flex items-start gap-4">
                  {app.workerPhoto ? (
                    <img
                      src={app.workerPhoto}
                      alt={app.workerName}
                      className="w-14 h-14 rounded-2xl object-cover border border-blue-200 shadow-xs shrink-0"
                    />
                  ) : (
                    <div className="w-14 h-14 rounded-2xl bg-blue-50 text-[#2563EB] font-bold text-lg flex items-center justify-center shrink-0 border border-blue-100">
                      {app.workerName.charAt(0)}
                    </div>
                  )}

                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-base font-bold text-gray-900">{app.workerName}</h3>
                      {getStatusBadge(app.status)}
                    </div>

                    <p className="text-xs font-semibold text-[#2563EB]">
                      Applied for: <span className="text-gray-900 font-bold">{app.jobTitle}</span>
                    </p>

                    <div className="flex flex-wrap items-center gap-3 text-xs text-gray-600 pt-0.5">
                      {app.workerCity && (
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-gray-400" />
                          {app.workerCity}, {app.workerState}
                        </span>
                      )}
                      {app.workerExperience && (
                        <span className="flex items-center gap-1">
                          <Briefcase className="w-3.5 h-3.5 text-gray-400" />
                          {app.workerExperience}
                        </span>
                      )}
                      {app.workerEducation && (
                        <span className="flex items-center gap-1">
                          <GraduationCap className="w-3.5 h-3.5 text-gray-400" />
                          {app.workerEducation}
                        </span>
                      )}
                      <span className="text-gray-400">
                        Applied {new Date(app.appliedAt?.seconds ? app.appliedAt.seconds * 1000 : app.appliedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                      </span>
                    </div>

                    {/* Candidate Skills */}
                    {app.workerSkills && app.workerSkills.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-2">
                        {app.workerSkills.map((sk) => (
                          <span
                            key={sk}
                            className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[11px] font-medium"
                          >
                            {sk}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Candidate Note if submitted */}
                    {app.candidateNote && (
                      <div className="mt-3 p-3 rounded-xl bg-blue-50/60 border border-blue-100 text-xs text-gray-700">
                        <span className="font-bold text-[#2563EB] block text-[11px] mb-0.5">
                          Candidate Application Pitch:
                        </span>
                        "{app.candidateNote}"
                      </div>
                    )}

                    {/* Resume Attachment */}
                    {app.resumeUrl && (
                      <div className="mt-2.5 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-emerald-700 shrink-0" />
                          <div>
                            <span className="font-bold text-emerald-950 block">
                              {app.resumeName || 'Candidate Verified Resume'}
                            </span>
                            <span className="text-[10px] text-emerald-700">Attached to application</span>
                          </div>
                        </div>
                        <a
                          href={app.resumeUrl}
                          download={app.resumeName || 'Resume.pdf'}
                          className="px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition-colors cursor-pointer"
                        >
                          View Resume
                        </a>
                      </div>
                    )}

                    {/* Interview details if scheduled */}
                    {app.status === 'Interview Scheduled' && app.interviewDetails && (
                      <div className="mt-3 p-3.5 rounded-xl bg-purple-50 border border-purple-100 text-xs space-y-1">
                        <span className="font-bold text-purple-900 block flex items-center gap-1.5">
                          <Calendar className="w-4 h-4 text-purple-600" />
                          Interview Scheduled: {app.interviewDetails.date} at {app.interviewDetails.time}
                        </span>
                        <p className="text-purple-800">
                          <strong>Mode:</strong> {app.interviewDetails.mode} • <strong>Venue/Link:</strong> {app.interviewDetails.venueOrLink}
                        </p>
                        {app.interviewDetails.notes && (
                          <p className="text-purple-700 text-[11px] italic">"{app.interviewDetails.notes}"</p>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Workflow Actions */}
                <div className="flex flex-col sm:flex-row lg:flex-col gap-2 shrink-0 pt-3 lg:pt-0">
                  <button
                    onClick={() => handleStartMessage(app)}
                    disabled={actionLoading === app.id}
                    className="px-3.5 py-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-[#2563EB] text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>Message Candidate</span>
                  </button>

                  {app.status === 'Applied' && (
                    <button
                      onClick={() => handleStatusChange(app.id, 'Under Review')}
                      disabled={actionLoading === app.id}
                      className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold flex items-center justify-center gap-1 transition-colors cursor-pointer"
                    >
                      <span>Mark Under Review</span>
                    </button>
                  )}

                  {(app.status === 'Applied' || app.status === 'Under Review') && (
                    <button
                      onClick={() => handleStatusChange(app.id, 'Shortlisted')}
                      disabled={actionLoading === app.id}
                      className="px-3.5 py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold flex items-center justify-center gap-1 transition-colors cursor-pointer"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Shortlist Candidate</span>
                    </button>
                  )}

                  {(app.status === 'Applied' || app.status === 'Under Review' || app.status === 'Shortlisted') && (
                    <button
                      onClick={() => handleOpenInterviewModal(app)}
                      disabled={actionLoading === app.id}
                      className="px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-colors shadow-xs cursor-pointer"
                    >
                      <Calendar className="w-3.5 h-3.5" />
                      <span>Schedule Interview</span>
                    </button>
                  )}

                  {app.status === 'Interview Scheduled' && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleStatusChange(app.id, 'Selected')}
                        disabled={actionLoading === app.id}
                        className="flex-1 px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center justify-center gap-1 transition-colors cursor-pointer"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Hire / Select</span>
                      </button>
                      <button
                        onClick={() => handleStatusChange(app.id, 'Rejected')}
                        disabled={actionLoading === app.id}
                        className="px-3 py-2 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 text-xs font-bold flex items-center justify-center gap-1 transition-colors cursor-pointer"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        <span>Reject</span>
                      </button>
                    </div>
                  )}

                  {app.status !== 'Selected' && app.status !== 'Rejected' && app.status !== 'Withdrawn' && app.status !== 'Interview Scheduled' && (
                    <button
                      onClick={() => handleStatusChange(app.id, 'Rejected')}
                      disabled={actionLoading === app.id}
                      className="text-[11px] text-gray-500 hover:text-red-600 py-1 font-medium transition-colors cursor-pointer"
                    >
                      Decline Application
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Schedule Interview Modal */}
      {schedulingApp && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-gray-100 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100">
              <div>
                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-purple-600" />
                  <span>Schedule Interview</span>
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Candidate: <strong className="text-gray-800">{schedulingApp.workerName}</strong> ({schedulingApp.jobTitle})
                </p>
              </div>
              <button
                onClick={() => setSchedulingApp(null)}
                className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 py-5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Date</label>
                  <input
                    type="date"
                    value={interviewDate}
                    onChange={(e) => setInterviewDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-gray-300 text-xs font-medium outline-none focus:border-purple-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Time</label>
                  <input
                    type="time"
                    value={interviewTime}
                    onChange={(e) => setInterviewTime(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-gray-300 text-xs font-medium outline-none focus:border-purple-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Interview Mode</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setInterviewMode('video')}
                    className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 border transition-all cursor-pointer ${
                      interviewMode === 'video'
                        ? 'border-purple-600 bg-purple-50 text-purple-700'
                        : 'border-gray-200 bg-white text-gray-600'
                    }`}
                  >
                    <Video className="w-3.5 h-3.5" /> Video Call
                  </button>
                  <button
                    type="button"
                    onClick={() => setInterviewMode('phone')}
                    className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 border transition-all cursor-pointer ${
                      interviewMode === 'phone'
                        ? 'border-purple-600 bg-purple-50 text-purple-700'
                        : 'border-gray-200 bg-white text-gray-600'
                    }`}
                  >
                    <Phone className="w-3.5 h-3.5" /> Phone
                  </button>
                  <button
                    type="button"
                    onClick={() => setInterviewMode('in_person')}
                    className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 border transition-all cursor-pointer ${
                      interviewMode === 'in_person'
                        ? 'border-purple-600 bg-purple-50 text-purple-700'
                        : 'border-gray-200 bg-white text-gray-600'
                    }`}
                  >
                    <MapPin className="w-3.5 h-3.5" /> In-Person
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Location, Address or Video Link
                </label>
                <input
                  type="text"
                  value={interviewLocationOrLink}
                  onChange={(e) => setInterviewLocationOrLink(e.target.value)}
                  placeholder="e.g. Office Suite 402, BKC Mumbai or Google Meet link"
                  className="w-full px-3 py-2 rounded-xl border border-gray-300 text-xs outline-none focus:border-purple-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Instructions / Notes for Candidate
                </label>
                <textarea
                  rows={3}
                  value={interviewNotes}
                  onChange={(e) => setInterviewNotes(e.target.value)}
                  placeholder="e.g. Please bring original ID and Aadhaar card."
                  className="w-full px-3 py-2 rounded-xl border border-gray-300 text-xs outline-none focus:border-purple-600"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setSchedulingApp(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-100 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmInterview}
                disabled={actionLoading === schedulingApp.id}
                className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-md cursor-pointer flex items-center gap-2"
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>Send Interview Invite</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
