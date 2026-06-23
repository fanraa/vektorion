import { useLocation } from 'react-router-dom';
import { 
  HomeSkeleton, 
  KasSkeleton, 
  GaleriSkeleton, 
  AgendaSkeleton, 
  StrukturSkeleton, 
  ProfileSkeleton, 
  InfoSkeleton,
  LoginSkeleton,
  SkeletonPage, 
  Skeleton 
} from './ui/Skeleton';

export default function SuspenseFallback() {
  const location = useLocation();
  const path = location.pathname;

  if (path.includes('/home') || path === '/') {
    return <HomeSkeleton />;
  }
  if (path.includes('/kas') || path.includes('/bendahara')) {
    return <KasSkeleton />;
  }
  if (path.includes('/galeri')) {
    return <GaleriSkeleton />;
  }
  if (path.includes('/agenda')) {
    return <AgendaSkeleton />;
  }
  if (path.includes('/struktur') || path.includes('/anggota')) {
    return <StrukturSkeleton />;
  }
  if (path.includes('/profile')) {
    return <ProfileSkeleton />;
  }
  if (path.includes('/info') || path.includes('/pengumuman') || path.includes('/praktikum')) {
    return <InfoSkeleton />;
  }
  if (path.includes('/login')) {
    return <LoginSkeleton />;
  }

  // Fallback default serbaguna yang elegan
  return (
    <SkeletonPage>
      <div className="space-y-6 max-w-4xl mx-auto">
        <Skeleton className="h-12 w-64 bg-slate-200/60" />
        <Skeleton className="h-4 w-full max-w-xl bg-slate-200/60" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-8">
          <Skeleton className="h-48 rounded-xl bg-slate-200/60" />
          <Skeleton className="h-48 rounded-xl bg-slate-200/60" />
          <Skeleton className="h-48 rounded-xl bg-slate-200/60" />
        </div>
      </div>
    </SkeletonPage>
  );
}
