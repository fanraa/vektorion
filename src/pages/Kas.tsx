import React, { useState, useEffect, useRef } from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import {
  Plus,
  Search,
  Wallet,
  ArrowUpRight,
  ArrowDownLeft,
  ArrowRight,
  ArrowLeft,
  CheckCircle,
  Clock,
  XCircle,
  Download,
  Upload,
  Info,
  Users,
  FileText,
  Calendar,
  AlertCircle,
  Loader2,
  Maximize2,
  History,
  LogIn,
  ChevronDown,
  Lock,
  ChevronRight,
  X,
  User,
  Check,
  RotateCcw,
  MessageSquare,
  Trash2,
} from "lucide-react";

import { OptimizedImage } from "../components/ui/OptimizedImage";

// WhatsApp Icon Component
const WhatsAppIcon = ({ size = 20, className = "" }: { size?: number; className?: string }) => (
  <svg 
    viewBox="0 0 24 24" 
    width={size} 
    height={size} 
    className={className}
    fill="currentColor"
  >
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.148-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.414 0 .018 5.393 0 12.03c0 2.122.54 4.197 1.57 6.05L0 24l6.117-1.605a11.803 11.803 0 005.925 1.598h.005c6.632 0 12.028-5.391 12.032-12.027a11.812 11.812 0 00-3.659-8.527z"/>
  </svg>
);

import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../lib/AuthContext";
import { useNavbar } from "../lib/NavbarContext";
import { MEMBERS_DATA } from "../data/members";
import { cn } from "../lib/utils";
import { toPng } from "html-to-image";
import {
  db,
  auth,
  signInWithGoogle,
  handleFirestoreError,
  OperationType,
  isConfigValid,
} from "../lib/firebase";
import {
  collection,
  addDoc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp,
  doc,
  getDoc,
  updateDoc,
  Timestamp,
} from "firebase/firestore";
import { onAuthStateChanged, User as FirebaseUser } from "firebase/auth";

import { MaintenanceGuard } from "../components/MaintenanceGuard";
import { sendMulticastNotification } from "../lib/NotificationService";


const LOGO_URL =
  "https://res.cloudinary.com/dew39kqhy/image/upload/v1778155257/BackgroundEraser_20260507_190027268_bc5p07.png";
const AVATAR_PLACEHOLDER =
  "https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y";
const MONTHS = [
  "Januari",
  "Februari",
  "Maret",
  "April",
  "Mei",
  "Juni",
  "Juli",
  "Agustus",
  "September",
  "Oktober",
  "November",
  "Desember",
];
const YEARS = ["2026", "2027", "2028", "2029", "2030"];

const getYearTheme = (year: string) => {
  const themes: Record<string, { bg: string; accent: string; text: string }> = {
    "2026": {
      bg: "bg-indigo-500",
      accent: "text-indigo-500",
      text: "text-indigo-700",
    },
    "2027": {
      bg: "bg-amber-500",
      accent: "text-amber-500",
      text: "text-amber-700",
    },
    "2028": {
      bg: "bg-rose-500",
      accent: "text-rose-500",
      text: "text-rose-700",
    },
    "2029": {
      bg: "bg-cyan-500",
      accent: "text-cyan-500",
      text: "text-cyan-700",
    },
    "2030": {
      bg: "bg-purple-500",
      accent: "text-purple-500",
      text: "text-purple-700",
    },
  };
  return themes[year] || themes["2026"];
};

interface Transaction {
  id: string;
  name: string;
  nim: string;
  amount: number;
  date: string;
  time: string;
  tag: string;
  status: "verified" | "pending" | "suspicious" | "out";
  proofUrl?: string;
  warning?: string;
}

const INITIAL_TRANSACTIONS: Transaction[] = [];

import { KasSkeleton } from "../components/ui/Skeleton";

function KasLoginGuard() {
  const navigate = useNavigate();
  const { setNavbarVisible } = useNavbar();
  const [countdown, setCountdown] = useState(15);

  useEffect(() => {
    setNavbarVisible(false);
    return () => {
      setNavbarVisible(true);
    };
  }, [setNavbarVisible]);

  useEffect(() => {
    if (countdown <= 0) {
      navigate("/");
      return;
    }
    const interval = setInterval(() => {
      setCountdown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [countdown, navigate]);

  return (
    <div className="min-h-[85vh] flex items-center justify-center p-4 bg-transparent">
      <div 
        className="w-full max-w-sm text-center flex flex-col items-center justify-center p-0"
      >
        <img 
          src="https://cdn-icons-gif.flaticon.com/128/12893/12893800.gif" 
          alt="locked icon" 
          className="w-16 h-16 mx-auto mb-4"
        />
        
        <h2 className="text-base font-bold text-slate-900 tracking-tight mb-2 uppercase font-sans">
          Akses Menu Kas Terkunci
        </h2>
        
        <p className="text-[11px] text-slate-500 mb-6 leading-relaxed max-w-xs mx-auto font-medium">
          Halaman ini terkunci. Silakan masuk dengan akun Vektorion Anda terlebih dahulu untuk melihat dan mengelola keuangan kas.
        </p>

        <button
          onClick={() => navigate("/login")}
          className="w-full max-w-xs py-3.5 bg-slate-900 text-white rounded-md font-bold tracking-widest text-[11px] flex items-center justify-center gap-2 hover:bg-slate-800 transition-all active:scale-[0.98] shadow-xl shadow-black/10 uppercase cursor-pointer"
        >
          Masuk Sekarang <ArrowRight size={14} className="text-amber-500" />
        </button>

        <span className="text-[10px] text-slate-400 font-normal text-center block mt-6">
          Kembali ke beranda dalam {countdown} detik...
        </span>
      </div>
    </div>
  );
}

export default function Kas() {
  const location = useLocation();
  const now = new Date();
  const currentMonthName = MONTHS[now.getMonth()];
  const currentYearStr = now.getFullYear().toString();

  const [view, setView] = useState<
    "overview" | "pay" | "members" | "history" | "expenses"
  >("overview");
  const [memberSubView, setMemberSubView] = useState<"list" | "matrix">(
    "matrix",
  );
  const [openYearMatrix, setOpenYearMatrix] = useState<string | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [kasMatrix, setKasMatrix] = useState<
    Record<string, Record<string, any>>
  >({});
  const [treasurySummary, setTreasurySummary] = useState<Record<string, any>>(
    {},
  );
  const [kasExpenses, setKasExpenses] = useState<any[]>([]);
  const [kasFormerMembers, setKasFormerMembers] = useState<any[]>([]);
  const [kasActivities, setKasActivities] = useState<any[]>([]);
  const [isLoadingRx, setIsLoadingRx] = useState(true);
  const [isKasLoading, setIsKasLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [isConfirmingReset, setIsConfirmingReset] = useState(false);
  const [fbError, setFbError] = useState<string | null>(null);

  const [selectedMonth, setSelectedMonth] = useState(currentMonthName);
  const [selectedYear, setSelectedYear] = useState(currentYearStr);

  const formatFullDateTime = (date: any) => {
    if (!date) return "";
    const d = date instanceof Date ? date : new Date(date);
    if (isNaN(d.getTime())) return "";
    const day = d.getDate().toString().padStart(2, "0");
    const month = MONTHS[d.getMonth()].substring(0, 3);
    const year = d.getFullYear();
    const hours = d.getHours().toString().padStart(2, "0");
    const minutes = d.getMinutes().toString().padStart(2, "0");
    return `${day} ${month} ${year} • ${hours}:${minutes}`;
  };

  const [searchMember, setSearchMember] = useState("");
  const [pageReady, setPageReady] = useState(false);

  useEffect(() => {
    // Save to cache when data updates
    if (!isKasLoading && Object.keys(kasMatrix).length > 0) {
      localStorage.setItem('cache_kas_matrix', JSON.stringify(kasMatrix));
      localStorage.setItem('cache_kas_summary', JSON.stringify(treasurySummary));
    }
  }, [kasMatrix, treasurySummary, isKasLoading]);

  useEffect(() => {
    // Combined ready state for first load if no cache
    if (!isLoadingRx && !isKasLoading) {
      setPageReady(true);
    }
  }, [isLoadingRx, isKasLoading]);

  const [showInKeluarTooltip, setShowInKeluarTooltip] = useState(false);
  const infoRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (infoRef.current && !infoRef.current.contains(event.target as Node)) {
        setShowInKeluarTooltip(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);
  const [historySearch, setHistorySearch] = useState("");
  const [historyStatusFilter, setHistoryStatusFilter] = useState("all");
  const [historyMonthFilter, setHistoryMonthFilter] =
    useState(currentMonthName);
  const [historyYearFilter, setHistoryYearFilter] = useState(currentYearStr);

  const [selectedMember, setSelectedMember] = useState<{
    name: string;
    nim: string;
  } | null>(null);
  const [amount, setAmount] = useState("8.000");
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [isCheckingAI, setIsCheckingAI] = useState(false);
  const [aiResult, setAiResult] = useState<{
    valid: boolean;
    reason: string;
  } | null>(null);
  const [qrisLoading, setQrisLoading] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [showReceipt, setShowReceipt] = useState<Transaction | null>(null);
  const [isZoomed, setIsZoomed] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isArrearsOpen, setIsArrearsOpen] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadingYear, setDownloadingYear] = useState<string | null>(null);
  const [selectedIndividual, setSelectedIndividual] = useState<any>(null);
  const [showRulesModal, setShowRulesModal] = useState(false);
  const receiptRef = useRef<HTMLDivElement>(null);

  const [sensorSisaTagihan, setSensorSisaTagihan] = useState(false);
  const [payLockCountdown, setPayLockCountdown] = useState(15);

  useEffect(() => {
    const unsub = onSnapshot(doc(db, "appConfig", "systemSettings"), (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        setSensorSisaTagihan(data.sensorSisaTagihan || false);
      }
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (view === "pay" && sensorSisaTagihan) {
      setPayLockCountdown(15);
    }
  }, [view, sensorSisaTagihan]);

  useEffect(() => {
    if (view === "pay" && sensorSisaTagihan) {
      if (payLockCountdown <= 0) {
        setView("overview");
        return;
      }
      const interval = setInterval(() => {
        setPayLockCountdown((prev) => prev - 1);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [view, sensorSisaTagihan, payLockCountdown]);

  // Handle incoming payment state from Profile or other pages
  useEffect(() => {
    if (location.state) {
      if (location.state.view === "pay") {
        setView("pay");
        if (location.state.member) {
          setSelectedMember(location.state.member);
          setSearchMember(location.state.member.name);
        }
        if (location.state.amount) {
          setAmount(Number(location.state.amount).toLocaleString("id-ID"));
        }
      }
    }
  }, [location]);

  // Handle auto-prefill for current user and LOCK selection
  useEffect(() => {
    if (view === "pay" && currentUser) {
      const emailPart = currentUser.email?.split("@")[0] || "";
      const parts = emailPart.split(".");
      const myNim = parts.length > 1 ? parts[1] : parts[0];

      const match = MEMBERS_DATA.find(
        (m) =>
          (m.nim || "").toLowerCase() === (myNim || "").toLowerCase() ||
          (m.name || "").toLowerCase() ===
            (currentUser.displayName || "").toLowerCase() ||
          (emailPart || "").toLowerCase().includes((m.nim || "").toLowerCase()),
      );

      if (match) {
        setSelectedMember({ name: match.name, nim: match.nim });
        setSearchMember(match.name);
      }
    }
  }, [view, currentUser]);

  // Firebase Auth & Admin Check
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        const userEmail = user.email?.toLowerCase();
        console.log("[AUTH] Logged in as:", userEmail);
        
        try {
          const adminEmails = [
            "irfanrizkiaditri@gmail.com",
            "irfanrizkiaditricreator@gmail.com",
            "irfanrizkiaditribusiness@gmail.com",
            "irfan125110007@vektorion.io",
            "i47r32a6@vektorion.io",
            "admin@vektorion.com",
            "admin.system@vektorion.io"
          ];
          const isAdminByEmail = userEmail ? adminEmails.includes(userEmail) : false;
          
          const adminDoc = await getDoc(doc(db, "admins", user.uid));
          const finalAdminStatus = adminDoc.exists() || isAdminByEmail;
          
          console.log("[AUTH] Admin Status:", finalAdminStatus ? "AUTHORIZED" : "NOT_ADMIN");
          setIsAdmin(finalAdminStatus);
        } catch (err) {
          console.error("Error checking admin status:", err);
          setIsAdmin(false);
        }
      } else {
        setIsAdmin(false);
      }
    }, (error) => {
      console.error("Auth State Error:", error);
    });
    return () => unsubscribe();
  }, []);

  // Real-time Transactions
  useEffect(() => {
    if (!isConfigValid) {
      setTransactions(INITIAL_TRANSACTIONS);
      setIsLoadingRx(false);
      setFbError(
        "Aplikasi berjalan dalam mode offline (Demo). Untuk mengaktifkan fitur database real-time, silakan atur Firebase di AI Studio.",
      );
      return;
    }

    const q = query(
      collection(db, "v2_kas_transactions"),
      orderBy("createdAt", "desc"),
    );
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const txs = snapshot.docs.map((doc) => ({
          ...doc.data(),
          id: doc.id,
        })) as Transaction[];
        setTransactions(txs.length > 0 ? txs : INITIAL_TRANSACTIONS);
        setIsLoadingRx(false);
        setFbError(null);
      },
      (error) => {
        console.error("Firestore Error:", error);
        setTransactions(INITIAL_TRANSACTIONS);
        setIsLoadingRx(false);
        setFbError(
          "Gagal memuat data dari database. Pastikan Security Rules sudah dipasang di Firebase Console.",
        );
      },
    );
    return () => unsubscribe();
  }, []);

  // Real-time Kas Data Matrix
  useEffect(() => {
    const unsubscribes: (() => void)[] = [];

    YEARS.forEach((year) => {
      const q = collection(db, "v2_kas_data", year, "members");
      const unsub = onSnapshot(
        q,
        (snapshot) => {
          const yearData: Record<string, any> = {};
          snapshot.docs.forEach((doc) => {
            yearData[doc.id] = doc.data();
          });
          setKasMatrix((prev) => ({
            ...prev,
            [year]: yearData,
          }));
          setIsKasLoading(false);
        },
        (error) => {
          console.error(`Error loading Kas ${year}:`, error);
          setIsKasLoading(false);
        },
      );
      unsubscribes.push(unsub);

      // Listen to Summary per Year
      const unsubSummary = onSnapshot(doc(db, "v2_kas_summary", year), (doc) => {
        if (doc.exists()) {
          setTreasurySummary((prev) => ({
            ...prev,
            [year]: doc.data(),
          }));
        }
      }, (error) => {
        console.warn(`Summary sync failed for year ${year}:`, error);
      });
      unsubscribes.push(unsubSummary);
    });

    const unsubExpenses = onSnapshot(
      query(collection(db, "v2_kas_expenses")),
      (snapshot) => {
        const expenses = snapshot.docs
          .map((doc) => ({ id: doc.id, ...(doc.data() as any) }))
          .filter((exp) => exp.id.startsWith("expense_") || exp.sourceRow)
          .sort((a, b) => {
            const timeA = a.lastUpdated ? new Date(a.lastUpdated).getTime() : 0;
            const timeB = b.lastUpdated ? new Date(b.lastUpdated).getTime() : 0;
            return timeB - timeA;
          });
        setKasExpenses(expenses);
      },
      (error) => {
        console.error("Error loading Expenses:", error);
        handleFirestoreError(error, OperationType.GET, "v2_kas_expenses");
      },
    );
    unsubscribes.push(unsubExpenses);

    const unsubFormer = onSnapshot(
      collection(db, "v2_kas_former"),
      (snapshot) => {
        setKasFormerMembers(
          snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })),
        );
      },
      (error) => {
        console.error("Error loading Former Members:", error);
        handleFirestoreError(error, OperationType.GET, "v2_kas_former");
      },
    );
    unsubscribes.push(unsubFormer);

    const unsubActivities = onSnapshot(
      collection(db, "v2_kas_activity"),
      (snapshot) => {
        setKasActivities(
          snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })),
        );
      },
      (error) => {
        console.warn(
          "Error loading Activities - check index or permissions:",
          error,
        );
        handleFirestoreError(error, OperationType.GET, "v2_kas_activity");
      },
    );
    unsubscribes.push(unsubActivities);

    return () => unsubscribes.forEach((unsub) => unsub());
  }, []);

  // Auto-reset filters when returning to overview
  useEffect(() => {
    if (view === "overview") {
      setSelectedMonth(currentMonthName);
      setSelectedYear(currentYearStr);
      setHistoryMonthFilter(currentMonthName);
      setHistoryYearFilter(currentYearStr);
      setHistoryStatusFilter("all");
      setSearchMember("");
      setHistorySearch("");
    }
  }, [view, currentMonthName, currentYearStr]);

  // Scroll lock when modal is open
  useEffect(() => {
    if (showReceipt || showRulesModal) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [showReceipt, showRulesModal]);

  const handleDownloadReceipt = async () => {
    if (!receiptRef.current || !showReceipt) return;

    setIsDownloading(true);
    try {
      const dataUrl = await toPng(receiptRef.current, {
        cacheBust: true,
        backgroundColor: "#ffffff",
        style: {
          borderRadius: "0px",
        },
      });

      const link = document.createElement("a");
      link.download = `struk_${showReceipt.id}_${(showReceipt.name || "download").toLowerCase().replace(/\s+/g, "_")}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error("Failed to download receipt:", err);
    } finally {
      setIsDownloading(false);
    }
  };

  const generatePDF = () => {
    const doc = new jsPDF() as any;

    // Header
    doc.setFillColor(15, 23, 42); // slate-900
    doc.rect(0, 0, 210, 40, "F");

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.text("VEKTORION TREASURY REPORT", 20, 20);
    doc.setFontSize(10);
    doc.text(`Periode: ${selectedMonth} ${selectedYear}`, 20, 30);

    // Stats Background
    doc.setFillColor(248, 250, 252); // slate-50
    doc.rect(15, 45, 180, 50, "F");

    const lunasCount = MEMBERS_DATA.filter(
      (m) => getMemberArrears(m).tunggakan === 0,
    ).length;
    const unpaidCount = MEMBERS_DATA.length - lunasCount;
    const totalDebt = MEMBERS_DATA.reduce(
      (acc, m) => acc + getMemberArrears(m).tunggakan,
      0,
    );

    doc.setTextColor(51, 65, 85); // slate-700
    doc.setFontSize(10);
    doc.text("RINGKASAN STATUS KEUANGAN", 20, 55);

    doc.setFontSize(9);
    doc.text(`Total Anggota: ${MEMBERS_DATA.length} Orang`, 25, 65);
    doc.text(`Sudah Lunas: ${lunasCount} Orang`, 25, 72);
    doc.text(`Belum Lunas: ${unpaidCount} Orang`, 25, 79);

    doc.text(`Total Saldo Kas: Rp 2.450.000`, 110, 65);
    doc.setTextColor(239, 68, 68); // red-500
    doc.text(
      `Total Piutang (Tunggakan): Rp ${totalDebt.toLocaleString("id-ID")}`,
      110,
      72,
    );
    doc.setTextColor(51, 65, 85);
    doc.text(`Status Laporan: Terverifikasi Sistem`, 110, 79);

    // Table Transactions
    doc.setFontSize(11);
    doc.text("DETAIL TRANSAKSI TERAKHIR", 20, 110);

    autoTable(doc, {
      startY: 115,
      head: [["ID", "Nama", "Keterangan", "Jumlah", "Status"]],
      body: transactions.map((tx) => [
        tx.id,
        tx.name.toUpperCase(),
        tx.tag,
        `Rp ${tx.amount.toLocaleString("id-ID")}`,
        tx.status.toUpperCase(),
      ]),
      headStyles: { fillColor: [15, 23, 42], fontSize: 8 },
      bodyStyles: { fontSize: 8 },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      margin: { left: 20, right: 20 },
    });

    // Footer
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      doc.text(`Halaman ${i} | Vektorion Treasury System © 2026`, 105, 285, {
        align: "center",
      });
    }

    doc.save(`Laporan_Treasury_Vektorion_${selectedMonth}.pdf`);
  };

  const generateRekap = () => {
    const doc = new jsPDF("p", "mm", "a4") as any;

    // Blue/Amber Header for Rekap
    doc.setFillColor(245, 158, 11); // amber-500
    doc.rect(0, 0, 210, 35, "F");

    doc.setTextColor(15, 23, 42); // slate-900
    doc.setFontSize(24);
    doc.text("REKAP TUNGGAKAN ANGGOTA", 20, 20);
    doc.setFontSize(10);
    doc.text(
      `Berdasarkan Data Hingga: ${selectedMonth} ${selectedYear}`,
      20,
      28,
    );

    // Summary Table
    const lunasList = MEMBERS_DATA.filter(
      (m) => getMemberArrears(m).tunggakan === 0,
    );
    const debtList = MEMBERS_DATA.filter(
      (m) => getMemberArrears(m).tunggakan > 0,
    );

    autoTable(doc, {
      startY: 45,
      head: [["NIM", "Nama Mahasiswa", "Tunggakan", "Status"]],
      body: MEMBERS_DATA.map((m) => {
        const { tunggakan } = getMemberArrears(m);
        return [
          m.nim,
          m.name.toUpperCase(),
          `Rp ${tunggakan.toLocaleString("id-ID")}`,
          tunggakan === 0 ? "LUNAS" : "TUNGGAKAN",
        ];
      }),
      headStyles: {
        fillColor: [15, 23, 42],
        fontSize: 8,
        cellPadding: 4,
      },
      bodyStyles: { fontSize: 8 },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      columnStyles: {
        2: { fontStyle: "bold" },
        3: { fontStyle: "bold" },
      },
      didDrawCell: (data: any) => {
        if (data.section === "body" && data.column.index === 3) {
          if (data.cell.raw === "LUNAS") {
            doc.setTextColor(22, 163, 74); // green-600
          } else {
            doc.setTextColor(220, 38, 38); // red-600
          }
        }
      },
      margin: { left: 15, right: 15 },
    });

    doc.save(`Rekap_Status_Kas_Anggota_${selectedMonth}.pdf`);
  };

  const handleDownloadYearPDF = (year: string) => {
    setDownloadingYear(year);
    const doc = new jsPDF("l", "mm", "a3") as any; // Landscape A3 for wide matrix
    const yearInt = parseInt(year);

    // Header
    doc.setFillColor(15, 23, 42); // slate-900
    doc.rect(0, 0, 420, 30, "F");

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.text(`LAPORAN IURAN KAS VEKTORION - TAHUN ${year}`, 20, 15);
    doc.setFontSize(10);
    doc.text(`Dicetak pada: ${new Date().toLocaleString("id-ID")}`, 20, 25);

    // Prepare table data
    const head = [
      [
        "No",
        "Mahasiswa",
        "NIM",
        ...MONTHS.flatMap((m) => [m, "", "", ""]),
        "Lunas",
        "Tunggak",
        "Total",
      ],
    ];

    const head2 = [
      [
        "",
        "",
        "",
        ...MONTHS.flatMap(() => ["M1", "M2", "M3", "M4"]),
        "",
        "",
        "",
      ],
    ];

    const body = filteredMembers.map((member, idx) => {
      const { paidTotal, tunggakan } = getMemberArrears(member);
      const monthlyData = MONTHS.flatMap((month, mIdx) => {
        const monthlyPaid = getMemberProgress(member, month, year);
        const now = new Date();
        const isFutureMonth =
          yearInt > now.getFullYear() ||
          (yearInt === now.getFullYear() && mIdx > now.getMonth());
        const feePerWeek = year === "2026" && mIdx < 4 ? 5000 : 2000;

        return [1, 2, 3, 4].map((w) => {
          if (isFutureMonth) return ".";
          return monthlyPaid >= w * feePerWeek ? "V" : "X";
        });
      });

      return [
        idx + 1,
        member.name.toUpperCase(),
        member.nim,
        ...monthlyData,
        `Rp ${paidTotal / 1000}k`,
        `Rp ${tunggakan / 1000}k`,
        `Rp ${(paidTotal + tunggakan) / 1000}k`,
      ];
    });

    autoTable(doc, {
      startY: 40,
      head: head,
      body: body,
      theme: "grid",
      headStyles: {
        fillColor: [15, 23, 42],
        textColor: [255, 255, 255],
        fontSize: 7,
        halign: "center",
      },
      bodyStyles: { fontSize: 6, halign: "center" },
      columnStyles: {
        1: { halign: "left", fontStyle: "bold" },
        2: { halign: "left" },
      },
      didParseCell: (data: any) => {
        if (data.section === "body" && data.cell.text[0] === "V") {
          data.cell.styles.textColor = [34, 197, 94]; // green-500
        }
        if (data.section === "body" && data.cell.text[0] === "X") {
          data.cell.styles.textColor = [239, 68, 68]; // red-500
        }
      },
      margin: { left: 10, right: 10 },
    });

    // Add secondary header for weeks manually if possible, or just merge?
    // Simplified: jspdf-autotable doesn't support colSpan elegantly in simple head array
    // We'll just stick to a clear enough header.

    doc.save(`Laporan_Iuran_${year}_Vektorion.pdf`);
    setDownloadingYear(null);
  };

  const handleDownloadYearSpreadsheet = (year: string) => {
    setDownloadingYear(year);
    const yearInt = parseInt(year);

    // Header rows
    const header1 = [
      "No",
      "Mahasiswa",
      "NIM",
      ...MONTHS.flatMap((m) => [m, "", "", ""]),
      "Lunas",
      "Tunggak",
      "Total",
    ];
    const header2 = [
      "",
      "",
      "",
      ...MONTHS.flatMap(() => ["M1", "M2", "M3", "M4"]),
      "",
      "",
      "",
    ];

    const rows = filteredMembers.map((member, idx) => {
      const { paidTotal, tunggakan } = getMemberArrears(member);
      const monthlyData = MONTHS.flatMap((month, mIdx) => {
        const monthlyPaid = getMemberProgress(member, month, year);
        const now = new Date();
        const isFutureMonth =
          yearInt > now.getFullYear() ||
          (yearInt === now.getFullYear() && mIdx > now.getMonth());
        const feePerWeek = year === "2026" && mIdx < 4 ? 5000 : 2000;

        return [1, 2, 3, 4].map((w) => {
          if (isFutureMonth) return ".";
          return monthlyPaid >= w * feePerWeek ? "Lunas" : "Belum";
        });
      });

      return [
        idx + 1,
        member.name,
        member.nim,
        ...monthlyData,
        paidTotal,
        tunggakan,
        paidTotal + tunggakan,
      ];
    });

    const worksheet = XLSX.utils.aoa_to_sheet([header1, header2, ...rows]);

    // Add some merging for months
    const merges = [];
    for (let i = 0; i < 12; i++) {
      const colIndex = 3 + i * 4;
      merges.push({ s: { r: 0, c: colIndex }, e: { r: 0, c: colIndex + 3 } });
    }
    worksheet["!merges"] = merges;

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, `Laporan ${year}`);

    XLSX.writeFile(workbook, `Laporan_Iuran_${year}_Vektorion.xlsx`);
    setDownloadingYear(null);
  };

  const getMemberArrears = (
    member: { name: string; nim: string },
    yearStr?: string,
  ) => {
    const targetYear = yearStr || selectedYear;
    const yearInt = parseInt(targetYear);

    // Priority 1: Data from Firestore Year Matrix (Synced from Google Sheets)
    const yearData = kasMatrix[targetYear]?.[member.nim];
    if (yearData) {
      return {
        paidTotal: yearData.totalLunas || 0,
        tunggakan: yearData.totalTunggak || 0,
      };
    }

    // Fallback logic
    const now = new Date();
    const currentMonthIdx = now.getMonth();
    const currentYear = now.getFullYear();

    // Total debt up to targetMonth in targetYear (reference start 2026)
    // For simplicity in fallback, we'll assume current month if target year is current year
    const targetMonthIdx = yearInt === currentYear ? currentMonthIdx : 11;

    let totalRequired = 0;
    if (yearInt === 2026) {
      // 2026 Feb-Apr: 20k (5k*4)
      // 2026 May-Dec: 8k (2k*4)
      for (let i = 1; i <= targetMonthIdx; i++) {
        totalRequired += i < 4 ? 20000 : 8000;
      }
    } else if (yearInt > 2026) {
      // Full target year (8k * 12)
      totalRequired = (targetMonthIdx + 1) * 8000;
    }

    // Real paid total from verified transactions (This is tricky because transactions are not tiered by year in this simplified app)
    // But since this is a fallback, we'll try to estimate.
    const paidTotal = transactions
      .filter((tx) => tx.nim === member.nim && tx.status === "verified")
      .reduce((acc, tx) => acc + tx.amount, 0);

    const tunggakan = Math.max(
      0,
      totalRequired - (yearInt === currentYear ? paidTotal : 0),
    );

    return { paidTotal, tunggakan };
  };

  const getMemberProgress = (
    member: { name: string; nim: string },
    monthName?: string,
    yearStr?: string,
  ) => {
    const targetMonth = monthName || selectedMonth;
    const targetYear = yearStr || selectedYear;

    // Check Firestore Matrix first
    const yearData = kasMatrix[targetYear]?.[member.nim];
    if (yearData && yearData.payments) {
      const monthKey = targetMonth.toLowerCase();
      const monthPayments = yearData.payments[monthKey];
      if (monthPayments) {
        // Return total amount paid in that month
        return Object.values(monthPayments).reduce(
          (acc: any, val: any) => acc + (Number(val) || 0),
          0,
        ) as number;
      }
    }

    const { paidTotal } = getMemberArrears(member);

    const monthIdx = MONTHS.indexOf(targetMonth);
    const year = parseInt(targetYear);

    let targetMonthsElapsed = 0;
    if (year === 2026) {
      targetMonthsElapsed = monthIdx + 1;
    } else if (year > 2026) {
      targetMonthsElapsed = (year - 2026) * 12 + monthIdx + 1;
    } else {
      return 8000; // Past
    }

    // Fallback calculation logic for progress
    const feeThisMonth = year === 2026 && monthIdx < 4 ? 20000 : 8000;

    // Total required before this month
    let requiredBeforeTarget = 0;
    if (year === 2026) {
      for (let i = 1; i < monthIdx; i++) {
        requiredBeforeTarget += i < 4 ? 20000 : 8000;
      }
    } else {
      requiredBeforeTarget = 3 * 20000 + 8 * 8000;
      requiredBeforeTarget += (year - 2027) * 12 * 8000 + monthIdx * 8000;
    }

    if (paidTotal >= requiredBeforeTarget + feeThisMonth) return feeThisMonth;
    if (paidTotal <= requiredBeforeTarget) return 0;

    return paidTotal - requiredBeforeTarget;
  };

  const QRIS_URL =
    "https://res.cloudinary.com/dew39kqhy/image/upload/v1778158915/IMG-20260507-WA0038_im6dgy.jpg";

  // Simulation loading when QRIS content changes (5s delay after input)
  useEffect(() => {
    if (view === "pay") {
      if (selectedMember && Number(getCleanNominal(amount)) >= 999) {
        setQrisLoading(true);
        const timer = setTimeout(() => setQrisLoading(false), 5000);
        return () => clearTimeout(timer);
      } else {
        setQrisLoading(false);
      }
    }
  }, [selectedMember, amount, view]);

  const handleDownloadQRIS = async () => {
    try {
      const response = await fetch(QRIS_URL);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;

      const now = new Date();
      const timeStr = `${now.getHours().toString().padStart(2, "0")}${now.getMinutes().toString().padStart(2, "0")}`;
      const nameSlug =
        (selectedMember?.name || "").toLowerCase().replace(/\s+/g, "") ||
        "mahasiswa";
      const amtSlug = amount.replace("000", "k");
      const filename = `kas_${amtSlug}_${nameSlug}_${timeStr}.jpg`;

      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Download failed:", error);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      alert("Waduh, kegedean fotonya! Maksimal 10MB ya.");
      return;
    }

    setProofFile(file);
    setIsCheckingAI(true);
    setAiResult(null);

    // AI Check logic
    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = (reader.result as string).split(",")[1];

      const aiTimeout = setTimeout(() => {
        setIsCheckingAI(false);
        setAiResult({
          valid: false,
          reason: "Bukti tidak valid",
        });
      }, 25000); // 25s timeout for AI

      try {
        const response = await fetch("/api/ai/check-receipt", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ image: base64, mimeType: file.type, amount: amount }),
        });

        if (!response.ok) throw new Error("Gagal verifikasi AI");
        const parsingResult = await response.json();
        
        clearTimeout(aiTimeout);
        setAiResult(parsingResult);
      } catch (err) {
        console.error(err);
        setAiResult({
          valid: false,
          reason: "Bukti tidak valid",
        });
      } finally {
        setIsCheckingAI(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const filteredMembers = MEMBERS_DATA.filter((m) => {
    const nameStr = m.name || "";
    const nimStr = m.nim || "";
    const searchStr = (searchMember || "").toLowerCase();
    return (
      nameStr.toLowerCase().includes(searchStr) ||
      nimStr.toLowerCase().includes(searchStr)
    );
  });

  const filteredHistory = transactions.filter((tx) => {
    const searchStr = (historySearch || "").toLowerCase();
    const txId = (tx.id || "").toLowerCase();
    const txName = (tx.name || "").toLowerCase();

    const matchesSearch =
      txId.includes(searchStr) || txName.includes(searchStr);
    const matchesStatus =
      historyStatusFilter === "all" || tx.status === historyStatusFilter;
    const matchesMonth = (tx.date || "").includes(historyMonthFilter);
    const matchesYear = (tx.date || "").includes(historyYearFilter);
    return matchesSearch && matchesStatus && matchesMonth && matchesYear;
  });

  const formatNominal = (val: string) => {
    const numeric = val.replace(/[^0-9]/g, "");
    if (!numeric) return "";
    return Number(numeric).toLocaleString("id-ID");
  };

  const getCleanNominal = (val: string) => {
    return val.replace(/\./g, "") || "0";
  };

  const handleNominalChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let rawVal = e.target.value.replace(/[^0-9]/g, "");
    if (!rawVal) {
      setAmount("0");
      return;
    }
    rawVal = rawVal.replace(/^0+/, "");
    if (!rawVal) rawVal = "0";

    if (selectedMember) {
      const { tunggakan } = getMemberArrears(selectedMember);
      if (Number(rawVal) > tunggakan) {
        rawVal = tunggakan.toString();
      }
    }
    setAmount(Number(rawVal).toLocaleString("id-ID"));
  };

  const getSisaTunggakan = () => {
    if (!selectedMember) return 0;
    const { tunggakan } = getMemberArrears(selectedMember);
    const bayar = Number(getCleanNominal(amount));
    return Math.max(0, tunggakan - bayar);
  };

  const resetForm = () => {
    setSearchMember("");
    setSelectedMember(null);
    setAmount("8.000");
    setProofFile(null);
    setAiResult(null);
    setIsCheckingAI(false);
  };

  const formatCurrencySimplified = (val: number) => {
    const isNegative = val < 0;
    const absVal = Math.abs(val);

    let formatted = "";
    if (absVal >= 1000000) {
      formatted = (absVal / 1000000).toFixed(1).replace(/\.0$/, "") + " JT";
    } else if (absVal >= 1000) {
      formatted = Math.floor(absVal / 1000) + " RB";
    } else {
      formatted = absVal.toString();
    }

    return (isNegative ? "-" : "") + formatted;
  };

  const handleRefresh = () => {
    setIsKasLoading(true);
    setIsLoadingRx(true);
    // Standard robust reload
    window.location.assign(window.location.href);
  };

  const handleResetKas = async () => {
    if (!isAdmin || !currentUser) return;
    
    if (!isConfirmingReset) {
      setIsConfirmingReset(true);
      // Reset confirmation state after 3 seconds if not clicked again
      setTimeout(() => setIsConfirmingReset(false), 3000);
      return;
    }

    setIsResetting(true);
    setIsConfirmingReset(false);
    
    try {
      console.log("[RESET_START] Performing Client-Side cleanup...");
      await performClientSideReset();
      
      // Optional: still try to notify server to clear any server-side caches if they exist
      try {
        const idToken = await currentUser.getIdToken();
        await fetch("/api/admin/reset-kas", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${idToken}`
          }
        });
      } catch (sErr) {
        console.warn("Server notification failed, but client reset finished.");
      }

      alert("Data Kas BERHASIL DIBERSIHKAN! \n\nSekarang Anda dapat menekan tombol 'Sinkronkan Semua Data' di Google Spreadsheet.");
      handleRefresh();
    } catch (err: any) {
      console.error("Reset Error:", err);
      alert("Gagal membersihkan data: " + (err.message || "Terjadi kesalahan teknis"));
    } finally {
      setIsResetting(false);
    }
  };

  const performClientSideReset = async () => {
    const { getDocs, writeBatch, collection: fsCollection } = await import("firebase/firestore");
    
    const collectionsToClear = [
      "kasSummary",
      "kasExpenses",
      "kasFormerMembers",
      "kasActivity",
      "transactions",
      "v2_kas_summary",
      "v2_kas_expenses",
      "v2_kas_former",
      "v2_kas_activity",
      "v2_kas_transactions"
    ];

    // 1. Clear top-level collections
    for (const colName of collectionsToClear) {
      try {
        const snap = await getDocs(fsCollection(db, colName));
        if (snap.empty) continue;
        
        const batch = writeBatch(db);
        snap.docs.forEach(d => batch.delete(d.ref));
        await batch.commit();
        console.log(`[CLIENT_RESET] cleared ${colName}`);
      } catch (e) {
        console.warn(`[CLIENT_RESET_ERR] Failed to clear ${colName}:`, e);
      }
    }

    // 2. Clear members for each year
    for (const year of YEARS) {
      try {
        const membersSnap = await getDocs(fsCollection(db, "kasData", year, "members"));
        if (!membersSnap.empty) {
          let batch = writeBatch(db);
          let count = 0;
          for (const d of membersSnap.docs) {
            batch.delete(d.ref);
            count++;
            if (count >= 400) { await batch.commit(); batch = writeBatch(db); count = 0; }
          }
          if (count > 0) await batch.commit();
        }

        const v2MembersSnap = await getDocs(fsCollection(db, "v2_kas_data", year, "members"));
        if (!v2MembersSnap.empty) {
          let batch = writeBatch(db);
          let count = 0;
          for (const d of v2MembersSnap.docs) {
            batch.delete(d.ref);
            count++;
            if (count >= 400) { await batch.commit(); batch = writeBatch(db); count = 0; }
          }
          if (count > 0) await batch.commit();
        }
        console.log(`[CLIENT_RESET] cleared members for ${year}`);
      } catch (e) {
        console.warn(`[CLIENT_RESET_ERR] Failed to clear members for ${year}:`, e);
      }
    }
  };

  const formatRelativeTime = (date: Date) => {
    if (!date || date.getTime() === 0) return "";
    const now = new Date();
    const diff = now.getTime() - date.getTime();

    // If it's today, show time
    if (date.toDateString() === now.toDateString()) {
      if (diff < 60000) return "Baru saja";
      if (diff < 3600000) return `${Math.floor(diff / 60000)}m lalu`;
      return date.toLocaleTimeString("id-ID", {
        hour: "2-digit",
        minute: "2-digit",
      });
    }

    const days = Math.floor(diff / 86400000);
    if (days < 7) return `${days} hari lalu`;

    return date.toLocaleDateString("id-ID", { day: "numeric", month: "short" });
  };

  const [expandedHistory, setExpandedHistory] = useState<string | null>(null);

  const calculateBalances = () => {
    let inAktif = 0;
    let inKeluar = 0;
    let totalOut = 0;
    let hasSummary = false;

    // Total dari anggota aktif & keluar via kasSummary (Source of truth)
    const summaryList = Object.values(treasurySummary);
    if (summaryList.length > 0) {
      summaryList.forEach((summary: any) => {
        inAktif += Number(summary.pemasukanAnggotaAktif || 0);
        inKeluar += Number(summary.pemasukanAnggotaKeluar || 0);
        totalOut += Number(summary.totalPengeluaran || 0);
      });
      hasSummary = true;
    }

    const pendingAppIn = transactions
      .filter((tx) => tx.status !== "verified")
      .reduce((acc, tx) => acc + tx.amount, 0);

    const totalIn = inAktif + inKeluar + pendingAppIn;

    if (!hasSummary) {
      // Fallback if summary is empty: try to calculate from matrix
      const formerNimSet = new Set([
        ...kasFormerMembers.map((f) => String(f.nim || "").trim()),
        ...MEMBERS_DATA.filter((m) => (m as any).isFormer).map((m) =>
          String(m.nim || "").trim(),
        ),
      ]);

      Object.values(kasMatrix).forEach((yearData: any) => {
        Object.entries(yearData).forEach(([nim, member]: [string, any]) => {
          let memberTotal = 0;
          if (member.payments) {
            Object.values(member.payments).forEach((weeks: any) => {
              Object.values(weeks).forEach((amount: any) => {
                memberTotal += Number(amount) || 0;
              });
            });
          }

          const normalizedNim = String(nim).trim();
          if (formerNimSet.has(normalizedNim)) {
            inKeluar += memberTotal;
          } else {
            inAktif += memberTotal;
          }
        });
      });

      // De-duplicate expenses based on: Tahun + (SourceRow || Id)
      const uniqueExpsMap = new Map();
      kasExpenses.forEach((exp) => {
        const amt = Number(exp.nominal || 0);
        if (amt <= 0) return;

        const key = `${exp.tahun}-${exp.sourceRow || exp.id}`;
        if (!uniqueExpsMap.has(key)) uniqueExpsMap.set(key, amt);
      });

      totalOut = Array.from(uniqueExpsMap.values()).reduce(
        (a, b: any) => a + Number(b),
        0,
      );
    }

    return {
      balance: inAktif + inKeluar - totalOut, // Formula: InAktif + InKeluar - TotalOut
      totalIn,
      totalOut,
      inAktif,
      inKeluar,
    };
  };

  const parseIndonesianDate = (dateStr: string) => {
    if (!dateStr) return new Date(0);
    const months: Record<string, number> = {
      Januari: 0,
      Februari: 1,
      Maret: 2,
      April: 3,
      Mei: 4,
      Juni: 5,
      Juli: 6,
      Agustus: 7,
      September: 8,
      Oktober: 9,
      November: 10,
      Desember: 11,
    };
    const parts = dateStr.split(" ");
    if (parts.length === 3) {
      const day = parseInt(parts[0]);
      const month = months[parts[1]];
      const year = parseInt(parts[2]);
      if (!isNaN(day) && month !== undefined && !isNaN(year)) {
        return new Date(year, month, day);
      }
    }
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? new Date(0) : d;
  };

  const { balance, totalIn, totalOut, inAktif, inKeluar } = calculateBalances();

  // Membangun riwayat terpadu dari berbagai sumber (App + Spreadsheet Sync)
  // Filter: Hanya ambil activity yang id-nya mengandung "_last_edit" untuk menghindari spam history lama.
  const activityIncomes = kasActivities
    .filter((act) => String(act.id || "").includes("_last_edit"))
    .map((act) => {
      const rawDate = act.lastUpdated;
      let ts: Date;

      if (rawDate) {
        if (
          typeof rawDate === "object" &&
          "toDate" in rawDate &&
          typeof (rawDate as any).toDate === "function"
        ) {
          ts = (rawDate as any).toDate();
        } else {
          ts = new Date(rawDate);
        }
      } else {
        ts = parseIndonesianDate(`${act.bulan || ""} ${act.tahun || ""}`);
      }

      if (isNaN(ts.getTime())) ts = new Date();

      // Jika data adalah consolidated (_last_edit), tampilkan label tahun
      // Jika masih ada sisa-sisa bulan/minggu di data baru, tampilkan
      const displayDate = act.bulan
        ? `${act.bulan} ${act.tahun}${act.minggu ? ` (${act.minggu})` : ""}`
        : `Update Iuran Kas ${act.tahun}`;

      return {
        id: act.id,
        type: "in",
        name: act.nama,
        nim: act.nim,
        amount: act.nominal,
        added: act.added || 0, // Ambil nominal baru yang ditambahkan dari Firestore
        date: displayDate,
        timestamp: ts,
        isSync: true,
      };
    });

  const unifiedHistory = [
    // Transaksi yang sedang diproses (Pending/Suspicious) - Belum masuk Spreadsheet
    ...transactions
      .filter((tx) => tx.status !== "verified")
      .map((tx) => ({
        id: tx.id,
        type: "in",
        name: tx.name,
        nim: tx.nim,
        amount: tx.amount,
        date: tx.date,
        timestamp: tx.createdAt?.toDate?.() || parseIndonesianDate(tx.date),
      })),
    // Data dari spreadsheet (Activity) - Source of truth untuk aktivitas terbaru dari spreadsheet
    ...activityIncomes,
    // Data pengeluaran - De-duplicated items matching spreadsheet rows
    ...(() => {
      const uniqueExps: any[] = [];
      const seenExps = new Set();
      kasExpenses.forEach((exp) => {
        const amt = Number(exp.nominal || 0);
        if (amt <= 0) return;

        const key = `${exp.tahun}-${exp.sourceRow || exp.id}`;

        if (!seenExps.has(key)) {
          const rawDate = exp.lastUpdated;
          let ts: Date;

          if (rawDate) {
            if (
              typeof rawDate === "object" &&
              "toDate" in rawDate &&
              typeof (rawDate as any).toDate === "function"
            ) {
              ts = (rawDate as any).toDate();
            } else {
              ts = new Date(rawDate);
            }
          } else {
            // Updated format: tanggal bulan tahun
            ts = parseIndonesianDate(
              `${exp.tanggal || 1} ${exp.bulan || ""} ${exp.tahun || ""}`,
            );
          }

          if (isNaN(ts.getTime())) ts = new Date();

          uniqueExps.push({
            id: exp.id,
            type: "out",
            name: exp.item || exp.keterangan || "Pengeluaran",
            nim: "ORGANISASI",
            amount: amt,
            date: `${exp.tanggal || 1} ${exp.bulan || ""} ${exp.tahun || ""}`,
            timestamp: ts,
            category: exp.kategori,
            note: exp.catatan,
          });
          seenExps.add(key);
        }
      });
      return uniqueExps;
    })(),
  ].sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

  const recentHistory = unifiedHistory.slice(0, 3);

  const handleUpdateStatus = async (
    txId: string,
    newStatus: Transaction["status"],
  ) => {
    if (!isAdmin) return;
    try {
      const txRef = doc(db, "v2_kas_transactions", txId);
      await updateDoc(txRef, {
        status: newStatus,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `v2_kas_transactions/${txId}`);
    }
  };

  if (!pageReady) return <KasSkeleton />;

  if (!currentUser) {
    return (
      <MaintenanceGuard menuId="kas">
        <KasLoginGuard />
      </MaintenanceGuard>
    );
  }

  return (
    <MaintenanceGuard menuId="kas">
      <div className="min-h-screen bg-slate-50 relative overflow-hidden">
      {/* Background with Image and Gradient Masking */}
      <div className="absolute top-0 left-0 right-0 h-[600px] z-0 pointer-events-none overflow-hidden">
        <div className="relative w-full h-full">
          <OptimizedImage 
            src="https://media.istockphoto.com/id/612818266/id/foto/3d-rupiah-uang-latar-belakang-putih.jpg?b=1&s=612x612&w=0&k=20&c=tMvfT6UpzeQdi94RytDoHxXFofgvJSgh7td_PLm4B-8=" 
            alt="background" 
            className="w-full h-full object-cover opacity-[0.15]"
            fallbackClassName="w-full h-full bg-slate-50"
          />
          {/* Fading bottom gradient */}
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-slate-50/50 to-slate-50" />
        </div>
      </div>
      <div className="relative z-10">
        <div className="pt-20 pb-12">
      <div className="container mx-auto px-4">
          {view === "overview" ? (
            <div
              className="space-y-4"
            >
              {fbError && (
                <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl flex items-start gap-3 shadow-sm">
                  <AlertCircle
                    size={18}
                    className="text-amber-600 mt-0.5 shrink-0"
                  />
                  <div className="space-y-1">
                    <p className="text-[10px] font-black text-amber-800 uppercase tracking-wider">
                      Peringatan Database
                    </p>
                    <p className="text-[11px] font-medium text-amber-700 leading-relaxed">
                      {fbError}
                    </p>
                    <a
                      href="https://console.firebase.google.com/project/vektorion-25/firestore/rules"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[10px] font-bold text-amber-900 underline block mt-1 hover:text-amber-950 transition-colors"
                    >
                      Buka Firebase Console & Pasang Rules
                    </a>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between gap-1">
                <div className="flex flex-col gap-1">
                  <h1 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-4">
                    <div className="w-8 h-8 flex items-center justify-center">
                      <img 
                        src="https://cdn-icons-png.flaticon.com/128/10692/10692615.png" 
                        alt="Kas" 
                        className="w-6 h-6 object-contain brightness-0 saturate-100 invert-[71%] sepia-[85%] saturate-[1637%] hue-rotate-[352deg] brightness-[98%] contrast-[98%]"
                      />
                    </div>
                    KAS ANGKATAN
                  </h1>
                  <p className="text-slate-400 font-medium text-[9px] tracking-widest">
                    Transparansi keuangan angkatan
                  </p>
                </div>
                <div className="flex items-center gap-1.5 p-1 bg-slate-100/50 rounded-md border border-slate-200/50">
                  {isAdmin && (
                    <button
                      onClick={handleResetKas}
                      disabled={isResetting}
                      className={cn(
                        "flex items-center gap-1 px-2 py-1.5 transition-all rounded-md",
                        isConfirmingReset 
                          ? "bg-red-500 text-white shadow-sm" 
                          : "text-slate-400 hover:text-red-500 hover:bg-white",
                        isResetting && "animate-pulse"
                      )}
                      title="Bersihkan Semua Data Kas (Admin Only)"
                    >
                      {isConfirmingReset ? <Check size={12} /> : <Trash2 size={12} />}
                      {isConfirmingReset && <span className="text-[9px] font-black tracking-tighter uppercase whitespace-nowrap">Yakin?</span>}
                    </button>
                  )}
                  <button
                    onClick={handleRefresh}
                    disabled={isKasLoading || isLoadingRx}
                    className={cn(
                      "p-1.5 text-slate-400 hover:text-amber-500 transition-all rounded-md hover:bg-white",
                      (isKasLoading || isLoadingRx) && "animate-spin",
                    )}
                    title="Segarkan Data"
                  >
                    <RotateCcw size={12} />
                  </button>
                </div>
              </div>

              {/* Box 1: Saldo Kas Total */}
              <div className="bg-white border border-slate-100 rounded-md p-6 shadow-xl relative overflow-hidden">
                <div className="absolute right-0 top-0 w-32 h-32 bg-amber-500/5 rounded-md -translate-y-1/2 translate-x-1/2 blur-[40px] pointer-events-none" />
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-slate-400 text-[10px] font-bold tracking-widest">
                      Saldo kas terkumpul
                    </p>
                    {Object.keys(treasurySummary).length > 0 && (
                      <span className="flex items-center gap-1 text-[8px] font-bold text-green-500 tracking-widest">
                        <Check size={10} /> Terverifikasi sistem
                      </span>
                    )}
                  </div>
                  <h2
                    className={cn(
                      "text-4xl md:text-5xl font-black tracking-tighter",
                      balance >= 0 ? "text-slate-900" : "text-red-500",
                    )}
                  >
                    <span className="text-2xl mr-1 text-slate-300 font-bold tracking-normal">
                      Rp
                    </span>
                    {Math.abs(balance).toLocaleString("id-ID")}
                  </h2>
                </div>
              </div>

              {/* Action Row: PDF, Spreadsheet & Rekap */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <button
                    onClick={generatePDF}
                    className="flex-1 p-2 bg-white hover:bg-slate-50 border border-slate-100 text-slate-500 rounded-md font-black text-[8px] uppercase tracking-widest transition-all flex items-center justify-center gap-1.5"
                  >
                    <img src="https://cdn-icons-png.flaticon.com/128/337/337946.png" alt="PDF" className="w-4 h-4" /> PDF Laporan
                  </button>
                  <a
                    href="https://docs.google.com/spreadsheets/d/1OTJ8tLjklE1u3HhDBR7SnO9F1ZP5NObl4saLWDWa8Pk/edit?usp=sharing"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 p-2 bg-white hover:bg-slate-50 border border-slate-100 text-slate-500 rounded-md font-black text-[8px] uppercase tracking-widest transition-all flex items-center justify-center gap-1.5 text-center"
                  >
                    <img src="https://cdn-icons-png.flaticon.com/128/11895/11895559.png" alt="Sheets" className="w-4 h-4" /> Spreadsheet
                  </a>
                  <button
                    onClick={generateRekap}
                    className="flex-1 p-2 bg-white hover:bg-slate-50 border border-slate-100 text-slate-500 rounded-md font-black text-[8px] uppercase tracking-widest transition-all flex items-center justify-center gap-1.5"
                  >
                    <img src="https://cdn-icons-png.flaticon.com/128/10353/10353698.png" alt="Rekap" className="w-4 h-4" /> Rekap Kas
                  </button>
                </div>
                <div className="flex items-center gap-1.5 px-1">
                  <Info size={10} className="text-amber-500 shrink-0" />
                  <p className="text-[8px] font-medium text-slate-400 leading-tight">
                    Akses spreadsheet wajib menggunakan email <span className="font-bold text-slate-600">@student.itera.ac.id</span>
                  </p>
                </div>
              </div>

              {/* Box 2: Bayar Kas Button (Slim Full Width) */}
              <button
                onClick={() => {
                  setView("pay");
                  resetForm();
                }}
                className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-md font-black text-[9px] uppercase tracking-[0.3em] flex items-center justify-center gap-3 transition-all active:scale-[0.98] shadow-lg sticky top-20 z-20"
              >
                <img 
                  src="https://cdn-icons-png.flaticon.com/128/18497/18497891.png" 
                  alt="Bayar" 
                  className="w-4 h-4 grayscale brightness-0 invert" 
                /> Bayar Kas
              </button>

              {/* Unified Financial Box (Merged Income, Expenses & History) */}
              <div className="bg-white border border-slate-100 rounded-md shadow-2xl overflow-visible flex flex-col">
                <div className="p-6 border-b border-slate-50 bg-slate-50/30">
                  <h3 className="text-[10px] font-bold text-slate-400 tracking-widest mb-5 flex items-center gap-2">
                    <History size={12} className="text-amber-500" /> Analisa kas angkatan
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Pemasukan Section */}
                    <div className="space-y-4">
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 bg-green-50 rounded-lg">
                          <ArrowUpRight size={16} className="text-green-600" />
                        </div>
                        <span className="text-xs font-bold text-slate-900 tracking-tight">
                          Pemasukan
                        </span>
                      </div>
                      <div className="space-y-3 pl-6 border-l-2 border-slate-100/50">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold text-slate-400">
                            Anggota Aktif
                          </span>
                          <span className="text-xs font-black text-slate-900 tracking-tight">
                            Rp {inAktif.toLocaleString("id-ID")}
                          </span>
                        </div>
                        <div className="flex items-center justify-between gap-2">
                          <div
                            className="flex items-center gap-1.5 group relative"
                            ref={infoRef}
                          >
                            <span
                              className="text-[10px] font-bold text-slate-400 border-b border-dotted border-slate-300 pointer-events-auto cursor-help"
                              onClick={() =>
                                setShowInKeluarTooltip(!showInKeluarTooltip)
                              }
                            >
                              Anggota Keluar
                            </span>
                            <Info
                              size={10}
                              className="text-slate-300 cursor-pointer"
                              onClick={() =>
                                setShowInKeluarTooltip(!showInKeluarTooltip)
                              }
                            />
                            {/* Tooltip */}
                            {showInKeluarTooltip && (
                              <div
                                className="absolute top-full left-0 mt-3 w-64 p-5 bg-white border border-slate-100 shadow-2xl rounded-2xl z-[100] origin-top-left"
                              >
                                <div className="flex items-center gap-2 mb-2">
                                  <div className="w-6 h-6 bg-amber-50 rounded-lg flex items-center justify-center">
                                    <Info
                                      size={12}
                                      className="text-amber-500"
                                    />
                                  </div>
                                  <span className="text-[10px] font-black text-slate-800 uppercase tracking-widest">
                                    Informasi Dana
                                  </span>
                                </div>
                                <p className="text-[9px] font-medium leading-relaxed text-slate-500">
                                  Mencakup dana yang dibayarkan oleh anggota
                                  angkatan 25 yang saat ini statusnya sudah
                                  non-aktif (mengundurkan diri/berhenti).
                                  Sesuai aturan, dana tersebut{" "}
                                  <span className="font-bold text-slate-800 underline">
                                    tidak dapat ditarik
                                  </span>{" "}
                                  dan tetap menjadi milik kas angkatan.
                                </p>
                                <div className="mt-3 pt-3 border-t border-slate-50 flex justify-end">
                                  <button
                                    onClick={() =>
                                      setShowInKeluarTooltip(false)
                                    }
                                    className="text-[8px] font-black text-amber-500 uppercase tracking-tighter hover:bg-amber-50 px-2 py-1 rounded-md transition-colors"
                                  >
                                    Tutup
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                          <span className="text-xs font-black text-slate-900 tracking-tight">
                            Rp {inKeluar.toLocaleString("id-ID")}
                          </span>
                        </div>
                        <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                          <span className="text-[10px] font-bold text-green-600 tracking-wider">
                            Total masuk
                          </span>
                          <span className="text-sm font-black text-green-600 tracking-tighter">
                            Rp {totalIn.toLocaleString("id-ID")}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Pengeluaran Section */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="p-1.5 bg-red-50 rounded-lg">
                            <ArrowDownLeft size={16} className="text-red-600" />
                          </div>
                          <span className="text-xs font-bold text-slate-900 tracking-tight">
                            Pengeluaran
                          </span>
                        </div>
                      </div>
                      <div className="pl-6 border-l-2 border-slate-100/50 h-full flex flex-col justify-center">
                        <div className="flex flex-col">
                          <div className="flex items-baseline gap-1">
                            <span className="text-[10px] font-black text-slate-300">
                              Rp
                            </span>
                            <p className="text-3xl font-black text-slate-900 tracking-tighter leading-none">
                              {totalOut.toLocaleString("id-ID")}
                            </p>
                          </div>
                          <p className="text-[9px] font-bold text-red-500/80 tracking-widest mt-2">
                            Dana terpakai
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Recharts Analytics Donut Chart */}
                  <div className="mt-8 pt-6 border-t border-slate-100 flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="w-full md:w-1/2 flex flex-col justify-center text-left">
                      <p className="text-[10px] font-bold text-slate-400 tracking-widest uppercase mb-1">Visualisasi Rasio Dana</p>
                      <h4 className="text-xs font-bold text-slate-900 tracking-tight leading-normal">
                        Rasio Saldo Kas terhadap Dana Terpakai Angkatan
                      </h4>
                      <p className="text-[9px] text-slate-500 font-normal leading-relaxed mt-2">
                        Diagram interaktif ini membandingkan sisa dana bersih tersimpan di kas angkatan (saldo aktif) dengan akumulasi dana terpakai untuk menunjang kegiatan operasional.
                      </p>
                      <div className="mt-4 space-y-2">
                        <div className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-sm bg-amber-500 shrink-0" />
                          <span className="text-[9px] font-bold text-slate-600">Sisa Saldo: Rp {balance.toLocaleString("id-ID")} ({totalIn > 0 ? ((balance / totalIn) * 100).toFixed(1) : 0}%)</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-sm bg-red-500 shrink-0" />
                          <span className="text-[9px] font-bold text-slate-600">Dana Terpakai: Rp {totalOut.toLocaleString("id-ID")} ({totalIn > 0 ? ((totalOut / totalIn) * 100).toFixed(1) : 0}%)</span>
                        </div>
                      </div>
                    </div>
                    <div className="w-full md:w-1/2 h-44 relative flex items-center justify-center">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={[
                              { name: "Sisa Saldo Kas", value: balance > 0 ? balance : 0 },
                              { name: "Dana Terpakai", value: totalOut > 0 ? totalOut : 0 }
                            ]}
                            cx="50%"
                            cy="50%"
                            innerRadius={50}
                            outerRadius={70}
                            paddingAngle={4}
                            dataKey="value"
                          >
                            <Cell fill="#f59e0b" />
                            <Cell fill="#ef4444" />
                          </Pie>
                          <Tooltip 
                            formatter={(value: any) => `Rp ${Number(value).toLocaleString("id-ID")}`}
                            contentStyle={{ background: '#0f172a', borderRadius: '4px', border: 'none', color: '#fff', fontSize: '9px', fontFamily: 'monospace' }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="absolute text-center flex flex-col items-center">
                        <p className="text-[7px] text-slate-400 font-black tracking-widest uppercase">SALDO AKTIF</p>
                        <p className="text-sm font-black text-slate-900 tracking-tighter">
                          {totalIn > 0 ? ((balance / totalIn) * 100).toFixed(0) : 0}%
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Simple History (Compact Rectangular Rows) */}
                <div className="p-6 bg-white space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-[10px] font-bold text-slate-400 tracking-widest flex items-center gap-2">
                      <Clock size={12} /> Aktivitas terbaru
                    </h4>
                    <button
                      onClick={() => setView("history")}
                      className="text-[9px] font-black text-slate-300 hover:text-amber-500 uppercase tracking-widest transition-colors"
                    >
                      Lihat Semua
                    </button>
                  </div>
                    <div className="space-y-1.5">
                      {recentHistory.length > 0 ? (
                        recentHistory.map((item) => (
                          <div
                            key={item.id}
                            onClick={() =>
                              setExpandedHistory(
                                expandedHistory === item.id ? null : item.id,
                              )
                            }
                            className={cn(
                              "bg-white border border-slate-100 p-4 rounded-lg hover:bg-slate-50/50 transition-all cursor-pointer overflow-hidden shadow-[0_1px_2px_rgba(0,0,0,0.02)]",
                              expandedHistory === item.id
                                ? "bg-slate-50/80 ring-1 ring-slate-100 shadow-sm"
                                : "",
                            )}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div
                                  className={cn(
                                    "flex items-center justify-center shrink-0",
                                    item.type === "in"
                                      ? "text-green-500"
                                      : "text-red-500",
                                  )}
                                >
                                  {item.type === "in" ? (
                                    <ArrowUpRight size={18} strokeWidth={3} />
                                  ) : (
                                    <ArrowDownLeft size={18} strokeWidth={3} />
                                  )}
                                </div>
                                <span className="text-[10px] font-black text-slate-800 uppercase leading-none truncate max-w-[120px]">
                                  {item.name}
                                </span>
                              </div>
                              <div className="text-right flex flex-col items-end gap-1">
                                <p
                                  className={cn(
                                    "text-[11px] font-black tracking-tighter leading-none whitespace-nowrap",
                                    item.type === "in"
                                      ? "text-green-600"
                                      : "text-red-600",
                                  )}
                                >
                                  {item.type === "in" ? "+" : "-"} Rp{" "}
                                  {((item as any).added && (item as any).added > 0
                                    ? (item as any).added
                                    : item.amount
                                  ).toLocaleString("id-ID")}
                                </p>
                                <span className="text-[6px] font-bold text-slate-300 uppercase tracking-widest leading-none">
                                  {formatFullDateTime(item.timestamp)}
                                </span>
                              </div>
                            </div>

                            {expandedHistory === item.id && (
                              <div className="mt-3 pt-3 border-t border-slate-200/50 w-full">
                                {item.type === "in" ? (
                                  <div className="flex items-center justify-between px-1">
                                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none">
                                      Total Iuran
                                    </p>
                                    <p className="text-[10px] font-black text-slate-700 tracking-tight leading-none">
                                      Rp {item.amount.toLocaleString("id-ID")}
                                    </p>
                                  </div>
                                ) : (
                                  <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none text-center italic">
                                    Detail Pengeluaran Organisasi
                                  </p>
                                )}
                              </div>
                            )}
                          </div>
                        ))
                      ) : (
                        <div className="py-8 text-center bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
                          <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">
                            Belum ada riwayat aktivitas
                          </p>
                        </div>
                      )}
                  </div>
                </div>
              </div>

              {/* Box 4: Status Iuran Anggota */}
              <div className="bg-white border border-slate-100 rounded-2xl p-5 md:p-6 shadow-xl">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Users size={16} className="text-amber-500" />
                    <h3 className="text-[11px] font-bold tracking-widest text-slate-900">
                      Daftar status iuran
                    </h3>
                  </div>
                  <button
                    onClick={() => setView("members")}
                    className="text-[9px] font-black text-amber-500 hover:text-amber-600 uppercase tracking-widest flex items-center gap-1"
                  >
                    Detail <ArrowRight size={12} />
                  </button>
                </div>

                <div className="space-y-2">
                  {MEMBERS_DATA.filter((m) => {
                    const paid = getMemberProgress(
                      m,
                      selectedMonth,
                      selectedYear,
                    );
                    const feePerWeek =
                      selectedYear === "2026" &&
                      MONTHS.indexOf(selectedMonth) < 4
                        ? 5000
                        : 2000;
                    return paid < feePerWeek * 4;
                  })
                    .slice(0, 3)
                    .map((member) => {
                      const paid = getMemberProgress(
                        member,
                        selectedMonth,
                        selectedYear,
                      );
                      const feePerWeek =
                        selectedYear === "2026" &&
                        MONTHS.indexOf(selectedMonth) < 4
                          ? 5000
                          : 2000;
                      const monthlyTarget = feePerWeek * 4;

                      // Logic to check if this is the current user's profile
                      const emailPart = currentUser?.email?.split("@")[0] || "";
                      const parts = emailPart.split(".");
                      const myNim =
                        parts.length > 1
                          ? parts[1].toUpperCase()
                          : parts[0].toUpperCase();
                      const isMe =
                        member.nim === myNim ||
                        member.name.toLowerCase() ===
                          currentUser?.displayName?.toLowerCase();

                      return (
                        <div
                          key={member.nim}
                          className="flex items-center justify-between bg-slate-50/50 p-3 rounded-xl border border-slate-100"
                        >
                          <div className="flex flex-col">
                            <span className="text-[11px] font-black text-slate-700 uppercase tracking-tight">
                              {member.name}
                            </span>
                            <span className="text-[8px] font-bold text-slate-400">
                              Rp {paid / 1000}k/{monthlyTarget / 1000}k •{" "}
                              {selectedMonth}
                            </span>
                          </div>
                          {isMe ? (
                            <button
                              onClick={() => {
                                setSelectedMember({
                                  name: member.name,
                                  nim: member.nim,
                                });
                                setSearchMember(member.name);
                                setView("pay");
                              }}
                              className="px-4 py-1.5 bg-red-50 text-red-600 text-[9px] font-black uppercase tracking-widest rounded-lg hover:bg-red-600 hover:text-white transition-all shadow-sm"
                            >
                              Bayar
                            </button>
                          ) : (
                            <div className="px-3 py-1.5 bg-slate-100 text-slate-400 text-[8px] font-black uppercase tracking-widest rounded-lg cursor-not-allowed">
                              Belum Bayar
                            </div>
                          )}
                        </div>
                      );
                    })}
                </div>

                <div className="mt-4 pt-4 border-t border-slate-50 flex items-center justify-between">
                  {(() => {
                    const lastUpd = treasurySummary[selectedYear]?.lastUpdated;
                    return (
                      <span className="text-[8px] font-bold text-slate-300 tracking-widest italic">
                        Update:{" "}
                        {lastUpd
                          ? new Date(lastUpd).toLocaleDateString("id-ID")
                          : new Date().toLocaleDateString("id-ID")}
                      </span>
                    );
                  })()}
                </div>
              </div>
            </div>
          ) : view === "members" ? (
            <div
              className="space-y-6"
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <button
                  onClick={() => setView("overview")}
                  className="w-fit flex items-center gap-2 text-slate-400 hover:text-slate-900 transition-colors group"
                >
                  <div className="p-2 bg-slate-50 rounded-md group-hover:bg-slate-100">
                    <ArrowLeft size={16} />
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-widest">
                    Dashboard
                  </span>
                </button>
                <div className="flex flex-col">
                  <h2 className="text-xl md:text-2xl font-black text-slate-900 tracking-tighter uppercase italic">
                    Daftar Status Iuran
                  </h2>
                  <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">
                    Cek riwayat pembayaran anggota
                  </p>
                </div>
              </div>

              {/* Matrix Search & Yearly Reports */}
              <div className="space-y-6">
                <div className="bg-white border border-slate-100 rounded-2xl p-5 md:p-6 shadow-xl space-y-3 relative">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <Search size={12} className="text-amber-500" /> Cari Anggota
                    di Spreadsheet
                  </label>
                  <div className="relative max-w-md">
                    <input
                      type="text"
                      placeholder="Ketik nama untuk mencari di tabel..."
                      value={searchMember}
                      onChange={(e) => setSearchMember(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-100 text-slate-900 text-[11px] font-bold rounded-lg pl-10 pr-4 py-3 focus:border-amber-500 outline-none transition-all"
                    />
                    <Search
                      className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-300"
                      size={14}
                    />
                  </div>

                  {/* Search Suggestions */}
                  {searchMember.length > 0 && !selectedIndividual && (
                    <div className="absolute z-[60] left-5 right-5 md:left-6 md:right-auto md:w-full md:max-w-md mt-1 bg-white border border-slate-200 shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200 ring-1 ring-black/5">
                      <div className="p-2 border-b border-slate-50 bg-slate-50/50">
                        <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest px-2">
                          Hasil Pencarian ({filteredMembers.length})
                        </span>
                      </div>
                      <div className="max-h-[300px] overflow-y-auto no-scrollbar">
                        {filteredMembers.length > 0 ? (
                          filteredMembers.slice(0, 10).map((m) => (
                            <button
                              key={m.nim}
                              onClick={() => {
                                setSelectedIndividual(m);
                                setSearchMember("");
                              }}
                              className="w-full px-4 py-3 flex items-center justify-between hover:bg-slate-50 transition-colors group border-b border-slate-50 last:border-0"
                            >
                              <div className="flex flex-col items-start">
                                <span className="text-[11px] font-black text-slate-800 uppercase group-hover:text-amber-600 transition-colors">
                                  {m.name}
                                </span>
                                <span className="text-[9px] font-bold text-slate-400">
                                  {m.nim}
                                </span>
                              </div>
                              <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <span className="text-[8px] font-black uppercase text-amber-500">
                                  Pilih
                                </span>
                                <ChevronRight
                                  size={14}
                                  className="text-amber-500 translate-x-0 group-hover:translate-x-1 transition-transform"
                                />
                              </div>
                            </button>
                          ))
                        ) : (
                          <div className="p-6 text-center">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                              Tidak ditemukan nama atau NIM "{searchMember}"
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {selectedIndividual ? (
                  /* CONSOLIDATED INDIVIDUAL BOX */
                  <div
                    className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-2xl"
                  >
                    <div className="p-6 md:p-10 bg-slate-900 flex flex-col md:flex-row md:items-end justify-between gap-6">
                      <div className="space-y-4">
                        <div className="space-y-1">
                          <h2 className="text-2xl md:text-3xl font-black text-white uppercase leading-none tracking-tight">
                            {selectedIndividual.name}
                          </h2>
                          <p className="text-lg md:text-xl font-bold text-amber-500/90 tracking-widest">
                            {selectedIndividual.nim}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 text-[10px] text-white/40 font-black uppercase tracking-[0.2em]">
                          <span>Laporan Terpadu 100% Terverifikasi</span>
                          <span>•</span>
                          <span>Feb 2026 - Des 2030</span>
                        </div>
                      </div>
                      <button
                        onClick={() => setSelectedIndividual(null)}
                        className="flex items-center justify-center gap-2 px-6 py-4 bg-white/10 hover:bg-white text-white hover:text-slate-900 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all border border-white/10 group shadow-lg"
                      >
                        <X
                          size={14}
                          className="group-hover:rotate-90 transition-transform"
                        />
                        Tutup Laporan
                      </button>
                    </div>

                    <div className="p-6 md:p-8 space-y-10 overflow-x-auto no-scrollbar">
                      {YEARS.slice()
                        .reverse()
                        .map((year) => {
                          const theme = getYearTheme(year);
                          const isStartYear = year === "2026";
                          // Filter out Jan for 2026
                          const displayedMonths = isStartYear
                            ? MONTHS.slice(1)
                            : MONTHS;

                          return (
                            <div key={year} className="space-y-4">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  <div
                                    className={cn(
                                      "w-1.5 h-6 rounded-md",
                                      theme.bg,
                                    )}
                                  />
                                  <h3 className="text-base font-black text-slate-900 uppercase tracking-widest">
                                    Tahun {year}
                                  </h3>
                                </div>
                                {isStartYear && (
                                  <span className="text-[9px] font-black text-amber-600 bg-amber-50 px-2 py-1 rounded-md uppercase tracking-widest">
                                    Dimulai dari Februari
                                  </span>
                                )}
                              </div>

                              <div className="overflow-x-auto rounded-2xl border border-slate-200 shadow-sm bg-slate-50/20">
                                <table className="w-full min-w-[1000px] border-collapse">
                                  <thead>
                                    <tr className="bg-slate-100/80 text-[8px] font-black text-slate-500 uppercase tracking-widest">
                                      <th className="px-4 py-5 text-left w-20 border-r border-slate-200">
                                        PEKAN
                                      </th>
                                      {displayedMonths.map((m) => (
                                        <th
                                          key={m}
                                          className={cn(
                                            "px-1 border-r border-slate-200 min-w-[80px]",
                                          )}
                                        >
                                          <div className="py-2 mb-2 border-b border-slate-200/50">
                                            {m}
                                          </div>
                                          <div className="grid grid-cols-4 gap-0.5 px-1 pb-2">
                                            {[1, 2, 3, 4].map((w) => (
                                              <span
                                                key={w}
                                                className="text-[6px] opacity-40 font-black"
                                              >
                                                W{w}
                                              </span>
                                            ))}
                                          </div>
                                        </th>
                                      ))}
                                    </tr>
                                  </thead>
                                  <tbody>
                                    <tr className="bg-white group">
                                      <td className="px-4 py-4 border-r border-slate-200 border-b border-slate-200">
                                        <span className="text-[10px] font-black text-slate-900 tracking-tighter">
                                          STATUS POKOK
                                        </span>
                                      </td>
                                      {displayedMonths.map((month, mIdx) => {
                                        // If 2026, month index is offset by 1
                                        const actualMonthIdx = isStartYear
                                          ? MONTHS.indexOf(month)
                                          : mIdx;
                                        const paid = getMemberProgress(
                                          selectedIndividual,
                                          month,
                                          year,
                                        );
                                        const yearInt = parseInt(year);
                                        const now = new Date();
                                        const isFutureMonth =
                                          yearInt > now.getFullYear() ||
                                          (yearInt === now.getFullYear() &&
                                            actualMonthIdx > now.getMonth());

                                        return (
                                          <td
                                            key={month}
                                            className="p-1 border-r border-slate-200 border-b border-slate-200 last:border-r-0"
                                          >
                                            <div className="grid grid-cols-4 gap-1 h-full">
                                              {[1, 2, 3, 4].map((w) => {
                                                const yearData =
                                                  kasMatrix[year]?.[
                                                    selectedIndividual.nim
                                                  ];
                                                const feePerWeek =
                                                  year === "2026" &&
                                                  MONTHS.indexOf(month) < 4
                                                    ? 5000
                                                    : 2000;

                                                let isLunas = false;
                                                if (
                                                  yearData &&
                                                  yearData.payments &&
                                                  yearData.payments[
                                                    month.toLowerCase()
                                                  ]
                                                ) {
                                                  const weekVal =
                                                    yearData.payments[
                                                      month.toLowerCase()
                                                    ]["minggu" + w];
                                                  isLunas =
                                                    (Number(weekVal) || 0) >=
                                                    feePerWeek;
                                                } else {
                                                  const paid =
                                                    getMemberProgress(
                                                      selectedIndividual,
                                                      month,
                                                      year,
                                                    );
                                                  isLunas =
                                                    paid >= w * feePerWeek;
                                                }
                                                return (
                                                  <div
                                                    key={w}
                                                    className={cn(
                                                      "h-10 rounded-md flex items-center justify-center transition-all duration-300 border",
                                                      isFutureMonth
                                                        ? "bg-slate-50/50 border-slate-100"
                                                        : isLunas
                                                          ? "bg-green-500 text-white shadow-md border-green-600"
                                                          : "bg-red-50 border-red-100 text-red-300",
                                                    )}
                                                    title={`${month} W${w}: ${isLunas ? "Lunas" : "Belum"}`}
                                                  >
                                                    {isFutureMonth ? (
                                                      <div className="w-1.5 h-1.5 bg-slate-200 rounded-full" />
                                                    ) : isLunas ? (
                                                      <Check
                                                        size={12}
                                                        strokeWidth={4}
                                                      />
                                                    ) : (
                                                      <div className="w-1.5 h-1.5 bg-red-200 rounded-full" />
                                                    )}
                                                  </div>
                                                );
                                              })}
                                            </div>
                                          </td>
                                        );
                                      })}
                                    </tr>
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  </div>
                ) : (
                  /* ORIGINAL YEARLY MATRIX LIST */
                  <div className="space-y-6 pb-10">
                    {YEARS.slice()
                      .reverse()
                      .map((year, yIdx) => {
                        const yearInt = parseInt(year);
                        const isCurrentYear = year === currentYearStr;
                        const isOpen = openYearMatrix === year;

                        // Theme colors based on year
                        const themes = [
                          {
                            bg: "bg-slate-900",
                            border: "border-slate-800",
                            accent: "text-slate-400",
                            side: "bg-slate-800",
                            hover: "hover:bg-slate-50",
                            text: "text-slate-900",
                          },
                          {
                            bg: "bg-amber-900",
                            border: "border-amber-800",
                            accent: "text-amber-400",
                            side: "bg-amber-800",
                            hover: "hover:bg-amber-50",
                            text: "text-amber-900",
                          },
                          {
                            bg: "bg-indigo-900",
                            border: "border-indigo-800",
                            accent: "text-indigo-400",
                            side: "bg-indigo-800",
                            hover: "hover:bg-indigo-50",
                            text: "text-indigo-900",
                          },
                          {
                            bg: "bg-emerald-900",
                            border: "border-emerald-800",
                            accent: "text-emerald-400",
                            side: "bg-emerald-800",
                            hover: "hover:bg-emerald-50",
                            text: "text-emerald-900",
                          },
                          {
                            bg: "bg-rose-900",
                            border: "border-rose-800",
                            accent: "text-rose-400",
                            side: "bg-rose-800",
                            hover: "hover:bg-rose-50",
                            text: "text-rose-900",
                          },
                        ];
                        const theme = themes[yIdx % themes.length];

                        return (
                          <div
                            key={year}
                            className="bg-white border border-slate-100 rounded-2xl overflow-hidden shadow-xl"
                          >
                            <div
                              onClick={() =>
                                setOpenYearMatrix(isOpen ? null : year)
                              }
                              onKeyDown={(e) => {
                                if (e.key === "Enter" || e.key === " ") {
                                  e.preventDefault();
                                  setOpenYearMatrix(isOpen ? null : year);
                                }
                              }}
                              role="button"
                              tabIndex={0}
                              className={cn(
                                "w-full px-5 md:px-6 py-4 flex items-center justify-between transition-all group cursor-pointer",
                                isOpen
                                  ? theme.bg
                                  : "bg-white hover:bg-slate-50",
                              )}
                            >
                              <div className="flex items-center gap-3">
                                <h3
                                  className={cn(
                                    "text-lg md:text-xl font-black tracking-tighter italic transition-colors",
                                    isOpen ? "text-white" : "text-slate-900",
                                  )}
                                >
                                  Laporan Iuran {year}
                                </h3>
                                {isCurrentYear && (
                                  <span
                                    className={cn(
                                      "px-2 py-0.5 text-[8px] font-black uppercase rounded-lg backdrop-blur-md",
                                      isOpen
                                        ? "bg-white/20 text-white"
                                        : "bg-amber-100 text-amber-600",
                                    )}
                                  >
                                    Aktif
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-4">
                                <div
                                  className={cn(
                                    "hidden md:flex items-center gap-2 text-[10px] font-black uppercase tracking-widest",
                                    isOpen ? "text-white/50" : "text-slate-400",
                                  )}
                                >
                                  <span>
                                    {filteredMembers.length} Mahasiswa
                                  </span>
                                </div>

                                {isAdmin && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      alert(
                                        "Fitur Import Spreadsheet sedang disiapkan. Silakan hubungi pengembang untuk aktivasi modul.",
                                      );
                                    }}
                                    className={cn(
                                      "p-2 rounded-lg transition-all",
                                      isOpen
                                        ? "bg-white/10 text-white hover:bg-white/20"
                                        : "bg-slate-50 text-slate-400 hover:text-amber-500",
                                    )}
                                    title="Import Data"
                                  >
                                    <Upload size={14} />
                                  </button>
                                )}

                                <div
                                  className={cn(
                                    "p-2 rounded-full transition-transform",
                                    isOpen
                                      ? "bg-white/10 text-white rotate-180"
                                      : "bg-slate-100 text-slate-400 group-hover:bg-slate-200",
                                  )}
                                >
                                  <ChevronDown size={14} />
                                </div>
                              </div>
                            </div>

                            {isOpen && (
                              <div
                                className="overflow-hidden"
                              >
                                  <div className="relative overflow-x-auto scrollbar-hide border-t border-white/10">
                                    <table className="w-full border-collapse min-w-[1600px]">
                                      <thead>
                                        <tr
                                          className={cn(
                                            "text-[8px] font-black uppercase tracking-widest text-white/80",
                                            theme.bg,
                                          )}
                                        >
                                          <th className="sticky left-0 z-30 bg-inherit border-r border-white/10 px-2 py-4 text-center w-[35px]">
                                            No
                                          </th>
                                          <th className="border-r border-white/10 px-4 py-4 text-left min-w-[150px]">
                                            Mahasiswa
                                          </th>
                                          <th className="border-r border-white/10 px-3 py-4 text-left min-w-[90px]">
                                            NIM
                                          </th>
                                          {(year === "2026"
                                            ? MONTHS.slice(1)
                                            : MONTHS
                                          ).map((month) => (
                                            <th
                                              key={month}
                                              colSpan={4}
                                              className="border-r border-white/10 px-2 py-4 text-center uppercase min-w-[120px]"
                                            >
                                              {month}
                                            </th>
                                          ))}
                                          <th className="bg-green-500 text-white border-l border-green-600 px-4 py-4 text-center w-[80px]">
                                            Lunas
                                          </th>
                                          <th className="bg-red-500 text-white border-l border-red-600 px-4 py-4 text-center w-[80px]">
                                            Tunggak
                                          </th>
                                          <th className="bg-blue-500 text-white border-l border-blue-600 px-4 py-4 text-center w-[80px]">
                                            Total
                                          </th>
                                        </tr>
                                        <tr
                                          className={cn(
                                            "text-[7px] font-black uppercase tracking-widest",
                                            theme.side,
                                            theme.accent,
                                          )}
                                        >
                                          <th className="sticky left-0 z-30 bg-inherit border-r border-white/5 px-2 py-1"></th>
                                          <th className="border-r border-white/5 px-4 py-1"></th>
                                          <th className="border-r border-white/5 px-3 py-1"></th>
                                          {(year === "2026"
                                            ? MONTHS.slice(1)
                                            : MONTHS
                                          ).map((m) => (
                                            <React.Fragment key={`${m}-weeks`}>
                                              <th className="border-r border-white/5 px-1 py-1">
                                                M1
                                              </th>
                                              <th className="border-r border-white/5 px-1 py-1">
                                                M2
                                              </th>
                                              <th className="border-r border-white/5 px-1 py-1">
                                                M3
                                              </th>
                                              <th className="border-r border-white/5 px-1 py-1">
                                                M4
                                              </th>
                                            </React.Fragment>
                                          ))}
                                          <th className="border-l border-white/5"></th>
                                          <th className="border-l border-white/5"></th>
                                          <th className="border-l border-white/5"></th>
                                        </tr>
                                      </thead>
                                      <tbody className="divide-y divide-slate-100 text-[9px]">
                                        {filteredMembers.map((member, mIdx) => {
                                          const { paidTotal, tunggakan } =
                                            getMemberArrears(member);
                                          const displayedMonths =
                                            year === "2026"
                                              ? MONTHS.slice(1)
                                              : MONTHS;
                                          return (
                                            <tr
                                              key={`${year}-${member.nim}`}
                                              className={cn(
                                                "font-bold text-slate-600 transition-colors border-b border-slate-100 last:border-0",
                                                theme.hover,
                                              )}
                                            >
                                              <td className="sticky left-0 z-10 bg-white border-r border-slate-200 px-2 py-2.5 text-center text-slate-300">
                                                {mIdx + 1}
                                              </td>
                                              <td className="border-r border-slate-200 px-4 py-2.5 font-black uppercase text-slate-900 truncate max-w-[150px]">
                                                {member.name}
                                              </td>
                                              <td className="border-r border-slate-200 px-3 py-2.5 text-slate-400 font-mono">
                                                {member.nim}
                                              </td>

                                              {displayedMonths.map(
                                                (month, mIdxInLoop) => {
                                                  const monthIdx =
                                                    MONTHS.indexOf(month);
                                                  const now = new Date();
                                                  const isFutureMonth =
                                                    yearInt >
                                                      now.getFullYear() ||
                                                    (yearInt ===
                                                      now.getFullYear() &&
                                                      monthIdx >
                                                        now.getMonth());
                                                  const monthlyPaid =
                                                    getMemberProgress(
                                                      member,
                                                      month,
                                                      year,
                                                    );

                                                  return [1, 2, 3, 4].map(
                                                    (w) => {
                                                      const yearData =
                                                        kasMatrix[year]?.[
                                                          member.nim
                                                        ];
                                                      const feePerWeek =
                                                        year === "2026" &&
                                                        MONTHS.indexOf(month) <
                                                          4
                                                          ? 5000
                                                          : 2000;

                                                      let isPaid = false;
                                                      if (
                                                        yearData &&
                                                        yearData.payments &&
                                                        yearData.payments[
                                                          month.toLowerCase()
                                                        ]
                                                      ) {
                                                        const weekVal =
                                                          yearData.payments[
                                                            month.toLowerCase()
                                                          ]["minggu" + w];
                                                        isPaid =
                                                          (Number(weekVal) ||
                                                            0) >= feePerWeek;
                                                      } else {
                                                        isPaid =
                                                          !isFutureMonth &&
                                                          monthlyPaid >=
                                                            w * feePerWeek;
                                                      }

                                                      return (
                                                        <td
                                                          key={`${monthIdx}-${w}`}
                                                          className={cn(
                                                            "border-r border-slate-100 px-1 py-2.5 text-center",
                                                            isFutureMonth
                                                              ? "bg-slate-50/20"
                                                              : "",
                                                          )}
                                                        >
                                                          {isFutureMonth ? (
                                                            <span className="text-slate-200">
                                                              .
                                                            </span>
                                                          ) : isPaid ? (
                                                            <CheckCircle
                                                              size={10}
                                                              className="text-green-500 mx-auto"
                                                              strokeWidth={3}
                                                            />
                                                          ) : (
                                                            <XCircle
                                                              size={10}
                                                              className="text-slate-200 mx-auto"
                                                            />
                                                          )}
                                                        </td>
                                                      );
                                                    },
                                                  );
                                                },
                                              )}

                                              <td className="bg-green-50/50 px-4 py-2.5 text-center font-black text-green-700 border-l border-slate-200">
                                                Rp {paidTotal / 1000}k
                                              </td>
                                              <td className="bg-red-50/50 px-4 py-2.5 text-center font-black text-red-700 border-l border-slate-200">
                                                Rp {tunggakan / 1000}k
                                              </td>
                                              <td className="bg-blue-50/50 px-4 py-2.5 text-center font-black text-blue-700 border-l border-slate-200">
                                                Rp{" "}
                                                {(paidTotal + tunggakan) / 1000}
                                                k
                                              </td>
                                            </tr>
                                          );
                                        })}
                                      </tbody>
                                    </table>
                                  </div>

                                  <div
                                    className={cn(
                                      "px-6 py-5 flex flex-col md:flex-row items-center justify-between border-t gap-4",
                                      theme.bg,
                                      theme.border,
                                    )}
                                  >
                                    <div className="flex flex-col md:flex-row items-center gap-4 md:gap-8">
                                      <span className="text-white text-[10px] font-black uppercase tracking-widest">
                                        Rekapitulasi {year}
                                      </span>
                                      <div className="flex gap-6">
                                        <span className="text-white text-[10px] font-black uppercase tracking-widest">
                                          Paid:{" "}
                                          <span className={theme.accent}>
                                            Rp{" "}
                                            {(
                                              filteredMembers.reduce(
                                                (acc, m) =>
                                                  acc +
                                                  getMemberArrears(m, year)
                                                    .paidTotal,
                                                0,
                                              ) / 1000
                                            ).toLocaleString("id-ID")}
                                            k
                                          </span>
                                        </span>
                                        <span className="text-white text-[10px] font-black uppercase tracking-widest">
                                          Target:{" "}
                                          <span className="text-white/50">
                                            Rp{" "}
                                            {(
                                              filteredMembers.length * 96
                                            ).toLocaleString("id-ID")}
                                            k
                                          </span>
                                        </span>
                                      </div>
                                    </div>

                                    <div className="flex items-center gap-2 w-full md:w-auto">
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleDownloadYearPDF(year);
                                        }}
                                        disabled={downloadingYear === year}
                                        className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white text-[9px] font-black uppercase tracking-widest rounded-xl transition-all border border-white/10"
                                      >
                                        {downloadingYear === year ? (
                                          <Loader2
                                            size={10}
                                            className="animate-spin"
                                          />
                                        ) : (
                                          <FileText size={10} />
                                        )}
                                        Unduh PDF
                                      </button>
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleDownloadYearSpreadsheet(year);
                                        }}
                                        disabled={downloadingYear === year}
                                        className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white text-[9px] font-black uppercase tracking-widest rounded-xl transition-all border border-white/10"
                                      >
                                        {downloadingYear === year ? (
                                          <Loader2
                                            size={10}
                                            className="animate-spin"
                                          />
                                        ) : (
                                          <Download size={10} />
                                        )}
                                        Spreadsheet
                                      </button>
                                    </div>
                                  </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                  </div>
                )}
              </div>
            </div>
          ) : view === "history" ? (
            <div
              className="space-y-6"
            >
              <div className="flex flex-col gap-4">
                <button
                  onClick={() => setView("overview")}
                  className="w-fit p-1 text-slate-400 hover:text-slate-900 transition-all flex items-center gap-1 group"
                >
                  <ArrowLeft
                    size={18}
                    className="group-hover:-translate-x-1 transition-transform"
                  />
                  <span className="text-[10px] font-black uppercase tracking-widest">
                    Kembali
                  </span>
                </button>

                <div className="space-y-1">
                  <h2 className="text-3xl font-black text-slate-900 uppercase leading-none tracking-tighter">
                    Seluruh Riwayat
                  </h2>
                  <p className="text-[9px] text-slate-400 font-bold uppercase tracking-[0.3em]">
                    Laporan Arus Kas Terpadu
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-2.5 pb-20">
                <div className="bg-white border border-slate-200 rounded-xl flex items-center px-4 py-1.5 shadow-sm h-12">
                  <Search size={16} className="text-slate-300 mr-3" />
                  <input
                    type="text"
                    placeholder="Cari transaksi atau anggota..."
                    value={historySearch}
                    onChange={(e) => setHistorySearch(e.target.value)}
                    className="bg-transparent border-none text-[10px] font-black uppercase tracking-widest text-slate-700 outline-none w-full h-full"
                  />
                </div>
              </div>

              <div className="space-y-3">
                {unifiedHistory.filter((item) => {
                  const searchStr = historySearch.toLowerCase();
                  return (
                    item.name.toLowerCase().includes(searchStr) ||
                    (item.nim && item.nim.toLowerCase().includes(searchStr)) ||
                    (item.id && item.id.toLowerCase().includes(searchStr))
                  );
                }).length > 0 ? (
                  <div className="space-y-4">
                    {unifiedHistory
                      .filter((item) => {
                        const searchStr = historySearch.toLowerCase();
                        return (
                          item.name.toLowerCase().includes(searchStr) ||
                          (item.nim &&
                            item.nim.toLowerCase().includes(searchStr)) ||
                          (item.id && item.id.toLowerCase().includes(searchStr))
                        );
                      })
                      .map((item) => (
                        <div
                          key={item.id}
                          onClick={() =>
                            setExpandedHistory(
                              expandedHistory === item.id ? null : item.id,
                            )
                          }
                          className={cn(
                            "bg-white border border-slate-100 p-4 rounded-lg hover:bg-slate-50/50 transition-all cursor-pointer overflow-hidden shadow-[0_1px_2px_rgba(0,0,0,0.02)]",
                            expandedHistory === item.id
                              ? "bg-slate-50/80 ring-1 ring-slate-100 shadow-sm"
                              : "",
                          )}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div
                                className={cn(
                                  "flex items-center justify-center shrink-0",
                                  item.type === "in"
                                    ? "text-green-500"
                                    : "text-red-500",
                                )}
                              >
                                {item.type === "in" ? (
                                  <ArrowUpRight size={18} strokeWidth={3} />
                                ) : (
                                  <ArrowDownLeft size={18} strokeWidth={3} />
                                )}
                              </div>
                              <p className="text-[10px] font-black text-slate-900 uppercase tracking-tight truncate max-w-[120px]">
                                {item.name}
                              </p>
                            </div>

                            <div className="text-right flex flex-col items-end gap-1">
                              <p
                                className={cn(
                                  "text-xs font-black tracking-tighter leading-none whitespace-nowrap",
                                  item.type === "in"
                                    ? "text-green-600"
                                    : "text-red-600",
                                )}
                              >
                                {item.type === "in" ? "+" : "-"} Rp{" "}
                                {((item as any).added && (item as any).added > 0
                                  ? (item as any).added
                                  : item.amount
                                ).toLocaleString("id-ID")}
                              </p>
                              <div className="flex flex-col items-end">
                                <span className="text-[6px] font-bold text-slate-400/80 uppercase tracking-widest leading-none mb-0.5">
                                  {formatFullDateTime(item.timestamp)}
                                </span>
                                <p className="text-[6px] font-black text-slate-300 uppercase tracking-widest leading-none">
                                  {item.type === "in"
                                    ? item.nim !== "-"
                                      ? item.nim
                                      : "UMUM"
                                    : "ORGANISASI"}
                                </p>
                              </div>
                            </div>
                          </div>

                          {expandedHistory === item.id && (
                            <div className="mt-4 pt-4 border-t border-slate-100 w-full">
                              {item.type === "in" ? (
                                <div className="flex items-center justify-between px-1">
                                  <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none">
                                    Total Iuran
                                  </p>
                                  <p className="text-[10px] font-black text-slate-700 tracking-tight leading-none">
                                    Rp {item.amount.toLocaleString("id-ID")}
                                  </p>
                                </div>
                              ) : (
                                <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none text-center italic">
                                  Detail Pengeluaran Organisasi
                                </p>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                  </div>
                ) : (
                  <div className="p-20 text-center space-y-3">
                    <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mx-auto">
                      <Search size={20} className="text-slate-200" />
                    </div>
                    <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em]">
                      Tidak ada transaksi ditemukan
                    </p>
                  </div>
                )}
              </div>
            </div>
          ) : view === "expenses" ? (
            <div
              className="space-y-6"
            >
              <div className="flex flex-col gap-6">
                <button
                  onClick={() => setView("overview")}
                  className="w-fit p-1 text-slate-400 hover:text-slate-900 transition-all flex items-center gap-1 group"
                >
                  <ArrowLeft
                    size={18}
                    className="group-hover:-translate-x-1 transition-transform"
                  />
                  <span className="text-[10px] font-black uppercase tracking-widest">
                    Kembali
                  </span>
                </button>

                <div className="space-y-1">
                  <h2 className="text-3xl font-black text-slate-900 uppercase leading-none tracking-tighter italic">
                    Rincian Pengeluaran
                  </h2>
                  <p className="text-[9px] text-slate-400 font-bold uppercase tracking-[0.3em]">
                    Alokasi Dana Kas Terpakai
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                {kasExpenses.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {kasExpenses.map((exp) => (
                      <div
                        key={exp.id}
                        className="bg-white border border-slate-100 rounded-lg p-4 shadow-sm hover:border-red-400 transition-all group flex flex-col justify-between"
                      >
                        <div className="flex justify-between items-start mb-4">
                          <div className="p-2 rounded-lg bg-red-50 text-red-500">
                            <ArrowDownLeft size={14} />
                          </div>
                          <div className="text-right">
                            <p className="text-[13px] font-black tracking-tighter leading-none mb-1 text-red-600">
                              - Rp{" "}
                              {Number(exp.nominal || 0).toLocaleString("id-ID")}
                            </p>
                            <span className="text-[7px] font-black text-slate-300 uppercase tracking-widest block">
                              {exp.tanggal || 1} {exp.bulan} {exp.tahun}
                            </span>
                          </div>
                        </div>

                        <div className="mt-auto">
                          <p className="text-[10px] font-black text-slate-800 uppercase line-clamp-2 min-h-[30px] mb-2 leading-tight">
                            {exp.item || exp.keterangan || "Pengeluaran"}
                          </p>
                          <div className="flex items-center justify-between border-t border-slate-50 pt-2">
                            <span className="text-[7px] font-bold text-slate-400 tracking-widest uppercase">
                              Organisasi
                            </span>
                            {exp.kategori && (
                              <span className="text-[7px] font-black uppercase px-1.5 py-0.5 rounded-full text-red-600 bg-red-50">
                                {exp.kategori}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-20 text-center space-y-3 bg-white border border-slate-100 rounded-2xl shadow-xl">
                    <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mx-auto">
                      <ArrowDownLeft size={20} className="text-slate-200" />
                    </div>
                    <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em]">
                      Belum ada data pengeluaran terdaftar
                    </p>
                    <p className="text-[8px] text-slate-400 font-bold uppercase">
                      Data ini dikelola oleh bendahara pusat
                    </p>
                  </div>
                )}
              </div>
            </div>
          ) : view === "pay" ? (
            sensorSisaTagihan ? (
              <div
                className="max-w-md mx-auto text-center bg-white border border-slate-100 p-8 rounded-2xl shadow-xl flex flex-col items-center justify-center my-12"
              >
                <img 
                  src="https://cdn-icons-gif.flaticon.com/18545/18545472.gif" 
                  alt="locked" 
                  className="w-20 h-20 mb-6"
                />
                
                <h3 className="text-sm font-black text-slate-900 tracking-tight mb-2 uppercase font-sans">
                  Pembayaran Ditutup Sementara
                </h3>
                
                <p className="text-[10px] text-slate-500 mb-8 leading-relaxed max-w-sm mx-auto font-medium">
                  Sistem pembayaran iuran kas sedang ditangguhkan secara realtime karena proses singkronisasi database keuangan angkatan dengan spreadsheet sedang berlangsung.
                </p>

                <div className="w-full max-w-xs space-y-4">
                  <button
                    onClick={() => setView("overview")}
                    className="w-full py-3.5 bg-slate-900 text-white rounded-md font-bold tracking-widest text-[10px] flex items-center justify-center gap-2 hover:bg-slate-800 transition-all active:scale-[0.98] shadow-xl shadow-black/10 uppercase cursor-pointer"
                  >
                    Kembali
                  </button>
                  
                  <span className="text-[9px] text-slate-400 font-bold tracking-wider uppercase text-center block">
                    Menutup otomatis dalam {payLockCountdown} detik...
                  </span>
                </div>
              </div>
            ) : (
              <div
                className="max-w-md md:max-w-5xl mx-auto"
              >
              <div className="bg-white border border-slate-100 rounded-2xl shadow-2xl overflow-hidden mb-12">
                <div className="bg-slate-900 p-8 text-white relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-amber-500/20 via-transparent to-slate-900/50 pointer-events-none" />
                  <div className="absolute -right-4 -top-4 w-24 h-24 bg-amber-500/10 rounded-full blur-2xl" />
                  
                  <button
                    onClick={() => setView("overview")}
                    className="relative z-10 text-white/40 hover:text-white flex items-center gap-2 mb-6 transition-colors"
                  >
                    <ArrowLeft size={14} />
                    <span className="text-[9px] font-black uppercase tracking-widest">
                      Batalkan
                    </span>
                  </button>
                  <div className="relative z-10">
                    <h2 className="text-2xl font-black tracking-tight uppercase text-amber-500">
                      Form Iuran Anggota
                    </h2>
                    <p className="text-[10px] text-white/50 font-bold uppercase tracking-widest mt-1">
                      Lengkapi data untuk bayar kas
                    </p>
                  </div>
                </div>
                <div className="p-6 space-y-8 md:space-y-0 md:grid md:grid-cols-2 md:gap-12 items-start">
                  {/* Left Column: Identifikasi & QRIS */}
                  <div className="space-y-8">
                    <div className="space-y-6">
                      {/* 1. Nama / NIM */}
                      <div className="space-y-2">
                        <div className="flex justify-between items-end">
                          <label className="text-[10px] font-bold text-slate-500 tracking-wide leading-none">
                            1. Nama / NIM Konfirmasi
                          </label>
                          {selectedMember && (
                            <div className="text-right">
                              <p className="text-[8px] font-bold text-red-500 leading-none">
                                Tunggakan: Rp {getMemberArrears(selectedMember).tunggakan.toLocaleString("id-ID")}
                              </p>
                            </div>
                          )}
                        </div>
                        <div className="relative">
                          {currentUser && !isAdmin ? (
                            <Lock size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-300" />
                          ) : (
                            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-300" size={14} />
                          )}
                          <input
                            type="text"
                            placeholder="Ketik nama anda..."
                            value={searchMember}
                            onChange={(e) => {
                              if (!currentUser || isAdmin) {
                                setSearchMember(e.target.value);
                                setSelectedMember(null);
                                setAiResult(null);
                                setProofFile(null);
                              }
                            }}
                            disabled={!!currentUser && !isAdmin}
                            className="w-full py-3.5 pl-10 pr-4 bg-slate-50 border border-slate-100 rounded-xl font-bold text-slate-700 outline-none text-xs focus:border-amber-400 transition-all focus:bg-white disabled:opacity-75"
                          />
                        </div>
                        {searchMember && !selectedMember && (!currentUser || isAdmin) && (
                          <div className="absolute left-6 right-6 border border-slate-200 rounded-xl bg-white shadow-2xl max-h-48 overflow-y-auto p-1 z-50">
                            {filteredMembers.map((m) => (
                              <button
                                key={m.nim}
                                onClick={() => {
                                  setSelectedMember({ name: m.name, nim: m.nim });
                                  setSearchMember(m.name);
                                  setAmount("0");
                                  setAiResult(null);
                                  setProofFile(null);
                                }}
                                className="w-full text-left p-3 text-[10px] font-bold text-slate-600 hover:bg-amber-50 hover:text-amber-600 rounded-lg transition-all flex justify-between"
                              >
                                <span>{m.name}</span>
                                <span className="opacity-40">{m.nim}</span>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* 2. Nominal */}
                      <div className="space-y-4">
                        <label className="text-[10px] font-bold text-slate-500 tracking-wide leading-none">
                          2. Masukan Nominal Pembayaran
                        </label>
                        {selectedMember && getMemberArrears(selectedMember).tunggakan === 0 ? (
                          <div className="p-4 bg-slate-50 rounded-2xl border-2 border-slate-100 flex items-center gap-3">
                            <CheckCircle size={16} className="text-green-600" />
                            <p className="text-[10px] font-bold text-slate-500 tracking-tight">Tunggakan Lunas!</p>
                          </div>
                        ) : (
                          <div className="relative p-1 rounded-2xl border-2 transition-all bg-white border-slate-100 focus-within:border-amber-400">
                            <div className="flex items-center px-4 py-3">
                              <div className="flex flex-col w-full">
                                <span className="text-[8px] font-bold text-slate-400 leading-none mb-1">Jumlah Iuran</span>
                                <div className="flex items-center gap-1">
                                  <span className="text-sm font-bold text-slate-400">Rp</span>
                                  <input
                                    type="text"
                                    disabled={!selectedMember}
                                    placeholder="0"
                                    value={amount}
                                    onChange={(e) => {
                                      handleNominalChange(e);
                                      setAiResult(null);
                                      setProofFile(null);
                                    }}
                                    className="bg-transparent border-none text-left font-bold text-slate-800 text-lg outline-none w-full"
                                  />
                                </div>
                              </div>
                            </div>
                            <div className="px-4 pb-3 flex flex-col gap-2 border-t border-slate-50 pt-3 mt-1">
                              <div className="flex items-center justify-between">
                                <span className="text-[8px] font-medium text-slate-400 tracking-wide">Sisa Tunggakan</span>
                                <span className={cn("text-[9px] font-bold", getSisaTunggakan() === 0 ? "text-green-500" : "text-red-500")}>
                                  {getSisaTunggakan() === 0 ? "Lunas" : `Rp ${getSisaTunggakan().toLocaleString("id-ID")}`}
                                </span>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* 3. QRIS */}
                      <div className="space-y-4 pt-4 border-t border-slate-100">
                        <label className="text-[10px] font-bold text-slate-500 tracking-wide leading-none">
                          3. Scan QRIS Vektorion
                        </label>
                        <div className="relative max-w-[180px] mx-auto">
                          {(qrisLoading || !selectedMember || Number(getCleanNominal(amount)) < 999) && (
                            <div
                              className="absolute inset-0 bg-white flex flex-col items-center justify-center z-10 rounded-2xl border border-slate-100"
                            >
                              {qrisLoading ? (
                                <div className="w-8 h-8 border-4 border-amber-500/20 border-t-amber-500 rounded-full animate-spin" />
                              ) : (
                                <div className="text-center px-4">
                                  <div className="w-10 h-10 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-2 border border-slate-100">
                                    <Lock size={16} className="text-slate-300" />
                                  </div>
                                  <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-tight">Input Nama & Nominal</p>
                                </div>
                              )}
                            </div>
                          )}
                          <div className="p-3 border-2 border-slate-100 rounded-2xl bg-white shadow-inner">
                            <OptimizedImage src={QRIS_URL} alt="QRIS" className="w-full h-auto rounded-xl" fallbackClassName="bg-slate-50" />
                          </div>
                          <button
                            onClick={handleDownloadQRIS}
                            disabled={!selectedMember || Number(getCleanNominal(amount)) < 999 || qrisLoading}
                            className="mt-3 flex items-center gap-2 mx-auto px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-[8px] font-black uppercase tracking-widest transition-all disabled:opacity-30"
                          >
                            <Download size={12} /> Simpan QRIS
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Rules & Upload Proof */}
                  <div className="space-y-8 md:pt-0 pt-6">
                    {/* Rules Box */}
                    <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100 space-y-4">
                      <div className="flex items-center gap-2">
                        <Info size={14} className="text-amber-500" />
                        <h4 className="text-[9px] font-black text-slate-700 uppercase tracking-widest">Instruksi & Aturan</h4>
                      </div>
                      <div className="space-y-2.5">
                        {[
                          "Pastikan nominal sesuai dengan struk.",
                          "Gunakan nama asli sesuai database.",
                          "Unggah struk yang terang & lengkap.",
                          "Hanya bukti transfer QRIS/M-Banking."
                        ].map((rule, i) => (
                          <div key={i} className="flex gap-2">
                            <span className="text-[8px] font-black text-amber-500">{i + 1}.</span>
                            <p className="text-[8px] font-bold text-slate-500 uppercase tracking-tight">{rule}</p>
                          </div>
                        ))}
                      </div>
                      {selectedMember && Number(getCleanNominal(amount)) >= 999 && (
                        <div className="pt-3 border-t border-slate-200">
                          <p className="text-[9px] font-black text-slate-900 uppercase">
                            Total: <span className="text-green-600">Rp {Number(getCleanNominal(amount)).toLocaleString("id-ID")}</span>
                          </p>
                        </div>
                      )}
                    </div>

                    {/* 4. Upload Section */}
                    <div className="space-y-4">
                      <label className="text-[10px] font-bold text-slate-500 tracking-wide leading-none">
                        4. Upload Bukti Bayar
                      </label>

                      {aiResult && !aiResult.valid ? (
                        <div
                          className="bg-red-50 border-2 border-red-100 rounded-2xl p-8 text-center space-y-6"
                        >
                          <div className="space-y-3">
                            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto text-red-600 shadow-sm">
                              <XCircle size={24} />
                            </div>
                            <div className="space-y-1">
                              <p className="text-xs font-bold text-red-800 tracking-wide">Pengecekan gagal</p>
                              <p className="text-[9px] font-medium text-red-400">Wah, bukti kamu tidak valid atau tidak sesuai</p>
                            </div>
                          </div>
                          <div className="space-y-3">
                            <a
                              href={`https://wa.me/6281539381486?text=Halo%20Bendahara%2C%20saya%20ingin%20lapor%20pembayaran%20kas%20secara%20manual.%20Nama%3A%20${selectedMember?.name}%20(%20${selectedMember?.nim}%20)%2C%20Nominal%3A%20Rp%20${amount}`}
                              target="_blank"
                              rel="noreferrer"
                              className="w-full flex items-center justify-center gap-2 py-4 bg-[#25D366] hover:bg-[#128C7E] text-white rounded-xl text-[9px] font-black uppercase tracking-widest transition-all shadow-lg shadow-green-500/10"
                            >
                              <WhatsAppIcon size={16} /> Hubungi Bendahara (WA)
                            </a>
                            <button
                              onClick={() => { setAiResult(null); setProofFile(null); }}
                              className="text-[8px] font-black text-slate-400 uppercase tracking-widest hover:text-slate-600 p-2"
                            >
                              Coba Upload Ulang
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div
                          className={cn(
                            "relative border-2 border-dashed rounded-2xl p-10 flex flex-col items-center justify-center text-center transition-all min-h-[180px]",
                            !selectedMember || Number(getCleanNominal(amount)) < 999
                              ? "bg-slate-50 border-slate-100 opacity-50"
                              : proofFile
                                ? "bg-green-50/10 border-green-500/30"
                                : "bg-slate-50 border-slate-200 hover:border-amber-400 cursor-pointer",
                          )}
                        >
                          <input
                            type="file"
                            accept="image/png, image/jpeg, image/jpg"
                            className="absolute inset-0 opacity-0 cursor-pointer disabled:cursor-not-allowed"
                            onChange={handleFileChange}
                            disabled={isCheckingAI || !selectedMember || Number(getCleanNominal(amount)) < 999}
                          />
                          {proofFile ? (
                            <div className="w-full space-y-4">
                              <div className="flex items-center justify-center gap-3">
                                <OptimizedImage 
                                  src={URL.createObjectURL(proofFile)} 
                                  alt="Preview" 
                                  className="w-12 h-12 rounded-xl border border-white shadow-sm" 
                                  fallbackClassName="bg-slate-100"
                                />
                                <div className="text-left">
                                  <p className="text-[9px] font-black text-slate-700 truncate max-w-[120px] uppercase leading-none mb-1">{proofFile.name}</p>
                                  <p className="text-[8px] text-slate-400 font-bold uppercase">{(proofFile.size / 1024 / 1024).toFixed(2)} MB</p>
                                </div>
                              </div>
                              {isCheckingAI && (
                                <div className="flex items-center justify-center gap-2 text-amber-600 animate-pulse">
                                  <Loader2 className="animate-spin" size={12} />
                                  <span className="text-[8px] font-bold tracking-widest text-amber-700">
                                    {Math.floor(Date.now() / 2500) % 5 === 0 ? "Membaca teks struk..." : 
                                     Math.floor(Date.now() / 2500) % 5 === 1 ? "Mencocokkan nominal..." :
                                     Math.floor(Date.now() / 2500) % 5 === 2 ? "Validasi rekening..." :
                                     Math.floor(Date.now() / 2500) % 5 === 3 ? "Mengidentifikasi struk..." : "Menyelesaikan verifikasi..."}
                                  </span>
                                </div>
                              )}
                            </div>
                          ) : (
                            <>
                              <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center mb-3 shadow-sm border border-slate-100">
                                <Upload size={18} className="text-slate-400" />
                              </div>
                              <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Pilih Bukti Transfer</p>
                              <p className="text-[7px] text-slate-400 mt-1 uppercase">Klik atau Drag Image</p>
                            </>
                          )}
                        </div>
                      )}

                      <button
                        disabled={!proofFile || isCheckingAI || (aiResult && !aiResult.valid)}
                        onClick={async () => {
                          if (selectedMember) {
                            try {
                              const valAmount = Number(getCleanNominal(amount));
                              await addDoc(collection(db, "v2_kas_transactions"), {
                                name: selectedMember.name,
                                nim: selectedMember.nim,
                                amount: valAmount,
                                date: new Date().toLocaleDateString("id-ID", { day: "2-digit", month: "long", year: "numeric" }),
                                time: new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }),
                                tag: `Kas ${selectedMonth}`,
                                status: "pending",
                                proofUrl: "https://res.cloudinary.com/dew39kqhy/image/upload/v1778158915/IMG-20260507-WA0038_im6dgy.jpg",
                                createdAt: serverTimestamp(),
                              });

                              // Dispatch real-time PWA notification
                              try {
                                await sendMulticastNotification(
                                  `Iuran Kas Masuk: ${selectedMember.name}`,
                                  `Mengirimkan pembayaran kas sebesar Rp ${valAmount.toLocaleString("id-ID")} untuk tagihan ${selectedMonth}. Menunggu verifikasi Bendahara.`,
                                  'kas',
                                  selectedMember.name,
                                  '/bendahara'
                                );
                              } catch (err) {
                                console.error("Failed to send kas PWA notification:", err);
                              }

                              alert("Data kas terkirim!");

                            } catch (error) {
                              handleFirestoreError(error, OperationType.CREATE, "v2_kas_transactions");
                            }
                          }
                          setView("overview");
                          resetForm();
                        }}
                        className={cn(
                          "w-full py-4 rounded-xl font-bold uppercase tracking-[0.1em] text-[10px] shadow-xl flex items-center justify-center gap-3 transition-all active:scale-95",
                          "bg-slate-900 text-white disabled:bg-slate-200 disabled:text-slate-400 disabled:shadow-none",
                        )}
                      >
                        {isCheckingAI ? "Menunggu Verifikasi" : (aiResult && !aiResult.valid ? "Bukti Bermasalah" : "Kirim Sekarang")}
                        {!isCheckingAI && <CheckCircle size={16} />}
                      </button>
                    </div>
                  </div>
                </div>
                </div>
              </div>
            )
          ) : (
            <div
              className="space-y-4 pb-20"
            >
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setView("overview")}
                  className="p-2.5 bg-white border border-slate-100 text-slate-400 hover:text-amber-500 rounded-sm transition-all shadow-sm group"
                >
                  <ArrowLeft
                    size={20}
                    className="group-hover:-translate-x-1 transition-transform"
                  />
                </button>
                <div>
                  <h2 className="text-xl font-black text-slate-900 uppercase leading-none">
                    Daftar Status Iuran
                  </h2>
                  <p className="text-[8px] text-slate-400 font-bold uppercase tracking-[0.2em] mt-1">
                    Cek riwayat pembayaran anggota
                  </p>
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex flex-col md:flex-row gap-2">
                  <div className="flex-1 bg-amber-500 rounded-sm p-4 text-white shadow-lg shadow-amber-500/10">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-80 mb-1">
                          Periode Pembayaran
                        </p>
                        <h3 className="text-xl font-black tracking-tight uppercase">
                          {selectedMonth} {selectedYear}
                        </h3>
                      </div>
                      <div className="bg-white/20 p-2 rounded-sm">
                        <Calendar size={24} />
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <div className="flex-1 bg-white border border-slate-200 rounded-sm flex items-center shadow-md min-w-[140px] h-16">
                      <div className="pl-4 py-1 border-r border-slate-100 font-black text-[10px] text-amber-500 uppercase shrink-0">
                        Bulan
                      </div>
                      <select
                        value={selectedMonth}
                        onChange={(e) => setSelectedMonth(e.target.value)}
                        className="bg-transparent border-none text-[10px] font-black uppercase tracking-[0.2em] px-4 w-full h-full text-slate-700 outline-none cursor-pointer"
                      >
                        {MONTHS.map((m) => (
                          <option key={m} value={m}>
                            {m.slice(0, 3)}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="bg-white border border-slate-200 rounded-sm flex items-center shadow-md w-24 h-16">
                      <select
                        value={selectedYear}
                        onChange={(e) => setSelectedYear(e.target.value)}
                        className="bg-transparent border-none text-[10px] font-black uppercase tracking-[0.2em] px-3 w-full h-full text-slate-700 outline-none cursor-pointer text-center"
                      >
                        {YEARS.map((y) => (
                          <option key={y} value={y}>
                            {y}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                <div className="bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden">
                  <div className="p-4 border-b border-slate-100 bg-slate-50/30 flex items-center gap-4 h-14">
                    <Search size={16} className="text-slate-300" />
                    <input
                      type="text"
                      placeholder="Cari nama atau NIM..."
                      className="bg-transparent border-none text-[10px] font-black uppercase tracking-widest text-slate-700 outline-none w-full"
                      value={searchMember}
                      onChange={(e) => setSearchMember(e.target.value)}
                    />
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-center">
                      <thead>
                        <tr className="bg-slate-50 text-[9px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
                          <th className="px-6 py-4 text-left">Mahasiswa</th>
                          <th className="px-3 py-4">
                            Progres {selectedMonth} {selectedYear}
                          </th>
                          <th className="px-6 py-4 text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {MEMBERS_DATA.filter(
                          (m) =>
                            (m.name || "")
                              .toLowerCase()
                              .includes((searchMember || "").toLowerCase()) ||
                            (m.nim || "").includes(searchMember || ""),
                        ).map((member) => {
                          const currentFeePerWeek =
                            selectedYear === "2026" &&
                            MONTHS.indexOf(selectedMonth) < 4
                              ? 5000
                              : 2000;
                          const monthlyTarget = currentFeePerWeek * 4;
                          const paid = getMemberProgress(
                            member,
                            selectedMonth,
                            selectedYear,
                          );
                          const isLunas = paid >= monthlyTarget;
                          const monthIdx = MONTHS.indexOf(selectedMonth);
                          const selectedYearInt = parseInt(selectedYear);
                          const now = new Date();
                          const isFuture =
                            selectedYearInt > now.getFullYear() ||
                            (selectedYearInt === now.getFullYear() &&
                              monthIdx > now.getMonth());

                          return (
                            <tr
                              key={member.nim}
                              className="hover:bg-amber-50/30 transition-all group"
                            >
                              <td className="px-6 py-4 text-left">
                                <p className="text-xs font-black text-slate-800">
                                  {member.name}
                                </p>
                                <p className="text-[8px] text-slate-400 font-bold mt-0.5 tracking-widest">
                                  {member.nim}
                                </p>
                              </td>
                              <td className="px-3 py-4 text-center">
                                <div className="flex flex-col items-center max-w-[120px] mx-auto">
                                  <span
                                    className={cn(
                                      "text-[9px] font-black",
                                      isLunas
                                        ? "text-green-600"
                                        : "text-slate-500",
                                    )}
                                  >
                                    {isFuture
                                      ? "Belum Tersedia"
                                      : `Rp ${paid.toLocaleString("id-ID")} / ${monthlyTarget / 1000}k`}
                                  </span>
                                </div>
                              </td>
                              <td className="px-6 py-4 text-right">
                                {(() => {
                                  const emailPart =
                                    currentUser?.email?.split("@")[0] || "";
                                  const parts = emailPart.split(".");
                                  const myNim =
                                    parts.length > 1
                                      ? parts[1].toUpperCase()
                                      : parts[0].toUpperCase();
                                  const isMe =
                                    member.nim === myNim ||
                                    member.name.toLowerCase() ===
                                      currentUser?.displayName?.toLowerCase();

                                  if (isMe) {
                                    return (
                                      <button
                                        disabled={isLunas || isFuture}
                                        onClick={() => {
                                          setSearchMember(member.name);
                                          setSelectedMember({
                                            name: member.name,
                                            nim: member.nim,
                                          });
                                          setView("pay");
                                        }}
                                        className={cn(
                                          "text-[8px] font-black uppercase border rounded-lg px-3 py-1.5 transition-all active:scale-95",
                                          isLunas
                                            ? "bg-green-50 text-green-600 border-green-100"
                                            : isFuture
                                              ? "bg-slate-50 text-slate-300 border-slate-100"
                                              : "bg-red-50 text-red-600 border-red-100 hover:bg-red-600 hover:text-white",
                                        )}
                                      >
                                        {isLunas
                                          ? "Lunas"
                                          : isFuture
                                            ? "Wait"
                                            : "Bayar"}
                                      </button>
                                    );
                                  } else {
                                    return (
                                      <div
                                        className={cn(
                                          "text-[8px] font-black uppercase px-3 py-1.5 rounded-lg border inline-block",
                                          isLunas
                                            ? "bg-green-50 text-green-600 border-green-100"
                                            : "bg-slate-50 text-slate-400 border-slate-100",
                                        )}
                                      >
                                        {isLunas ? "Verified" : "Belum Bayar"}
                                      </div>
                                    );
                                  }
                                })()}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          )}

        <footer className="mt-20 py-10 border-t border-slate-50 flex flex-col items-center gap-2 opacity-30">
          <img src={LOGO_URL} alt="Vektorion" className="w-5 h-5 grayscale" />
          <p className="text-[8px] font-black uppercase tracking-widest text-slate-800">
            Vektorion Treasury
          </p>
          <p className="text-[7px] font-bold text-slate-400 tracking-widest">
            © 2026
          </p>
        </footer>
      </div>

      {/* Transaction Receipt Modal */}
      {showReceipt && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 overflow-y-auto">
          <div
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-md"
            onClick={() => {
              setShowReceipt(null);
              setIsZoomed(false);
            }}
          />
          <div
            ref={receiptRef}
            className="relative w-full max-w-sm bg-white rounded-2xl shadow-2xl overflow-visible my-8"
          >
              {/* Close Button - Hidden in download */}
              {!isDownloading && (
                <button
                  onClick={() => setShowReceipt(null)}
                  className="absolute -top-3 -right-3 w-8 h-8 bg-slate-900 text-white rounded-full flex items-center justify-center shadow-xl z-50 hover:bg-amber-500 transition-colors"
                >
                  <XCircle size={18} />
                </button>
              )}
              {/* Texture Background */}
              <div
                className="absolute inset-0 pointer-events-none opacity-[0.03] z-0"
                style={{
                  backgroundImage: `url(${LOGO_URL})`,
                  backgroundSize: "150px",
                  backgroundRepeat: "repeat",
                  backgroundPosition: "center",
                }}
              />

              {/* Receipt Header */}
              <div className="p-6 bg-slate-900 text-white text-center rounded-b-3xl relative z-10">
                <div className="w-12 h-12 bg-transparent mx-auto flex items-center justify-center mb-4">
                  <img
                    src={LOGO_URL}
                    alt="Logo"
                    className="w-8 h-8 opacity-60"
                  />
                </div>
                <h3 className="text-sm font-black uppercase tracking-widest text-amber-500">
                  Struk Transaski Kas
                </h3>
                <p className="text-[8px] text-white/50 font-bold mt-1 uppercase tracking-widest">
                  #{showReceipt.id} • Vektorion 22
                </p>
              </div>

              <div className="p-6 space-y-6 relative z-10">
                {/* Details */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-4">
                    <div>
                      <p className="text-[7px] font-black text-slate-300 uppercase mb-1">
                        Pengirim
                      </p>
                      <p className="text-[10px] font-black text-slate-800 uppercase">
                        {showReceipt.name}
                      </p>
                      <p className="text-[8px] font-bold text-slate-400">
                        {showReceipt.nim}
                      </p>
                    </div>
                    <div>
                      <p className="text-[7px] font-black text-slate-300 uppercase mb-1">
                        Nominal
                      </p>
                      <p className="text-base font-black text-slate-900 tracking-tight leading-none">
                        Rp {showReceipt.amount.toLocaleString("id-ID")}
                      </p>
                    </div>
                  </div>
                  <div className="text-right space-y-4">
                    <div>
                      <p className="text-[7px] font-black text-slate-300 uppercase mb-1">
                        Waktu
                      </p>
                      <p className="text-[10px] font-black text-slate-800 uppercase">
                        {showReceipt.date}
                      </p>
                      <p className="text-[8px] font-bold text-slate-400">
                        {showReceipt.time} WIB
                      </p>
                    </div>
                    <div className="flex flex-col items-end">
                      <p className="text-[7px] font-black text-slate-300 uppercase mb-1">
                        Status
                      </p>
                      <div className="flex flex-col gap-1 items-end">
                        <div
                          className={cn(
                            "inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[7px] font-black uppercase",
                            showReceipt.status === "verified"
                              ? "bg-green-100 text-green-700"
                              : showReceipt.status === "suspicious"
                                ? "bg-amber-100 text-amber-500"
                                : "bg-slate-100 text-slate-700",
                          )}
                        >
                          {showReceipt.status === "verified" ? (
                            <CheckCircle size={10} />
                          ) : showReceipt.status === "suspicious" ? (
                            <AlertCircle size={10} />
                          ) : (
                            <Clock size={10} />
                          )}
                          {showReceipt.status}
                        </div>
                        {isAdmin && showReceipt.status !== "verified" && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleUpdateStatus(showReceipt.id, "verified");
                            }}
                            className="text-[6px] font-black text-green-600 uppercase border border-green-200 px-2 py-0.5 rounded bg-green-50 hover:bg-green-600 hover:text-white transition-colors"
                          >
                            Verifikasi Sekarang
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100">
                  <p className="text-[7px] font-black text-slate-300 uppercase mb-1 tracking-widest">
                    Keterangan
                  </p>
                  <p className="text-[10px] font-black text-slate-700 uppercase">
                    {showReceipt.tag}
                  </p>
                </div>

                {/* Collapsible Details */}
                <div className="pt-4 border-t border-slate-100">
                  {!isDownloading && (
                    <button
                      onClick={() => setIsExpanded(!isExpanded)}
                      className="w-full flex items-center justify-between py-2 text-[8px] font-black text-amber-600 uppercase tracking-widest"
                    >
                      <span>
                        {isExpanded
                          ? "Sembunyikan Detail"
                          : "Lihat Detail Lengkap"}
                      </span>
                      <div className="transition-transform duration-300" style={{ transform: isExpanded ? 'rotate(180deg)' : 'none' }}>
                        <Plus size={10} />
                      </div>
                    </button>
                  )}

                  {isExpanded && (
                    <div
                      className="overflow-hidden space-y-6 pt-4"
                    >
                        {/* Photo Proof */}
                        {showReceipt.proofUrl && (
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <span className="text-[7px] font-black text-slate-300 uppercase tracking-widest">
                                Bukti Pembayaran
                              </span>
                              {showReceipt.status === "suspicious" && (
                                <span className="text-[7px] font-black text-amber-500 uppercase flex items-center gap-1 italic">
                                  <AlertCircle size={10} />{" "}
                                  {showReceipt.warning || "Mencurigakan"}
                                </span>
                              )}
                            </div>
                            <div
                              className="relative group cursor-pointer"
                              onClick={() => setIsZoomed(!isZoomed)}
                            >
                              <OptimizedImage
                                src={showReceipt.proofUrl}
                                alt="Bukti"
                                className={cn(
                                  "w-full rounded-xl border border-slate-100 transition-all duration-500 shadow-sm",
                                  isZoomed
                                    ? "h-auto max-h-[400px] object-contain"
                                    : "h-24 object-cover",
                                )}
                                fallbackClassName="bg-slate-50 h-24"
                              />
                              {!isZoomed && (
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-xl backdrop-blur-[2px]">
                                  <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-full text-[8px] font-black uppercase shadow-xl">
                                    <Maximize2 size={12} /> Klik untuk Zoom
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        <div className="pt-2 flex flex-col items-center">
                          {!isDownloading && (
                            <button
                              onClick={handleDownloadReceipt}
                              disabled={isDownloading}
                              className="text-[8px] font-black text-slate-300 hover:text-amber-500 uppercase tracking-widest flex items-center gap-1.5 transition-colors disabled:opacity-50"
                            >
                              {isDownloading ? (
                                <Loader2 size={10} className="animate-spin" />
                              ) : (
                                <Download size={10} />
                              )}
                              Unduh Bukti Struk
                            </button>
                          )}

                          <div className="mt-6 text-center space-y-1 opacity-20 group">
                            <img
                              src={LOGO_URL}
                              alt="Footer Logo"
                              className="w-4 h-4 mx-auto grayscale"
                            />
                            <p className="text-[6px] font-black text-slate-900 uppercase tracking-[0.3em]">
                              Sistem Keuangan Otomatis Vektorion
                            </p>
                            <p className="text-[5px] font-medium text-slate-500 italic max-w-[200px] mx-auto">
                              "Kejujuran adalah pondasi utama solidaritas."
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                </div>
              </div>

              <div className="p-4 bg-slate-50 text-center">
                <button
                  onClick={() => {
                    setShowReceipt(null);
                    setIsZoomed(false);
                  }}
                  className="mb-4 text-[9px] font-bold text-slate-300 hover:text-slate-500 transition-colors uppercase tracking-widest"
                >
                  Kembali
                </button>
                <p className="text-[7px] font-bold text-slate-400 uppercase leading-relaxed">
                  Sistem Keuangan Otomatis Vektorion
                  <br />
                  Kejujuran adalah pondasi utama solidaritas.
                </p>
              </div>
            </div>
          </div>
        )}

      {/* Rules Modal */}
      {showRulesModal && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
            onClick={() => setShowRulesModal(false)}
          />
          <div
            className="relative w-full max-w-sm bg-white rounded-lg shadow-2xl overflow-hidden"
          >
              <div className="p-6 bg-slate-900 text-white flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-1">
                    <img src={LOGO_URL} alt="Vektorion" className="w-9 h-9 object-contain" />
                  </div>
                  <div>
                    <h3 className="text-xs font-black uppercase tracking-widest">Aturan Verifikasi</h3>
                    <p className="text-[8px] text-white/40 font-bold uppercase tracking-widest">Standar Pengecekan AI</p>
                  </div>
                </div>
                <button 
                  onClick={() => setShowRulesModal(false)}
                  className="p-2 hover:bg-white/10 rounded-full transition-colors"
                >
                  <X size={18} />
                </button>
              </div>
              
              <div className="p-6 space-y-6 max-h-[60vh] overflow-y-auto no-scrollbar">
                <div className="space-y-4">
                  <div className="flex gap-4">
                    <div className="flex-shrink-0 w-6 h-6 bg-slate-100 rounded-full flex items-center justify-center text-[10px] font-black text-slate-900">1</div>
                    <div className="space-y-1">
                      <p className="text-[9px] font-black text-slate-900 uppercase">Penerima Transaksi</p>
                      <p className="text-[9px] text-slate-500 leading-relaxed font-medium">Struk harus mencantumkan nama penerima <span className="text-slate-900 font-bold">"Relyleaf"</span>. Jika nama penerima tidak sesuai, sistem otomatis menolak.</p>
                    </div>
                  </div>
                  
                  <div className="flex gap-4">
                    <div className="flex-shrink-0 w-6 h-6 bg-slate-100 rounded-full flex items-center justify-center text-[10px] font-black text-slate-900">2</div>
                    <div className="space-y-1">
                      <p className="text-[9px] font-black text-slate-900 uppercase">Batas Waktu Transaksi</p>
                      <p className="text-[9px] text-slate-500 leading-relaxed font-medium">Waktu transaksi di struk maksimal <span className="text-slate-900 font-bold">3 Jam</span> dari waktu saat ini. Struk lama (hari sebelumnya) tidak akan diterima oleh AI.</p>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className="flex-shrink-0 w-6 h-6 bg-slate-100 rounded-full flex items-center justify-center text-[10px] font-black text-slate-900">3</div>
                    <div className="space-y-1">
                      <p className="text-[9px] font-black text-slate-900 uppercase">Nominal Pembayaran</p>
                      <p className="text-[9px] text-slate-500 leading-relaxed font-medium">Nominal di struk <span className="text-slate-900 font-bold">Wajib Sama</span> dengan nominal yang diinput di form. Jika berbeda Rp 1 pun, verifikasi akan gagal.</p>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className="flex-shrink-0 w-6 h-6 bg-slate-100 rounded-full flex items-center justify-center text-[10px] font-black text-slate-900">4</div>
                    <div className="space-y-1">
                      <p className="text-[9px] font-black text-slate-900 uppercase">Kualitas & Keaslian</p>
                      <p className="text-[9px] text-slate-500 leading-relaxed font-medium">Struk harus berupa screenshot resmi aplikasi Bank/E-Wallet (Bukan editan teks). Gambar harus <span className="text-slate-900 font-bold">Jelas dan Tidak Buram</span>.</p>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className="flex-shrink-0 w-6 h-6 bg-slate-100 rounded-full flex items-center justify-center text-[10px] font-black text-slate-900">5</div>
                    <div className="space-y-1">
                      <p className="text-[9px] font-black text-slate-900 uppercase">Batas Waktu Pengecekan</p>
                      <p className="text-[9px] text-slate-500 leading-relaxed font-medium">Proses pengecekan AI memiliki batas waktu <span className="text-slate-900 font-bold">15 Detik</span>. Jika jaringan lambat, sistem akan menyarankan verifikasi manual.</p>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100">
                  <p className="text-[8px] font-bold text-amber-900 leading-relaxed uppercase">
                    Jika verifikasi gagal terus menerus padahal struk sudah benar, silakan gunakan tombol <span className="font-black">"Hubungi Bendahara"</span> untuk pelaporan manual via WhatsApp.
                  </p>
                </div>
              </div>

              <div className="p-4 bg-slate-50">
                <button
                  onClick={() => setShowRulesModal(false)}
                  className="w-full py-4 bg-slate-900 text-white rounded-lg text-[10px] font-black uppercase tracking-widest shadow-lg active:scale-95 transition-all"
                >
                  Saya Mengerti
                </button>
              </div>
            </div>
          </div>
        )}
    </div>
      </div>
    </div>
    </MaintenanceGuard>
  );
}
