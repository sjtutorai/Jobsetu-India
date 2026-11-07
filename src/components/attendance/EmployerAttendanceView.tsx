import React, { useState, useMemo } from 'react';
import QRCode from 'qrcode';
import { useAttendance } from '../../context/AttendanceContext';
import { useAuth } from '../../context/AuthContext';
import {
  EmployerWorkplace,
  WorkShift,
  EmployeeRecord,
  AttendanceRecord,
  LeaveRequest,
  AttendanceCorrection
} from '../../types';
import {
  Clock,
  Users,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  QrCode,
  MapPin,
  PlusCircle,
  Calendar,
  FileSpreadsheet,
  Printer,
  Search,
  ShieldCheck,
  Check,
  X,
  FileText,
  Sliders,
  Sparkles,
  Download
} from 'lucide-react';

export const EmployerAttendanceView: React.FC = () => {
  const { employerProfile } = useAuth();
  const {
    workplaces,
    createWorkplace,
    shifts,
    createShift,
    employees,
    addEmployee,
    updateEmployee,
    attendanceRecords,
    manualApproveAttendance,
    leaveRequests,
    reviewLeaveRequest,
    corrections,
    reviewCorrection
  } = useAttendance();

  const [activeSubTab, setActiveSubTab] = useState<'overview' | 'roster' | 'workplaces' | 'shifts' | 'leaves' | 'corrections' | 'reports'>('overview');
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedDepartment, setSelectedDepartment] = useState<string>('all');

  // Modals state
  const [showAddEmpModal, setShowAddEmpModal] = useState<boolean>(false);
  const [showAddWorkplaceModal, setShowAddWorkplaceModal] = useState<boolean>(false);
  const [showAddShiftModal, setShowAddShiftModal] = useState<boolean>(false);
  const [qrModalWorkplace, setQrModalWorkplace] = useState<EmployerWorkplace | null>(null);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');

  // Form states for modals
  const [empForm, setEmpForm] = useState({
    fullName: '',
    email: '',
    phone: '',
    employeeIdNumber: `EMP-${Math.floor(1000 + Math.random() * 9000)}`,
    department: 'Operations',
    designation: 'Associate',
    shiftId: '',
    workplaceId: '',
    joiningDate: new Date().toISOString().split('T')[0],
    wageOrSalary: '₹22,000 / month'
  });

  const [workplaceForm, setWorkplaceForm] = useState({
    name: employerProfile?.businessName ? `${employerProfile.businessName} Facility` : 'Main Workshop',
    address: employerProfile?.businessAddress || 'Plot 12, Industrial Area',
    city: employerProfile?.city || 'Delhi',
    state: employerProfile?.state || 'Delhi',
    pincode: employerProfile?.pincode || '110001',
    lat: employerProfile?.lat || 28.6139,
    lng: employerProfile?.lng || 77.2090,
    geofenceRadiusMeters: 200
  });

  const [shiftForm, setShiftForm] = useState({
    name: 'General Day Shift',
    shiftType: 'Morning' as WorkShift['shiftType'],
    startTime: '09:00',
    endTime: '18:00',
    breakDurationMinutes: 60,
    weeklyOffDays: ['Sunday'],
    graceMinutes: 15
  });

  // Calculate Metrics for selected date
  const recordsForDate = useMemo(() => {
    return attendanceRecords.filter((r) => r.dateString === selectedDate);
  }, [attendanceRecords, selectedDate]);

  const totalEmployees = employees.length;
  const presentCount = recordsForDate.filter((r) => r.status === 'Present' || r.status === 'Overtime').length;
  const lateCount = recordsForDate.filter((r) => r.isLate).length;
  const halfDayCount = recordsForDate.filter((r) => r.status === 'Half Day').length;
  const absentCount = Math.max(0, totalEmployees - (presentCount + lateCount + halfDayCount));
  const activeNowCount = recordsForDate.filter((r) => r.checkInTime && !r.checkOutTime).length;
  const completedCount = recordsForDate.filter((r) => r.checkInTime && r.checkOutTime).length;
  const pendingLeavesCount = leaveRequests.filter((l) => l.status === 'Pending').length;
  const pendingCorrectionsCount = corrections.filter((c) => c.status === 'Pending').length;

  // Filtered Roster for Date
  const filteredRecords = useMemo(() => {
    return recordsForDate.filter((rec) => {
      if (searchTerm) {
        const s = searchTerm.toLowerCase();
        const matchName = (rec.employeeName || '').toLowerCase().includes(s);
        const matchId = (rec.employeeIdNumber || '').toLowerCase().includes(s);
        if (!matchName && !matchId) return false;
      }
      return true;
    });
  }, [recordsForDate, searchTerm]);

  // Open QR Code modal
  const handleGenerateQR = async (wp: EmployerWorkplace) => {
    try {
      const qrData = JSON.stringify({
        workplaceId: wp.id,
        workplaceName: wp.name,
        code: wp.qrSecretCode,
        ts: Date.now()
      });
      const url = await QRCode.toDataURL(qrData, { width: 320, margin: 2 });
      setQrCodeDataUrl(url);
      setQrModalWorkplace(wp);
    } catch (err) {
      console.error('Error generating QR:', err);
    }
  };

  // Submit Add Employee
  const handleAddEmployeeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const selectedWp = workplaces.find((w) => w.id === empForm.workplaceId) || workplaces[0];
      const selectedSh = shifts.find((s) => s.id === empForm.shiftId) || shifts[0];

      await addEmployee({
        fullName: empForm.fullName,
        email: empForm.email,
        phone: empForm.phone,
        employeeIdNumber: empForm.employeeIdNumber,
        department: empForm.department,
        designation: empForm.designation,
        shiftId: selectedSh?.id || 'standard',
        shiftName: selectedSh?.name || 'Standard Shift',
        workplaceId: selectedWp?.id || 'facility',
        workplaceName: selectedWp?.name || 'Main Facility',
        status: 'Active',
        joiningDate: empForm.joiningDate,
        wageOrSalary: empForm.wageOrSalary
      });

      setShowAddEmpModal(false);
      setEmpForm({
        fullName: '',
        email: '',
        phone: '',
        employeeIdNumber: `EMP-${Math.floor(1000 + Math.random() * 9000)}`,
        department: 'Operations',
        designation: 'Associate',
        shiftId: '',
        workplaceId: '',
        joiningDate: new Date().toISOString().split('T')[0],
        wageOrSalary: '₹22,000 / month'
      });
    } catch (err) {
      console.error('Error adding employee:', err);
    }
  };

  // Submit Add Workplace
  const handleAddWorkplaceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const randomSecret = `WP-${Math.random().toString(36).substring(2, 9).toUpperCase()}`;
      await createWorkplace({
        name: workplaceForm.name,
        address: workplaceForm.address,
        city: workplaceForm.city,
        state: workplaceForm.state,
        pincode: workplaceForm.pincode,
        lat: Number(workplaceForm.lat),
        lng: Number(workplaceForm.lng),
        geofenceRadiusMeters: Number(workplaceForm.geofenceRadiusMeters),
        qrSecretCode: randomSecret,
        isActive: true
      });
      setShowAddWorkplaceModal(false);
    } catch (err) {
      console.error('Error adding workplace:', err);
    }
  };

  // Submit Add Shift
  const handleAddShiftSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createShift({
        name: shiftForm.name,
        shiftType: shiftForm.shiftType,
        startTime: shiftForm.startTime,
        endTime: shiftForm.endTime,
        breakDurationMinutes: Number(shiftForm.breakDurationMinutes),
        weeklyOffDays: shiftForm.weeklyOffDays,
        graceMinutes: Number(shiftForm.graceMinutes),
        isActive: true
      });
      setShowAddShiftModal(false);
    } catch (err) {
      console.error('Error adding shift:', err);
    }
  };

  // CSV Report Export
  const handleExportCSV = () => {
    const headers = ['Employee Name', 'Employee ID', 'Shift', 'Workplace', 'Check-In', 'Check-Out', 'Hours', 'Method', 'Status'];
    const rows = recordsForDate.map((r) => [
      `"${r.employeeName || ''}"`,
      `"${r.employeeIdNumber || ''}"`,
      `"${r.shiftName || ''}"`,
      `"${r.workplaceName || ''}"`,
      `"${r.checkInTime ? new Date(r.checkInTime).toLocaleTimeString() : '-'}"`,
      `"${r.checkOutTime ? new Date(r.checkOutTime).toLocaleTimeString() : '-'}"`,
      `"${r.effectiveWorkingHours || 0}"`,
      `"${r.verificationMethod || ''}"`,
      `"${r.status || ''}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `JOBSETU_Attendance_${selectedDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-950 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs font-bold uppercase tracking-wider text-blue-300">
                Workforce Operations & Shift Hub
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Attendance & Employee Management
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 max-w-xl">
              Real-time GPS geofenced check-ins, workplace QR code scanners, shift rostering, and automated wage-hour calculations for your enterprise.
            </p>
          </div>

          {/* Quick Date Selector & Add Employee Button */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 bg-white/10 px-3 py-2 rounded-2xl border border-white/20">
              <Calendar className="w-4 h-4 text-amber-300 shrink-0" />
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="bg-transparent text-xs font-bold text-white focus:outline-hidden cursor-pointer"
              />
            </div>

            <button
              type="button"
              onClick={() => setShowAddEmpModal(true)}
              className="px-4 py-2.5 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs shadow-lg transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Add Employee</span>
            </button>
          </div>
        </div>

        {/* Sub Navigation Tabs */}
        <div className="mt-6 pt-5 border-t border-white/10 flex flex-wrap items-center gap-2">
          {[
            { id: 'overview', label: 'Dashboard Overview' },
            { id: 'roster', label: `Today's Roster (${recordsForDate.length})` },
            { id: 'workplaces', label: `Workplaces & Geofences (${workplaces.length})` },
            { id: 'shifts', label: `Shift Policies (${shifts.length})` },
            { id: 'leaves', label: `Leave Approvals (${pendingLeavesCount} Pending)` },
            { id: 'corrections', label: `Attendance Corrections (${pendingCorrectionsCount})` },
            { id: 'reports', label: 'Export Reports' }
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveSubTab(tab.id as any)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeSubTab === tab.id
                  ? 'bg-amber-400 text-slate-950 shadow-md font-extrabold'
                  : 'bg-white/10 text-slate-200 hover:bg-white/20'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* SUBTAB 1: OVERVIEW METRICS */}
      {activeSubTab === 'overview' && (
        <div className="space-y-6">
          {/* Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
            <div className="bg-white rounded-2xl p-4 shadow-xs border border-gray-200">
              <span className="text-xl font-black text-gray-900 block">{totalEmployees}</span>
              <span className="text-[11px] font-semibold text-gray-500 mt-0.5 block">Total Staff</span>
            </div>
            <div className="bg-white rounded-2xl p-4 shadow-xs border border-gray-200">
              <span className="text-xl font-black text-emerald-600 block">{presentCount}</span>
              <span className="text-[11px] font-semibold text-gray-500 mt-0.5 block">Present Today</span>
            </div>
            <div className="bg-white rounded-2xl p-4 shadow-xs border border-gray-200">
              <span className="text-xl font-black text-blue-600 block">{activeNowCount}</span>
              <span className="text-[11px] font-semibold text-gray-500 mt-0.5 block">Currently Working</span>
            </div>
            <div className="bg-white rounded-2xl p-4 shadow-xs border border-gray-200">
              <span className="text-xl font-black text-amber-600 block">{lateCount}</span>
              <span className="text-[11px] font-semibold text-gray-500 mt-0.5 block">Late Arrivals</span>
            </div>
            <div className="bg-white rounded-2xl p-4 shadow-xs border border-gray-200">
              <span className="text-xl font-black text-purple-600 block">{completedCount}</span>
              <span className="text-[11px] font-semibold text-gray-500 mt-0.5 block">Shifts Completed</span>
            </div>
            <div className="bg-white rounded-2xl p-4 shadow-xs border border-gray-200">
              <span className="text-xl font-black text-red-600 block">{absentCount}</span>
              <span className="text-[11px] font-semibold text-gray-500 mt-0.5 block">Absent / Off</span>
            </div>
            <div className="bg-white rounded-2xl p-4 shadow-xs border border-gray-200">
              <span className="text-xl font-black text-indigo-600 block">{pendingLeavesCount}</span>
              <span className="text-[11px] font-semibold text-gray-500 mt-0.5 block">Pending Leaves</span>
            </div>
          </div>

          {/* Action Row & Live Verification Highlights */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Registered Workplaces Card */}
            <div className="bg-white rounded-3xl p-6 shadow-xs border border-gray-200 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-blue-600" />
                  <span>Workplaces & GPS Geofences</span>
                </h3>
                <button
                  type="button"
                  onClick={() => setShowAddWorkplaceModal(true)}
                  className="text-xs font-bold text-blue-600 hover:underline cursor-pointer"
                >
                  + Add Facility
                </button>
              </div>

              {workplaces.length === 0 ? (
                <div className="py-6 text-center text-gray-400 text-xs">
                  No workplaces added yet. Add your facility to allow GPS and QR check-in.
                </div>
              ) : (
                <div className="space-y-2.5">
                  {workplaces.map((wp) => (
                    <div
                      key={wp.id}
                      className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between gap-3 text-xs"
                    >
                      <div>
                        <h4 className="font-bold text-gray-900">{wp.name}</h4>
                        <p className="text-[11px] text-gray-500 flex items-center gap-1 mt-0.5">
                          <span>{wp.city}, {wp.state}</span>
                          <span className="text-blue-600 font-semibold">• {wp.geofenceRadiusMeters}m geofence</span>
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleGenerateQR(wp)}
                        className="px-2.5 py-1.5 rounded-xl bg-white border border-gray-200 text-gray-700 font-bold hover:bg-gray-50 flex items-center gap-1 cursor-pointer shrink-0"
                      >
                        <QrCode className="w-3.5 h-3.5 text-blue-600" />
                        <span>QR Sheet</span>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Quick Shift Overview */}
            <div className="bg-white rounded-3xl p-6 shadow-xs border border-gray-200 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-amber-600" />
                  <span>Configured Shift Timings</span>
                </h3>
                <button
                  type="button"
                  onClick={() => setShowAddShiftModal(true)}
                  className="text-xs font-bold text-amber-600 hover:underline cursor-pointer"
                >
                  + Add Shift
                </button>
              </div>

              {shifts.length === 0 ? (
                <div className="py-6 text-center text-gray-400 text-xs">
                  No shifts configured. Standard 9:00 AM - 6:00 PM shift is active by default.
                </div>
              ) : (
                <div className="space-y-2.5">
                  {shifts.map((sh) => (
                    <div
                      key={sh.id}
                      className="p-3.5 rounded-2xl bg-amber-50/50 border border-amber-100 flex items-center justify-between text-xs"
                    >
                      <div>
                        <span className="font-bold text-gray-900">{sh.name}</span>
                        <span className="text-[11px] text-gray-500 block">
                          {sh.startTime} to {sh.endTime} ({sh.breakDurationMinutes}m break)
                        </span>
                      </div>
                      <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 text-[10px] font-bold">
                        {sh.shiftType}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Pending Requests & Approvals */}
            <div className="bg-white rounded-3xl p-6 shadow-xs border border-gray-200 space-y-4">
              <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                <FileText className="w-4 h-4 text-emerald-600" />
                <span>Pending Approvals</span>
              </h3>

              <div className="space-y-2 text-xs">
                <div
                  onClick={() => setActiveSubTab('leaves')}
                  className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between cursor-pointer hover:bg-slate-100"
                >
                  <span className="font-medium text-gray-700">Leave Applications</span>
                  <span className="px-2.5 py-0.5 rounded-full font-bold bg-amber-100 text-amber-800 text-[11px]">
                    {pendingLeavesCount} Pending
                  </span>
                </div>

                <div
                  onClick={() => setActiveSubTab('corrections')}
                  className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between cursor-pointer hover:bg-slate-100"
                >
                  <span className="font-medium text-gray-700">Punch Corrections</span>
                  <span className="px-2.5 py-0.5 rounded-full font-bold bg-purple-100 text-purple-800 text-[11px]">
                    {pendingCorrectionsCount} Requests
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUBTAB 2: TODAY'S LIVE ROSTER */}
      {(activeSubTab === 'roster' || activeSubTab === 'overview') && (
        <div className="bg-white rounded-3xl p-6 shadow-xs border border-gray-200 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-gray-100">
            <div>
              <h3 className="text-base font-bold text-gray-900">
                Staff Attendance Roster for {selectedDate}
              </h3>
              <p className="text-xs text-gray-500">
                Live punch logs with GPS geofence radius checks, QR tokens, and working hour calculations.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleExportCSV}
                className="px-3.5 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs flex items-center gap-1.5 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export CSV</span>
              </button>
            </div>
          </div>

          {filteredRecords.length === 0 ? (
            <div className="py-12 text-center text-gray-400 text-xs">
              <Clock className="w-10 h-10 mx-auto mb-2 opacity-50" />
              <p className="font-semibold text-gray-700">No attendance records logged for {selectedDate}</p>
              <p className="text-gray-400 mt-0.5">Employees check in using the mobile GPS punch or scanning the workplace QR code.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-gray-200 text-gray-500 font-bold uppercase text-[10px]">
                    <th className="py-3 px-3">Employee</th>
                    <th className="py-3 px-3">Facility</th>
                    <th className="py-3 px-3">Shift</th>
                    <th className="py-3 px-3">Check-In</th>
                    <th className="py-3 px-3">Check-Out</th>
                    <th className="py-3 px-3">Hours</th>
                    <th className="py-3 px-3">Verification</th>
                    <th className="py-3 px-3">Status</th>
                    <th className="py-3 px-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredRecords.map((rec) => {
                    return (
                      <tr key={rec.id} className="hover:bg-gray-50/80">
                        <td className="py-3 px-3">
                          <span className="font-bold text-gray-900 block">{rec.employeeName}</span>
                          <span className="text-[10px] text-gray-500">{rec.employeeIdNumber || 'ID Pending'}</span>
                        </td>
                        <td className="py-3 px-3 text-gray-700 font-medium">
                          {rec.workplaceName}
                        </td>
                        <td className="py-3 px-3 text-gray-700 font-medium">
                          {rec.shiftName}
                        </td>
                        <td className="py-3 px-3">
                          <span className="font-semibold text-gray-900">
                            {rec.checkInTime ? new Date(rec.checkInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-'}
                          </span>
                        </td>
                        <td className="py-3 px-3">
                          <span className="font-semibold text-gray-900">
                            {rec.checkOutTime ? new Date(rec.checkOutTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : (
                              <span className="text-blue-600 font-bold animate-pulse">Working Now</span>
                            )}
                          </span>
                        </td>
                        <td className="py-3 px-3 font-bold text-gray-900">
                          {rec.effectiveWorkingHours ? `${rec.effectiveWorkingHours} hrs` : '-'}
                        </td>
                        <td className="py-3 px-3">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 text-[10px] font-bold">
                            <ShieldCheck className="w-3 h-3 text-blue-600" />
                            {rec.verificationMethod}
                          </span>
                        </td>
                        <td className="py-3 px-3">
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                            rec.status === 'Present'
                              ? 'bg-emerald-100 text-emerald-800'
                              : rec.status === 'Late'
                              ? 'bg-amber-100 text-amber-800'
                              : rec.status === 'Overtime'
                              ? 'bg-purple-100 text-purple-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {rec.status}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-right">
                          <button
                            type="button"
                            onClick={() => manualApproveAttendance(rec.id, 'Present')}
                            className="p-1 rounded-md text-emerald-700 hover:bg-emerald-50 text-[11px] font-bold cursor-pointer"
                            title="Confirm / Override Status"
                          >
                            Approve
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* SUBTAB 3: WORKPLACES */}
      {activeSubTab === 'workplaces' && (
        <div className="bg-white rounded-3xl p-6 shadow-xs border border-gray-200 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-gray-100">
            <div>
              <h3 className="text-base font-bold text-gray-900">Configured Workplaces & Facilities</h3>
              <p className="text-xs text-gray-500">
                Setup latitude, longitude, and permitted geofence radiuses for GPS check-ins.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowAddWorkplaceModal(true)}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs cursor-pointer"
            >
              + Add Workplace
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {workplaces.map((wp) => (
              <div key={wp.id} className="p-5 rounded-2xl bg-gray-50 border border-gray-200 space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="text-sm font-black text-gray-900">{wp.name}</h4>
                    <p className="text-xs text-gray-600 mt-0.5">{wp.address}, {wp.city}, {wp.state} ({wp.pincode})</p>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                    Active
                  </span>
                </div>

                <div className="text-xs text-gray-600 space-y-1">
                  <div>GPS Coordinates: <strong>{wp.lat.toFixed(4)}, {wp.lng.toFixed(4)}</strong></div>
                  <div>Allowed Geofence Radius: <strong>{wp.geofenceRadiusMeters} meters</strong></div>
                </div>

                <div className="pt-2 border-t border-gray-200 flex items-center justify-between">
                  <span className="text-[11px] font-mono text-gray-500">Code: {wp.qrSecretCode}</span>
                  <button
                    type="button"
                    onClick={() => handleGenerateQR(wp)}
                    className="px-3 py-1.5 rounded-xl bg-blue-600 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer"
                  >
                    <QrCode className="w-3.5 h-3.5" />
                    <span>View QR Standee</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SUBTAB 4: LEAVE REQUESTS */}
      {activeSubTab === 'leaves' && (
        <div className="bg-white rounded-3xl p-6 shadow-xs border border-gray-200 space-y-4">
          <div className="pb-3 border-b border-gray-100">
            <h3 className="text-base font-bold text-gray-900">Employee Leave Applications</h3>
            <p className="text-xs text-gray-500">
              Review casual, sick, and emergency leave applications submitted by registered employees.
            </p>
          </div>

          {leaveRequests.length === 0 ? (
            <div className="py-8 text-center text-gray-400 text-xs">No leave applications submitted.</div>
          ) : (
            <div className="space-y-3">
              {leaveRequests.map((l) => (
                <div key={l.id} className="p-4 rounded-2xl bg-gray-50 border border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-gray-900">{l.employeeName}</span>
                      <span className="px-2 py-0.5 rounded-md bg-blue-100 text-blue-800 text-[10px] font-bold">
                        {l.leaveType}
                      </span>
                      <span className="text-gray-500">({l.daysCount} days: {l.startDate} to {l.endDate})</span>
                    </div>
                    <p className="text-gray-600 italic">"{l.reason}"</p>
                  </div>

                  <div className="flex items-center gap-2">
                    {l.status === 'Pending' ? (
                      <>
                        <button
                          type="button"
                          onClick={() => reviewLeaveRequest(l.id, 'Approved', 'Approved by manager')}
                          className="px-3 py-1.5 rounded-xl bg-emerald-600 text-white font-bold hover:bg-emerald-700 cursor-pointer"
                        >
                          Approve
                        </button>
                        <button
                          type="button"
                          onClick={() => reviewLeaveRequest(l.id, 'Rejected', 'Operational conflict')}
                          className="px-3 py-1.5 rounded-xl bg-red-100 text-red-700 font-bold hover:bg-red-200 cursor-pointer"
                        >
                          Reject
                        </button>
                      </>
                    ) : (
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                        l.status === 'Approved' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {l.status}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* SUBTAB 5: CORRECTIONS */}
      {activeSubTab === 'corrections' && (
        <div className="bg-white rounded-3xl p-6 shadow-xs border border-gray-200 space-y-4">
          <div className="pb-3 border-b border-gray-100">
            <h3 className="text-base font-bold text-gray-900">Attendance Punch Corrections</h3>
            <p className="text-xs text-gray-500">
              Handle missing check-ins or device glitches reported by employees.
            </p>
          </div>

          {corrections.length === 0 ? (
            <div className="py-8 text-center text-gray-400 text-xs">No pending punch corrections.</div>
          ) : (
            <div className="space-y-3">
              {corrections.map((c) => (
                <div key={c.id} className="p-4 rounded-2xl bg-gray-50 border border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs">
                  <div>
                    <h4 className="font-bold text-gray-900">{c.employeeName} - Date: {c.attendanceDate}</h4>
                    <p className="text-gray-600 font-medium">Issue: <span className="text-purple-700 font-bold">{c.issueType}</span></p>
                    <p className="text-gray-500 italic mt-0.5">"{c.reason}"</p>
                  </div>

                  <div className="flex items-center gap-2">
                    {c.status === 'Pending' ? (
                      <>
                        <button
                          type="button"
                          onClick={() => reviewCorrection(c.id, 'Approved', 'Correction verified')}
                          className="px-3 py-1.5 rounded-xl bg-emerald-600 text-white font-bold hover:bg-emerald-700 cursor-pointer"
                        >
                          Approve Fix
                        </button>
                        <button
                          type="button"
                          onClick={() => reviewCorrection(c.id, 'Rejected', 'Record mismatch')}
                          className="px-3 py-1.5 rounded-xl bg-red-100 text-red-700 font-bold hover:bg-red-200 cursor-pointer"
                        >
                          Reject
                        </button>
                      </>
                    ) : (
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-gray-200 text-gray-800">
                        {c.status}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* MODAL 1: ADD EMPLOYEE */}
      {showAddEmpModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl border border-gray-100">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <h3 className="text-base font-black text-gray-900">Register Staff Member</h3>
              <button
                type="button"
                onClick={() => setShowAddEmpModal(false)}
                className="p-1 rounded-lg text-gray-400 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddEmployeeSubmit} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-gray-700 block mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  value={empForm.fullName}
                  onChange={(e) => setEmpForm({ ...empForm, fullName: e.target.value })}
                  className="w-full p-2.5 rounded-xl bg-gray-50 border border-gray-200 font-semibold"
                  placeholder="e.g. Rahul Sharma"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-gray-700 block mb-1">Email Address *</label>
                  <input
                    type="email"
                    required
                    value={empForm.email}
                    onChange={(e) => setEmpForm({ ...empForm, email: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-gray-50 border border-gray-200 font-semibold"
                    placeholder="worker@example.com"
                  />
                </div>
                <div>
                  <label className="font-bold text-gray-700 block mb-1">Employee ID *</label>
                  <input
                    type="text"
                    required
                    value={empForm.employeeIdNumber}
                    onChange={(e) => setEmpForm({ ...empForm, employeeIdNumber: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-gray-50 border border-gray-200 font-semibold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-gray-700 block mb-1">Department</label>
                  <input
                    type="text"
                    value={empForm.department}
                    onChange={(e) => setEmpForm({ ...empForm, department: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-gray-50 border border-gray-200 font-semibold"
                  />
                </div>
                <div>
                  <label className="font-bold text-gray-700 block mb-1">Designation</label>
                  <input
                    type="text"
                    value={empForm.designation}
                    onChange={(e) => setEmpForm({ ...empForm, designation: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-gray-50 border border-gray-200 font-semibold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-gray-700 block mb-1">Assign Workplace</label>
                  <select
                    value={empForm.workplaceId}
                    onChange={(e) => setEmpForm({ ...empForm, workplaceId: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-gray-50 border border-gray-200 font-semibold"
                  >
                    <option value="">Select Facility</option>
                    {workplaces.map((w) => (
                      <option key={w.id} value={w.id}>{w.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="font-bold text-gray-700 block mb-1">Assign Shift</label>
                  <select
                    value={empForm.shiftId}
                    onChange={(e) => setEmpForm({ ...empForm, shiftId: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-gray-50 border border-gray-200 font-semibold"
                  >
                    <option value="">Select Shift</option>
                    {shifts.map((s) => (
                      <option key={s.id} value={s.id}>{s.name} ({s.startTime}-{s.endTime})</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="pt-3 border-t border-gray-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddEmpModal(false)}
                  className="px-4 py-2 text-gray-600 font-bold hover:bg-gray-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-extrabold rounded-xl shadow-md cursor-pointer"
                >
                  Confirm & Link Employee
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: ADD WORKPLACE */}
      {showAddWorkplaceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <h3 className="text-base font-black text-gray-900">Add Workplace & Geofence</h3>
            <form onSubmit={handleAddWorkplaceSubmit} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-gray-700 block mb-1">Facility Name *</label>
                <input
                  type="text"
                  required
                  value={workplaceForm.name}
                  onChange={(e) => setWorkplaceForm({ ...workplaceForm, name: e.target.value })}
                  className="w-full p-2.5 rounded-xl bg-gray-50 border border-gray-200 font-semibold"
                />
              </div>

              <div>
                <label className="font-bold text-gray-700 block mb-1">Address *</label>
                <input
                  type="text"
                  required
                  value={workplaceForm.address}
                  onChange={(e) => setWorkplaceForm({ ...workplaceForm, address: e.target.value })}
                  className="w-full p-2.5 rounded-xl bg-gray-50 border border-gray-200 font-semibold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-gray-700 block mb-1">City</label>
                  <input
                    type="text"
                    value={workplaceForm.city}
                    onChange={(e) => setWorkplaceForm({ ...workplaceForm, city: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-gray-50 border border-gray-200 font-semibold"
                  />
                </div>
                <div>
                  <label className="font-bold text-gray-700 block mb-1">State</label>
                  <input
                    type="text"
                    value={workplaceForm.state}
                    onChange={(e) => setWorkplaceForm({ ...workplaceForm, state: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-gray-50 border border-gray-200 font-semibold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-gray-700 block mb-1">Latitude</label>
                  <input
                    type="number"
                    step="any"
                    value={workplaceForm.lat}
                    onChange={(e) => setWorkplaceForm({ ...workplaceForm, lat: Number(e.target.value) })}
                    className="w-full p-2.5 rounded-xl bg-gray-50 border border-gray-200 font-semibold"
                  />
                </div>
                <div>
                  <label className="font-bold text-gray-700 block mb-1">Longitude</label>
                  <input
                    type="number"
                    step="any"
                    value={workplaceForm.lng}
                    onChange={(e) => setWorkplaceForm({ ...workplaceForm, lng: Number(e.target.value) })}
                    className="w-full p-2.5 rounded-xl bg-gray-50 border border-gray-200 font-semibold"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-gray-700 block mb-1">
                  Allowed Geofence Radius: {workplaceForm.geofenceRadiusMeters} meters
                </label>
                <input
                  type="range"
                  min="50"
                  max="1000"
                  step="25"
                  value={workplaceForm.geofenceRadiusMeters}
                  onChange={(e) => setWorkplaceForm({ ...workplaceForm, geofenceRadiusMeters: Number(e.target.value) })}
                  className="w-full accent-blue-600"
                />
              </div>

              <div className="pt-3 border-t border-gray-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddWorkplaceModal(false)}
                  className="px-4 py-2 text-gray-600 font-bold hover:bg-gray-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-extrabold rounded-xl shadow-md cursor-pointer"
                >
                  Save Workplace
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: QR CODE DISPLAY STANDEE */}
      {qrModalWorkplace && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 text-center space-y-4 shadow-2xl border border-gray-100">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-wider bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">
                Workplace Attendance QR
              </span>
              <button
                type="button"
                onClick={() => setQrModalWorkplace(null)}
                className="p-1 rounded-lg text-gray-400 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div>
              <h3 className="text-base font-black text-gray-900">{qrModalWorkplace.name}</h3>
              <p className="text-xs text-gray-500 mt-0.5">{qrModalWorkplace.address}</p>
            </div>

            {/* QR Code image */}
            <div className="p-4 bg-gray-50 rounded-2xl border border-gray-200 inline-block shadow-inner">
              <img src={qrCodeDataUrl} alt="QR Code" className="w-56 h-56 mx-auto rounded-xl" />
            </div>

            <div className="text-xs text-gray-600 space-y-1">
              <p className="font-semibold">Employees scan this code via the JOBSETU Worker App to check in or check out.</p>
              <p className="text-[11px] font-mono text-gray-400">Secret Token: {qrModalWorkplace.qrSecretCode}</p>
            </div>

            <button
              type="button"
              onClick={() => window.print()}
              className="w-full py-2.5 rounded-xl bg-slate-900 text-white font-bold text-xs flex items-center justify-center gap-2 cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Print QR Standee Sheet</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
