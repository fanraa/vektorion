import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  onAuthStateChanged, 
  User, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signOut,
  updatePassword as fbUpdatePassword,
  updateProfile as fbUpdateProfile,
  reauthenticateWithCredential,
  EmailAuthProvider
} from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from './firebase';
import { MEMBERS_DATA } from '../data/members';

interface UserProfile {
  uid: string;
  nim: string;
  name: string;
  photoURL: string | null;
  role: string;
  isAdmin: boolean;
  position: string;
  galleryDensity?: 'normal' | 'compact';
}

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  login: (id: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (data: Partial<UserProfile>) => Promise<void>;
  changePassword: (oldPassword: string, newPassword: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      if (user) {
        try {
          const docRef = doc(db, 'users', user.uid);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            setProfile(docSnap.data() as UserProfile);
          }
        } catch (err) {
          console.error("Error fetching user profile:", err);
          // Don't set profile but allow loading to finish
        }
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = async (id: string, password: string) => {
    if (!id || !password) throw new Error('ID and password are required');
    
    // Standardize input
    const cleanId = id.toLowerCase().trim();
    
    // Special Handling for System Admin
    if (cleanId === 'admin@vektorion.com') {
      if (password !== '#I47r32a6') throw new Error('Kata sandi admin salah.');
      const adminEmail = 'admin.system@vektorion.io';
      
      try {
        const result = await signInWithEmailAndPassword(auth, adminEmail, password);
        const docRef = doc(db, 'users', result.user.uid);
        const docSnap = await getDoc(docRef);
        
        if (!docSnap.exists()) {
          const adminProfile: UserProfile = {
            uid: result.user.uid,
            nim: 'ADMIN',
            name: 'SYSTEM ADMIN',
            photoURL: null,
            role: 'Administrator',
            isAdmin: true,
            position: 'System Developer'
          };
          await setDoc(docRef, adminProfile);
          setProfile(adminProfile);
        } else {
          setProfile(docSnap.data() as UserProfile);
        }
        return;
      } catch (adminError: any) {
        if (adminError.code === 'auth/user-not-found' || adminError.code === 'auth/invalid-credential') {
          // Auto-create system admin if not exists
          const signupResult = await createUserWithEmailAndPassword(auth, adminEmail, password);
          const adminProfile: UserProfile = {
            uid: signupResult.user.uid,
            nim: 'ADMIN',
            name: 'SYSTEM ADMIN',
            photoURL: null,
            role: 'Administrator',
            isAdmin: true,
            position: 'System Developer'
          };
          await setDoc(doc(db, 'users', signupResult.user.uid), adminProfile);
          setProfile(adminProfile);
          return;
        }
        throw adminError;
      }
    }

    // Special handling for irfan's ID which might contain #
    const emailPrefix = cleanId.startsWith('#') ? cleanId.replace('#', '') : cleanId.replace(/[^\w]/g, '');
    const email = `${emailPrefix}@vektorion.io`;
    
    // Find the member to check if password matches requirement for registration
    const nimFromId = (cleanId.includes('.') ? cleanId.split('.')[1] : (cleanId.startsWith('#') ? '125110007' : cleanId)).replace(/[^\d]/g, '');
    const member = MEMBERS_DATA.find(m => m.nim === nimFromId);

    try {
      // 1. Try to sign in
      const result = await signInWithEmailAndPassword(auth, email, password);
      
      // 2. Fetch/Confirm Profile
      const docRef = doc(db, 'users', result.user.uid);
      let docSnap;
      try {
        docSnap = await getDoc(docRef);
      } catch (fsError) {
        console.error("Firestore getDoc error:", fsError);
        throw fsError;
      }
      
      if (!docSnap?.exists()) {
        await createProfile(result.user, cleanId, member);
      } else {
        const data = docSnap.data() as UserProfile;
        if (cleanId === '#i47r32a6' || data.nim === '125110007') {
          if (!data.isAdmin) {
            try {
              await updateDoc(docRef, { isAdmin: true });
              data.isAdmin = true;
            } catch (err) {
              console.warn("Failed to auto-update admin status via client rules:", err);
            }
          }
        }
        setProfile(data);
      }
    } catch (error: any) {
      // 3. Handle Auto-Registration / Missing User
      if (error.code === 'auth/user-not-found' || error.code === 'auth/invalid-credential') {
        if (member) {
          // Verify that for first time registration, the password is correct (NIM or special for Irfan)
          const isIrfan = member.nim === '125110007';
          const isCorrectInitial = password === member.nim || (isIrfan && (password === 'I47r32a6' || password === '#I47r32a6' || password === 'I47r32z6'));
          
          if (!isCorrectInitial) {
             throw new Error('Kata sandi salah.');
          }

          try {
            const signupResult = await createUserWithEmailAndPassword(auth, email, password);
            await createProfile(signupResult.user, cleanId, member);
            return;
          } catch (signupError: any) {
            if (signupError.code === 'auth/email-already-in-use') {
              throw new Error('Identitas sudah terdaftar. Gunakan kata sandi yang pernah Anda gunakan sebelumnya, atau gunakan NIM jika ini pertama kali.');
            }
            if (signupError.code === 'auth/operation-not-allowed') {
              throw new Error('Metode login Email/Password belum diaktifkan di Firebase Console.');
            }
            console.error("Auto-registration failed:", signupError);
            throw signupError;
          }
        }
      }
      
      if (error.code === 'auth/wrong-password') {
        throw new Error('Kata sandi salah. Jika Anda admin (Irfan), pastikan menggunakan password yang benar (#I47r32a6, I47r32z6, atau NIM).');
      }
      
      if (error.code === 'auth/operation-not-allowed') {
        throw new Error('Metode login Email/Password belum diaktifkan di Firebase Console.');
      }

      console.error("Login failed:", error);
      throw error;
    }
  };

  const createProfile = async (fbUser: User, id: string, memberData?: any) => {
    const nim = id.includes('.') ? id.split('.')[1] : id;
    const member = memberData || MEMBERS_DATA.find(m => m.nim === nim || m.nim === '125110007' && id === '#i47r32a6');
    const isAdmin = id.toLowerCase() === '#i47r32a6' || nim === '125110007' || id.toLowerCase().includes('irfan');
    
    const newProfile: UserProfile = {
      uid: fbUser.uid,
      nim: nim === '#i47r32a6' ? '125110007' : nim,
      name: member?.name || (id.includes('.') ? id.split('.')[0].toUpperCase() : 'USER'),
      photoURL: null,
      role: 'Anggota', // Always show as Anggota in profile as requested
      isAdmin: isAdmin,
      position: 'Anggota' // Always show as Anggota in profile as requested
    };
    
    const docRef = doc(db, 'users', fbUser.uid);
    await setDoc(docRef, newProfile);
    setProfile(newProfile);
  };

  const logout = async () => {
    await signOut(auth);
    setProfile(null);
  };

  const updateProfile = async (data: Partial<UserProfile>) => {
    if (!user) return;
    const docRef = doc(db, 'users', user.uid);
    await updateDoc(docRef, data);
    setProfile(prev => prev ? { ...prev, ...data } : null);
    
    // Skip updating Firebase Auth photoURL if it's a long base64 string to avoid "photo URL too long" error.
    // Auth photoURL has a limit of ~2048 characters.
    if (data.photoURL && data.photoURL.length < 2000 && !data.photoURL.startsWith('data:')) {
      try {
        await fbUpdateProfile(user, { photoURL: data.photoURL });
      } catch (authError) {
        console.warn("Failed to sync photoURL to Firebase Auth (non-critical):", authError);
      }
    }
  };

  const changePassword = async (oldPassword: string, newPassword: string) => {
    if (!user || !user.email) return;
    const credential = EmailAuthProvider.credential(user.email, oldPassword);
    await reauthenticateWithCredential(user, credential);
    await fbUpdatePassword(user, newPassword);
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, login, logout, updateProfile, changePassword }}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
