import { useState } from 'react';
import { Bell, Search, Clock, Tag, ChevronRight, AlertCircle, FileText, FlaskConical, Wallet, Users } from 'lucide-react';
import { cn } from '../lib/utils';
import { MaintenanceGuard } from '../components/MaintenanceGuard';

const categories = [
  { id: 'all', label: 'Semua', icon: FileText },
  { id: 'akademik', label: 'Akademik', icon: FlaskConical },
  { id: 'praktikum', label: 'Praktikum', icon: FlaskConical },
  { id: 'kas', label: 'Kas', icon: Wallet },
  { id: 'kegiatan', label: 'Kegiatan', icon: Users },
  { id: 'umum', label: 'Umum', icon: Bell },
];

const announcements = [
  { 
    id: 1, 
    title: 'Pembayaran Kas Bulan Mei Terkahir Tanggal 10', 
    category: 'kas', 
    date: '05 Mei 2026', 
    desc: 'Bagi seluruh anggota angkatan diharapkan segera melakukan pembayaran kas sebelum tenggat waktu untuk menunjang kegiatan operasional angkatan.',
    urgent: true 
  },
  { 
    id: 2, 
    title: 'Pendaftaran Asisten Praktikum Fisika Dasar 2', 
    category: 'akademik', 
    date: '04 Mei 2026', 
    desc: 'Dibuka pendaftaran asisten praktikum Fiske 2 untuk semester depan. Syarat dan ketentuan dapat dilihat di link yang tersedia.',
    urgent: false 
  },
  { 
    id: 3, 
    title: 'Modul Praktikum Optika Sudah Tersedia', 
    category: 'praktikum', 
    date: '03 Mei 2026', 
    desc: 'File modul praktikum optika sudah dapat diunduh di drive angkatan. Harap dipelajari sebelum jadwal praktikum dimulai.',
    urgent: false 
  },
  { 
    id: 4, 
    title: 'Rapat Persiapan Makrab Perdana 2025', 
    category: 'kegiatan', 
    date: '02 Mei 2026', 
    desc: 'Akan diadakan rapat koordinasi divisi acara dan humas terkait rencana malam keakraban angkatan di Gazebo ITERA.',
    urgent: false 
  },
];

export default function Pengumuman() {
  const [activeTab, setActiveTab] = useState('all');

  const filtered = announcements.filter(a => activeTab === 'all' || a.category === activeTab);

  return (
    <MaintenanceGuard menuId="pengumuman">
      <div className="container mx-auto px-4 py-12 space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
           <h1 className="text-4xl font-black text-slate-900 uppercase">Pusat <span className="text-amber-500">Info</span></h1>
           <p className="text-slate-500 font-medium mt-1 uppercase tracking-widest text-[10px]">Update terbaru Fisika ITERA 2025</p>
        </div>
      </div>

      <div className="flex items-center gap-2 overflow-x-auto pb-4 no-scrollbar">
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setActiveTab(cat.id)}
            className={cn(
              "flex items-center gap-2 px-6 py-2.5 rounded-lg text-[10px] font-black tracking-[0.2em] uppercase transition-all whitespace-nowrap border shrink-0",
              activeTab === cat.id 
                ? "bg-slate-900 border-slate-900 text-white shadow-lg shadow-slate-900/10" 
                : "bg-white border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-amber-500"
            )}
          >
            {cat.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filtered.map((item) => (
          <div key={item.id} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col group hover:border-amber-500 transition-all">
             <div className="p-8 space-y-6 flex-1">
                <div className="flex items-center justify-between">
                   <div className="flex items-center gap-3">
                      <span className={cn(
                        "px-3 py-1 rounded-md text-[10px] font-black uppercase tracking-widest border",
                        item.category === 'kas' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                        item.category === 'akademik' ? 'bg-blue-50 text-blue-600 border-blue-100' :
                        'bg-slate-50 text-slate-400 border-slate-100'
                      )}>
                        {item.category}
                      </span>
                      {item.urgent && (
                        <span className="flex items-center gap-1 text-[10px] font-black text-red-500 uppercase tracking-widest">
                          <AlertCircle size={10} /> Penting
                        </span>
                      )}
                   </div>
                   <div className="flex items-center gap-1 text-slate-400 text-[10px] font-bold uppercase">
                     <Clock size={10} /> {item.date}
                   </div>
                </div>
                
                <h3 className="text-xl font-black text-slate-900 group-hover:text-amber-500 transition-colors uppercase tracking-tight">
                  {item.title}
                </h3>
                
                <p className="text-sm font-medium text-slate-500 leading-relaxed">
                  {item.desc}
                </p>
             </div>
             
             <div className="px-8 py-4 bg-slate-50 border-t border-slate-50 flex items-center justify-between group-hover:bg-slate-100 transition-all">
                <button className="text-[10px] font-black text-slate-400 group-hover:text-amber-600 uppercase tracking-widest">
                  Detail Berita
                </button>
                <ChevronRight className="text-slate-300 group-hover:text-amber-500 group-hover:translate-x-1 transition-all" size={16} />
             </div>
          </div>
        ))}
      </div>
    </div>
    </MaintenanceGuard>
  );
}
