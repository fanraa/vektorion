import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNavbar } from '../lib/NavbarContext';

export default function NotFound() {
  const navigate = useNavigate();
  const { setNavbarVisible } = useNavbar();

  useEffect(() => {
    // Sembunyikan navbar saat berada di halaman ini
    setNavbarVisible(false);
    return () => {
      // Munculkan kembali navbar saat meninggalkan halaman ini
      setNavbarVisible(true);
    };
  }, [setNavbarVisible]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[85vh] px-6 text-center">
      <img 
        src="https://cdn-icons-gif.flaticon.com/17092/17092297.gif" 
        alt="halaman tidak ditemukan" 
        className="w-24 h-24 mb-6 object-contain"
      />
      
      <p className="text-slate-500 text-xs font-normal mb-8 max-w-sm leading-relaxed">
        maaf halaman tidak ditemukan, mungkin yang anda maksud adalah home atau menu lainnya. silakan klik tombol di bawah untuk kembali ke halaman utama.
      </p>

      <button
        onClick={() => navigate('/home')}
        className="px-8 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-normal transition-all duration-200 border border-slate-200 rounded-md cursor-pointer select-none active:scale-95"
      >
        kembali
      </button>
    </div>
  );
}
