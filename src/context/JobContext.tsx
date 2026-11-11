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
  serverTimestamp,
  increment
} from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType } from '../lib/firebase';
import { useAuth } from './AuthContext';
import {
  Job,
  Application,
  ApplicationStatus,
  InterviewDetails,
  Conversation,
  Message,
  Notification,
  SavedJob,
  SavedCandidate,
  Report,
  WorkerProfile,
  HiringRequest,
  SavedCompany
} from '../types';
import { calculateDistance } from '../lib/geo';

interface JobContextType {
  jobs: Job[];
  myJobs: Job[];
  myApplications: Application[];
  employerApplications: Application[];
  savedJobIds: string[];
  savedCandidateIds: string[];
  savedCompanyIds: string[];
  hiringRequests: HiringRequest[];
  notifications: Notification[];
  unreadNotificationCount: number;
  unreadNotificationsCount: number;
  conversations: Conversation[];
  activeConversation: Conversation | null;
  activeConversationId: string | null;
  setActiveConversationId: (id: string | null) => void;
  activeMessages: Message[];
  loadingJobs: boolean;
  createJob: (jobData: Omit<Job, 'id' | 'employerId' | 'employerName' | 'createdAt' | 'updatedAt' | 'applicationsCount'>) => Promise<string>;
  updateJob: (jobId: string, jobData: Partial<Job>) => Promise<void>;
  deleteJob: (jobId: string) => Promise<void>;
  changeJobStatus: (jobId: string, status: Job['status']) => Promise<void>;
  applyToJob: (job: Job, candidateNote?: string, resumeUrl?: string, resumeName?: string) => Promise<void>;
  updateApplicationStatus: (applicationId: string, newStatus: ApplicationStatus, interviewDetails?: InterviewDetails) => Promise<void>;
  toggleSaveJob: (jobId: string) => Promise<void>;
  toggleSaveCandidate: (workerId: string) => Promise<void>;
  toggleSaveCompany: (companyId: string, companyName: string, companyLogo: string, industry: string) => Promise<void>;
  sendHiringRequest: (data: Omit<HiringRequest, 'id' | 'employerId' | 'employerName' | 'status' | 'createdAt' | 'updatedAt'>) => Promise<string>;
  updateHiringRequestStatus: (requestId: string, status: HiringRequest['status'], responseNote?: string) => Promise<void>;
  openConversation: (conv: Conversation) => void;
  startConversation: (targetUserId: string, targetName: string, targetPhoto?: string, targetRole?: 'worker' | 'employer', initialMsg?: string) => Promise<string>;
  sendMessage: (conversationId: string, receiverId: string, text: string) => Promise<void>;
  toggleBlockConversation: (conversationId: string, block: boolean) => Promise<void>;
  uploadWorkerResume: (resumeUrl: string, resumeName: string) => Promise<void>;
  markNotificationAsRead: (notificationId: string) => Promise<void>;
  markAllNotificationsAsRead: () => Promise<void>;
  reportItem: (targetType: 'job' | 'user' | 'conversation', targetId: string, reason: string) => Promise<void>;
  seedInitialJobsIfEmpty: () => Promise<void>;
}

const JobContext = createContext<JobContextType | undefined>(undefined);

export const JobProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser, userProfile, workerProfile, employerProfile } = useAuth();

  const [jobs, setJobs] = useState<Job[]>([]);
  const [myJobs, setMyJobs] = useState<Job[]>([]);
  const [myApplications, setMyApplications] = useState<Application[]>([]);
  const [employerApplications, setEmployerApplications] = useState<Application[]>([]);
  const [savedJobIds, setSavedJobIds] = useState<string[]>([]);
  const [savedCandidateIds, setSavedCandidateIds] = useState<string[]>([]);
  const [savedCompanyIds, setSavedCompanyIds] = useState<string[]>([]);
  const [hiringRequests, setHiringRequests] = useState<HiringRequest[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversation, setActiveConversation] = useState<Conversation | null>(null);
  const [activeConversationId, setActiveConversationIdState] = useState<string | null>(null);
  const setActiveConversationId = (id: string | null) => {
    setActiveConversationIdState(id);
    if (!id) {
      setActiveConversation(null);
    } else {
      const match = conversations.find(c => c.id === id);
      if (match) setActiveConversation(match);
    }
  };
  const [activeMessages, setActiveMessages] = useState<Message[]>([]);
  const [loadingJobs, setLoadingJobs] = useState<boolean>(true);

  // 1. Subscribe to public active jobs
  useEffect(() => {
    const jobsRef = collection(db, 'jobs');
    const q = query(jobsRef, where('status', '==', 'active'));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const jobsList: Job[] = [];
        snapshot.forEach((doc) => {
          jobsList.push({ id: doc.id, ...(doc.data() as any) });
        });
        setJobs(jobsList);
        setLoadingJobs(false);
      },
      (error) => {
        console.warn('Jobs snapshot notice:', error);
        setLoadingJobs(false);
      }
    );

    return () => unsubscribe();
  }, []);

  // 2. Subscribe to current user's own jobs (if employer)
  useEffect(() => {
    if (!currentUser) {
      setMyJobs([]);
      return;
    }

    const jobsRef = collection(db, 'jobs');
    const q = query(jobsRef, where('employerId', '==', currentUser.uid));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const list: Job[] = [];
        snapshot.forEach((doc) => {
          list.push({ id: doc.id, ...(doc.data() as any) });
        });
        setMyJobs(list);
      },
      (error) => {
        console.warn('MyJobs snapshot notice:', error);
      }
    );

    return () => unsubscribe();
  }, [currentUser]);

  // 3. Subscribe to worker's applications
  useEffect(() => {
    if (!currentUser) {
      setMyApplications([]);
      return;
    }

    const appRef = collection(db, 'applications');
    const q = query(appRef, where('workerId', '==', currentUser.uid));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const list: Application[] = [];
        snapshot.forEach((doc) => {
          list.push({ id: doc.id, ...(doc.data() as any) });
        });
        // Sort newest first
        list.sort((a, b) => (b.appliedAt?.seconds || 0) - (a.appliedAt?.seconds || 0));
        setMyApplications(list);
      },
      (error) => {
        console.warn('MyApplications snapshot notice:', error);
      }
    );

    return () => unsubscribe();
  }, [currentUser]);

  // 4. Subscribe to employer's received applications
  useEffect(() => {
    if (!currentUser) {
      setEmployerApplications([]);
      return;
    }

    const appRef = collection(db, 'applications');
    const q = query(appRef, where('employerId', '==', currentUser.uid));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const list: Application[] = [];
        snapshot.forEach((doc) => {
          list.push({ id: doc.id, ...(doc.data() as any) });
        });
        list.sort((a, b) => (b.appliedAt?.seconds || 0) - (a.appliedAt?.seconds || 0));
        setEmployerApplications(list);
      },
      (error) => {
        console.warn('EmployerApplications snapshot notice:', error);
      }
    );

    return () => unsubscribe();
  }, [currentUser]);

  // 5. Subscribe to saved jobs and saved candidates
  useEffect(() => {
    if (!currentUser) {
      setSavedJobIds([]);
      setSavedCandidateIds([]);
      return;
    }

    const sjRef = collection(db, 'savedJobs');
    const qSj = query(sjRef, where('userId', '==', currentUser.uid));
    const unsubSj = onSnapshot(
      qSj,
      (snapshot) => {
        const ids: string[] = [];
        snapshot.forEach(doc => ids.push(doc.data().jobId));
        setSavedJobIds(ids);
      },
      (error) => {
        console.warn('SavedJobs snapshot notice:', error);
      }
    );

    const scRef = collection(db, 'savedCandidates');
    const qSc = query(scRef, where('employerId', '==', currentUser.uid));
    const unsubSc = onSnapshot(
      qSc,
      (snapshot) => {
        const ids: string[] = [];
        snapshot.forEach(doc => ids.push(doc.data().workerId));
        setSavedCandidateIds(ids);
      },
      (error) => {
        console.warn('SavedCandidates snapshot notice:', error);
      }
    );

    return () => {
      unsubSj();
      unsubSc();
    };
  }, [currentUser]);

  // 6. Subscribe to user's notifications
  useEffect(() => {
    if (!currentUser) {
      setNotifications([]);
      return;
    }

    const notifRef = collection(db, 'notifications');
    const q = query(notifRef, where('recipientId', '==', currentUser.uid));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const list: Notification[] = [];
        snapshot.forEach((doc) => {
          list.push({ id: doc.id, ...(doc.data() as any) });
        });
        list.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
        setNotifications(list);
      },
      (error) => {
        console.warn('Notifications snapshot notice:', error);
      }
    );

    return () => unsubscribe();
  }, [currentUser]);

  // 7. Subscribe to conversations
  useEffect(() => {
    if (!currentUser) {
      setConversations([]);
      return;
    }

    const convRef = collection(db, 'conversations');
    const q = query(convRef, where('participants', 'array-contains', currentUser.uid));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const list: Conversation[] = [];
        snapshot.forEach((doc) => {
          list.push({ id: doc.id, ...(doc.data() as any) });
        });
        list.sort((a, b) => (b.updatedAt?.seconds || 0) - (a.updatedAt?.seconds || 0));
        setConversations(list);
      },
      (error) => {
        console.warn('Conversations snapshot notice:', error);
      }
    );

    return () => unsubscribe();
  }, [currentUser]);

  // 8. Subscribe to active conversation messages
  useEffect(() => {
    if (!activeConversation) {
      setActiveMessages([]);
      return;
    }

    const msgRef = collection(db, 'messages');
    const q = query(msgRef, where('conversationId', '==', activeConversation.id));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const list: Message[] = [];
        snapshot.forEach((doc) => {
          list.push({ id: doc.id, ...(doc.data() as any) });
        });
        list.sort((a, b) => (a.createdAt?.seconds || 0) - (b.createdAt?.seconds || 0));
        setActiveMessages(list);
      },
      (error) => {
        console.warn('ActiveMessages snapshot notice:', error);
      }
    );

    return () => unsubscribe();
  }, [activeConversation]);

  // ================= OPERATIONS =================

  const createJob = async (
    jobData: Omit<Job, 'id' | 'employerId' | 'employerName' | 'createdAt' | 'updatedAt' | 'applicationsCount'>
  ): Promise<string> => {
    if (!currentUser) throw new Error('Must be signed in to post a job');
    const jobsRef = collection(db, 'jobs');
    const newDocRef = doc(jobsRef);

    const payload: Job = {
      ...jobData,
      id: newDocRef.id,
      employerId: currentUser.uid,
      employerName: employerProfile?.businessName || userProfile?.name || 'Enterprise Employer',
      employerLogo: employerProfile?.businessLogo || userProfile?.profilePhoto || '',
      isEmployerVerified: employerProfile?.verificationStatus === 'Verified',
      applicationsCount: 0,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    await setDoc(newDocRef, payload).catch(err => {
      handleFirestoreError(err, OperationType.CREATE, `jobs/${newDocRef.id}`);
    });

    return newDocRef.id;
  };

  const updateJob = async (jobId: string, jobData: Partial<Job>) => {
    const jobRef = doc(db, 'jobs', jobId);
    await updateDoc(jobRef, {
      ...jobData,
      updatedAt: serverTimestamp()
    }).catch(err => {
      handleFirestoreError(err, OperationType.UPDATE, `jobs/${jobId}`);
    });
  };

  const deleteJob = async (jobId: string) => {
    const jobRef = doc(db, 'jobs', jobId);
    await deleteDoc(jobRef).catch(err => {
      handleFirestoreError(err, OperationType.DELETE, `jobs/${jobId}`);
    });
  };

  const changeJobStatus = async (jobId: string, status: Job['status']) => {
    await updateJob(jobId, { status });
  };

  const applyToJob = async (job: Job, candidateNote?: string, customResumeUrl?: string, customResumeName?: string) => {
    if (!currentUser) throw new Error('You must be signed in to apply for a job.');

    // Prevent duplicate applications
    const existing = myApplications.find(a => a.jobId === job.id && a.status !== 'Withdrawn');
    if (existing) {
      throw new Error('You have already applied for this job.');
    }

    const appRef = collection(db, 'applications');
    const newDocRef = doc(appRef);

    const applicationPayload: Application = {
      id: newDocRef.id,
      jobId: job.id,
      jobTitle: job.title,
      employerId: job.employerId,
      employerName: job.employerName,
      workerId: currentUser.uid,
      workerName: workerProfile?.fullName || userProfile?.name || 'Applicant',
      workerPhoto: workerProfile?.profilePhoto || userProfile?.profilePhoto || '',
      workerSkills: workerProfile?.skills || [],
      workerExperience: workerProfile?.experience || 'Fresher',
      workerEducation: workerProfile?.education || 'Higher secondary',
      workerCity: workerProfile?.city || '',
      workerState: workerProfile?.state || '',
      workerPincode: workerProfile?.pincode || '',
      workerLat: workerProfile?.lat,
      workerLng: workerProfile?.lng,
      candidateNote: candidateNote || '',
      resumeUrl: customResumeUrl || workerProfile?.resumeUrl || '',
      resumeName: customResumeName || workerProfile?.resumeName || '',
      status: 'Applied',
      appliedAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    await setDoc(newDocRef, applicationPayload).catch(err => {
      handleFirestoreError(err, OperationType.CREATE, `applications/${newDocRef.id}`);
    });

    // Increment job applications count
    try {
      const jobDoc = doc(db, 'jobs', job.id);
      await updateDoc(jobDoc, {
        applicationsCount: increment(1),
        updatedAt: serverTimestamp()
      });
    } catch (e) {
      console.warn('Failed to increment application count:', e);
    }

    // Send notification to employer
    try {
      const notifRef = collection(db, 'notifications');
      await addDoc(notifRef, {
        recipientId: job.employerId,
        title: 'New Application Received',
        message: `${workerProfile?.fullName || userProfile?.name} applied for "${job.title}"${customResumeName ? ' with attached resume' : ''}`,
        type: 'application_received',
        read: false,
        link: 'applications',
        createdAt: serverTimestamp()
      });
    } catch (e) {
      console.warn('Notification send notice:', e);
    }
  };

  const uploadWorkerResume = async (resumeUrl: string, resumeName: string) => {
    if (!currentUser) return;
    const wRef = doc(db, 'workerProfiles', currentUser.uid);
    await updateDoc(wRef, {
      resumeUrl,
      resumeName,
      updatedAt: serverTimestamp()
    }).catch(err => {
      handleFirestoreError(err, OperationType.UPDATE, `workerProfiles/${currentUser.uid}`);
    });
  };

  const toggleBlockConversation = async (conversationId: string, block: boolean) => {
    if (!currentUser) return;
    const convRef = doc(db, 'conversations', conversationId);
    await updateDoc(convRef, {
      isBlocked: block,
      blockedBy: block ? currentUser.uid : null,
      updatedAt: serverTimestamp()
    }).catch(err => {
      handleFirestoreError(err, OperationType.UPDATE, `conversations/${conversationId}`);
    });
  };

  const updateApplicationStatus = async (
    applicationId: string,
    newStatus: ApplicationStatus,
    interviewDetails?: InterviewDetails
  ) => {
    const appRef = doc(db, 'applications', applicationId);
    const updatePayload: any = {
      status: newStatus,
      updatedAt: serverTimestamp()
    };
    if (interviewDetails) {
      updatePayload.interviewDetails = interviewDetails;
    }

    await updateDoc(appRef, updatePayload).catch(err => {
      handleFirestoreError(err, OperationType.UPDATE, `applications/${applicationId}`);
    });

    // Notify the worker of relevant status updates
    const targetApp = employerApplications.find(a => a.id === applicationId) || myApplications.find(a => a.id === applicationId);
    if (targetApp && targetApp.workerId) {
      try {
        const notifRef = collection(db, 'notifications');
        let notifMsg = `Your application for "${targetApp.jobTitle}" is now: ${newStatus}`;
        if (newStatus === 'Interview Scheduled' && interviewDetails) {
          notifMsg = `Interview scheduled for "${targetApp.jobTitle}" on ${interviewDetails.date} at ${interviewDetails.time} (${interviewDetails.mode})`;
        }
        await addDoc(notifRef, {
          recipientId: targetApp.workerId,
          title: `Application Status: ${newStatus}`,
          message: notifMsg,
          type: 'status_change',
          read: false,
          link: 'applications',
          createdAt: serverTimestamp()
        });
      } catch (e) {
        console.warn('Worker notification notice:', e);
      }
    }
  };

  const toggleSaveJob = async (jobId: string) => {
    if (!currentUser) return;
    const isSaved = savedJobIds.includes(jobId);
    const docId = `${currentUser.uid}_${jobId}`;
    const sjRef = doc(db, 'savedJobs', docId);

    if (isSaved) {
      await deleteDoc(sjRef).catch(err => {
        handleFirestoreError(err, OperationType.DELETE, `savedJobs/${docId}`);
      });
      setSavedJobIds(prev => prev.filter(id => id !== jobId));
    } else {
      await setDoc(sjRef, {
        id: docId,
        userId: currentUser.uid,
        jobId,
        createdAt: serverTimestamp()
      }).catch(err => {
        handleFirestoreError(err, OperationType.CREATE, `savedJobs/${docId}`);
      });
      setSavedJobIds(prev => [...prev, jobId]);
    }
  };

  const toggleSaveCandidate = async (workerId: string) => {
    if (!currentUser) return;
    const isSaved = savedCandidateIds.includes(workerId);
    const docId = `${currentUser.uid}_${workerId}`;
    const scRef = doc(db, 'savedCandidates', docId);

    if (isSaved) {
      await deleteDoc(scRef).catch(err => {
        handleFirestoreError(err, OperationType.DELETE, `savedCandidates/${docId}`);
      });
      setSavedCandidateIds(prev => prev.filter(id => id !== workerId));
    } else {
      await setDoc(scRef, {
        id: docId,
        employerId: currentUser.uid,
        workerId,
        createdAt: serverTimestamp()
      }).catch(err => {
        handleFirestoreError(err, OperationType.CREATE, `savedCandidates/${docId}`);
      });
      setSavedCandidateIds(prev => [...prev, workerId]);
    }
  };

  const openConversation = (conv: Conversation) => {
    setActiveConversation(conv);
  };

  const startConversation = async (
    targetUserId: string,
    targetName: string,
    targetPhoto?: string,
    targetRole: 'worker' | 'employer' = 'worker',
    initialMsg?: string
  ): Promise<string> => {
    if (!currentUser) throw new Error('Must be signed in to message');

    // Deterministic conversation ID for 1-on-1 pairs
    const participants = [currentUser.uid, targetUserId].sort();
    const convId = `${participants[0]}_${participants[1]}`;
    const convRef = doc(db, 'conversations', convId);

    const convSnap = await getDoc(convRef);
    if (!convSnap.exists()) {
      const myRole = userProfile?.activeRole || 'worker';
      const myName = (myRole === 'employer' ? employerProfile?.businessName : workerProfile?.fullName) || userProfile?.name || 'User';
      const myPhoto = (myRole === 'employer' ? employerProfile?.businessLogo : workerProfile?.profilePhoto) || userProfile?.profilePhoto || '';

      const payload: Conversation = {
        id: convId,
        participants,
        participantDetails: {
          [currentUser.uid]: {
            name: myName,
            photo: myPhoto,
            role: myRole
          },
          [targetUserId]: {
            name: targetName,
            photo: targetPhoto || '',
            role: targetRole
          }
        },
        lastMessage: initialMsg || 'Started a conversation',
        lastSenderId: currentUser.uid,
        lastMessageAt: serverTimestamp(),
        unreadBy: [targetUserId],
        isBlocked: false,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      await setDoc(convRef, payload).catch(err => {
        handleFirestoreError(err, OperationType.CREATE, `conversations/${convId}`);
      });

      if (initialMsg) {
        await sendMessage(convId, targetUserId, initialMsg);
      }
    }

    const updatedSnap = await getDoc(convRef);
    if (updatedSnap.exists()) {
      const convData = { id: updatedSnap.id, ...(updatedSnap.data() as any) } as Conversation;
      setActiveConversation(convData);
    }

    return convId;
  };

  const sendMessage = async (conversationId: string, receiverId: string, text: string) => {
    if (!currentUser || !text.trim()) return;

    const msgRef = collection(db, 'messages');
    const newMsgDoc = doc(msgRef);

    const messagePayload: Message = {
      id: newMsgDoc.id,
      conversationId,
      senderId: currentUser.uid,
      receiverId,
      text: text.trim(),
      read: false,
      createdAt: serverTimestamp()
    };

    await setDoc(newMsgDoc, messagePayload).catch(err => {
      handleFirestoreError(err, OperationType.CREATE, `messages/${newMsgDoc.id}`);
    });

    // Update conversation last message
    const convRef = doc(db, 'conversations', conversationId);
    await updateDoc(convRef, {
      lastMessage: text.trim(),
      lastSenderId: currentUser.uid,
      lastMessageAt: serverTimestamp(),
      unreadBy: [receiverId],
      updatedAt: serverTimestamp()
    }).catch(err => {
      console.warn('Update conv notice:', err);
    });

    // Send in-app notification
    try {
      const senderName = userProfile?.name || 'A user';
      const notifRef = collection(db, 'notifications');
      await addDoc(notifRef, {
        recipientId: receiverId,
        title: 'New Message',
        message: `${senderName}: ${text.slice(0, 80)}`,
        type: 'new_message',
        read: false,
        link: 'messages',
        createdAt: serverTimestamp()
      });
    } catch (e) {
      console.warn('Message notification notice:', e);
    }
  };

  const markNotificationAsRead = async (notificationId: string) => {
    const notifRef = doc(db, 'notifications', notificationId);
    await updateDoc(notifRef, { read: true }).catch(err => {
      console.warn('Mark notif read notice:', err);
    });
  };

  const markAllNotificationsAsRead = async () => {
    notifications.filter(n => !n.read).forEach(n => {
      markNotificationAsRead(n.id);
    });
  };

  const reportItem = async (targetType: 'job' | 'user' | 'conversation', targetId: string, reason: string) => {
    if (!currentUser) return;
    const reportRef = collection(db, 'reports');
    await addDoc(reportRef, {
      reporterId: currentUser.uid,
      targetType,
      targetId,
      reason,
      createdAt: serverTimestamp()
    });
  };

  // Seed initial realistic Indian jobs if the collection is empty
  const seedInitialJobsIfEmpty = async () => {
    try {
      const snap = await getDocs(collection(db, 'jobs'));
      if (snap.size > 0) return; // already populated

      const seedJobs: Array<Omit<Job, 'id' | 'createdAt' | 'updatedAt'>> = [
        {
          employerId: 'system_emp_1',
          employerName: 'Tata Power DDL & Projects',
          employerLogo: 'https://images.unsplash.com/photo-1541888946425-d0fbb18f156d?w=120&auto=format&fit=crop&q=80',
          isEmployerVerified: true,
          title: 'Senior Electrician & Substation Technician',
          category: 'Technical',
          description: 'Looking for a certified ITI/Diploma electrician for commercial installations, wiring inspections, and industrial motor maintenance.',
          responsibilities: 'Install conduit piping, test 3-phase circuits, diagnose electrical fault codes, and observe high-voltage safety standards.',
          requiredSkills: ['Electrician', 'Wiring', 'Appliance repair', 'Safety audit'],
          education: 'ITI',
          experience: '1–3 years',
          vacancies: 4,
          minSalary: 22000,
          maxSalary: 32000,
          paymentFrequency: 'Per month',
          employmentType: 'Full-time',
          workingHours: '9:00 AM - 6:00 PM (Mon-Sat)',
          state: 'Delhi',
          district: 'North Delhi',
          city: 'New Delhi',
          area: 'Rohini Sector 10',
          pincode: '110085',
          lat: 28.7041,
          lng: 77.1025,
          benefits: ['PF & ESI', 'Overtime allowance', 'Yearly medical checkup', 'Free safety kit'],
          deadline: '2026-12-15',
          status: 'active',
          applicationsCount: 3
        },
        {
          employerId: 'system_emp_2',
          employerName: 'Reliance Smart Superstore',
          employerLogo: 'https://images.unsplash.com/photo-1578916171728-46686eac8d58?w=120&auto=format&fit=crop&q=80',
          isEmployerVerified: true,
          title: 'Retail Store Cashier & Customer Executive',
          category: 'Retail',
          description: 'Manage point-of-sale billing, assist retail shoppers, and ensure stock replenishment in our premier supermarket store.',
          responsibilities: 'Billing via barcode scanners, cash management, stock audit at end-of-day, and assisting customers with product inquiries.',
          requiredSkills: ['Sales', 'Cashier', 'Customer service', 'Billing'],
          education: 'Higher secondary',
          experience: 'Fresher',
          vacancies: 6,
          minSalary: 16000,
          maxSalary: 22000,
          paymentFrequency: 'Per month',
          employmentType: 'Full-time',
          workingHours: '8-hour rotational shifts',
          state: 'Maharashtra',
          district: 'Mumbai Suburban',
          city: 'Mumbai',
          area: 'Andheri West',
          pincode: '400053',
          lat: 19.1197,
          lng: 72.8464,
          benefits: ['ESI health card', 'Employee store discounts', 'Attendance bonus'],
          deadline: '2026-11-30',
          status: 'active',
          applicationsCount: 5
        },
        {
          employerId: 'system_emp_3',
          employerName: 'Taj Gateway & Dining Services',
          employerLogo: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=120&auto=format&fit=crop&q=80',
          isEmployerVerified: true,
          title: 'Commercial Kitchen Assistant & Commis Cook',
          category: 'Hospitality',
          description: 'Assist Head Chef in preparing South Indian & North Indian lunch buffets, food hygiene standards, and kitchen prep.',
          responsibilities: 'Vegetable cutting, marination, tandoor oversight, dishwashing supervision, and food temperature logging.',
          requiredSkills: ['Cooking', 'Kitchen assistance', 'Housekeeping', 'Food presentation'],
          education: 'Secondary',
          experience: '1–3 years',
          vacancies: 3,
          minSalary: 18000,
          maxSalary: 26000,
          paymentFrequency: 'Per month',
          employmentType: 'Full-time',
          workingHours: '10:00 AM - 7:00 PM',
          state: 'Karnataka',
          district: 'Bengaluru Urban',
          city: 'Bengaluru',
          area: 'Indiranagar',
          pincode: '560038',
          lat: 12.9716,
          lng: 77.5946,
          benefits: ['Duty meals included', 'Health insurance', 'Tip sharing pool'],
          deadline: '2026-12-20',
          status: 'active',
          applicationsCount: 2
        },
        {
          employerId: 'system_emp_4',
          employerName: 'Delhivery Supply Chain Hub',
          employerLogo: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=120&auto=format&fit=crop&q=80',
          isEmployerVerified: true,
          title: 'Fleet Delivery Driver & Route Coordinator',
          category: 'Transport',
          description: 'Handle intracity parcel dispatches, route optimization, vehicle checks, and customer signature handovers.',
          responsibilities: 'Safe vehicle operation, tracking deliveries on mobile app, parcel scanning, and collection reconciliation.',
          requiredSkills: ['Driving', 'Delivery', 'Logistics', 'Fleet coordination'],
          education: 'Secondary',
          experience: '1–3 years',
          vacancies: 10,
          minSalary: 20000,
          maxSalary: 28000,
          paymentFrequency: 'Per month',
          employmentType: 'Full-time',
          workingHours: '8:00 AM - 5:00 PM',
          state: 'Maharashtra',
          district: 'Pune',
          city: 'Pune',
          area: 'Hinjawadi Phase 1',
          pincode: '411057',
          lat: 18.5204,
          lng: 73.8567,
          benefits: ['Fuel allowance', 'Mobile phone reimbursement', 'Accident insurance'],
          deadline: '2026-12-10',
          status: 'active',
          applicationsCount: 4
        },
        {
          employerId: 'system_emp_5',
          employerName: 'FinAdvisors Accounting Services',
          employerLogo: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=120&auto=format&fit=crop&q=80',
          isEmployerVerified: true,
          title: 'Tally Accountant & Data Entry Operator',
          category: 'Office',
          description: 'Record invoices, reconcile bank statements on Tally Prime, and prepare GST monthly return summaries.',
          responsibilities: 'GST invoice generation, vendor payments tracking, petty cash maintenance, and document filing.',
          requiredSkills: ['Accounting', 'Data entry', 'Tally', 'Administration'],
          education: 'Graduate',
          experience: '1–3 years',
          vacancies: 2,
          minSalary: 24000,
          maxSalary: 35000,
          paymentFrequency: 'Per month',
          employmentType: 'Full-time',
          workingHours: '9:30 AM - 6:30 PM (Mon-Fri)',
          state: 'Gujarat',
          district: 'Ahmedabad',
          city: 'Ahmedabad',
          area: 'Navrangpura',
          pincode: '380009',
          lat: 23.0225,
          lng: 72.5714,
          benefits: ['Performance bonus', 'Paid annual leaves', 'Tea & snacks'],
          deadline: '2026-12-05',
          status: 'active',
          applicationsCount: 1
        },
        {
          employerId: 'system_emp_6',
          employerName: 'Creative Pixel Digital Media',
          employerLogo: 'https://images.unsplash.com/photo-1572044162444-ad60f128bdea?w=120&auto=format&fit=crop&q=80',
          isEmployerVerified: true,
          title: 'Social Media Graphic Designer & Video Editor',
          category: 'Digital',
          description: 'Design promotional banners, YouTube thumbnails, and short reels for e-commerce and local business clients.',
          responsibilities: 'Create Photoshop/Canva layouts, cut 9:16 short form videos in Premiere/CapCut, and adapt brand kits.',
          requiredSkills: ['Graphic design', 'Video editing', 'Social media handling', 'Content writing'],
          education: 'Diploma',
          experience: 'Fresher',
          vacancies: 2,
          minSalary: 18000,
          maxSalary: 28000,
          paymentFrequency: 'Per month',
          employmentType: 'Full-time',
          workingHours: 'Flexible (Deliverables based)',
          state: 'Rajasthan',
          district: 'Jaipur',
          city: 'Jaipur',
          area: 'Malviya Nagar',
          pincode: '302017',
          lat: 26.9124,
          lng: 75.7873,
          benefits: ['Work from home', 'Internet allowance', 'Flexible hours'],
          deadline: '2026-12-31',
          status: 'active',
          applicationsCount: 7
        }
      ];

      for (const item of seedJobs) {
        const jRef = doc(collection(db, 'jobs'));
        await setDoc(jRef, {
          ...item,
          id: jRef.id,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
      }
      console.log('Seeded realistic initial jobs successfully.');
    } catch (e) {
      console.warn('Job seed notice:', e);
    }
  };

  useEffect(() => {
    seedInitialJobsIfEmpty();
  }, []);

  // 9. Subscribe to hiring requests
  useEffect(() => {
    if (!currentUser) {
      setHiringRequests([]);
      return;
    }

    const hrRef = collection(db, 'hiring_requests');
    const field = employerProfile ? 'employerId' : 'workerId';
    const q = query(hrRef, where(field, '==', currentUser.uid));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const list: HiringRequest[] = [];
        snapshot.forEach((doc) => {
          list.push({ id: doc.id, ...(doc.data() as any) });
        });
        list.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
        setHiringRequests(list);
      },
      (err) => console.warn('Hiring requests snapshot error:', err)
    );

    return () => unsubscribe();
  }, [currentUser, employerProfile]);

  // 10. Subscribe to saved companies
  useEffect(() => {
    if (!currentUser) {
      setSavedCompanyIds([]);
      return;
    }

    const scRef = collection(db, 'saved_companies');
    const q = query(scRef, where('userId', '==', currentUser.uid));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const ids: string[] = [];
        snapshot.forEach((doc) => {
          ids.push(doc.data().companyId);
        });
        setSavedCompanyIds(ids);
      },
      (err) => console.warn('Saved companies snapshot error:', err)
    );

    return () => unsubscribe();
  }, [currentUser]);

  // Hiring Request Operations
  const sendHiringRequest = async (
    data: Omit<HiringRequest, 'id' | 'employerId' | 'employerName' | 'status' | 'createdAt' | 'updatedAt'>
  ): Promise<string> => {
    if (!currentUser) throw new Error('Authentication required');

    const rawDocData: Record<string, any> = {
      ...data,
      workerPhoto: data.workerPhoto || '',
      jobId: data.jobId || 'custom',
      employerId: currentUser.uid,
      employerName: employerProfile?.businessName || userProfile?.name || 'Recruiter',
      employerLogo: employerProfile?.businessLogo || '',
      status: 'Pending',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    // Strip any undefined fields so Firestore addDoc never throws Unsupported field value: undefined
    const cleanDocData = Object.fromEntries(
      Object.entries(rawDocData).filter(([_, value]) => value !== undefined)
    );

    const hrRef = await addDoc(collection(db, 'hiring_requests'), cleanDocData);

    // Notify worker
    await addDoc(collection(db, 'notifications'), {
      recipientId: data.workerId,
      type: 'new_application',
      title: 'New Direct Hiring Request!',
      message: `${employerProfile?.businessName || 'An employer'} has sent you a hiring offer for ${data.jobTitle}.`,
      relatedId: hrRef.id,
      read: false,
      createdAt: serverTimestamp()
    });

    return hrRef.id;
  };

  const updateHiringRequestStatus = async (
    requestId: string,
    status: HiringRequest['status'],
    responseNote?: string
  ): Promise<void> => {
    const docRef = doc(db, 'hiring_requests', requestId);
    await updateDoc(docRef, {
      status,
      responseNote: responseNote || '',
      updatedAt: serverTimestamp()
    });
  };

  // Saved Companies Operations
  const toggleSaveCompany = async (
    companyId: string,
    companyName: string,
    companyLogo: string,
    industry: string
  ): Promise<void> => {
    if (!currentUser) throw new Error('Authentication required');
    const scRef = collection(db, 'saved_companies');
    const q = query(scRef, where('userId', '==', currentUser.uid), where('companyId', '==', companyId));
    const snap = await getDocs(q);

    if (!snap.empty) {
      for (const d of snap.docs) {
        await deleteDoc(d.ref);
      }
      setSavedCompanyIds((prev) => prev.filter((id) => id !== companyId));
    } else {
      await addDoc(scRef, {
        userId: currentUser.uid,
        companyId,
        companyName,
        companyLogo,
        industry,
        savedAt: serverTimestamp()
      });
      setSavedCompanyIds((prev) => [...prev, companyId]);
    }
  };

  const unreadNotificationCount = notifications.filter(n => !n.read).length;

  return (
    <JobContext.Provider
      value={{
        jobs,
        myJobs,
        myApplications,
        employerApplications,
        savedJobIds,
        savedCandidateIds,
        savedCompanyIds,
        hiringRequests,
        notifications,
        unreadNotificationCount,
        unreadNotificationsCount: unreadNotificationCount,
        conversations,
        activeConversation,
        activeConversationId: activeConversation?.id || activeConversationId,
        setActiveConversationId,
        activeMessages,
        loadingJobs,
        createJob,
        updateJob,
        deleteJob,
        changeJobStatus,
        applyToJob,
        updateApplicationStatus,
        toggleSaveJob,
        toggleSaveCandidate,
        toggleSaveCompany,
        sendHiringRequest,
        updateHiringRequestStatus,
        openConversation,
        startConversation,
        sendMessage,
        toggleBlockConversation,
        uploadWorkerResume,
        markNotificationAsRead,
        markAllNotificationsAsRead,
        reportItem,
        seedInitialJobsIfEmpty
      }}
    >
      {children}
    </JobContext.Provider>
  );
};

export const useJobs = () => {
  const context = useContext(JobContext);
  if (!context) {
    throw new Error('useJobs must be used within a JobProvider');
  }
  return context;
};
