import { doc, getDoc, setDoc, serverTimestamp, collection, addDoc } from 'firebase/firestore';
import { db } from './firebase';

export interface SystemSettings {
  apiKeys: Record<string, string>;
  lockedMenus: Record<string, boolean>;
}

export const getSystemSettings = async (): Promise<SystemSettings | null> => {
  try {
    const docSnap = await getDoc(doc(db, 'appConfig', 'systemSettings'));
    if (docSnap.exists()) {
      return docSnap.data() as SystemSettings;
    }
  } catch (error) {
    console.error("Error fetching system settings:", error);
  }
  return null;
};

export const logSystemEvent = async (type: 'info' | 'error', provider: string, message: string) => {
  try {
    await addDoc(collection(db, 'systemLogs'), {
      type,
      provider,
      message,
      timestamp: serverTimestamp()
    });
  } catch (error) {
    console.error("Failed to write system log:", error);
  }
};
