import React, { useState, useEffect } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../lib/AuthContext';
import { useNavbar } from '../lib/NavbarContext';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { 
  HomeSkeleton, 
  KasSkeleton, 
  GaleriSkeleton, 
  AgendaSkeleton, 
  StrukturSkeleton, 
  ProfileSkeleton, 
  InfoSkeleton,
  SkeletonPage, 
  Skeleton 
} from './ui/Skeleton';

interface MaintenanceGuardProps {
  menuId: string;
  children: React.ReactNode;
}

export const MaintenanceGuard: React.FC<MaintenanceGuardProps> = ({ menuId, children }) => {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [isLocked, setIsLocked] = useState(false);
  const [loading, setLoading] = useState(true);
  const { setNavbarVisible } = useNavbar();

  useEffect(() => {
    setNavbarVisible(false);

    if (profile?.isAdmin) {
      setIsLocked(false);
      setLoading(false);
      setNavbarVisible(true);
      return;
    }

    const unsub = onSnapshot(doc(db, 'appConfig', 'systemSettings'), (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        const lockedMenus = data.lockedMenus || {};
        setIsLocked(!!lockedMenus[menuId]);
      }
      setLoading(false);
      setNavbarVisible(true);
    }, (error) => {
      console.error("Maintenance check failed:", error);
      setLoading(false);
      setNavbarVisible(true);
    });

    return () => unsub();
  }, [menuId, profile?.isAdmin, setNavbarVisible]);

  if (loading) {
    // Optimistic render: langsung render children. Jika ternyata locked, akan di-swap segera setelah snapshot masuk.
    return <>{children}</>;
  }

  if (isLocked) {
    return (
      <div
        className="flex flex-col items-center justify-center min-h-[80vh] px-6 text-center pt-20"
        style={{ animation: 'pageFadeIn 0.3s ease-out' }}
      >
        <div className="w-32 h-32 mb-6">
          <img 
            src="https://cdn-icons-gif.flaticon.com/18307/18307620.gif" 
            alt="Maintenance" 
            className="w-full h-full object-contain mix-blend-multiply opacity-70"
          />
        </div>
        <h2 className="text-lg font-bold text-slate-800 uppercase tracking-tight mb-2">
          Akses Terganggu
        </h2>
        <p className="text-[11px] text-slate-500 max-w-xs leading-relaxed mb-8">
          Maaf, menu <span className="font-bold text-slate-700 uppercase">{menuId}</span> sedang mengalami gangguan sistem sementara.
        </p>
        <button 
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-md shadow-sm hover:bg-slate-50 transition-colors group"
        >
          <ArrowLeft size={12} className="text-slate-400 group-hover:text-slate-600 transition-colors" />
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Kembali</span>
        </button>
      </div>
    );
  }

  return <>{children}</>;
};