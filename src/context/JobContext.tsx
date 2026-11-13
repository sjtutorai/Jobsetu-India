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
  ApplicationFormDetails,
  ApplicationStatus,
  InterviewDetails,
  Conversation,
  Message,
  Notification,
  SavedJob,
  SavedCandidate,
  Report,
  WorkerProfile,
  HiringRequest
} from '../types';
import { calculateDistance } from '../lib/geo';

interface JobContextType {
  jobs: Job[];
  myJobs: Job[];
  myApplications: Application[];
  employerApplications: Application[];
  savedJobIds: string[];
  savedCandidateIds: string[];
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
  applyToJob: (
    job: Job,
    candidateNote?: string,
    resumeUrl?: string,
    resumeName?: string,
    formDetails?: ApplicationFormDetails
  ) => Promise<void>;
  updateApplicationStatus: (applicationId: string, newStatus: ApplicationStatus, interviewDetails?: InterviewDetails) => Promise<void>;
  toggleSaveJob: (jobId: string) => Promise<void>;
  toggleSaveCandidate: (workerId: string) => Promise<void>;
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

  // 1. Subscribe to public active jobs (excluding any legacy demo seeded jobs)
  useEffect(() => {
    const jobsRef = collection(db, 'jobs');
    const q = query(jobsRef, where('status', '==', 'active'));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const jobsList: Job[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data() as any;
          if (typeof data?.employerId === 'string' && data.employerId.startsWith('system_emp_')) {
            return;
          }
          jobsList.push({ id: docSnap.id, ...data });
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

    const rawPayload: Record<string, any> = {
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

    const cleanPayload = Object.fromEntries(
      Object.entries(rawPayload).filter(([_, value]) => value !== undefined)
    );

    await setDoc(newDocRef, cleanPayload).catch(err => {
      handleFirestoreError(err, OperationType.CREATE, `jobs/${newDocRef.id}`);
    });

    return newDocRef.id;
  };

  const updateJob = async (jobId: string, jobData: Partial<Job>) => {
    const jobRef = doc(db, 'jobs', jobId);
    const cleanUpdates = Object.fromEntries(
      Object.entries({ ...jobData, updatedAt: serverTimestamp() }).filter(([_, v]) => v !== undefined)
    );
    await updateDoc(jobRef, cleanUpdates).catch(err => {
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

  const applyToJob = async (
    job: Job,
    candidateNote?: string,
    customResumeUrl?: string,
    customResumeName?: string,
    formDetails?: ApplicationFormDetails
  ) => {
    if (!currentUser) throw new Error('You must be signed in to apply for a job.');

    // Prevent duplicate applications
    const existing = myApplications.find(a => a.jobId === job.id && a.status !== 'Withdrawn');
    if (existing) {
      throw new Error('You have already applied for this job.');
    }

    const appRef = collection(db, 'applications');
    const newDocRef = doc(appRef);

    const applicantName =
      formDetails?.applicantName?.trim() ||
      workerProfile?.fullName ||
      userProfile?.name ||
      'Applicant';

    const rawApplicationPayload: Record<string, any> = {
      id: newDocRef.id,
      jobId: job.id,
      jobTitle: job.title,
      employerId: job.employerId,
      employerName: job.employerName,
      workerId: currentUser.uid,
      workerName: applicantName,
      workerPhone: formDetails?.applicantPhone?.trim() || workerProfile?.phone || userProfile?.phone || '',
      workerEmail: formDetails?.applicantEmail?.trim() || workerProfile?.email || userProfile?.email || currentUser.email || '',
      workerPhoto: workerProfile?.profilePhoto || userProfile?.profilePhoto || '',
      workerSkills: workerProfile?.skills || [],
      workerExperience: formDetails?.experience || workerProfile?.experience || 'Fresher',
      workerEducation: formDetails?.qualification || workerProfile?.education || 'Higher secondary',
      workerCity: formDetails?.applicantCity?.trim() || workerProfile?.city || '',
      workerState: formDetails?.applicantState?.trim() || workerProfile?.state || '',
      workerPincode: formDetails?.applicantPincode?.trim() || workerProfile?.pincode || '',
      workerLat: workerProfile?.lat,
      workerLng: workerProfile?.lng,
      expectedSalary:
        formDetails?.expectedSalary?.trim() ||
        `₹${job.minSalary.toLocaleString('en-IN')} - ₹${job.maxSalary.toLocaleString('en-IN')} / ${job.paymentFrequency.replace('Per ', '')}`,
      availabilityToJoin: formDetails?.availabilityToJoin || 'Immediate (Within 1-3 Days)',
      preferredShift: formDetails?.preferredShift || job.employmentType || 'Full-Time Shift',
      applicationSubject:
        formDetails?.applicationSubject?.trim() ||
        `Application for the post of ${job.title} at ${job.employerName}`,
      candidateNote: candidateNote || '',
      resumeUrl: customResumeUrl || workerProfile?.resumeUrl || '',
      resumeName: customResumeName || workerProfile?.resumeName || '',
      status: 'Applied',
      appliedAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    const cleanApplicationPayload = Object.fromEntries(
      Object.entries(rawApplicationPayload).filter(([_, value]) => value !== undefined)
    );

    await setDoc(newDocRef, cleanApplicationPayload).catch(err => {
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

  // Clean up any legacy demo seeded jobs if signed in as admin
  useEffect(() => {
    if (!currentUser || currentUser.email !== 'sjtutorai@gmail.com' || !currentUser.emailVerified) {
      return;
    }

    const cleanupLegacyDemoJobs = async () => {
      try {
        const snap = await getDocs(collection(db, 'jobs'));
        for (const docSnap of snap.docs) {
          const data = docSnap.data() as any;
          if (typeof data?.employerId === 'string' && data.employerId.startsWith('system_emp_')) {
            await deleteDoc(docSnap.ref);
          }
        }
      } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, 'jobs');
      }
    };

    cleanupLegacyDemoJobs();
  }, [currentUser]);

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
        sendHiringRequest,
        updateHiringRequestStatus,
        openConversation,
        startConversation,
        sendMessage,
        toggleBlockConversation,
        uploadWorkerResume,
        markNotificationAsRead,
        markAllNotificationsAsRead,
        reportItem
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
