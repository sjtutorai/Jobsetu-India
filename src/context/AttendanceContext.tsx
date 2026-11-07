import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from './AuthContext';
import {
  EmployerWorkplace,
  WorkShift,
  EmployeeRecord,
  AttendanceRecord,
  LeaveRequest,
  AttendanceCorrection,
  AttendanceVerificationType,
  AttendanceRecordStatus
} from '../types';
import { calculateDistance } from '../lib/geo';

interface AttendanceContextType {
  // Workplaces
  workplaces: EmployerWorkplace[];
  createWorkplace: (data: Omit<EmployerWorkplace, 'id' | 'employerId' | 'createdAt'>) => Promise<string>;
  updateWorkplace: (id: string, data: Partial<EmployerWorkplace>) => Promise<void>;
  
  // Shifts
  shifts: WorkShift[];
  createShift: (data: Omit<WorkShift, 'id' | 'employerId' | 'createdAt'>) => Promise<string>;
  updateShift: (id: string, data: Partial<WorkShift>) => Promise<void>;
  
  // Employees
  employees: EmployeeRecord[];
  myEmploymentRecords: EmployeeRecord[];
  addEmployee: (data: Omit<EmployeeRecord, 'id' | 'employerId' | 'createdAt' | 'updatedAt'>) => Promise<string>;
  updateEmployee: (id: string, data: Partial<EmployeeRecord>) => Promise<void>;
  confirmEmploymentInvitation: (employeeRecordId: string) => Promise<void>;

  // Attendance Records
  attendanceRecords: AttendanceRecord[];
  myTodayAttendance: AttendanceRecord | null;
  myAttendanceHistory: AttendanceRecord[];
  recordCheckIn: (params: {
    workplaceId: string;
    shiftId?: string;
    verificationMethod: AttendanceVerificationType;
    lat?: number;
    lng?: number;
    qrToken?: string;
  }) => Promise<{ success: boolean; message: string }>;
  recordCheckOut: (params: {
    lat?: number;
    lng?: number;
  }) => Promise<{ success: boolean; message: string; durationHours?: number }>;
  manualApproveAttendance: (recordId: string, status: AttendanceRecordStatus) => Promise<void>;

  // Leave Requests
  leaveRequests: LeaveRequest[];
  myLeaveRequests: LeaveRequest[];
  submitLeaveRequest: (data: Omit<LeaveRequest, 'id' | 'workerUid' | 'employeeName' | 'status' | 'createdAt' | 'updatedAt'>) => Promise<string>;
  reviewLeaveRequest: (leaveId: string, status: 'Approved' | 'Rejected', approverNote?: string) => Promise<void>;

  // Attendance Corrections
  corrections: AttendanceCorrection[];
  myCorrections: AttendanceCorrection[];
  submitCorrection: (data: Omit<AttendanceCorrection, 'id' | 'workerUid' | 'employeeName' | 'status' | 'createdAt' | 'updatedAt'>) => Promise<string>;
  reviewCorrection: (correctionId: string, status: 'Approved' | 'Rejected', response?: string) => Promise<void>;

  loadingAttendance: boolean;
}

const AttendanceContext = createContext<AttendanceContextType | undefined>(undefined);

export const AttendanceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser, userProfile, workerProfile, employerProfile } = useAuth();

  const [workplaces, setWorkplaces] = useState<EmployerWorkplace[]>([]);
  const [shifts, setShifts] = useState<WorkShift[]>([]);
  const [employees, setEmployees] = useState<EmployeeRecord[]>([]);
  const [myEmploymentRecords, setMyEmploymentRecords] = useState<EmployeeRecord[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [myAttendanceHistory, setMyAttendanceHistory] = useState<AttendanceRecord[]>([]);
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [myLeaveRequests, setMyLeaveRequests] = useState<LeaveRequest[]>([]);
  const [corrections, setCorrections] = useState<AttendanceCorrection[]>([]);
  const [myCorrections, setMyCorrections] = useState<AttendanceCorrection[]>([]);
  const [loadingAttendance, setLoadingAttendance] = useState<boolean>(true);

  const todayStr = new Date().toISOString().split('T')[0];

  // 1. Subscribe to Workplaces (if employer or worker)
  useEffect(() => {
    if (!currentUser) {
      setWorkplaces([]);
      return;
    }

    const workplacesRef = collection(db, 'employer_workplaces');
    let q = query(workplacesRef);
    if (employerProfile) {
      q = query(workplacesRef, where('employerId', '==', currentUser.uid));
    }

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const list: EmployerWorkplace[] = [];
        snapshot.forEach((doc) => {
          list.push({ id: doc.id, ...(doc.data() as any) });
        });
        setWorkplaces(list);
      },
      (err) => console.warn('Workplaces snapshot error:', err)
    );

    return () => unsubscribe();
  }, [currentUser, employerProfile]);

  // 2. Subscribe to Shifts
  useEffect(() => {
    if (!currentUser) {
      setShifts([]);
      return;
    }

    const shiftsRef = collection(db, 'shifts');
    let q = query(shiftsRef);
    if (employerProfile) {
      q = query(shiftsRef, where('employerId', '==', currentUser.uid));
    }

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const list: WorkShift[] = [];
        snapshot.forEach((doc) => {
          list.push({ id: doc.id, ...(doc.data() as any) });
        });
        setShifts(list);
      },
      (err) => console.warn('Shifts snapshot error:', err)
    );

    return () => unsubscribe();
  }, [currentUser, employerProfile]);

  // 3. Subscribe to Employee Records (Employer view & Worker linked view)
  useEffect(() => {
    if (!currentUser) {
      setEmployees([]);
      setMyEmploymentRecords([]);
      return;
    }

    const empRef = collection(db, 'employee_records');

    // Employer view
    const unsubEmployer = onSnapshot(
      query(empRef, where('employerId', '==', currentUser.uid)),
      (snapshot) => {
        const list: EmployeeRecord[] = [];
        snapshot.forEach((doc) => {
          list.push({ id: doc.id, ...(doc.data() as any) });
        });
        setEmployees(list);
      },
      (err) => console.warn('Employer employee records error:', err)
    );

    // Worker linked view (by workerUid or email)
    const unsubWorker = onSnapshot(
      query(empRef, where('workerUid', '==', currentUser.uid)),
      (snapshot) => {
        const list: EmployeeRecord[] = [];
        snapshot.forEach((doc) => {
          list.push({ id: doc.id, ...(doc.data() as any) });
        });
        setMyEmploymentRecords(list);
      },
      (err) => console.warn('Worker employee records error:', err)
    );

    return () => {
      unsubEmployer();
      unsubWorker();
    };
  }, [currentUser]);

  // 4. Subscribe to Attendance Records
  useEffect(() => {
    if (!currentUser) {
      setAttendanceRecords([]);
      setMyAttendanceHistory([]);
      setLoadingAttendance(false);
      return;
    }

    const attRef = collection(db, 'attendance_records');

    // Employer view
    const unsubEmployer = onSnapshot(
      query(attRef, where('employerId', '==', currentUser.uid)),
      (snapshot) => {
        const list: AttendanceRecord[] = [];
        snapshot.forEach((doc) => {
          list.push({ id: doc.id, ...(doc.data() as any) });
        });
        setAttendanceRecords(list);
      },
      (err) => console.warn('Employer attendance snapshot error:', err)
    );

    // Worker view
    const unsubWorker = onSnapshot(
      query(attRef, where('workerUid', '==', currentUser.uid)),
      (snapshot) => {
        const list: AttendanceRecord[] = [];
        snapshot.forEach((doc) => {
          list.push({ id: doc.id, ...(doc.data() as any) });
        });
        setMyAttendanceHistory(list);
        setLoadingAttendance(false);
      },
      (err) => {
        console.warn('Worker attendance snapshot error:', err);
        setLoadingAttendance(false);
      }
    );

    return () => {
      unsubEmployer();
      unsubWorker();
    };
  }, [currentUser]);

  // 5. Subscribe to Leave Requests
  useEffect(() => {
    if (!currentUser) {
      setLeaveRequests([]);
      setMyLeaveRequests([]);
      return;
    }

    const leaveRef = collection(db, 'leave_requests');

    const unsubEmployer = onSnapshot(
      query(leaveRef, where('employerId', '==', currentUser.uid)),
      (snapshot) => {
        const list: LeaveRequest[] = [];
        snapshot.forEach((doc) => {
          list.push({ id: doc.id, ...(doc.data() as any) });
        });
        setLeaveRequests(list);
      },
      (err) => console.warn('Employer leave requests error:', err)
    );

    const unsubWorker = onSnapshot(
      query(leaveRef, where('workerUid', '==', currentUser.uid)),
      (snapshot) => {
        const list: LeaveRequest[] = [];
        snapshot.forEach((doc) => {
          list.push({ id: doc.id, ...(doc.data() as any) });
        });
        setMyLeaveRequests(list);
      },
      (err) => console.warn('Worker leave requests error:', err)
    );

    return () => {
      unsubEmployer();
      unsubWorker();
    };
  }, [currentUser]);

  // 6. Subscribe to Attendance Corrections
  useEffect(() => {
    if (!currentUser) {
      setCorrections([]);
      setMyCorrections([]);
      return;
    }

    const corrRef = collection(db, 'attendance_corrections');

    const unsubEmployer = onSnapshot(
      query(corrRef, where('employerId', '==', currentUser.uid)),
      (snapshot) => {
        const list: AttendanceCorrection[] = [];
        snapshot.forEach((doc) => {
          list.push({ id: doc.id, ...(doc.data() as any) });
        });
        setCorrections(list);
      },
      (err) => console.warn('Employer corrections error:', err)
    );

    const unsubWorker = onSnapshot(
      query(corrRef, where('workerUid', '==', currentUser.uid)),
      (snapshot) => {
        const list: AttendanceCorrection[] = [];
        snapshot.forEach((doc) => {
          list.push({ id: doc.id, ...(doc.data() as any) });
        });
        setMyCorrections(list);
      },
      (err) => console.warn('Worker corrections error:', err)
    );

    return () => {
      unsubEmployer();
      unsubWorker();
    };
  }, [currentUser]);

  // Derived: Today's active attendance for current worker
  const myTodayAttendance = myAttendanceHistory.find(
    (a) => a.dateString === todayStr
  ) || null;

  // Actions: Workplaces
  const createWorkplace = async (data: Omit<EmployerWorkplace, 'id' | 'employerId' | 'createdAt'>): Promise<string> => {
    if (!currentUser) throw new Error('Authentication required');
    const docRef = await addDoc(collection(db, 'employer_workplaces'), {
      ...data,
      employerId: currentUser.uid,
      createdAt: serverTimestamp()
    });
    return docRef.id;
  };

  const updateWorkplace = async (id: string, data: Partial<EmployerWorkplace>): Promise<void> => {
    await updateDoc(doc(db, 'employer_workplaces', id), {
      ...data,
      updatedAt: serverTimestamp()
    });
  };

  // Actions: Shifts
  const createShift = async (data: Omit<WorkShift, 'id' | 'employerId' | 'createdAt'>): Promise<string> => {
    if (!currentUser) throw new Error('Authentication required');
    const docRef = await addDoc(collection(db, 'shifts'), {
      ...data,
      employerId: currentUser.uid,
      createdAt: serverTimestamp()
    });
    return docRef.id;
  };

  const updateShift = async (id: string, data: Partial<WorkShift>): Promise<void> => {
    await updateDoc(doc(db, 'shifts', id), {
      ...data,
      updatedAt: serverTimestamp()
    });
  };

  // Actions: Employees
  const addEmployee = async (data: Omit<EmployeeRecord, 'id' | 'employerId' | 'createdAt' | 'updatedAt'>): Promise<string> => {
    if (!currentUser) throw new Error('Authentication required');
    const docRef = await addDoc(collection(db, 'employee_records'), {
      ...data,
      employerId: currentUser.uid,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    return docRef.id;
  };

  const updateEmployee = async (id: string, data: Partial<EmployeeRecord>): Promise<void> => {
    await updateDoc(doc(db, 'employee_records', id), {
      ...data,
      updatedAt: serverTimestamp()
    });
  };

  const confirmEmploymentInvitation = async (employeeRecordId: string): Promise<void> => {
    if (!currentUser) throw new Error('Authentication required');
    await updateDoc(doc(db, 'employee_records', employeeRecordId), {
      workerUid: currentUser.uid,
      status: 'Active',
      updatedAt: serverTimestamp()
    });
  };

  // Actions: Check In
  const recordCheckIn = async ({
    workplaceId,
    shiftId,
    verificationMethod,
    lat,
    lng,
    qrToken
  }: {
    workplaceId: string;
    shiftId?: string;
    verificationMethod: AttendanceVerificationType;
    lat?: number;
    lng?: number;
    qrToken?: string;
  }): Promise<{ success: boolean; message: string }> => {
    if (!currentUser) throw new Error('Must be logged in to record attendance');

    // Prevent duplicate check-in today
    if (myTodayAttendance && myTodayAttendance.checkInTime) {
      return { success: false, message: 'You have already checked in for today.' };
    }

    // Lookup workplace
    const workplaceSnap = await getDoc(doc(db, 'employer_workplaces', workplaceId));
    if (!workplaceSnap.exists()) {
      return { success: false, message: 'Workplace not found.' };
    }
    const workplaceData = workplaceSnap.data() as EmployerWorkplace;

    let checkInDistanceMeters = 0;
    let isGeofenceValid = true;

    // GPS Geofence verification
    if (verificationMethod === 'GPS Geofence') {
      if (lat === undefined || lng === undefined) {
        return { success: false, message: 'Location coordinates required for GPS check-in.' };
      }
      const distKm = calculateDistance(lat, lng, workplaceData.lat, workplaceData.lng) || 0;
      checkInDistanceMeters = Math.round(distKm * 1000);
      const allowedRadius = workplaceData.geofenceRadiusMeters || 200;

      if (checkInDistanceMeters > allowedRadius) {
        return {
          success: false,
          message: `You are ${checkInDistanceMeters}m away from ${workplaceData.name}. Allowed radius is ${allowedRadius}m.`
        };
      }
    }

    // QR Code verification
    if (verificationMethod === 'Workplace QR Code') {
      if (!qrToken || qrToken !== workplaceData.qrSecretCode) {
        return { success: false, message: 'Invalid or expired workplace QR code.' };
      }
    }

    // Determine shift & late status
    let selectedShift: WorkShift | null = null;
    if (shiftId) {
      const shiftSnap = await getDoc(doc(db, 'shifts', shiftId));
      if (shiftSnap.exists()) selectedShift = shiftSnap.data() as WorkShift;
    }

    const now = new Date();
    const nowTimeStr = now.toTimeString().slice(0, 5); // "HH:MM"
    let isLate = false;
    let status: AttendanceRecordStatus = 'Present';

    if (selectedShift && selectedShift.startTime) {
      const [startHour, startMin] = selectedShift.startTime.split(':').map(Number);
      const [nowHour, nowMin] = nowTimeStr.split(':').map(Number);
      const startMinutes = startHour * 60 + startMin + (selectedShift.graceMinutes || 15);
      const currentMinutes = nowHour * 60 + nowMin;

      if (currentMinutes > startMinutes) {
        isLate = true;
        status = 'Late';
      }
    }

    // Lookup linked employee record
    const linkedRecord = myEmploymentRecords.find((e) => e.workplaceId === workplaceId);

    const newAttendanceDoc: Omit<AttendanceRecord, 'id'> = {
      employerId: workplaceData.employerId,
      workerUid: currentUser.uid,
      employeeRecordId: linkedRecord?.id,
      employeeName: workerProfile?.fullName || userProfile?.name || 'Worker',
      employeeIdNumber: linkedRecord?.employeeIdNumber,
      workplaceId,
      workplaceName: workplaceData.name,
      shiftId: selectedShift?.id || 'standard',
      shiftName: selectedShift?.name || 'Standard Shift',
      dateString: todayStr,
      checkInTime: now.toISOString(),
      checkInLat: lat,
      checkInLng: lng,
      checkInDistanceMeters,
      verificationMethod,
      isLate,
      status,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    await addDoc(collection(db, 'attendance_records'), newAttendanceDoc);

    return {
      success: true,
      message: isLate
        ? `Check-in recorded at ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} (Late arrival noted).`
        : `Check-in confirmed successfully at ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}!`
    };
  };

  // Actions: Check Out
  const recordCheckOut = async ({
    lat,
    lng
  }: {
    lat?: number;
    lng?: number;
  }): Promise<{ success: boolean; message: string; durationHours?: number }> => {
    if (!currentUser) throw new Error('Must be logged in');

    if (!myTodayAttendance) {
      return { success: false, message: 'No check-in record found for today.' };
    }
    if (myTodayAttendance.checkOutTime) {
      return { success: false, message: 'You have already checked out for today.' };
    }

    const checkInDate = new Date(myTodayAttendance.checkInTime);
    const now = new Date();
    const diffMs = now.getTime() - checkInDate.getTime();
    const totalWorkingMinutes = Math.max(1, Math.round(diffMs / (1000 * 60)));
    const durationHours = Number((totalWorkingMinutes / 60).toFixed(2));

    let finalStatus: AttendanceRecordStatus = myTodayAttendance.status;
    let isEarlyDeparture = false;

    // If worked less than 4 hours, mark half day
    if (totalWorkingMinutes < 240) {
      finalStatus = 'Half Day';
      isEarlyDeparture = true;
    } else if (totalWorkingMinutes > 540) {
      // Over 9 hours
      finalStatus = 'Overtime';
    }

    await updateDoc(doc(db, 'attendance_records', myTodayAttendance.id), {
      checkOutTime: now.toISOString(),
      checkOutLat: lat,
      checkOutLng: lng,
      totalWorkingMinutes,
      effectiveWorkingHours: durationHours,
      status: finalStatus,
      isEarlyDeparture,
      updatedAt: serverTimestamp()
    });

    return {
      success: true,
      message: `Check-out recorded. Total shift duration: ${durationHours} hours.`,
      durationHours
    };
  };

  // Manual Employer Approval
  const manualApproveAttendance = async (
    recordId: string,
    status: AttendanceRecordStatus
  ): Promise<void> => {
    await updateDoc(doc(db, 'attendance_records', recordId), {
      status,
      employerApproved: true,
      updatedAt: serverTimestamp()
    });
  };

  // Leave Requests
  const submitLeaveRequest = async (
    data: Omit<LeaveRequest, 'id' | 'workerUid' | 'employeeName' | 'status' | 'createdAt' | 'updatedAt'>
  ): Promise<string> => {
    if (!currentUser) throw new Error('Authentication required');
    const docRef = await addDoc(collection(db, 'leave_requests'), {
      ...data,
      workerUid: currentUser.uid,
      employeeName: workerProfile?.fullName || userProfile?.name || 'Worker',
      status: 'Pending',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    return docRef.id;
  };

  const reviewLeaveRequest = async (
    leaveId: string,
    status: 'Approved' | 'Rejected',
    approverNote?: string
  ): Promise<void> => {
    await updateDoc(doc(db, 'leave_requests', leaveId), {
      status,
      approverNote: approverNote || '',
      updatedAt: serverTimestamp()
    });
  };

  // Corrections
  const submitCorrection = async (
    data: Omit<AttendanceCorrection, 'id' | 'workerUid' | 'employeeName' | 'status' | 'createdAt' | 'updatedAt'>
  ): Promise<string> => {
    if (!currentUser) throw new Error('Authentication required');
    const docRef = await addDoc(collection(db, 'attendance_corrections'), {
      ...data,
      workerUid: currentUser.uid,
      employeeName: workerProfile?.fullName || userProfile?.name || 'Worker',
      status: 'Pending',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    return docRef.id;
  };

  const reviewCorrection = async (
    correctionId: string,
    status: 'Approved' | 'Rejected',
    response?: string
  ): Promise<void> => {
    await updateDoc(doc(db, 'attendance_corrections', correctionId), {
      status,
      employerResponse: response || '',
      updatedAt: serverTimestamp()
    });
  };

  return (
    <AttendanceContext.Provider
      value={{
        workplaces,
        createWorkplace,
        updateWorkplace,
        shifts,
        createShift,
        updateShift,
        employees,
        myEmploymentRecords,
        addEmployee,
        updateEmployee,
        confirmEmploymentInvitation,
        attendanceRecords,
        myTodayAttendance,
        myAttendanceHistory,
        recordCheckIn,
        recordCheckOut,
        manualApproveAttendance,
        leaveRequests,
        myLeaveRequests,
        submitLeaveRequest,
        reviewLeaveRequest,
        corrections,
        myCorrections,
        submitCorrection,
        reviewCorrection,
        loadingAttendance
      }}
    >
      {children}
    </AttendanceContext.Provider>
  );
};

export const useAttendance = () => {
  const context = useContext(AttendanceContext);
  if (!context) {
    throw new Error('useAttendance must be used within an AttendanceProvider');
  }
  return context;
};
