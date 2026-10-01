/**
 * Firebase init. Config comes from VITE_FIREBASE_* env vars (see
 * .env.example). Initialization is lazy so the app shell, dev kit, and unit
 * tests run before a Firebase project exists. Auth helpers live in auth.ts.
 */
import { initializeApp, type FirebaseApp } from 'firebase/app';
import {
  browserLocalPersistence,
  connectAuthEmulator,
  indexedDBLocalPersistence,
  initializeAuth,
  type Auth,
} from 'firebase/auth';
import {
  connectFirestoreEmulator,
  initializeFirestore,
  memoryLocalCache,
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

/** True once .env.local has real values. */
export const isFirebaseConfigured = Boolean(firebaseConfig.apiKey && firebaseConfig.projectId);

/** True when the app can talk to Firebase (real project or local emulators). */
export const isFirebaseAvailable = isFirebaseConfigured || useEmulators;

/** Emulator-only project id; "demo-" projects need no real credentials. */
export const DEMO_PROJECT_ID = 'demo-mussel';

export interface FirebaseServices {
  app: FirebaseApp;
  auth: Auth;
  db: Firestore;
}

let services: FirebaseServices | null = null;

export function getFirebase(): FirebaseServices {
  if (services) return services;

  if (!isFirebaseAvailable) {
    throw new Error(
      'Firebase is not configured. Copy .env.example to .env.local and fill in your web app config, or set VITE_USE_EMULATORS=true.',
    );
  }

  const app = initializeApp(
    isFirebaseConfigured
      ? firebaseConfig
      : { apiKey: 'demo-key', projectId: DEMO_PROJECT_ID, authDomain: 'localhost' },
  );

  // Keep users signed in on this device until they log out. The SDK uses the
  // first persistence the environment supports (Node tests fall back to memory).
  const auth = initializeAuth(app, {
    persistence: [indexedDBLocalPersistence, browserLocalPersistence],
  });

  // Offline cache so the app works in a gym with no signal. Environments
  // without IndexedDB (Node integration tests) get an in-memory cache.
  const db = initializeFirestore(app, {
    localCache:
      typeof indexedDB === 'undefined'
        ? memoryLocalCache()
        : persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
  });

  if (useEmulators) {
    connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true });
    connectFirestoreEmulator(db, '127.0.0.1', 8080);
  }

  services = { app, auth, db };
  return services;
}
