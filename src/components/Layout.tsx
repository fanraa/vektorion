import { ReactNode, useState, useEffect, useRef } from "react";
import { NavLink, Link, useLocation, useNavigate } from "react-router-dom";
import {
  Home,
  Network,
  Wallet,
  Bell,
  LogIn,
  LogOut,
  Menu,
  X,
  FileText,
  Clock,
  ArrowUpRight,
  ArrowDownLeft,
  ArrowLeft,
  Download,
  Plus,
  Upload,
  Search,
  CheckCircle2,
  XCircle,
  Users,
  Calendar,
  ChevronDown,
  Info as InfoIcon,
  Image as ImageIcon,
  MapPin,
  User as UserIcon,
} from "lucide-react";
import { cn } from "../lib/utils";
import { useAuth } from "../lib/AuthContext";
import {
  listenToRealTimeNotifications,
  triggerLocalSystemNotification,
  WebNotification,
  getNotificationPermission,
  requestNotificationPermission,
  clearPWABadge,
} from "../lib/NotificationService";

import { db } from "../lib/firebase";
import { doc, onSnapshot, setDoc, serverTimestamp } from "firebase/firestore";
import { Pencil, Loader2, Save } from "lucide-react";

import { useNavbar } from "../lib/NavbarContext";

import { Helmet } from "react-helmet-async";

const LOGO_URL =
  "https://res.cloudinary.com/dew39kqhy/image/upload/v1778155257/BackgroundEraser_20260507_190027268_bc5p07.png";

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const mobileMenuRef = useRef<HTMLDivElement>(null);
  const { user, profile, logout } = useAuth();
  const { isNavbarVisible } = useNavbar();
  const [activeToast, setActiveToast] = useState<WebNotification | null>(null);
  const [showNotifPermissionPrompt, setShowNotifPermissionPrompt] =
    useState(false);

  // Unified Page Title based on route
  const getPageTitle = () => {
    const titles: Record<string, string> = {
      "/home": "Home",
      "/kas": "Keuangan Kas",
      "/agenda": "Agenda & Kegiatan",
      "/galeri": "Galeri Momen",
      "/info": "Info Terkini",
      "/struktur": "Struktur Organisasi",
      "/profile": "Profil Saya",
      "/login": "Login Portal",
      "/terms": "Terms of Service",
      "/privacy": "Privacy Policy",
    };
    const title = titles[location.pathname] || "Vektorion";
    return title === "Vektorion" ? title : `${title} | Vektorion`;
  };

  // Footer state
  const [footerData, setFooterData] = useState({
    title: "VEKTORION",
    subtitle: "Physics ITERA 2025",
    copyright: "© 2026 VEKTORION. All rights reserved.",
  });
  const [isFooterEditing, setIsFooterEditing] = useState(false);
  const [footerForm, setFooterForm] = useState(footerData);
  const [savingFooter, setSavingFooter] = useState(false);
  const [myStatus, setMyStatus] = useState<"normal" | "green" | "red">(
    "normal",
  );

  useEffect(() => {
    if (!profile?.nim) return;
    const unsubscribeStatuses = onSnapshot(
      doc(db, "struktur_organisasi", "main"),
      (docSnap) => {
        if (profile.nim === "125110001" || profile.nim === "125110014") {
          setMyStatus("red");
        } else if (docSnap.exists() && docSnap.data().memberStatuses) {
          setMyStatus(docSnap.data().memberStatuses[profile.nim] || "normal");
        }
      },
    );
    return () => unsubscribeStatuses();
  }, [profile?.nim]);

  const isAdmin =
    profile?.role === "admin" ||
    user?.email === "irfanrizkiaditribusiness@gmail.com" ||
    user?.email === "irfanrizkiaditricreator@gmail.com" ||
    user?.email === "admin@vektorion.com";

  useEffect(() => {
    const footerRef = doc(db, "footerConfigs", "main");
    const unsubscribe = onSnapshot(
      footerRef,
      (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          setFooterData({
            title: data.title || "VEKTORION",
            subtitle: data.subtitle || "Physics ITERA 2025",
            copyright:
              data.copyright || "© 2026 VEKTORION. All rights reserved.",
          });
          setFooterForm({
            title: data.title || "VEKTORION",
            subtitle: data.subtitle || "Physics ITERA 2025",
            copyright:
              data.copyright || "© 2026 VEKTORION. All rights reserved.",
          });
        }
      },
      (error) => {
        console.error("Layout footer error:", error);
      },
    );
    return () => unsubscribe();
  }, []);

  const handleSaveFooter = async () => {
    setSavingFooter(true);
    try {
      const footerRef = doc(db, "footerConfigs", "main");
      await setDoc(
        footerRef,
        {
          ...footerForm,
          updatedAt: serverTimestamp(),
        },
        { merge: true },
      );
      setIsFooterEditing(false);
    } catch (err) {
      console.error("Error saving footer:", err);
    } finally {
      setSavingFooter(false);
    }
  };

  const [showCookieConsent, setShowCookieConsent] = useState(false);

  useEffect(() => {
    // Check cookie consent
    const hasConsent = localStorage.getItem("vektorion_cookie_consent");
    if (!hasConsent) {
      setShowCookieConsent(true);
    }

    // Track visitor page view once per session
    if (!sessionStorage.getItem("vektorion_view_tracked")) {
      sessionStorage.setItem("vektorion_view_tracked", "true");
      fetch("/api/stats/view", { method: "POST" }).catch(() => {});
    }
  }, []);

  const acceptCookies = () => {
    localStorage.setItem("vektorion_cookie_consent", "true");
    setShowCookieConsent(false);
  };

  // Check mobile on mount and resize
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const checkSize = () => {
      setIsMobile(window.innerWidth < 768);
      setIsDesktop(window.innerWidth >= 1024);
    };
    checkSize();
    window.addEventListener("resize", checkSize);
    return () => window.removeEventListener("resize", checkSize);
  }, []);

  // Perbaikan Scroll Lock saat sidebar terbuka
  useEffect(() => {
    if (isSidebarOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isSidebarOpen]);

  const allNavItems = [
    {
      path: "/home",
      label: "Home",
      icon: "https://cdn-icons-png.flaticon.com/128/10408/10408607.png",
    },
    {
      path: "/struktur",
      label: "Struktur",
      icon: "https://cdn-icons-png.flaticon.com/128/4871/4871527.png",
    },
    {
      path: "/kas",
      label: "Kas",
      icon: "https://cdn-icons-png.flaticon.com/128/10692/10692615.png",
    },
    {
      path: "/agenda",
      label: "Agenda",
      icon: "https://cdn-icons-png.flaticon.com/128/14490/14490440.png",
    },
    {
      path: "/galeri",
      label: "Galeri",
      icon: "https://cdn-icons-png.flaticon.com/128/13051/13051386.png",
    },
    {
      path: "/info",
      label: "Info",
      icon: "https://cdn-icons-png.flaticon.com/128/9479/9479228.png",
    },
  ];

  const isHomePage = location.pathname === "/home" || location.pathname === "/";
  const isTransparentPage =
    isHomePage ||
    location.pathname === "/galeri" ||
    location.pathname === "/info";
  const isAuthPage = location.pathname === "/login";

  // Handle scroll lock for modal
  useEffect(() => {
    if (showLogoutConfirm) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [showLogoutConfirm]);

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Scroll to top on route change
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  // Close mobile menu on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        mobileMenuRef.current &&
        !mobileMenuRef.current.contains(event.target as Node)
      ) {
        setIsSidebarOpen(false);
      }
    };

    if (isSidebarOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isSidebarOpen]);

  // Close everything on location change
  useEffect(() => {
    setIsSidebarOpen(false);
    clearPWABadge();
  }, [location.pathname]);

  // Handle Fullscreen on 'F' key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeElement = document.activeElement;
      const isInput =
        activeElement instanceof HTMLInputElement ||
        activeElement instanceof HTMLTextAreaElement ||
        activeElement?.hasAttribute("contenteditable");

      if (e.key.toLowerCase() === "f" && !isInput) {
        if (!document.fullscreenElement) {
          document.documentElement.requestFullscreen().catch((err) => {
            console.error(
              `Error attempting to enable fullscreen: ${err.message}`,
            );
          });
        } else {
          if (document.exitFullscreen) {
            document.exitFullscreen();
          }
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Listen to Firestore real-time notifications multicast and trigger native + web UI toasts
  useEffect(() => {
    // Standard setup: show our custom in-app notification prompt after user logs in
    if (user) {
      setTimeout(() => {
        const hasDismissed =
          localStorage.getItem("vektorion_notif_prompt_dismissed") === "true";
        if (getNotificationPermission() === "default" && !hasDismissed) {
          setShowNotifPermissionPrompt(true);
        }
      }, 6000);
    }

    const unsubscribeNotifications = listenToRealTimeNotifications((notif) => {
      // 1. Fire native service worker notification (handles background / mobile sleep state)
      triggerLocalSystemNotification(notif.title, notif.body, notif.linkUrl);

      // 2. Play subtle modern UI click or signal sound if supported (optional/silent)
      if ("vibrate" in navigator) {
        navigator.vibrate([100, 50, 100]);
      }

      // 3. Render a beautiful center-bottom UI toast with rule 5 spec
      setActiveToast(notif);
    });

    return () => {
      unsubscribeNotifications();
    };
  }, [user]);

  if (isAuthPage) return <>{children}</>;

  const headerTransparent = isTransparentPage && !scrolled && !isSidebarOpen;

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 font-sans overflow-x-hidden flex flex-col">
      <Helmet>
        <title>{getPageTitle()}</title>
        <link rel="icon" type="image/png" href={LOGO_URL} />
      </Helmet>
      {/* Top Navigation Bar */}
      {isNavbarVisible && (
        <header
          className={cn(
            "fixed top-0 z-50 w-full transition-all duration-300 ease-in-out",
            headerTransparent
              ? "bg-transparent border-transparent py-2"
              : "bg-white/95 backdrop-blur-md py-0 shadow-md",
          )}
        >
          <div className="container mx-auto px-4 h-14 flex items-center justify-between">
            <Link to="/home" className="flex items-center gap-3 group">
              <img
                src={LOGO_URL}
                alt="Vektorion"
                className="w-8 h-8 md:w-9 md:h-9 object-contain transition-transform"
              />
              <span
                className={cn(
                  "text-base md:text-lg font-bold tracking-widest leading-none transition-colors duration-500",
                  headerTransparent ? "text-white" : "text-slate-900",
                )}
              >
                VEKTOR<span className="text-amber-500">ION</span>
              </span>
            </Link>

            {/* Desktop Nav - Expanded and Responsive */}
            <nav className="hidden md:flex items-center lg:gap-1">
              {allNavItems.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) =>
                    cn(
                      "px-3 lg:px-4 py-2 text-[10px] lg:text-[11px] font-bold tracking-wide transition-all duration-300 relative group shrink-0",
                      isActive
                        ? "text-amber-500"
                        : headerTransparent
                          ? "text-white hover:text-amber-400"
                          : "text-slate-500 hover:text-slate-900",
                    )
                  }
                >
                  {item.label}
                  <span className="absolute bottom-1 left-3 lg:left-4 right-3 lg:right-4 h-[1.5px] bg-amber-500 scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left" />
                </NavLink>
              ))}

              {user ? (
                <Link
                  to="/profile"
                  className={cn(
                    "ml-2 lg:ml-4 flex items-center gap-2 transition-all duration-300 active:scale-95",
                    // Box style ONLY on Full Desktop (lg)
                    isDesktop
                      ? "px-3 py-1.5 rounded-md border border-white/30 shadow-xl bg-[#f59e0b] text-white"
                      : headerTransparent
                        ? "text-white"
                        : "text-slate-900",
                  )}
                  style={
                    isDesktop
                      ? {
                          backgroundImage: `url("https://res.cloudinary.com/dew39kqhy/image/upload/v1778844203/ChatGPT_Image_15_Mei_2026_18.22.55_znq6au.png")`,
                          backgroundSize: "cover",
                          backgroundPosition: "center",
                          backgroundRepeat: "no-repeat",
                          opacity: 1,
                        }
                      : {}
                  }
                >
                  <div
                    className={cn(
                      "w-6 h-6 rounded-full overflow-hidden ring-2",
                      myStatus === "green"
                        ? "ring-green-400"
                        : myStatus === "red"
                          ? "ring-red-500"
                          : "ring-white/30",
                      isDesktop
                        ? "bg-white"
                        : !headerTransparent
                          ? "bg-slate-200"
                          : "bg-white",
                    )}
                  >
                    {profile?.photoURL ? (
                      <img
                        src={profile.photoURL}
                        alt={profile.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div
                        className={cn(
                          "w-full h-full flex items-center justify-center",
                          isDesktop
                            ? "text-amber-500"
                            : !headerTransparent
                              ? "text-slate-400"
                              : "text-amber-500",
                        )}
                      >
                        <UserIcon size={14} />
                      </div>
                    )}
                  </div>
                  <span
                    className={cn(
                      "text-[10px] font-bold tracking-widest hidden lg:block uppercase",
                      isDesktop ? "text-white" : "",
                    )}
                  >
                    Profil
                  </span>
                </Link>
              ) : (
                <Link
                  to="/login"
                  className={cn(
                    "ml-2 lg:ml-4 transition-all duration-300 active:scale-95 whitespace-nowrap",
                    // Always show box for Login in Navbar (not mobile)
                    "px-4 py-1.5 text-[10px] font-bold tracking-widest text-white rounded-md shadow-xl bg-[#f59e0b] border border-white/30",
                  )}
                  style={{
                    backgroundImage: `url("https://res.cloudinary.com/dew39kqhy/image/upload/v1778844203/ChatGPT_Image_15_Mei_2026_18.22.55_znq6au.png")`,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                    backgroundRepeat: "no-repeat",
                    opacity: 1,
                  }}
                >
                  LOGIN
                </Link>
              )}
            </nav>

            {/* Mobile Menu Button */}
            <button
              className={cn(
                "md:hidden p-2 transition-colors duration-300 rounded-md",
                headerTransparent
                  ? "text-white hover:bg-white/10"
                  : "text-slate-600 hover:bg-slate-50",
              )}
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            >
              {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>

          {/* Mobile Dropdown Menu */}
          {isSidebarOpen && (
            <div
              ref={mobileMenuRef}
              className="absolute top-[calc(100%-1px)] left-0 right-0 bg-white border-b border-slate-200 shadow-2xl md:hidden z-50 overflow-hidden"
            >
              <div className="p-2 space-y-0.5">
                {allNavItems.map((item) => (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    onClick={() => setIsSidebarOpen(false)}
                    className={({ isActive }) =>
                      cn(
                        "flex items-center gap-3 px-3 py-2.5 rounded-md text-[10px] font-bold transition-all tracking-wide",
                        isActive
                          ? "bg-amber-50 text-amber-500"
                          : "text-slate-600 hover:text-amber-500 hover:bg-slate-50",
                      )
                    }
                  >
                    <img
                      src={item.icon}
                      alt={item.label}
                      className="w-4 h-4 object-contain"
                      style={{
                        filter:
                          location.pathname === item.path
                            ? "brightness(0) saturate(100%) invert(70%) sepia(87%) saturate(583%) hue-rotate(352deg) brightness(98%) contrast(98%)"
                            : "grayscale(1) opacity(0.4)",
                      }}
                    />
                    {item.label}
                  </NavLink>
                ))}

                <NavLink
                  to="/aspirasi"
                  onClick={() => setIsSidebarOpen(false)}
                  className={({ isActive }) =>
                    cn(
                      "flex items-center gap-3 px-3 py-2.5 rounded-md text-[10px] font-bold transition-all tracking-wide",
                      isActive
                        ? "bg-amber-50 text-amber-500"
                        : "text-slate-600 hover:text-amber-500 hover:bg-slate-50",
                    )
                  }
                >
                  <img
                    src="https://cdn-icons-png.flaticon.com/128/17887/17887167.png"
                    alt="Kotak Aspirasi"
                    className="w-4 h-4 object-contain"
                    style={{
                      filter:
                        location.pathname === "/aspirasi"
                          ? "brightness(0) saturate(100%) invert(70%) sepia(87%) saturate(583%) hue-rotate(352deg) brightness(98%) contrast(98%)"
                          : "grayscale(1) opacity(0.4)",
                    }}
                  />
                  Kotak Aspirasi
                </NavLink>

                <div className="pt-2 mt-1 border-t border-slate-100 px-1 pb-2">
                  {user ? (
                    <div className="flex items-center gap-1.5">
                      <Link
                        to="/profile"
                        onClick={() => setIsSidebarOpen(false)}
                        className="flex-1 flex items-center gap-2.5 px-3 py-2 text-[10px] font-bold text-white rounded-md hover:brightness-110 transition-all tracking-widest bg-amber-500 border border-white/30 shadow-lg uppercase"
                        style={{
                          backgroundImage: `url("https://res.cloudinary.com/dew39kqhy/image/upload/v1778844203/ChatGPT_Image_15_Mei_2026_18.22.55_znq6au.png")`,
                          backgroundSize: "cover",
                          backgroundPosition: "center",
                          opacity: 1,
                        }}
                      >
                        <div
                          className={cn(
                            "w-5 h-5 rounded-full overflow-hidden bg-white ring-2",
                            myStatus === "green"
                              ? "ring-green-400"
                              : myStatus === "red"
                                ? "ring-red-500"
                                : "ring-slate-200",
                          )}
                        >
                          {profile?.photoURL ? (
                            <img
                              src={profile.photoURL}
                              alt="Me"
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-amber-500">
                              <UserIcon size={10} />
                            </div>
                          )}
                        </div>
                        Profil Saya
                      </Link>
                      <button
                        onClick={() => {
                          setIsSidebarOpen(false);
                          setShowLogoutConfirm(true);
                        }}
                        className="p-2.5 bg-red-50 text-red-500 border border-red-100 rounded-md hover:bg-red-100 transition-colors active:scale-95"
                        title="Keluar Akun"
                      >
                        <img
                          src="https://cdn-icons-png.flaticon.com/128/7175/7175366.png"
                          alt="Logout"
                          className="w-4 h-4 object-contain"
                          style={{
                            filter:
                              "brightness(0) saturate(100%) invert(26%) sepia(89%) saturate(5318%) hue-rotate(352deg) brightness(96%) contrast(106%)",
                          }}
                        />
                      </button>
                    </div>
                  ) : (
                    <Link
                      to="/login"
                      onClick={() => setIsSidebarOpen(false)}
                      className="flex items-center justify-center gap-3 px-4 py-2.5 text-[10px] font-bold text-white rounded-md hover:brightness-110 transition-all tracking-widest bg-amber-500 border border-white/30 shadow-lg uppercase"
                      style={{
                        backgroundImage: `url("https://res.cloudinary.com/dew39kqhy/image/upload/v1778844203/ChatGPT_Image_15_Mei_2026_18.22.55_znq6au.png")`,
                        backgroundSize: "cover",
                        backgroundPosition: "center",
                        opacity: 1,
                      }}
                    >
                      Login Portal
                    </Link>
                  )}
                </div>
              </div>
            </div>
          )}
        </header>
      )}

      {/* Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
          <div
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            onClick={() => setShowLogoutConfirm(false)}
          />
          <div className="bg-white w-full max-w-[280px] rounded-lg overflow-hidden shadow-2xl relative z-10 p-6 text-center">
            <div className="w-12 h-12 bg-red-50 rounded-md flex items-center justify-center mx-auto mb-4">
              <LogOut size={20} className="text-red-500" />
            </div>
            <h3 className="text-[11px] font-black text-slate-900 uppercase tracking-widest mb-2">
              Konfirmasi Keluar
            </h3>
            <p className="text-[10px] text-slate-500 font-medium leading-relaxed mb-6">
              Apakah kamu yakin ingin keluar dari portal Vektorion?
            </p>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setShowLogoutConfirm(false)}
                className="py-3 bg-slate-100 text-slate-500 rounded-xl font-bold uppercase text-[9px] tracking-widest hover:bg-slate-200 transition-all"
              >
                Batal
              </button>
              <button
                onClick={async () => {
                  await logout();
                  setShowLogoutConfirm(false);
                  navigate("/home");
                }}
                className="py-3 bg-red-500 text-white rounded-xl font-bold uppercase text-[9px] tracking-widest hover:bg-red-600 transition-all shadow-lg shadow-red-500/20"
              >
                Keluar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 w-full relative">
        <div>{children}</div>
      </main>

      {/* Professional Compact Footer */}
      {isNavbarVisible && (
        <footer className="mt-auto relative overflow-hidden">
          {/* Background Image with 90% opacity and gradient to blend */}
          <div className="absolute inset-0 z-0">
            <div
              className="absolute inset-0 opacity-90"
              style={{
                backgroundImage: `url("https://res.cloudinary.com/dew39kqhy/image/upload/v1778843413/ChatGPT_Image_15_Mei_2026_18.09.54_uxj1s8.png")`,
                backgroundSize: "cover",
                backgroundPosition: "bottom",
              }}
            />
            {/* Gradient to blend with content above (using slate-50 to match layout background) */}
            <div className="absolute inset-0 bg-gradient-to-b from-slate-50 via-slate-50/80 to-transparent" />
          </div>

          <div className="container mx-auto px-4 py-20 relative z-10">
            <div className="flex flex-col items-center gap-8">
              <Link
                to="/home"
                className="flex flex-col items-center gap-4 group"
              >
                <img
                  src={LOGO_URL}
                  alt="Vektorion"
                  className="w-12 h-12 object-contain transition-transform"
                />
                <div className="flex flex-col items-center relative">
                  {isAdmin && !isFooterEditing && (
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        setIsFooterEditing(true);
                      }}
                      className="absolute -right-8 top-1/2 -translate-y-1/2 p-2 text-slate-400 hover:text-amber-500 transition-colors"
                    >
                      <Pencil size={14} />
                    </button>
                  )}
                  {isFooterEditing ? (
                    <div className="space-y-4 w-full max-w-xs bg-white/40 p-4 rounded-md backdrop-blur-md border border-white/50 shadow-xl">
                      <div className="space-y-2">
                        <label className="text-[8px] font-black uppercase text-slate-400 tracking-widest">
                          Judul
                        </label>
                        <input
                          value={footerForm.title}
                          onChange={(e) =>
                            setFooterForm({
                              ...footerForm,
                              title: e.target.value,
                            })
                          }
                          className="w-full text-sm font-bold bg-white/50 border-none focus:ring-1 focus:ring-amber-500 p-2 rounded-sm"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[8px] font-black uppercase text-slate-400 tracking-widest">
                          Subtitle
                        </label>
                        <input
                          value={footerForm.subtitle}
                          onChange={(e) =>
                            setFooterForm({
                              ...footerForm,
                              subtitle: e.target.value,
                            })
                          }
                          className="w-full text-[10px] font-medium bg-white/50 border-none focus:ring-1 focus:ring-amber-500 p-2 rounded-sm"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[8px] font-black uppercase text-slate-400 tracking-widest">
                          Copyright
                        </label>
                        <input
                          value={footerForm.copyright}
                          onChange={(e) =>
                            setFooterForm({
                              ...footerForm,
                              copyright: e.target.value,
                            })
                          }
                          className="w-full text-[9px] bg-white/50 border-none focus:ring-1 focus:ring-amber-500 p-2 rounded-sm"
                        />
                      </div>
                      <div className="flex gap-2 pt-2">
                        <button
                          disabled={savingFooter}
                          onClick={handleSaveFooter}
                          className="flex-1 py-2 bg-slate-900 text-white rounded-md text-[8px] font-black uppercase tracking-widest flex items-center justify-center gap-2"
                        >
                          {savingFooter ? (
                            <Loader2 size={10} className="animate-spin" />
                          ) : (
                            <Save size={10} />
                          )}
                          Simpan
                        </button>
                        <button
                          onClick={() => setIsFooterEditing(false)}
                          className="flex-1 py-2 bg-white text-slate-900 border border-slate-200 rounded-md text-[8px] font-black uppercase tracking-widest"
                        >
                          Batal
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <span className="text-xl font-bold tracking-widest leading-none text-slate-900">
                        {footerData.title}
                      </span>
                      <span className="text-[10px] font-medium text-slate-500 tracking-[0.3em] mt-2 text-center">
                        {footerData.subtitle}
                      </span>
                    </>
                  )}
                </div>
              </Link>

              {/* Legal Links - Softer styling as requested */}
              <div className="flex items-center gap-12 justify-center">
                <Link
                  to="/privacy"
                  className="text-slate-500 hover:text-amber-500 text-[9px] font-medium tracking-widest transition-colors"
                >
                  Privacy Policy
                </Link>
                <Link
                  to="/terms"
                  className="text-slate-500 hover:text-amber-500 text-[9px] font-medium tracking-widest transition-colors"
                >
                  Terms of Service
                </Link>
              </div>

              <div className="flex items-center justify-center w-full">
                <p className="text-slate-400 text-[9px] font-normal tracking-[0.1em] text-center">
                  {footerData.copyright}
                </p>
              </div>
            </div>
          </div>
        </footer>
      )}

      {/* Cookie Consent */}
      {showCookieConsent && (
        <div className="fixed bottom-0 left-0 right-0 z-[60] bg-white border-t border-slate-200 px-4 py-4 md:px-6">
          <div className="max-w-7xl mx-auto flex items-start gap-3">
            <img
              src="https://cdn-icons-png.flaticon.com/128/3841/3841830.png"
              alt="Cookies"
              className="w-6 h-6 object-contain shrink-0 mt-0.5"
            />
            <div className="flex flex-col gap-3 flex-1 md:flex-row md:items-center md:justify-between">
              <p className="text-xs text-slate-600 leading-relaxed flex-1">
                Situs ini menggunakan cookies untuk memberikan pengalaman
                terbaik kepada Anda.
              </p>
              <div className="flex justify-end shrink-0">
                <button
                  onClick={acceptCookies}
                  className="px-6 py-2 bg-slate-900 text-white text-xs font-bold rounded-sm hover:bg-slate-800 transition-colors"
                >
                  Setuju
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Global PWA Notification Toast - Bottom Center (Rule 5 Compliant) */}
      {activeToast && (
        <div className="fixed bottom-6 left-4 right-4 md:left-1/2 md:-translate-x-1/2 md:max-w-[340px] bg-white/95 backdrop-blur-md border border-slate-200 shadow-xl z-50 p-3 rounded-sm flex gap-3 items-start text-left">
          {/* Category Icon */}
          <div className="w-7 h-7 shrink-0 flex items-center justify-center rounded-sm bg-amber-50">
            {activeToast.category === "kas" ? (
              <img
                src="https://cdn-icons-png.flaticon.com/128/10692/10692615.png"
                alt="Kas"
                className="w-4 h-4 object-contain brightness-0 saturate-100 invert-[71%] sepia-[85%] saturate-[1637%] hue-rotate-[352deg] brightness-[98%] contrast-[98%]"
              />
            ) : activeToast.category === "agenda" ? (
              <img
                src="https://cdn-icons-png.flaticon.com/128/14490/14490440.png"
                alt="Agenda"
                className="w-4 h-4 object-contain brightness-0 saturate-100 invert-[71%] sepia-[85%] saturate-[1637%] hue-rotate-[352deg] brightness-[98%] contrast-[98%]"
              />
            ) : (
              <img
                src="https://cdn-icons-png.flaticon.com/128/9479/9479228.png"
                alt="Info"
                className="w-4 h-4 object-contain brightness-0 saturate-100 invert-[71%] sepia-[85%] saturate-[1637%] hue-rotate-[352deg] brightness-[98%] contrast-[98%]"
              />
            )}
          </div>

          {/* Content text */}
          <div className="flex-1 min-w-0 space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-[6px] font-black text-amber-600 uppercase tracking-widest bg-amber-50 px-1.5 py-0.5 rounded-sm">
                {activeToast.category}
              </span>
              <span className="text-[6px] font-bold text-slate-400 capitalize">
                Oleh: {activeToast.senderName}
              </span>
            </div>
            <h4 className="text-[10px] font-black text-slate-900 tracking-tight leading-snug">
              {activeToast.title}
            </h4>
            <p className="text-[9px] text-slate-500 font-normal leading-relaxed line-clamp-2">
              {activeToast.body}
            </p>

            {/* Actions */}
            <div className="pt-1.5 flex items-center gap-3">
              <button
                onClick={() => {
                  if (activeToast.linkUrl) {
                    navigate(activeToast.linkUrl);
                  }
                  setActiveToast(null);
                }}
                className="text-[7px] font-black uppercase text-amber-600 tracking-widest hover:text-amber-700 transition-colors flex items-center gap-1 cursor-pointer"
              >
                Lihat Detail <ArrowUpRight size={8} />
              </button>
              <button
                onClick={() => setActiveToast(null)}
                className="text-[7px] font-bold uppercase text-slate-400 tracking-widest hover:text-slate-600 transition-colors cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>

          {/* Direct Close Button */}
          <button
            onClick={() => setActiveToast(null)}
            className="text-slate-400 hover:text-slate-600 transition-colors shrink-0 p-0.5 cursor-pointer"
          >
            <X size={12} />
          </button>
        </div>
      )}

      {/* Custom Notification Permission Dialog (Fanra Request) */}
      {showNotifPermissionPrompt && (
        <div className="fixed inset-0 z-[110] bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 p-6 rounded-md shadow-2xl max-w-sm w-full text-center space-y-4 relative overflow-hidden">
            {/* Subtle visual glow back */}
            <div className="absolute inset-0 z-0 opacity-[0.03] pointer-events-none bg-gradient-to-b from-amber-500 to-amber-700" />

            <div className="relative z-10 space-y-4">
              <div className="mx-auto w-12 h-12 flex items-center justify-center rounded-sm bg-amber-50 border border-amber-100 shadow-sm">
                <Bell
                  className="text-amber-500 animate-bounce"
                  size={24}
                  style={{ animationDuration: "2s" }}
                />
              </div>

              <div className="space-y-1">
                <h4 className="text-[10px] font-black text-slate-900 tracking-widest uppercase">
                  Aktifkan Notifikasi
                </h4>
                <p className="text-[9px] text-slate-500 font-normal leading-relaxed">
                  Terima info penting secara instan mengenai update pengumuman,
                  agenda kegiatan angkatan, dan tagihan kas langsung di layar HP
                  atau laptopmu.
                </p>
              </div>

              <div className="flex gap-2.5 pt-1">
                <button
                  onClick={() => {
                    localStorage.setItem(
                      "vektorion_notif_prompt_dismissed",
                      "true",
                    );
                    setShowNotifPermissionPrompt(false);
                  }}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-500 text-[8.5px] font-black uppercase tracking-wider rounded-sm transition-all"
                >
                  Nanti Saja
                </button>
                <button
                  onClick={async () => {
                    setShowNotifPermissionPrompt(false);
                    localStorage.setItem(
                      "vektorion_notif_prompt_dismissed",
                      "true",
                    );
                    try {
                      const perm = await requestNotificationPermission();
                      if (perm === "granted") {
                        triggerLocalSystemNotification(
                          "Notifikasi Berhasil Aktif! 🔔",
                          "Terima kasih! Kamu sekarang akan menerima seluruh pengumuman penting Vektorion secara real-time.",
                        );
                      }
                    } catch (err) {
                      console.error(
                        "Error requesting notification permission:",
                        err,
                      );
                    }
                  }}
                  className="flex-1 py-2.5 bg-amber-500 hover:bg-amber-600 text-white text-[8.5px] font-black uppercase tracking-wider rounded-sm transition-all shadow-md active:scale-95 cursor-pointer"
                >
                  Izinkan Notif
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
