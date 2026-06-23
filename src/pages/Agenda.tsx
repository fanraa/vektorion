import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { 
  Calendar as CalendarIcon, 
  MapPin, 
  Clock, 
  Plus, 
  X, 
  Save, 
  Tag, 
  AlignLeft,
  CalendarDays,
  User,
  Info as InfoIcon,
  Trash2,
  Share2,
  Download
} from 'lucide-react';
import { cn } from '../lib/utils';
import { useAuth } from '../lib/AuthContext';
import { 
  collection, 
  addDoc, 
  onSnapshot, 
  query, 
  orderBy, 
  deleteDoc, 
  doc, 
  serverTimestamp,
  Timestamp 
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { MaintenanceGuard } from '../components/MaintenanceGuard';
import { sendMulticastNotification } from '../lib/NotificationService';
import { MapLocationPicker } from '../components/MapLocationPicker';


interface AgendaItem {
  id: string;
  title: string;
  date: string;
  time: string;
  location: string;
  category: string;
  status: string;
  description: string;
  author: string;
  authorId: string;
  authorPhoto?: string;
  createdAt?: Timestamp;
}

import { AgendaSkeleton } from '../components/ui/Skeleton';
import { OptimizedImage } from '../components/ui/OptimizedImage';

export default function Agenda() {
  const { user, profile } = useAuth();
  const [searchParams] = useSearchParams();
  const [agendas, setAgendas] = useState<AgendaItem[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [showHelp, setShowHelp] = useState(false);

  useEffect(() => {
    const q = query(collection(db, 'agendas'), orderBy('createdAt', 'desc'));
    
    // System Agendas (Static and permanent)
    const SYSTEM_AGENDAS: AgendaItem[] = [
      {
        id: 'system-kas',
        title: 'Pembayaran Kas Angkatan',
        date: '30 April 2026',
        time: '-',
        location: '-',
        category: 'Keuangan',
        status: 'Upcoming',
        description: 'Halo kawan-kawan Vektorion! Jangan lupa untuk menyisihkan sedikit iuran kas kita ya untuk kelancaran program kerja kita kedepannya. Terima kasih atas pengertiannya!',
        author: 'Sistem',
        authorId: 'system',
        authorPhoto: 'https://res.cloudinary.com/dew39kqhy/image/upload/v1778155257/BackgroundEraser_20260507_190027268_bc5p07.png'
      },
      {
        id: 'system-kaderisasi',
        title: 'Pra-Kaderisasi Hima Fisika ITERA',
        date: '02 Mei 2026',
        time: '09:00 WIB - Selesai',
        location: 'Embung B / RK / TBA',
        category: 'Kegiatan',
        status: 'Urgent',
        description: 'Wajib bagi seluruh mahasiswa Fisika 2025. Agenda ini merupakan bagian penting dari proses kaderisasi himpunan. Mohon kehadirannya tepat waktu dan persiapkan diri dengan baik!',
        author: 'Sistem',
        authorId: 'system',
        authorPhoto: 'https://res.cloudinary.com/dew39kqhy/image/upload/v1778155257/BackgroundEraser_20260507_190027268_bc5p07.png'
      }
    ];

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const items: AgendaItem[] = [];
      snapshot.forEach((doc) => {
        items.push({ id: doc.id, ...doc.data() } as AgendaItem);
      });
      
      // Combine with system agendas at the bottom
      setAgendas([...items, ...SYSTEM_AGENDAS]);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'agendas');
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const id = searchParams.get('id');
    if (id) {
      setExpandedId(id);
    }
  }, [searchParams]);

  const [newAgenda, setNewAgenda] = useState<Partial<AgendaItem>>({
    title: '',
    date: '',
    time: '',
    location: '',
    category: 'Rapat',
    status: 'Upcoming',
    description: ''
  });

  const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
  const [editorDay, setEditorDay] = useState('');
  const [editorMonth, setEditorMonth] = useState(months[new Date().getMonth()]);
  const [editorHour, setEditorHour] = useState('');
  const [editorMinute, setEditorMinute] = useState('');

  const toggleExpand = (id: string) => {
    setExpandedId(prevId => prevId === id ? null : id);
    setConfirmDeleteId(null);
  };

  const handleDelete = async (id: string) => {
    try {
      if (id.startsWith('system-')) return;
      await deleteDoc(doc(db, 'agendas', id));
      setConfirmDeleteId(null);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `agendas/${id}`);
    }
  };

  const handleShare = (item: AgendaItem) => {
    const url = `${window.location.origin}/agenda?id=${item.id}`;
    if (navigator.share) {
      navigator.share({
        title: item.title,
        text: `Agenda Vektorion: ${item.title}\n${item.date} pukul ${item.time}`,
        url: url,
      }).catch(console.error);
    } else {
      navigator.clipboard.writeText(url);
      alert('Link agenda berhasil disalin!');
    }
  };

  const parseIndonesianDate = (dateStr: string) => {
    const parts = dateStr.split(' ');
    const day = parseInt(parts[0], 10);
    const indomonth = parts[1]?.toLowerCase();
    const year = parseInt(parts[2], 10) || 2026;
    
    const months: { [key: string]: number } = {
      'januari': 0, 'jan': 0,
      'februari': 1, 'feb': 1,
      'maret': 2, 'mar': 2,
      'april': 3, 'apr': 3,
      'mei': 4,
      'juni': 5, 'jun': 5,
      'juli': 6, 'jul': 6,
      'agustus': 7, 'agu': 7, 'agt': 7,
      'september': 8, 'sep': 8,
      'oktober': 9, 'okt': 9,
      'november': 10, 'nov': 10,
      'desember': 11, 'des': 11
    };
    
    const month = months[indomonth] !== undefined ? months[indomonth] : 4;
    return new Date(year, month, day);
  };

  const parseTime = (timeStr: string) => {
    const match = timeStr.match(/(\d{2}):(\d{2})/);
    if (match) {
      return {
        hours: parseInt(match[1], 10),
        minutes: parseInt(match[2], 10)
      };
    }
    return { hours: 8, minutes: 0 };
  };

  const getEventDates = (item: AgendaItem) => {
    const baseDate = parseIndonesianDate(item.date);
    const timeInfo = parseTime(item.time);
    
    const startDate = new Date(baseDate);
    startDate.setHours(timeInfo.hours, timeInfo.minutes, 0);
    
    const endDate = new Date(startDate);
    const rangeMatch = item.time.match(/-\s*(\d{2}):(\d{2})/);
    if (rangeMatch) {
      endDate.setHours(parseInt(rangeMatch[1], 10), parseInt(rangeMatch[2], 10), 0);
    } else {
      endDate.setHours(startDate.getHours() + 2);
    }
    
    return { startDate, endDate };
  };

  const handleGoogleCalendarSync = (item: AgendaItem) => {
    const { startDate, endDate } = getEventDates(item);
    
    const formatGCalDate = (date: Date) => {
      return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    };
    
    const startStr = formatGCalDate(startDate);
    const endStr = formatGCalDate(endDate);
    
    const title = encodeURIComponent(`[VEKTORION] ${item.title}`);
    const details = encodeURIComponent(`${item.description}\n\nKategori: ${item.category}\nKontributor: ${item.author}`);
    const location = encodeURIComponent(item.location || 'Kampus ITERA / Online');
    
    const url = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${startStr}/${endStr}&details=${details}&location=${location}`;
    window.open(url, '_blank');
  };

  const handleExportICS = (item: AgendaItem) => {
    const { startDate, endDate } = getEventDates(item);
    
    const formatICSDate = (date: Date) => {
      return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    };
    
    const startStr = formatICSDate(startDate);
    const endStr = formatICSDate(endDate);
    const eventId = `vektorion-agenda-${item.id}`;
    
    const icsLines = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Vektorion Physics ITERA 2025//NONSGML v1.0//EN',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      'BEGIN:VEVENT',
      `UID:${eventId}`,
      `DTSTAMP:${formatICSDate(new Date())}`,
      `DTSTART:${startStr}`,
      `DTEND:${endStr}`,
      `SUMMARY:[VEKTORION] ${item.title}`,
      `DESCRIPTION:${item.description.replace(/\n/g, '\\n')} (Kategori: ${item.category} | Kontributor: ${item.author})`,
      `LOCATION:${item.location || 'Kampus ITERA / Online'}`,
      'STATUS:CONFIRMED',
      'SEQUENCE:0',
      'END:VEVENT',
      'END:VCALENDAR'
    ];
    
    const icsContent = icsLines.join('\r\n');
    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8;' });
    const downloadUrl = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.setAttribute('download', `${item.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.ics`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(downloadUrl);
  };

  const handleDayChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/[^0-9]/g, '');
    if (val.length <= 2) {
      const num = parseInt(val);
      if (!val || (num >= 1 && num <= 31)) {
        setEditorDay(val);
      }
    }
  };

  const handleTimeChange = (type: 'hour' | 'minute', val: string) => {
    const clean = val.replace(/[^0-9]/g, '');
    if (type === 'hour') {
      if (clean.length <= 2) {
        const num = parseInt(clean);
        if (!clean || (num >= 0 && num <= 23)) setEditorHour(clean);
      }
    } else {
      if (clean.length <= 2) {
        const num = parseInt(clean);
        if (!clean || (num >= 0 && num <= 59)) setEditorMinute(clean);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAgenda.title || !editorDay || !editorMonth || !newAgenda.description) return;

    // Security: Basic Sanitization to prevent code injection
    const sanitize = (str: string) => str.replace(/[<>]/g, '').trim();

    const formattedTime = editorHour && editorMinute 
      ? `${editorHour.padStart(2, '0')}:${editorMinute.padStart(2, '0')} WIB`
      : '-';

    const authorName = profile?.name || user?.displayName || 'Vektorion Member';
    const authorPhoto = profile?.photoURL || user?.photoURL;

    const agendaData: any = {
      title: sanitize(newAgenda.title || ''),
      date: `${editorDay} ${editorMonth} ${new Date().getFullYear()}`,
      time: formattedTime,
      location: sanitize(newAgenda.location || '-'),
      category: newAgenda.category || 'Lainnya',
      status: newAgenda.status || 'Planned',
      description: sanitize(newAgenda.description || ''),
      author: authorName,
      authorId: user?.uid || '',
      createdAt: serverTimestamp()
    };

    // Only add authorPhoto if it exists to avoid Firestore "undefined" error
    if (authorPhoto) {
      agendaData.authorPhoto = authorPhoto;
    }

    try {
      await addDoc(collection(db, 'agendas'), agendaData);
      
      // Dispatch real-time PWA notification
      try {
        await sendMulticastNotification(
          `Agenda Baru: ${agendaData.title}`,
          `Acara "${agendaData.title}" dijadwalkan pada ${agendaData.date} pukul ${agendaData.time} di ${agendaData.location}.`,
          'agenda',
          authorName || 'Admin',
          '/agenda'
        );
      } catch (err) {
        console.error('Failed to send agenda sync notification:', err);
      }

      setIsAdding(false);

      // Reset
      setNewAgenda({
        title: '',
        date: '',
        time: '',
        location: '',
        category: 'Rapat',
        status: 'Upcoming',
        description: ''
      });
      setEditorDay('');
      setEditorHour('');
      setEditorMinute('');
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'agendas');
    }
  };

  const isFormValid = newAgenda.title && editorDay && editorMonth && newAgenda.description;

  if (loading) return <AgendaSkeleton />;

  return (
    <MaintenanceGuard menuId="agenda">
      <div className="pt-32 pb-20 bg-slate-50 min-h-screen font-sans">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-12">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-slate-800 tracking-tight mb-2">
                Agenda <span className="text-amber-500">Vektorion</span>
              </h1>
              <p className="text-slate-500 text-sm font-medium">
                Jadwal & Kegiatan Angkatan Terkini
              </p>
            </div>
            
            {user && !isAdding && (
              <button
                onClick={() => setIsAdding(true)}
                className="flex items-center gap-3 text-white px-8 py-4 rounded-md font-bold text-[11px] tracking-widest shadow-xl transition-all shrink-0 self-start md:self-end border-2 border-amber-500/20 bg-slate-900 cursor-pointer"
                style={{ 
                  backgroundImage: `url("https://res.cloudinary.com/dew39kqhy/image/upload/v1779035172/ChatGPT_Image_17_Mei_2026_23.24.53_ivk1ju.png")`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center'
                }}
              >
                <Plus size={16} />
                BUAT AGENDA BARU
              </button>
            )}
          </div>

          {/* Live Card Editor (Direct WYSIWYG) */}
             {isAdding && (
               <div className="mb-12">
                <div className="flex items-center justify-between mb-4 px-1">
                   <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Editor Agenda Visual</h2>
                   <div className="flex items-center gap-4">
                     <button 
                       type="button"
                       onClick={() => setShowHelp(!showHelp)}
                       className={cn(
                         "flex items-center gap-1.5 text-[10px] font-bold uppercase transition-all duration-300",
                         showHelp ? "text-amber-500" : "text-slate-400 hover:text-slate-600"
                       )}
                     >
                        <InfoIcon size={14} />
                        <span className="hidden sm:inline">Tentang Editor</span>
                     </button>
                     <button 
                       onClick={() => setIsAdding(false)}
                       className="text-[10px] font-bold text-red-500 uppercase hover:underline"
                     >
                       Batalkan
                     </button>
                   </div>
                </div>

                <div className="group relative bg-white border-2 border-amber-500 p-6 md:p-8 rounded-md overflow-hidden shadow-2xl shadow-amber-100">
                  {/* Help View Overlay */}
                    {showHelp && (
                      <div className="absolute inset-0 z-50 bg-white/95 p-8 flex flex-col justify-center backdrop-blur-md">
                         <h4 className="text-amber-600 font-black text-sm uppercase tracking-widest mb-4">Panduan Penggunaan</h4>
                         <ul className="space-y-4">
                            <li className="flex items-start gap-4">
                               <div className="w-2 h-2 rounded-full bg-amber-500 mt-1.5 shrink-0" />
                               <p className="text-[11px] text-slate-500 leading-relaxed">Pastikan Judul, Hari, dan Bulan terisi agar kamu bisa mempublikasikannya.</p>
                            </li>
                            <li className="flex items-start gap-4">
                               <div className="w-2 h-2 rounded-full bg-amber-500 mt-1.5 shrink-0" />
                               <p className="text-[11px] text-slate-500 leading-relaxed">Gunakan format angka untuk jam (00-23) dan menit (00-59).</p>
                            </li>
                            <li className="flex items-start gap-4">
                               <div className="w-2 h-2 rounded-full bg-amber-500 mt-1.5 shrink-0" />
                               <p className="text-[11px] text-slate-500 leading-relaxed">Teks di dalam kotak editor ini adalah apa yang akan dilihat oleh kawan-kawan Vektorion.</p>
                            </li>
                         </ul>
                         <button 
                           onClick={() => setShowHelp(false)}
                           className="mt-10 self-start px-8 py-3 bg-slate-900 text-white text-[10px] font-bold uppercase tracking-widest rounded-md hover:bg-amber-600 transition-colors"
                         >
                            Siap, Mengerti
                         </button>
                      </div>
                    )}
                  {/* Background Accents */}
                  <div className="absolute inset-0 opacity-[0.95] pointer-events-none" 
                       style={{ 
                         backgroundImage: `url("https://res.cloudinary.com/dew39kqhy/image/upload/v1778841510/ChatGPT_Image_15_Mei_2026_17.37.07_obhnjw.png")`,
                         backgroundSize: 'cover',
                         backgroundPosition: 'center',
                       }} 
                  />
                  <div className="absolute inset-0 bg-gradient-to-br from-white/80 via-white/40 to-transparent pointer-events-none" />

                  <div className="relative z-20 flex flex-col md:flex-row gap-8">
                    {/* Left: Date Editor */}
                    <div className="flex flex-col items-center justify-center bg-white shadow-xl w-24 h-24 shrink-0 rounded-md border border-amber-200">
                      <input 
                        type="text"
                        placeholder="01"
                        maxLength={2}
                        value={editorDay}
                        onChange={handleDayChange}
                        className="w-full text-center text-3xl font-black text-slate-900 bg-transparent focus:outline-none placeholder:text-slate-300"
                      />
                      <select 
                        value={editorMonth}
                        onChange={(e) => setEditorMonth(e.target.value)}
                        className="w-full text-center text-[10px] font-black text-amber-600 bg-transparent focus:outline-none uppercase tracking-widest cursor-pointer appearance-none"
                      >
                        {months.map(m => <option key={m} value={m}>{m.substring(0, 3)}</option>)}
                      </select>
                      <span className="text-[8px] font-medium text-slate-400 mt-1">2026</span>
                    </div>

                    {/* Right: Content Editor */}
                    <div className="flex-1 space-y-4">
                      {/* Author Tag (Hidden in editor but tracked) */}
                      <div className="hidden items-center gap-2 mb-2 p-1.5 bg-white/40 backdrop-blur-md rounded-md border border-white/50 self-start">
                        <User size={10} className="text-amber-600" />
                        <span className="text-[8px] font-black text-slate-700 uppercase tracking-widest">{user?.displayName || user?.email?.split('@')[0] || 'Vektorion'}</span>
                      </div>

                      <div className="flex flex-wrap items-center gap-3">
                        <select 
                          value={newAgenda.status}
                          onChange={(e) => setNewAgenda({...newAgenda, status: e.target.value})}
                          className="text-[9px] font-black uppercase tracking-tighter px-2 py-1 bg-amber-500 text-white rounded cursor-pointer outline-none shadow-sm"
                        >
                          {['Upcoming', 'Urgent', 'Regular', 'Planned'].map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                        <select 
                          value={newAgenda.category}
                          onChange={(e) => setNewAgenda({...newAgenda, category: e.target.value})}
                          className="text-[9px] font-black uppercase tracking-tighter px-2 py-1 bg-slate-900 text-white rounded cursor-pointer outline-none shadow-sm"
                        >
                          {['Rapat', 'Keuangan', 'Akademik', 'Kegiatan', 'Lainnya'].map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                      </div>

                      <div className="space-y-1">
                        <input 
                          type="text"
                          placeholder="TULIS JUDUL AGENDA..."
                          maxLength={60}
                          value={newAgenda.title}
                          onChange={(e) => {
                            const val = e.target.value.replace(/[<>]/g, ''); // Simple injection prevent
                            setNewAgenda({...newAgenda, title: val});
                          }}
                          className="w-full text-2xl md:text-3xl font-black text-slate-900 bg-transparent border-b-2 border-dashed border-slate-200 focus:border-amber-500 focus:outline-none uppercase tracking-tight placeholder:text-slate-400"
                        />
                        <div className="flex justify-end">
                           <span className="text-[8px] text-slate-400 font-bold">{(newAgenda.title || '').length}/60</span>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <textarea 
                          rows={2}
                          maxLength={300}
                          placeholder="Tulis deskripsi singkat kegiatan di sini... (Contoh: Rapat koordinasi untuk kaderisasi)"
                          value={newAgenda.description}
                          onChange={(e) => {
                            const val = e.target.value.replace(/[<>]/g, '');
                            setNewAgenda({...newAgenda, description: val});
                          }}
                          className="w-full text-xs font-medium text-slate-600 bg-transparent focus:outline-none resize-none placeholder:text-slate-500 leading-relaxed"
                        />
                        <div className="flex justify-end">
                           <span className="text-[8px] text-slate-400 font-bold">{(newAgenda.description || '').length}/300</span>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-slate-100/50">
                        <div className="space-y-3">
                          <div className="flex items-center gap-3">
                             <div className="p-2 transition-colors">
                               <Clock size={14} className="text-amber-500" />
                             </div>
                             <div className="flex items-center gap-1">
                                 <input 
                                 type="text"
                                 placeholder="00"
                                 maxLength={2}
                                 value={editorHour}
                                 onChange={(e) => handleTimeChange('hour', e.target.value)}
                                 className="w-8 text-center bg-transparent py-1 text-xs font-bold text-slate-800 focus:outline-none focus:border-amber-500 border-b border-transparent focus:border-b-amber-500 placeholder:text-slate-400"
                               />
                               <span className="font-bold text-slate-400">:</span>
                               <input 
                                 type="text"
                                 placeholder="00"
                                 maxLength={2}
                                 value={editorMinute}
                                 onChange={(e) => handleTimeChange('minute', e.target.value)}
                                 className="w-8 text-center bg-transparent py-1 text-xs font-bold text-slate-800 focus:outline-none focus:border-amber-500 border-b border-transparent focus:border-b-amber-500 placeholder:text-slate-400"
                               />
                               <span className="text-[10px] font-black text-slate-400 ml-1">WIB</span>
                             </div>
                          </div>
                          <div className="flex items-center gap-3">
                             <div className="p-2 transition-colors">
                               <MapPin size={14} className="text-amber-500" />
                             </div>
                             <input 
                               type="text"
                               placeholder="Tulis lokasi..."
                               maxLength={50}
                               value={newAgenda.location}
                               onChange={(e) => {
                                 const val = e.target.value.replace(/[^a-zA-Z0-9\s/.,&-]/g, '');
                                 setNewAgenda({...newAgenda, location: val});
                               }}
                               className="bg-transparent border-b border-transparent focus:border-b-amber-500 px-1 py-1.5 text-xs font-bold text-slate-800 focus:outline-none placeholder:text-slate-400 flex-1"
                             />
                          </div>
                          
                          {/* Map Location Picker */}
                          <MapLocationPicker 
                            onLocationSelect={(addr) => setNewAgenda({...newAgenda, location: addr})} 
                          />
                        </div>

                        <div className="flex items-end justify-end">
                          <button 
                            disabled={!isFormValid}
                            onClick={handleSubmit}
                            className={cn(
                              "flex items-center gap-2 px-10 py-4 rounded-md font-black text-[10px] uppercase tracking-[0.2em] shadow-xl transition-all active:scale-95 border-2",
                              isFormValid 
                                ? "text-white border-amber-500 shadow-amber-200/50" 
                                : "bg-slate-100 text-slate-300 border-slate-200 cursor-not-allowed shadow-none"
                            )}
                            style={isFormValid ? { 
                              backgroundImage: `url("https://res.cloudinary.com/dew39kqhy/image/upload/v1779035172/ChatGPT_Image_17_Mei_2026_23.24.53_ivk1ju.png")`,
                              backgroundSize: 'cover',
                              backgroundPosition: 'center',
                              backgroundColor: '#0f172a'
                            } : {}}
                          >
                            Publikasikan
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

          {/* Agenda List */}
          <div className="space-y-4">
            {loading ? (
              Array(3).fill(0).map((_, i) => (
                <div key={i} className="animate-pulse bg-slate-200/40 border border-slate-200 p-5 md:p-6 rounded-md h-32" />
              ))
            ) : agendas.length === 0 ? (
              <div className="bg-white border-2 border-dashed border-slate-200 rounded-md py-20 px-8 flex flex-col items-center justify-center text-center">
                <CalendarIcon className="w-12 h-12 text-slate-300 mb-4" />
                <h3 className="text-xl font-bold text-slate-500 tracking-tight">Belum Ada Agenda Terdekat</h3>
                <p className="text-slate-400 mt-2 text-sm font-medium">Jadwal kegiatan akan muncul di sini</p>
              </div>
            ) : (
              agendas.map((item) => (
              <div
                key={item.id}
                onClick={() => toggleExpand(item.id)}
                className={cn(
                  "group relative bg-[#ffffff] border border-slate-200 p-5 md:p-6 rounded-md transition-all cursor-pointer overflow-hidden",
                  expandedId === item.id ? "ring-2 ring-amber-500 border-transparent shadow-lg" : "hover:border-amber-200 hover:shadow-md"
                )}
              >
                {/* Background Texture Card */}
                <div className="absolute inset-0 opacity-[0.90] pointer-events-none transition-all" 
                     style={{ 
                       backgroundImage: `url("https://res.cloudinary.com/dew39kqhy/image/upload/v1778841510/ChatGPT_Image_15_Mei_2026_17.37.07_obhnjw.png")`,
                       backgroundSize: 'cover',
                       backgroundPosition: 'center',
                     }} 
                />

                {/* Actions - Top Right */}
                {expandedId === item.id && (
                  <div className="absolute top-3 right-3 z-30">
                      {confirmDeleteId === item.id ? (
                        <div className="flex items-center gap-2 bg-white/90 backdrop-blur-md p-1 rounded-sm border border-slate-100 shadow-lg">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(item.id);
                            }}
                            className="px-2 py-1 bg-red-500 text-white text-[8px] font-bold rounded-sm active:scale-95 transition-all"
                          >
                            Ya
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setConfirmDeleteId(null);
                            }}
                            className="px-2 py-1 bg-slate-200 text-slate-600 text-[8px] font-bold rounded-sm active:scale-95 transition-all"
                          >
                            Tak
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleShare(item);
                            }}
                            className="p-1.5 text-slate-400 bg-white/50 backdrop-blur-sm rounded-md border border-slate-200/50 hover:text-amber-600 transition-all active:scale-90"
                            title="Bagikan"
                          >
                            <Share2 size={14} />
                          </button>
                          {(user?.uid === item.authorId || profile?.isAdmin) && !item.id.startsWith('system-') && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setConfirmDeleteId(item.id);
                              }}
                              className="p-1.5 text-slate-400 bg-white/50 backdrop-blur-sm rounded-md border border-slate-200/50 hover:text-red-500 transition-all active:scale-90"
                              title="Hapus"
                            >
                              <Trash2 size={14} />
                            </button>
                          )}
                        </div>
                      )}
                  </div>
                )}

      <div className="flex flex-col relative z-10">
        <div className="flex flex-row items-start gap-4 md:gap-6">
                  {/* Date Badge - Fixed Position */}
                  <div className={cn(
                    "flex flex-col items-center justify-center bg-white/60 backdrop-blur-sm shadow-sm group-hover:bg-amber-50/80 transition-colors w-16 h-16 md:w-20 md:h-20 shrink-0 rounded-md border border-slate-100/50",
                    expandedId === item.id ? "shine-on-open ring-[1.5px] ring-amber-300" : ""
                  )}>
                    <span className="text-xl md:text-xl font-bold text-slate-800 leading-none">
                      {item.date.split(' ')[0]}
                    </span>
                    <span className="text-[9px] md:text-[10px] font-bold text-slate-500 mt-0.5 uppercase">
                      {item.date.split(' ')[1]}
                    </span>
                    <span className="text-[7px] md:text-[8px] font-medium text-slate-400 mt-0.5">
                      {item.date.split(' ')[2] || '2026'}
                    </span>
                  </div>

                  {/* Content Area */}
                  <div className="flex-1 min-w-0 pr-12">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-3 flex-wrap">
                        <span className={cn(
                          "text-[8px] md:text-[9px] font-bold px-2 py-0.5 rounded-sm uppercase tracking-tighter",
                          item.status === 'Urgent' ? "bg-red-500 text-white" : 
                          item.status === 'Upcoming' ? "bg-amber-500 text-white" :
                          "bg-slate-900 text-white"
                        )}>
                          {item.status}
                        </span>
                        <span className="text-[8px] md:text-[9px] font-bold text-amber-600 uppercase tracking-tighter">
                          {item.category}
                        </span>
                      </div>

                      <h3 className={cn(
                        "text-lg md:text-xl font-bold text-slate-800 transition-colors group-hover:text-amber-600 uppercase tracking-tight",
                        expandedId !== item.id && "truncate pr-8"
                      )}>
                        {item.title}
                      </h3>
                    </div>
                  </div>
        </div>

        {/* Snippet Description (visible when closed too on mobile, hidden on desktop if closed) */}
        <div className="mt-3 md:mt-2 pl-0 md:pl-[6.5rem]">
                      <p className={cn(
                        "text-[10px] md:text-sm font-medium text-slate-500 leading-relaxed border-l-2 border-amber-100 pl-3 md:pl-4 transition-all",
                        expandedId !== item.id ? "line-clamp-2 md:hidden" : "block"
                      )}>
                        {item.description}
                      </p>
                      
                    {expandedId === item.id && (
                      <div className="overflow-hidden">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6 pt-4 border-t border-slate-100/50">
                            <div className="space-y-3">
                              <div className="flex items-center gap-4 text-slate-500">
                                <Clock size={16} className="text-amber-500 shrink-0" />
                                <span className="text-xs font-bold text-slate-700">{item.time}</span>
                              </div>
                              <div className="flex items-center gap-4 text-slate-500">
                                <MapPin size={16} className="text-amber-500 shrink-0" />
                                <div className="flex items-center gap-2">
                                  <span className="text-xs font-bold text-slate-700">{item.location}</span>
                                  {item.location !== '-' && (
                                    <a 
                                      href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(item.location)}`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      onClick={(e) => e.stopPropagation()}
                                      className="transition-all opacity-60 grayscale-[50%] hover:grayscale-0 hover:opacity-100 hover:scale-110 active:scale-95"
                                      title="Buka Peta"
                                    >
                                      <img 
                                        src="https://cdn-icons-png.flaticon.com/128/9344/9344197.png" 
                                        alt="Map Link" 
                                        className="w-[14px] h-[14px] object-contain drop-shadow-sm" 
                                      />
                                    </a>
                                  )}
                                </div>
                              </div>

                              {/* Sync and Download Calendar Operations - Added per Fanra's request */}
                              <div className="pt-2 flex items-center gap-2 flex-wrap">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleGoogleCalendarSync(item);
                                  }}
                                  className="px-2 py-1 bg-amber-50 hover:bg-amber-100/80 text-amber-700 text-[8px] font-black uppercase tracking-widest rounded-sm border border-amber-200/50 flex items-center gap-1.5 transition-colors cursor-pointer"
                                  title="Tambah agenda ke kalender Google Anda"
                                >
                                  <CalendarIcon size={10} /> + Google Calendar
                                </button>
                              </div>
                            </div>
                            
                            <div className="flex items-end justify-end">
                              <div className="flex flex-col items-end gap-1.5">
                                <div className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-br from-amber-50/80 to-white rounded-md border border-amber-200/60 shine-on-hover shadow-sm transition-all hover:shadow-md cursor-default">
                                  <div className="w-6 h-6 rounded-full border border-amber-200 overflow-hidden bg-white flex items-center justify-center shrink-0">
                                    {item.authorPhoto ? (
                                      <OptimizedImage 
                                        src={item.authorPhoto} 
                                        alt={item.author} 
                                        className="object-cover" 
                                        fallbackClassName="bg-slate-50"
                                      />
                                    ) : (
                                      <User size={12} className="text-amber-500" />
                                    )}
                                  </div>
                                  <div className="flex flex-col">
                                    <span className="text-[10px] font-black text-slate-800 tracking-tight leading-none mb-0.5">{item.author}</span>
                                    <span className="text-[7px] text-amber-600 uppercase font-bold tracking-[0.1em]">Kontributor</span>
                                  </div>
                                </div>
                                {item.createdAt && (
                                  <span className="text-[8px] text-slate-400 font-medium tracking-tight lowercase">
                                    dipublikasi pada {new Intl.DateTimeFormat('id-ID', {
                                      day: 'numeric',
                                      month: 'long',
                                      year: 'numeric',
                                      hour: '2-digit',
                                      minute: '2-digit',
                                      second: '2-digit'
                                    }).format(item.createdAt.toDate())}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )))}
          </div>
        </div>
      </div>
    </div>
    </MaintenanceGuard>
  );
}
