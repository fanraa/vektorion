import React, { ErrorInfo, ReactNode } from 'react';
import { ShieldAlert, RefreshCw, Home, ArrowLeft } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null
  };

  public static getDerivedStateFromError(error: Error): State {
    // If chunk loading fails (e.g. offline or new deployment), reload the page once
    //. to let the browser handle it natively ("kaya web normalnya")
    if (error.message && (error.message.includes('Failed to fetch dynamically imported module') || error.message.includes('Importing a module script failed'))) {
      const isRetrying = sessionStorage.getItem('vektorion_chunk_retry');
      if (!isRetrying) {
        sessionStorage.setItem('vektorion_chunk_retry', 'true');
        window.location.reload();
      }
    }
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidMount() {
    // Clear retry flag on successful mount
    sessionStorage.removeItem('vektorion_chunk_retry');
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    if (error.message && (error.message.includes('Failed to fetch dynamically imported module') || error.message.includes('Importing a module script failed'))) {
       return; // Already handled by getDerivedStateFromError reload
    }
    console.error("ErrorBoundary caught an error:", error, errorInfo);
    (this as any).setState({
      error,
      errorInfo
    });
  }

  private handleReset = () => {
    (this as any).setState({ hasError: false, error: null, errorInfo: null });
    window.location.href = '/home';
  };

  private handleReload = () => {
    (this as any).setState({ hasError: false, error: null, errorInfo: null });
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      const isChunkError = this.state.error?.message && (this.state.error.message.includes('Failed to fetch dynamically imported module') || this.state.error.message.includes('Importing a module script failed'));
      
      // Jika error karena jaringan/chunk rendering, biarkan browser menangani atau tampilkan layar putih sederhana 
      // (sesuai permintaan user: "buat aja kaya web normalnya ga usah di kasih apa apa kalau jaringan lemot")
      if (isChunkError) {
        return (
          <div className="min-h-screen flex items-center justify-center bg-[#FAF9F5]">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500"></div>
          </div>
        );
      }

      return (
        <div className="min-h-[85vh] flex items-center justify-center px-4 py-32 bg-[#FAF9F5]">
          <div className="w-full max-w-md bg-white border border-slate-200/80 rounded-md shadow-xl p-6 md:p-8 text-center space-y-6">
            
            {/* Elegant Error Icon Header */}
            <div className="flex flex-col items-center space-y-3">
              <div className="w-14 h-14 bg-amber-50 rounded-full flex items-center justify-center text-amber-500 ring-4 ring-amber-500/10">
                <ShieldAlert size={28} />
              </div>
              <h2 className="text-xl font-black text-slate-800 tracking-tight">
                Menu Mengalami Kendala
              </h2>
              <p className="text-slate-500 text-[11px] max-w-xs leading-relaxed">
                Tampaknya ada sedikit gangguan sistem pada komponen halaman ini. Menu lain tetap bisa kamu gunakan secara normal!
              </p>
            </div>

            {/* Error Message Box (Collapsible / Readable for debug) */}
            {this.state.error && (
              <div className="bg-slate-50 border border-slate-100 rounded-sm p-4 text-left">
                <span className="text-[9px] font-bold uppercase tracking-wider text-amber-600 block mb-1">
                  Info Teknis Kendala
                </span>
                <p className="font-mono text-[10px] text-slate-600 break-words leading-normal max-h-32 overflow-y-auto">
                  {this.state.error.message || 'Unknown runtime error'}
                </p>
              </div>
            )}

            {/* Responsive Actions */}
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                onClick={this.handleReload}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-sm text-xs font-bold transition-all shadow-md hover:shadow-lg focus:outline-none min-h-[44px]"
              >
                <RefreshCw size={14} className="animate-spin-slow" />
                <span>Segarkan Menu</span>
              </button>

              <button
                onClick={this.handleReset}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-sm text-xs font-bold transition-all focus:outline-none min-h-[44px]"
              >
                <Home size={14} />
                <span>Ke Beranda</span>
              </button>
            </div>

            <div className="text-[10px] text-slate-400">
              Vektorion &copy; 2025 ITERA
            </div>
          </div>
        </div>
      );
    }

    return (this as any).props.children;
  }
}
