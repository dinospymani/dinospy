import React, { createContext, useContext, useEffect, useState } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, onAuthStateChanged, User, GoogleAuthProvider, signInWithPopup, signOut as firebaseSignOut } from 'firebase/auth';
import { getFirestore, doc, getDoc, setDoc } from 'firebase/firestore';
import config from '../../firebase-applet-config.json';

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
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const FirebaseProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      try {
        setLoading(true); // Restart loading if state change happens
        setUser(user);
        if (user) {
          const userRef = doc(db, 'users', user.uid);
          const userSnap = await getDoc(userRef);
          if (userSnap.exists()) {
            setProfile(userSnap.data());
          } else {
            // Create default profile
            const newProfile = {
              userId: user.uid,
              email: user.email,
              displayName: user.displayName,
              role: 'user',
              createdAt: new Date().toISOString(),
            };
            await setDoc(userRef, newProfile);
            setProfile(newProfile);
          }
        } else {
          setProfile(null);
        }
      } catch (error) {
        console.error('Auth State Change Error:', error);
      } finally {
        setLoading(false);
      }
    });

    return unsubscribe;
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
      // Fallback for common deployment issues
      if (error.code === 'auth/popup-blocked') {
        alert('The sign-in popup was blocked by your browser. Please allow popups for this site.');
      } else if (error.code === 'auth/operation-not-allowed') {
        alert('Google Sign-In is not enabled for this project. Please go to Firebase Console > Authentication > Settings and enable Google protocol.');
      } else if (error.code === 'auth/unauthorized-domain' || error.code === 'auth/network-request-failed') {
        alert(`CRITICAL SETUP REQUIRED:\n\n1. Copy this domain: ${window.location.hostname}\n2. Go to Firebase Console > Authentication > Settings > Authorized Domains\n3. Click "Add Domain" and paste your domain there.\n\nLogin will only work after this step.`);
      } else {
        alert(`Sign-in failed (${error.code}). Please check if your Firebase Authorized Domains include ${window.location.hostname}`);
      }
    }
  };

  const signOut = async () => {
    await firebaseSignOut(auth);
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, signInWithGoogle, signOut }}>
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
