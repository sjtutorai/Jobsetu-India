import React, { useState, useEffect } from 'react';
import {
  collection,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  query,
  orderBy
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../../lib/firebase';
import { useAuth } from '../../context/AuthContext';
import { useJobs } from '../../context/JobContext';
import {
  UserProfile,
  WorkerProfile,
  EmployerProfile,
  Job,
  Application,
  Report,
  VerificationStatus,
  IdentityVerificationRecord,
  VerifiedDocumentRecord,
  RatingAppealRecord,
  VerificationAuditLog
} from '../../types';
import {
  Shield,
  ShieldCheck,
  ShieldAlert,
  Users,
  Briefcase,
  FileCheck2,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Eye,
  Trash2,
  Filter,
  Search,
  Building2,
  TrendingUp,
  RefreshCw,
  ExternalLink,
  Lock,
  ArrowRight,
  Fingerprint,
  FileBadge,
  Scale,
  History
} from 'lucide-react';

interface AdminDashboardProps {
  onBackToApp: () => void;
}

type AdminTab = 'overview' | 'verifications' | 'trust_governance' | 'reports' | 'users' | 'jobs';

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onBackToApp }) => {
  const { currentUser, userProfile } = useAuth();
  const { jobs, changeJobStatus, deleteJob } = useJobs();

  const [activeTab, setActiveTab] = useState<AdminTab>('overview');
  const [loading, setLoading] = useState(true);
  const [usersList, setUsersList] = useState<UserProfile[]>([]);
  const [workerProfilesList, setWorkerProfilesList] = useState<WorkerProfile[]>([]);
  const [employerProfilesList, setEmployerProfilesList] = useState<EmployerProfile[]>([]);
  const [reportsList, setReportsList] = useState<Report[]>([]);
  const [identityList, setIdentityList] = useState<IdentityVerificationRecord[]>([]);
  const [documentsList, setDocumentsList] = useState<VerifiedDocumentRecord[]>([]);
  const [appealsList, setAppealsList] = useState<RatingAppealRecord[]>([]);
  const [auditLogsList, setAuditLogsList] = useState<VerificationAuditLog[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Check if current user is admin (email sjtutorai@gmail.com as bootstrapped in metadata or admin document)
  const isAdmin = currentUser?.email === 'sjtutorai@gmail.com' || userProfile?.accountStatus === 'active';

  const fetchData = async () => {
    try {
      setLoading(true);
      // Fetch users
      const usersSnap = await getDocs(collection(db, 'users')).catch(() => null);
      if (usersSnap) {
        const uList: UserProfile[] = [];
        usersSnap.forEach((d) => uList.push({ ...(d.data() as UserProfile), uid: d.id }));
        setUsersList(uList);
      }

      // Fetch employers
      const empSnap = await getDocs(collection(db, 'employerProfiles')).catch(() => null);
      if (empSnap) {
        const eList: EmployerProfile[] = [];
        empSnap.forEach((d) => eList.push({ ...(d.data() as EmployerProfile), uid: d.id }));
        setEmployerProfilesList(eList);
      }

      // Fetch workers
      const workSnap = await getDocs(collection(db, 'workerProfiles')).catch(() => null);
      if (workSnap) {
        const wList: WorkerProfile[] = [];
        workSnap.forEach((d) => wList.push({ ...(d.data() as WorkerProfile), uid: d.id }));
        setWorkerProfilesList(wList);
      }

      // Fetch reports
      const repSnap = await getDocs(collection(db, 'reports')).catch(() => null);
      if (repSnap) {
        const rList: Report[] = [];
        repSnap.forEach((d) => rList.push({ id: d.id, ...(d.data() as any) }));
        setReportsList(rList);
      }

      // Fetch Aadhaar / Govt ID Verifications
      const idSnap = await getDocs(collection(db, 'identity_verifications')).catch(() => null);
      if (idSnap) {
        const iList: IdentityVerificationRecord[] = [];
        idSnap.forEach((d) => iList.push({ id: d.id, ...(d.data() as any) }));
        setIdentityList(iList);
      }

      // Fetch DigiLocker Documents
      const docSnap = await getDocs(collection(db, 'verified_documents')).catch(() => null);
      if (docSnap) {
        const dList: VerifiedDocumentRecord[] = [];
        docSnap.forEach((d) => dList.push({ id: d.id, ...(d.data() as any) }));
        setDocumentsList(dList);
      }

      // Fetch Rating Appeals
      const appSnap = await getDocs(collection(db, 'rating_appeals')).catch(() => null);
      if (appSnap) {
        const aList: RatingAppealRecord[] = [];
        appSnap.forEach((d) => aList.push({ id: d.id, ...(d.data() as any) }));
        setAppealsList(aList);
      }

      // Fetch Verification Audit Logs
      const logSnap = await getDocs(collection(db, 'verification_audit_logs')).catch(() => null);
      if (logSnap) {
        const lList: VerificationAuditLog[] = [];
        logSnap.forEach((d) => lList.push({ id: d.id, ...(d.data() as any) }));
        setAuditLogsList(lList);
      }
    } catch (e) {
      console.warn('Admin fetch notice:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Verification action
  const handleUpdateVerification = async (employerUid: string, status: VerificationStatus) => {
    try {
      setActionLoading(employerUid);
      const empRef = doc(db, 'employerProfiles', employerUid);
      await updateDoc(empRef, {
        verificationStatus: status,
        updatedAt: serverTimestamp()
      });
      setEmployerProfilesList((prev) =>
        prev.map((e) => (e.uid === employerUid ? { ...e, verificationStatus: status } : e))
      );
    } catch (err: any) {
      console.error('Failed to update verification:', err);
    } finally {
      setActionLoading(null);
    }
  };

  // User suspend / activate
  const handleToggleUserStatus = async (uid: string, currentStatus: string) => {
    const nextStatus = currentStatus === 'suspended' ? 'active' : 'suspended';
    try {
      setActionLoading(uid);
      const uRef = doc(db, 'users', uid);
      await updateDoc(uRef, {
        accountStatus: nextStatus,
        updatedAt: serverTimestamp()
      });
      setUsersList((prev) =>
        prev.map((u) => (u.uid === uid ? { ...u, accountStatus: nextStatus as any } : u))
      );
    } catch (err) {
      console.error('Failed to update account status:', err);
    } finally {
      setActionLoading(null);
    }
  };

  // Resolve Report
  const handleResolveReport = async (reportId: string, resolution: 'resolved' | 'dismissed') => {
    try {
      setActionLoading(reportId);
      const repRef = doc(db, 'reports', reportId);
      await updateDoc(repRef, {
        status: resolution,
        updatedAt: serverTimestamp()
      });
      setReportsList((prev) =>
        prev.map((r) => (r.id === reportId ? { ...r, status: resolution } : r))
      );
    } catch (err) {
      console.error('Failed to update report:', err);
    } finally {
      setActionLoading(null);
    }
  };

  // Update Identity Verification status
  const handleUpdateIdentityStatus = async (id: string, status: 'Verified' | 'Rejected') => {
    try {
      setActionLoading(id);
      await updateDoc(doc(db, 'identity_verifications', id), {
        status,
        verifiedAt: new Date().toISOString()
      });
      setIdentityList((prev) => prev.map((item) => (item.id === id ? { ...item, status } : item)));
    } catch (err) {
      console.error('Failed to update identity verification:', err);
    } finally {
      setActionLoading(null);
    }
  };

  // Update DigiLocker Document status
  const handleUpdateDocStatus = async (id: string, status: 'Verified' | 'Failed') => {
    try {
      setActionLoading(id);
      await updateDoc(doc(db, 'verified_documents', id), {
        status,
        verificationDate: new Date().toISOString().split('T')[0]
      });
      setDocumentsList((prev) =>
        prev.map((item) => (item.id === id ? { ...item, status } : item))
      );
    } catch (err) {
      console.error('Failed to update document verification:', err);
    } finally {
      setActionLoading(null);
    }
  };

  // Resolve Rating Appeal
  const handleResolveAppeal = async (id: string, status: 'Resolved - Removed' | 'Resolved - Upheld') => {
    try {
      setActionLoading(id);
      await updateDoc(doc(db, 'rating_appeals', id), {
        status,
        adminNote:
          status === 'Resolved - Removed'
            ? 'Unfair rating removed by JOBSETU Trust & Safety.'
            : 'Reviewed and verified against attendance/assignment records.',
        updatedAt: serverTimestamp()
      });
      setAppealsList((prev) => prev.map((item) => (item.id === id ? { ...item, status } : item)));
    } catch (err) {
      console.error('Failed to resolve appeal:', err);
    } finally {
      setActionLoading(null);
    }
  };

  // Metrics
  const totalUsers = Math.max(usersList.length, 1);
  const totalWorkers = workerProfilesList.length;
  const totalEmployers = employerProfilesList.length;
  const totalActiveJobs = jobs.filter((j) => j.status === 'active').length;
  const pendingVerifications = employerProfilesList.filter(
    (e) => e.verificationStatus === 'Pending' || e.verificationStatus === 'Requires additional information'
  );
  const pendingReports = reportsList.filter((r) => !r.status || r.status === 'pending');

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100">
      {/* Top Admin Header */}
      <header className="bg-slate-950 border-b border-slate-800 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500 to-amber-600 flex items-center justify-center text-slate-950 font-black shadow-md">
              <Shield className="w-5 h-5 text-slate-950" />
            </div>
            <div>
              <span className="font-extrabold text-white text-base tracking-tight flex items-center gap-2">
                JOBSETU <span className="text-amber-400 text-xs px-2 py-0.5 rounded-full bg-amber-400/10 border border-amber-400/20 uppercase font-black">Admin Console</span>
              </span>
              <p className="text-[11px] text-slate-400 hidden sm:block">National Employment Oversight & Platform Governance</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={fetchData}
              disabled={loading}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Refresh</span>
            </button>
            <button
              onClick={onBackToApp}
              className="px-4 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <span>Back to App</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 border-b border-slate-800 pb-3 overflow-x-auto scrollbar-none">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'overview'
                ? 'bg-amber-500 text-slate-950 shadow-sm font-extrabold'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            <span>Platform Overview</span>
          </button>
          <button
            onClick={() => setActiveTab('verifications')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'verifications'
                ? 'bg-amber-500 text-slate-950 shadow-sm font-extrabold'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Employer Verifications</span>
            {pendingVerifications.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-red-500 text-white font-black">
                {pendingVerifications.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('trust_governance')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'trust_governance'
                ? 'bg-amber-500 text-slate-950 shadow-sm font-extrabold'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Fingerprint className="w-4 h-4" />
            <span>Aadhaar, DigiLocker & Appeals</span>
            {appealsList.filter((a) => a.status === 'Pending').length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-emerald-500 text-slate-950 font-black">
                {appealsList.filter((a) => a.status === 'Pending').length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('reports')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'reports'
                ? 'bg-amber-500 text-slate-950 shadow-sm font-extrabold'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <ShieldAlert className="w-4 h-4" />
            <span>Safety & Abuse Reports</span>
            {pendingReports.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-red-500 text-white font-black">
                {pendingReports.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'users'
                ? 'bg-amber-500 text-slate-950 shadow-sm font-extrabold'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>User Management</span>
          </button>
          <button
            onClick={() => setActiveTab('jobs')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'jobs'
                ? 'bg-amber-500 text-slate-950 shadow-sm font-extrabold'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Briefcase className="w-4 h-4" />
            <span>Job Listings Governance</span>
          </button>
        </div>

        {/* TAB 1: OVERVIEW METRICS */}
        {activeTab === 'overview' && (
          <div className="space-y-8 animate-in fade-in">
            {/* Stat Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              <div className="p-5 rounded-3xl bg-slate-950 border border-slate-800 flex flex-col justify-between">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Users</span>
                <div className="mt-3 flex items-baseline justify-between">
                  <span className="text-3xl font-black text-white">{totalUsers}</span>
                  <Users className="w-5 h-5 text-blue-400" />
                </div>
                <span className="text-[11px] text-slate-500 mt-2">Registered Accounts</span>
              </div>

              <div className="p-5 rounded-3xl bg-slate-950 border border-slate-800 flex flex-col justify-between">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Job Seekers</span>
                <div className="mt-3 flex items-baseline justify-between">
                  <span className="text-3xl font-black text-white">{totalWorkers}</span>
                  <FileCheck2 className="w-5 h-5 text-emerald-400" />
                </div>
                <span className="text-[11px] text-slate-500 mt-2">Verified Profiles</span>
              </div>

              <div className="p-5 rounded-3xl bg-slate-950 border border-slate-800 flex flex-col justify-between">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Employers</span>
                <div className="mt-3 flex items-baseline justify-between">
                  <span className="text-3xl font-black text-white">{totalEmployers}</span>
                  <Building2 className="w-5 h-5 text-amber-400" />
                </div>
                <span className="text-[11px] text-slate-500 mt-2">Registered Businesses</span>
              </div>

              <div className="p-5 rounded-3xl bg-slate-950 border border-slate-800 flex flex-col justify-between">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Active Jobs</span>
                <div className="mt-3 flex items-baseline justify-between">
                  <span className="text-3xl font-black text-white">{totalActiveJobs}</span>
                  <Briefcase className="w-5 h-5 text-indigo-400" />
                </div>
                <span className="text-[11px] text-slate-500 mt-2">Open Vacancies</span>
              </div>

              <div className="p-5 rounded-3xl bg-slate-950 border border-slate-800 flex flex-col justify-between">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Pending Action</span>
                <div className="mt-3 flex items-baseline justify-between">
                  <span className="text-3xl font-black text-amber-400">{pendingVerifications.length + pendingReports.length}</span>
                  <AlertTriangle className="w-5 h-5 text-amber-400" />
                </div>
                <span className="text-[11px] text-slate-500 mt-2">Audit Requests</span>
              </div>
            </div>

            {/* Platform Health and Quick Action Banners */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="p-6 rounded-3xl bg-slate-950 border border-slate-800 space-y-4">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>Security & Zero-Tolerance Anti-Spam Status</span>
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  JOBSETU enforces mandatory portrait verification, GPS-validated 50km radius matching, and attribute-based security rules. Employers must submit government business credentials before receiving the verified mark.
                </p>
                <div className="pt-2 flex flex-wrap gap-2 text-xs">
                  <span className="px-3 py-1 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold">
                    ✓ Firestore ABAC Enforced
                  </span>
                  <span className="px-3 py-1 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20 font-bold">
                    ✓ Non-AI Verified Photos
                  </span>
                  <span className="px-3 py-1 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 font-bold">
                    ✓ Consent-Based PII Isolation
                  </span>
                </div>
              </div>

              <div className="p-6 rounded-3xl bg-slate-950 border border-slate-800 space-y-4">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-amber-400" />
                  <span>Pending Audits & Trust Approvals</span>
                </h3>
                <div className="space-y-2">
                  {pendingVerifications.slice(0, 3).map((emp) => (
                    <div key={emp.uid} className="p-3 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between">
                      <div>
                        <p className="text-xs font-bold text-white">{emp.businessName}</p>
                        <p className="text-[10px] text-slate-400">{emp.businessCategory} • {emp.city}, {emp.state}</p>
                      </div>
                      <button
                        onClick={() => setActiveTab('verifications')}
                        className="px-3 py-1 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold cursor-pointer"
                      >
                        Review
                      </button>
                    </div>
                  ))}
                  {pendingVerifications.length === 0 && (
                    <p className="text-xs text-slate-500 italic">No pending business verification audits.</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: EMPLOYER VERIFICATIONS */}
        {activeTab === 'verifications' && (
          <div className="space-y-4 animate-in fade-in">
            <h2 className="text-lg font-bold text-white">Employer Verification Requests</h2>
            <div className="bg-slate-950 rounded-3xl border border-slate-800 overflow-hidden">
              <div className="divide-y divide-slate-800">
                {employerProfilesList.map((emp) => (
                  <div key={emp.uid} className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-start gap-4">
                      {emp.businessLogo ? (
                        <img src={emp.businessLogo} alt="" className="w-12 h-12 rounded-2xl object-cover bg-white" />
                      ) : (
                        <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-400 font-bold text-lg flex items-center justify-center">
                          {emp.businessName.charAt(0)}
                        </div>
                      )}
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-bold text-white">{emp.businessName}</h4>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            emp.verificationStatus === 'Verified'
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              : emp.verificationStatus === 'Rejected'
                              ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                              : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                          }`}>
                            {emp.verificationStatus}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 mt-0.5">
                          Owner: {emp.ownerName} ({emp.ownerEmail}) • Designation: {emp.designation}
                        </p>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Location: {emp.city}, {emp.state} ({emp.pincode}) • Doc #: {emp.documentNumber || 'GST/MSME submitted'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => handleUpdateVerification(emp.uid, 'Verified')}
                        disabled={actionLoading === emp.uid}
                        className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-colors cursor-pointer"
                      >
                        Approve & Verify
                      </button>
                      <button
                        onClick={() => handleUpdateVerification(emp.uid, 'Requires additional information')}
                        disabled={actionLoading === emp.uid}
                        className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs transition-colors cursor-pointer"
                      >
                        Request Info
                      </button>
                      <button
                        onClick={() => handleUpdateVerification(emp.uid, 'Rejected')}
                        disabled={actionLoading === emp.uid}
                        className="px-3 py-1.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs transition-colors cursor-pointer"
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                ))}
                {employerProfilesList.length === 0 && (
                  <p className="p-8 text-center text-xs text-slate-500">No employer registrations found in database.</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: SAFETY & ABUSE REPORTS */}
        {activeTab === 'reports' && (
          <div className="space-y-4 animate-in fade-in">
            <h2 className="text-lg font-bold text-white">Reported Accounts & Job Postings</h2>
            <div className="bg-slate-950 rounded-3xl border border-slate-800 overflow-hidden">
              <div className="divide-y divide-slate-800">
                {reportsList.map((rep) => (
                  <div key={rep.id} className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-red-500/10 text-red-400 border border-red-500/20">
                          {rep.targetType}
                        </span>
                        <span className="text-xs text-slate-400">Target ID: {rep.targetId}</span>
                        <span className="text-xs text-slate-500">• Reported by: {rep.reporterId}</span>
                      </div>
                      <p className="text-xs text-slate-200 mt-2 font-medium bg-slate-900 p-3 rounded-2xl border border-slate-800">
                        "{rep.reason}"
                      </p>
                      <span className="text-[10px] text-slate-500 mt-1 block">
                        Status: <span className="font-bold text-amber-400">{rep.status || 'pending'}</span>
                      </span>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => handleResolveReport(rep.id, 'resolved')}
                        disabled={actionLoading === rep.id}
                        className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-colors cursor-pointer"
                      >
                        Take Action & Resolve
                      </button>
                      <button
                        onClick={() => handleResolveReport(rep.id, 'dismissed')}
                        disabled={actionLoading === rep.id}
                        className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition-colors cursor-pointer"
                      >
                        Dismiss
                      </button>
                    </div>
                  </div>
                ))}
                {reportsList.length === 0 && (
                  <p className="p-8 text-center text-xs text-slate-500">No abuse or safety reports submitted.</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: USERS MANAGEMENT */}
        {activeTab === 'users' && (
          <div className="space-y-4 animate-in fade-in">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-white">User Accounts Governance</h2>
              <div className="text-xs text-slate-400">Total: {usersList.length} users</div>
            </div>
            <div className="bg-slate-950 rounded-3xl border border-slate-800 overflow-hidden">
              <div className="divide-y divide-slate-800">
                {usersList.map((user) => (
                  <div key={user.uid} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-bold text-white">{user.name}</h4>
                        <span className="text-xs text-slate-400">({user.email || 'No email'})</span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          user.accountStatus === 'suspended' ? 'bg-red-500/20 text-red-400' : 'bg-emerald-500/20 text-emerald-400'
                        }`}>
                          {user.accountStatus}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Active Role: <span className="text-amber-400 font-bold">{user.activeRole}</span> • Enabled Roles: {(user.enabledRoles || []).join(', ')}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleToggleUserStatus(user.uid, user.accountStatus)}
                        disabled={actionLoading === user.uid}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                          user.accountStatus === 'suspended'
                            ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                            : 'bg-red-600/80 hover:bg-red-600 text-white'
                        }`}
                      >
                        {user.accountStatus === 'suspended' ? 'Re-activate' : 'Suspend Account'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: JOBS MANAGEMENT */}
        {activeTab === 'jobs' && (
          <div className="space-y-4 animate-in fade-in">
            <h2 className="text-lg font-bold text-white">Live Job Listings Oversight</h2>
            <div className="bg-slate-950 rounded-3xl border border-slate-800 overflow-hidden">
              <div className="divide-y divide-slate-800">
                {jobs.map((job) => (
                  <div key={job.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-bold text-white">{job.title}</h4>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          job.status === 'active' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-400'
                        }`}>
                          {job.status}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {job.employerName} • {job.city}, {job.state} • ₹{job.minSalary.toLocaleString()} - ₹{job.maxSalary.toLocaleString()} ({job.paymentFrequency})
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {job.status === 'active' ? (
                        <button
                          onClick={() => changeJobStatus(job.id, 'paused')}
                          className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold cursor-pointer"
                        >
                          Pause Job
                        </button>
                      ) : (
                        <button
                          onClick={() => changeJobStatus(job.id, 'active')}
                          className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold cursor-pointer"
                        >
                          Approve/Activate
                        </button>
                      )}
                      <button
                        onClick={() => deleteJob(job.id)}
                        className="px-3 py-1.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold cursor-pointer"
                      >
                        Remove Listing
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB: AADHAAR, DIGILOCKER & RATING APPEALS GOVERNANCE */}
        {activeTab === 'trust_governance' && (
          <div className="space-y-8 animate-in fade-in">
            {/* Section 1: Aadhaar / Govt ID Verifications (Masked PII) */}
            <div className="space-y-3">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Fingerprint className="w-5 h-5 text-emerald-400" />
                <span>Aadhaar e-KYC & Alternative Govt ID Verifications ({identityList.length})</span>
              </h2>
              <div className="bg-slate-950 rounded-3xl border border-slate-800 overflow-hidden divide-y divide-slate-800">
                {identityList.map((idRec) => (
                  <div key={idRec.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-white">{idRec.userName}</span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/20 text-blue-300">
                          {idRec.maskedReferenceNumber}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            idRec.status === 'Verified'
                              ? 'bg-emerald-500/20 text-emerald-400'
                              : idRec.status === 'Rejected'
                              ? 'bg-red-500/20 text-red-400'
                              : 'bg-amber-500/20 text-amber-400'
                          }`}
                        >
                          {idRec.status}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Method: {idRec.method} • Match Score: {idRec.nameMatchScore}% • 18+ Eligible:{' '}
                        {idRec.ageEligibilityVerified ? 'Yes' : 'No'}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => handleUpdateIdentityStatus(idRec.id, 'Verified')}
                        disabled={actionLoading === idRec.id}
                        className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold cursor-pointer"
                      >
                        Approve e-KYC
                      </button>
                      <button
                        onClick={() => handleUpdateIdentityStatus(idRec.id, 'Rejected')}
                        disabled={actionLoading === idRec.id}
                        className="px-3 py-1.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold cursor-pointer"
                      >
                        Revoke
                      </button>
                    </div>
                  </div>
                ))}
                {identityList.length === 0 && (
                  <p className="p-6 text-center text-xs text-slate-500">No Aadhaar or Govt ID verifications submitted yet.</p>
                )}
              </div>
            </div>

            {/* Section 2: DigiLocker Verified Documents */}
            <div className="space-y-3">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <FileBadge className="w-5 h-5 text-indigo-400" />
                <span>DigiLocker & Qualification Certificates ({documentsList.length})</span>
              </h2>
              <div className="bg-slate-950 rounded-3xl border border-slate-800 overflow-hidden divide-y divide-slate-800">
                {documentsList.map((docItem) => (
                  <div key={docItem.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-white">{docItem.documentCategory}</span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-500/20 text-indigo-300">
                          {docItem.viaDigiLocker ? 'DigiLocker' : 'Direct'}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            docItem.status === 'Verified'
                              ? 'bg-emerald-500/20 text-emerald-400'
                              : 'bg-red-500/20 text-red-400'
                          }`}
                        >
                          {docItem.status}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Holder: {docItem.userName} • Issuer: {docItem.issuingAuthority} • Ref: {docItem.documentReference}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => handleUpdateDocStatus(docItem.id, 'Verified')}
                        disabled={actionLoading === docItem.id}
                        className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold cursor-pointer"
                      >
                        Validate
                      </button>
                      <button
                        onClick={() => handleUpdateDocStatus(docItem.id, 'Failed')}
                        disabled={actionLoading === docItem.id}
                        className="px-3 py-1.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold cursor-pointer"
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                ))}
                {documentsList.length === 0 && (
                  <p className="p-6 text-center text-xs text-slate-500">No DigiLocker documents fetched yet.</p>
                )}
              </div>
            </div>

            {/* Section 3: Worker Rating Appeals */}
            <div className="space-y-3">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Scale className="w-5 h-5 text-amber-400" />
                <span>Worker Rating Disputes & Appeals ({appealsList.length})</span>
              </h2>
              <div className="bg-slate-950 rounded-3xl border border-slate-800 overflow-hidden divide-y divide-slate-800">
                {appealsList.map((ap) => (
                  <div key={ap.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-white">{ap.workerName}</span>
                        <span className="text-xs text-slate-400">appealed rating from {ap.employerName}</span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-amber-500/20 text-amber-400">
                          {ap.status}
                        </span>
                      </div>
                      <p className="text-xs text-slate-300 mt-1.5 bg-slate-900 p-2.5 rounded-xl border border-slate-800">
                        Reason: "{ap.reason}"
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => handleResolveAppeal(ap.id, 'Resolved - Removed')}
                        disabled={actionLoading === ap.id}
                        className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold cursor-pointer"
                      >
                        Uphold Appeal & Remove Rating
                      </button>
                      <button
                        onClick={() => handleResolveAppeal(ap.id, 'Resolved - Upheld')}
                        disabled={actionLoading === ap.id}
                        className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold cursor-pointer"
                      >
                        Dismiss Appeal
                      </button>
                    </div>
                  </div>
                ))}
                {appealsList.length === 0 && (
                  <p className="p-6 text-center text-xs text-slate-500">No worker rating appeals pending review.</p>
                )}
              </div>
            </div>

            {/* Section 4: Verification Audit Logs */}
            <div className="space-y-3">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <History className="w-5 h-5 text-blue-400" />
                <span>Compliance & Verification Audit Trail ({auditLogsList.length})</span>
              </h2>
              <div className="bg-slate-950 rounded-3xl border border-slate-800 overflow-hidden divide-y divide-slate-800 max-h-80 overflow-y-auto">
                {auditLogsList.slice(0, 25).map((log) => (
                  <div key={log.id} className="p-3.5 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-bold text-emerald-400 uppercase mr-2">[{log.action}]</span>
                      <span className="text-slate-200 font-semibold">{log.actorName}</span>
                      <span className="text-slate-400 ml-2">— {log.details}</span>
                    </div>
                    <span className="text-[10px] text-slate-500 font-mono">{log.actorId.slice(0, 8)}...</span>
                  </div>
                ))}
                {auditLogsList.length === 0 && (
                  <p className="p-6 text-center text-xs text-slate-500">No verification audit logs recorded yet.</p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
