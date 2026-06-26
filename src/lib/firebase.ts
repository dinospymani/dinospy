import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import config from '../../firebase-applet-config.json';

// Initialize Firebase with config or empty object if missing
export const app = initializeApp(config || {});
export const auth = getAuth(app);
auth.useDeviceLanguage();

// @ts-ignore
export const db = getFirestore(app, config?.firestoreDatabaseId || '(default)');
