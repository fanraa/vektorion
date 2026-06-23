import { CheckCircle2, XCircle, Clock, Search, Filter, ArrowUpRight, ArrowDownLeft, FileText, Plus, Download } from 'lucide-react';
import { cn } from '../lib/utils';
import { MaintenanceGuard } from '../components/MaintenanceGuard';

export default function Bendahara() {
  return (
    <MaintenanceGuard menuId="bendahara">
      <div className="space-y-8 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
           <h1 className="text-3xl font-bold text-slate-800">Dashboard Bendahara</h1>
           <p className="text-slate-500 mt-1">Kelola verifikasi pembayaran dan laporan keuangan.</p>
        </div>
        <div className="flex gap-3">
           <button className="px-5 py-3 bg-slate-900 text-white rounded-2xl font-bold text-xs flex items-center gap-2 shadow-lg shadow-slate-900/10">
             <Plus size={18} /> Tambah Pengeluaran
           </button>
           <button className="px-5 py-3 bg-white border border-slate-200 text-slate-700 rounded-2xl font-bold text-xs flex items-center gap-2 shadow-sm">
             <Download size={18} /> Export Laporan
           </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
         {[
           { label: 'Menunggu Verifikasi', value: '12', icon: Clock, color: 'text-amber-600 bg-amber-50' },
           { label: 'Pembayaran Lunas', value: '148', icon: CheckCircle2, color: 'text-green-600 bg-green-50' },
           { label: 'Total Pengeluaran', value: 'Rp 450rb', icon: ArrowDownLeft, color: 'text-red-600 bg-red-50' },
           { label: 'Kas Bulan Ini', value: 'Rp 600rb', icon: ArrowUpRight, color: 'text-blue-600 bg-blue-50' },
         ].map((stat, i) => (
           <div key={i} className="bg-white p-6 rounded-[28px] border border-slate-100 shadow-sm flex items-center gap-4">
              <div className={cn("p-3 rounded-2xl", stat.color)}>
                 <stat.icon size={22} />
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{stat.label}</p>
                <p className="text-xl font-bold text-slate-800">{stat.value}</p>
              </div>
           </div>
         ))}
      </div>

      <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-8 border-b border-slate-50 flex flex-col md:flex-row md:items-center justify-between gap-6">
           <h2 className="text-xl font-bold text-slate-800">Antrian Verifikasi</h2>
           <div className="flex gap-3">
              <div className="relative group">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-amber-500" size={16} />
                <input 
                  type="text" 
                  placeholder="Cari transaksi..."
                  className="bg-slate-50 border border-slate-100 rounded-xl py-2 px-10 text-xs focus:outline-none focus:ring-2 focus:ring-amber-500/10 focus:border-amber-500 transition-all w-full md:w-64"
                />
              </div>
              <button className="p-2 border border-slate-100 rounded-xl text-slate-400 hover:bg-slate-50 transition-colors">
                <Filter size={18} />
              </button>
           </div>
        </div>
        
        <div className="overflow-x-auto">
           <table className="w-full text-left">
             <thead>
                <tr className="bg-slate-50/50 text-slate-400 text-[10px] uppercase tracking-widest font-bold">
                  <th className="px-8 py-5">Nama Anggota</th>
                  <th className="px-8 py-5">Bulan / Jenis</th>
                  <th className="px-8 py-5">Nominal</th>
                  <th className="px-8 py-5">Bukti</th>
                  <th className="px-8 py-5 text-right">Aksi</th>
                </tr>
             </thead>
             <tbody className="divide-y divide-slate-50">
               {[
                 { name: 'Nabila Isnaini Putri', month: 'Mei 2026', type: 'Kas', amount: 'Rp 20.000', date: '07 Mei' },
                 { name: 'M. Fajar Satrio. N', month: 'April 2026', type: 'Kas', amount: 'Rp 20.000', date: '06 Mei' },
                 { name: 'Anami Habibah', month: 'Mei 2026', type: 'Kas', amount: 'Rp 20.000', date: '06 Mei' },
               ].map((user, i) => (
                 <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                   <td className="px-8 py-5">
                      <p className="text-sm font-bold text-slate-800">{user.name}</p>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter mt-0.5">{user.date}</p>
                   </td>
                   <td className="px-8 py-5">
                      <span className="text-xs font-semibold text-slate-600">{user.month}</span>
                      <span className="ml-2 text-[9px] font-black text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full uppercase italic">{user.type}</span>
                   </td>
                   <td className="px-8 py-5 text-sm font-bold text-slate-800">{user.amount}</td>
                   <td className="px-8 py-5">
                      <button className="flex items-center gap-1.5 text-blue-600 hover:underline text-[10px] font-bold uppercase tracking-wider">
                        <FileText size={14} /> Lihat Nota
                      </button>
                   </td>
                   <td className="px-8 py-5 text-right">
                      <div className="flex items-center justify-end gap-2">
                         <button className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all">
                           <XCircle size={20} />
                         </button>
                         <button className="p-2 text-slate-400 hover:text-green-500 hover:bg-green-50 rounded-xl transition-all">
                           <CheckCircle2 size={20} />
                         </button>
                      </div>
                   </td>
                 </tr>
               ))}
             </tbody>
           </table>
        </div>
      </div>
    </div>
    </MaintenanceGuard>
  );
}
