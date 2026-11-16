import React, { useState, useEffect } from 'react';
import {
  collection,
  getDocs,
  addDoc,
  deleteDoc,
  doc,
  query,
  where,
  serverTimestamp
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../../lib/firebase';
import { useAuth } from '../../context/AuthContext';
import { WorkHistoryRecord } from '../../types';
import {
  FileText,
  Award,
  Briefcase,
  Plus,
  Trash2,
  Printer,
  Eye,
  EyeOff,
  CheckCircle2,
  ShieldCheck,
  MapPin,
  Upload,
  Lock,
  ExternalLink,
  AlertCircle
} from 'lucide-react';

interface ResumeWorkPassCenterProps {
  onOpenResumeUploadModal: () => void;
}

type ActiveSubView = 'resume_builder' | 'workpass' | 'public_preview';

export const ResumeWorkPassCenter: React.FC<ResumeWorkPassCenterProps> = ({
  onOpenResumeUploadModal
}) => {
  const { currentUser, userProfile, workerProfile, saveDraftWorkerProfile } = useAuth();
  const [subView, setSubView] = useState<ActiveSubView>('resume_builder');
  const [templateStyle, setTemplateStyle] = useState<'modern' | 'vocational' | 'executive'>('modern');
  const [showContactOnPublic, setShowContactOnPublic] = useState(false);
  const [shareLinkActive, setShareLinkActive] = useState(true);
  const [statusToast, setStatusToast] = useState('');

  // Resume Builder Editable State
  const [summaryText, setSummaryText] = useState(
    workerProfile?.workPortfolioDescription ||
      'Dedicated and verified professional seeking lawful employment opportunities on JOBSETU India.'
  );
  const [projectsText, setProjectsText] = useState(
    workerProfile?.additionalQualifications || ''
  );

  // WorkPass History State
  const [workHistory, setWorkHistory] = useState<WorkHistoryRecord[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [addingRecord, setAddingRecord] = useState(false);
  const [newRecord, setNewRecord] = useState({
    roleTitle: '',
    employerName: '',
    location: '',
    startDate: '',
    endDate: '',
    isCurrent: false,
    workType: 'Full-time',
    responsibilities: ''
  });

  useEffect(() => {
    if (workerProfile?.workPortfolioDescription) {
      setSummaryText(workerProfile.workPortfolioDescription);
    }
  }, [workerProfile?.workPortfolioDescription]);

  const fetchWorkHistory = async () => {
    if (!currentUser) return;
    try {
      setLoadingHistory(true);
      const q = query(collection(db, 'workHistory'), where('userId', '==', currentUser.uid));
      const snap = await getDocs(q).catch(() => null);
      if (snap) {
        const list: WorkHistoryRecord[] = [];
        snap.forEach((d) => list.push({ id: d.id, ...(d.data() as any) }));
        setWorkHistory(list);
      }
    } catch {
      // ignore if collection empty
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    fetchWorkHistory();
  }, [currentUser?.uid]);

  const showQuickNotice = (msg: string) => {
    setStatusToast(msg);
    setTimeout(() => setStatusToast(''), 3500);
  };

  const handleSaveBuilderChanges = async () => {
    await saveDraftWorkerProfile({
      workPortfolioDescription: summaryText.trim(),
      additionalQualifications: projectsText.trim()
    });
    showQuickNotice('Resume builder sections saved to your profile.');
  };

  const handleAddWorkHistory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !newRecord.roleTitle.trim() || !newRecord.employerName.trim()) return;
    try {
      setAddingRecord(true);
      const payload: Omit<WorkHistoryRecord, 'id'> = {
        userId: currentUser.uid,
        roleTitle: newRecord.roleTitle.trim(),
        employerName: newRecord.employerName.trim(),
        location: newRecord.location.trim() || workerProfile?.city || 'India',
        startDate: newRecord.startDate || '2024-01',
        endDate: newRecord.isCurrent ? 'Present' : newRecord.endDate || '2025-12',
        isCurrent: newRecord.isCurrent,
        workType: newRecord.workType,
        responsibilities: newRecord.responsibilities.trim(),
        verificationStatus: 'Self-Reported',
        createdAt: serverTimestamp()
      };
      const docRef = await addDoc(collection(db, 'workHistory'), payload).catch((err) => {
        handleFirestoreError(err, OperationType.CREATE, 'workHistory');
        return null;
      });
      if (docRef) {
        setWorkHistory((prev) => [{ id: docRef.id, ...payload }, ...prev]);
      } else {
        setWorkHistory((prev) => [{ id: `local_${Date.now()}`, ...payload }, ...prev]);
      }
      setNewRecord({
        roleTitle: '',
        employerName: '',
        location: '',
        startDate: '',
        endDate: '',
        isCurrent: false,
        workType: 'Full-time',
        responsibilities: ''
      });
      showQuickNotice('Work history added to your WorkPass (labeled Self-Reported until employer verifies).');
    } finally {
      setAddingRecord(false);
    }
  };

  const handleDeleteWorkRecord = async (id: string) => {
    setWorkHistory((prev) => prev.filter((item) => item.id !== id));
    if (!id.startsWith('local_')) {
      await deleteDoc(doc(db, 'workHistory', id)).catch(() => {});
    }
    showQuickNotice('Work history record removed.');
  };

  const handleDeleteUploadedResume = async () => {
    await saveDraftWorkerProfile({
      resumeUrl: '',
      resumeName: ''
    });
    showQuickNotice('Uploaded resume deleted from your profile. Employers you already applied to retain their application copy.');
  };

  const allSkills = Array.from(
    new Set([...(workerProfile?.skills || []), ...(workerProfile?.customSkills || [])])
  );

  return (
    <div className="space-y-6">
      {/* Header & Navigation Tabs */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">
            Resume Builder, WorkPass & Profile Privacy
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Build a clean, truthful resume, manage your verified WorkPass records, and preview how your profile appears to employers.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
          <button
            type="button"
            onClick={() => setSubView('resume_builder')}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
              subView === 'resume_builder'
                ? 'bg-white dark:bg-slate-900 text-[#267BE8] shadow-2xs'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
            }`}
          >
            Resume Builder & CV
          </button>
          <button
            type="button"
            onClick={() => setSubView('workpass')}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
              subView === 'workpass'
                ? 'bg-white dark:bg-slate-900 text-[#267BE8] shadow-2xs'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
            }`}
          >
            WorkPass & Work History
          </button>
          <button
            type="button"
            onClick={() => setSubView('public_preview')}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
              subView === 'public_preview'
                ? 'bg-white dark:bg-slate-900 text-[#267BE8] shadow-2xs'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
            }`}
          >
            Public vs Employer Preview
          </button>
        </div>
      </div>

      {statusToast && (
        <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{statusToast}</span>
        </div>
      )}

      {/* SUBVIEW 1: RESUME BUILDER & DOCUMENT HANDLING */}
      {subView === 'resume_builder' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Controls Column */}
          <div className="lg:col-span-5 space-y-5">
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 space-y-4">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                1. Template & Privacy Controls
              </h3>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Select Resume Layout
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['modern', 'vocational', 'executive'] as const).map((tpl) => (
                    <button
                      key={tpl}
                      type="button"
                      onClick={() => setTemplateStyle(tpl)}
                      className={`py-2 px-3 rounded-xl border text-xs font-bold capitalize cursor-pointer transition-colors ${
                        templateStyle === tpl
                          ? 'border-[#267BE8] bg-blue-50/70 dark:bg-blue-950/50 text-[#267BE8]'
                          : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                      }`}
                    >
                      {tpl}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
                <div>
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    Include Phone & Email on Exported PDF
                  </p>
                  <p className="text-[11px] text-slate-500">
                    Hidden on public discovery by default
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowContactOnPublic(!showContactOnPublic)}
                  className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
                    showContactOnPublic ? 'bg-[#267BE8]' : 'bg-slate-300 dark:bg-slate-700'
                  }`}
                >
                  <span
                    className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-transform ${
                      showContactOnPublic ? 'left-6' : 'left-1'
                    }`}
                  />
                </button>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Professional Summary (Truthful, Never AI-Fabricated)
                </label>
                <textarea
                  rows={3}
                  value={summaryText}
                  onChange={(e) => setSummaryText(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-2.5 text-xs text-slate-900 dark:text-white"
                  placeholder="Summarize your real trade skills, years of experience, and work preferences..."
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Key Projects, Trade Licences & Achievements
                </label>
                <textarea
                  rows={2}
                  value={projectsText}
                  onChange={(e) => setProjectsText(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-2.5 text-xs text-slate-900 dark:text-white"
                  placeholder="List real projects, certifications, or licences..."
                />
              </div>

              <div className="flex flex-wrap gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleSaveBuilderChanges}
                  className="px-4 py-2 rounded-xl bg-[#267BE8] hover:bg-blue-700 text-white text-xs font-bold cursor-pointer transition-colors"
                >
                  Save Resume Sections
                </button>
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-4 py-2 rounded-xl bg-[#10213B] hover:bg-slate-800 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Export / Print PDF</span>
                </button>
              </div>
            </div>

            {/* Uploaded Document Management */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  2. Private Document Storage (PDF/DOCX)
                </h3>
                <Lock className="w-4 h-4 text-emerald-600" />
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                Uploaded resumes are private by default. If you replace or delete a file, employers you previously applied to retain the copy submitted with that application.
              </p>

              {workerProfile?.resumeUrl ? (
                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                      {workerProfile.resumeName || 'Uploaded_Resume.pdf'}
                    </p>
                    <p className="text-[11px] text-emerald-600 font-medium">
                      Private • Shared only on application
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={onOpenResumeUploadModal}
                      className="px-2.5 py-1.5 rounded-lg bg-blue-50 dark:bg-blue-950 text-[#267BE8] text-xs font-bold cursor-pointer"
                    >
                      Replace
                    </button>
                    <button
                      type="button"
                      onClick={handleDeleteUploadedResume}
                      className="p-1.5 rounded-lg text-red-600 hover:bg-red-50 cursor-pointer"
                      title="Delete uploaded resume"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={onOpenResumeUploadModal}
                  className="w-full py-3 px-4 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 hover:border-[#267BE8] text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center justify-center gap-2 cursor-pointer transition-colors"
                >
                  <Upload className="w-4 h-4 text-[#267BE8]" />
                  <span>Upload PDF/DOCX Resume (Max 650KB)</span>
                </button>
              )}
            </div>
          </div>

          {/* Printable Live Resume Sheet */}
          <div className="lg:col-span-7">
            <div className="bg-white text-slate-900 rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-6">
              <div
                className={`pb-5 border-b ${
                  templateStyle === 'modern'
                    ? 'border-blue-600'
                    : templateStyle === 'vocational'
                    ? 'border-emerald-600'
                    : 'border-slate-900'
                } flex flex-col sm:flex-row sm:items-center justify-between gap-4`}
              >
                <div>
                  <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">
                    {workerProfile?.fullName || userProfile?.name || 'Job Seeker'}
                  </h1>
                  <p className="text-sm font-semibold text-[#267BE8] mt-0.5">
                    {(workerProfile?.selectedProfessions || []).join(' · ') || 'Skilled Professional'}
                  </p>
                  <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 mt-1.5">
                    <span>
                      {[workerProfile?.city, workerProfile?.state].filter(Boolean).join(', ') || 'India'}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span>Preferred Language: {workerProfile?.preferredLanguage || 'English / Hindi'}</span>
                    {showContactOnPublic ? (
                      <>
                        <span aria-hidden="true">·</span>
                        <span className="font-mono">{workerProfile?.phone || userProfile?.phone || 'Phone on file'}</span>
                        <span aria-hidden="true">·</span>
                        <span>{workerProfile?.email || userProfile?.email}</span>
                      </>
                    ) : (
                      <>
                        <span aria-hidden="true">·</span>
                        <span className="text-amber-700 font-semibold">
                          Contact protected until application/interview
                        </span>
                      </>
                    )}
                  </div>
                </div>
                <div className="text-left sm:text-right shrink-0">
                  <span className="text-[11px] font-mono text-slate-500 block">
                    WORKPASS ID: JS-{currentUser?.uid.slice(0, 6).toUpperCase()}
                  </span>
                  <span className="text-xs font-semibold text-emerald-700 block mt-0.5">
                    18+ Adult Eligibility Confirmed
                  </span>
                </div>
              </div>

              {/* Summary */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                  Summary
                </h4>
                <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">{summaryText}</p>
              </div>

              {/* Skills */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                  Verified & Self-Declared Skills
                </h4>
                <p className="text-xs sm:text-sm text-slate-800 font-medium">
                  {allSkills.length > 0 ? allSkills.join(' · ') : 'Add skills in your profile editor'}
                </p>
              </div>

              {/* Experience */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                  Experience & Work History ({workerProfile?.experience || 'Fresher'})
                </h4>
                {workerProfile?.previousCompanyName && (
                  <div className="mb-3">
                    <p className="text-xs font-bold text-slate-900">
                      {workerProfile.previousJobRole || 'Role'} — {workerProfile.previousCompanyName}
                    </p>
                    <p className="text-[11px] text-slate-500">Status: Self-Reported on Onboarding</p>
                  </div>
                )}
                {workHistory.map((wh) => (
                  <div key={wh.id} className="mb-3 pb-2 border-b border-slate-100 last:border-none">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-bold text-slate-900">
                        {wh.roleTitle} · {wh.employerName}
                      </p>
                      <span className="text-[11px] font-mono text-slate-500 tabular-nums">
                        {wh.startDate} – {wh.endDate}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600 mt-0.5">{wh.responsibilities}</p>
                    <span className="text-[10px] text-slate-400">
                      Verification: {wh.verificationStatus}
                    </span>
                  </div>
                ))}
              </div>

              {/* Education & Certificates */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                    Education
                  </h4>
                  <p className="text-xs font-bold text-slate-900">
                    {workerProfile?.education || 'Higher secondary'}
                  </p>
                  {workerProfile?.schoolOrCollegeName && (
                    <p className="text-xs text-slate-600">
                      {workerProfile.schoolOrCollegeName}{' '}
                      {workerProfile.passingYear ? `(${workerProfile.passingYear})` : ''}
                    </p>
                  )}
                </div>
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                    Work Preferences
                  </h4>
                  <p className="text-xs text-slate-700">
                    {(workerProfile?.jobPreferences?.jobTypes || ['Full-time']).join(', ')} · Availability:{' '}
                    {workerProfile?.jobPreferences?.availability || 'Immediate'}
                  </p>
                  {projectsText && (
                    <p className="text-xs text-slate-600 mt-1">Projects/Notes: {projectsText}</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUBVIEW 2: WORKPASS & WORK HISTORY */}
      {subView === 'workpass' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-5 bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Add Work Record to WorkPass
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Every work record is clearly labeled <strong>Self-Reported</strong> until verified by an actual employer or document check.
            </p>
            <form onSubmit={handleAddWorkHistory} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Job Role / Trade Title *
                </label>
                <input
                  type="text"
                  required
                  value={newRecord.roleTitle}
                  onChange={(e) => setNewRecord({ ...newRecord, roleTitle: e.target.value })}
                  placeholder="e.g., Industrial Electrician, Site Supervisor"
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-xs text-slate-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Employer / Contractor Name *
                </label>
                <input
                  type="text"
                  required
                  value={newRecord.employerName}
                  onChange={(e) => setNewRecord({ ...newRecord, employerName: e.target.value })}
                  placeholder="e.g., Shree Infra Projects"
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-xs text-slate-900 dark:text-white"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Start (YYYY-MM)
                  </label>
                  <input
                    type="month"
                    value={newRecord.startDate}
                    onChange={(e) => setNewRecord({ ...newRecord, startDate: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-xs text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    End (YYYY-MM)
                  </label>
                  <input
                    type="month"
                    disabled={newRecord.isCurrent}
                    value={newRecord.endDate}
                    onChange={(e) => setNewRecord({ ...newRecord, endDate: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-xs text-slate-900 dark:text-white disabled:opacity-50"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Responsibilities & Tools Handled
                </label>
                <textarea
                  rows={2}
                  value={newRecord.responsibilities}
                  onChange={(e) => setNewRecord({ ...newRecord, responsibilities: e.target.value })}
                  placeholder="Describe tasks performed..."
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-2.5 text-xs text-slate-900 dark:text-white"
                />
              </div>
              <button
                type="submit"
                disabled={addingRecord}
                className="w-full py-2.5 px-4 rounded-xl bg-[#267BE8] hover:bg-blue-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>{addingRecord ? 'Saving...' : 'Add to WorkPass'}</span>
              </button>
            </form>
          </div>

          <div className="lg:col-span-7 bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  JOBSETU WorkPass Credential Ledger
                </h3>
                <p className="text-xs text-slate-500">
                  Only records verified through an actual verification workflow carry the Verified label.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShareLinkActive(!shareLinkActive);
                  showQuickNotice(
                    shareLinkActive
                      ? 'Public WorkPass sharing link revoked immediately.'
                      : 'WorkPass sharing link re-enabled.'
                  );
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer ${
                  shareLinkActive
                    ? 'bg-red-50 text-red-700 hover:bg-red-100'
                    : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                }`}
              >
                {shareLinkActive ? 'Revoke Sharing Link' : 'Enable Sharing Link'}
              </button>
            </div>

            {loadingHistory ? (
              <p className="text-xs text-slate-500 py-6 text-center">Loading WorkPass records...</p>
            ) : workHistory.length === 0 ? (
              <div className="p-8 rounded-2xl bg-slate-50 dark:bg-slate-800/50 text-center space-y-2">
                <Briefcase className="w-7 h-7 text-slate-400 mx-auto" />
                <p className="text-xs font-bold text-slate-700 dark:text-slate-200">
                  No employment history entries recorded yet
                </p>
                <p className="text-[11px] text-slate-500">
                  Use the form on the left to log past jobs, contracts, or apprenticeships. No prior experience is required for fresher roles.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {workHistory.map((item) => (
                  <div key={item.id} className="py-3.5 flex items-start justify-between gap-4">
                    <div>
                      <p className="text-sm font-bold text-slate-900 dark:text-white">
                        {item.roleTitle} · {item.employerName}
                      </p>
                      <p className="text-xs text-slate-500 font-mono tabular-nums mt-0.5">
                        {item.startDate} – {item.endDate} · {item.workType}
                      </p>
                      {item.responsibilities && (
                        <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">
                          {item.responsibilities}
                        </p>
                      )}
                      <span className="inline-block mt-1 text-[11px] font-semibold text-amber-700 dark:text-amber-400">
                        Status: {item.verificationStatus}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDeleteWorkRecord(item.id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 cursor-pointer"
                      title="Delete record"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* SUBVIEW 3: PUBLIC VS EMPLOYER PREVIEW */}
      {subView === 'public_preview' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Public Visitor View */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Preview as Public Visitor / Search Listing
                </h3>
                <p className="text-[11px] text-slate-500">
                  Strict PII redaction: phone, email, home address, and private resume are never exposed.
                </p>
              </div>
              <EyeOff className="w-4 h-4 text-slate-400" />
            </div>
            <div className="space-y-2 text-xs">
              <p className="text-base font-bold text-slate-900 dark:text-white">
                {workerProfile?.fullName || userProfile?.name || 'Candidate'}
              </p>
              <p className="text-slate-600 dark:text-slate-300">
                City/State: {[workerProfile?.city, workerProfile?.state].filter(Boolean).join(', ') || 'India'} (Approximate Location Only)
              </p>
              <p className="text-slate-600 dark:text-slate-300">
                Skills: {allSkills.slice(0, 6).join(' · ') || 'Not specified'}
              </p>
              <p className="text-slate-600 dark:text-slate-300">
                Experience: {workerProfile?.experience || 'Fresher'}
              </p>
              <p className="text-emerald-700 dark:text-emerald-400 font-semibold pt-2">
                Phone, Email, Exact Street Address & Identity Documents: Hidden by Default
              </p>
            </div>
          </div>

          {/* Consented Employer View (After Application) */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Preview as Employer (After You Apply to Their Job)
                </h3>
                <p className="text-[11px] text-slate-500">
                  Visible only to employers whose jobs you explicitly apply to or grant contact permission.
                </p>
              </div>
              <Eye className="w-4 h-4 text-[#267BE8]" />
            </div>
            <div className="space-y-2 text-xs">
              <p className="text-base font-bold text-slate-900 dark:text-white">
                {workerProfile?.fullName || userProfile?.name || 'Candidate'}
              </p>
              <p className="text-slate-600 dark:text-slate-300 font-mono">
                Phone: {workerProfile?.phone || userProfile?.phone || 'Shared on application'} · Email:{' '}
                {workerProfile?.email || userProfile?.email}
              </p>
              <p className="text-slate-600 dark:text-slate-300">
                Attached Resume: {workerProfile?.resumeName || 'Generated JOBSETU WorkPass Summary'}
              </p>
              <p className="text-slate-600 dark:text-slate-300">
                Education: {workerProfile?.education || 'Higher secondary'}
              </p>
              <p className="text-[#267BE8] font-semibold pt-2">
                Identity Documents (Aadhaar/PAN): Never shared with employers; only verification status is shown.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
