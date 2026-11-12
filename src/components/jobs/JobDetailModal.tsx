import React, { useState, useEffect } from 'react';
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
  GraduationCap,
  FileText,
  Sparkles,
  User,
  Phone,
  Mail
} from 'lucide-react';
import { Job, WorkerProfile, ApplicationFormDetails, EDUCATION_LEVELS, EXPERIENCE_LEVELS } from '../../types';
import { calculateDistance } from '../../lib/geo';
import { calculateJobMatch } from '../../lib/smartMatch';
import { ResumeUploadModal } from '../common/ResumeUploadModal';

interface JobDetailModalProps {
  job: Job | null;
  onClose: () => void;
  workerProfile?: WorkerProfile | null;
  workerLat?: number;
  workerLng?: number;
  isSaved: boolean;
  hasApplied: boolean;
  onApply: (
    job: Job,
    note?: string,
    resumeUrl?: string,
    resumeName?: string,
    formDetails?: ApplicationFormDetails
  ) => Promise<void>;
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
  const [applicantName, setApplicantName] = useState('');
  const [applicantPhone, setApplicantPhone] = useState('');
  const [applicantEmail, setApplicantEmail] = useState('');
  const [applicantCity, setApplicantCity] = useState('');
  const [applicantState, setApplicantState] = useState('');
  const [applicantPincode, setApplicantPincode] = useState('');
  const [qualification, setQualification] = useState('');
  const [experience, setExperience] = useState('');
  const [expectedSalary, setExpectedSalary] = useState('');
  const [availabilityToJoin, setAvailabilityToJoin] = useState('Immediate (Within 1-3 Days)');
  const [preferredShift, setPreferredShift] = useState('Full-Time Day Shift');
  const [applicationSubject, setApplicationSubject] = useState('');
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

  const buildFormalApplicationLetter = (
    targetJob: Job,
    nameVal: string,
    qualVal: string,
    expVal: string,
    cityVal: string,
    availVal: string
  ) => {
    const skillsList =
      workerProfile?.skills && workerProfile.skills.length > 0
        ? workerProfile.skills.slice(0, 4).join(', ')
        : targetJob.requiredSkills.slice(0, 3).join(', ');
    return `Respected Hiring Manager (${targetJob.employerName}),\n\nWith reference to your job listing for the position of "${targetJob.title}" at ${targetJob.city}, ${targetJob.state}, I wish to formally submit my application for your kind consideration.\n\nI hold a qualification of ${qualVal || 'Higher Secondary'} with ${expVal || 'practical'} experience and proficiency in ${skillsList || 'relevant domain duties'}. I currently reside in ${cityVal || targetJob.city} and am available to join ${availVal.toLowerCase()}.\n\nI assure you of my punctuality, dedication, and hard work. Kindly review my application and grant me an opportunity for an interview.\n\nThanking you,\nYours sincerely,\n${nameVal || 'Applicant'}`;
  };

  useEffect(() => {
    if (job) {
      const initName = workerProfile?.fullName || '';
      const initPhone = workerProfile?.phone || '';
      const initEmail = workerProfile?.email || '';
      const initCity = workerProfile?.city || job.city || '';
      const initState = workerProfile?.state || job.state || '';
      const initPin = workerProfile?.pincode || job.pincode || '';
      const initQual = workerProfile?.education || job.education || 'Higher secondary';
      const initExp = workerProfile?.experience || job.experience || 'Fresher';
      const initSal = `₹${job.minSalary.toLocaleString('en-IN')} - ₹${job.maxSalary.toLocaleString('en-IN')} / ${job.paymentFrequency.replace('Per ', '')}`;
      const initAvail = 'Immediate (Within 1-3 Days)';

      setApplicantName(initName);
      setApplicantPhone(initPhone);
      setApplicantEmail(initEmail);
      setApplicantCity(initCity);
      setApplicantState(initState);
      setApplicantPincode(initPin);
      setQualification(initQual);
      setExperience(initExp);
      setExpectedSalary(initSal);
      setAvailabilityToJoin(initAvail);
      setPreferredShift(job.employmentType || 'Full-Time Day Shift');
      setApplicationSubject(`Application for the post of ${job.title} at ${job.employerName}`);
      setCustomResumeUrl(workerProfile?.resumeUrl || '');
      setCustomResumeName(workerProfile?.resumeName || '');
      setApplySuccess(false);
      setErrorMsg(null);

      setCandidateNote(
        buildFormalApplicationLetter(job, initName, initQual, initExp, initCity, initAvail)
      );
    }
  }, [job, workerProfile]);

  if (!job) return null;

  const distance = calculateDistance(workerLat, workerLng, job.lat, job.lng);
  const smartMatch = workerProfile ? calculateJobMatch(workerProfile, job) : null;
  const todayFormatted = new Date().toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });

  const handleApply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!applicantName.trim()) {
      setErrorMsg('Please enter your Full Name in the application form.');
      return;
    }
    if (!applicantPhone.trim()) {
      setErrorMsg('Please provide your contact phone number so the employer can reach you.');
      return;
    }
    try {
      setApplying(true);
      setErrorMsg(null);
      await onApply(job, candidateNote.trim(), customResumeUrl, customResumeName, {
        applicantName: applicantName.trim(),
        applicantPhone: applicantPhone.trim(),
        applicantEmail: applicantEmail.trim(),
        applicantCity: applicantCity.trim(),
        applicantState: applicantState.trim(),
        applicantPincode: applicantPincode.trim(),
        qualification,
        experience,
        expectedSalary: expectedSalary.trim(),
        availabilityToJoin,
        preferredShift,
        applicationSubject: applicationSubject.trim()
      });
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
      <div className="relative w-full max-w-4xl bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden my-auto max-h-[92vh] flex flex-col animate-in fade-in zoom-in-95 duration-150">
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
              className="p-2 rounded-xl text-gray-400 hover:text-gray-700 hover:bg-white/80 transition-colors cursor-pointer"
              title="Share job"
            >
              <Share2 className="w-4 h-4" />
            </button>
            <button
              onClick={() => onToggleSave(job.id)}
              className={`p-2 rounded-xl transition-colors cursor-pointer ${
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

          {/* Description & Responsibilities */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-gray-900 mb-1.5">
                Job Description
              </h3>
              <p className="text-gray-700 leading-relaxed text-xs whitespace-pre-line">
                {job.description}
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3">
              <div>
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-gray-900 mb-1.5">
                  Required Skills
                </h3>
                <div className="flex flex-wrap gap-1.5">
                  {job.requiredSkills.map((skill) => (
                    <span
                      key={skill}
                      className="px-2.5 py-1 rounded-lg bg-blue-50 border border-blue-200 text-[#2563EB] font-bold text-[11px]"
                    >
                      ✓ {skill}
                    </span>
                  ))}
                </div>
              </div>
              {job.benefits && job.benefits.length > 0 && (
                <div>
                  <h3 className="text-xs font-extrabold uppercase tracking-wider text-gray-900 mb-1.5">
                    Perks & Benefits
                  </h3>
                  <div className="flex flex-wrap gap-1.5">
                    {job.benefits.map((b) => (
                      <span
                        key={b}
                        className="px-2.5 py-0.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-semibold"
                      >
                        ★ {b}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ================= FORMAL JOB APPLICATION FORMAT ================= */}
          <div className="pt-4 border-t-2 border-gray-200">
            {hasApplied || applySuccess ? (
              <div className="p-6 rounded-3xl bg-emerald-50 border-2 border-emerald-200 text-emerald-950 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-wider text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded-full">
                      Official Application Submitted
                    </span>
                    <p className="font-black text-base text-emerald-950 mt-0.5">
                      Your Formal Job Application Has Been Sent to {job.employerName}
                    </p>
                  </div>
                </div>
                <p className="text-xs text-emerald-800 leading-relaxed">
                  Your structured application sheet (including your qualification, experience, expected salary, joining availability, and formal cover letter) is now in the employer's pipeline. Track live updates in <strong>My Applications</strong>.
                </p>
              </div>
            ) : (
              <form onSubmit={handleApply} className="bg-slate-50/70 rounded-3xl border-2 border-blue-100 p-5 sm:p-7 space-y-5">
                {/* Formal Application Sheet Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200">
                  <div>
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-600 text-white text-[10px] font-black uppercase tracking-wider">
                      <FileText className="w-3 h-3" /> Official JOBSETU Application Format
                    </span>
                    <h3 className="text-base sm:text-lg font-black text-slate-900 mt-1">
                      Formal Job Application Sheet
                    </h3>
                    <p className="text-xs text-slate-500">
                      Complete your official application details below before sending to <strong>{job.employerName}</strong>.
                    </p>
                  </div>
                  {smartMatch && (
                    <div className="px-3.5 py-2 rounded-2xl bg-blue-50 border border-blue-200 flex items-center gap-2.5 self-start sm:self-auto">
                      <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center font-black text-xs">
                        {smartMatch.score}%
                      </div>
                      <div>
                        <p className="text-[11px] font-extrabold text-blue-950">Profile Match</p>
                        <p className="text-[10px] text-blue-700">Verified Candidate Fit</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Formal To / Date / Subject Block */}
                <div className="bg-white rounded-2xl p-4 border border-slate-200 text-xs space-y-2 shadow-2xs">
                  <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-100">
                    <div>
                      <span className="font-bold text-slate-400 uppercase text-[10px] block">To (Recipient Employer)</span>
                      <p className="font-extrabold text-slate-900">
                        The Hiring Manager, {job.employerName}
                      </p>
                      <p className="text-[11px] text-slate-500">
                        {job.area ? `${job.area}, ` : ''}{job.city}, {job.state} - {job.pincode}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="font-bold text-slate-400 uppercase text-[10px] block">Application Date</span>
                      <span className="font-extrabold text-slate-800">{todayFormatted}</span>
                    </div>
                  </div>
                  <div className="pt-1">
                    <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">
                      Subject of Application *
                    </label>
                    <input
                      type="text"
                      required
                      value={applicationSubject}
                      onChange={(e) => setApplicationSubject(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-blue-600 font-bold text-slate-900 text-xs outline-none"
                    />
                  </div>
                </div>

                {/* Section 1: Applicant Personal & Contact Details */}
                <div className="space-y-3">
                  <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-blue-600" />
                    <span>1. Applicant Personal & Contact Details</span>
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">Full Name *</label>
                      <input
                        type="text"
                        required
                        value={applicantName}
                        onChange={(e) => setApplicantName(e.target.value)}
                        placeholder="Your Full Name"
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-xs font-semibold outline-none focus:border-blue-600"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">Mobile / Phone Number *</label>
                      <div className="relative">
                        <Phone className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                        <input
                          type="tel"
                          required
                          value={applicantPhone}
                          onChange={(e) => setApplicantPhone(e.target.value)}
                          placeholder="+91 98765 43210"
                          className="w-full pl-8 pr-3 py-2 rounded-xl border border-slate-300 bg-white text-xs font-semibold outline-none focus:border-blue-600"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">Email Address</label>
                      <div className="relative">
                        <Mail className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                        <input
                          type="email"
                          value={applicantEmail}
                          onChange={(e) => setApplicantEmail(e.target.value)}
                          placeholder="you@example.com"
                          className="w-full pl-8 pr-3 py-2 rounded-xl border border-slate-300 bg-white text-xs font-semibold outline-none focus:border-blue-600"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">Current City *</label>
                      <input
                        type="text"
                        required
                        value={applicantCity}
                        onChange={(e) => setApplicantCity(e.target.value)}
                        placeholder="City"
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-xs font-semibold outline-none focus:border-blue-600"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">State *</label>
                      <input
                        type="text"
                        required
                        value={applicantState}
                        onChange={(e) => setApplicantState(e.target.value)}
                        placeholder="State"
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-xs font-semibold outline-none focus:border-blue-600"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">Pincode</label>
                      <input
                        type="text"
                        value={applicantPincode}
                        onChange={(e) => setApplicantPincode(e.target.value)}
                        placeholder="6-digit Pincode"
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-xs font-semibold outline-none focus:border-blue-600"
                      />
                    </div>
                  </div>
                </div>

                {/* Section 2: Qualification, Experience & Joining Terms */}
                <div className="space-y-3">
                  <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                    <GraduationCap className="w-3.5 h-3.5 text-blue-600" />
                    <span>2. Qualification, Experience & Joining Preferences</span>
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">Qualification</label>
                      <select
                        value={qualification}
                        onChange={(e) => setQualification(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-xs font-semibold outline-none focus:border-blue-600"
                      >
                        {EDUCATION_LEVELS.map((ed) => (
                          <option key={ed} value={ed}>
                            {ed}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">Total Experience</label>
                      <select
                        value={experience}
                        onChange={(e) => setExperience(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-xs font-semibold outline-none focus:border-blue-600"
                      >
                        {EXPERIENCE_LEVELS.map((ex) => (
                          <option key={ex} value={ex}>
                            {ex}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">Availability to Join</label>
                      <select
                        value={availabilityToJoin}
                        onChange={(e) => setAvailabilityToJoin(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-xs font-semibold outline-none focus:border-blue-600"
                      >
                        <option value="Immediate (Within 1-3 Days)">Immediate (Within 1-3 Days)</option>
                        <option value="Within 7 Days">Within 7 Days</option>
                        <option value="Within 15 Days">Within 15 Days</option>
                        <option value="30 Days Notice">30 Days Notice</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">Expected Salary / Wage</label>
                      <input
                        type="text"
                        value={expectedSalary}
                        onChange={(e) => setExpectedSalary(e.target.value)}
                        placeholder="e.g. ₹18,000 / month"
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-xs font-semibold outline-none focus:border-blue-600"
                      />
                    </div>
                  </div>
                </div>

                {/* Section 3: Formal Application Letter */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-extrabold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5 text-blue-600" />
                      <span>3. Formal Application Letter / Statement *</span>
                    </label>
                    <button
                      type="button"
                      onClick={() =>
                        setCandidateNote(
                          buildFormalApplicationLetter(
                            job,
                            applicantName,
                            qualification,
                            experience,
                            applicantCity,
                            availabilityToJoin
                          )
                        )
                      }
                      className="text-[11px] font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 cursor-pointer"
                    >
                      <Sparkles className="w-3 h-3" />
                      <span>Auto-Format Official Letter</span>
                    </button>
                  </div>
                  <textarea
                    rows={6}
                    required
                    value={candidateNote}
                    onChange={(e) => setCandidateNote(e.target.value)}
                    placeholder="Write your formal job application statement..."
                    className="w-full px-4 py-3 rounded-2xl border border-slate-300 bg-white text-xs leading-relaxed outline-none focus:border-[#2563EB] font-medium"
                  />
                </div>

                {/* Resume Attachment Row */}
                <div className="p-3.5 rounded-2xl bg-white border border-slate-200 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <Briefcase className="w-4 h-4 text-blue-600" />
                    <div>
                      <p className="text-xs font-bold text-gray-800">
                        {customResumeName ? `Attached Resume: ${customResumeName}` : 'Attach Resume / Bio-Data (Optional)'}
                      </p>
                      <p className="text-[10px] text-gray-500">
                        {customResumeName ? 'Included with your formal application sheet' : 'Upload PDF/DOCX bio-data or certificate for faster selection'}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setResumeModalOpen(true)}
                    className="px-3.5 py-1.5 rounded-xl bg-blue-50 border border-blue-200 hover:bg-blue-100 text-xs font-bold text-blue-700 transition-colors cursor-pointer"
                  >
                    {customResumeName ? 'Change File' : 'Upload CV'}
                  </button>
                </div>

                {errorMsg && (
                  <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold">
                    {errorMsg}
                  </div>
                )}

                <div className="flex items-center justify-between pt-2">
                  <button
                    type="button"
                    onClick={() => setReportOpen(!reportOpen)}
                    className="text-xs text-gray-400 hover:text-red-600 flex items-center gap-1 font-semibold cursor-pointer"
                  >
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>Report this job</span>
                  </button>

                  <button
                    type="submit"
                    disabled={applying}
                    className="py-3.5 px-7 rounded-2xl bg-[#2563EB] hover:bg-blue-700 text-white font-black text-xs sm:text-sm shadow-lg shadow-blue-500/25 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {applying ? <span>Submitting Formal Application...</span> : (
                      <>
                        <Send className="w-4 h-4" />
                        <span>Submit Formal Job Application</span>
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
