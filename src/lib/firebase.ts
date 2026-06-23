import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { getFirestore, doc, getDocFromServer } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getAnalytics } from 'firebase/analytics';
const firebaseConfig = {
  apiKey: "AIzaSyB6Dt2CWr18y85uY39HKGgKm3gCcLLBCL0",
  authDomain: "vektorion-25.firebaseapp.com",
  projectId: "vektorion-25",
  storageBucket: "vektorion-25.firebasestorage.app",
  messagingSenderId: "251566817101",
  appId: "1:251566817101:web:3aab4c43c80aa477398104",
  measurementId: "G-VELSHG7SBW"
};

export const isConfigValid = true;

const app = initializeApp(firebaseConfig);
export const analytics = typeof window !== 'undefined' ? getAnalytics(app) : null;

export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);
export const googleProvider = new GoogleAuthProvider();

export const signInWithGoogle = async () => {
  if (!isConfigValid) {
    throw new Error("Konfigurasi Firebase tidak valid (API Key belum diatur). Silakan minta pengembang untuk mengatur Firebase via AI Studio.");
  }
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error) {
    console.error("Error signing in with Google", error);
    throw error;
  }
};

// Validate Connection
async function testConnection() {
  if (!isConfigValid) {
    console.warn("Aplikasi berjalan dalam mode offline/demo karena konfigurasi Firebase tidak valid.");
    return;
  }
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error("Mohon periksa konfigurasi Firebase Anda (Offline).");
    } else if (error instanceof Error && error.message.includes('not found')) {
      console.error("Database Firestore tidak ditemukan. Pastikan Anda telah membuat Firestore Database di Firebase Console dengan nama '(default)'.");
    }
  }
}

testConnection();

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  // Wrap throw in a check to ensure it's not being swallowed or misparsed elsewhere
  let errorString = "Unknown Firestore Error";
  try {
    errorString = JSON.stringify(errInfo);
  } catch (e) {
    console.error("Critical: Failed to stringify Firestore error info", e);
  }

  if (!errorString || errorString === "undefined" || errorString === "null" || errorString === "{}") {
    throw new Error("Internal Firestore Error: Unknown state");
  }
  throw new Error(errorString);
}
