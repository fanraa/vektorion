import React, { useState, useRef, useEffect } from 'react';
import { Search, Clock, ChevronRight, X, Image as ImageIcon, Send, Plus, Upload, Share2, Pencil, Trash2, Loader2, Info as InfoIcon } from 'lucide-react';
import { cn } from '../lib/utils';
import imageCompression from 'browser-image-compression';
import { useAuth } from '../lib/AuthContext';
import { db } from '../lib/firebase';
import { collection, addDoc, onSnapshot, query, orderBy, deleteDoc, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { Helmet } from 'react-helmet-async';
import { MaintenanceGuard } from '../components/MaintenanceGuard';
import { sendMulticastNotification } from '../lib/NotificationService';


const HERO_IMAGE = "https://res.cloudinary.com/dew39kqhy/image/upload/v1778784294/WhatsApp_Image_2026-05-15_at_01.43.30_slqxwy.jpg";

interface Announcement {
  id: string;
  title: string;
  category: string;
  date: string;
  shortDesc: string;
  fullDesc: string;
  imageUrl?: string;
  createdAt?: any;
}

const STATIC_INFO: Announcement = {
  id: 'welcome-info',
  title: 'Portal Informasi Vektorion Fisika ITERA 2025',
  category: 'Pusat Info',
  date: '-',
  shortDesc: 'Pusat informasi resmi kegiatan, akademik, dan perkembangan angkatan Fisika ITERA 2025.',
  fullDesc: `Selamat datang di Vektorion!

Ini adalah wadah resmi bagi angkatan Fisika ITERA 2025 (VEKTORION) untuk mendapatkan informasi terkini seputar kegiatan, agenda, dan administrasi angkatan.

Segala pengumuman penting mengenai kegiatan angkatan, info perkuliahan, dan hal-hal mendesak lainnya akan diupdate melalui halaman ini. Pastikan untuk selalu memantau halaman ini secara berkala agar tidak tertinggal informasi penting.

Semangat berjuang, Vektorion!`,
  imageUrl: 'https://res.cloudinary.com/dew39kqhy/image/upload/v1778698360/ls02iimcfwhvvxmm3e7q.jpg'
};

const INITIAL_DATA: Announcement[] = [
  {
    id: 'pra-kader-2026',
    title: 'Persiapan Pra-Kaderisasi Vektorion 2026',
    category: 'Kaderisasi',
    date: '14 Mei 2026',
    shortDesc: 'Informasi penting mengenai persiapan perlengkapan dan mental untuk menyambut Pra-Kaderisasi Vektorion mendatang.',
    fullDesc: `Halo Vektorion!

Persiapkan diri kalian untuk mengikuti rangkaian Pra-Kaderisasi yang akan segera dilaksanakan. Agenda ini sangat penting bagi kita semua untuk membangun solidaritas dan memahami nilai-nilai angkatan kita.

Hal-hal yang perlu disiapkan:
1. Perlengkapan wajib (cek daftar di grup koordinasi).
2. Mental dan fisik yang prima.
3. Kedisiplinan waktu adalah kunci utama.

Jangan lupa untuk mencatat tanggal mainnya dan pastikan kehadiran kalian 100%. Semangat berjuang bersama!`,
    imageUrl: 'https://res.cloudinary.com/dew39kqhy/image/upload/v1778694203/WhatsApp_Image_2026-05-14_at_00.39.07_zewiby.jpg'
  }
];

import { InfoSkeleton } from '../components/ui/Skeleton';
import { OptimizedImage } from '../components/ui/OptimizedImage';

export default function Info() {
  const { user, profile } = useAuth();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');


  const [selectedNews, setSelectedNews] = useState<Announcement | null>(null);
  
  // Create Form State
  const [editingInfo, setEditingInfo] = useState<Announcement | null>(null);
  const [isAddFormOpen, setIsAddFormOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [newInfo, setNewInfo] = useState({
    title: '',
    category: 'Umum',
    shortDesc: '',
    fullDesc: '',
    imageUrl: ''
  });

  // Scroll Lock
  useEffect(() => {
    if (isAddFormOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [isAddFormOpen]);

  const handleEdit = (e: React.MouseEvent, item: Announcement) => {
    e.stopPropagation();
    setEditingInfo(item);
    setNewInfo({
      title: item.title,
      category: item.category,
      shortDesc: item.shortDesc,
      fullDesc: item.fullDesc,
      imageUrl: item.imageUrl || ''
    });
    setIsAddFormOpen(true);
  };

  const handleOpenAdd = () => {
    setEditingInfo(null);
    setNewInfo({ title: '', category: 'Umum', shortDesc: '', fullDesc: '', imageUrl: '' });
    setIsAddFormOpen(true);
  };

  const isAdminOrAuthorized = (profile?.role?.toLowerCase().includes('admin') || 
    profile?.isAdmin ||
    user?.email === 'irfanrizkiaditribusiness@gmail.com' || 
    user?.email === 'irfanrizkiaditricreator@gmail.com' ||
    user?.email === 'admin@vektorion.com' ||
    user?.email === 'admin.system@vektorion.io') ?? false;

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

  const handleFirestoreError = (error: unknown, operationType: OperationType, path: string | null) => {
    const errInfo: FirestoreErrorInfo = {
      error: error instanceof Error ? error.message : String(error),
      authInfo: {
        userId: user?.uid,
        email: user?.email,
        emailVerified: user?.emailVerified,
        isAnonymous: user?.isAnonymous,
      },
      operationType,
      path
    };
    console.error('Firestore Error: ', JSON.stringify(errInfo));
    throw new Error(JSON.stringify(errInfo));
  };

  const handleSeed = async () => {
    if (uploading) return;
    setLoading(true);
    setUploading(true);
    console.log("Manual seeding triggered...");
    try {
      for (const item of INITIAL_DATA) {
        const { id: _, ...rest } = item;
        await addDoc(collection(db, 'announcements'), {
          ...rest,
          createdAt: serverTimestamp()
        });
      }
      alert('Data awal berhasil dimuat!');
    } catch (err) {
      console.error("Error manual seeding:", err);
      alert('Gagal memuat data. Periksa izin atau koneksi.');
    } finally {
      setLoading(false);
      setUploading(false);
    }
  };

  const filtered = [STATIC_INFO, ...announcements].filter(a => 
    a.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    a.shortDesc.toLowerCase().includes(searchQuery.toLowerCase())
  );

  useEffect(() => {
    setLoading(true);
    const q = query(collection(db, 'announcements'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Announcement[];
      
      setAnnouncements(data);
      setLoading(false);
    }, (error) => {
      console.error("Info announcements error:", error);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleSaveInfo = async () => {
    if (!newInfo.title || !newInfo.fullDesc) return;
    setUploading(true);
    
    try {
      if (editingInfo) {
        await updateDoc(doc(db, 'announcements', editingInfo.id!), {
          ...newInfo,
          shortDesc: newInfo.shortDesc || newInfo.fullDesc.substring(0, 100) + '...',
          updatedAt: serverTimestamp()
        });
      } else {
        const date = new Intl.DateTimeFormat('id-ID', {
          day: '2-digit',
          month: 'long',
          year: 'numeric'
        }).format(new Date());

        await addDoc(collection(db, 'announcements'), {
          ...newInfo,
          date,
          shortDesc: newInfo.shortDesc || newInfo.fullDesc.substring(0, 100) + '...',
          createdAt: serverTimestamp()
        });

        // Dispatch real-time PWA notification
        try {
          await sendMulticastNotification(
            `Pengumuman Baru: ${newInfo.title}`,
            newInfo.shortDesc || newInfo.fullDesc.substring(0, 100) + '...',
            'pengumuman',
            'Admin',
            '/info'
          );
        } catch (err) {
          console.error("Failed to send announcement notification:", err);
        }
      }


      setIsAddFormOpen(false);
      setEditingInfo(null);
      setNewInfo({ title: '', category: 'Umum', shortDesc: '', fullDesc: '', imageUrl: '' });
    } catch (err) {
      console.error("Error saving info:", err);
      handleFirestoreError(err, editingInfo ? OperationType.UPDATE : OperationType.CREATE, 'announcements');
    } finally {
      setUploading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const options = {
        maxSizeMB: 0.2, // Kompres ke ~200KB
        maxWidthOrHeight: 1280,
        useWebWorker: true
      };
      
      const compressedFile = await imageCompression(file, options);
      
      // Convert to base64 for preview and storage (as requested for simplicity/compression)
      // Note: In real production, use Firebase Storage. But here we use base64 because of user prompt context.
      const reader = new FileReader();
      reader.readAsDataURL(compressedFile);
      reader.onloadend = () => {
        setNewInfo(prev => ({ ...prev, imageUrl: reader.result as string }));
        setUploading(false);
      };
    } catch (error) {
      console.error("Compression error:", error);
      setUploading(false);
      alert("Gagal mengompres gambar");
    }
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!confirm('Hapus pengumuman ini?')) return;
    try {
      await deleteDoc(doc(db, 'announcements', id));
    } catch (err) {
      console.error("Error deleting:", err);
    }
  };

  const handleShare = async (e: React.MouseEvent, item: Announcement) => {
    e.stopPropagation();
    try {
      if (navigator.share) {
        await navigator.share({
          title: item.title,
          text: item.shortDesc,
          url: window.location.origin + window.location.pathname + '?id=' + item.id,
        });
      } else {
        await navigator.clipboard.writeText(window.location.origin + window.location.pathname + '?id=' + item.id);
        alert('Tautan pengumuman berhasil disalin!');
      }
    } catch (err) {
      console.error("Error sharing:", err);
    }
  };

  if (loading) return <InfoSkeleton />;

  if (selectedNews) {
    return (
      <MaintenanceGuard menuId="info">
        <div className="min-h-screen bg-[#f8fafc]">
        <Helmet>
          <title>{selectedNews.title} | VEKTORION</title>
          <meta name="description" content={selectedNews.shortDesc} />
          <meta property="og:title" content={selectedNews.title} />
          <meta property="og:description" content={selectedNews.shortDesc} />
          {selectedNews.imageUrl && <meta property="og:image" content={selectedNews.imageUrl} />}
          <meta name="twitter:card" content="summary_large_image" />
        </Helmet>
        
        {/* Background Detail - Transparan & Scrollable */}
        <div className="absolute inset-0 z-0 h-screen pointer-events-none overflow-hidden">
          <div 
            className="absolute top-0 left-0 w-full h-[600px] opacity-10"
            style={{ 
              backgroundImage: selectedNews.imageUrl ? `url("${selectedNews.imageUrl}")` : 'none',
              backgroundSize: 'cover',
              backgroundPosition: 'center'
            }}
          />
          <div className="absolute top-[300px] left-0 w-full h-[300px] bg-gradient-to-t from-[#f8fafc] to-transparent" />
        </div>
        
        {/* Content Detail */}
        <div className="relative z-10 max-w-4xl mx-auto px-6 pt-32 pb-20">
          <div className="space-y-8">
            {/* Title Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 bg-amber-500 text-white text-[8px] font-black uppercase tracking-widest rounded-sm">
                  {selectedNews.category}
                </span>
                <div className="flex items-center gap-2 text-slate-400">
                  <Clock size={12} />
                  <span className="text-[10px] font-bold uppercase tracking-widest">{selectedNews.date}</span>
                </div>
              </div>
              <h1 className="text-3xl md:text-5xl font-black text-slate-900 uppercase tracking-tighter leading-tight">
                {selectedNews.title}
              </h1>
            </div>

            {/* Image below Title */}
            {selectedNews.imageUrl && (
              <div className="w-full h-[300px] md:h-[450px] rounded-md overflow-hidden relative shadow-2xl border border-white/60">
                <OptimizedImage 
                  src={selectedNews.imageUrl} 
                  alt={selectedNews.title}
                  className="object-cover"
                  fallbackClassName="bg-slate-100"
                />
              </div>
            )}

            {/* Content Text */}
            <div className="prose prose-slate max-w-none">
              <p className="text-base md:text-lg text-slate-700 font-medium leading-relaxed whitespace-pre-wrap">
                {selectedNews.fullDesc}
              </p>
            </div>

            {/* Bottom Buttons - Centered */}
            <div className="flex flex-col items-center justify-center gap-6 pt-12">
              <div className="flex items-center gap-8">
                <button 
                  onClick={(e) => handleShare(e, selectedNews)}
                  className="text-amber-500 hover:text-amber-600 transition-all p-2 active:scale-90"
                >
                  <Share2 size={24} />
                </button>
                <button 
                  onClick={() => {
                    setSelectedNews(null);
                    window.scrollTo({ top: 300, behavior: 'smooth' });
                  }}
                  className="px-12 py-3 text-white text-[10px] font-black uppercase tracking-widest rounded-md shadow-xl transition-transform active:scale-95"
                  style={{
                    backgroundImage: `url("https://res.cloudinary.com/dew39kqhy/image/upload/v1778844203/ChatGPT_Image_15_Mei_2026_18.22.55_znq6au.png")`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center'
                  }}
                >
                  Kembali
                </button>
              </div>
            </div>

            {/* Other Info Section */}
            {([STATIC_INFO, ...announcements].filter(a => a.id !== selectedNews.id).length > 0) && (
              <div className="pt-16 pb-10">
                <div className="flex items-center gap-4 mb-8">
                   <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-800 whitespace-nowrap">Info Lainnya</h3>
                   <div className="h-[2px] flex-1 bg-slate-200" />
                </div>
                
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                  {[STATIC_INFO, ...announcements]
                    .filter(a => a.id !== selectedNews.id)
                    .slice(0, 3)
                    .map((other) => (
                      <div
                        key={other.id}
                        onClick={() => {
                          setSelectedNews(other);
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                        }}
                        className="group bg-white rounded-md border border-slate-100 shadow-sm p-4 cursor-pointer hover:border-amber-500 transition-all"
                      >
                        <div className="aspect-video w-full rounded-sm overflow-hidden mb-3">
                          {other.imageUrl ? (
                            <OptimizedImage 
                              src={other.imageUrl} 
                              alt={other.title} 
                              className="object-cover transition-transform group-hover:scale-105" 
                              fallbackClassName="bg-slate-100"
                            />
                          ) : (
                            <div className="w-full h-full bg-slate-50 flex items-center justify-center text-slate-200">
                               <ImageIcon size={20} />
                            </div>
                          )}
                        </div>
                        <span className="text-[7px] font-black uppercase text-amber-500 mb-1 block">{other.category}</span>
                        <h4 className="text-[10px] font-bold text-slate-900 leading-tight uppercase tracking-tight line-clamp-2">
                           {other.title}
                        </h4>
                      </div>
                    ))
                  }
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      </MaintenanceGuard>
    );
  }

  return (
    <MaintenanceGuard menuId="info">
      <div className="min-h-screen bg-[#f8fafc]">
      {/* Hero Header */}
      <div className="relative h-[320px] md:h-[380px] overflow-hidden flex items-end">
        <div 
          className="absolute inset-0 z-0 bg-slate-900"
          style={{
            backgroundImage: `url("${HERO_IMAGE}")`,
            backgroundSize: 'cover',
            backgroundPosition: 'center'
          }}
        >
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-[1px]" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#f8fafc] via-transparent to-transparent" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto w-full px-6 pb-16 pt-24 md:pt-32">
          <div className="flex flex-col items-start gap-4">
             <h1 className="text-4xl md:text-6xl font-black text-white tracking-tighter uppercase drop-shadow-2xl">
                <span className="text-amber-500">Pusat</span> Info
             </h1>
             <p className="text-white/90 font-normal tracking-wide text-xs md:text-sm max-w-2xl leading-relaxed">
                Temukan berbagai <span className="text-amber-400 font-bold">informasi penting</span>, <span className="text-amber-400 font-bold">pengumuman akademik</span>, <span className="text-amber-400 font-bold">jadwal kegiatan</span>, hingga berita terbaru seputar perkembangan angkatan Fisika ITERA 2025 <span className="text-amber-400 font-bold">(Vektorion)</span> yang selalu kami perbarui untuk kenyamanan koordinasi angkatan.
             </p>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-12 -mt-8 relative z-20">
        <div className="max-w-5xl mx-auto mb-12">
          <div className="relative group">
             <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-amber-500 transition-colors">
                <Search size={16} />
             </div>
             <input 
                type="text" 
                placeholder="Cari berita atau pengumuman..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-12 pl-12 pr-6 bg-white border border-slate-200 rounded-md text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-amber-500/5 focus:border-amber-500/50 transition-all text-[10px] font-medium shadow-xl shadow-slate-200/50"
             />
          </div>
          {isAdminOrAuthorized && (
            <div className="mt-4 flex justify-center">
             <button 
               onClick={handleOpenAdd}
               className="h-10 px-6 bg-slate-900 text-white rounded-md flex items-center gap-2 hover:bg-amber-500 hover:text-slate-900 transition-all shadow-lg active:scale-95"
             >
               <Plus size={16} />
               <span className="text-[10px] font-medium tracking-tight">Tambah pengumuman</span>
             </button>
            </div>
          )}
        </div>

        <div className="max-w-5xl mx-auto space-y-6">
          {loading ? (
             <div className="grid grid-cols-1 gap-6">
               {Array(3).fill(0).map((_, i) => (
                 <div key={i} className="animate-pulse bg-slate-200/40 rounded-md h-[220px] w-full" />
               ))}
             </div>
          ) : filtered.length > 0 ? (
            <div className="grid grid-cols-1 gap-6">
               {filtered.map((item) => (
                <div 
                   key={item.id} 
                   onClick={() => setSelectedNews(item)}
                   className="group relative bg-[#ffffff] rounded-md border border-amber-500/10 flex flex-col md:flex-row cursor-pointer hover:border-amber-500/40 hover:shadow-2xl hover:shadow-amber-500/10 transition-all duration-500 overflow-hidden min-h-[300px] md:min-h-[220px]"
                >
                   {/* Card Background Wrapper */}
                   <div className="absolute inset-0 z-0 overflow-hidden">
                      <div 
                        className="absolute inset-0 opacity-100 transition-transform duration-1000 group-hover:scale-110"
                        style={{ 
                          backgroundImage: `url("https://res.cloudinary.com/dew39kqhy/image/upload/v1778941327/ChatGPT_Image_16_Mei_2026_21.21.51_kbmcpd.png")`,
                          backgroundSize: 'cover',
                          backgroundPosition: 'center'
                        }}
                      />
                   </div>

                   {/* Image Container - Blended */}
                   <div className="relative w-full md:w-80 h-56 md:h-auto shrink-0 z-10 overflow-hidden">
                      {item.imageUrl ? (
                        <div className="w-full h-full relative">
                          <OptimizedImage 
                            src={item.imageUrl} 
                            alt={item.title} 
                            className="object-cover"
                            fallbackClassName="bg-slate-200"
                          />
                          {/* Desktop Gradient Mask (Amber - Narrow) */}
                          <div className="hidden md:block absolute inset-0 bg-gradient-to-l from-amber-100/40 via-transparent to-transparent opacity-100 z-10" />
                          <div className="hidden md:block absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-[#f8fafc]/50 to-transparent z-[11]" />
                          {/* Mobile Gradient Mask (Amber - Narrow) */}
                          <div className="block md:hidden absolute inset-0 bg-gradient-to-t from-amber-100/40 via-transparent to-transparent opacity-100 z-10" />
                          <div className="block md:hidden absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-[#f8fafc]/50 to-transparent z-[11]" />
                        </div>
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-slate-100 text-slate-300">
                          <ImageIcon size={32} />
                        </div>
                      )}
                      
                      {/* One-time shimmer effect - delayed and single direction */}
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent -translate-x-[150%] transition-transform duration-[1200ms] ease-out pointer-events-none group-hover:translate-x-[150%] group-hover:delay-300" />

                      <div className="absolute top-4 left-4 z-20">
                         <span className="px-3 py-1 bg-amber-500 text-white text-[8px] font-black uppercase tracking-widest rounded-sm shadow-lg">
                           {item.category}
                         </span>
                      </div>
                   </div>
                   
                   {/* Content Section */}
                   <div className="flex-1 p-6 md:p-8 space-y-4 relative z-10 flex flex-col justify-center">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 text-slate-900/60 text-[9px] font-black uppercase tracking-widest">
                          <Clock size={12} className="text-amber-600" />
                          {item.date}
                        </div>
                      </div>

                      <h2 className="text-xl md:text-2xl font-black text-slate-900 group-hover:text-amber-600 transition-colors uppercase tracking-tight leading-tight">
                         {item.title}
                      </h2>
                      
                      <p className="text-[11px] font-bold text-slate-700 line-clamp-2 leading-relaxed">
                         {item.shortDesc}
                      </p>

                      <div className="pt-2 flex items-center gap-2 text-amber-600 text-[9px] font-medium">
                         <span>Baca selengkapnya</span>
                         <ChevronRight size={12} />
                      </div>

                      <div className="absolute top-4 right-4 flex gap-2 z-30">
                        <button 
                          onClick={(e) => handleShare(e, item)}
                          className="p-1.5 bg-white/20 hover:bg-amber-500 text-slate-900 rounded-md backdrop-blur-md transition-colors border border-white/30 shadow-sm"
                          title="Bagikan"
                        >
                          <Share2 size={12} />
                        </button>
                        {isAdminOrAuthorized && item.id !== 'welcome-info' && (
                          <>
                            <button 
                              onClick={(e) => handleEdit(e, item)}
                              className="p-1.5 bg-white/20 hover:bg-amber-500 text-slate-900 rounded-md backdrop-blur-md transition-colors border border-white/30"
                            >
                              <Pencil size={12} />
                            </button>
                            <button 
                              onClick={(e) => handleDelete(e, item.id)}
                              className="p-1.5 bg-white/20 hover:bg-red-500 text-white rounded-md backdrop-blur-md transition-colors border border-white/30"
                            >
                              <Trash2 size={12} />
                            </button>
                          </>
                        )}
                      </div>
                   </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-32 space-y-6 text-center">
              <div className="w-16 h-16 bg-slate-100 rounded-md flex items-center justify-center text-slate-200">
                 <Search size={32} />
              </div>
              <div>
                <h4 className="text-lg text-slate-900 font-normal">Tidak ditemukan</h4>
                <p className="text-slate-400 text-xs font-normal">Coba cari dengan kata kunci lain</p>
                {isAdminOrAuthorized && announcements.length === 0 && (
                  <button 
                    onClick={handleSeed}
                    className="mt-6 px-6 py-2 bg-slate-900 text-white rounded-md text-[10px] font-medium hover:bg-amber-500 hover:text-slate-900 transition-all"
                  >
                    Muat data awal
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Add Info Modal */}
      {isAddFormOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
           <div 
             className="absolute inset-0 bg-slate-900/60 backdrop-blur-md cursor-pointer"
             onClick={() => setIsAddFormOpen(false)}
           />
           <div 
             className="relative w-full max-w-2xl bg-white rounded-md shadow-2xl overflow-hidden border border-slate-100 flex flex-col max-h-[90vh]"
             onClick={e => e.stopPropagation()}
           >
                <div className="flex items-center justify-between p-6 border-b border-slate-50 bg-white sticky top-0 z-10">
                   <div className="flex items-center gap-3">
                      <img 
                        src="https://cdn-icons-png.flaticon.com/128/9479/9479228.png" 
                        alt="Info Icon" 
                        className="w-6 h-6 object-contain brightness-0 invert-0 group-hover:brightness-100 transition-all"
                        style={{ filter: 'invert(52%) sepia(85%) saturate(1914%) hue-rotate(1deg) brightness(101%) contrast(105%)' }}
                      />
                      <h3 className="text-xs font-black uppercase tracking-widest text-slate-900">
                        {editingInfo ? 'Edit Info' : 'Tambah Info Baru'}
                      </h3>
                   </div>
                   <button 
                     type="button"
                     onClick={() => setIsAddFormOpen(false)}
                     className="p-2 bg-slate-50 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors"
                   >
                     <X size={20} />
                   </button>
                </div>

                <div className="overflow-y-auto p-6 space-y-6">
                   <div className="space-y-4">
                      {/* Image Preview / Input */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                           <p className="text-[10px] font-medium text-slate-400 tracking-widest">Gambar cover (URL)</p>
                           <input 
                             type="text" 
                             placeholder="https://images.unsplash.com/..."
                             value={newInfo.imageUrl}
                             onChange={(e) => setNewInfo({...newInfo, imageUrl: e.target.value})}
                             className="w-full h-12 px-4 bg-slate-50 border border-slate-200 rounded-md text-xs font-medium focus:outline-none focus:border-amber-500 transition-all placeholder:text-slate-300"
                           />
                        </div>
                        <div className="space-y-2">
                           <p className="text-[10px] font-medium text-slate-400 tracking-widest">Upload Berkas</p>
                           <label className="flex items-center justify-center w-full h-12 px-4 bg-slate-50 border-2 border-dashed border-slate-200 rounded-md cursor-pointer hover:bg-slate-100 hover:border-amber-500 transition-all group">
                             <div className="flex items-center gap-2 text-slate-400 group-hover:text-amber-600">
                               <Upload size={16} />
                               <span className="text-[10px] font-bold uppercase">Pilih Gambar</span>
                             </div>
                             <input 
                               type="file" 
                               accept="image/*"
                               onChange={handleFileUpload}
                               className="hidden" 
                             />
                           </label>
                        </div>
                      </div>

                      {newInfo.imageUrl && (
                        <div className="w-full h-40 rounded-md border border-slate-100 overflow-hidden relative shadow-inner">
                           <OptimizedImage 
                             src={newInfo.imageUrl} 
                             alt="Preview" 
                             className="object-cover" 
                             fallbackClassName="bg-slate-100"
                           />
                           <button 
                            onClick={() => setNewInfo(prev => ({...prev, imageUrl: ''}))}
                            className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-md shadow-lg active:scale-90"
                           >
                            <X size={12} />
                           </button>
                        </div>
                      )}

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                         <div className="space-y-2">
                            <p className="text-[10px] font-medium text-slate-400 tracking-widest">Judul info</p>
                            <input 
                              type="text" 
                              value={newInfo.title}
                              onChange={(e) => setNewInfo({...newInfo, title: e.target.value})}
                              className="w-full h-12 px-4 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-amber-500 transition-all"
                            />
                         </div>
                         <div className="space-y-2">
                            <p className="text-[10px] font-medium text-slate-400 tracking-widest">Kategori</p>
                            <select 
                              value={newInfo.category}
                              onChange={(e) => setNewInfo({...newInfo, category: e.target.value})}
                              className="w-full h-12 px-4 bg-slate-50 border border-slate-200 rounded-xl text-xs font-black uppercase tracking-widest focus:outline-none focus:border-amber-500 transition-all"
                            >
                               <option>Umum</option>
                               <option>Akademik</option>
                               <option>Kaderisasi</option>
                               <option>Praktikum</option>
                               <option>Kegiatan</option>
                            </select>
                         </div>
                      </div>

                      <div className="space-y-2">
                         <p className="text-[10px] font-medium text-slate-400 tracking-widest">Deskripsi lengkap</p>
                         <textarea 
                           rows={6}
                           value={newInfo.fullDesc}
                           onChange={(e) => setNewInfo({...newInfo, fullDesc: e.target.value})}
                           className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-amber-500 transition-all resize-none"
                           placeholder="Tuliskan isi pengumuman secara lengkap..."
                        />
                      </div>
                   </div>

                   <button 
                     disabled={uploading || !newInfo.title || !newInfo.fullDesc}
                     onClick={handleSaveInfo}
                     className="w-full h-14 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:brightness-110 active:scale-[0.98] transition-all shadow-xl shadow-slate-900/10 disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden"
                     style={{ 
                       backgroundImage: `url("https://res.cloudinary.com/dew39kqhy/image/upload/v1778844203/ChatGPT_Image_15_Mei_2026_18.22.55_znq6au.png")`,
                       backgroundSize: 'cover',
                       backgroundPosition: 'center'
                     }}
                   >
                     <div className="absolute inset-0 bg-slate-900/40" />
                     <span className="relative z-10 flex items-center justify-center gap-3">
                       {uploading ? (
                         <>
                           <Loader2 size={16} className="animate-spin text-amber-500" />
                           Memproses...
                         </>
                       ) : (
                         editingInfo ? "Simpan Perubahan" : "Publikasikan Info"
                       )}
                     </span>
                   </button>
                </div>
             </div>
          </div>
        )}

      </div>
    </MaintenanceGuard>
  );
}
