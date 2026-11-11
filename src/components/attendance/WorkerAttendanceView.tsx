import React, { useState } from 'react';
import { useAttendance } from '../../context/AttendanceContext';
import { useAuth } from '../../context/AuthContext';
import { useJobs } from '../../context/JobContext';
import { AttendanceVerificationType, LeaveType } from '../../types';
import {
  Clock,
  MapPin,
  QrCode,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Navigation,
  Calendar,
  FileText,
  AlertTriangle,
  History,
  Send,
  Sparkles,
  ArrowRight,
  Lock,
  Building2,
  Briefcase
} from 'lucide-react';

export const WorkerAttendanceView: React.FC = () => {
  const { currentUser, workerProfile, userProfile } = useAuth();
  const { myApplications, hiringRequests } = useJobs();
  const {
    workplaces,
    shifts,
    myEmploymentRecords,
    myTodayAttendance,
    myAttendanceHistory,
    recordCheckIn,
    recordCheckOut,
    submitLeaveRequest,
    submitCorrection,
    myLeaveRequests,
    myCorrections
  } = useAttendance();

  // Check if the worker has actually joined a company
  const activeEmployment = myEmploymentRecords.find((r) => r.status === 'Active');
  const selectedApplication = myApplications.find((a) => a.status === 'Selected');
  const acceptedHiringOffer = hiringRequests.find(
    (h) => h.workerId === currentUser?.uid && h.status === 'Accepted'
  );
  const hasJoinedCompany = Boolean(activeEmployment || selectedApplication || acceptedHiringOffer);

  const [activeTab, setActiveTab] = useState<'punch' | 'history' | 'leave' | 'correction'>('punch');
  const [verificationMethod, setVerificationMethod] = useState<AttendanceVerificationType>('GPS Geofence');
  const [qrTokenInput, setQrTokenInput] = useState<string>('');
  const [selectedWorkplaceId, setSelectedWorkplaceId] = useState<string>(
    workplaces[0]?.id || myEmploymentRecords[0]?.workplaceId || ''
  );
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Leave Form State
  const [showLeaveModal, setShowLeaveModal] = useState<boolean>(false);
  const [leaveForm, setLeaveForm] = useState({
    leaveType: 'Casual Leave' as LeaveType,
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    reason: ''
  });

  // Correction Form State
  const [showCorrectionModal, setShowCorrectionModal] = useState<boolean>(false);
  const [correctionForm, setCorrectionForm] = useState({
    attendanceDate: new Date().toISOString().split('T')[0],
    issueType: 'Missing Check-in' as 'Missing Check-in' | 'Missing Check-out' | 'Wrong Timestamps' | 'Incorrect Status',
    reason: ''
  });

  const todayStr = new Date().toLocaleDateString('en-IN', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  // Current workplace
  const currentWorkplace = workplaces.find((w) => w.id === selectedWorkplaceId) || workplaces[0];

  // Perform Check In
  const handleCheckIn = async () => {
    if (!currentWorkplace) {
      setStatusMessage({ type: 'error', text: 'Please select an assigned workplace or facility.' });
      return;
    }

    setIsProcessing(true);
    setStatusMessage(null);

    let lat: number | undefined;
    let lng: number | undefined;

    if (verificationMethod === 'GPS Geofence') {
      try {
        const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: true,
            timeout: 8000
          });
        });
        lat = pos.coords.latitude;
        lng = pos.coords.longitude;
      } catch (err) {
        setIsProcessing(false);
        setStatusMessage({
          type: 'error',
          text: 'Location permission required for GPS Geofence check-in. Please enable GPS or use QR code.'
        });
        return;
      }
    }

    try {
      const res = await recordCheckIn({
        workplaceId: currentWorkplace.id,
        verificationMethod,
        lat,
        lng,
        qrToken: verificationMethod === 'Workplace QR Code' ? qrTokenInput.trim() : undefined
      });

      setIsProcessing(false);
      setStatusMessage({
        type: res.success ? 'success' : 'error',
        text: res.message
      });
      if (res.success) {
        setQrTokenInput('');
      }
    } catch (err: any) {
      setIsProcessing(false);
      setStatusMessage({ type: 'error', text: err.message || 'Check-in failed.' });
    }
  };

  // Perform Check Out
  const handleCheckOut = async () => {
    setIsProcessing(true);
    setStatusMessage(null);

    let lat: number | undefined;
    let lng: number | undefined;

    if (navigator.geolocation) {
      try {
        const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 6000 });
        });
        lat = pos.coords.latitude;
        lng = pos.coords.longitude;
      } catch (e) {
        // Optional for checkout
      }
    }

    try {
      const res = await recordCheckOut({ lat, lng });
      setIsProcessing(false);
      setStatusMessage({
        type: res.success ? 'success' : 'error',
        text: res.message
      });
    } catch (err: any) {
      setIsProcessing(false);
      setStatusMessage({ type: 'error', text: err.message || 'Check-out failed.' });
    }
  };

  // Handle Submit Leave
  const handleLeaveSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentWorkplace) return;
    try {
      const start = new Date(leaveForm.startDate);
      const end = new Date(leaveForm.endDate);
      const diffTime = Math.abs(end.getTime() - start.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

      await submitLeaveRequest({
        employerId: currentWorkplace.employerId,
        employeeIdNumber: myEmploymentRecords[0]?.employeeIdNumber,
        leaveType: leaveForm.leaveType,
        startDate: leaveForm.startDate,
        endDate: leaveForm.endDate,
        daysCount: diffDays,
        reason: leaveForm.reason
      });

      setShowLeaveModal(false);
      setLeaveForm({
        leaveType: 'Casual Leave',
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0],
        reason: ''
      });
      setStatusMessage({ type: 'success', text: 'Leave application submitted for approval.' });
    } catch (err) {
      console.error('Error submitting leave:', err);
    }
  };

  // Handle Submit Correction
  const handleCorrectionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentWorkplace) return;
    try {
      await submitCorrection({
        employerId: currentWorkplace.employerId,
        attendanceDate: correctionForm.attendanceDate,
        issueType: correctionForm.issueType,
        reason: correctionForm.reason
      });
      setShowCorrectionModal(false);
      setStatusMessage({ type: 'success', text: 'Attendance punch correction request submitted to manager.' });
    } catch (err) {
      console.error('Error submitting correction:', err);
    }
  };

  // Monthly summary metrics
  const totalShiftsLogged = myAttendanceHistory.length;
  const totalHoursWorked = myAttendanceHistory.reduce((acc, curr) => acc + (curr.effectiveWorkingHours || 0), 0);
  const totalLateArrivals = myAttendanceHistory.filter((a) => a.isLate).length;

  if (!hasJoinedCompany) {
    return (
      <div className="space-y-6 animate-in fade-in">
        <div className="bg-white rounded-3xl border border-slate-200 p-8 sm:p-12 text-center shadow-sm max-w-2xl mx-auto my-6">
          <div className="w-16 h-16 rounded-2xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center mx-auto mb-5">
            <Lock className="w-8 h-8" />
          </div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-[11px] font-black uppercase tracking-wider mb-3">
            <Clock className="w-3.5 h-3.5 text-slate-500" /> Attendance Feature Inactive
          </span>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Join a Company to Activate Attendance
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 mt-2.5 max-w-md mx-auto leading-relaxed">
            The GPS Geofence & QR Attendance system is currently turned off because you have not joined any company yet. Once an employer selects your job application, or you accept a direct hiring offer, your daily attendance punch desk will activate automatically.
          </p>
          <div className="mt-6 pt-6 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-3 gap-3 text-left">
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80">
              <div className="flex items-center gap-2 text-xs font-extrabold text-slate-800">
                <Briefcase className="w-4 h-4 text-blue-600 shrink-0" />
                <span>1. Apply or Get Offer</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                Apply to verified local jobs or receive a direct hiring request from an employer.
              </p>
            </div>
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80">
              <div className="flex items-center gap-2 text-xs font-extrabold text-slate-800">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>2. Join Company</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                Accept the hiring offer or get marked as Selected by the business owner.
              </p>
            </div>
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80">
              <div className="flex items-center gap-2 text-xs font-extrabold text-slate-800">
                <Building2 className="w-4 h-4 text-amber-600 shrink-0" />
                <span>3. Punch In Daily</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                Attendance unlocks automatically for your assigned workplace shift.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1.5">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-200">
              Employee Punch Desk
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              My Attendance & Shifts
            </h2>
            <p className="text-xs sm:text-sm text-blue-100 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-amber-300 shrink-0" />
              <span>{todayStr}</span>
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={() => setShowLeaveModal(true)}
              className="px-4 py-2.5 rounded-2xl bg-white/15 hover:bg-white/25 text-white font-bold text-xs backdrop-blur-md transition-colors cursor-pointer"
            >
              Apply for Leave
            </button>
            <button
              type="button"
              onClick={() => setShowCorrectionModal(true)}
              className="px-4 py-2.5 rounded-2xl bg-white/15 hover:bg-white/25 text-white font-bold text-xs backdrop-blur-md transition-colors cursor-pointer"
            >
              Punch Correction
            </button>
          </div>
        </div>

        {/* Sub Navigation */}
        <div className="mt-6 pt-5 border-t border-white/15 flex flex-wrap items-center gap-2">
          {[
            { id: 'punch', label: 'Today’s Punch Desk' },
            { id: 'history', label: `Attendance Log (${totalShiftsLogged})` },
            { id: 'leave', label: `Leave Records (${myLeaveRequests.length})` },
            { id: 'correction', label: `Corrections (${myCorrections.length})` }
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === tab.id
                  ? 'bg-amber-400 text-slate-950 shadow-md font-extrabold'
                  : 'bg-white/10 text-white hover:bg-white/20'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Status Alert Banner */}
      {statusMessage && (
        <div className={`p-4 rounded-2xl text-xs font-semibold flex items-center justify-between gap-3 ${
          statusMessage.type === 'success'
            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
            : 'bg-red-50 text-red-800 border border-red-200'
        }`}>
          <div className="flex items-center gap-2">
            {statusMessage.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
            )}
            <span>{statusMessage.text}</span>
          </div>
          <button
            type="button"
            onClick={() => setStatusMessage(null)}
            className="text-xs font-bold underline cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* TAB 1: TODAY'S PUNCH DESK */}
      {activeTab === 'punch' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Main Action Box */}
          <div className="lg:col-span-8 bg-white rounded-3xl p-6 sm:p-8 shadow-xs border border-gray-200 space-y-6">
            <div>
              <h3 className="text-base font-extrabold text-gray-900">Live Check-in & Punch Console</h3>
              <p className="text-xs text-gray-500 mt-0.5">
                Record your daily shift presence with GPS geofence validation or workplace QR code scanning.
              </p>
            </div>

            {/* Current Status Box */}
            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                  Today's Status
                </span>
                <div className="flex items-center gap-2">
                  <span className={`w-3 h-3 rounded-full ${
                    myTodayAttendance?.checkOutTime
                      ? 'bg-purple-500'
                      : myTodayAttendance?.checkInTime
                      ? 'bg-emerald-500 animate-pulse'
                      : 'bg-gray-300'
                  }`} />
                  <span className="text-base font-extrabold text-gray-900">
                    {myTodayAttendance?.checkOutTime
                      ? `Shift Completed (${myTodayAttendance.effectiveWorkingHours || 0} hrs)`
                      : myTodayAttendance?.checkInTime
                      ? `Checked In at ${new Date(myTodayAttendance.checkInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
                      : 'Not Checked In Yet'}
                  </span>
                </div>
              </div>

              {myTodayAttendance?.isLate && (
                <span className="px-3 py-1 rounded-xl bg-amber-100 text-amber-900 text-xs font-bold">
                  Late Arrival Logged
                </span>
              )}
            </div>

            {/* Workplace Selector */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-700 block">
                Select Workplace / Store Facility
              </label>
              <select
                value={selectedWorkplaceId}
                onChange={(e) => setSelectedWorkplaceId(e.target.value)}
                className="w-full p-3 rounded-2xl bg-gray-50 border border-gray-200 text-xs font-semibold focus:outline-hidden cursor-pointer"
              >
                {workplaces.length === 0 ? (
                  <option value="">No workplace registered yet</option>
                ) : (
                  workplaces.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.name} ({w.city}, {w.state} - {w.geofenceRadiusMeters}m geofence)
                    </option>
                  ))
                )}
              </select>
            </div>

            {/* Verification Method Toggle */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-700 block">
                Verification Method
              </label>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <button
                  type="button"
                  onClick={() => setVerificationMethod('GPS Geofence')}
                  className={`p-3.5 rounded-2xl border text-left flex items-start gap-3 transition-all cursor-pointer ${
                    verificationMethod === 'GPS Geofence'
                      ? 'border-blue-600 bg-blue-50/50 text-blue-900 font-bold'
                      : 'border-gray-200 hover:bg-gray-50 text-gray-700'
                  }`}
                >
                  <Navigation className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
                  <div>
                    <span className="block font-extrabold">GPS Geofence</span>
                    <span className="text-[11px] text-gray-500 font-normal">
                      Validates within facility perimeter
                    </span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setVerificationMethod('Workplace QR Code')}
                  className={`p-3.5 rounded-2xl border text-left flex items-start gap-3 transition-all cursor-pointer ${
                    verificationMethod === 'Workplace QR Code'
                      ? 'border-blue-600 bg-blue-50/50 text-blue-900 font-bold'
                      : 'border-gray-200 hover:bg-gray-50 text-gray-700'
                  }`}
                >
                  <QrCode className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
                  <div>
                    <span className="block font-extrabold">Workplace QR Code</span>
                    <span className="text-[11px] text-gray-500 font-normal">
                      Scan or enter token from standee
                    </span>
                  </div>
                </button>
              </div>

              {verificationMethod === 'Workplace QR Code' && (
                <div className="pt-2">
                  <input
                    type="text"
                    placeholder="Enter Workplace Secret Token (e.g. WP-ABC1234)..."
                    value={qrTokenInput}
                    onChange={(e) => setQrTokenInput(e.target.value)}
                    className="w-full p-3 rounded-2xl bg-gray-50 border border-gray-200 text-xs font-mono focus:bg-white focus:outline-hidden"
                  />
                </div>
              )}
            </div>

            {/* CHECK IN and CHECK OUT Prominent Buttons */}
            <div className="pt-4 border-t border-gray-100 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <button
                type="button"
                disabled={isProcessing || Boolean(myTodayAttendance?.checkInTime)}
                onClick={handleCheckIn}
                className="py-4 px-6 rounded-2xl bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-100 disabled:text-gray-400 text-white font-black text-sm shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed"
              >
                <CheckCircle2 className="w-5 h-5" />
                <span>CHECK IN</span>
              </button>

              <button
                type="button"
                disabled={isProcessing || !myTodayAttendance?.checkInTime || Boolean(myTodayAttendance?.checkOutTime)}
                onClick={handleCheckOut}
                className="py-4 px-6 rounded-2xl bg-slate-900 hover:bg-slate-800 disabled:bg-gray-100 disabled:text-gray-400 text-white font-black text-sm shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed"
              >
                <Clock className="w-5 h-5" />
                <span>CHECK OUT</span>
              </button>
            </div>
          </div>

          {/* Side Summary Panel */}
          <div className="lg:col-span-4 space-y-4">
            <div className="bg-white rounded-3xl p-6 shadow-xs border border-gray-200 space-y-4">
              <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Monthly Summary</span>
              </h3>

              <div className="space-y-3 text-xs">
                <div className="p-3.5 rounded-2xl bg-blue-50/60 border border-blue-100 flex items-center justify-between">
                  <span className="text-gray-600">Logged Shifts:</span>
                  <span className="font-black text-blue-700 text-sm">{totalShiftsLogged} Days</span>
                </div>

                <div className="p-3.5 rounded-2xl bg-emerald-50/60 border border-emerald-100 flex items-center justify-between">
                  <span className="text-gray-600">Total Working Hours:</span>
                  <span className="font-black text-emerald-700 text-sm">{totalHoursWorked.toFixed(1)} hrs</span>
                </div>

                <div className="p-3.5 rounded-2xl bg-amber-50/60 border border-amber-100 flex items-center justify-between">
                  <span className="text-gray-600">Late Arrivals:</span>
                  <span className="font-black text-amber-700 text-sm">{totalLateArrivals}</span>
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 text-[11px] text-gray-500">
                <strong>Consent Notice:</strong> GPS coordinates are captured solely during your manual check-in/out action to authenticate physical workplace presence. No continuous background tracking is performed.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: ATTENDANCE HISTORY LOG */}
      {activeTab === 'history' && (
        <div className="bg-white rounded-3xl p-6 shadow-xs border border-gray-200 space-y-4">
          <div className="pb-3 border-b border-gray-100">
            <h3 className="text-base font-bold text-gray-900">Your Attendance History</h3>
            <p className="text-xs text-gray-500">Complete audit log of all punch records, duration, and verification status.</p>
          </div>

          {myAttendanceHistory.length === 0 ? (
            <div className="py-12 text-center text-gray-400 text-xs">No attendance history logged yet.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-gray-200 text-gray-500 font-bold uppercase text-[10px]">
                    <th className="py-3 px-3">Date</th>
                    <th className="py-3 px-3">Facility</th>
                    <th className="py-3 px-3">Check-In</th>
                    <th className="py-3 px-3">Check-Out</th>
                    <th className="py-3 px-3">Hours</th>
                    <th className="py-3 px-3">Verification</th>
                    <th className="py-3 px-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {myAttendanceHistory.map((rec) => (
                    <tr key={rec.id} className="hover:bg-gray-50">
                      <td className="py-3 px-3 font-bold text-gray-900">{rec.dateString}</td>
                      <td className="py-3 px-3 text-gray-700 font-medium">{rec.workplaceName}</td>
                      <td className="py-3 px-3">{rec.checkInTime ? new Date(rec.checkInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-'}</td>
                      <td className="py-3 px-3">{rec.checkOutTime ? new Date(rec.checkOutTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-'}</td>
                      <td className="py-3 px-3 font-bold text-gray-900">{rec.effectiveWorkingHours ? `${rec.effectiveWorkingHours} hrs` : '-'}</td>
                      <td className="py-3 px-3">
                        <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 text-[10px] font-bold">
                          {rec.verificationMethod}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          rec.status === 'Present' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                        }`}>
                          {rec.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: LEAVE RECORDS */}
      {activeTab === 'leave' && (
        <div className="bg-white rounded-3xl p-6 shadow-xs border border-gray-200 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-gray-100">
            <div>
              <h3 className="text-base font-bold text-gray-900">Your Leave Applications</h3>
              <p className="text-xs text-gray-500">Track approvals for casual, sick, or emergency leave.</p>
            </div>
            <button
              type="button"
              onClick={() => setShowLeaveModal(true)}
              className="px-4 py-2 rounded-xl bg-blue-600 text-white font-bold text-xs cursor-pointer"
            >
              + Apply for Leave
            </button>
          </div>

          {myLeaveRequests.length === 0 ? (
            <div className="py-12 text-center text-gray-400 text-xs">No leave applications on file.</div>
          ) : (
            <div className="space-y-3">
              {myLeaveRequests.map((l) => (
                <div key={l.id} className="p-4 rounded-2xl bg-gray-50 border border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-gray-900">{l.leaveType}</span>
                      <span className="text-gray-500">({l.daysCount} days: {l.startDate} to {l.endDate})</span>
                    </div>
                    <p className="text-gray-600 mt-0.5 italic">"{l.reason}"</p>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold self-start sm:self-auto ${
                    l.status === 'Approved' ? 'bg-emerald-100 text-emerald-800' : l.status === 'Rejected' ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-800'
                  }`}>
                    {l.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 4: CORRECTIONS */}
      {activeTab === 'correction' && (
        <div className="bg-white rounded-3xl p-6 shadow-xs border border-gray-200 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-gray-100">
            <div>
              <h3 className="text-base font-bold text-gray-900">Punch Correction Requests</h3>
              <p className="text-xs text-gray-500">Resolve missed punches, device timeouts, or status discrepancies.</p>
            </div>
            <button
              type="button"
              onClick={() => setShowCorrectionModal(true)}
              className="px-4 py-2 rounded-xl bg-blue-600 text-white font-bold text-xs cursor-pointer"
            >
              + Request Correction
            </button>
          </div>

          {myCorrections.length === 0 ? (
            <div className="py-12 text-center text-gray-400 text-xs">No correction requests submitted.</div>
          ) : (
            <div className="space-y-3">
              {myCorrections.map((c) => (
                <div key={c.id} className="p-4 rounded-2xl bg-gray-50 border border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-gray-900">{c.issueType}</span>
                      <span className="text-gray-500">on {c.attendanceDate}</span>
                    </div>
                    <p className="text-gray-600 mt-0.5 italic">"{c.reason}"</p>
                  </div>
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-gray-200 text-gray-800 self-start sm:self-auto">
                    {c.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* MODAL: APPLY FOR LEAVE */}
      {showLeaveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <h3 className="text-base font-black text-gray-900">Submit Leave Application</h3>
            <form onSubmit={handleLeaveSubmit} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-gray-700 block mb-1">Leave Type *</label>
                <select
                  value={leaveForm.leaveType}
                  onChange={(e) => setLeaveForm({ ...leaveForm, leaveType: e.target.value as any })}
                  className="w-full p-2.5 rounded-xl bg-gray-50 border border-gray-200 font-semibold cursor-pointer"
                >
                  <option value="Casual Leave">Casual Leave</option>
                  <option value="Sick Leave">Sick Leave</option>
                  <option value="Emergency Leave">Emergency Leave</option>
                  <option value="Unpaid Leave">Unpaid Leave</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-gray-700 block mb-1">Start Date *</label>
                  <input
                    type="date"
                    required
                    value={leaveForm.startDate}
                    onChange={(e) => setLeaveForm({ ...leaveForm, startDate: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-gray-50 border border-gray-200 font-semibold cursor-pointer"
                  />
                </div>
                <div>
                  <label className="font-bold text-gray-700 block mb-1">End Date *</label>
                  <input
                    type="date"
                    required
                    value={leaveForm.endDate}
                    onChange={(e) => setLeaveForm({ ...leaveForm, endDate: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-gray-50 border border-gray-200 font-semibold cursor-pointer"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-gray-700 block mb-1">Reason for Leave *</label>
                <textarea
                  rows={3}
                  required
                  value={leaveForm.reason}
                  onChange={(e) => setLeaveForm({ ...leaveForm, reason: e.target.value })}
                  placeholder="Share a brief explanation for your absence..."
                  className="w-full p-2.5 rounded-xl bg-gray-50 border border-gray-200 font-medium"
                />
              </div>

              <div className="pt-3 border-t border-gray-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowLeaveModal(false)}
                  className="px-4 py-2 font-bold text-gray-600 hover:bg-gray-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-extrabold rounded-xl shadow-md cursor-pointer"
                >
                  Submit Application
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: PUNCH CORRECTION */}
      {showCorrectionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <h3 className="text-base font-black text-gray-900">Request Punch Correction</h3>
            <form onSubmit={handleCorrectionSubmit} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-gray-700 block mb-1">Attendance Date *</label>
                <input
                  type="date"
                  required
                  value={correctionForm.attendanceDate}
                  onChange={(e) => setCorrectionForm({ ...correctionForm, attendanceDate: e.target.value })}
                  className="w-full p-2.5 rounded-xl bg-gray-50 border border-gray-200 font-semibold cursor-pointer"
                />
              </div>

              <div>
                <label className="font-bold text-gray-700 block mb-1">Issue Type *</label>
                <select
                  value={correctionForm.issueType}
                  onChange={(e) => setCorrectionForm({ ...correctionForm, issueType: e.target.value as any })}
                  className="w-full p-2.5 rounded-xl bg-gray-50 border border-gray-200 font-semibold cursor-pointer"
                >
                  <option value="Missing Check-in">Missing Check-in Punch</option>
                  <option value="Missing Check-out">Missing Check-out Punch</option>
                  <option value="Wrong Timestamps">Wrong Timestamps Recorded</option>
                  <option value="Incorrect Status">Incorrect Status (Marked Absent)</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-gray-700 block mb-1">Reason / Clarification *</label>
                <textarea
                  rows={3}
                  required
                  value={correctionForm.reason}
                  onChange={(e) => setCorrectionForm({ ...correctionForm, reason: e.target.value })}
                  placeholder="Explain why the punch was missed or delayed (e.g. mobile battery died, site inspection)..."
                  className="w-full p-2.5 rounded-xl bg-gray-50 border border-gray-200 font-medium"
                />
              </div>

              <div className="pt-3 border-t border-gray-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCorrectionModal(false)}
                  className="px-4 py-2 font-bold text-gray-600 hover:bg-gray-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-extrabold rounded-xl shadow-md cursor-pointer"
                >
                  Submit Correction
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
