import React, { createContext, useContext, useEffect, useState } from 'react';
import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  onAuthStateChanged, 
  User, 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  signOut as firebaseSignOut,
  browserLocalPersistence,
  setPersistence 
} from 'firebase/auth';
import { getFirestore, doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import config from '../../firebase-applet-config.json';
import { toast } from 'sonner';
import { handleFirestoreError, OperationType } from '../lib/utils';

const app = initializeApp(config || {});
export const auth = getAuth(app);
auth.useDeviceLanguage();
// @ts-ignore
export const db = getFirestore(app, config?.firestoreDatabaseId || '(default)');

interface AuthContextType {
  user: User | null;
  profile: any | null;
  loading: boolean;
  signInWithEmail: (email: string, pass: string) => Promise<void>;
  signUpWithEmail: (email: string, pass: string, name: string, phone: string) => Promise<void>;
  signOut: () => Promise<void>;
  isAuthModalOpen: boolean;
  setIsAuthModalOpen: (open: boolean) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const FirebaseProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  useEffect(() => {
    // Set persistence to Local so it survives refreshes in the iframe
    setPersistence(auth, browserLocalPersistence).catch(console.error);

    let unsubscribeProfile: (() => void) | null = null;

    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      try {
        setLoading(true);
        setUser(user);
        
        if (unsubscribeProfile) {
          unsubscribeProfile();
          unsubscribeProfile = null;
        }

        if (user) {
          const userRef = doc(db, 'users', user.uid);
          
          // Use onSnapshot for real-time profile updates
          unsubscribeProfile = onSnapshot(userRef, async (snap) => {
            if (snap.exists()) {
              setProfile(snap.data());
              setLoading(false);
            } else {
              // Create default profile if not exists
              const newProfile = {
                userId: user.uid,
                email: user.email,
                displayName: user.displayName,
                role: 'user',
                createdAt: new Date().toISOString(),
              };
              await setDoc(userRef, newProfile);
              setProfile(newProfile);
              setLoading(false);
            }
          }, (err) => {
            handleFirestoreError(err, OperationType.GET, `users/${user.uid}`);
            setLoading(false);
          });
          
        } else {
          setProfile(null);
          setLoading(false);
        }
      } catch (error: any) {
        console.error('Auth State Change Error:', error);
        setLoading(false);
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeProfile) unsubscribeProfile();
    };
  }, []);

  const signInWithEmail = async (email: string, pass: string) => {
    try {
      await signInWithEmailAndPassword(auth, email, pass);
      toast.success('Access Granted. Welcome back.');
    } catch (error: any) {
      console.error('Email Sign In Error:', error);
      if (error.code === 'auth/invalid-credential' || error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
        toast.error('Identity Verification Failed: Invalid email or password.');
      } else if (error.code === 'auth/too-many-requests') {
        toast.error('Security Alert: Frequent login attempts. Please wait before retrying.');
      } else {
        toast.error('Authentication Protocol Failure.');
      }
      throw error;
    }
  };

  const signUpWithEmail = async (email: string, pass: string, name: string, phone: string) => {
    try {
      const res = await createUserWithEmailAndPassword(auth, email, pass);
      if (res.user) {
        await updateProfile(res.user, { displayName: name });
        
        // Explicitly create profile with phone number
        const userRef = doc(db, 'users', res.user.uid);
        const newProfile = {
          userId: res.user.uid,
          email: res.user.email,
          displayName: name,
          phoneNumber: phone,
          role: 'user',
          createdAt: new Date().toISOString(),
        };
        await setDoc(userRef, newProfile);
        setProfile(newProfile);
      }
      toast.success('Credentials established. Registration complete.');
    } catch (error: any) {
      console.error('Email Sign Up Error:', error);
      if (error.code === 'auth/email-already-in-use') {
        toast.error('Identity Conflict: This email is already registered.');
      } else if (error.code === 'auth/weak-password') {
        toast.error('Security Violation: Password must be stronger.');
      } else {
        toast.error('Registration Protocol Failure.');
      }
      throw error;
    }
  };

  const signOut = async () => {
    await firebaseSignOut(auth);
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, signInWithEmail, signUpWithEmail, signOut, isAuthModalOpen, setIsAuthModalOpen }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within a FirebaseProvider');
  }
  return context;
};
