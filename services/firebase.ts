import { initializeApp } from 'firebase/app';
import { getFirestore, doc, onSnapshot, setDoc, getDoc, getDocFromServer } from 'firebase/firestore';
import { getAuth, signInAnonymously } from 'firebase/auth'; 
import { AppData, BackupEntry } from '../types';

// 1. Your Firebase Configuration
const firebaseConfig = {
  apiKey: "AIzaSyAIo9Tjed8cUr_K7RPRl2QYIQD1S9JAMY4",
  authDomain: "dps-staff-portal-5e911.firebaseapp.com",
  projectId: "dps-staff-portal-5e911",
  storageBucket: "dps-staff-portal-5e911.firebasestorage.app",
  messagingSenderId: "671583941979",
  appId: "1:671583941979:web:c23c0f527cefabfe3fd67e",
  measurementId: "G-VR9Z385GFV"
};

// 2. Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);

const DOC_PATH = 'portal/data';

let isOffline = false;

// 3. Auto-Authenticate
let authPromise = signInAnonymously(auth).catch(console.error);
export const ensureAuth = () => authPromise;

async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if(error instanceof Error && error.message.includes('the client is offline')) {
      console.error("Please check your Firebase configuration.");
      isOffline = true;
    }
  }
}
testConnection();

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// 4. Real-time Subscription logic needed by App.tsx
export const subscribeToData = (
  onData: (data: AppData) => void,
  onError: (error: any) => void
) => {
  const docRef = doc(db, DOC_PATH);
  
  const unsubscribe = onSnapshot(docRef, (docSnap) => {
    if (docSnap.exists()) {
      const data = docSnap.data() as AppData;
      // Provide defaults if missing
      onData({
        ...data,
        students: data.students || [],
        attendance: data.attendance || {},
        systemLocked: data.systemLocked || false
      });
    } else {
      // Document doesn't exist yet, initialize it
      const initialData: AppData = { students: [], attendance: {}, systemLocked: false, settings: { fontSize: 12, fontFamily: "'Inter', sans-serif" } };
      setDoc(docRef, initialData).catch(err => handleFirestoreError(err, OperationType.WRITE, DOC_PATH));
      onData(initialData);
    }
  }, (error) => {
    isOffline = true;
    onError(error);
  });

  return unsubscribe;
};

export const saveData = async (data: AppData) => {
  const docRef = doc(db, DOC_PATH);
  
  await ensureAuth();

  // Basic size estimation
  const json = JSON.stringify(data);
  const size = json.length;
  // Firestore limit is 1,048,576 bytes. Let's warn at 900KB.
  if (size > 1000000) {
    console.warn("Approaching Firestore 1MB limit:", size);
  }
  
  if (size > 1048500) {
    throw new Error("DATA_TOO_LARGE: The database has reached the 1MB limit. Please delete old records in Maintenance.");
  }

  try {
    await setDoc(docRef, data); 
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, DOC_PATH);
  }
};

export const createCloudBackup = async (data: AppData, type: 'Auto' | 'Manual' = 'Manual') => {
  console.log(`Local backup created (${type})`);
  const historyKey = 'dps_backups_local';
  const history = JSON.parse(localStorage.getItem(historyKey) || '[]');
  history.unshift({
    timestamp: new Date().toISOString(),
    data: data,
    type: type,
    id: Math.random().toString(36).substr(2, 9)
  });
  localStorage.setItem(historyKey, JSON.stringify(history.slice(0, 10)));
};

export const getCloudBackups = async (): Promise<Partial<BackupEntry>[]> => {
  const historyKey = 'dps_backups_local';
  return JSON.parse(localStorage.getItem(historyKey) || '[]');
};

export const getSyncStatus = () => !isOffline;
