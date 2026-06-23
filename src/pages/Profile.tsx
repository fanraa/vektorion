import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import imageCompression from "browser-image-compression";
import {
  User,
  Pencil,
  Trash2,
  Lock,
  LogOut,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  ChevronDown,
  ChevronUp,
  Wallet,
  Image as ImageIcon,
  Moon,
  Sun,
  Settings,
  CreditCard,
  ArrowRight,
  Camera,
  MoreVertical,
  RotateCcw,
  Plus,
  Loader2,
  Mail,
  Activity,
  ShieldCheck,
  History,
  Key,
  Globe,
  Trash,
} from "lucide-react";

import { useAuth } from "../lib/AuthContext";
import { cn } from "../lib/utils";
import { db, handleFirestoreError, OperationType, auth } from "../lib/firebase";
import {
  collection,
  query,
  where,
  onSnapshot,
  orderBy,
  doc,
  setDoc,
  addDoc,
  deleteDoc,
  serverTimestamp,
  getDoc,
  updateDoc,
} from "firebase/firestore";
import { EmailAuthProvider, reauthenticateWithCredential } from "firebase/auth";
import { MEMBERS_DATA } from "../data/members";

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

const DEFAULT_HERO_IMG =
  "https://res.cloudinary.com/dew39kqhy/image/upload/v1778154506/IMG-20260426-WA0044_vacsll.jpg";
const DEFAULT_AGENDA_IMG =
  "https://res.cloudinary.com/dew39kqhy/image/upload/v1778154506/IMG-20260426-WA0044_vacsll.jpg";
const DEFAULT_FOOTER_IMG =
  "https://res.cloudinary.com/dew39kqhy/image/upload/v1778154506/IMG-20260426-WA0044_vacsll.jpg";

interface Transaction {
  id: string;
  name: string;
  nim: string;
  amount: number;
  date: string;
  time: string;
  tag: string;
  status: "verified" | "pending" | "suspicious" | "out";
}

import { ProfileSkeleton } from "../components/ui/Skeleton";
import { OptimizedImage } from "../components/ui/OptimizedImage";

export default function Profile() {
  const navigate = useNavigate();
  const { profile, user, logout, updateProfile, changePassword } = useAuth();
  const [isSecurityOpen, setIsSecurityOpen] = useState(false);
  const [isKasOpen, setIsKasOpen] = useState(false);
  const [isHomeBgOpen, setIsHomeBgOpen] = useState(false);
  const [activeBgTab, setActiveBgTab] = useState<1 | 2 | 3>(1);
  const [isOtherSettingsOpen, setIsOtherSettingsOpen] = useState(false);
  const [isPwaOpen, setIsPwaOpen] = useState(false);
  const [isDevSettingsOpen, setIsDevSettingsOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showPhotoMenu, setShowPhotoMenu] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(
    (window as any).deferredPWAEvent || null,
  );
  const [isInstallable, setIsInstallable] = useState(
    !!(window as any).deferredPWAEvent,
  );

  useEffect(() => {
    const handleReady = () => {
      setDeferredPrompt((window as any).deferredPWAEvent);
      setIsInstallable(true);
    };

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
    };

    window.addEventListener("pwa-installable-ready", handleReady);
    window.addEventListener(
      "beforeinstallprompt",
      handleBeforeInstallPrompt as any,
    );

    return () => {
      window.removeEventListener("pwa-installable-ready", handleReady);
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt as any,
      );
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`PWA installation outcome: ${outcome}`);
    setDeferredPrompt(null);
    setIsInstallable(false);
  };

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [kasMatrixData, setKasMatrixData] = useState<any>(null);
  const [isKasLoading, setIsKasLoading] = useState(true);

  // Background states
  const [bgAssets, setBgAssets] = useState<
    { id: string; url: string; name: string }[]
  >([]);
  const [currentBgs, setCurrentBgs] = useState({
    heroBg: DEFAULT_HERO_IMG,
    agendaBg: DEFAULT_AGENDA_IMG,
    footerBg: DEFAULT_FOOTER_IMG,
    heroSlideshow: false,
    heroInterval: 5,
    agendaSlideshow: false,
    agendaInterval: 5,
    footerSlideshow: false,
    footerInterval: 5,
  });
  const [uploadingBg, setUploadingBg] = useState(false);
  const [assetMenuOpen, setAssetMenuOpen] = useState<string | null>(null);
  const [bgUrlInput, setBgUrlInput] = useState("");

  // Dev Settings State
  const [sysSettings, setSysSettings] = useState({
    apiKeys: {} as Record<string, string>,
    lockedMenus: {} as Record<string, boolean>,
    sensorSisaTagihan: false,
    totalViews: 0,
  });
  const [sysLogs, setSysLogs] = useState<any[]>([]);
  const [apiKeyInput, setApiKeyInput] = useState("");
  const [apiKeyProvider, setApiKeyProvider] =
    useState<string>("Google (Gemini)");
  const [showKeyConfirm, setShowKeyConfirm] = useState<string | null>(null);

  const [testingKey, setTestingKey] = useState<string | null>(null);
  const [keyTestStatus, setKeyTestStatus] = useState<
    Record<string, "success" | "error" | null>
  >({});

  const [authForKeysOpen, setAuthForKeysOpen] = useState<{
    provider: string;
    action: "view" | "copy";
  } | null>(null);
  const [authForKeysPass, setAuthForKeysPass] = useState("");
  const [visibleKeys, setVisibleKeys] = useState<Record<string, boolean>>({});

  const [isUrlTab, setIsUrlTab] = useState(false);

  const [isDarkMode, setIsDarkMode] = useState(false);

  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

  const [toast, setToast] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const photoMenuRef = useRef<HTMLDivElement>(null);
  const [myStatus, setMyStatus] = useState<"normal" | "green" | "red">(
    "normal",
  );

  const getCleanNim = (rawNim: string) => {
    if (!rawNim) return "";
    const parts = rawNim.split(".");
    return parts.length > 1 ? parts[1].toUpperCase() : parts[0].toUpperCase();
  };

  const getDisplayNameFromEmail = (email: string) => {
    if (!email) return "";
    return email
      .split("@")[0]
      .replace(/[^a-zA-Z0-9]/g, "")
      .toUpperCase();
  };

  const displayProfile = {
    ...profile,
    name: profile?.name || user?.displayName || "IRFAN RIZKI ADITRI",
    nim:
      profile?.nim ||
      (user?.email ? getDisplayNameFromEmail(user.email) : "125110007"),
    photoURL: user?.photoURL || profile?.photoURL || null,
    position: profile?.position || "ANGGOTA",
    role: profile?.role || "MEMBER",
    isAdmin:
      profile?.isAdmin ||
      user?.email === "irfanrizkiaditribusiness@gmail.com" ||
      user?.email === "irfanrizkiaditricreator@gmail.com" ||
      user?.email === "admin.system@vektorion.io",
  };

  useEffect(() => {
    if (!displayProfile.nim) return;
    const unsubscribeStatuses = onSnapshot(
      doc(db, "struktur_organisasi", "main"),
      (docSnap) => {
        if (
          displayProfile.nim === "125110001" ||
          displayProfile.nim === "125110014"
        ) {
          setMyStatus("red");
        } else if (docSnap.exists() && docSnap.data().memberStatuses) {
          setMyStatus(
            docSnap.data().memberStatuses[displayProfile.nim] || "normal",
          );
        }
      },
    );
    return () => unsubscribeStatuses();
  }, [displayProfile.nim]);

  // Double check admin status from email
  const isAdminSession =
    displayProfile.isAdmin ||
    user?.email === "irfanrizkiaditribusiness@gmail.com" ||
    user?.email === "irfanrizkiaditricreator@gmail.com" ||
    user?.email === "admin@vektorion.com" ||
    user?.email === "admin.system@vektorion.io";

  useEffect(() => {
    if (user) {
      console.log("Current User Email:", user.email);
      console.log("Is Admin Session:", isAdminSession);
    }
  }, [user, isAdminSession]);

  // Sync real Kas Data
  useEffect(() => {
    if (!displayProfile.nim) return;

    // Find member by NIM or partial name
    const q = query(
      collection(db, "transactions"),
      where("nim", "==", displayProfile.nim),
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const txs = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as any[];

        // Sort client-side to avoid index requirement
        txs.sort((a, b) => {
          const tA = a.createdAt?.seconds || 0;
          const tB = b.createdAt?.seconds || 0;
          return tB - tA;
        });

        setTransactions(txs as Transaction[]);
      },
      (error) => {
        // Avoid throwing on permissions since some users might not have access to all txs
        console.warn("Transaction sync error:", error);
      },
    );

    return () => unsubscribe();
  }, [displayProfile.nim]);

  // Sync real Kas Matrix Data (Target Month/Year Status)
  useEffect(() => {
    if (!displayProfile.nim) return;

    const year = new Date().getFullYear().toString();
    const docRef = doc(db, "kasData", year, "members", displayProfile.nim);

    const unsubscribe = onSnapshot(
      docRef,
      (snapshot) => {
        if (snapshot.exists()) {
          setKasMatrixData(snapshot.data());
        } else {
          setKasMatrixData(null);
        }
        setIsKasLoading(false);
      },
      (error) => {
        console.warn("Kas matrix sync failed:", error);
        setIsKasLoading(false);
      },
    );

    return () => unsubscribe();
  }, [displayProfile.nim]);

  // Sync backgrounds config
  useEffect(() => {
    const unsubscribe = onSnapshot(
      doc(db, "appConfig", "homeBackgrounds"),
      (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data();
          setCurrentBgs({
            heroBg: data.heroBg || DEFAULT_HERO_IMG,
            agendaBg: data.agendaBg || DEFAULT_AGENDA_IMG,
            footerBg: data.footerBg || DEFAULT_FOOTER_IMG,
            heroSlideshow: data.heroSlideshow || false,
            heroInterval: data.heroInterval || 5,
            agendaSlideshow: data.agendaSlideshow || false,
            agendaInterval: data.agendaInterval || 5,
            footerSlideshow: data.footerSlideshow || false,
            footerInterval: data.footerInterval || 5,
          });
        }
      },
      (error) => {
        console.warn("Background config sync failed:", error);
      },
    );
    return () => unsubscribe();
  }, []);

  // Sync background assets
  useEffect(() => {
    if (!isAdminSession) return;

    const q = query(
      collection(db, "backgroundAssets"),
      orderBy("createdAt", "desc"),
    );
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const assets = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as any[];
        setBgAssets(assets);
      },
      (error) => {
        console.warn("Background assets sync failed:", error);
      },
    );
    return () => unsubscribe();
  }, [isAdminSession]);

  // Sync System Settings & Logs
  useEffect(() => {
    const unsubSettings = onSnapshot(
      doc(db, "appConfig", "systemSettings"),
      (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data();
          setSysSettings((prev) => ({
            ...prev,
            apiKeys: data.apiKeys || {},
            lockedMenus: data.lockedMenus || {},
            sensorSisaTagihan: data.sensorSisaTagihan || false,
            totalViews: data.totalViews || 0,
          }));
        }
      },
      (error) => {
        console.warn("System settings sync failed:", error);
      },
    );

    if (!isAdminSession) {
      return () => unsubSettings();
    }

    const qLogs = query(
      collection(db, "systemLogs"),
      orderBy("timestamp", "desc"),
      where("timestamp", ">", new Date(Date.now() - 24 * 60 * 60 * 1000)),
    ); // Last 24h
    const unsubLogs = onSnapshot(
      qLogs,
      (snapshot) => {
        setSysLogs(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
      },
      (err) => {
        console.warn("Logs sync failed in profile page:", err);
      },
    );

    return () => {
      unsubSettings();
      unsubLogs();
    };
  }, [isAdminSession]);

  const getUnpaidMonths = () => {
    // If matrix data exists, use it as priority (it's synchronized with treasury sheets)
    if (kasMatrixData) {
      const totalUnpaid = kasMatrixData.totalTunggak || 0;
      const unpaid: { month: string; amount: number; status: string }[] = [];
      const paid: { month: string; amount: number; status: string }[] = [];

      // If we have detailed monthly payments from matrix
      if (kasMatrixData.payments) {
        Object.entries(kasMatrixData.payments).forEach(
          ([month, weeks]: [string, any]) => {
            const amountPaid = Object.values(weeks).reduce(
              (acc: number, val: any) => acc + (Number(val) || 0),
              0,
            ) as number;
            // Assuming 8000 is full month for now (this matches Kas.tsx logic for 2026+)
            const fullAmount =
              month.toLowerCase() === "januari" ||
              month.toLowerCase() === "februari" ||
              month.toLowerCase() === "maret" ||
              month.toLowerCase() === "april"
                ? 20000
                : 8000;
            const label = month.charAt(0).toUpperCase() + month.slice(1);

            if (amountPaid >= fullAmount) {
              paid.push({ month: label, amount: 0, status: "Lunas" });
            } else {
              unpaid.push({
                month: label,
                amount: fullAmount - amountPaid,
                status: "Tunggakan",
              });
            }
          },
        );
      }

      // If matrix says lunas, prioritize that display
      const displayBills = unpaid.length > 0 ? unpaid : paid.slice(-1);
      const hasUnpaid = totalUnpaid > 0;
      return {
        displayBills:
          displayBills.length > 0
            ? displayBills
            : hasUnpaid
              ? [{ month: "Total", amount: totalUnpaid, status: "Belum Lunas" }]
              : [],
        totalUnpaid,
        hasUnpaid,
      };
    }

    const now = new Date();
    const currentMonthIdx = now.getMonth();
    const currentYear = now.getFullYear();

    // Monthly fee
    const FEE = 8000;

    // Start from Jan 2026
    const startYear = 2026;
    const startMonth = 0; // Januari

    const unpaid: { month: string; amount: number; status: string }[] = [];
    const paid: { month: string; amount: number; status: string }[] = [];

    // Calculate total verified paid
    const verifiedTransactions = transactions.filter(
      (tx) => tx.status === "verified",
    );
    let totalPaid = verifiedTransactions.reduce(
      (acc, tx) => acc + tx.amount,
      0,
    );

    // Iterate from start date to current month
    let iterYear = startYear;
    let iterMonth = startMonth;

    while (
      iterYear < currentYear ||
      (iterYear === currentYear && iterMonth <= currentMonthIdx)
    ) {
      const monthLabel = `${MONTHS[iterMonth]} ${iterYear}`;

      if (totalPaid >= FEE) {
        paid.push({ month: monthLabel, amount: FEE, status: "Lunas" });
        totalPaid -= FEE;
      } else {
        unpaid.push({
          month: monthLabel,
          amount: FEE - totalPaid > 0 ? FEE - totalPaid : 0,
          status: "Belum Bayar",
        });
        totalPaid = 0;
      }

      iterMonth++;
      if (iterMonth > 11) {
        iterMonth = 0;
        iterYear++;
      }
    }

    // If totalPaid still has money left, maybe it's for future months (but we only care about up to now)
    // Synchronize display with user request for Jan-May 2026
    const displayBills = unpaid.length > 0 ? unpaid : paid.slice(-5).reverse();
    const totalUnpaid = unpaid.reduce((acc, curr) => acc + curr.amount, 0);

    return { displayBills, totalUnpaid, hasUnpaid: unpaid.length > 0 };
  };

  const { displayBills, totalUnpaid, hasUnpaid } = getUnpaidMonths();

  // Auto-hide toast
  React.useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => {
        setToast(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        photoMenuRef.current &&
        !photoMenuRef.current.contains(event.target as Node)
      ) {
        setShowPhotoMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (!profile && !user) {
      navigate("/home");
    }
  }, [profile, user, navigate]);

  // MOVE RENDER CHECKS TO THE END OF HOOKS BLOCK
  // DO NOT RENDER BEFORE ALL HOOKS

  if (!profile && !user) {
    return <ProfileSkeleton />;
  }

  const showToast = (type: "success" | "error", text: string) => {
    setToast({ type, text });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      showToast("error", "Ukuran foto maksimal 10MB");
      return;
    }

    try {
      setLoading(true);

      // Compression options
      const options = {
        maxSizeMB: 0.1, // Even smaller (100KB) to avoid Firebase Auth URL limits
        maxWidthOrHeight: 800, // Sufficient for profile icons
        useWebWorker: true,
        fileType: "image/jpeg",
      };

      const compressedFile = await imageCompression(file, options);

      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64String = reader.result as string;
        await updateProfile({ photoURL: base64String });
        showToast("success", "Foto profil berhasil diperbarui!");
        setShowPhotoMenu(false);
      };
      reader.readAsDataURL(compressedFile);
    } catch (err) {
      console.error("Compression/Upload Error:", err);
      showToast("error", "Gagal memproses/mengunggah foto.");
    } finally {
      setLoading(false);
      if (e.target) e.target.value = "";
    }
  };

  const handleDeletePhoto = async () => {
    try {
      setLoading(true);
      await updateProfile({ photoURL: null });
      showToast("success", "Foto profil berhasil dihapus.");
      setShowPhotoMenu(false);
    } catch (err) {
      showToast("error", "Gagal menghapus foto.");
    } finally {
      setLoading(false);
    }
  };

  const validatePassword = (pass: string) => {
    const minLength = pass.length >= 8;
    const hasUpper = /[A-Z]/.test(pass);
    const hasLower = /[a-z]/.test(pass);
    const noSpace = !/\s/.test(pass);
    const alphaNumeric = /^[a-zA-Z0-9#@]+$/.test(pass);
    return minLength && hasUpper && hasLower && noSpace && alphaNumeric;
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!oldPassword) {
      showToast("error", "Masukkan sandi lama.");
      return;
    }

    if (newPassword === oldPassword) {
      showToast("error", "Sandi baru tidak boleh sama dengan yang lama.");
      return;
    }

    if (newPassword !== confirmPassword) {
      showToast("error", "Konfirmasi sandi salah.");
      return;
    }

    if (!validatePassword(newPassword)) {
      showToast("error", "Sandi tidak memenuhi syarat.");
      return;
    }

    try {
      setLoading(true);
      await changePassword(oldPassword, newPassword);
      showToast("success", "Kata sandi diperbarui!");
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setIsSecurityOpen(false);
    } catch (err: any) {
      const errMsg = err.message || "";
      if (
        errMsg.includes("wrong-password") ||
        errMsg.includes("invalid-credential") ||
        errMsg.includes("invalid-password")
      ) {
        showToast("error", "Sandi lama salah!");
      } else {
        showToast("error", "Gagal memperbarui sandi.");
      }
    } finally {
      setLoading(false);
    }
  };

  const detectApiKeyProvider = (key: string) => {
    const k = key.trim();
    if (k.startsWith("sk-ant")) return "Anthropic (Claude)";
    if (k.startsWith("sk-or-")) return "OpenRouter";
    if (k.startsWith("sk-")) return "OpenAI (ChatGPT)";
    if (k.startsWith("AIza")) return "Google (Gemini)";
    if (k.startsWith("gsk_")) return "Groq";
    return "Lainnya (Custom)";
  };

  const handleTestApiKey = async (provider: string, key: string) => {
    try {
      setTestingKey(provider);
      setKeyTestStatus((prev) => ({ ...prev, [provider]: null }));

      const res = await fetch("/api/test-key", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider, apiKey: key }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setKeyTestStatus((prev) => ({ ...prev, [provider]: "success" }));
        showToast("success", `${provider} API berfungsi normal!`);
      } else {
        setKeyTestStatus((prev) => ({ ...prev, [provider]: "error" }));
        showToast("error", `Gagal: ${data.error || "Server error"}`);
      }
    } catch (err: any) {
      setKeyTestStatus((prev) => ({ ...prev, [provider]: "error" }));
      showToast("error", `Koneksi gagal: ${err.message}`);
    } finally {
      setTimeout(() => {
        setTestingKey(null);
        setKeyTestStatus((prev) => ({ ...prev, [provider]: null }));
      }, 5000); // Clear status after 5s
    }
  };

  const handleUnlockKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authForKeysOpen || !user || !user.email) return;

    try {
      setLoading(true);
      const credential = EmailAuthProvider.credential(
        user.email,
        authForKeysPass,
      );
      await reauthenticateWithCredential(user, credential);

      const { provider, action } = authForKeysOpen;
      const keyVal = sysSettings.apiKeys[provider];

      if (action === "view") {
        setVisibleKeys((prev) => ({ ...prev, [provider]: true }));
        showToast("success", "Kredensial terbuka.");
      } else if (action === "copy") {
        navigator.clipboard.writeText(keyVal);
        showToast("success", "API Key tersalin ke clipboard!");
      }

      setAuthForKeysOpen(null);
      setAuthForKeysPass("");
    } catch (err: any) {
      showToast("error", "Kata sandi salah.");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateApiKey = async (key: string) => {
    const provider = apiKeyProvider;
    const path = "appConfig/systemSettings";
    try {
      setLoading(true);
      await setDoc(
        doc(db, path),
        {
          apiKeys: {
            ...sysSettings.apiKeys,
            [provider]: key,
          },
          updatedAt: serverTimestamp(),
        },
        { merge: true },
      );
      setApiKeyInput("");
      setApiKeyProvider("Google (Gemini)");
      showToast("success", `API Key ${provider} ditambahkan!`);
    } catch (err) {
      showToast("error", "Gagal menyimpan API Key.");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteApiKey = async (provider: string) => {
    const path = "appConfig/systemSettings";
    try {
      setLoading(true);
      const newKeys = { ...sysSettings.apiKeys };
      delete newKeys[provider];
      await updateDoc(doc(db, path), {
        apiKeys: newKeys,
        updatedAt: serverTimestamp(),
      });
      setShowKeyConfirm(null);
      showToast("success", `API Key ${provider} dihapus.`);
    } catch (err) {
      showToast("error", "Gagal menghapus API Key.");
    } finally {
      setLoading(false);
    }
  };

  const toggleMenuLock = async (menuId: string) => {
    const path = "appConfig/systemSettings";
    try {
      setLoading(true);
      await setDoc(
        doc(db, path),
        {
          lockedMenus: {
            ...sysSettings.lockedMenus,
            [menuId]: !sysSettings.lockedMenus[menuId],
          },
          updatedAt: serverTimestamp(),
        },
        { merge: true },
      );
      showToast("success", `Status menu ${menuId} diperbarui!`);
    } catch (err) {
      showToast("error", "Gagal mengunci menu.");
    } finally {
      setLoading(false);
    }
  };

  const toggleSensorSisaTagihan = async () => {
    const path = "appConfig/systemSettings";
    try {
      setLoading(true);
      const nextVal = !sysSettings.sensorSisaTagihan;
      setSysSettings((prev) => ({ ...prev, sensorSisaTagihan: nextVal }));
      await setDoc(
        doc(db, path),
        {
          sensorSisaTagihan: nextVal,
          updatedAt: serverTimestamp(),
        },
        { merge: true },
      );
      showToast(
        "success",
        `Sensor sisa tagihan kas ${nextVal ? "DIAKTIFKAN" : "DINONAKTIFKAN"}!`,
      );
    } catch (err) {
      setSysSettings((prev) => ({
        ...prev,
        sensorSisaTagihan: !prev.sensorSisaTagihan,
      })); // revert
      showToast("error", "Gagal merubah pengaturan sensor.");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateBg = async (
    field: string,
    url: string | boolean | number | null,
  ) => {
    const path = "appConfig/homeBackgrounds";
    try {
      setLoading(true);
      await setDoc(
        doc(db, path),
        {
          [field]: url,
          updatedAt: serverTimestamp(),
        },
        { merge: true },
      );
      showToast("success", "Pengaturan diperbarui!");
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, path);
      showToast("error", "Gagal memperbarui pengaturan.");
    } finally {
      setLoading(false);
    }
  };

  const handleAddBgViaLink = async () => {
    if (!bgUrlInput) return;
    if (!bgUrlInput.startsWith("http")) {
      showToast("error", "URL harus diawali dengan http atau https");
      return;
    }

    const path = "backgroundAssets";
    try {
      setLoading(true);
      const name = bgUrlInput.split("/").pop()?.split("?")[0] || "Gambar Link";

      await addDoc(collection(db, path), {
        url: bgUrlInput,
        name: name,
        createdAt: serverTimestamp(),
      });

      setBgUrlInput("");
      showToast("success", "Gambar ditambahkan ke pustaka!");
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, path);
      showToast("error", "Gagal menambahkan link gambar.");
    } finally {
      setLoading(false);
    }
  };

  const handleUploadBgAsset = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      showToast("error", "Ukuran gambar maksimal 5MB");
      return;
    }

    const path = "backgroundAssets";
    try {
      setUploadingBg(true);
      showToast("success", "Sedang mengunggah ke Cloudinary...");

      const formData = new FormData();
      formData.append("file", file);
      formData.append("upload_preset", "fanra_upload");

      const response = await fetch(
        `https://api.cloudinary.com/v1_1/dew39kqhy/image/upload`,
        {
          method: "POST",
          body: formData,
        },
      );

      if (!response.ok) {
        throw new Error("Gagal mengunggah ke Cloudinary");
      }

      const data = await response.json();
      const url = data.secure_url;

      await addDoc(collection(db, path), {
        url,
        name: file.name,
        createdAt: serverTimestamp(),
      });

      showToast("success", "Gambar berhasil diunggah!");
    } catch (err: any) {
      if (err.message && err.message.includes("permission")) {
        handleFirestoreError(err, OperationType.CREATE, path);
      } else {
        console.error("Cloudinary/Upload Error:", err);
      }
      showToast("error", err.message || "Gagal mengunggah gambar.");
    } finally {
      setUploadingBg(false);
      if (e.target) e.target.value = "";
    }
  };

  const handleDeleteBgAsset = async (asset: { id: string; url: string }) => {
    const path = "backgroundAssets";
    try {
      setLoading(true);

      // Check if this asset is active background
      const isHero = currentBgs.heroBg === asset.url;
      const isAgenda = currentBgs.agendaBg === asset.url;
      const isFooter = currentBgs.footerBg === asset.url;

      // Delete from Firestore only
      await deleteDoc(doc(db, path, asset.id));

      // Reset to default if it was active
      const updates: any = { updatedAt: serverTimestamp() };
      let hasUpdate = false;
      if (isHero) {
        updates.heroBg = null;
        hasUpdate = true;
      }
      if (isAgenda) {
        updates.agendaBg = null;
        hasUpdate = true;
      }
      if (isFooter) {
        updates.footerBg = null;
        hasUpdate = true;
      }

      if (hasUpdate) {
        await setDoc(doc(db, "appConfig", "homeBackgrounds"), updates, {
          merge: true,
        });
      }

      showToast("success", "Gambar dihapus dari pustaka.");
      setAssetMenuOpen(null);
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `${path}/${asset.id}`);
      showToast("error", "Gagal menghapus gambar.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="pt-16 pb-24 bg-slate-50 min-h-screen relative overflow-x-hidden">
      {/* Dynamic Header Background */}
      <div className="absolute top-0 left-0 w-full h-[380px] z-0 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-slate-900/40 via-transparent to-slate-50 z-10" />
        {displayProfile.photoURL ? (
          <OptimizedImage
            key={displayProfile.photoURL}
            src={displayProfile.photoURL}
            alt="Banner Background"
            className="blur-xl scale-110 opacity-60 object-cover"
            fallbackClassName="bg-slate-900/40"
          />
        ) : (
          <OptimizedImage
            src="https://images.unsplash.com/photo-1620121692029-d088224efc74?q=80&w=2000&auto=format&fit=crop"
            alt="Banner Fallback"
            className="grayscale opacity-40 blur-md scale-105 object-cover"
            fallbackClassName="bg-slate-900/40"
          />
        )}
      </div>

      <div className="container mx-auto px-4 max-w-lg relative z-10">
        {/* Profile Header */}
        <div className="flex flex-col items-center text-center mt-12 mb-10">
          <div className="relative mb-6">
            <div
              className={cn(
                "w-32 h-32 md:w-36 md:h-36 rounded-full border-4 shadow-2xl overflow-hidden flex items-center justify-center bg-slate-50 transition-all",
                myStatus === "green"
                  ? "border-green-400 ring-4 ring-green-400/20"
                  : myStatus === "red"
                    ? "border-red-500 ring-4 ring-red-500/20"
                    : "border-white",
              )}
            >
              {displayProfile.photoURL ? (
                <OptimizedImage
                  src={displayProfile.photoURL}
                  alt="Profile"
                  className="object-cover"
                  fallbackClassName="bg-slate-100"
                />
              ) : (
                <User size={64} className="text-slate-200" />
              )}
            </div>

            {/* Responsive Photo Action Menu */}
            <div className="absolute bottom-2 -right-1 z-30" ref={photoMenuRef}>
              <button
                onClick={() => setShowPhotoMenu(!showPhotoMenu)}
                className={cn(
                  "p-2.5 rounded-full transition-all shadow-lg border border-white/20 active:scale-95",
                  displayProfile.photoURL
                    ? "bg-slate-900/80 text-white backdrop-blur-md"
                    : "bg-white text-slate-900 border-slate-200",
                )}
              >
                <Pencil size={15} />
              </button>

              {showPhotoMenu && (
                <div className="absolute left-0 top-full mt-2 w-24 bg-white rounded-lg shadow-xl border border-slate-100 py-0.5 z-50 overflow-hidden">
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full px-3 py-2 text-left text-[9px] font-black uppercase text-slate-600 hover:bg-slate-50 transition-colors"
                  >
                    Ubah
                  </button>
                  <button
                    onClick={handleDeletePhoto}
                    className="w-full px-3 py-2 text-left text-[9px] font-black uppercase text-red-500 hover:bg-red-50 transition-colors border-t border-slate-50"
                  >
                    Hapus
                  </button>
                </div>
              )}
            </div>

            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept="image/*"
              onChange={handleFileChange}
            />
          </div>

          <div className="space-y-3">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight leading-none">
              {displayProfile.name}
            </h1>
            <div className="flex items-center justify-center gap-4">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                {displayProfile.nim}
              </span>
              <div className="w-1.5 h-1.5 rounded-full bg-slate-200" />
              <span className="text-[10px] font-black text-amber-600 uppercase tracking-[0.2em]">
                {displayProfile.position}
              </span>
            </div>
          </div>
        </div>

        {/* Collapsible Sections Menu */}
        <div className="space-y-4">
          {/* Section: Financial Status - HIDDEN FOR ADMIN */}
          {displayProfile.nim !== "ADMIN" && (
            <div className="bg-white rounded-md border border-slate-200 overflow-hidden shadow-lg group">
              <div className="relative overflow-hidden">
                <div
                  className="absolute inset-0 z-0 opacity-40 pointer-events-none transition-transform duration-500"
                  style={{
                    backgroundImage: `url("https://res.cloudinary.com/dew39kqhy/image/upload/v1778841510/ChatGPT_Image_15_Mei_2026_17.37.07_obhnjw.png")`,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                  }}
                />
                <button
                  onClick={() => setIsKasOpen(!isKasOpen)}
                  className="relative z-10 w-full flex items-center justify-between p-5 hover:bg-black/5 transition-colors text-left"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-8 h-8 flex items-center justify-center">
                      <img
                        src="https://cdn-icons-png.flaticon.com/128/10692/10692615.png"
                        alt="Kas"
                        className="w-6 h-6 object-contain brightness-0 saturate-100 invert-[71%] sepia-[85%] saturate-[1637%] hue-rotate-[352deg] brightness-[98%] contrast-[98%]"
                      />
                    </div>
                    <div>
                      <h3 className="text-[11px] font-bold text-slate-800 tracking-widest uppercase">
                        Sisa tagihan kas
                      </h3>
                      <p className="text-[8px] font-normal text-slate-500 mt-0.5">
                        Pantau iuran wajib bulanan
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span
                      className={cn(
                        "text-sm font-black tracking-tight transition-all duration-300",
                        sysSettings.sensorSisaTagihan
                          ? "text-slate-400/60 blur-[1px] select-none"
                          : hasUnpaid
                            ? "text-red-500"
                            : "text-green-500",
                      )}
                    >
                      {sysSettings.sensorSisaTagihan
                        ? "Rp -"
                        : `Rp ${totalUnpaid.toLocaleString()}`}
                    </span>
                    {isKasOpen ? (
                      <ChevronUp size={16} className="text-slate-400" />
                    ) : (
                      <ChevronDown size={16} className="text-slate-400" />
                    )}
                  </div>
                </button>
              </div>

              {isKasOpen && (
                <div className="overflow-hidden border-t border-slate-100">
                  <div className="p-5 space-y-3 bg-white">
                    <div className="grid gap-2">
                      {displayBills.map((bill, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between py-3 px-4 bg-slate-50/50 rounded-md border border-slate-100 shadow-sm transition-all hover:border-amber-200"
                        >
                          <div>
                            <p className="text-[9px] font-bold text-slate-900 tracking-wider text-left">
                              {bill.month}
                            </p>
                            <p className="text-[7px] text-slate-400 font-normal tracking-widest italic text-left">
                              Iuran wajib
                            </p>
                          </div>
                          <div className="flex items-center gap-4 text-right">
                            <div className="flex flex-col items-end">
                              <p
                                className={cn(
                                  "text-[10px] font-black transition-all duration-300 mb-0.5",
                                  sysSettings.sensorSisaTagihan
                                    ? "text-slate-400/60 blur-[1px] select-none"
                                    : "text-slate-900",
                                )}
                              >
                                {sysSettings.sensorSisaTagihan
                                  ? "Rp -"
                                  : `Rp ${bill.amount.toLocaleString()}`}
                              </p>
                              <span
                                className={cn(
                                  "text-[7px] font-bold px-2 py-0.5 rounded-full border transition-all duration-300",
                                  sysSettings.sensorSisaTagihan
                                    ? "text-slate-400 border-slate-200 bg-slate-50/50 blur-[0.5px] select-none"
                                    : bill.status === "Lunas"
                                      ? "text-green-500 border-green-200 bg-green-50"
                                      : "text-red-500 border-red-200 bg-red-50",
                                )}
                              >
                                {sysSettings.sensorSisaTagihan
                                  ? "Tertutup"
                                  : bill.status}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {hasUnpaid && (
                      <div className="mt-4 pt-4 border-t border-slate-100 space-y-4">
                        <div className="bg-amber-500/5 p-3 rounded-md border border-amber-500/10">
                          <p className="text-left text-[8px] text-slate-500 font-normal leading-relaxed tracking-wider lowercase first-letter:uppercase">
                            <span className="text-amber-600 font-bold">
                              Informasi:
                            </span>
                            {sysSettings.sensorSisaTagihan
                              ? " Sinkronisasi data kas dengan spreadsheet sedang berlangsung. Tombol pembayaran dinonaktifkan sementara."
                              : " Pembayaran diprioritaskan bulan terlama (FIFO). Sisa saldo dialokasikan ke bulan berikutnya."}
                          </p>
                        </div>

                        <div className="flex flex-col gap-4">
                          <div className="flex items-center justify-between">
                            <p className="text-[9px] font-bold text-slate-400 tracking-widest uppercase">
                              Total belum terbayar
                            </p>
                            <p
                              className={cn(
                                "text-sm font-black transition-all duration-300",
                                sysSettings.sensorSisaTagihan
                                  ? "text-slate-400/60 blur-[1px] select-none"
                                  : "text-red-500",
                              )}
                            >
                              {sysSettings.sensorSisaTagihan
                                ? "Rp -"
                                : `Rp ${totalUnpaid.toLocaleString()}`}
                            </p>
                          </div>

                          <button
                            disabled={sysSettings.sensorSisaTagihan}
                            onClick={() =>
                              !sysSettings.sensorSisaTagihan &&
                              navigate("/kas", {
                                state: {
                                  view: "pay",
                                  member: {
                                    name: displayProfile.name,
                                    nim: displayProfile.nim,
                                  },
                                  amount: totalUnpaid,
                                },
                              })
                            }
                            className={cn(
                              "w-full flex items-center justify-center gap-2 py-4 rounded-md font-bold text-[10px] tracking-widest transition-all",
                              sysSettings.sensorSisaTagihan
                                ? "bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200/50"
                                : "bg-slate-900 text-white hover:bg-slate-800 shadow-xl active:scale-[0.98] cursor-pointer",
                            )}
                          >
                            {sysSettings.sensorSisaTagihan
                              ? "Pembayaran Ditutup Sementara"
                              : "Lunasi Sekarang"}
                            {!sysSettings.sensorSisaTagihan && (
                              <ArrowRight size={14} />
                            )}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Section: Background Home - ADMIN ONLY */}
          {isAdminSession && (
            <div className="bg-white rounded-md border border-slate-200 overflow-hidden shadow-lg group">
              <div className="relative overflow-hidden">
                <div
                  className="absolute inset-0 z-0 opacity-40 pointer-events-none"
                  style={{
                    backgroundImage: `url("https://res.cloudinary.com/dew39kqhy/image/upload/v1778841510/ChatGPT_Image_15_Mei_2026_17.37.07_obhnjw.png")`,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                  }}
                />
                <button
                  onClick={() => setIsHomeBgOpen(!isHomeBgOpen)}
                  className="relative z-10 w-full flex items-center justify-between p-6 hover:bg-black/5 transition-colors text-left"
                >
                  <div>
                    <h3 className="text-[11px] font-bold text-slate-800 tracking-widest uppercase">
                      Background home
                    </h3>
                    <p className="text-[8px] font-normal text-slate-500 mt-0.5">
                      Kelola gambar latar belakang halaman utama
                    </p>
                  </div>
                  {isHomeBgOpen ? (
                    <ChevronUp size={16} className="text-slate-400" />
                  ) : (
                    <ChevronDown size={16} className="text-slate-400" />
                  )}
                </button>
              </div>

              {isHomeBgOpen && (
                <div className="overflow-hidden border-t border-slate-100">
                  <div className="p-6 space-y-6 bg-white">
                    {/* Tabs for 3 sections */}
                    <div className="flex gap-2">
                      {[1, 2, 3].map((id) => (
                        <button
                          key={id}
                          onClick={() => setActiveBgTab(id as 1 | 2 | 3)}
                          className={cn(
                            "flex-1 py-3 text-[9px] font-black uppercase tracking-widest rounded-md border transition-all",
                            activeBgTab === id
                              ? "bg-slate-900 text-white border-slate-900 shadow-lg"
                              : "bg-white text-slate-400 border-slate-100 hover:border-slate-300",
                          )}
                        >
                          Gbr {id}
                        </button>
                      ))}
                    </div>

                    {/* Controls for Active Selection */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between bg-slate-50 p-4 rounded-md border border-slate-100">
                        <div>
                          <h4 className="text-[10px] font-black text-slate-800 uppercase tracking-widest">
                            Mode Slideshow
                          </h4>
                          <p className="text-[8px] text-slate-400 font-normal mt-0.5">
                            Ganti foto otomatis dari pustaka
                          </p>
                        </div>
                        <button
                          onClick={() => {
                            const field =
                              activeBgTab === 1
                                ? "heroSlideshow"
                                : activeBgTab === 2
                                  ? "agendaSlideshow"
                                  : "footerSlideshow";
                            const current =
                              activeBgTab === 1
                                ? currentBgs.heroSlideshow
                                : activeBgTab === 2
                                  ? currentBgs.agendaSlideshow
                                  : currentBgs.footerSlideshow;
                            handleUpdateBg(field, !current);
                          }}
                          className={cn(
                            "w-10 h-5 rounded-md relative transition-all duration-300",
                            (
                              activeBgTab === 1
                                ? currentBgs.heroSlideshow
                                : activeBgTab === 2
                                  ? currentBgs.agendaSlideshow
                                  : currentBgs.footerSlideshow
                            )
                              ? "bg-amber-500"
                              : "bg-slate-200",
                          )}
                        >
                          <div
                            className={cn(
                              "absolute top-1 w-3 h-3 bg-white rounded-sm shadow-sm transition-all duration-300",
                              (
                                activeBgTab === 1
                                  ? currentBgs.heroSlideshow
                                  : activeBgTab === 2
                                    ? currentBgs.agendaSlideshow
                                    : currentBgs.footerSlideshow
                              )
                                ? "left-[22px]"
                                : "left-[2px]",
                            )}
                          />
                        </button>
                      </div>

                      <div className="relative aspect-video rounded-md overflow-hidden border border-slate-200 group bg-slate-100">
                        <OptimizedImage
                          src={
                            activeBgTab === 1
                              ? currentBgs.heroBg
                              : activeBgTab === 2
                                ? currentBgs.agendaBg
                                : currentBgs.footerBg
                          }
                          className="object-cover"
                          alt="Preview"
                          fallbackClassName="bg-slate-100"
                        />
                        <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
                          <button
                            onClick={() => {
                              const field =
                                activeBgTab === 1
                                  ? "heroBg"
                                  : activeBgTab === 2
                                    ? "agendaBg"
                                    : "footerBg";
                              handleUpdateBg(field, null);
                            }}
                            className="p-3 bg-white/20 backdrop-blur-md rounded-full text-white hover:bg-white/40 transition-all"
                            title="Reset ke default"
                          >
                            <RotateCcw size={18} />
                          </button>
                        </div>
                      </div>

                      {/* Library & Upload */}
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <h4 className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">
                            {isUrlTab ? "Link Gambar" : "Pustaka Foto"}
                          </h4>
                          <div className="flex gap-2">
                            <button
                              onClick={() => setIsUrlTab(!isUrlTab)}
                              className={cn(
                                "p-2 rounded-md transition-all shadow-sm",
                                isUrlTab
                                  ? "bg-slate-900 text-white"
                                  : "bg-white border border-slate-200 text-slate-400",
                              )}
                            >
                              <Plus size={14} />
                            </button>
                            {!isUrlTab && (
                              <label className="cursor-pointer p-2 bg-amber-500 text-white rounded-md hover:bg-amber-600 transition-all shadow-md flex items-center justify-center">
                                {uploadingBg ? (
                                  <Loader2 size={14} className="animate-spin" />
                                ) : (
                                  <Camera size={14} />
                                )}
                                <input
                                  type="file"
                                  className="hidden"
                                  accept="image/*"
                                  onChange={handleUploadBgAsset}
                                  disabled={uploadingBg}
                                />
                              </label>
                            )}
                          </div>
                        </div>

                        <div className="grid grid-cols-3 gap-3">
                          {bgAssets.length > 0 ? (
                            bgAssets.map((asset) => (
                              <div
                                key={asset.id}
                                className="relative aspect-square rounded-md overflow-hidden border border-slate-100 group bg-slate-50"
                              >
                                <OptimizedImage
                                  src={asset.url}
                                  className="object-cover cursor-pointer"
                                  alt={asset.name}
                                  fallbackClassName="bg-slate-50"
                                  onClick={() => {
                                    const field =
                                      activeBgTab === 1
                                        ? "heroBg"
                                        : activeBgTab === 2
                                          ? "agendaBg"
                                          : "footerBg";
                                    handleUpdateBg(field, asset.url);
                                  }}
                                />
                                {(activeBgTab === 1 &&
                                  currentBgs.heroBg === asset.url) ||
                                (activeBgTab === 2 &&
                                  currentBgs.agendaBg === asset.url) ||
                                (activeBgTab === 3 &&
                                  currentBgs.footerBg === asset.url) ? (
                                  <div className="absolute inset-0 border-2 border-amber-500 rounded-md pointer-events-none z-10" />
                                ) : null}
                              </div>
                            ))
                          ) : (
                            <div className="col-span-3 py-10 border border-dashed border-slate-200 rounded-md flex flex-col items-center justify-center text-slate-300">
                              <ImageIcon size={20} className="mb-2" />
                              <p className="text-[8px] font-black uppercase tracking-widest">
                                Kosong
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Section: Developer Settings - ADMIN ONLY */}
          {isAdminSession && (
            <div className="bg-white rounded-md border border-slate-200 overflow-hidden shadow-lg group">
              <div className="relative overflow-hidden">
                <div
                  className="absolute inset-0 z-0 opacity-40 pointer-events-none"
                  style={{
                    backgroundImage: `url("https://res.cloudinary.com/dew39kqhy/image/upload/v1778841510/ChatGPT_Image_15_Mei_2026_17.37.07_obhnjw.png")`,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                  }}
                />
                <button
                  onClick={() => setIsDevSettingsOpen(!isDevSettingsOpen)}
                  className="relative z-10 w-full flex items-center justify-between p-6 hover:bg-black/5 transition-colors text-left"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-8 h-8 flex items-center justify-center">
                      <Activity className="text-amber-600" size={24} />
                    </div>
                    <div>
                      <h3 className="text-[11px] font-bold text-slate-800 tracking-widest uppercase">
                        Developer Settings
                      </h3>
                      <p className="text-[8px] font-normal text-slate-500 mt-0.5">
                        API Keys, Maintenance & Health Logs
                      </p>
                    </div>
                  </div>
                  {isDevSettingsOpen ? (
                    <ChevronUp size={16} className="text-slate-400" />
                  ) : (
                    <ChevronDown size={16} className="text-slate-400" />
                  )}
                </button>
              </div>

              {isDevSettingsOpen && (
                <div className="overflow-hidden border-t border-slate-100">
                  <div className="p-6 space-y-8 bg-white">
                    {/* API Keys Management */}
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Key size={14} className="text-slate-400" />
                        <h4 className="text-[10px] font-black text-slate-800 uppercase tracking-widest">
                          API Infrastructure
                        </h4>
                      </div>

                      <div className="space-y-3">
                        <div className="relative flex items-center gap-2">
                          <input
                            type="password"
                            value={apiKeyInput}
                            onChange={(e) => {
                              setApiKeyInput(e.target.value);
                              const det = detectApiKeyProvider(e.target.value);
                              if (det !== "Lainnya (Custom)") {
                                setApiKeyProvider(det);
                              }
                            }}
                            placeholder="Ketik API Key (OpenAI/Gemini/Claude)..."
                            className="flex-1 bg-slate-50 border border-slate-200 rounded-md py-3 px-4 text-[10px] focus:outline-none focus:border-amber-500 shadow-sm"
                          />
                          {apiKeyInput && (
                            <div className="flex items-center gap-2">
                              <select
                                value={apiKeyProvider}
                                onChange={(e) =>
                                  setApiKeyProvider(e.target.value)
                                }
                                className="bg-amber-50 text-[8px] font-bold text-amber-600 border border-amber-200 rounded-sm px-2 py-2 focus:outline-none focus:ring-1 focus:ring-amber-500 max-w-[80px]"
                              >
                                <option value="Google (Gemini)">Gemini</option>
                                <option value="OpenAI (ChatGPT)">OpenAI</option>
                                <option value="Groq">Groq</option>
                                <option value="Anthropic (Claude)">
                                  Claude
                                </option>
                                <option value="OpenRouter">OpenRouter</option>
                                <option value="Lainnya (Custom)">
                                  Lainnya ({detectApiKeyProvider(apiKeyInput)})
                                </option>
                              </select>
                              <button
                                onClick={() => handleUpdateApiKey(apiKeyInput)}
                                disabled={!apiKeyInput}
                                className="px-4 py-2 h-full bg-slate-900 text-white text-[8px] font-black uppercase rounded-sm hover:bg-slate-800 disabled:opacity-50 transition-colors cursor-pointer"
                              >
                                Simpan
                              </button>
                            </div>
                          )}
                        </div>

                        <div className="grid gap-2">
                          {Object.entries(sysSettings.apiKeys).map(
                            ([provider, key]) => {
                              const isTesting = testingKey === provider;
                              const tStat = keyTestStatus[provider];
                              const isVisible = visibleKeys[provider];

                              return (
                                <div
                                  key={provider}
                                  className="flex flex-col gap-2 p-3 bg-slate-50 rounded-md border border-slate-100"
                                >
                                  <div className="flex items-center justify-between">
                                    <div className="min-w-0 pr-2">
                                      <p className="text-[9px] font-bold text-slate-800 tracking-wide uppercase truncate">
                                        {provider}
                                      </p>
                                      <div className="flex items-center gap-1.5 mt-0.5">
                                        <p className="text-[8px] text-slate-400 font-mono break-all whitespace-pre-wrap">
                                          {isVisible
                                            ? (key as string)
                                            : `••••••••${(key as string).slice(-6)}`}
                                        </p>
                                        <button
                                          onClick={() => {
                                            if (isVisible) {
                                              setVisibleKeys((prev) => ({
                                                ...prev,
                                                [provider]: false,
                                              }));
                                            } else {
                                              setAuthForKeysOpen({
                                                provider,
                                                action: "view",
                                              });
                                            }
                                          }}
                                          className="text-slate-300 hover:text-amber-500 cursor-pointer"
                                        >
                                          {isVisible ? (
                                            <EyeOff size={10} />
                                          ) : (
                                            <Eye size={10} />
                                          )}
                                        </button>
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-1.5 shrink-0">
                                      <button
                                        onClick={() =>
                                          setAuthForKeysOpen({
                                            provider,
                                            action: "copy",
                                          })
                                        }
                                        title="Salin Key"
                                        className="p-1.5 text-slate-400 hover:text-slate-600 transition-colors bg-white border border-slate-200 rounded-sm cursor-pointer"
                                      >
                                        <svg
                                          xmlns="http://www.w3.org/2000/svg"
                                          width="12"
                                          height="12"
                                          viewBox="0 0 24 24"
                                          fill="none"
                                          stroke="currentColor"
                                          strokeWidth="2"
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                        >
                                          <rect
                                            width="14"
                                            height="14"
                                            x="8"
                                            y="8"
                                            rx="2"
                                            ry="2"
                                          />
                                          <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
                                        </svg>
                                      </button>

                                      <button
                                        onClick={() =>
                                          handleTestApiKey(
                                            provider,
                                            key as string,
                                          )
                                        }
                                        disabled={isTesting}
                                        title="Test API Key"
                                        className={cn(
                                          "px-2 py-1.5 text-[8px] font-bold uppercase rounded-sm border transition-colors cursor-pointer flex items-center gap-1",
                                          isTesting
                                            ? "bg-slate-100 text-slate-400 border-slate-200"
                                            : tStat === "success"
                                              ? "bg-emerald-50 text-emerald-600 border-emerald-200"
                                              : tStat === "error"
                                                ? "bg-red-50 text-red-600 border-red-200"
                                                : "bg-white text-slate-600 border-slate-200 hover:bg-slate-100",
                                        )}
                                      >
                                        {isTesting ? (
                                          <Loader2
                                            size={10}
                                            className="animate-spin"
                                          />
                                        ) : tStat === "success" ? (
                                          <CheckCircle2 size={10} />
                                        ) : tStat === "error" ? (
                                          <AlertCircle size={10} />
                                        ) : (
                                          "TEST"
                                        )}
                                      </button>

                                      {showKeyConfirm === provider ? (
                                        <div className="flex items-center gap-1 ml-1 pl-1.5 border-l border-slate-200">
                                          <button
                                            onClick={() =>
                                              handleDeleteApiKey(provider)
                                            }
                                            className="px-1.5 py-1 bg-red-500 text-white text-[8px] font-bold rounded-sm cursor-pointer"
                                          >
                                            Yakin?
                                          </button>
                                          <button
                                            onClick={() =>
                                              setShowKeyConfirm(null)
                                            }
                                            className="px-1.5 py-1 bg-slate-200 text-slate-600 text-[8px] font-bold rounded-sm cursor-pointer"
                                          >
                                            Batal
                                          </button>
                                        </div>
                                      ) : (
                                        <button
                                          onClick={() =>
                                            setShowKeyConfirm(provider)
                                          }
                                          className="p-1.5 ml-1 text-slate-300 hover:text-red-500 transition-colors cursor-pointer"
                                        >
                                          <Trash size={12} />
                                        </button>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              );
                            },
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Modal Auth Action (View/Copy API Key) */}
                    {authForKeysOpen && (
                      <div className="fixed inset-0 z-[300] bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
                        <form
                          onSubmit={handleUnlockKey}
                          className="w-full max-w-sm bg-white rounded-md shadow-2xl overflow-hidden p-6 gap-6 flex flex-col"
                        >
                          <div className="space-y-1">
                            <h3 className="text-sm font-bold text-slate-900">
                              Otorisasi Admin
                            </h3>
                            <p className="text-[10px] text-slate-500 leading-relaxed">
                              Masukkan sandi admin untuk{" "}
                              {authForKeysOpen.action === "view"
                                ? "melihat"
                                : "menyalin"}{" "}
                              API Key{" "}
                              <strong className="text-slate-700">
                                {authForKeysOpen.provider}
                              </strong>
                              .
                            </p>
                          </div>

                          <div className="relative">
                            <input
                              type="password"
                              value={authForKeysPass}
                              onChange={(e) =>
                                setAuthForKeysPass(e.target.value)
                              }
                              placeholder="Sandi Admin"
                              autoFocus
                              className="w-full bg-slate-50 border border-slate-200 rounded-md py-3 px-4 text-xs focus:outline-none focus:border-amber-500 shadow-sm transition-all"
                            />
                          </div>

                          <div className="flex gap-2 justify-end">
                            <button
                              type="button"
                              onClick={() => {
                                setAuthForKeysOpen(null);
                                setAuthForKeysPass("");
                              }}
                              className="px-4 py-2.5 rounded-sm border border-slate-200 text-slate-600 text-[9px] font-bold tracking-widest uppercase hover:bg-slate-50 transition-colors"
                            >
                              Batal
                            </button>
                            <button
                              type="submit"
                              disabled={loading || !authForKeysPass}
                              className="px-4 py-2.5 rounded-sm bg-slate-900 text-white text-[9px] font-bold tracking-widest uppercase hover:bg-slate-800 disabled:opacity-50 transition-colors"
                            >
                              {loading ? "Memvalidasi..." : "Lanjutkan"}
                            </button>
                          </div>
                        </form>
                      </div>
                    )}

                    {/* Maintenance Mode / Menu Locking */}
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Globe size={14} className="text-slate-400" />
                        <h4 className="text-[10px] font-black text-slate-800 uppercase tracking-widest">
                          Maintenance Control
                        </h4>
                      </div>

                      <div className="grid gap-3">
                        {["home", "kas", "galeri", "agenda"].map((menu) => (
                          <div
                            key={menu}
                            className="flex items-center justify-between p-4 bg-slate-50 rounded-md border border-slate-100 shadow-sm"
                          >
                            <div>
                              <h5 className="text-[10px] font-black text-slate-800 uppercase tracking-widest">
                                {menu}
                              </h5>
                              <p className="text-[8px] text-slate-400 font-normal">
                                Kunci akses untuk umum
                              </p>
                            </div>
                            <button
                              onClick={() => toggleMenuLock(menu)}
                              className={cn(
                                "w-10 h-5 rounded-md relative transition-all duration-300",
                                sysSettings.lockedMenus[menu]
                                  ? "bg-red-500 shadow-lg shadow-red-500/20"
                                  : "bg-slate-200",
                              )}
                            >
                              <div
                                className={cn(
                                  "absolute top-1 w-3 h-3 bg-white rounded-sm shadow-sm transition-all duration-300",
                                  sysSettings.lockedMenus[menu]
                                    ? "left-[22px]"
                                    : "left-[2px]",
                                )}
                              />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Sensor Keuangan Control */}
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 mb-2">
                        <EyeOff size={14} className="text-slate-400" />
                        <h4 className="text-[10px] font-black text-slate-800 uppercase tracking-widest">
                          Sensor Keuangan
                        </h4>
                      </div>

                      <div className="flex items-center justify-between p-4 bg-slate-50 rounded-md border border-slate-100 shadow-sm">
                        <div>
                          <h5 className="text-[10px] font-black text-slate-800 uppercase tracking-widest">
                            Sensor Sisa Tagihan
                          </h5>
                          <p className="text-[8px] text-slate-400 font-normal">
                            Sembunyikan angka sisa tagihan kas menjadi "-" &
                            nonaktifkan/kunci tombol pembayaran
                          </p>
                        </div>
                        <button
                          onClick={toggleSensorSisaTagihan}
                          className={cn(
                            "w-10 h-5 rounded-md relative transition-all duration-300",
                            sysSettings.sensorSisaTagihan
                              ? "bg-amber-500 shadow-lg shadow-amber-500/20"
                              : "bg-slate-200",
                          )}
                        >
                          <div
                            className={cn(
                              "absolute top-1 w-3 h-3 bg-white rounded-sm shadow-sm transition-all duration-300",
                              sysSettings.sensorSisaTagihan
                                ? "left-[22px]"
                                : "left-[2px]",
                            )}
                          />
                        </button>
                      </div>
                    </div>

                    {/* Logs & Diagnostics */}
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 mb-2">
                        <History size={14} className="text-slate-400" />
                        <h4 className="text-[10px] font-black text-slate-800 uppercase tracking-widest">
                          System Diagnostics (24h)
                        </h4>
                      </div>

                      <div className="bg-slate-900 rounded-md p-4 max-h-[150px] overflow-y-auto scrollbar-hide border border-slate-800">
                        {sysLogs.length > 0 ? (
                          sysLogs.map((log) => (
                            <div
                              key={log.id}
                              className="mb-2 pb-2 border-b border-white/5 last:border-0"
                            >
                              <div className="flex items-center justify-between mb-1">
                                <span
                                  className={cn(
                                    "text-[7px] font-black uppercase px-1.5 py-0.5 rounded-sm",
                                    log.type === "error"
                                      ? "bg-red-500 text-white"
                                      : "bg-green-500 text-white",
                                  )}
                                >
                                  {log.provider || "AI_ENGINE"}
                                </span>
                                <span className="text-[6px] text-slate-500 font-mono">
                                  {log.timestamp?.toDate
                                    ? log.timestamp
                                        .toDate()
                                        .toLocaleTimeString()
                                    : "N/A"}
                                </span>
                              </div>
                              <p className="text-[8px] text-white/70 font-mono leading-tight whitespace-pre-wrap">
                                {log.message}
                              </p>
                            </div>
                          ))
                        ) : (
                          <div className="flex flex-col items-center justify-center py-6 text-slate-600">
                            <ShieldCheck
                              size={20}
                              className="mb-2 opacity-20"
                            />
                            <p className="text-[8px] font-black uppercase tracking-widest">
                              System Healthy
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Section: Security */}
          <div className="bg-white rounded-md border border-slate-200 overflow-hidden shadow-lg group">
            <div className="relative overflow-hidden">
              <div
                className="absolute inset-0 z-0 opacity-40 pointer-events-none"
                style={{
                  backgroundImage: `url("https://res.cloudinary.com/dew39kqhy/image/upload/v1778841510/ChatGPT_Image_15_Mei_2026_17.37.07_obhnjw.png")`,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                }}
              />
              <button
                onClick={() => setIsSecurityOpen(!isSecurityOpen)}
                className="relative z-10 w-full flex items-center justify-between p-6 hover:bg-black/5 transition-colors text-left"
              >
                <div className="flex items-center gap-4">
                  <div className="w-8 h-8 flex items-center justify-center">
                    <img
                      src="https://cdn-icons-png.flaticon.com/128/4924/4924681.png"
                      alt="Security"
                      className="w-6 h-6 object-contain"
                    />
                  </div>
                  <div>
                    <h3 className="text-[11px] font-bold text-slate-800 tracking-widest uppercase">
                      {displayProfile.nim === "ADMIN"
                        ? "Sistem kredensial root"
                        : "Keamanan & sandi"}
                    </h3>
                    <p className="text-[8px] font-normal text-slate-500 mt-0.5">
                      {displayProfile.nim === "ADMIN"
                        ? "Kelola akses administratif sistem"
                        : "Kelola akses kredensial akun"}
                    </p>
                  </div>
                </div>
                {isSecurityOpen ? (
                  <ChevronUp size={16} className="text-slate-400" />
                ) : (
                  <ChevronDown size={16} className="text-slate-400" />
                )}
              </button>
            </div>

            {isSecurityOpen && (
              <div className="overflow-hidden border-t border-slate-100">
                <form
                  onSubmit={handleChangePassword}
                  className="p-6 space-y-6 bg-white"
                >
                  <div className="space-y-1.5 text-left">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                      Validasi Sandi Lama
                    </label>
                    <div className="relative">
                      <input
                        type={showOldPassword ? "text" : "password"}
                        value={oldPassword}
                        onChange={(e) => setOldPassword(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-md py-3.5 px-4 text-xs text-slate-900 focus:outline-none focus:border-amber-500 shadow-sm transition-all"
                        placeholder="••••••••"
                      />
                      <button
                        type="button"
                        onClick={() => setShowOldPassword(!showOldPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                      >
                        {showOldPassword ? (
                          <EyeOff size={14} />
                        ) : (
                          <Eye size={14} />
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-3 text-left">
                      <div className="space-y-1.5">
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                          Ketik Sandi Baru
                        </label>
                        <div className="relative">
                          <input
                            type={showNewPassword ? "text" : "password"}
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 rounded-md py-3.5 px-4 text-xs text-slate-900 focus:outline-none focus:border-amber-500 shadow-sm transition-all"
                            placeholder="Min. 8 Karakter"
                          />
                          <button
                            type="button"
                            onClick={() => setShowNewPassword(!showNewPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                          >
                            {showNewPassword ? (
                              <EyeOff size={14} />
                            ) : (
                              <Eye size={14} />
                            )}
                          </button>
                        </div>
                      </div>

                      {/* Password Requirements UI */}
                      <div className="grid gap-1.5 p-3 bg-slate-50 border border-slate-100 rounded-md">
                        {[
                          {
                            id: "min",
                            label: "Minimal 8 karakter",
                            check: (p: string) => p.length >= 8,
                          },
                          {
                            id: "upper",
                            label: "Huruf kapital (A-Z)",
                            check: (p: string) => /[A-Z]/.test(p),
                          },
                          {
                            id: "lower",
                            label: "Huruf kecil (a-z)",
                            check: (p: string) => /[a-z]/.test(p),
                          },
                          {
                            id: "number",
                            label: "Angka (0-9)",
                            check: (p: string) => /[0-9]/.test(p),
                          },
                          {
                            id: "space",
                            label: "Tanpa spasi & simbol (kecuali @, #)",
                            check: (p: string) =>
                              p.length > 0 &&
                              !/\s/.test(p) &&
                              /^[a-zA-Z0-9#@]+$/.test(p),
                          },
                        ].map((req) => {
                          const isMet = req.check(newPassword);
                          return (
                            <div
                              key={req.id}
                              className="flex items-center gap-2"
                            >
                              <div
                                className={cn(
                                  "w-1.5 h-1.5 rounded-full",
                                  isMet
                                    ? "bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]"
                                    : "bg-slate-200",
                                )}
                              />
                              <span
                                className={cn(
                                  "text-[8px] font-medium transition-colors",
                                  isMet ? "text-green-600" : "text-slate-400",
                                )}
                              >
                                {req.label}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    <div className="space-y-1.5 text-left">
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                        Konfirmasi Ulang
                      </label>
                      <input
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        onPaste={(e) => e.preventDefault()}
                        className={cn(
                          "w-full bg-slate-50 border rounded-md py-3.5 px-4 text-xs text-slate-900 focus:outline-none transition-all shadow-sm",
                          confirmPassword
                            ? confirmPassword === newPassword
                              ? "border-green-500 focus:border-green-500"
                              : "border-red-500 focus:border-red-500"
                            : "border-slate-200 focus:border-amber-500",
                        )}
                        placeholder="••••••••"
                      />
                    </div>
                  </div>

                  <button
                    disabled={
                      loading ||
                      !newPassword ||
                      !oldPassword ||
                      newPassword === oldPassword ||
                      newPassword !== confirmPassword ||
                      !validatePassword(newPassword)
                    }
                    className="w-full py-4 bg-slate-900 text-white rounded-md font-black uppercase text-[9px] tracking-[0.2em] hover:bg-slate-800 transition-all shadow-xl disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    {loading ? "MEMPROSES..." : "PERBARUI DATA"}
                  </button>
                </form>
              </div>
            )}
          </div>
          <div className="bg-white rounded-md border border-slate-200 overflow-hidden shadow-lg group">
            <div className="relative overflow-hidden">
              <div
                className="absolute inset-0 z-0 opacity-40 pointer-events-none"
                style={{
                  backgroundImage: `url("https://res.cloudinary.com/dew39kqhy/image/upload/v1778841510/ChatGPT_Image_15_Mei_2026_17.37.07_obhnjw.png")`,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                }}
              />
              <button
                onClick={() => setIsPwaOpen(!isPwaOpen)}
                className="relative z-10 w-full flex items-center justify-between p-6 hover:bg-black/5 transition-colors text-left"
              >
                <div className="flex items-center gap-4">
                  <div className="w-8 h-8 flex items-center justify-center">
                    <img
                      src="https://cdn-icons-png.flaticon.com/128/2609/2609178.png"
                      alt="PWA Install"
                      className="w-6 h-6 object-contain brightness-0 saturate-100 invert-[71%] sepia-[85%] saturate-[1637%] hue-rotate-[352deg] brightness-[98%] contrast-[98%]"
                    />
                  </div>
                  <div>
                    <h3 className="text-[11px] font-bold text-slate-800 tracking-widest uppercase">
                      Aplikasi Layar Utama
                    </h3>
                    <p className="text-[8px] font-normal text-slate-500 mt-0.5">
                      Panduan instalasi Vektorion PWA untuk notifikasi instan
                    </p>
                  </div>
                </div>
                {isPwaOpen ? (
                  <ChevronUp size={16} className="text-slate-400" />
                ) : (
                  <ChevronDown size={16} className="text-slate-400" />
                )}
              </button>
            </div>

            {isPwaOpen && (
              <div className="overflow-hidden border-t border-slate-100">
                <div className="p-6 space-y-4 bg-white">
                  <div className="flex gap-4 items-start text-left">
                    <div className="w-10 h-10 shrink-0 flex items-center justify-center rounded-sm bg-amber-50 border border-amber-100 shadow-sm">
                      <img
                        src="https://cdn-icons-png.flaticon.com/128/2609/2609178.png"
                        alt="PWA Install"
                        className="w-5 h-5 object-contain brightness-0 saturate-100 invert-[71%] sepia-[85%] saturate-[1637%] hue-rotate-[352deg] brightness-[98%] contrast-[98%]"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-[10px] font-black text-slate-900 tracking-wider uppercase">
                        Panduan PWA
                      </h4>
                      <p className="text-[9px] text-slate-500 font-normal leading-relaxed mt-0.5">
                        Pasang Aplikasi Vektorion di layar utama perangkat HP
                        atau laptop Anda untuk memudahkan akses harian dan
                        menerima update notifikasi secara <i>real-time</i>.
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-left">
                    <div className="p-3.5 bg-slate-50 border border-slate-100 rounded-sm">
                      <span className="text-[8px] font-black text-amber-600 uppercase tracking-widest block mb-1.5">
                        Android / Chrome
                      </span>
                      <ol className="list-decimal pl-3.5 text-[8.5px] text-slate-500 space-y-1 font-normal leading-relaxed">
                        <li>
                          Buka menu utama browser{" "}
                          <span className="font-semibold text-slate-700">
                            Chrome
                          </span>
                        </li>
                        <li>
                          Ketuk tombol menu{" "}
                          <span className="font-semibold text-slate-700">
                            titik tiga (⋮)
                          </span>{" "}
                          di kanan atas
                        </li>
                        <li>
                          Pilih menu{" "}
                          <span className="font-semibold text-slate-700">
                            "Instal aplikasi"
                          </span>{" "}
                          atau{" "}
                          <span className="font-semibold text-slate-700">
                            "Tambahkan ke Layar Utama"
                          </span>
                        </li>
                      </ol>
                    </div>
                    <div className="p-3.5 bg-slate-50 border border-slate-100 rounded-sm">
                      <span className="text-[8px] font-black text-amber-600 uppercase tracking-widest block mb-1.5">
                        iOS / Safari
                      </span>
                      <ol className="list-decimal pl-3.5 text-[8.5px] text-slate-500 space-y-1 font-normal leading-relaxed">
                        <li>
                          Buka situs web di browser{" "}
                          <span className="font-semibold text-slate-700">
                            Safari
                          </span>
                        </li>
                        <li>
                          Ketuk ikon{" "}
                          <span className="font-semibold text-slate-700">
                            Bagikan (Share)
                          </span>{" "}
                          di bagian bawah layar
                        </li>
                        <li>
                          Gulir ke bawah lalu pilih opsi{" "}
                          <span className="font-semibold text-slate-700">
                            "Tambah ke Layar Utama"
                          </span>
                        </li>
                      </ol>
                    </div>
                  </div>

                  {/* Standard native prompt button if installable */}
                  {isInstallable && (
                    <button
                      onClick={handleInstallClick}
                      className="w-full py-3.5 bg-amber-500 hover:bg-amber-600 text-white font-black uppercase text-[9px] tracking-[0.2em] rounded-sm transition-all shadow-lg active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <img
                        src="https://cdn-icons-png.flaticon.com/128/2609/2609178.png"
                        alt="Install badge"
                        className="w-4 h-4 object-contain brightness-0 invert"
                      />
                      Pasang Aplikasi Sekarang
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Section: Other Settings (Switch Dark/Light) */}
          <div className="bg-white rounded-md border border-slate-200 overflow-hidden shadow-lg group">
            <div className="relative overflow-hidden">
              <div
                className="absolute inset-0 z-0 opacity-40 pointer-events-none"
                style={{
                  backgroundImage: `url("https://res.cloudinary.com/dew39kqhy/image/upload/v1778841510/ChatGPT_Image_15_Mei_2026_17.37.07_obhnjw.png")`,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                }}
              />
              <button
                onClick={() => setIsOtherSettingsOpen(!isOtherSettingsOpen)}
                className="relative z-10 w-full flex items-center justify-between p-6 hover:bg-black/5 transition-colors text-left"
              >
                <div className="flex items-center gap-4">
                  <div className="w-8 h-8 flex items-center justify-center">
                    <img
                      src="https://cdn-icons-png.flaticon.com/128/2782/2782949.png"
                      alt="Settings"
                      className="w-6 h-6 object-contain"
                    />
                  </div>
                  <div>
                    <h3 className="text-[11px] font-bold text-slate-800 tracking-widest uppercase">
                      Pengaturan lainnya
                    </h3>
                    <p className="text-[8px] font-normal text-slate-500 mt-0.5">
                      Tampilan dan kustomisasi portal
                    </p>
                  </div>
                </div>
                {isOtherSettingsOpen ? (
                  <ChevronUp size={16} className="text-slate-400" />
                ) : (
                  <ChevronDown size={16} className="text-slate-400" />
                )}
              </button>
            </div>

            {isOtherSettingsOpen && (
              <div className="overflow-hidden border-t border-slate-100">
                <div className="p-6 space-y-4 bg-white">
                  <div className="flex items-center justify-between py-3.5 px-5 bg-slate-50 rounded-md border border-slate-100 shadow-sm opacity-40 grayscale blur-[0.5px]">
                    <div className="flex items-center gap-3">
                      <div
                        className={cn(
                          "p-1.5 rounded-md bg-slate-100 text-slate-300",
                        )}
                      >
                        {isDarkMode ? <Moon size={14} /> : <Sun size={14} />}
                      </div>
                      <p className="text-[10px] font-bold text-slate-600 tracking-wide">
                        Tampilan Gelap
                      </p>
                    </div>
                  </div>

                  {isAdminSession && (
                    <div className="flex items-center justify-between py-3.5 px-5 bg-slate-50 rounded-md border border-slate-100 shadow-sm">
                      <div className="flex items-center gap-3">
                        <div className="p-1.5 rounded-md bg-amber-100 text-amber-600">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="14"
                            height="14"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                            <circle cx="12" cy="12" r="3" />
                          </svg>
                        </div>
                        <p className="text-[10px] font-bold text-slate-600 tracking-wide">
                          Total Kunjungan Web
                        </p>
                      </div>
                      <p className="text-xs font-black text-slate-800">
                        {sysSettings.totalViews.toLocaleString("id-ID")}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Improved Footer Actions Layout */}
        <div className="mt-16 flex flex-col items-center gap-10">
          {/* Warning Message Box - Simple Text */}
          <div className="text-center">
            <p className="text-[10px] text-slate-400 leading-relaxed font-normal tracking-widest max-w-[280px] mx-auto">
              Peringatan: Nama dan NIM hanya dapat diubah melalui database pusat
              Vektorion. Harap hubungi{" "}
              <a
                href="https://wa.me/6288291298977?text=Halo%20Admin%2C%20saya%20ingin%20mengajukan%20perubahan%20data%20Nama/NIM%20saya%20di%20Vektorion."
                target="_blank"
                rel="noopener noreferrer"
                className="text-amber-500 font-bold hover:underline"
              >
                Admin
              </a>{" "}
              jika terdapat kekeliruan data profil.
            </p>
          </div>

          <div className="flex flex-col items-center justify-center min-h-[100px]">
            {showLogoutConfirm ? (
              <div className="flex items-center gap-3">
                <button
                  onClick={async () => {
                    await logout();
                    setShowLogoutConfirm(false);
                    navigate("/home");
                  }}
                  className="px-6 py-3 bg-red-500 text-white text-[10px] font-black uppercase tracking-widest rounded-sm active:scale-95 transition-all shadow-lg shadow-red-500/20 cursor-pointer"
                >
                  Konfirmasi Keluar
                </button>
                <button
                  onClick={() => setShowLogoutConfirm(false)}
                  className="px-6 py-3 bg-slate-100 text-slate-500 text-[10px] font-black uppercase tracking-widest rounded-sm active:scale-95 transition-all border border-slate-200 cursor-pointer"
                >
                  Batal
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowLogoutConfirm(true)}
                className="flex items-center gap-2.5 py-4 px-10 text-[10px] font-black text-slate-400 hover:text-red-500 uppercase tracking-[0.3em] transition-all group active:scale-95 cursor-pointer"
              >
                <LogOut
                  size={16}
                  className="group-hover:-translate-x-1 transition-transform"
                />
                Keluar akun
              </button>
            )}
          </div>
        </div>

        {/* Modern Fade Toast Notification */}
        {toast && (
          <div className="fixed bottom-6 md:bottom-12 left-1/2 -translate-x-1/2 z-[200] pointer-events-none">
            <div
              style={{ animation: "toastFadeIn 0.3s ease-out" }}
              className={cn(
                "px-5 py-2.5 rounded-sm shadow-xl border backdrop-blur-md flex items-center gap-3 bg-white/95 text-slate-800",
                toast.type === "success"
                  ? "border-slate-200"
                  : "border-red-200",
              )}
            >
              {toast.type === "success" ? (
                <CheckCircle2 size={13} className="text-emerald-500" />
              ) : (
                <AlertCircle size={13} className="text-red-500" />
              )}
              <span className="text-[10px] font-bold tracking-wide whitespace-nowrap">
                {toast.text}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
