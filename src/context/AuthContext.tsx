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
  saveEmployerProfile: (profile: Omit<EmployerProfile, 'uid' | 'submittedAt' | 'updatedAt' | 'verificationStatus' | 'emailVerified' | 'phoneVerified'>) => Promise<void>;
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

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [workerProfile, setWorkerProfile] = useState<WorkerProfile | null>(null);
  const [employerProfile, setEmployerProfile] = useState<EmployerProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [intendedRole, setIntendedRole] = useState<UserRole>(() => {
    return (localStorage.getItem('jobsetu_intended_role') as UserRole) || 'worker';
  });

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

    // Hydrate from local cache for this specific UID if available
    try {
      const cachedUser = localStorage.getItem(cachedUserKey);
      if (cachedUser) setUserProfile(JSON.parse(cachedUser));
      const cachedWorker = localStorage.getItem(cachedWorkerKey);
      if (cachedWorker) setWorkerProfile(JSON.parse(cachedWorker));
      const cachedEmp = localStorage.getItem(cachedEmployerKey);
      if (cachedEmp) setEmployerProfile(JSON.parse(cachedEmp));
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

      // Also fetch worker & employer profiles in parallel for this UID so we know what profiles exist
      let fetchedWorker: WorkerProfile | null = null;
      let fetchedEmployer: EmployerProfile | null = null;

      await Promise.allSettled([
        withTimeout(getDoc(doc(db, 'workerProfiles', uid)), 3000)
          .then((wSnap) => {
            if (wSnap.exists()) {
              fetchedWorker = wSnap.data() as WorkerProfile;
              setWorkerProfile(fetchedWorker);
              try {
                localStorage.setItem(cachedWorkerKey, JSON.stringify(fetchedWorker));
              } catch {}
            }
          })
          .catch(() => {}),
        withTimeout(getDoc(doc(db, 'employerProfiles', uid)), 3000)
          .then((eSnap) => {
            if (eSnap.exists()) {
              fetchedEmployer = eSnap.data() as EmployerProfile;
              setEmployerProfile(fetchedEmployer);
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
      const draftEmployer: Partial<EmployerProfile> = {
        uid,
        ownerName: name,
        ownerEmail: email,
        ownerPhone: phone || '',
        designation: 'Proprietor / Business Owner',
        businessName: '',
        businessCategory: 'Coaching Classes / Education Institute',
        state: '',
        pincode: '',
        verificationStatus: 'Pending',
        emailVerified: true,
        phoneVerified: Boolean(phone),
        updatedAt: serverTimestamp()
      };
      setEmployerProfile((prev) => (prev ? { ...prev, ...draftEmployer } : (draftEmployer as EmployerProfile)));
      try {
        localStorage.setItem(`jobsetu_employer_${uid}`, JSON.stringify(draftEmployer));
      } catch {}
      await setDoc(empRef, stripUndefined(draftEmployer), { merge: true }).catch(() => {});
    } else {
      const workerRef = doc(db, 'workerProfiles', uid);
      const draftWorker: Partial<WorkerProfile> = {
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
      };
      setWorkerProfile((prev) => (prev ? { ...prev, ...draftWorker } : (draftWorker as WorkerProfile)));
      try {
        localStorage.setItem(`jobsetu_worker_${uid}`, JSON.stringify(draftWorker));
      } catch {}
      await setDoc(workerRef, stripUndefined(draftWorker), { merge: true }).catch(() => {});
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
    const merged: WorkerProfile = {
      uid,
      fullName: partialProfile.fullName ?? workerProfile?.fullName ?? userProfile?.name ?? '',
      phone: partialProfile.phone ?? workerProfile?.phone ?? userProfile?.phone ?? '',
      email: partialProfile.email ?? workerProfile?.email ?? userProfile?.email ?? currentUser.email ?? '',
      dateOfBirth: partialProfile.dateOfBirth ?? workerProfile?.dateOfBirth ?? '',
      ageEligibilityConfirmed: partialProfile.ageEligibilityConfirmed ?? workerProfile?.ageEligibilityConfirmed ?? true,
      gender: partialProfile.gender ?? workerProfile?.gender ?? 'male',
      profilePhoto: partialProfile.profilePhoto ?? workerProfile?.profilePhoto ?? userProfile?.profilePhoto ?? '',
      isPhotoVerifiedReal: partialProfile.isPhotoVerifiedReal ?? workerProfile?.isPhotoVerifiedReal ?? true,
      country: 'India',
      state: partialProfile.state ?? workerProfile?.state ?? '',
      district: partialProfile.district ?? workerProfile?.district ?? '',
      city: partialProfile.city ?? workerProfile?.city ?? '',
      area: partialProfile.area ?? workerProfile?.area ?? '',
      pincode: partialProfile.pincode ?? workerProfile?.pincode ?? '',
      lat: partialProfile.lat ?? workerProfile?.lat,
      lng: partialProfile.lng ?? workerProfile?.lng,
      preferredLocations: partialProfile.preferredLocations ?? workerProfile?.preferredLocations ?? [],
      education: partialProfile.education ?? workerProfile?.education ?? 'Higher secondary',
      skills: partialProfile.skills ?? workerProfile?.skills ?? [],
      customSkills: partialProfile.customSkills ?? workerProfile?.customSkills ?? [],
      experience: partialProfile.experience ?? workerProfile?.experience ?? 'Fresher',
      jobPreferences: partialProfile.jobPreferences ?? workerProfile?.jobPreferences ?? {
        jobTypes: ['Full-time'],
        expectedSalary: '₹15,000 - ₹25,000 / month',
        availability: 'Immediate',
        preferredLocations: []
      },
      updatedAt: serverTimestamp()
    };

    setWorkerProfile(merged);
    if (merged.fullName || merged.phone || merged.profilePhoto) {
      setUserProfile((prev) => {
        if (!prev) return prev;
        const next = {
          ...prev,
          name: merged.fullName || prev.name,
          phone: merged.phone || prev.phone,
          profilePhoto: merged.profilePhoto || prev.profilePhoto
        };
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
      withTimeout(
        setDoc(
          doc(db, 'users', uid),
          stripUndefined({
            name: merged.fullName || undefined,
            phone: merged.phone || undefined,
            profilePhoto: merged.profilePhoto || undefined,
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
      withTimeout(
        setDoc(
          userRef,
          stripUndefined({
            name: profileData.fullName,
            phone: profileData.phone || userProfile?.phone || '',
            profilePhoto: profileData.profilePhoto || userProfile?.profilePhoto || '',
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
    const merged: EmployerProfile = {
      uid,
      ownerName: partialProfile.ownerName ?? employerProfile?.ownerName ?? userProfile?.name ?? '',
      ownerEmail: partialProfile.ownerEmail ?? employerProfile?.ownerEmail ?? userProfile?.email ?? currentUser.email ?? '',
      ownerPhone: partialProfile.ownerPhone ?? employerProfile?.ownerPhone ?? userProfile?.phone ?? '',
      designation: partialProfile.designation ?? employerProfile?.designation ?? 'Proprietor / Business Owner',
      businessName: partialProfile.businessName ?? employerProfile?.businessName ?? '',
      businessCategory: partialProfile.businessCategory ?? employerProfile?.businessCategory ?? 'Coaching Classes / Education Institute',
      businessDescription: partialProfile.businessDescription ?? employerProfile?.businessDescription ?? '',
      businessLogo: partialProfile.businessLogo ?? employerProfile?.businessLogo ?? '',
      businessImages: partialProfile.businessImages ?? employerProfile?.businessImages ?? [],
      boardGstinVerifiedByAI: partialProfile.boardGstinVerifiedByAI ?? employerProfile?.boardGstinVerifiedByAI ?? false,
      aiBoardVerificationSummary: partialProfile.aiBoardVerificationSummary ?? employerProfile?.aiBoardVerificationSummary ?? '',
      website: partialProfile.website ?? employerProfile?.website ?? '',
      state: partialProfile.state ?? employerProfile?.state ?? '',
      district: partialProfile.district ?? employerProfile?.district ?? '',
      city: partialProfile.city ?? employerProfile?.city ?? '',
      area: partialProfile.area ?? employerProfile?.area ?? '',
      pincode: partialProfile.pincode ?? employerProfile?.pincode ?? '',
      lat: partialProfile.lat ?? employerProfile?.lat,
      lng: partialProfile.lng ?? employerProfile?.lng,
      businessAddress: partialProfile.businessAddress ?? employerProfile?.businessAddress ?? '',
      documentNumber: partialProfile.documentNumber ?? employerProfile?.documentNumber ?? '',
      verificationStatus: employerProfile?.verificationStatus || 'Pending',
      emailVerified: Boolean(currentUser.emailVerified),
      phoneVerified: Boolean(partialProfile.ownerPhone || employerProfile?.ownerPhone || currentUser.phoneNumber),
      updatedAt: serverTimestamp()
    };

    setEmployerProfile(merged);
    if (merged.ownerName || merged.ownerPhone || merged.businessLogo) {
      setUserProfile((prev) => {
        if (!prev) return prev;
        const next = {
          ...prev,
          name: merged.ownerName || prev.name,
          phone: merged.ownerPhone || prev.phone,
          profilePhoto: merged.businessLogo || prev.profilePhoto
        };
        try {
          localStorage.setItem(`jobsetu_user_${uid}`, JSON.stringify(next));
        } catch {}
        return next;
      });
    }
    try {
      localStorage.setItem(`jobsetu_employer_${uid}`, JSON.stringify(merged));
    } catch {}

    await Promise.allSettled([
      withTimeout(setDoc(doc(db, 'employerProfiles', uid), stripUndefined(merged), { merge: true }), 2500),
      withTimeout(
        setDoc(
          doc(db, 'users', uid),
          stripUndefined({
            name: merged.ownerName || undefined,
            phone: merged.ownerPhone || undefined,
            profilePhoto: merged.businessLogo || undefined,
            updatedAt: serverTimestamp()
          }),
          { merge: true }
        ),
        2500
      )
    ]);
  };

  const saveEmployerProfile = async (
    profileData: Omit<EmployerProfile, 'uid' | 'submittedAt' | 'updatedAt' | 'verificationStatus' | 'emailVerified' | 'phoneVerified'>
  ) => {
    if (!currentUser) throw new Error('You must be logged in to save an employer profile.');
    const empRef = doc(db, 'employerProfiles', currentUser.uid);
    const fullEmployerData: EmployerProfile = {
      ...profileData,
      uid: currentUser.uid,
      verificationStatus: 'Pending',
      emailVerified: !!currentUser.emailVerified,
      phoneVerified: !!(profileData.ownerPhone || currentUser.phoneNumber),
      submittedAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    setEmployerProfile(fullEmployerData);
    setUserProfile((prev) => {
      const next = prev
        ? {
            ...prev,
            name: profileData.ownerName,
            phone: profileData.ownerPhone || prev.phone,
            profilePhoto: profileData.businessLogo || prev.profilePhoto,
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
      localStorage.setItem(`jobsetu_employer_${currentUser.uid}`, JSON.stringify(fullEmployerData));
    } catch {}

    const userRef = doc(db, 'users', currentUser.uid);
    await Promise.allSettled([
      withTimeout(setDoc(empRef, stripUndefined(fullEmployerData), { merge: true }), 3000),
      withTimeout(
        setDoc(
          userRef,
          stripUndefined({
            name: profileData.ownerName,
            phone: profileData.ownerPhone || userProfile?.phone || '',
            profilePhoto: profileData.businessLogo || userProfile?.profilePhoto || '',
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
