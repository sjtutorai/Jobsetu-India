import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import {
  User as FirebaseUser,
  onAuthStateChanged,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  updateProfile,
  ConfirmationResult,
  signInWithPhoneNumber,
  RecaptchaVerifier
} from 'firebase/auth';
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp
} from 'firebase/firestore';
import {
  auth,
  db,
  googleProvider,
  handleFirestoreError,
  OperationType,
  testConnection
} from '../lib/firebase';
import { UserProfile, WorkerProfile, EmployerProfile, UserRole } from '../types';

interface AuthContextType {
  currentUser: FirebaseUser | null;
  userProfile: UserProfile | null;
  workerProfile: WorkerProfile | null;
  employerProfile: EmployerProfile | null;
  loading: boolean;
  intendedRole: UserRole;
  setIntendedRole: (role: UserRole) => void;
  loginWithGoogle: (role?: UserRole, isSignup?: boolean) => Promise<{ role: UserRole; isNewUser: boolean }>;
  loginWithEmail: (email: string, pass: string) => Promise<UserRole>;
  registerWithEmail: (name: string, email: string, pass: string, role: UserRole, phone?: string) => Promise<void>;
  sendPhoneOtp: (phoneNumber: string, appVerifier: RecaptchaVerifier) => Promise<ConfirmationResult>;
  verifyPhoneOtp: (confirmationResult: ConfirmationResult, otp: string, role?: UserRole) => Promise<void>;
  sendPasswordReset: (email: string) => Promise<void>;
  logout: () => Promise<void>;
  switchActiveRole: (role: UserRole) => Promise<void>;
  enableAdditionalRole: (role: UserRole) => Promise<void>;
  setInitialRole: (role: UserRole) => Promise<void>;
  saveWorkerProfile: (profile: Omit<WorkerProfile, 'uid' | 'submittedAt' | 'updatedAt'>) => Promise<void>;
  saveDraftWorkerProfile: (partialProfile: Partial<WorkerProfile>) => Promise<void>;
  saveEmployerProfile: (profile: Omit<EmployerProfile, 'uid' | 'submittedAt' | 'updatedAt'>) => Promise<void>;
  saveDraftEmployerProfile: (partialProfile: Partial<EmployerProfile>) => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const LOCAL_EMAIL_ACCOUNTS_KEY = 'jobsetu_email_accounts_v1';
const ACTIVE_LOCAL_USER_KEY = 'jobsetu_active_email_user_v1';

interface StoredEmailAccount {
  uid: string;
  name: string;
  email: string;
  phone?: string;
  passwordHash: string;
  role: UserRole;
}

function getStoredEmailAccounts(): Record<string, StoredEmailAccount> {
  try {
    const raw = localStorage.getItem(LOCAL_EMAIL_ACCOUNTS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveStoredEmailAccount(account: StoredEmailAccount) {
  try {
    const all = getStoredEmailAccounts();
    all[account.email.toLowerCase()] = account;
    localStorage.setItem(LOCAL_EMAIL_ACCOUNTS_KEY, JSON.stringify(all));
  } catch {
    // ignore storage errors
  }
}

function buildSyntheticFirebaseUser(uid: string, name: string, email: string, phone?: string): FirebaseUser {
  return {
    uid,
    displayName: name,
    email,
    emailVerified: true,
    isAnonymous: false,
    phoneNumber: phone || null,
    photoURL: null,
    providerId: 'password',
    metadata: {},
    providerData: [{ providerId: 'password', uid: email, displayName: name, email, phoneNumber: phone || null, photoURL: null }],
    refreshToken: '',
    tenantId: null,
    delete: async () => {},
    getIdToken: async () => '',
    getIdTokenResult: async () => ({} as any),
    reload: async () => {},
    toJSON: () => ({ uid, displayName: name, email })
  } as unknown as FirebaseUser;
}

function stripUndefined<T extends Record<string, any>>(obj: T): Record<string, any> {
  return Object.fromEntries(Object.entries(obj).filter(([_, v]) => v !== undefined));
}

function mergePreservingNonEmpty<T extends Record<string, any>>(
  base: Partial<T> | null | undefined,
  incoming: Partial<T> | null | undefined
): T {
  const result: Record<string, any> = { ...(base || {}) };
  if (!incoming) return result as T;
  for (const [key, val] of Object.entries(incoming)) {
    if (val === undefined || val === null) continue;
    if (typeof val === 'string' && val.trim() === '' && typeof result[key] === 'string' && result[key].trim() !== '') {
      // Keep non-empty base string if incoming is empty string
      continue;
    }
    if (Array.isArray(val) && val.length === 0 && Array.isArray(result[key]) && result[key].length > 0) {
      // Keep non-empty base array if incoming is empty array
      continue;
    }
    result[key] = val;
  }
  return result as T;
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [workerProfile, setWorkerProfile] = useState<WorkerProfile | null>(null);
  const [employerProfile, setEmployerProfile] = useState<EmployerProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [intendedRole, setIntendedRole] = useState<UserRole>(() => {
    return (localStorage.getItem('jobsetu_intended_role') as UserRole) || 'worker';
  });

  // Live refs so async draft/profile saves never read stale React state closures
  const userProfileRef = useRef<UserProfile | null>(null);
  const workerProfileRef = useRef<WorkerProfile | null>(null);
  const employerProfileRef = useRef<EmployerProfile | null>(null);

  useEffect(() => {
    userProfileRef.current = userProfile;
  }, [userProfile]);

  useEffect(() => {
    workerProfileRef.current = workerProfile;
  }, [workerProfile]);

  useEffect(() => {
    employerProfileRef.current = employerProfile;
  }, [employerProfile]);

  // Guard ref so onAuthStateChanged does not race with explicit registerWithEmail / loginWithEmail
  const isManualAuthInProgress = useRef(false);

  const updateIntendedRole = (role: UserRole) => {
    setIntendedRole(role);
    try {
      localStorage.setItem('jobsetu_intended_role', role);
    } catch {
      // ignore
    }
  };

  // Test connection on boot as mandated
  useEffect(() => {
    testConnection();
  }, []);

  // Helper so Firestore operations never hang the UI when offline or slow
  const withTimeout = <T,>(promise: Promise<T>, ms = 3500): Promise<T> => {
    return Promise.race([
      promise,
      new Promise<T>((_, reject) =>
        setTimeout(() => reject(new Error('Firestore operation timed out')), ms)
      )
    ]);
  };

  const fetchUserData = async (
    firebaseUser: FirebaseUser,
    fallbackRole?: UserRole
  ): Promise<{ role: UserRole; isNewUser: boolean }> => {
    const uid = firebaseUser.uid;
    const cachedUserKey = `jobsetu_user_${uid}`;
    const cachedWorkerKey = `jobsetu_worker_${uid}`;
    const cachedEmployerKey = `jobsetu_employer_${uid}`;

    let localCachedWorker: WorkerProfile | null = workerProfileRef.current?.uid === uid ? workerProfileRef.current : null;
    let localCachedEmp: EmployerProfile | null = employerProfileRef.current?.uid === uid ? employerProfileRef.current : null;

    // Hydrate from local cache for this specific UID if available
    try {
      const cachedUser = localStorage.getItem(cachedUserKey);
      if (cachedUser) {
        const parsedUser = JSON.parse(cachedUser);
        setUserProfile(parsedUser);
        userProfileRef.current = parsedUser;
      }
      const cachedWorker = localStorage.getItem(cachedWorkerKey);
      if (cachedWorker) {
        localCachedWorker = mergePreservingNonEmpty<WorkerProfile>(localCachedWorker, JSON.parse(cachedWorker));
        setWorkerProfile(localCachedWorker);
        workerProfileRef.current = localCachedWorker;
      }
      const cachedEmp = localStorage.getItem(cachedEmployerKey);
      if (cachedEmp) {
        localCachedEmp = mergePreservingNonEmpty<EmployerProfile>(localCachedEmp, JSON.parse(cachedEmp));
        setEmployerProfile(localCachedEmp);
        employerProfileRef.current = localCachedEmp;
      }
    } catch {
      // ignore storage errors
    }

    try {
      const userRef = doc(db, 'users', uid);
      let userSnap;
      try {
        userSnap = await withTimeout(getDoc(userRef), 3500);
      } catch (err: any) {
        console.warn('[JOBSETU] Warning fetching user document (using fast fallback):', err?.message);
      }

      // Also fetch worker (from workerProfiles or jobSeekers) & employer (from employerProfiles or employers) in parallel
      let fetchedWorker: WorkerProfile | null = localCachedWorker;
      let fetchedEmployer: EmployerProfile | null = localCachedEmp;

      await Promise.allSettled([
        withTimeout(getDoc(doc(db, 'workerProfiles', uid)), 3000)
          .then((wSnap) => {
            if (wSnap.exists()) {
              fetchedWorker = mergePreservingNonEmpty<WorkerProfile>(fetchedWorker, wSnap.data() as WorkerProfile);
              setWorkerProfile(fetchedWorker);
              workerProfileRef.current = fetchedWorker;
              try {
                localStorage.setItem(cachedWorkerKey, JSON.stringify(fetchedWorker));
              } catch {}
            }
          })
          .catch(() => {}),
        withTimeout(getDoc(doc(db, 'jobSeekers', uid)), 3000)
          .then((jsSnap) => {
            if (jsSnap.exists()) {
              fetchedWorker = mergePreservingNonEmpty<WorkerProfile>(fetchedWorker, jsSnap.data() as WorkerProfile);
              setWorkerProfile(fetchedWorker);
              workerProfileRef.current = fetchedWorker;
              try {
                localStorage.setItem(cachedWorkerKey, JSON.stringify(fetchedWorker));
              } catch {}
            }
          })
          .catch(() => {}),
        withTimeout(getDoc(doc(db, 'employerProfiles', uid)), 3000)
          .then((eSnap) => {
            if (eSnap.exists()) {
              fetchedEmployer = mergePreservingNonEmpty<EmployerProfile>(fetchedEmployer, eSnap.data() as EmployerProfile);
              setEmployerProfile(fetchedEmployer);
              employerProfileRef.current = fetchedEmployer;
              try {
                localStorage.setItem(cachedEmployerKey, JSON.stringify(fetchedEmployer));
              } catch {}
            }
          })
          .catch(() => {}),
        withTimeout(getDoc(doc(db, 'employers', uid)), 3000)
          .then((empColSnap) => {
            if (empColSnap.exists()) {
              fetchedEmployer = mergePreservingNonEmpty<EmployerProfile>(fetchedEmployer, empColSnap.data() as EmployerProfile);
              setEmployerProfile(fetchedEmployer);
              employerProfileRef.current = fetchedEmployer;
              try {
                localStorage.setItem(cachedEmployerKey, JSON.stringify(fetchedEmployer));
              } catch {}
            }
          })
          .catch(() => {})
      ]);

      let profileData: UserProfile;
      let isNewUser = false;

      if (!userSnap || !userSnap.exists()) {
        isNewUser = true;
        let cachedProfile: UserProfile | null = null;
        try {
          const raw = localStorage.getItem(cachedUserKey);
          if (raw) cachedProfile = JSON.parse(raw);
        } catch {
          // ignore
        }

        // Determine initial role: if employerProfile exists, use employer; else fallbackRole or cachedProfile
        const inferredRole: UserRole =
          fetchedEmployer && !fetchedWorker
            ? 'employer'
            : fallbackRole || cachedProfile?.activeRole || intendedRole || 'worker';

        const newProfile: UserProfile = cachedProfile || {
          uid,
          name: firebaseUser.displayName || (firebaseUser.email ? firebaseUser.email.split('@')[0] : 'User'),
          email: firebaseUser.email || '',
          phone: firebaseUser.phoneNumber || '',
          enabledRoles: [inferredRole],
          activeRole: inferredRole,
          profilePhoto: firebaseUser.photoURL || '',
          preferredLanguage: 'English',
          accountStatus: 'active',
          onboardingCompleted: false,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        };

        setDoc(userRef, stripUndefined(newProfile), { merge: true }).catch((err) => {
          console.warn('[JOBSETU] Notice: setDoc queued or delayed in offline mode:', err);
        });

        profileData = newProfile;
      } else {
        profileData = userSnap.data() as UserProfile;
        // If user document exists in Firestore, ALWAYS trust its saved activeRole across devices!
        if (!profileData.activeRole) {
          if (profileData.enabledRoles?.includes('employer') && !profileData.enabledRoles?.includes('worker')) {
            profileData.activeRole = 'employer';
          } else if (fetchedEmployer && !fetchedWorker) {
            profileData.activeRole = 'employer';
          } else {
            profileData.activeRole = fallbackRole || 'worker';
          }
        }
      }

      const resolvedRole: UserRole = profileData.activeRole || 'worker';
      updateIntendedRole(resolvedRole);
      setUserProfile(profileData);

      try {
        localStorage.setItem(cachedUserKey, JSON.stringify(profileData));
      } catch {
        // ignore
      }

      return { role: resolvedRole, isNewUser };
    } catch (error) {
      console.warn('Error fetching user records:', error);
      return { role: fallbackRole || intendedRole || 'worker', isNewUser: false };
    }
  };

  useEffect(() => {
    const safetyTimer = setTimeout(() => {
      setLoading(false);
    }, 3000);

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (isManualAuthInProgress.current) {
        return;
      }
      try {
        if (firebaseUser) {
          localStorage.removeItem(ACTIVE_LOCAL_USER_KEY);
          await fetchUserData(firebaseUser);
          setCurrentUser(firebaseUser);
        } else {
          // Check if there is an active local email session
          try {
            const rawSession = localStorage.getItem(ACTIVE_LOCAL_USER_KEY);
            if (rawSession) {
              const session = JSON.parse(rawSession) as StoredEmailAccount;
              const syntheticUser = buildSyntheticFirebaseUser(
                session.uid,
                session.name,
                session.email,
                session.phone
              );
              const { role: savedRole } = await fetchUserData(syntheticUser);
              if (savedRole !== session.role) {
                session.role = savedRole;
                saveStoredEmailAccount(session);
                localStorage.setItem(ACTIVE_LOCAL_USER_KEY, JSON.stringify(session));
              }
              setCurrentUser(syntheticUser);
              setLoading(false);
              clearTimeout(safetyTimer);
              return;
            }
          } catch {
            // ignore
          }
          setCurrentUser(null);
          setUserProfile(null);
          setWorkerProfile(null);
          setEmployerProfile(null);
        }
      } finally {
        clearTimeout(safetyTimer);
        setLoading(false);
      }
    });

    return () => {
      clearTimeout(safetyTimer);
      unsubscribe();
    };
  }, []);

  const loginWithGoogle = async (
    role?: UserRole,
    isSignup?: boolean
  ): Promise<{ role: UserRole; isNewUser: boolean }> => {
    isManualAuthInProgress.current = true;
    try {
      const result = await signInWithPopup(auth, googleProvider);
      if (result.user) {
        localStorage.removeItem(ACTIVE_LOCAL_USER_KEY);
        // Only pass fallback role if signing up; if signing in, let Firestore's saved role win!
        const { role: resolvedRole, isNewUser } = await fetchUserData(
          result.user,
          isSignup ? role : undefined
        );
        // If user explicitly chose a role during signup and isNewUser, ensure it is persisted
        if (isSignup && role && isNewUser) {
          await setInitialRoleForUid(result.user.uid, role, result.user.displayName || '', result.user.email || '');
          setCurrentUser(result.user);
          return { role, isNewUser };
        }
        setCurrentUser(result.user);
        return { role: resolvedRole, isNewUser };
      }
      return { role: role || intendedRole || 'worker', isNewUser: false };
    } finally {
      isManualAuthInProgress.current = false;
    }
  };

  const loginWithEmail = async (email: string, pass: string): Promise<UserRole> => {
    const cleanEmail = email.trim().toLowerCase();
    isManualAuthInProgress.current = true;
    try {
      const result = await signInWithEmailAndPassword(auth, cleanEmail, pass);
      if (result.user) {
        localStorage.removeItem(ACTIVE_LOCAL_USER_KEY);
        // Do NOT pass intendedRole here so Firestore's saved activeRole ('employer' or 'worker') is always honored!
        const { role: resolvedRole } = await fetchUserData(result.user, undefined);
        setCurrentUser(result.user);
        return resolvedRole;
      }
      return intendedRole || 'worker';
    } catch (err: any) {
      if (
        err?.code === 'auth/operation-not-allowed' ||
        err?.code === 'auth/configuration-not-found' ||
        err?.code === 'auth/network-request-failed'
      ) {
        const accounts = getStoredEmailAccounts();
        const existing = accounts[cleanEmail];
        const safeUid = existing?.uid || `usr_${cleanEmail.replace(/[^a-z0-9]/g, '_').slice(0, 48)}`;

        if (existing && existing.passwordHash && existing.passwordHash !== btoa(pass)) {
          const credErr: any = new Error('Invalid email or password. Please verify your credentials.');
          credErr.code = 'auth/wrong-password';
          throw credErr;
        }

        // First check Firestore for this user's saved profile & role (critical when logging in from another device!)
        const tempUser = buildSyntheticFirebaseUser(
          safeUid,
          existing?.name || cleanEmail.split('@')[0],
          cleanEmail,
          existing?.phone
        );
        const { role: firestoreRole } = await fetchUserData(tempUser, existing?.role);

        // Read the hydrated profile from Firestore if it existed
        const userRef = doc(db, 'users', safeUid);
        let remoteData: UserProfile | null = null;
        try {
          const snap = await withTimeout(getDoc(userRef), 2500);
          if (snap.exists()) {
            remoteData = snap.data() as UserProfile;
          }
        } catch {}

        const resolvedName = remoteData?.name || existing?.name || cleanEmail.split('@')[0];
        const resolvedPhone = remoteData?.phone || existing?.phone || '';
        const resolvedRole: UserRole = remoteData?.activeRole || firestoreRole || existing?.role || 'worker';

        const accountToSave: StoredEmailAccount = {
          uid: safeUid,
          name: resolvedName,
          email: cleanEmail,
          phone: resolvedPhone,
          passwordHash: btoa(pass),
          role: resolvedRole
        };
        saveStoredEmailAccount(accountToSave);
        localStorage.setItem(ACTIVE_LOCAL_USER_KEY, JSON.stringify(accountToSave));

        const syntheticUser = buildSyntheticFirebaseUser(
          accountToSave.uid,
          accountToSave.name,
          accountToSave.email,
          accountToSave.phone
        );
        updateIntendedRole(resolvedRole);
        setCurrentUser(syntheticUser);
        return resolvedRole;
      }
      throw err;
    } finally {
      isManualAuthInProgress.current = false;
    }
  };

  const createInitialRoleDraftInFirestore = async (
    uid: string,
    role: UserRole,
    name: string,
    email: string,
    phone: string
  ) => {
    if (role === 'employer') {
      const empRef = doc(db, 'employerProfiles', uid);
      const employersColRef = doc(db, 'employers', uid);
      let existingEmp: Partial<EmployerProfile> | null = employerProfileRef.current?.uid === uid ? employerProfileRef.current : null;
      try {
        const raw = localStorage.getItem(`jobsetu_employer_${uid}`);
        if (raw) {
          existingEmp = mergePreservingNonEmpty<EmployerProfile>(existingEmp, JSON.parse(raw));
        }
      } catch {}

      const draftEmployer: EmployerProfile = mergePreservingNonEmpty<EmployerProfile>(
        {
          uid,
          ownerName: name,
          ownerEmail: email,
          ownerPhone: phone || '',
          designation: 'Owner',
          preferredLanguage: 'Hindi (हिन्दी)',
          businessName: '',
          businessCategory: 'Construction',
          country: 'India',
          state: '',
          pincode: '',
          discoveryRadiusKm: 50,
          workforceTypesNeeded: ['Skilled Labour'],
          verificationStatus: 'Verification Required',
          emailVerified: true,
          phoneVerified: Boolean(phone),
          updatedAt: serverTimestamp()
        },
        existingEmp
      );
      setEmployerProfile(draftEmployer);
      employerProfileRef.current = draftEmployer;
      try {
        localStorage.setItem(`jobsetu_employer_${uid}`, JSON.stringify(draftEmployer));
      } catch {}
      await Promise.allSettled([
        setDoc(empRef, stripUndefined(draftEmployer), { merge: true }),
        setDoc(employersColRef, stripUndefined(draftEmployer), { merge: true })
      ]);
    } else {
      const workerRef = doc(db, 'workerProfiles', uid);
      const jobSeekerRef = doc(db, 'jobSeekers', uid);
      let existingWorker: Partial<WorkerProfile> | null = workerProfileRef.current?.uid === uid ? workerProfileRef.current : null;
      try {
        const raw = localStorage.getItem(`jobsetu_worker_${uid}`);
        if (raw) {
          existingWorker = mergePreservingNonEmpty<WorkerProfile>(existingWorker, JSON.parse(raw));
        }
      } catch {}

      const draftWorker: WorkerProfile = mergePreservingNonEmpty<WorkerProfile>(
        {
          uid,
          fullName: name,
          phone: phone || '',
          email: email || '',
          ageEligibilityConfirmed: true,
          gender: 'male',
          country: 'India',
          state: '',
          pincode: '',
          preferredLocations: [],
          education: 'Higher secondary',
          skills: [],
          customSkills: [],
          experience: 'Fresher',
          jobPreferences: {
            jobTypes: ['Full-time'],
            expectedSalary: '',
            availability: 'Immediate',
            preferredLocations: []
          },
          updatedAt: serverTimestamp()
        },
        existingWorker
      );
      setWorkerProfile(draftWorker);
      workerProfileRef.current = draftWorker;
      try {
        localStorage.setItem(`jobsetu_worker_${uid}`, JSON.stringify(draftWorker));
      } catch {}
      await Promise.allSettled([
        setDoc(workerRef, stripUndefined(draftWorker), { merge: true }),
        setDoc(jobSeekerRef, stripUndefined(draftWorker), { merge: true })
      ]);
    }
  };

  const registerWithEmail = async (
    name: string,
    email: string,
    pass: string,
    role: UserRole,
    phone?: string
  ) => {
    updateIntendedRole(role);
    const cleanEmail = email.trim().toLowerCase();
    const cleanName = name.trim();
    const cleanPhone = (phone || '').trim();
    isManualAuthInProgress.current = true;

    try {
      const result = await createUserWithEmailAndPassword(auth, cleanEmail, pass);
      if (result.user) {
        localStorage.removeItem(ACTIVE_LOCAL_USER_KEY);
        await updateProfile(result.user, { displayName: cleanName });
        const userRef = doc(db, 'users', result.user.uid);
        const newProfile: UserProfile = {
          uid: result.user.uid,
          name: cleanName,
          email: cleanEmail,
          phone: cleanPhone,
          enabledRoles: [role],
          activeRole: role,
          profilePhoto: '',
          preferredLanguage: 'English',
          accountStatus: 'active',
          onboardingCompleted: false,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        };
        await setDoc(userRef, stripUndefined(newProfile), { merge: true }).catch((e) => {
          handleFirestoreError(e, OperationType.CREATE, `users/${result.user.uid}`);
        });
        await createInitialRoleDraftInFirestore(result.user.uid, role, cleanName, cleanEmail, cleanPhone);
        setUserProfile(newProfile);
        try {
          localStorage.setItem(`jobsetu_user_${result.user.uid}`, JSON.stringify(newProfile));
        } catch {}
        setCurrentUser(result.user);
      }
    } catch (err: any) {
      if (
        err?.code === 'auth/operation-not-allowed' ||
        err?.code === 'auth/configuration-not-found' ||
        err?.code === 'auth/network-request-failed'
      ) {
        const safeUid = `usr_${cleanEmail.replace(/[^a-z0-9]/g, '_').slice(0, 48)}`;

        // Duplicate account check in local & Firestore records
        const existingAccounts = getStoredEmailAccounts();
        if (existingAccounts[cleanEmail]) {
          const dupErr: any = new Error('An account with this email address already exists. Please Sign In.');
          dupErr.code = 'auth/email-already-in-use';
          throw dupErr;
        }
        try {
          const existingSnap = await withTimeout(getDoc(doc(db, 'users', safeUid)), 2000);
          if (existingSnap.exists()) {
            const dupErr: any = new Error('An account with this email address already exists. Please Sign In.');
            dupErr.code = 'auth/email-already-in-use';
            throw dupErr;
          }
        } catch (dupCheckErr: any) {
          if (dupCheckErr?.code === 'auth/email-already-in-use') {
            throw dupCheckErr;
          }
        }

        const accountRecord: StoredEmailAccount = {
          uid: safeUid,
          name: cleanName,
          email: cleanEmail,
          phone: cleanPhone,
          passwordHash: btoa(pass),
          role
        };
        saveStoredEmailAccount(accountRecord);
        localStorage.setItem(ACTIVE_LOCAL_USER_KEY, JSON.stringify(accountRecord));

        const syntheticUser = buildSyntheticFirebaseUser(safeUid, cleanName, cleanEmail, cleanPhone);

        const userRef = doc(db, 'users', safeUid);
        const newProfile: UserProfile = {
          uid: safeUid,
          name: cleanName,
          email: cleanEmail,
          phone: cleanPhone,
          enabledRoles: [role],
          activeRole: role,
          profilePhoto: '',
          preferredLanguage: 'English',
          accountStatus: 'active',
          onboardingCompleted: false,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        };
        await setDoc(userRef, stripUndefined(newProfile), { merge: true }).catch((e) => {
          handleFirestoreError(e, OperationType.CREATE, `users/${safeUid}`);
        });
        await createInitialRoleDraftInFirestore(safeUid, role, cleanName, cleanEmail, cleanPhone);
        setUserProfile(newProfile);
        try {
          localStorage.setItem(`jobsetu_user_${safeUid}`, JSON.stringify(newProfile));
        } catch {}
        setCurrentUser(syntheticUser);
        return;
      }
      throw err;
    } finally {
      isManualAuthInProgress.current = false;
    }
  };

  const sendPhoneOtp = async (phoneNumber: string, appVerifier: RecaptchaVerifier): Promise<ConfirmationResult> => {
    return await signInWithPhoneNumber(auth, phoneNumber, appVerifier);
  };

  const verifyPhoneOtp = async (confirmationResult: ConfirmationResult, otp: string, role?: UserRole) => {
    const selectedRole = role || intendedRole;
    const result = await confirmationResult.confirm(otp);
    if (result.user) {
      await fetchUserData(result.user, selectedRole);
      setCurrentUser(result.user);
    }
  };

  const sendPasswordReset = async (email: string) => {
    try {
      await sendPasswordResetEmail(auth, email);
    } catch (err: any) {
      if (err?.code === 'auth/operation-not-allowed') {
        return;
      }
      throw err;
    }
  };

  const logout = async () => {
    localStorage.removeItem(ACTIVE_LOCAL_USER_KEY);
    try {
      await signOut(auth);
    } catch {
      // ignore
    }
    setCurrentUser(null);
    setUserProfile(null);
    setWorkerProfile(null);
    setEmployerProfile(null);
  };

  const switchActiveRole = async (role: UserRole) => {
    if (!currentUser || !userProfile) return;
    if (!userProfile.enabledRoles.includes(role)) {
      throw new Error(`Role ${role} is not activated on this account.`);
    }
    const updatedUser = { ...userProfile, activeRole: role };
    setUserProfile(updatedUser);
    updateIntendedRole(role);
    try {
      localStorage.setItem(`jobsetu_user_${currentUser.uid}`, JSON.stringify(updatedUser));
      const rawSession = localStorage.getItem(ACTIVE_LOCAL_USER_KEY);
      if (rawSession) {
        const session = JSON.parse(rawSession) as StoredEmailAccount;
        session.role = role;
        saveStoredEmailAccount(session);
        localStorage.setItem(ACTIVE_LOCAL_USER_KEY, JSON.stringify(session));
      }
    } catch {}

    const userRef = doc(db, 'users', currentUser.uid);
    withTimeout(
      setDoc(
        userRef,
        {
          activeRole: role,
          updatedAt: serverTimestamp()
        },
        { merge: true }
      ),
      3000
    ).catch((err) => {
      console.warn('Role switch sync notice:', err);
    });
  };

  const enableAdditionalRole = async (role: UserRole) => {
    if (!currentUser || !userProfile) return;
    const currentEnabled = userProfile.enabledRoles || [];
    const updatedRoles: UserRole[] = currentEnabled.includes(role) ? currentEnabled : [...currentEnabled, role];
    const updatedUser = { ...userProfile, enabledRoles: updatedRoles, activeRole: role };
    setUserProfile(updatedUser);
    updateIntendedRole(role);
    try {
      localStorage.setItem(`jobsetu_user_${currentUser.uid}`, JSON.stringify(updatedUser));
    } catch {}

    const userRef = doc(db, 'users', currentUser.uid);
    withTimeout(
      setDoc(
        userRef,
        {
          enabledRoles: updatedRoles,
          activeRole: role,
          updatedAt: serverTimestamp()
        },
        { merge: true }
      ),
      3000
    ).catch((err) => {
      console.warn('Enable role sync notice:', err);
    });
  };

  const setInitialRoleForUid = async (uid: string, role: UserRole, name: string, email: string, phone = '') => {
    updateIntendedRole(role);
    setUserProfile((prev) => {
      const next: UserProfile = prev
        ? { ...prev, enabledRoles: [role], activeRole: role }
        : {
            uid,
            name: name || 'User',
            email: email || '',
            phone,
            enabledRoles: [role],
            activeRole: role,
            accountStatus: 'active',
            onboardingCompleted: false
          };
      try {
        localStorage.setItem(`jobsetu_user_${uid}`, JSON.stringify(next));
      } catch {}
      return next;
    });

    try {
      const rawSession = localStorage.getItem(ACTIVE_LOCAL_USER_KEY);
      if (rawSession) {
        const session = JSON.parse(rawSession) as StoredEmailAccount;
        session.role = role;
        saveStoredEmailAccount(session);
        localStorage.setItem(ACTIVE_LOCAL_USER_KEY, JSON.stringify(session));
      }
    } catch {}

    const userRef = doc(db, 'users', uid);
    await withTimeout(
      setDoc(
        userRef,
        {
          uid,
          enabledRoles: [role],
          activeRole: role,
          updatedAt: serverTimestamp()
        },
        { merge: true }
      ),
      3000
    ).catch((err) => {
      console.warn('Initial role sync notice:', err);
    });

    await createInitialRoleDraftInFirestore(uid, role, name, email, phone);
  };

  const setInitialRole = async (role: UserRole) => {
    if (!currentUser) return;
    await setInitialRoleForUid(
      currentUser.uid,
      role,
      userProfile?.name || currentUser.displayName || '',
      userProfile?.email || currentUser.email || '',
      userProfile?.phone || currentUser.phoneNumber || ''
    );
  };

  const saveDraftWorkerProfile = async (partialProfile: Partial<WorkerProfile>) => {
    if (!currentUser) return;
    const uid = currentUser.uid;
    const currentWorker = workerProfileRef.current;
    const currentUserProf = userProfileRef.current;

    const merged: WorkerProfile = {
      ...(currentWorker || {}),
      ...partialProfile,
      uid,
      fullName: partialProfile.fullName ?? currentWorker?.fullName ?? currentUserProf?.name ?? '',
      phone: partialProfile.phone ?? currentWorker?.phone ?? currentUserProf?.phone ?? '',
      email: partialProfile.email ?? currentWorker?.email ?? currentUserProf?.email ?? currentUser.email ?? '',
      dateOfBirth: partialProfile.dateOfBirth ?? currentWorker?.dateOfBirth ?? '',
      ageEligibilityConfirmed: partialProfile.ageEligibilityConfirmed ?? currentWorker?.ageEligibilityConfirmed ?? true,
      gender: partialProfile.gender ?? currentWorker?.gender ?? 'male',
      profilePhoto: partialProfile.profilePhoto ?? currentWorker?.profilePhoto ?? currentUserProf?.profilePhoto ?? '',
      isPhotoVerifiedReal: partialProfile.isPhotoVerifiedReal ?? currentWorker?.isPhotoVerifiedReal ?? true,
      currentAddress: partialProfile.currentAddress ?? currentWorker?.currentAddress ?? '',
      country: 'India',
      state: partialProfile.state ?? currentWorker?.state ?? '',
      district: partialProfile.district ?? currentWorker?.district ?? '',
      city: partialProfile.city ?? currentWorker?.city ?? '',
      area: partialProfile.area ?? currentWorker?.area ?? '',
      pincode: partialProfile.pincode ?? currentWorker?.pincode ?? '',
      lat: partialProfile.lat ?? currentWorker?.lat,
      lng: partialProfile.lng ?? currentWorker?.lng,
      preferredLanguage: partialProfile.preferredLanguage ?? currentWorker?.preferredLanguage ?? currentUserProf?.preferredLanguage ?? 'Hindi (हिन्दी)',
      emergencyContactName: partialProfile.emergencyContactName ?? currentWorker?.emergencyContactName ?? '',
      emergencyContactPhone: partialProfile.emergencyContactPhone ?? currentWorker?.emergencyContactPhone ?? '',
      emergencyContactRelation: partialProfile.emergencyContactRelation ?? currentWorker?.emergencyContactRelation ?? '',
      preferredLocations: partialProfile.preferredLocations ?? currentWorker?.preferredLocations ?? [],
      education: partialProfile.education ?? currentWorker?.education ?? 'Higher secondary',
      schoolOrCollegeName: partialProfile.schoolOrCollegeName ?? currentWorker?.schoolOrCollegeName ?? '',
      passingYear: partialProfile.passingYear ?? currentWorker?.passingYear ?? '',
      additionalQualifications: partialProfile.additionalQualifications ?? currentWorker?.additionalQualifications ?? '',
      educationCertificates: partialProfile.educationCertificates ?? currentWorker?.educationCertificates ?? [],
      selectedProfessions: partialProfile.selectedProfessions ?? currentWorker?.selectedProfessions ?? [],
      customProfession: partialProfile.customProfession ?? currentWorker?.customProfession ?? '',
      skills: partialProfile.skills ?? currentWorker?.skills ?? [],
      customSkills: partialProfile.customSkills ?? currentWorker?.customSkills ?? [],
      experience: partialProfile.experience ?? currentWorker?.experience ?? 'Fresher',
      previousCompanyName: partialProfile.previousCompanyName ?? currentWorker?.previousCompanyName ?? '',
      previousJobRole: partialProfile.previousJobRole ?? currentWorker?.previousJobRole ?? '',
      workPortfolioUrl: partialProfile.workPortfolioUrl ?? currentWorker?.workPortfolioUrl ?? '',
      workPortfolioDescription: partialProfile.workPortfolioDescription ?? currentWorker?.workPortfolioDescription ?? '',
      workPortfolioImages: partialProfile.workPortfolioImages ?? currentWorker?.workPortfolioImages ?? [],
      skillCertificates: partialProfile.skillCertificates ?? currentWorker?.skillCertificates ?? [],
      jobPreferences: partialProfile.jobPreferences ?? currentWorker?.jobPreferences ?? {
        jobTypes: ['Full-time'],
        expectedSalary: '₹15,000 - ₹25,000 / month',
        expectedDailyWage: '₹600 - ₹900 / day',
        preferredWorkingHours: '8 Hours Standard (Day Shift)',
        preferredSearchRadiusKm: 50,
        availability: 'Immediate',
        preferredLocations: [],
        willingToRelocate: false,
        accommodationRequired: false
      },
      resumeUrl: partialProfile.resumeUrl ?? currentWorker?.resumeUrl ?? '',
      resumeName: partialProfile.resumeName ?? currentWorker?.resumeName ?? '',
      identityVerificationProvider: partialProfile.identityVerificationProvider ?? currentWorker?.identityVerificationProvider ?? '',
      identityVerifiedMask: partialProfile.identityVerifiedMask ?? currentWorker?.identityVerifiedMask ?? '',
      identityVerificationStatus: partialProfile.identityVerificationStatus ?? currentWorker?.identityVerificationStatus ?? 'Not Started',
      digilockerLinked: partialProfile.digilockerLinked ?? currentWorker?.digilockerLinked ?? false,
      digilockerSharedDocs: partialProfile.digilockerSharedDocs ?? currentWorker?.digilockerSharedDocs ?? [],
      mobileOtpVerified: partialProfile.mobileOtpVerified ?? currentWorker?.mobileOtpVerified ?? false,
      emailVerified: partialProfile.emailVerified ?? currentWorker?.emailVerified ?? true,
      profileCompletionPercentage: partialProfile.profileCompletionPercentage ?? currentWorker?.profileCompletionPercentage ?? 35,
      updatedAt: serverTimestamp()
    };

    setWorkerProfile(merged);
    workerProfileRef.current = merged;

    if (merged.fullName || merged.phone || merged.profilePhoto || merged.preferredLanguage) {
      setUserProfile((prev) => {
        if (!prev) return prev;
        const next = {
          ...prev,
          name: merged.fullName || prev.name,
          phone: merged.phone || prev.phone,
          profilePhoto: merged.profilePhoto || prev.profilePhoto,
          preferredLanguage: merged.preferredLanguage || prev.preferredLanguage
        };
        userProfileRef.current = next;
        try {
          localStorage.setItem(`jobsetu_user_${uid}`, JSON.stringify(next));
        } catch {}
        return next;
      });
    }
    try {
      localStorage.setItem(`jobsetu_worker_${uid}`, JSON.stringify(merged));
    } catch {}

    await Promise.allSettled([
      withTimeout(setDoc(doc(db, 'workerProfiles', uid), stripUndefined(merged), { merge: true }), 2500),
      withTimeout(setDoc(doc(db, 'jobSeekers', uid), stripUndefined(merged), { merge: true }), 2500),
      withTimeout(
        setDoc(
          doc(db, 'users', uid),
          stripUndefined({
            name: merged.fullName || undefined,
            phone: merged.phone || undefined,
            profilePhoto: merged.profilePhoto || undefined,
            preferredLanguage: merged.preferredLanguage || undefined,
            updatedAt: serverTimestamp()
          }),
          { merge: true }
        ),
        2500
      )
    ]);
  };

  const saveWorkerProfile = async (profileData: Omit<WorkerProfile, 'uid' | 'submittedAt' | 'updatedAt'>) => {
    if (!currentUser) throw new Error('You must be logged in to save a profile.');
    const workerRef = doc(db, 'workerProfiles', currentUser.uid);
    const jobSeekerRef = doc(db, 'jobSeekers', currentUser.uid);
    const fullWorkerData: WorkerProfile = {
      ...profileData,
      uid: currentUser.uid,
      submittedAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    setWorkerProfile(fullWorkerData);
    setUserProfile((prev) => {
      const next = prev
        ? {
            ...prev,
            name: profileData.fullName,
            phone: profileData.phone || prev.phone,
            profilePhoto: profileData.profilePhoto || prev.profilePhoto,
            preferredLanguage: profileData.preferredLanguage || prev.preferredLanguage,
            onboardingCompleted: true
          }
        : null;
      if (next) {
        try {
          localStorage.setItem(`jobsetu_user_${currentUser.uid}`, JSON.stringify(next));
        } catch {}
      }
      return next;
    });
    try {
      localStorage.setItem(`jobsetu_worker_${currentUser.uid}`, JSON.stringify(fullWorkerData));
    } catch {}

    const userRef = doc(db, 'users', currentUser.uid);
    await Promise.allSettled([
      withTimeout(setDoc(workerRef, stripUndefined(fullWorkerData), { merge: true }), 3000),
      withTimeout(setDoc(jobSeekerRef, stripUndefined(fullWorkerData), { merge: true }), 3000),
      withTimeout(
        setDoc(
          userRef,
          stripUndefined({
            name: profileData.fullName,
            phone: profileData.phone || userProfile?.phone || '',
            profilePhoto: profileData.profilePhoto || userProfile?.profilePhoto || '',
            preferredLanguage: profileData.preferredLanguage || userProfile?.preferredLanguage || 'English',
            onboardingCompleted: true,
            updatedAt: serverTimestamp()
          }),
          { merge: true }
        ),
        3000
      )
    ]);
  };

  const saveDraftEmployerProfile = async (partialProfile: Partial<EmployerProfile>) => {
    if (!currentUser) return;
    const uid = currentUser.uid;
    const currentEmp = employerProfileRef.current;
    const currentUserProf = userProfileRef.current;

    const merged: EmployerProfile = {
      ...(currentEmp || {}),
      ...partialProfile,
      uid,
      ownerName: partialProfile.ownerName ?? currentEmp?.ownerName ?? currentUserProf?.name ?? '',
      ownerProfilePhoto: partialProfile.ownerProfilePhoto ?? currentEmp?.ownerProfilePhoto ?? currentUserProf?.profilePhoto ?? '',
      ownerEmail: partialProfile.ownerEmail ?? currentEmp?.ownerEmail ?? currentUserProf?.email ?? currentUser.email ?? '',
      ownerPhone: partialProfile.ownerPhone ?? currentEmp?.ownerPhone ?? currentUserProf?.phone ?? '',
      designation: partialProfile.designation ?? currentEmp?.designation ?? 'Owner',
      preferredLanguage: partialProfile.preferredLanguage ?? currentEmp?.preferredLanguage ?? currentUserProf?.preferredLanguage ?? 'Hindi (हिन्दी)',
      ownerContactAddress: partialProfile.ownerContactAddress ?? currentEmp?.ownerContactAddress ?? '',
      businessName: partialProfile.businessName ?? currentEmp?.businessName ?? '',
      businessLogo: partialProfile.businessLogo ?? currentEmp?.businessLogo ?? '',
      businessCategory: partialProfile.businessCategory ?? currentEmp?.businessCategory ?? 'Construction',
      businessDescription: partialProfile.businessDescription ?? currentEmp?.businessDescription ?? '',
      yearOfEstablishment: partialProfile.yearOfEstablishment ?? currentEmp?.yearOfEstablishment ?? '',
      companySize: partialProfile.companySize ?? currentEmp?.companySize ?? '11–50 Employees',
      companyRegistrationType: partialProfile.companyRegistrationType ?? currentEmp?.companyRegistrationType ?? 'Sole Proprietorship',
      documentNumber: partialProfile.documentNumber ?? currentEmp?.documentNumber ?? '',
      website: partialProfile.website ?? currentEmp?.website ?? '',
      companyRegistrationDocuments: partialProfile.companyRegistrationDocuments ?? currentEmp?.companyRegistrationDocuments ?? [],
      businessImages: partialProfile.businessImages ?? currentEmp?.businessImages ?? [],
      boardGstinVerifiedByAI: partialProfile.boardGstinVerifiedByAI ?? currentEmp?.boardGstinVerifiedByAI ?? false,
      aiBoardVerificationSummary: partialProfile.aiBoardVerificationSummary ?? currentEmp?.aiBoardVerificationSummary ?? '',
      country: partialProfile.country ?? currentEmp?.country ?? 'India',
      state: partialProfile.state ?? currentEmp?.state ?? '',
      district: partialProfile.district ?? currentEmp?.district ?? '',
      city: partialProfile.city ?? currentEmp?.city ?? '',
      area: partialProfile.area ?? currentEmp?.area ?? '',
      businessAddress: partialProfile.businessAddress ?? currentEmp?.businessAddress ?? '',
      pincode: partialProfile.pincode ?? currentEmp?.pincode ?? '',
      worksiteLocation: partialProfile.worksiteLocation ?? currentEmp?.worksiteLocation ?? '',
      lat: partialProfile.lat ?? currentEmp?.lat,
      lng: partialProfile.lng ?? currentEmp?.lng,
      multipleWorkLocations: partialProfile.multipleWorkLocations ?? currentEmp?.multipleWorkLocations ?? [],
      discoveryRadiusKm: partialProfile.discoveryRadiusKm ?? currentEmp?.discoveryRadiusKm ?? 50,
      workforceTypesNeeded: partialProfile.workforceTypesNeeded ?? currentEmp?.workforceTypesNeeded ?? [],
      labourRequirementDetails: partialProfile.labourRequirementDetails ?? currentEmp?.labourRequirementDetails,
      salaryAndBenefits: partialProfile.salaryAndBenefits ?? currentEmp?.salaryAndBenefits,
      workingConditions: partialProfile.workingConditions ?? currentEmp?.workingConditions,
      hiringPreferences: partialProfile.hiringPreferences ?? currentEmp?.hiringPreferences,
      mobileOtpVerified: partialProfile.mobileOtpVerified ?? currentEmp?.mobileOtpVerified ?? false,
      emailVerified: partialProfile.emailVerified ?? currentEmp?.emailVerified ?? Boolean(currentUser.emailVerified),
      phoneVerified: Boolean(partialProfile.mobileOtpVerified || currentEmp?.mobileOtpVerified || partialProfile.ownerPhone || currentEmp?.ownerPhone || currentUser.phoneNumber),
      companyDocumentVerified: partialProfile.companyDocumentVerified ?? currentEmp?.companyDocumentVerified ?? false,
      gstinVerified: partialProfile.gstinVerified ?? currentEmp?.gstinVerified ?? false,
      authorizedVerificationProvider: partialProfile.authorizedVerificationProvider ?? currentEmp?.authorizedVerificationProvider ?? '',
      authorizedVerificationRef: partialProfile.authorizedVerificationRef ?? currentEmp?.authorizedVerificationRef ?? '',
      verificationStatus:
        partialProfile.verificationStatus ??
        currentEmp?.verificationStatus ??
        'Verification Required',
      profileCompletionPercentage: partialProfile.profileCompletionPercentage ?? currentEmp?.profileCompletionPercentage ?? 35,
      updatedAt: serverTimestamp()
    };

    setEmployerProfile(merged);
    employerProfileRef.current = merged;

    if (merged.ownerName || merged.ownerPhone || merged.businessLogo || merged.ownerProfilePhoto || merged.preferredLanguage) {
      setUserProfile((prev) => {
        if (!prev) return prev;
        const next = {
          ...prev,
          name: merged.ownerName || prev.name,
          phone: merged.ownerPhone || prev.phone,
          profilePhoto: merged.businessLogo || merged.ownerProfilePhoto || prev.profilePhoto,
          preferredLanguage: merged.preferredLanguage || prev.preferredLanguage
        };
        userProfileRef.current = next;
        try {
          localStorage.setItem(`jobsetu_user_${uid}`, JSON.stringify(next));
        } catch {}
        return next;
      });
    }
    try {
      localStorage.setItem(`jobsetu_employer_${uid}`, JSON.stringify(merged));
    } catch (storageErr) {
      console.warn('[JOBSETU] Notice saving employer cache to localStorage:', storageErr);
    }

    await Promise.allSettled([
      withTimeout(setDoc(doc(db, 'employerProfiles', uid), stripUndefined(merged), { merge: true }), 2500),
      withTimeout(setDoc(doc(db, 'employers', uid), stripUndefined(merged), { merge: true }), 2500),
      withTimeout(
        setDoc(
          doc(db, 'users', uid),
          stripUndefined({
            name: merged.ownerName || undefined,
            phone: merged.ownerPhone || undefined,
            profilePhoto: merged.businessLogo || merged.ownerProfilePhoto || undefined,
            preferredLanguage: merged.preferredLanguage || undefined,
            updatedAt: serverTimestamp()
          }),
          { merge: true }
        ),
        2500
      )
    ]);
  };

  const saveEmployerProfile = async (
    profileData: Omit<EmployerProfile, 'uid' | 'submittedAt' | 'updatedAt'>
  ) => {
    if (!currentUser) throw new Error('You must be logged in to save an employer profile.');
    const empRef = doc(db, 'employerProfiles', currentUser.uid);
    const employersColRef = doc(db, 'employers', currentUser.uid);

    // Never represent an employer as Verified unless verification succeeded
    const isFullyVerified = Boolean(
      profileData.mobileOtpVerified &&
        (profileData.gstinVerified ||
          profileData.companyDocumentVerified ||
          profileData.boardGstinVerifiedByAI)
    );
    const hasSubmittedDocsOrGstin = Boolean(
      profileData.documentNumber ||
        (profileData.companyRegistrationDocuments && profileData.companyRegistrationDocuments.length > 0) ||
        (profileData.businessImages && profileData.businessImages.length > 0)
    );
    const computedVerificationStatus = isFullyVerified
      ? 'Verified'
      : hasSubmittedDocsOrGstin
      ? 'Pending Verification'
      : 'Verification Required';

    const fullEmployerData: EmployerProfile = {
      ...profileData,
      uid: currentUser.uid,
      verificationStatus: computedVerificationStatus,
      emailVerified: profileData.emailVerified ?? !!currentUser.emailVerified,
      phoneVerified: !!(profileData.mobileOtpVerified || profileData.ownerPhone || currentUser.phoneNumber),
      submittedAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    setEmployerProfile(fullEmployerData);
    employerProfileRef.current = fullEmployerData;

    setUserProfile((prev) => {
      const next = prev
        ? {
            ...prev,
            name: profileData.ownerName,
            phone: profileData.ownerPhone || prev.phone,
            profilePhoto: profileData.businessLogo || profileData.ownerProfilePhoto || prev.profilePhoto,
            preferredLanguage: profileData.preferredLanguage || prev.preferredLanguage,
            onboardingCompleted: true
          }
        : null;
      if (next) {
        userProfileRef.current = next;
        try {
          localStorage.setItem(`jobsetu_user_${currentUser.uid}`, JSON.stringify(next));
        } catch {}
      }
      return next;
    });
    try {
      localStorage.setItem(`jobsetu_employer_${currentUser.uid}`, JSON.stringify(fullEmployerData));
    } catch (storageErr) {
      console.warn('[JOBSETU] Notice saving employer profile to localStorage:', storageErr);
    }

    const userRef = doc(db, 'users', currentUser.uid);
    await Promise.allSettled([
      withTimeout(setDoc(empRef, stripUndefined(fullEmployerData), { merge: true }), 3000),
      withTimeout(setDoc(employersColRef, stripUndefined(fullEmployerData), { merge: true }), 3000),
      withTimeout(
        setDoc(
          userRef,
          stripUndefined({
            name: profileData.ownerName,
            phone: profileData.ownerPhone || userProfile?.phone || '',
            profilePhoto: profileData.businessLogo || profileData.ownerProfilePhoto || userProfile?.profilePhoto || '',
            preferredLanguage: profileData.preferredLanguage || userProfile?.preferredLanguage || 'English',
            onboardingCompleted: true,
            updatedAt: serverTimestamp()
          }),
          { merge: true }
        ),
        3000
      )
    ]);
  };

  const refreshProfile = async () => {
    if (currentUser) {
      await fetchUserData(currentUser);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        userProfile,
        workerProfile,
        employerProfile,
        loading,
        intendedRole,
        setIntendedRole: updateIntendedRole,
        loginWithGoogle,
        loginWithEmail,
        registerWithEmail,
        sendPhoneOtp,
        verifyPhoneOtp,
        sendPasswordReset,
        logout,
        switchActiveRole,
        enableAdditionalRole,
        setInitialRole,
        saveWorkerProfile,
        saveDraftWorkerProfile,
        saveEmployerProfile,
        saveDraftEmployerProfile,
        refreshProfile
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
