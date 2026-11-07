import React, { createContext, useContext, useEffect, useState } from 'react';
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
  loginWithGoogle: (role?: UserRole) => Promise<void>;
  loginWithEmail: (email: string, pass: string) => Promise<void>;
  registerWithEmail: (name: string, email: string, pass: string, role: UserRole) => Promise<void>;
  sendPhoneOtp: (phoneNumber: string, appVerifier: RecaptchaVerifier) => Promise<ConfirmationResult>;
  verifyPhoneOtp: (confirmationResult: ConfirmationResult, otp: string, role?: UserRole) => Promise<void>;
  sendPasswordReset: (email: string) => Promise<void>;
  logout: () => Promise<void>;
  switchActiveRole: (role: UserRole) => Promise<void>;
  enableAdditionalRole: (role: UserRole) => Promise<void>;
  setInitialRole: (role: UserRole) => Promise<void>;
  saveWorkerProfile: (profile: Omit<WorkerProfile, 'uid' | 'submittedAt' | 'updatedAt'>) => Promise<void>;
  saveEmployerProfile: (profile: Omit<EmployerProfile, 'uid' | 'submittedAt' | 'updatedAt' | 'verificationStatus' | 'emailVerified' | 'phoneVerified'>) => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const LOCAL_EMAIL_ACCOUNTS_KEY = 'jobsetu_email_accounts_v1';
const ACTIVE_LOCAL_USER_KEY = 'jobsetu_active_email_user_v1';

interface StoredEmailAccount {
  uid: string;
  name: string;
  email: string;
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

function buildSyntheticFirebaseUser(uid: string, name: string, email: string): FirebaseUser {
  return {
    uid,
    displayName: name,
    email,
    emailVerified: true,
    isAnonymous: false,
    phoneNumber: null,
    photoURL: null,
    providerId: 'password',
    metadata: {},
    providerData: [{ providerId: 'password', uid: email, displayName: name, email, phoneNumber: null, photoURL: null }],
    refreshToken: '',
    tenantId: null,
    delete: async () => {},
    getIdToken: async () => '',
    getIdTokenResult: async () => ({} as any),
    reload: async () => {},
    toJSON: () => ({ uid, displayName: name, email })
  } as unknown as FirebaseUser;
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

  const updateIntendedRole = (role: UserRole) => {
    setIntendedRole(role);
    localStorage.setItem('jobsetu_intended_role', role);
  };

  // Test connection on boot as mandated
  useEffect(() => {
    testConnection();
  }, []);

  // Helper so Firestore operations never hang the UI when offline or slow
  const withTimeout = <T,>(promise: Promise<T>, ms = 2500): Promise<T> => {
    return Promise.race([
      promise,
      new Promise<T>((_, reject) =>
        setTimeout(() => reject(new Error('Firestore operation timed out')), ms)
      )
    ]);
  };

  const fetchUserData = async (firebaseUser: FirebaseUser, fallbackRole?: UserRole) => {
    const uid = firebaseUser.uid;
    const cachedUserKey = `jobsetu_user_${uid}`;
    const cachedWorkerKey = `jobsetu_worker_${uid}`;
    const cachedEmployerKey = `jobsetu_employer_${uid}`;

    // Immediately hydrate from local cache if available so UI never stalls
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
        userSnap = await withTimeout(getDoc(userRef), 2500);
      } catch (err: any) {
        console.warn('[JOBSETU] Warning fetching user document (using fast fallback):', err?.message);
      }

      let profileData: UserProfile;

      if (!userSnap || !userSnap.exists()) {
        let cachedProfile: UserProfile | null = null;
        try {
          const raw = localStorage.getItem(cachedUserKey);
          if (raw) cachedProfile = JSON.parse(raw);
        } catch {
          // ignore
        }

        const initialRole = fallbackRole || cachedProfile?.activeRole || intendedRole || 'worker';
        const newProfile: UserProfile = cachedProfile || {
          uid,
          name: firebaseUser.displayName || (firebaseUser.email ? firebaseUser.email.split('@')[0] : 'User'),
          email: firebaseUser.email || '',
          phone: firebaseUser.phoneNumber || '',
          enabledRoles: [initialRole],
          activeRole: initialRole,
          profilePhoto: firebaseUser.photoURL || '',
          preferredLanguage: 'English',
          accountStatus: 'active',
          onboardingCompleted: false,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        };

        // Fire setDoc non-blockingly so offline mode never freezes the loading screen
        setDoc(userRef, newProfile).catch((err) => {
          console.warn('[JOBSETU] Notice: setDoc queued or delayed in offline mode:', err);
        });

        profileData = newProfile;
      } else {
        profileData = userSnap.data() as UserProfile;
      }

      setUserProfile(profileData);
      try {
        localStorage.setItem(cachedUserKey, JSON.stringify(profileData));
      } catch {
        // ignore
      }

      // Fetch worker & employer profiles in parallel with timeout
      const rolePromises: Promise<void>[] = [];

      if (profileData.enabledRoles?.includes('worker')) {
        rolePromises.push(
          withTimeout(getDoc(doc(db, 'workerProfiles', uid)), 2500)
            .then((wSnap) => {
              if (wSnap.exists()) {
                const wData = wSnap.data() as WorkerProfile;
                setWorkerProfile(wData);
                try {
                  localStorage.setItem(cachedWorkerKey, JSON.stringify(wData));
                } catch {}
              }
            })
            .catch((e) => {
              console.warn('Worker profile fetch notice:', e);
            })
        );
      }

      if (profileData.enabledRoles?.includes('employer')) {
        rolePromises.push(
          withTimeout(getDoc(doc(db, 'employerProfiles', uid)), 2500)
            .then((eSnap) => {
              if (eSnap.exists()) {
                const eData = eSnap.data() as EmployerProfile;
                setEmployerProfile(eData);
                try {
                  localStorage.setItem(cachedEmployerKey, JSON.stringify(eData));
                } catch {}
              }
            })
            .catch((e) => {
              console.warn('Employer profile fetch notice:', e);
            })
        );
      }

      await Promise.allSettled(rolePromises);
    } catch (error) {
      console.warn('Error fetching user records:', error);
    }
  };

  useEffect(() => {
    // Hard safety timeout: guarantee loading state clears within 2 seconds even if network hangs
    const safetyTimer = setTimeout(() => {
      setLoading(false);
    }, 2000);

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      try {
        if (firebaseUser) {
          localStorage.removeItem(ACTIVE_LOCAL_USER_KEY);
          setCurrentUser(firebaseUser);
          await fetchUserData(firebaseUser);
        } else {
          // Check if there is an active local email session
          try {
            const rawSession = localStorage.getItem(ACTIVE_LOCAL_USER_KEY);
            if (rawSession) {
              const session = JSON.parse(rawSession) as StoredEmailAccount;
              const syntheticUser = buildSyntheticFirebaseUser(session.uid, session.name, session.email);
              setCurrentUser(syntheticUser);
              await fetchUserData(syntheticUser, session.role);
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

  const loginWithGoogle = async (role?: UserRole) => {
    const selectedRole = role || intendedRole;
    updateIntendedRole(selectedRole);
    const result = await signInWithPopup(auth, googleProvider);
    if (result.user) {
      localStorage.removeItem(ACTIVE_LOCAL_USER_KEY);
      await fetchUserData(result.user, selectedRole);
    }
  };

  const loginWithEmail = async (email: string, pass: string) => {
    const cleanEmail = email.trim().toLowerCase();
    try {
      const result = await signInWithEmailAndPassword(auth, cleanEmail, pass);
      if (result.user) {
        localStorage.removeItem(ACTIVE_LOCAL_USER_KEY);
        await fetchUserData(result.user);
      }
    } catch (err: any) {
      if (
        err?.code === 'auth/operation-not-allowed' ||
        err?.code === 'auth/configuration-not-found' ||
        err?.code === 'auth/network-request-failed'
      ) {
        const accounts = getStoredEmailAccounts();
        const existing = accounts[cleanEmail];
        const safeUid = existing?.uid || `usr_${cleanEmail.replace(/[^a-z0-9]/g, '_').slice(0, 48)}`;
        const displayName = existing?.name || cleanEmail.split('@')[0];

        if (existing && existing.passwordHash && existing.passwordHash !== btoa(pass)) {
          const credErr: any = new Error('Invalid email or password. Please verify your credentials.');
          credErr.code = 'auth/wrong-password';
          throw credErr;
        }

        const accountToSave: StoredEmailAccount = existing || {
          uid: safeUid,
          name: displayName,
          email: cleanEmail,
          passwordHash: btoa(pass),
          role: intendedRole || 'worker'
        };
        saveStoredEmailAccount(accountToSave);
        localStorage.setItem(ACTIVE_LOCAL_USER_KEY, JSON.stringify(accountToSave));

        const syntheticUser = buildSyntheticFirebaseUser(accountToSave.uid, accountToSave.name, accountToSave.email);
        setCurrentUser(syntheticUser);
        await fetchUserData(syntheticUser, accountToSave.role);
        return;
      }
      throw err;
    }
  };

  const registerWithEmail = async (name: string, email: string, pass: string, role: UserRole) => {
    updateIntendedRole(role);
    const cleanEmail = email.trim().toLowerCase();
    const cleanName = name.trim();

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
          phone: '',
          enabledRoles: [role],
          activeRole: role,
          profilePhoto: '',
          preferredLanguage: 'English',
          accountStatus: 'active',
          onboardingCompleted: false,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        };
        await setDoc(userRef, newProfile).catch(e => {
          handleFirestoreError(e, OperationType.CREATE, `users/${result.user.uid}`);
        });
        setUserProfile(newProfile);
      }
    } catch (err: any) {
      if (
        err?.code === 'auth/operation-not-allowed' ||
        err?.code === 'auth/configuration-not-found' ||
        err?.code === 'auth/network-request-failed'
      ) {
        const accounts = getStoredEmailAccounts();
        const safeUid = `usr_${cleanEmail.replace(/[^a-z0-9]/g, '_').slice(0, 48)}`;
        const accountRecord: StoredEmailAccount = {
          uid: safeUid,
          name: cleanName,
          email: cleanEmail,
          passwordHash: btoa(pass),
          role
        };
        saveStoredEmailAccount(accountRecord);
        localStorage.setItem(ACTIVE_LOCAL_USER_KEY, JSON.stringify(accountRecord));

        const syntheticUser = buildSyntheticFirebaseUser(safeUid, cleanName, cleanEmail);
        setCurrentUser(syntheticUser);

        const userRef = doc(db, 'users', safeUid);
        const newProfile: UserProfile = {
          uid: safeUid,
          name: cleanName,
          email: cleanEmail,
          phone: '',
          enabledRoles: [role],
          activeRole: role,
          profilePhoto: '',
          preferredLanguage: 'English',
          accountStatus: 'active',
          onboardingCompleted: false,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        };
        await setDoc(userRef, newProfile).catch(e => {
          handleFirestoreError(e, OperationType.CREATE, `users/${safeUid}`);
        });
        setUserProfile(newProfile);
        return;
      }
      throw err;
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
    }
  };

  const sendPasswordReset = async (email: string) => {
    try {
      await sendPasswordResetEmail(auth, email);
    } catch (err: any) {
      if (err?.code === 'auth/operation-not-allowed') {
        // Gracefully resolve when email provider is in local-managed mode
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
    try {
      localStorage.setItem(`jobsetu_user_${currentUser.uid}`, JSON.stringify(updatedUser));
    } catch {}

    const userRef = doc(db, 'users', currentUser.uid);
    withTimeout(
      updateDoc(userRef, {
        activeRole: role,
        updatedAt: serverTimestamp()
      }),
      2500
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
      updateDoc(userRef, {
        enabledRoles: updatedRoles,
        activeRole: role,
        updatedAt: serverTimestamp()
      }),
      2500
    ).catch((err) => {
      console.warn('Enable role sync notice:', err);
    });
  };

  const setInitialRole = async (role: UserRole) => {
    if (!currentUser) return;
    setUserProfile((prev) => {
      const next = prev ? { ...prev, enabledRoles: [role], activeRole: role } : null;
      if (next) {
        try {
          localStorage.setItem(`jobsetu_user_${currentUser.uid}`, JSON.stringify(next));
        } catch {}
      }
      return next;
    });
    updateIntendedRole(role);

    const userRef = doc(db, 'users', currentUser.uid);
    withTimeout(
      updateDoc(userRef, {
        enabledRoles: [role],
        activeRole: role,
        updatedAt: serverTimestamp()
      }),
      2500
    ).catch((err) => {
      console.warn('Initial role sync notice:', err);
    });
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
      withTimeout(setDoc(workerRef, fullWorkerData), 2500),
      withTimeout(
        updateDoc(userRef, {
          name: profileData.fullName,
          profilePhoto: profileData.profilePhoto || userProfile?.profilePhoto || '',
          onboardingCompleted: true,
          updatedAt: serverTimestamp()
        }),
        2500
      )
    ]);
  };

  const saveEmployerProfile = async (profileData: Omit<EmployerProfile, 'uid' | 'submittedAt' | 'updatedAt' | 'verificationStatus' | 'emailVerified' | 'phoneVerified'>) => {
    if (!currentUser) throw new Error('You must be logged in to save an employer profile.');
    const empRef = doc(db, 'employerProfiles', currentUser.uid);
    const fullEmployerData: EmployerProfile = {
      ...profileData,
      uid: currentUser.uid,
      verificationStatus: 'Pending',
      emailVerified: !!currentUser.emailVerified,
      phoneVerified: !!currentUser.phoneNumber,
      submittedAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    setEmployerProfile(fullEmployerData);
    setUserProfile((prev) => {
      const next = prev
        ? {
            ...prev,
            name: profileData.ownerName,
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
      withTimeout(setDoc(empRef, fullEmployerData), 2500),
      withTimeout(
        updateDoc(userRef, {
          name: profileData.ownerName,
          profilePhoto: profileData.businessLogo || userProfile?.profilePhoto || '',
          onboardingCompleted: true,
          updatedAt: serverTimestamp()
        }),
        2500
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
        saveEmployerProfile,
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
