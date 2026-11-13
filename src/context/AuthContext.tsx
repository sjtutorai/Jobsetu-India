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
  onSnapshot,
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
  updateUserLocation: (
    role: UserRole,
    location: {
      state: string;
      district?: string;
      city: string;
      area?: string;
      pincode: string;
      address?: string;
      lat?: number;
      lng?: number;
      searchRadiusKm?: number;
      addToPreferredLocations?: boolean;
    }
  ) => Promise<void>;
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

function isPlainObject(val: unknown): val is Record<string, any> {
  if (!val || typeof val !== 'object') return false;
  const proto = Object.getPrototypeOf(val);
  return proto === Object.prototype || proto === null;
}

function stripUndefined<T>(obj: T): T {
  if (Array.isArray(obj)) {
    return obj
      .filter((item) => item !== undefined)
      .map((item) => stripUndefined(item)) as unknown as T;
  }
  if (isPlainObject(obj)) {
    const out: Record<string, any> = {};
    for (const [k, v] of Object.entries(obj)) {
      if (v === undefined) continue;
      out[k] = stripUndefined(v);
    }
    return out as T;
  }
  return obj;
}

function fitDocForFirestore<T extends Record<string, any>>(payload: T): Record<string, any> {
  const cleaned: Record<string, any> = stripUndefined({ ...payload });
  try {
    const approxBytes = new Blob([JSON.stringify(cleaned)]).size;
    if (approxBytes <= 880_000) {
      return cleaned;
    }
    // Trim heaviest base64 attachment fields if payload approaches Firestore's 1 MiB limit
    const trimOrder = [
      'workPortfolioImages',
      'businessImages',
      'educationCertificates',
      'skillCertificates',
      'companyRegistrationDocuments',
      'resumeUrl'
    ];
    for (const key of trimOrder) {
      if (key in cleaned) {
        if (Array.isArray(cleaned[key]) && cleaned[key].length > 0) {
          cleaned[key] = [];
        } else if (typeof cleaned[key] === 'string' && cleaned[key].length > 100_000) {
          cleaned[key] = '';
        }
        if (new Blob([JSON.stringify(cleaned)]).size <= 880_000) {
          break;
        }
      }
    }
    console.warn('[JOBSETU] Trimmed oversized binary attachments so profile core fields persist within Firestore 1MB limit.');
  } catch {
    // ignore size check errors
  }
  return cleaned;
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
  const currentUserRef = useRef<FirebaseUser | null>(null);
  const userProfileRef = useRef<UserProfile | null>(null);
  const workerProfileRef = useRef<WorkerProfile | null>(null);
  const employerProfileRef = useRef<EmployerProfile | null>(null);

  const setAuthUser = (user: FirebaseUser | null) => {
    currentUserRef.current = user;
    setCurrentUser(user);
  };

  const getActiveUser = (): FirebaseUser | null => {
    return currentUserRef.current || auth.currentUser || currentUser;
  };

  useEffect(() => {
    currentUserRef.current = currentUser;
  }, [currentUser]);

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
      let userSnap: any;
      let userFetchFailed = false;
      try {
        userSnap = await withTimeout(getDoc(userRef), 5500);
      } catch (err: any) {
        userFetchFailed = true;
        console.warn('[JOBSETU] Warning fetching user document (using cached fallback):', err?.message);
      }

      // Also fetch worker (from workerProfiles or jobSeekers) & employer (from employerProfiles or employers) in parallel
      let fetchedWorker: WorkerProfile | null = localCachedWorker;
      let fetchedEmployer: EmployerProfile | null = localCachedEmp;

      await Promise.allSettled([
        withTimeout(getDoc(doc(db, 'workerProfiles', uid)), 5000)
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
        withTimeout(getDoc(doc(db, 'jobSeekers', uid)), 5000)
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
        withTimeout(getDoc(doc(db, 'employerProfiles', uid)), 5000)
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
        withTimeout(getDoc(doc(db, 'employers', uid)), 5000)
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

      let cachedProfile: UserProfile | null = userProfileRef.current?.uid === uid ? userProfileRef.current : null;
      try {
        const raw = localStorage.getItem(cachedUserKey);
        if (raw) {
          cachedProfile = mergePreservingNonEmpty<UserProfile>(cachedProfile, JSON.parse(raw));
        }
      } catch {
        // ignore
      }

      if (userSnap && userSnap.exists()) {
        profileData = mergePreservingNonEmpty<UserProfile>(cachedProfile, userSnap.data() as UserProfile);
        // Always trust saved activeRole across devices
        if (!profileData.activeRole) {
          if (profileData.enabledRoles?.includes('employer') && !profileData.enabledRoles?.includes('worker')) {
            profileData.activeRole = 'employer';
          } else if (fetchedEmployer && !fetchedWorker) {
            profileData.activeRole = 'employer';
          } else {
            profileData.activeRole = fallbackRole || cachedProfile?.activeRole || 'worker';
          }
        }
      } else if (userFetchFailed) {
        // Fetch failed/timed out: NEVER overwrite existing remote user doc or localStorage with blank defaults!
        const inferredRole: UserRole =
          cachedProfile?.activeRole ||
          (fetchedEmployer && !fetchedWorker ? 'employer' : fallbackRole || intendedRole || 'worker');
        profileData = cachedProfile || {
          uid,
          name:
            fetchedEmployer?.ownerName ||
            fetchedWorker?.fullName ||
            firebaseUser.displayName ||
            (firebaseUser.email ? firebaseUser.email.split('@')[0] : 'User'),
          email: fetchedEmployer?.ownerEmail || fetchedWorker?.email || firebaseUser.email || '',
          phone: fetchedEmployer?.ownerPhone || fetchedWorker?.phone || firebaseUser.phoneNumber || '',
          enabledRoles: [inferredRole],
          activeRole: inferredRole,
          profilePhoto: fetchedEmployer?.ownerProfilePhoto || fetchedWorker?.profilePhoto || firebaseUser.photoURL || '',
          preferredLanguage: fetchedEmployer?.preferredLanguage || fetchedWorker?.preferredLanguage || 'English',
          accountStatus: 'active',
          onboardingCompleted: Boolean(
            fetchedEmployer?.businessName || (fetchedWorker?.skills && fetchedWorker.skills.length > 0)
          )
        };
      } else {
        isNewUser = true;

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

        setDoc(userRef, fitDocForFirestore(newProfile), { merge: true }).catch((err) => {
          handleFirestoreError(err, OperationType.CREATE, `users/${uid}`);
        });

        profileData = newProfile;
      }

      const resolvedRole: UserRole = profileData.activeRole || 'worker';
      updateIntendedRole(resolvedRole);
      setUserProfile(profileData);
      userProfileRef.current = profileData;

      if (!userFetchFailed || cachedProfile) {
        try {
          localStorage.setItem(cachedUserKey, JSON.stringify(profileData));
        } catch {
          // ignore
        }
      }

      return { role: resolvedRole, isNewUser };
    } catch (error) {
      console.warn('Error fetching user records:', error);
      return { role: fallbackRole || intendedRole || 'worker', isNewUser: false };
    }
  };

  // Real-time Firestore profile sync whenever a user is authenticated
  useEffect(() => {
    const uid = currentUser?.uid;
    if (!uid) return;

    const cachedUserKey = `jobsetu_user_${uid}`;
    const cachedWorkerKey = `jobsetu_worker_${uid}`;
    const cachedEmployerKey = `jobsetu_employer_${uid}`;

    const unsubUser = onSnapshot(
      doc(db, 'users', uid),
      (snap) => {
        if (!snap.exists()) return;
        const remote = snap.data() as Partial<UserProfile>;
        const merged = mergePreservingNonEmpty<UserProfile>(userProfileRef.current, remote);
        // Ensure Firestore's persisted activeRole / enabledRoles / onboardingCompleted are honored
        if (remote.activeRole) merged.activeRole = remote.activeRole;
        if (remote.enabledRoles && remote.enabledRoles.length > 0) merged.enabledRoles = remote.enabledRoles;
        if (typeof remote.onboardingCompleted === 'boolean') merged.onboardingCompleted = remote.onboardingCompleted;

        userProfileRef.current = merged;
        setUserProfile(merged);
        if (merged.activeRole) {
          updateIntendedRole(merged.activeRole);
        }
        try {
          localStorage.setItem(cachedUserKey, JSON.stringify(merged));
        } catch {}
      },
      (err) => {
        handleFirestoreError(err, OperationType.GET, `users/${uid}`);
      }
    );

    const handleWorkerSnapshot = (snap: any, pathLabel: string) => {
      if (!snap.exists()) return;
      const remote = snap.data() as Partial<WorkerProfile>;
      const merged = mergePreservingNonEmpty<WorkerProfile>(workerProfileRef.current, remote);
      workerProfileRef.current = merged;
      setWorkerProfile(merged);
      try {
        localStorage.setItem(cachedWorkerKey, JSON.stringify(merged));
      } catch {}
      void pathLabel;
    };

    const unsubWorker = onSnapshot(
      doc(db, 'workerProfiles', uid),
      (snap) => handleWorkerSnapshot(snap, `workerProfiles/${uid}`),
      (err) => handleFirestoreError(err, OperationType.GET, `workerProfiles/${uid}`)
    );

    const unsubJobSeeker = onSnapshot(
      doc(db, 'jobSeekers', uid),
      (snap) => handleWorkerSnapshot(snap, `jobSeekers/${uid}`),
      (err) => handleFirestoreError(err, OperationType.GET, `jobSeekers/${uid}`)
    );

    const handleEmployerSnapshot = (snap: any, pathLabel: string) => {
      if (!snap.exists()) return;
      const remote = snap.data() as Partial<EmployerProfile>;
      const merged = mergePreservingNonEmpty<EmployerProfile>(employerProfileRef.current, remote);
      employerProfileRef.current = merged;
      setEmployerProfile(merged);
      try {
        localStorage.setItem(cachedEmployerKey, JSON.stringify(merged));
      } catch {}
      void pathLabel;
    };

    const unsubEmployer = onSnapshot(
      doc(db, 'employerProfiles', uid),
      (snap) => handleEmployerSnapshot(snap, `employerProfiles/${uid}`),
      (err) => handleFirestoreError(err, OperationType.GET, `employerProfiles/${uid}`)
    );

    const unsubEmployersCol = onSnapshot(
      doc(db, 'employers', uid),
      (snap) => handleEmployerSnapshot(snap, `employers/${uid}`),
      (err) => handleFirestoreError(err, OperationType.GET, `employers/${uid}`)
    );

    return () => {
      unsubUser();
      unsubWorker();
      unsubJobSeeker();
      unsubEmployer();
      unsubEmployersCol();
    };
  }, [currentUser?.uid]);

  useEffect(() => {
    const safetyTimer = setTimeout(() => {
      setLoading(false);
    }, 9000);

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (isManualAuthInProgress.current) {
        return;
      }
      try {
        if (firebaseUser) {
          localStorage.removeItem(ACTIVE_LOCAL_USER_KEY);
          await fetchUserData(firebaseUser);
          setAuthUser(firebaseUser);
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
              setAuthUser(syntheticUser);
              setLoading(false);
              clearTimeout(safetyTimer);
              return;
            }
          } catch {
            // ignore
          }
          setAuthUser(null);
          userProfileRef.current = null;
          workerProfileRef.current = null;
          employerProfileRef.current = null;
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
          setAuthUser(result.user);
          return { role, isNewUser };
        }
        setAuthUser(result.user);
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
        setAuthUser(result.user);
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
          const snap = await withTimeout(getDoc(userRef), 3500);
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
        setAuthUser(syntheticUser);
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
        setDoc(empRef, fitDocForFirestore(draftEmployer), { merge: true }),
        setDoc(employersColRef, fitDocForFirestore(draftEmployer), { merge: true })
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
        setDoc(workerRef, fitDocForFirestore(draftWorker), { merge: true }),
        setDoc(jobSeekerRef, fitDocForFirestore(draftWorker), { merge: true })
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
        await setDoc(userRef, fitDocForFirestore(newProfile), { merge: true }).catch((e) => {
          handleFirestoreError(e, OperationType.CREATE, `users/${result.user.uid}`);
        });
        await createInitialRoleDraftInFirestore(result.user.uid, role, cleanName, cleanEmail, cleanPhone);
        userProfileRef.current = newProfile;
        setUserProfile(newProfile);
        try {
          localStorage.setItem(`jobsetu_user_${result.user.uid}`, JSON.stringify(newProfile));
        } catch {}
        setAuthUser(result.user);
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
          const existingSnap = await withTimeout(getDoc(doc(db, 'users', safeUid)), 2500);
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
        await setDoc(userRef, fitDocForFirestore(newProfile), { merge: true }).catch((e) => {
          handleFirestoreError(e, OperationType.CREATE, `users/${safeUid}`);
        });
        await createInitialRoleDraftInFirestore(safeUid, role, cleanName, cleanEmail, cleanPhone);
        userProfileRef.current = newProfile;
        setUserProfile(newProfile);
        try {
          localStorage.setItem(`jobsetu_user_${safeUid}`, JSON.stringify(newProfile));
        } catch {}
        setAuthUser(syntheticUser);
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
      setAuthUser(result.user);
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
    setAuthUser(null);
    userProfileRef.current = null;
    workerProfileRef.current = null;
    employerProfileRef.current = null;
    setUserProfile(null);
    setWorkerProfile(null);
    setEmployerProfile(null);
  };

  const switchActiveRole = async (role: UserRole) => {
    const activeUser = getActiveUser();
    const activeProf = userProfileRef.current || userProfile;
    if (!activeUser || !activeProf) return;
    if (!activeProf.enabledRoles?.includes(role)) {
      throw new Error(`Role ${role} is not activated on this account.`);
    }
    if (activeProf.activeRole === role) return;

    const updatedUser = { ...activeProf, activeRole: role };
    userProfileRef.current = updatedUser;
    setUserProfile(updatedUser);
    updateIntendedRole(role);
    try {
      localStorage.setItem(`jobsetu_user_${activeUser.uid}`, JSON.stringify(updatedUser));
      const rawSession = localStorage.getItem(ACTIVE_LOCAL_USER_KEY);
      if (rawSession) {
        const session = JSON.parse(rawSession) as StoredEmailAccount;
        session.role = role;
        saveStoredEmailAccount(session);
        localStorage.setItem(ACTIVE_LOCAL_USER_KEY, JSON.stringify(session));
      }
    } catch {}

    const userRef = doc(db, 'users', activeUser.uid);
    withTimeout(
      setDoc(
        userRef,
        {
          uid: activeUser.uid,
          activeRole: role,
          updatedAt: serverTimestamp()
        },
        { merge: true }
      ),
      6000
    ).catch((err) => {
      handleFirestoreError(err, OperationType.UPDATE, `users/${activeUser.uid}`);
    });
  };

  const enableAdditionalRole = async (role: UserRole) => {
    const activeUser = getActiveUser();
    const activeProf = userProfileRef.current || userProfile;
    if (!activeUser) return;
    const currentEnabled = activeProf?.enabledRoles || [];
    const updatedRoles: UserRole[] = currentEnabled.includes(role) ? currentEnabled : [...currentEnabled, role];
    const updatedUser: UserProfile = activeProf
      ? { ...activeProf, enabledRoles: updatedRoles, activeRole: role }
      : {
          uid: activeUser.uid,
          name: activeUser.displayName || 'User',
          email: activeUser.email || '',
          phone: activeUser.phoneNumber || '',
          enabledRoles: updatedRoles,
          activeRole: role,
          accountStatus: 'active',
          onboardingCompleted: false
        };
    userProfileRef.current = updatedUser;
    setUserProfile(updatedUser);
    updateIntendedRole(role);
    try {
      localStorage.setItem(`jobsetu_user_${activeUser.uid}`, JSON.stringify(updatedUser));
    } catch {}

    const userRef = doc(db, 'users', activeUser.uid);
    withTimeout(
      setDoc(
        userRef,
        {
          uid: activeUser.uid,
          enabledRoles: updatedRoles,
          activeRole: role,
          updatedAt: serverTimestamp()
        },
        { merge: true }
      ),
      6000
    ).catch((err) => {
      handleFirestoreError(err, OperationType.UPDATE, `users/${activeUser.uid}`);
    });
  };

  const setInitialRoleForUid = async (uid: string, role: UserRole, name: string, email: string, phone = '') => {
    updateIntendedRole(role);
    const prev = userProfileRef.current;
    const next: UserProfile = prev
      ? { ...prev, uid, enabledRoles: [role], activeRole: role }
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
    userProfileRef.current = next;
    setUserProfile(next);
    try {
      localStorage.setItem(`jobsetu_user_${uid}`, JSON.stringify(next));
    } catch {}

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
        fitDocForFirestore({
          uid,
          name: next.name,
          email: next.email,
          phone: next.phone || '',
          enabledRoles: [role],
          activeRole: role,
          accountStatus: 'active',
          updatedAt: serverTimestamp()
        }),
        { merge: true }
      ),
      6000
    ).catch((err) => {
      handleFirestoreError(err, OperationType.UPDATE, `users/${uid}`);
    });

    await createInitialRoleDraftInFirestore(uid, role, name, email, phone);
  };

  const setInitialRole = async (role: UserRole) => {
    const activeUser = getActiveUser();
    if (!activeUser) return;
    const activeProf = userProfileRef.current || userProfile;
    await setInitialRoleForUid(
      activeUser.uid,
      role,
      activeProf?.name || activeUser.displayName || '',
      activeProf?.email || activeUser.email || '',
      activeProf?.phone || activeUser.phoneNumber || ''
    );
  };

  const buildSyncedUserProfilePatch = (
    activeUser: FirebaseUser,
    role: UserRole,
    details: {
      name?: string;
      email?: string;
      phone?: string;
      profilePhoto?: string;
      preferredLanguage?: string;
      onboardingCompleted?: boolean;
    }
  ): UserProfile => {
    const prev = userProfileRef.current;
    const prevRoles = prev?.enabledRoles || [];
    const enabledRoles: UserRole[] = prevRoles.includes(role) ? prevRoles : [...prevRoles, role];
    return {
      uid: activeUser.uid,
      name: details.name || prev?.name || activeUser.displayName || 'User',
      email: details.email || prev?.email || activeUser.email || '',
      phone: details.phone || prev?.phone || activeUser.phoneNumber || '',
      enabledRoles,
      activeRole: prev?.activeRole || role,
      profilePhoto: details.profilePhoto || prev?.profilePhoto || activeUser.photoURL || '',
      preferredLanguage: details.preferredLanguage || prev?.preferredLanguage || 'English',
      accountStatus: prev?.accountStatus || 'active',
      onboardingCompleted: details.onboardingCompleted ?? prev?.onboardingCompleted ?? false
    };
  };

  const saveDraftWorkerProfile = async (partialProfile: Partial<WorkerProfile>) => {
    const activeUser = getActiveUser();
    if (!activeUser) return;
    const uid = activeUser.uid;
    let currentWorker = workerProfileRef.current;
    if (!currentWorker) {
      try {
        const raw = localStorage.getItem(`jobsetu_worker_${uid}`);
        if (raw) currentWorker = JSON.parse(raw);
      } catch {}
    }
    const currentUserProf = userProfileRef.current;

    const baseDefaults: WorkerProfile = {
      uid,
      fullName: currentWorker?.fullName || currentUserProf?.name || activeUser.displayName || '',
      phone: currentWorker?.phone || currentUserProf?.phone || activeUser.phoneNumber || '',
      email: currentWorker?.email || currentUserProf?.email || activeUser.email || '',
      dateOfBirth: currentWorker?.dateOfBirth || '',
      ageEligibilityConfirmed: currentWorker?.ageEligibilityConfirmed ?? true,
      gender: currentWorker?.gender || 'male',
      profilePhoto: currentWorker?.profilePhoto || currentUserProf?.profilePhoto || '',
      isPhotoVerifiedReal: currentWorker?.isPhotoVerifiedReal ?? true,
      currentAddress: currentWorker?.currentAddress || '',
      country: 'India',
      state: currentWorker?.state || '',
      district: currentWorker?.district || '',
      city: currentWorker?.city || '',
      area: currentWorker?.area || '',
      pincode: currentWorker?.pincode || '',
      lat: currentWorker?.lat,
      lng: currentWorker?.lng,
      preferredLanguage: currentWorker?.preferredLanguage || currentUserProf?.preferredLanguage || 'Hindi (हिन्दी)',
      emergencyContactName: currentWorker?.emergencyContactName || '',
      emergencyContactPhone: currentWorker?.emergencyContactPhone || '',
      emergencyContactRelation: currentWorker?.emergencyContactRelation || '',
      preferredLocations: currentWorker?.preferredLocations || [],
      education: currentWorker?.education || 'Higher secondary',
      schoolOrCollegeName: currentWorker?.schoolOrCollegeName || '',
      passingYear: currentWorker?.passingYear || '',
      additionalQualifications: currentWorker?.additionalQualifications || '',
      educationCertificates: currentWorker?.educationCertificates || [],
      selectedProfessions: currentWorker?.selectedProfessions || [],
      customProfession: currentWorker?.customProfession || '',
      skills: currentWorker?.skills || [],
      customSkills: currentWorker?.customSkills || [],
      experience: currentWorker?.experience || 'Fresher',
      previousCompanyName: currentWorker?.previousCompanyName || '',
      previousJobRole: currentWorker?.previousJobRole || '',
      workPortfolioUrl: currentWorker?.workPortfolioUrl || '',
      workPortfolioDescription: currentWorker?.workPortfolioDescription || '',
      workPortfolioImages: currentWorker?.workPortfolioImages || [],
      skillCertificates: currentWorker?.skillCertificates || [],
      jobPreferences: mergePreservingNonEmpty(
        currentWorker?.jobPreferences || {
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
        partialProfile.jobPreferences
      ),
      resumeUrl: currentWorker?.resumeUrl || '',
      resumeName: currentWorker?.resumeName || '',
      identityVerificationProvider: currentWorker?.identityVerificationProvider || '',
      identityVerifiedMask: currentWorker?.identityVerifiedMask || '',
      identityVerificationStatus: currentWorker?.identityVerificationStatus || 'Not Started',
      digilockerLinked: currentWorker?.digilockerLinked ?? false,
      digilockerSharedDocs: currentWorker?.digilockerSharedDocs || [],
      mobileOtpVerified: currentWorker?.mobileOtpVerified ?? false,
      emailVerified: currentWorker?.emailVerified ?? true,
      profileCompletionPercentage: currentWorker?.profileCompletionPercentage ?? 35
    };

    const merged: WorkerProfile = {
      ...mergePreservingNonEmpty<WorkerProfile>(baseDefaults, partialProfile),
      uid,
      jobPreferences: baseDefaults.jobPreferences,
      updatedAt: serverTimestamp()
    };

    workerProfileRef.current = merged;
    setWorkerProfile(merged);

    const nextUser = buildSyncedUserProfilePatch(activeUser, 'worker', {
      name: merged.fullName,
      email: merged.email,
      phone: merged.phone,
      profilePhoto: merged.profilePhoto,
      preferredLanguage: merged.preferredLanguage
    });
    userProfileRef.current = nextUser;
    setUserProfile(nextUser);

    try {
      localStorage.setItem(`jobsetu_user_${uid}`, JSON.stringify(nextUser));
    } catch {}
    try {
      localStorage.setItem(`jobsetu_worker_${uid}`, JSON.stringify(merged));
    } catch (storageErr) {
      console.warn('[JOBSETU] Notice saving worker draft to localStorage:', storageErr);
    }

    const sanitizedWorker = fitDocForFirestore(merged);
    const sanitizedUser = fitDocForFirestore({ ...nextUser, updatedAt: serverTimestamp() });
    const results = await Promise.allSettled([
      withTimeout(setDoc(doc(db, 'workerProfiles', uid), sanitizedWorker, { merge: true }), 8000),
      withTimeout(setDoc(doc(db, 'jobSeekers', uid), sanitizedWorker, { merge: true }), 8000),
      withTimeout(setDoc(doc(db, 'users', uid), sanitizedUser, { merge: true }), 8000)
    ]);
    results.forEach((res, idx) => {
      if (res.status === 'rejected') {
        const col = idx === 0 ? `workerProfiles/${uid}` : idx === 1 ? `jobSeekers/${uid}` : `users/${uid}`;
        handleFirestoreError(res.reason, OperationType.WRITE, col);
      }
    });
  };

  const saveWorkerProfile = async (profileData: Omit<WorkerProfile, 'uid' | 'submittedAt' | 'updatedAt'>) => {
    const activeUser = getActiveUser();
    if (!activeUser) throw new Error('You must be logged in to save a profile.');
    const uid = activeUser.uid;
    const workerRef = doc(db, 'workerProfiles', uid);
    const jobSeekerRef = doc(db, 'jobSeekers', uid);
    const fullWorkerData: WorkerProfile = {
      ...profileData,
      uid,
      submittedAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    workerProfileRef.current = fullWorkerData;
    setWorkerProfile(fullWorkerData);

    const nextUser = buildSyncedUserProfilePatch(activeUser, 'worker', {
      name: profileData.fullName,
      email: profileData.email,
      phone: profileData.phone,
      profilePhoto: profileData.profilePhoto,
      preferredLanguage: profileData.preferredLanguage,
      onboardingCompleted: true
    });
    userProfileRef.current = nextUser;
    setUserProfile(nextUser);

    try {
      localStorage.setItem(`jobsetu_user_${uid}`, JSON.stringify(nextUser));
    } catch {}
    try {
      localStorage.setItem(`jobsetu_worker_${uid}`, JSON.stringify(fullWorkerData));
    } catch (storageErr) {
      console.warn('[JOBSETU] Notice saving worker profile to localStorage:', storageErr);
    }

    const userRef = doc(db, 'users', uid);
    const sanitizedWorker = fitDocForFirestore(fullWorkerData);
    const sanitizedUser = fitDocForFirestore({ ...nextUser, updatedAt: serverTimestamp() });
    const results = await Promise.allSettled([
      withTimeout(setDoc(workerRef, sanitizedWorker, { merge: true }), 8000),
      withTimeout(setDoc(jobSeekerRef, sanitizedWorker, { merge: true }), 8000),
      withTimeout(setDoc(userRef, sanitizedUser, { merge: true }), 8000)
    ]);

    let successCount = 0;
    let firstError: any = null;
    results.forEach((res, idx) => {
      if (res.status === 'fulfilled') {
        successCount++;
      } else {
        if (!firstError) firstError = res.reason;
        const col = idx === 0 ? `workerProfiles/${uid}` : idx === 1 ? `jobSeekers/${uid}` : `users/${uid}`;
        handleFirestoreError(res.reason, OperationType.WRITE, col);
      }
    });

    if (successCount === 0 && firstError) {
      const msg = String(firstError?.message || '');
      if (!msg.includes('timed out') && !msg.includes('offline')) {
        throw new Error(`Could not save your profile to Firestore: ${msg}`);
      }
    }
  };

  const saveDraftEmployerProfile = async (partialProfile: Partial<EmployerProfile>) => {
    const activeUser = getActiveUser();
    if (!activeUser) return;
    const uid = activeUser.uid;
    let currentEmp = employerProfileRef.current;
    if (!currentEmp) {
      try {
        const raw = localStorage.getItem(`jobsetu_employer_${uid}`);
        if (raw) currentEmp = JSON.parse(raw);
      } catch {}
    }
    const currentUserProf = userProfileRef.current;

    const baseEmployer: EmployerProfile = {
      uid,
      ownerName: currentEmp?.ownerName || currentUserProf?.name || activeUser.displayName || '',
      ownerProfilePhoto: currentEmp?.ownerProfilePhoto || currentUserProf?.profilePhoto || '',
      ownerEmail: currentEmp?.ownerEmail || currentUserProf?.email || activeUser.email || '',
      ownerPhone: currentEmp?.ownerPhone || currentUserProf?.phone || activeUser.phoneNumber || '',
      designation: currentEmp?.designation || 'Owner',
      preferredLanguage: currentEmp?.preferredLanguage || currentUserProf?.preferredLanguage || 'Hindi (हिन्दी)',
      ownerContactAddress: currentEmp?.ownerContactAddress || '',
      businessName: currentEmp?.businessName || '',
      businessLogo: currentEmp?.businessLogo || '',
      businessCategory: currentEmp?.businessCategory || 'Construction',
      businessDescription: currentEmp?.businessDescription || '',
      yearOfEstablishment: currentEmp?.yearOfEstablishment || '',
      companySize: currentEmp?.companySize || '11–50 Employees',
      companyRegistrationType: currentEmp?.companyRegistrationType || 'Sole Proprietorship',
      documentNumber: currentEmp?.documentNumber || '',
      website: currentEmp?.website || '',
      companyRegistrationDocuments: currentEmp?.companyRegistrationDocuments || [],
      businessImages: currentEmp?.businessImages || [],
      boardGstinVerifiedByAI: currentEmp?.boardGstinVerifiedByAI ?? false,
      aiBoardVerificationSummary: currentEmp?.aiBoardVerificationSummary || '',
      country: currentEmp?.country || 'India',
      state: currentEmp?.state || '',
      district: currentEmp?.district || '',
      city: currentEmp?.city || '',
      area: currentEmp?.area || '',
      businessAddress: currentEmp?.businessAddress || '',
      pincode: currentEmp?.pincode || '',
      worksiteLocation: currentEmp?.worksiteLocation || '',
      lat: currentEmp?.lat,
      lng: currentEmp?.lng,
      multipleWorkLocations: currentEmp?.multipleWorkLocations || [],
      discoveryRadiusKm: currentEmp?.discoveryRadiusKm || 50,
      workforceTypesNeeded: currentEmp?.workforceTypesNeeded || [],
      labourRequirementDetails: currentEmp?.labourRequirementDetails,
      salaryAndBenefits: currentEmp?.salaryAndBenefits,
      workingConditions: currentEmp?.workingConditions,
      hiringPreferences: currentEmp?.hiringPreferences,
      mobileOtpVerified: currentEmp?.mobileOtpVerified ?? false,
      emailVerified: currentEmp?.emailVerified ?? Boolean(activeUser.emailVerified),
      phoneVerified: Boolean(partialProfile.mobileOtpVerified || currentEmp?.mobileOtpVerified || partialProfile.ownerPhone || currentEmp?.ownerPhone || activeUser.phoneNumber),
      companyDocumentVerified: currentEmp?.companyDocumentVerified ?? false,
      gstinVerified: currentEmp?.gstinVerified ?? false,
      authorizedVerificationProvider: currentEmp?.authorizedVerificationProvider || '',
      authorizedVerificationRef: currentEmp?.authorizedVerificationRef || '',
      verificationStatus: currentEmp?.verificationStatus || 'Verification Required',
      profileCompletionPercentage: currentEmp?.profileCompletionPercentage ?? 35
    };

    const merged: EmployerProfile = {
      ...mergePreservingNonEmpty<EmployerProfile>(baseEmployer, partialProfile),
      uid,
      labourRequirementDetails:
        partialProfile.labourRequirementDetails || baseEmployer.labourRequirementDetails
          ? mergePreservingNonEmpty(baseEmployer.labourRequirementDetails as any, partialProfile.labourRequirementDetails as any)
          : undefined,
      salaryAndBenefits:
        partialProfile.salaryAndBenefits || baseEmployer.salaryAndBenefits
          ? mergePreservingNonEmpty(baseEmployer.salaryAndBenefits as any, partialProfile.salaryAndBenefits as any)
          : undefined,
      workingConditions:
        partialProfile.workingConditions || baseEmployer.workingConditions
          ? mergePreservingNonEmpty(baseEmployer.workingConditions as any, partialProfile.workingConditions as any)
          : undefined,
      hiringPreferences:
        partialProfile.hiringPreferences || baseEmployer.hiringPreferences
          ? mergePreservingNonEmpty(baseEmployer.hiringPreferences as any, partialProfile.hiringPreferences as any)
          : undefined,
      updatedAt: serverTimestamp()
    };

    employerProfileRef.current = merged;
    setEmployerProfile(merged);

    const nextUser = buildSyncedUserProfilePatch(activeUser, 'employer', {
      name: merged.ownerName,
      email: merged.ownerEmail,
      phone: merged.ownerPhone,
      profilePhoto: merged.businessLogo || merged.ownerProfilePhoto,
      preferredLanguage: merged.preferredLanguage
    });
    userProfileRef.current = nextUser;
    setUserProfile(nextUser);

    try {
      localStorage.setItem(`jobsetu_user_${uid}`, JSON.stringify(nextUser));
    } catch {}
    try {
      localStorage.setItem(`jobsetu_employer_${uid}`, JSON.stringify(merged));
    } catch (storageErr) {
      console.warn('[JOBSETU] Notice saving employer cache to localStorage:', storageErr);
    }

    const sanitizedEmployer = fitDocForFirestore(merged);
    const sanitizedUser = fitDocForFirestore({ ...nextUser, updatedAt: serverTimestamp() });
    const results = await Promise.allSettled([
      withTimeout(setDoc(doc(db, 'employerProfiles', uid), sanitizedEmployer, { merge: true }), 8000),
      withTimeout(setDoc(doc(db, 'employers', uid), sanitizedEmployer, { merge: true }), 8000),
      withTimeout(setDoc(doc(db, 'users', uid), sanitizedUser, { merge: true }), 8000)
    ]);
    results.forEach((res, idx) => {
      if (res.status === 'rejected') {
        const col = idx === 0 ? `employerProfiles/${uid}` : idx === 1 ? `employers/${uid}` : `users/${uid}`;
        handleFirestoreError(res.reason, OperationType.WRITE, col);
      }
    });
  };

  const saveEmployerProfile = async (
    profileData: Omit<EmployerProfile, 'uid' | 'submittedAt' | 'updatedAt'>
  ) => {
    const activeUser = getActiveUser();
    if (!activeUser) throw new Error('You must be logged in to save an employer profile.');
    const uid = activeUser.uid;
    const empRef = doc(db, 'employerProfiles', uid);
    const employersColRef = doc(db, 'employers', uid);

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
      uid,
      verificationStatus: computedVerificationStatus,
      emailVerified: profileData.emailVerified ?? !!activeUser.emailVerified,
      phoneVerified: !!(profileData.mobileOtpVerified || profileData.ownerPhone || activeUser.phoneNumber),
      submittedAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    employerProfileRef.current = fullEmployerData;
    setEmployerProfile(fullEmployerData);

    const nextUser = buildSyncedUserProfilePatch(activeUser, 'employer', {
      name: profileData.ownerName,
      email: profileData.ownerEmail,
      phone: profileData.ownerPhone,
      profilePhoto: profileData.businessLogo || profileData.ownerProfilePhoto,
      preferredLanguage: profileData.preferredLanguage,
      onboardingCompleted: true
    });
    userProfileRef.current = nextUser;
    setUserProfile(nextUser);

    try {
      localStorage.setItem(`jobsetu_user_${uid}`, JSON.stringify(nextUser));
    } catch {}
    try {
      localStorage.setItem(`jobsetu_employer_${uid}`, JSON.stringify(fullEmployerData));
    } catch (storageErr) {
      console.warn('[JOBSETU] Notice saving employer profile to localStorage:', storageErr);
    }

    const userRef = doc(db, 'users', uid);
    const sanitizedEmployer = fitDocForFirestore(fullEmployerData);
    const sanitizedUser = fitDocForFirestore({ ...nextUser, updatedAt: serverTimestamp() });
    const results = await Promise.allSettled([
      withTimeout(setDoc(empRef, sanitizedEmployer, { merge: true }), 8000),
      withTimeout(setDoc(employersColRef, sanitizedEmployer, { merge: true }), 8000),
      withTimeout(setDoc(userRef, sanitizedUser, { merge: true }), 8000)
    ]);

    let successCount = 0;
    let firstError: any = null;
    results.forEach((res, idx) => {
      if (res.status === 'fulfilled') {
        successCount++;
      } else {
        if (!firstError) firstError = res.reason;
        const col = idx === 0 ? `employerProfiles/${uid}` : idx === 1 ? `employers/${uid}` : `users/${uid}`;
        handleFirestoreError(res.reason, OperationType.WRITE, col);
      }
    });

    if (successCount === 0 && firstError) {
      const msg = String(firstError?.message || '');
      if (!msg.includes('timed out') && !msg.includes('offline')) {
        throw new Error(`Could not save your employer profile to Firestore: ${msg}`);
      }
    }
  };

  const updateUserLocation = async (
    role: UserRole,
    location: {
      state: string;
      district?: string;
      city: string;
      area?: string;
      pincode: string;
      address?: string;
      lat?: number;
      lng?: number;
      searchRadiusKm?: number;
      addToPreferredLocations?: boolean;
    }
  ) => {
    const activeUser = getActiveUser();
    if (!activeUser) return;
    if (typeof location.lat === 'number' && typeof location.lng === 'number') {
      try {
        localStorage.setItem(
          'jobsetu_detected_coords',
          JSON.stringify({ lat: location.lat, lng: location.lng })
        );
      } catch {}
    }

    const radius = (location.searchRadiusKm || 50) as 5 | 10 | 25 | 50 | 100;

    if (role === 'worker') {
      const curr = workerProfileRef.current;
      const cityLabel = [location.city, location.state].filter(Boolean).join(', ');
      const existingPreferred = curr?.preferredLocations || [];
      const nextPreferred =
        location.addToPreferredLocations !== false && cityLabel && !existingPreferred.includes(cityLabel)
          ? [cityLabel, ...existingPreferred].slice(0, 6)
          : existingPreferred;

      await saveDraftWorkerProfile({
        state: location.state,
        district: location.district ?? curr?.district ?? '',
        city: location.city,
        area: location.area ?? curr?.area ?? '',
        pincode: location.pincode,
        currentAddress: location.address || curr?.currentAddress || `${location.area ? location.area + ', ' : ''}${location.city}, ${location.state}`,
        lat: location.lat,
        lng: location.lng,
        preferredLocations: nextPreferred,
        jobPreferences: {
          jobTypes: curr?.jobPreferences?.jobTypes || ['Full-time'],
          expectedSalary: curr?.jobPreferences?.expectedSalary || '₹15,000 - ₹25,000 / month',
          expectedDailyWage: curr?.jobPreferences?.expectedDailyWage || '₹600 - ₹900 / day',
          preferredWorkingHours: curr?.jobPreferences?.preferredWorkingHours || '8 Hours Standard (Day Shift)',
          preferredSearchRadiusKm: radius,
          availability: curr?.jobPreferences?.availability || 'Immediate',
          preferredLocations: nextPreferred,
          willingToRelocate: curr?.jobPreferences?.willingToRelocate ?? false,
          accommodationRequired: curr?.jobPreferences?.accommodationRequired ?? false
        }
      });
    } else {
      const curr = employerProfileRef.current;
      const worksite = [location.area, location.city, location.state].filter(Boolean).join(', ');
      await saveDraftEmployerProfile({
        state: location.state,
        district: location.district ?? curr?.district ?? '',
        city: location.city,
        area: location.area ?? curr?.area ?? '',
        pincode: location.pincode,
        businessAddress: location.address || curr?.businessAddress || worksite,
        worksiteLocation: worksite,
        lat: location.lat,
        lng: location.lng,
        discoveryRadiusKm: radius,
        hiringPreferences: curr?.hiringPreferences
          ? { ...curr.hiringPreferences, maxSearchRadiusKm: radius }
          : undefined
      });
    }
  };

  const refreshProfile = async () => {
    const activeUser = getActiveUser();
    if (activeUser) {
      await fetchUserData(activeUser);
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
        updateUserLocation,
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
