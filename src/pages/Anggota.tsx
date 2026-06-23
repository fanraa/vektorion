import { useState } from 'react';
import { Search, UserCircle2, Hash, IdCard } from 'lucide-react';
import { MEMBERS_DATA } from '../data/members';
import { MaintenanceGuard } from '../components/MaintenanceGuard';

export default function Anggota() {
  const [search, setSearch] = useState('');

  const filteredMembers = MEMBERS_DATA.filter(m => {
    const searchStr = (search || "").toLowerCase();
    const nameStr = (m.name || "").toLowerCase();
    const nimStr = (m.nim || "").toLowerCase();
    return nameStr.includes(searchStr) || nimStr.includes(searchStr);
  });

  return (
    <MaintenanceGuard menuId="anggota">
      <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-lg border border-slate-100 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Daftar Anggota</h1>
          <p className="text-sm text-slate-500 mt-1">Total {MEMBERS_DATA.length} Mahasiswa Fisika 2025</p>
        </div>
        
        <div className="relative w-full md:w-80 group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-amber-500 transition-colors" size={20} />
          <input 
            type="text" 
            placeholder="Cari nama atau NIM..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-lg py-3 pl-12 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredMembers.map((member) => (
          <div
            key={member.nim}
            className="bg-white p-5 rounded-lg border border-slate-100 shadow-sm hover:shadow-md hover:border-amber-200 transition-all group"
          >
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-md bg-amber-50 flex items-center justify-center text-amber-600 group-hover:bg-amber-100 transition-colors">
                <UserCircle2 size={32} />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-slate-800 truncate group-hover:text-amber-600 transition-colors">{member.name}</h3>
                <div className="flex items-center gap-3 mt-1">
                  <span className="text-xs bg-slate-50 text-slate-500 px-2.5 py-1 rounded-lg flex items-center gap-1.5 font-medium border border-slate-100 uppercase tracking-tighter">
                    <IdCard size={12} /> {member.nim}
                  </span>
                  <span className="text-xs bg-amber-50 text-amber-600 px-2.5 py-1 rounded-lg flex items-center gap-1.5 font-medium border border-amber-100/50">
                    <Hash size={12} /> No {MEMBERS_DATA.findIndex(m => m.nim === member.nim) + 1}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}

        {filteredMembers.length === 0 && (
          <div className="col-span-full py-20 flex flex-col items-center justify-center text-slate-400">
            <Search size={48} className="mb-4 opacity-20" />
            <p className="text-lg font-medium">Anggota tidak ditemukan</p>
            <p className="text-sm">Coba kata kunci lain atau NIM yang berbeda</p>
          </div>
        )}
      </div>
    </div>
    </MaintenanceGuard>
  );
}
