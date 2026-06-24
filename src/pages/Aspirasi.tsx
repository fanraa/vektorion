import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../lib/AuthContext';
import { db } from '../lib/firebase';
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { Shield, MessageSquare, Send, User, Lock, AlertCircle, CheckCircle2, Clock, Info, Share2, Trash2, Pin, PinOff, ArrowUp, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '../lib/utils';
import { OptimizedImage } from '../components/ui/OptimizedImage';
import { Loader2 } from 'lucide-react';
import { Helmet } from 'react-helmet-async';

interface Aspiration {
  id: string;
  message: string;
  createdAt: any;
  isPinned?: boolean;
}

export default function Aspirasi() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [aspirations, setAspirations] = useState<Aspiration[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [notification, setNotification] = useState<{ status: 'success' | 'error', text: string } | null>(null);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [contextMenu, setContextMenu] = useState<{ visible: boolean, x: number, y: number, item: Aspiration | null } | null>(null);
  const touchTimerRef = useRef<NodeJS.Timeout | null>(null);

  const MAX_CHARS = 2000;
  const isAdmin = profile?.isAdmin || profile?.role?.toLowerCase() === 'admin' || false;

  useEffect(() => {
    if (showLoginModal) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [showLoginModal]);

  useEffect(() => {
    // Load draft if any
    const draft = localStorage.getItem('aspirasi_draft');
    if (draft) {
      setMessage(draft);
    }

    const q = query(collection(db, 'aspirasi'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Aspiration[];
      
      const pinned = data.filter(a => a.isPinned);
      const unpinned = data.filter(a => !a.isPinned);
      
      setAspirations([...pinned, ...unpinned]);
      setIsLoading(false);
    });

    const handleScroll = () => {
      if (window.scrollY > 300) {
        setShowScrollTop(true);
      } else {
        setShowScrollTop(false);
      }
    };
    
    const handleClickOutside = () => {
      if (contextMenu?.visible) {
        setContextMenu(null);
        setDeleteConfirmId(null);
      }
    };

    window.addEventListener('scroll', handleScroll);
    window.addEventListener('click', handleClickOutside);

    return () => {
      unsubscribe();
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('click', handleClickOutside);
    };
  }, [contextMenu]);

  const handleMessageChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value;
    if (text.length <= MAX_CHARS) {
      setMessage(text);
      localStorage.setItem('aspirasi_draft', text);
    }
  };

  const sanitizeInput = (text: string) => {
    return text.replace(/<[^>]*>?/gm, '');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!message.trim()) return;
    
    if (message.trim().length < 10) {
      setNotification({ status: 'error', text: 'Aspirasi terlalu pendek. Minimal 10 karakter.' });
      setTimeout(() => setNotification(null), 3000);
      return;
    }

    if (!user) {
      setShowLoginModal(true);
      return;
    }

    setIsSubmitting(true);
    try {
      const sanitizedMessage = sanitizeInput(message.trim());
      
      await addDoc(collection(db, 'aspirasi'), {
        message: sanitizedMessage,
        createdAt: serverTimestamp()
      });

      setMessage('');
      localStorage.removeItem('aspirasi_draft');
      setNotification({ status: 'success', text: 'Aspirasi berhasil dikirim secara anonim!' });
      setTimeout(() => setNotification(null), 3000);
    } catch (error) {
      console.error("Error adding aspiration: ", error);
      setNotification({ status: 'error', text: 'Gagal mengirim aspirasi.' });
      setTimeout(() => setNotification(null), 3000);
    } finally {
      setIsSubmitting(false);
    }
  };

  const proceedToLogin = () => {
    navigate('/login');
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'aspirasi', id));
      setNotification({ status: 'success', text: 'Aspirasi berhasil dihapus.' });
      setTimeout(() => setNotification(null), 3000);
      setContextMenu(null);
      setDeleteConfirmId(null);
    } catch (error) {
      console.error(error);
      setNotification({ status: 'error', text: 'Gagal menghapus aspirasi.' });
      setTimeout(() => setNotification(null), 3000);
    }
  };

  const handleTogglePin = async (item: Aspiration) => {
    const currentPinnedCount = aspirations.filter(a => a.isPinned).length;
    
    if (!item.isPinned && currentPinnedCount >= 3) {
      setNotification({ status: 'error', text: 'Maksimal hanya 3 aspirasi yang bisa di-pin.' });
      setTimeout(() => setNotification(null), 3000);
      setContextMenu(null);
      return;
    }

    try {
      await updateDoc(doc(db, 'aspirasi', item.id), {
        isPinned: !item.isPinned
      });
      setNotification({ status: 'success', text: item.isPinned ? 'Pin dilepas.' : 'Aspirasi disematkan di atas.' });
      setTimeout(() => setNotification(null), 3000);
      setContextMenu(null);
    } catch (error) {
      console.error(error);
      setNotification({ status: 'error', text: 'Gagal menyematkan aspirasi.' });
      setTimeout(() => setNotification(null), 3000);
    }
  };

  const handleShare = async (item: Aspiration) => {
    const shareText = `Aspirasi (Anonim) dari Kotak Aspirasi Vektorion:\n\n"${item.message}"\n\nKirim aspirasimu di: ${window.location.origin}/aspirasi`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Aspirasi Vektorion',
          text: shareText,
        });
      } catch (err) {
        console.log('Share failed:', err);
      }
    } else {
      navigator.clipboard.writeText(shareText);
      setNotification({ status: 'success', text: 'Teks aspirasi disalin ke clipboard!' });
      setTimeout(() => setNotification(null), 3000);
    }
    setContextMenu(null);
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'Baru saja';
    const date = timestamp.toDate();
    return new Intl.DateTimeFormat('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  return (
    <div className="min-h-screen bg-slate-50 pt-24 pb-12 relative">
      <Helmet>
        <title>Kotak Aspirasi | Vektorion</title>
        <meta name="description" content="Kotak Aspirasi (Anonim) Vektorion. Ruang aman untuk menyampaikan kritik, saran, dan keluh kesah." />
        <meta property="og:title" content="Kotak Aspirasi Vektorion" />
        <meta property="og:description" content="Sampaikan suara dan aspirasimu secara anonim untuk kemajuan angkatan Fisika ITERA 2025." />
      </Helmet>

      <div className="container mx-auto px-4 max-w-4xl">
        
        {/* Header Section */}
        <div className="text-center mb-10">
          <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-3 tracking-tight">Kotak Aspirasi</h1>
          <p className="text-slate-500 text-sm md:text-base max-w-2xl mx-auto">
            Ruang aman bagi mahasiswa untuk menyampaikan kritik, saran, atau keluh kesah secara anonim. Suara kamu penting untuk kemajuan angkatan.
          </p>
        </div>

        {/* Submission Form */}
        <div className="bg-white rounded-md shadow-sm border border-slate-200 p-4 sm:p-6 md:p-8 mb-10 relative">
          {/* Subtle background texture */}
          <div className="absolute inset-0 opacity-[0.03] pointer-events-none rounded-md overflow-hidden"
               style={{
                 backgroundImage: `url("https://res.cloudinary.com/dew39kqhy/image/upload/v1778790033/ChatGPT_Image_15_Mei_2026_03.20.20_wybfj7.png")`,
                 backgroundSize: 'cover',
                 backgroundPosition: 'center',
               }}
          />
          
          <div className="relative z-10">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <label htmlFor="message" className="block text-sm font-bold text-slate-700">Tulis Aspirasi Kamu</label>
                    <div className="relative group">
                      <button type="button" className="p-1 cursor-help focus:outline-none">
                        <Info size={14} className="text-amber-500" />
                      </button>
                      <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-64 bg-white text-slate-700 text-xs p-3 rounded-md shadow-xl border border-slate-100 opacity-0 invisible group-hover:opacity-100 group-hover:visible group-focus-within:opacity-100 group-focus-within:visible transition-all z-50 pointer-events-none">
                        <div className="font-bold text-amber-600 mb-1">100% Rahasia & Anonim</div>
                        Pesan yang kamu tulis dijamin kerahasiaannya. Meskipun sistem memintamu login, identitasmu (nama & email) TIDAK AKAN disimpan atau dikirim ke database.
                        <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 border-4 border-transparent border-t-white"></div>
                      </div>
                    </div>
                  </div>
                  <span className={cn(
                    "text-xs font-medium",
                    message.length >= MAX_CHARS ? "text-red-500" : "text-slate-400"
                  )}>
                    {message.length} / {MAX_CHARS}
                  </span>
                </div>
                <textarea
                  id="message"
                  rows={8}
                  value={message}
                  onChange={handleMessageChange}
                  placeholder="Sampaikan kritik, saran, atau keluh kesahmu di sini secara bebas namun tetap sopan... (minimal 10 karakter)"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-md focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-all resize-y text-[13px] leading-relaxed"
                  required
                  minLength={10}
                />
              </div>

              <div className="flex flex-col sm:flex-row justify-end gap-3">
                <button
                  type="button"
                  onClick={() => navigate(-1)}
                  className="flex items-center justify-center gap-2 px-8 py-3 bg-white border border-slate-200 text-slate-700 font-bold text-sm rounded-md hover:bg-slate-50 transition-all active:scale-95 w-full sm:w-auto order-2 sm:order-1"
                >
                  Kembali
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !message.trim() || message.trim().length < 10}
                  className="flex items-center justify-center px-8 py-3 bg-slate-900 text-white font-bold text-sm rounded-md hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95 whitespace-nowrap w-full sm:w-auto order-1 sm:order-2 bg-cover bg-center shadow-md relative overflow-hidden"
                  style={{ backgroundImage: `url('https://res.cloudinary.com/dew39kqhy/image/upload/v1778844203/ChatGPT_Image_15_Mei_2026_18.22.55_znq6au.png')` }}
                >
                  <div className="absolute inset-0 bg-amber-500 mix-blend-multiply opacity-20"></div>
                  <span className="relative z-10 flex items-center gap-2">
                    {isSubmitting ? (
                      <Loader2 size={18} className="animate-spin" />
                    ) : (
                      <>
                        Kirim Aspirasi
                        <Send size={16} />
                      </>
                    )}
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Aspirations List */}
        <div>
          <div className="flex items-center gap-3 mb-6">
            <h2 className="text-xl font-bold text-slate-900">Suara Angkatan</h2>
            <div className="h-px flex-1 bg-slate-200 ml-2" />
          </div>

          <div className="space-y-4">
            {isLoading ? (
              [...Array(3)].map((_, i) => (
                <div key={i} className="bg-white p-5 md:p-6 rounded-md shadow-sm border border-slate-200 animate-pulse">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-full bg-slate-100"></div>
                    <div className="space-y-2">
                      <div className="h-4 w-24 bg-slate-100 rounded"></div>
                      <div className="h-3 w-16 bg-slate-100 rounded"></div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="h-4 w-full bg-slate-100 rounded"></div>
                    <div className="h-4 w-5/6 bg-slate-100 rounded"></div>
                    <div className="h-4 w-4/6 bg-slate-100 rounded"></div>
                  </div>
                </div>
              ))
            ) : aspirations.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-md border border-slate-200 border-dashed">
                <MessageSquare className="w-12 h-12 text-slate-200 mx-auto mb-3" />
                <p className="text-slate-500 text-sm font-medium">Belum ada aspirasi yang dikirimkan.</p>
              </div>
            ) : (
              aspirations.map((item) => (
                <div 
                  key={item.id} 
                  className={cn("bg-white p-5 md:p-6 rounded-md shadow-sm border hover:border-amber-200 transition-colors relative", item.isPinned ? "border-amber-300" : "border-slate-200")}
                >
                  {item.isPinned && (
                    <div className="absolute -top-3 left-4 bg-amber-500 text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1 shadow-sm">
                      <Pin size={10} className="fill-white" /> Disematkan
                    </div>
                  )}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                        <User size={18} />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-900">Seseorang (Anonim)</p>
                        <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mt-0.5">
                          <Clock size={10} />
                          <span>{formatDate(item.createdAt)}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleShare(item)}
                        className="text-slate-400 hover:text-amber-500 transition-colors p-1"
                        title="Bagikan Aspirasi"
                      >
                        <Share2 size={16} />
                      </button>
                      
                      {isAdmin && (
                        <>
                          <button
                            onClick={() => handleTogglePin(item)}
                            className={cn("transition-colors p-1", item.isPinned ? "text-amber-500" : "text-slate-400 hover:text-amber-500")}
                            title={item.isPinned ? "Lepas sematan" : "Sematkan ke atas"}
                          >
                            {item.isPinned ? <PinOff size={16} /> : <Pin size={16} />}
                          </button>
                          
                          <div className="relative">
                            <button
                              onClick={() => setDeleteConfirmId(item.id)}
                              className="text-slate-400 hover:text-red-500 transition-colors p-1"
                              title="Hapus Aspirasi"
                            >
                              <Trash2 size={16} />
                            </button>
                            
                            {deleteConfirmId === item.id && (
                              <div className="absolute right-0 top-full mt-2 w-48 bg-white border border-slate-200 shadow-xl rounded-md p-3 z-20 animate-in fade-in zoom-in-95">
                                <p className="text-[11px] font-bold text-slate-700 mb-2 text-center">Yakin ingin menghapus?</p>
                                <div className="flex items-center gap-2">
                                  <button onClick={() => handleDelete(item.id)} className="flex-1 py-1.5 bg-red-500 text-white text-[11px] font-bold rounded hover:bg-red-600 transition-colors">
                                    Hapus
                                  </button>
                                  <button onClick={() => setDeleteConfirmId(null)} className="flex-1 py-1.5 bg-slate-100 text-slate-600 text-[11px] font-bold rounded hover:bg-slate-200 transition-colors">
                                    Batal
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                  <p className="text-slate-700 text-sm leading-relaxed whitespace-pre-wrap">
                    {item.message}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

      {/* Login Modal */}
      {showLoginModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setShowLoginModal(false)} />
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm relative z-10 overflow-hidden animate-in fade-in zoom-in-95">
            <div className="p-6 text-center">
              <img 
                src="https://cdn-icons-png.flaticon.com/128/17887/17887167.png" 
                alt="Verifikasi" 
                className="w-14 h-14 mx-auto mb-4 object-contain"
                style={{ filter: 'brightness(0) saturate(100%) invert(64%) sepia(76%) saturate(2304%) hue-rotate(12deg) brightness(101%) contrast(101%)' }} 
              />
              <h3 className="text-lg font-bold text-slate-900 mb-2">Verifikasi Mahasiswa</h3>
              <p className="text-sm text-slate-500 mb-6 leading-relaxed">
                Untuk mencegah spam, kamu harus login terlebih dahulu. <strong>Pesanmu tetap akan dikirim 100% anonim</strong> tanpa menyertakan nama atau identitas apapun.
              </p>
              <div className="flex flex-col gap-3">
                <button
                  onClick={proceedToLogin}
                  className="w-full py-2.5 text-white font-bold text-sm rounded-md hover:opacity-90 transition-opacity bg-cover bg-center shadow-md relative overflow-hidden"
                  style={{ backgroundImage: `url('https://res.cloudinary.com/dew39kqhy/image/upload/v1778844203/ChatGPT_Image_15_Mei_2026_18.22.55_znq6au.png')` }}
                >
                  <div className="absolute inset-0 bg-amber-500 mix-blend-multiply opacity-20"></div>
                  <span className="relative z-10">Lanjut ke Halaman Login</span>
                </button>
                <button
                  onClick={() => setShowLoginModal(false)}
                  className="w-full py-2.5 bg-slate-100 text-slate-600 font-bold text-sm rounded-md hover:bg-slate-200 transition-colors"
                >
                  Batal
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Notification Toast */}
      {notification && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-bottom-4">
          <div className="bg-white/95 backdrop-blur-md px-4 py-3 rounded-md shadow-xl border flex items-center gap-3 min-w-[280px]">
            {notification.status === 'success' ? (
              <CheckCircle2 size={18} className="text-emerald-500 shrink-0" />
            ) : (
              <AlertCircle size={18} className="text-red-500 shrink-0" />
            )}
            <span className="text-xs font-bold text-slate-700">{notification.text}</span>
          </div>
        </div>
      )}
      {/* Scroll to Top Button */}
      {showScrollTop && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-24 right-6 md:bottom-8 md:right-8 z-40 p-2.5 bg-white border border-slate-200 shadow-md rounded-md text-slate-500 hover:text-amber-500 hover:border-amber-200 transition-all hover:shadow-lg animate-in fade-in slide-in-from-bottom-4"
          aria-label="Scroll to top"
        >
          <ArrowUp size={16} />
        </button>
      )}
    </div>
  );
}
