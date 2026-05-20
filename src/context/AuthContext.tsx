import React, { createContext, useContext, useEffect, useState } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, onAuthStateChanged, User, GoogleAuthProvider, signInWithPopup, signOut as firebaseSignOut } from 'firebase/auth';
import { getFirestore, doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import config from '../../firebase-applet-config.json';
import { toast } from 'sonner';

const app = initializeApp(config || {});
export const auth = getAuth(app);
// @ts-ignore
export const db = getFirestore(app, config?.firestoreDatabaseId || '(default)');

interface AuthContextType {
  user: User | null;
  profile: any | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
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
            console.error('Profile Load Error:', err);
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

  const signInWithGoogle = async () => {
    try {
      const provider = new GoogleAuthProvider();
      // Add custom parameters to handle common iframe issues if possible
      provider.setCustomParameters({
        prompt: 'select_account'
      });
      await signInWithPopup(auth, provider);
    } catch (error: any) {
      console.error('Sign In Error:', error);
      if (error.code === 'auth/popup-blocked') {
        toast.error('Sign-in popup blocked. Please allow popups.');
      } else if (error.code === 'auth/operation-not-allowed') {
        toast.error('Google Sign-In is disabled. Enable it in Firebase Console.');
      } else if (error.code === 'auth/unauthorized-domain') {
        toast.error('Domain not authorized in Firebase settings.');
      } else {
        toast.error('Sign-in failed. Check project configuration.');
      }
    }
  };

  const signOut = async () => {
    await firebaseSignOut(auth);
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, signInWithGoogle, signOut, isAuthModalOpen, setIsAuthModalOpen }}>
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
