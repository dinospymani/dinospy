import React, { createContext, useContext, useEffect, useState } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, onAuthStateChanged, User, GoogleAuthProvider, signInWithPopup, signOut as firebaseSignOut } from 'firebase/auth';
import { getFirestore, doc, getDoc, setDoc } from 'firebase/firestore';
// @ts-ignore
import config from '../../firebase-applet-config.json' with { type: 'json' };

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
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    await signInWithPopup(auth, provider);
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
