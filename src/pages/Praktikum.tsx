import { FlaskConical, Users, Info, ChevronRight, Hash } from 'lucide-react';
import { MEMBERS_DATA } from '../data/members';
import { MaintenanceGuard } from '../components/MaintenanceGuard';

export default function Praktikum() {
  // Logic: 5 members per group
  const groupSize = 5;
  const groups = [];
  for (let i = 0; i < MEMBERS_DATA.length; i += groupSize) {
    groups.push(MEMBERS_DATA.slice(i, i + groupSize));
  }

  return (
    <MaintenanceGuard menuId="praktikum">
      <div className="space-y-8">
      <div className="bg-white p-8 md:p-10 rounded-[40px] border border-slate-100 shadow-sm relative overflow-hidden">
        <div className="absolute right-0 top-0 w-64 h-64 bg-amber-500/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-3">
             <div className="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-600">
               <FlaskConical size={24} />
             </div>
             <h1 className="text-3xl font-bold text-slate-800">Pembagian Kelompok Praktikum</h1>
             <p className="text-slate-500 max-w-xl leading-relaxed">
               Daftar pembagian kelompok Praktikum Fisika Dasar 1 Semester Genap 2025/2026. Pembagian berdasarkan urutan NIM angkatan.
             </p>
          </div>
          <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 min-w-[240px]">
             <div className="flex items-center gap-2 text-amber-600 font-bold mb-2">
               <Info size={18} />
               <span className="text-sm">Informasi Penting</span>
             </div>
             <p className="text-xs text-slate-500 leading-relaxed">
               Setiap kelompok harap segera menemui asisten praktikum masing-masing untuk asistensi dan modul.
             </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {groups.map((group, groupIdx) => (
          <div key={groupIdx} className="bg-white rounded-[32px] border border-slate-100 shadow-sm hover:shadow-xl hover:border-amber-200 transition-all group overflow-hidden">
            <div className="bg-slate-50 border-b border-slate-100 p-6 flex items-center justify-between group-hover:bg-amber-50 transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-800 font-bold text-lg group-hover:text-amber-600 group-hover:border-amber-200 transition-all">
                  {groupIdx + 1}
                </div>
                <h3 className="font-bold text-slate-800 uppercase tracking-tight">Kelompok {groupIdx + 1}</h3>
              </div>
              <Users size={18} className="text-slate-300" />
            </div>
            <div className="p-6">
              <ul className="space-y-4">
                {group.map((member, mIdx) => (
                  <li key={member.nim} className="flex items-center justify-between group/item">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-slate-50 group-hover/item:bg-amber-50 flex items-center justify-center text-[10px] font-bold text-slate-400 group-hover/item:text-amber-500 transition-colors">
                        {mIdx + 1}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-800 truncate max-w-[150px]">{member.name}</p>
                        <p className="text-[10px] text-slate-400 font-semibold tracking-tighter uppercase">{member.nim}</p>
                      </div>
                    </div>
                    {mIdx === 0 && (
                       <span className="text-[9px] font-bold text-amber-600 bg-amber-50 border border-amber-100 px-2 py-0.5 rounded-full uppercase">Keto</span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between group-hover:bg-slate-100 transition-colors">
               <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{group.length} Anggota</span>
               <button className="p-1.5 text-slate-300 hover:text-amber-500 transition-colors">
                 <ChevronRight size={18} />
               </button>
            </div>
          </div>
        ))}
      </div>
    </div>
    </MaintenanceGuard>
  );
}
