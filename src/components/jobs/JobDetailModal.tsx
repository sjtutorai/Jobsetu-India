import React, { useState } from 'react';
import {
  X,
  Building2,
  MapPin,
  Clock,
  IndianRupee,
  ShieldCheck,
  Bookmark,
  Share2,
  AlertTriangle,
  CheckCircle2,
  Send,
  Navigation,
  Calendar,
  Briefcase,
  GraduationCap
} from 'lucide-react';
import { Job } from '../../types';
import { calculateDistance } from '../../lib/geo';
import { calculateJobMatch } from '../../lib/smartMatch';
import { WorkerProfile } from '../../types';
import { ResumeUploadModal } from '../common/ResumeUploadModal';

interface JobDetailModalProps {
  job: Job | null;
  onClose: () => void;
  workerProfile?: WorkerProfile | null;
  workerLat?: number;
  workerLng?: number;
  isSaved: boolean;
  hasApplied: boolean;
  onApply: (job: Job, note?: string, resumeUrl?: string, resumeName?: string) => Promise<void>;
  onToggleSave: (jobId: string) => void;
  onReport: (jobId: string, reason: string) => void;
}

export const JobDetailModal: React.FC<JobDetailModalProps> = ({
  job,
  onClose,
  workerProfile,
  workerLat,
  workerLng,
  isSaved,
  hasApplied,
  onApply,
  onToggleSave,
  onReport
}) => {
  const [candidateNote, setCandidateNote] = useState('');
  const [applying, setApplying] = useState(false);
  const [applySuccess, setApplySuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [reportOpen, setReportOpen] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [reportSubmitted, setReportSubmitted] = useState(false);
  const [copied, setCopied] = useState(false);
  const [resumeModalOpen, setResumeModalOpen] = useState(false);
  const [customResumeUrl, setCustomResumeUrl] = useState(workerProfile?.resumeUrl || '');
  const [customResumeName, setCustomResumeName] = useState(workerProfile?.resumeName || '');

  if (!job) return null;

  const distance = calculateDistance(workerLat, workerLng, job.lat, job.lng);
  const smartMatch = workerProfile ? calculateJobMatch(workerProfile, job) : null;

  const handleApply = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setApplying(true);
      setErrorMsg(null);
      await onApply(job, candidateNote.trim(), customResumeUrl, customResumeName);
      setApplySuccess(true);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to submit application.');
    } finally {
      setApplying(false);
    }
  };

  const handleShare = () => {
    const url = window.location.href;
    navigator.clipboard?.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleReportSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportReason.trim()) return;
    onReport(job.id, reportReason.trim());
    setReportSubmitted(true);
    setTimeout(() => {
      setReportSubmitted(false);
      setReportOpen(false);
    }, 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-3xl bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden my-auto max-h-[90vh] flex flex-col animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-5 bg-gradient-to-r from-blue-50 to-amber-50/50 border-b border-gray-100 flex items-start justify-between shrink-0">
          <div className="flex items-center gap-4">
            {job.employerLogo ? (
              <img
                src={job.employerLogo}
                alt={job.employerName}
                className="w-14 h-14 rounded-2xl object-cover border border-white shadow-md"
              />
            ) : (
              <div className="w-14 h-14 rounded-2xl bg-blue-100 text-[#2563EB] flex items-center justify-center font-bold text-xl shadow-xs">
                <Building2 className="w-7 h-7" />
              </div>
            )}
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-gray-700">{job.employerName}</span>
                {job.isEmployerVerified && (
                  <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full">
                    <ShieldCheck className="w-3 h-3 text-emerald-700" />
                    <span>Verified Business</span>
                  </span>
                )}
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight mt-0.5">
                {job.title}
              </h2>
              <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500 mt-1">
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-gray-400" />
                  <span>{job.area ? `${job.area}, ` : ''}{job.city}, {job.state} - {job.pincode}</span>
                </span>
                {distance !== null && (
                  <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 text-[11px] flex items-center gap-1">
                    <Navigation className="w-3 h-3" />
                    <span>{distance} km away</span>
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={handleShare}
              className="p-2 rounded-xl text-gray-400 hover:text-gray-700 hover:bg-white/80 transition-colors"
              title="Share job"
            >
              <Share2 className="w-4 h-4" />
            </button>
            <button
              onClick={() => onToggleSave(job.id)}
              className={`p-2 rounded-xl transition-colors ${
                isSaved ? 'text-[#F59E0B] bg-amber-50' : 'text-gray-400 hover:text-gray-700'
              }`}
              title={isSaved ? 'Remove from saved' : 'Save job'}
            >
              <Bookmark className={`w-4 h-4 ${isSaved ? 'fill-current' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-gray-400 hover:text-gray-700 hover:bg-white/80 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {copied && (
          <div className="bg-emerald-600 text-white text-xs font-bold py-1.5 text-center">
            Job link copied to clipboard!
          </div>
        )}

        {/* Scrollable Body */}
        <div className="p-6 sm:p-8 overflow-y-auto space-y-6 text-sm text-gray-800">
          {/* Key Metrics Banner */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3.5 rounded-2xl bg-gray-50 border border-gray-200">
              <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block">Salary</span>
              <p className="text-sm font-black text-gray-900 mt-0.5">
                ₹{job.minSalary.toLocaleString('en-IN')} - ₹{job.maxSalary.toLocaleString('en-IN')}
              </p>
              <span className="text-[10px] text-gray-500 font-medium">/{job.paymentFrequency.replace('Per ', '')}</span>
            </div>

            <div className="p-3.5 rounded-2xl bg-gray-50 border border-gray-200">
              <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block">Job Type</span>
              <p className="text-sm font-black text-[#2563EB] mt-0.5">{job.employmentType}</p>
              <span className="text-[10px] text-gray-500">{job.workingHours || 'Standard shift'}</span>
            </div>

            <div className="p-3.5 rounded-2xl bg-gray-50 border border-gray-200">
              <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block">Experience</span>
              <p className="text-sm font-black text-gray-900 mt-0.5">{job.experience}</p>
              <span className="text-[10px] text-gray-500">{job.education}</span>
            </div>

            <div className="p-3.5 rounded-2xl bg-gray-50 border border-gray-200">
              <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block">Openings</span>
              <p className="text-sm font-black text-gray-900 mt-0.5">{job.vacancies} Vacancies</p>
              <span className="text-[10px] text-emerald-700 font-semibold">{job.applicationsCount || 0} applicants</span>
            </div>
          </div>

          {/* Description */}
          <div>
            <h3 className="text-sm font-extrabold uppercase tracking-wider text-gray-900 mb-2">
              Job Description
            </h3>
            <p className="text-gray-700 leading-relaxed text-sm whitespace-pre-line">
              {job.description}
            </p>
          </div>

          {/* Responsibilities */}
          {job.responsibilities && (
            <div>
              <h3 className="text-sm font-extrabold uppercase tracking-wider text-gray-900 mb-2">
                Key Responsibilities
              </h3>
              <p className="text-gray-700 leading-relaxed text-sm whitespace-pre-line">
                {job.responsibilities}
              </p>
            </div>
          )}

          {/* Required Skills */}
          <div>
            <h3 className="text-sm font-extrabold uppercase tracking-wider text-gray-900 mb-2.5">
              Required Skills & Competencies
            </h3>
            <div className="flex flex-wrap gap-2">
              {job.requiredSkills.map((skill) => (
                <span
                  key={skill}
                  className="px-3 py-1.5 rounded-xl bg-blue-50 border border-blue-200 text-[#2563EB] font-bold text-xs"
                >
                  ✓ {skill}
                </span>
              ))}
            </div>
          </div>

          {/* Benefits */}
          {job.benefits && job.benefits.length > 0 && (
            <div>
              <h3 className="text-sm font-extrabold uppercase tracking-wider text-gray-900 mb-2.5">
                Benefits & Perks
              </h3>
              <div className="flex flex-wrap gap-2">
                {job.benefits.map((b) => (
                  <span
                    key={b}
                    className="px-3 py-1 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold"
                  >
                    ★ {b}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Employer Info */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-gray-200 text-xs text-gray-600 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="font-bold text-gray-900">Employer Information</span>
              <span className="text-[11px] text-gray-500">
                Deadline: {job.deadline || 'Ongoing recruitment'}
              </span>
            </div>
            <p className="text-gray-700">
              Posted by {job.employerName}. JOBSETU guarantees zero placement cuts and direct communication between job seekers and hiring teams.
            </p>
          </div>

          {/* Application Form */}
          <div className="pt-2 border-t border-gray-200">
            {hasApplied || applySuccess ? (
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 flex items-center gap-3">
                <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" />
                <div>
                  <p className="font-bold text-sm">Application Submitted Successfully</p>
                  <p className="text-xs text-emerald-700">
                    The employer has received your profile and will contact you via JOBSETU messaging or scheduled interview.
                  </p>
                </div>
              </div>
            ) : (
              <form onSubmit={handleApply} className="space-y-3">
                {smartMatch && (
                  <div className="p-3.5 rounded-2xl bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center font-black text-xs shadow-xs">
                        {smartMatch.score}%
                      </div>
                      <div>
                        <p className="text-xs font-bold text-blue-950">AI Smart Profile Match</p>
                        <p className="text-[11px] text-blue-700">
                          {smartMatch.matchReasons.join(' • ') || 'Good profile compatibility'}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                <label className="block text-xs font-bold text-gray-800">
                  Add an optional note to the employer:
                </label>
                <textarea
                  rows={2}
                  value={candidateNote}
                  onChange={(e) => setCandidateNote(e.target.value)}
                  placeholder="e.g. I have 2 years of practical experience in this sector and can join immediately..."
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-xs outline-none focus:border-[#2563EB]"
                />

                {/* Resume Attachment Row */}
                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <Briefcase className="w-4 h-4 text-gray-600" />
                    <div>
                      <p className="text-xs font-bold text-gray-800">
                        {customResumeName ? `Resume: ${customResumeName}` : 'Attach Resume / CV (Optional)'}
                      </p>
                      <p className="text-[10px] text-gray-500">
                        {customResumeName ? 'Attached and ready to send' : 'Add verified background details for higher callback rates'}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setResumeModalOpen(true)}
                    className="px-3 py-1.5 rounded-xl bg-white border border-gray-300 hover:border-blue-500 text-xs font-bold text-gray-700 hover:text-blue-600 transition-colors cursor-pointer"
                  >
                    {customResumeName ? 'Change File' : 'Upload CV'}
                  </button>
                </div>

                {errorMsg && (
                  <div className="p-3 rounded-xl bg-red-50 text-red-700 text-xs">
                    {errorMsg}
                  </div>
                )}

                <div className="flex items-center justify-between pt-2">
                  <button
                    type="button"
                    onClick={() => setReportOpen(!reportOpen)}
                    className="text-xs text-gray-400 hover:text-red-600 flex items-center gap-1 font-semibold"
                  >
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>Report this job</span>
                  </button>

                  <button
                    type="submit"
                    disabled={applying}
                    className="py-3 px-6 rounded-xl bg-[#2563EB] hover:bg-blue-700 text-white font-bold text-sm shadow-md shadow-blue-500/25 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {applying ? <span>Submitting...</span> : (
                      <>
                        <Send className="w-4 h-4" />
                        <span>Apply Now for this Job</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}

            <ResumeUploadModal
              isOpen={resumeModalOpen}
              onClose={() => setResumeModalOpen(false)}
              currentResumeUrl={customResumeUrl}
              currentResumeName={customResumeName}
              onSave={async (url, name) => {
                setCustomResumeUrl(url);
                setCustomResumeName(name);
              }}
            />

            {/* Report Form Drawer */}
            {reportOpen && (
              <div className="mt-4 p-4 rounded-2xl bg-red-50 border border-red-200 text-xs">
                {reportSubmitted ? (
                  <p className="text-red-800 font-bold">Report submitted. Thank you for keeping JOBSETU safe.</p>
                ) : (
                  <form onSubmit={handleReportSubmit} className="space-y-2">
                    <p className="font-bold text-red-900">Report Inappropriate or Suspicious Listing</p>
                    <input
                      type="text"
                      required
                      value={reportReason}
                      onChange={(e) => setReportReason(e.target.value)}
                      placeholder="Why are you reporting this job? (e.g. Asking for money, false location)"
                      className="w-full px-3 py-2 rounded-lg border border-red-300 bg-white text-xs outline-none"
                    />
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setReportOpen(false)}
                        className="px-3 py-1 rounded-lg bg-gray-200 text-gray-700 font-bold"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-3 py-1 rounded-lg bg-red-600 text-white font-bold"
                      >
                        Submit Report
                      </button>
                    </div>
                  </form>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
