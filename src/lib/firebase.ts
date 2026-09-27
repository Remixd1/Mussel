/**
 * Firebase init + auth helpers. Config comes from VITE_FIREBASE_* env vars
 * (see .env.example). Initialization is lazy so the app shell, dev kit, and
 * tests run before a Firebase project exists.
 */
import { initializeApp, type FirebaseApp } from 'firebase/app';
import {
  connectAuthEmulator,
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  signOut as fbSignOut,
  type Auth,
} from 'firebase/auth';
import {
  connectFirestoreEmulator,
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  type Firestore,
} from 'firebase/firestore';

const env = import.meta.env;

export const useEmulators = env.DEV && env.VITE_USE_EMULATORS === 'true';

const firebaseConfig = {
  apiKey: env.VITE_FIREBASE_API_KEY,
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: env.VITE_FIREBASE_APP_ID,
};

/** True once .env.local has real values, or when running against emulators. */
export const isFirebaseConfigured = Boolean(firebaseConfig.apiKey && firebaseConfig.projectId);

interface FirebaseServices {
  app: FirebaseApp;
  auth: Auth;
  db: Firestore;
}

let services: FirebaseServices | null = null;

export function getFirebase(): FirebaseServices {
  if (services) return services;

  if (!isFirebaseConfigured && !useEmulators) {
    throw new Error(
      'Firebase is not configured. Copy .env.example to .env.local and fill in your web app config, or set VITE_USE_EMULATORS=true.',
    );
  }

  // "demo-" project ids are emulator-only and need no real credentials.
  const app = initializeApp(
    isFirebaseConfigured
      ? firebaseConfig
      : { apiKey: 'demo-key', projectId: 'demo-mussel', authDomain: 'localhost' },
  );
  const auth = getAuth(app);
  const db = initializeFirestore(app, {
    localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
  });

  if (useEmulators) {
    connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true });
    connectFirestoreEmulator(db, '127.0.0.1', 8080);
  }

  services = { app, auth, db };
  return services;
}

/**
 * Google sign-in. Popup first; installed iOS PWAs often block popups, so fall
 * back to a full-page redirect (result is picked up by onAuthStateChanged).
 */
export async function signInWithGoogle(): Promise<void> {
  const { auth } = getFirebase();
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account' });
  try {
    await signInWithPopup(auth, provider);
  } catch (err) {
    const code = (err as { code?: string }).code ?? '';
    if (code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request') throw err;
    await signInWithRedirect(auth, provider);
  }
}

export function signOut(): Promise<void> {
  return fbSignOut(getFirebase().auth);
}
