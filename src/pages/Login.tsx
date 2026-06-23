import React, { useState, useRef } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import {
  User,
  Instagram,
  ArrowRight,
  Lock,
  ChevronLeft,
  AlertCircle,
  Search,
  Check,
  ChevronRight,
  Info,
  Loader2,
  Eye,
  EyeOff,
} from "lucide-react";
import { useAuth } from "../lib/AuthContext";
import { MEMBERS_DATA } from "../data/members";
import { cn } from "../lib/utils";
import { db } from "../lib/firebase";
import {
  collection,
  query,
  orderBy,
  limit,
  onSnapshot,
  doc,
} from "firebase/firestore";

const LOGO_URL =
  "https://res.cloudinary.com/dew39kqhy/image/upload/v1778155257/BackgroundEraser_20260507_190027268_bc5p07.png";

import { LoginSkeleton } from "../components/ui/Skeleton";

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, user } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [showGallery, setShowGallery] = useState(false);
  const [aboutTextureLoaded, setAboutTextureLoaded] = useState(false);
  const [portalTextureLoaded, setPortalTextureLoaded] = useState(false);

  React.useEffect(() => {
    const img1 = new Image();
    img1.src =
      "https://res.cloudinary.com/dew39kqhy/image/upload/v1778787225/ChatGPT_Image_15_Mei_2026_02.31.58_mbscj2.png";
    img1.onload = () => setAboutTextureLoaded(true);
    if (img1.complete) setAboutTextureLoaded(true);

    const img2 = new Image();
    img2.src =
      "https://res.cloudinary.com/dew39kqhy/image/upload/v1778785380/ChatGPT_Image_15_Mei_2026_02.02.32_rssgyk.png";
    img2.onload = () => setPortalTextureLoaded(true);
    if (img2.complete) setPortalTextureLoaded(true);
  }, []);

  const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 1024);
  const [galleryImages, setGalleryImages] = useState<string[]>([]);

  const [memberStatuses, setMemberStatuses] = useState<Record<string, string>>(
    {},
  );

  // Fetch real gallery images and member statuses from Firestore
  React.useEffect(() => {
    // ... gallery logic ...
    const q = query(
      collection(db, "gallery"),
      orderBy("createdAt", "desc"),
      limit(10),
    );
    const unsubscribeGallery = onSnapshot(q, (snapshot) => {
      const urls = snapshot.docs.map((doc) => doc.data().url).filter(Boolean);
      if (urls.length > 0) setGalleryImages(urls);
      else
        setGalleryImages([
          "https://images.unsplash.com/photo-1523050853064-96ef8b335dc4?q=80&w=600",
          "https://images.unsplash.com/photo-1524178232363-1fb2b075b655?q=80&w=600",
          "https://images.unsplash.com/photo-1517486808906-6ca8b3f04846?q=80&w=600",
          "https://images.unsplash.com/photo-1523580494863-6f3031224c94?q=80&w=600",
          "https://images.unsplash.com/photo-1491438590914-bc09fcaaf77a?q=80&w=600",
        ]);
    });

    const unsubscribeStatuses = onSnapshot(
      doc(db, "struktur_organisasi", "main"),
      (docSnap) => {
        if (docSnap.exists() && docSnap.data().memberStatuses) {
          setMemberStatuses(docSnap.data().memberStatuses);
        }
      },
    );

    return () => {
      unsubscribeGallery();
      unsubscribeStatuses();
    };
  }, []);

  // Handle image shuffling
  React.useEffect(() => {
    if (galleryImages.length < 3) return;

    // Smooth auto-rotation for the 3 slots in gallery
    const ROTATION_INTERVAL = 5000; // As requested: 5 seconds

    const t = setInterval(() => {
      setGalleryImages((prev) => {
        // Shift images for a smooth flow
        const next = [...prev];
        const last = next.pop();
        if (last) next.unshift(last);
        return next;
      });
    }, ROTATION_INTERVAL);

    return () => clearInterval(t);
  }, [galleryImages.length]);

  // Handle window resize for desktop check
  React.useEffect(() => {
    const handleResize = () => setIsDesktop(window.innerWidth >= 1024);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Handle existing session
  React.useEffect(() => {
    if (user) {
      navigate("/home");
    }
  }, [user, navigate]);
  const [selectedMember, setSelectedMember] = useState<any>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [passwordError, setPasswordError] = useState(false);
  const [userError, setUserError] = useState(false);
  const [loginAttempts, setLoginAttempts] = useState(0);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [policyAccepted, setPolicyAccepted] = useState(true);
  const [showPolicyModal, setShowPolicyModal] = useState(false);

  const isEmailValid = (email: string) => {
    return /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email);
  };

  const isAdminEmail = (email: string) => {
    const lower = email.toLowerCase().trim();
    return (
      lower === "admin@vektorion.com" ||
      lower === "irfanrizkiaditribusiness@gmail.com" ||
      lower === "irfanrizkiaditricreator@gmail.com" ||
      lower === "irfanrizkiaditri@gmail.com"
    );
  };

  const filteredMembers = MEMBERS_DATA.filter((m) => {
    const name = (m?.name || "").toLowerCase();
    const nim = m?.nim || "";
    const search = (searchTerm || "").toLowerCase();

    // Don't show if search has weird symbols
    if (/[!$%^&*()_+|~=`{}[\]:";'<>?,/]/.test(search)) return false;

    return name.includes(search) || nim.includes(search);
  }).slice(0, 5);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!policyAccepted) return;
    setUserError(false);
    setPasswordError(false);

    // Character sanitization
    const sanitizedSearch = searchTerm.replace(/[<>{}[\]\\/]/g, "").trim();

    // If user is trying to login with random long strings that don't look like email/NIM
    if (sanitizedSearch.length > 50 || password.length > 50) {
      setError("Format input tidak valid.");
      setUserError(true);
      return;
    }

    // Check if member is selected, if not try the search term
    let currentMember = selectedMember;
    const lowerSearch = searchTerm.toLowerCase().trim();

    if (!currentMember && searchTerm) {
      if (isAdminEmail(lowerSearch)) {
        currentMember = {
          name: "SYSTEM ADMIN",
          nim: "ADMIN",
          isSystemAdmin: true,
        };
      } else {
        currentMember = MEMBERS_DATA.find(
          (m) =>
            (m?.name || "").toLowerCase() === lowerSearch ||
            m?.nim === searchTerm.trim(),
        );
      }
    }

    if (!currentMember) {
      setError("Identitas tidak ditemukan.");
      setUserError(true);
      return;
    }

    if (
      !currentMember.isSystemAdmin &&
      (memberStatuses[currentMember.nim] === "red" ||
        currentMember.nim === "125110001" ||
        currentMember.nim === "125110014")
    ) {
      setError("Akun dinonaktifkan.");
      setUserError(true);
      return;
    }

    if (!password) {
      setError("Masukkan kata sandi");
      setPasswordError(true);
      return;
    }

    try {
      setError("");
      setLoading(true);

      // Artificial delay for feedback as requested
      await new Promise((resolve) => setTimeout(resolve, 1500));

      let loginId = "";
      if (currentMember.isSystemAdmin) {
        loginId = lowerSearch;
      } else {
        const firstName = (currentMember?.name || "")
          .toLowerCase()
          .split(" ")[0];
        const nim = currentMember?.nim || "";
        loginId = `${firstName}.${nim}`;

        if (nim === "125110007" || firstName === "irfan") {
          loginId = "irfan.125110007";
        }
      }

      await login(loginId, password);
      navigate("/home");
    } catch (err: any) {
      setPasswordError(true);
      if (
        err.message &&
        (err.message.includes("API key not valid") ||
          err.message.includes("remixed-api-key"))
      ) {
        setError("Sistem Firebase belum diatur.");
      } else if (
        err.code === "auth/user-not-found" ||
        err.code === "auth/invalid-credential" ||
        (err.message && err.message.includes("salah"))
      ) {
        setError("Kata sandi salah.");
      } else if (err.message && err.message.includes("terdaftar")) {
        setError("Sandi salah.");
      } else {
        setError("Kata sandi salah.");
      }
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleMemberSelect = (member: any) => {
    setSelectedMember(member);
    setSearchTerm(member.name);
    setIsSearching(false);
    setError("");
    setUserError(false);
  };

  const canSubmit =
    policyAccepted && searchTerm.length > 2 && password.length > 0;

  return (
    <div className="min-h-screen relative flex items-center justify-center p-4 overflow-hidden">
      {/* Background Image with Overlay */}
      <div
        className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat transition-transform duration-1000"
        style={{
          backgroundImage:
            'url("https://res.cloudinary.com/dew39kqhy/image/upload/v1778788561/ChatGPT_Image_15_Mei_2026_02.55.46_xomz9y.png")',
        }}
      >
        <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px]" />
      </div>

      <div className="w-full max-w-sm lg:max-w-4xl relative z-10">
        <div className="bg-white rounded-md shadow-2xl border border-slate-200 overflow-hidden relative grid grid-cols-1 lg:grid-cols-2 md:h-auto lg:h-[600px]">
          {/* STATIC CONTENT LAYER (Behind the sliding Form) */}
          {/* LEFT: About Section */}
          <div className="hidden lg:flex flex-col bg-slate-50 p-12 relative overflow-hidden">
            {!aboutTextureLoaded ? (
              <div className="flex flex-col h-full justify-center space-y-4 animate-pulse">
                <div className="h-4 w-32 bg-slate-200/80 rounded-sm mb-4" />
                <div className="space-y-3">
                  <div className="h-3 w-full bg-slate-200/80 rounded-sm" />
                  <div className="h-3 w-full bg-slate-200/80 rounded-sm" />
                  <div className="h-3 w-11/12 bg-slate-200/80 rounded-sm" />
                  <div className="h-3 w-10/12 bg-slate-200/80 rounded-sm" />
                  <div className="h-3 w-full bg-slate-200/80 rounded-sm" />
                  <div className="h-3 w-9/12 bg-slate-200/80 rounded-sm" />
                </div>
                <div className="pt-4 flex items-center gap-2">
                  <div className="w-4 h-4 bg-slate-200/80 rounded-full" />
                  <div className="h-3 w-20 bg-slate-200/80 rounded-sm" />
                </div>
              </div>
            ) : (
              <>
                <div
                  className="absolute inset-0 opacity-90 pointer-events-none"
                  style={{
                    backgroundImage: `url("https://res.cloudinary.com/dew39kqhy/image/upload/v1778787225/ChatGPT_Image_15_Mei_2026_02.31.58_mbscj2.png")`,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                  }}
                />

                {/* Top Navigation: Next */}
                <div className="absolute top-8 left-12 z-20">
                  <button
                    onClick={() => setShowGallery(true)}
                    className="text-[10px] font-bold text-slate-400 hover:text-amber-500 transition-colors uppercase tracking-widest flex items-center gap-2 group"
                  >
                    Next{" "}
                    <ChevronRight
                      size={14}
                      className="group-hover:translate-x-1 transition-transform"
                    />
                  </button>
                </div>

                <div className="flex flex-col h-full justify-center relative z-10">
                  <h2 className="text-2xl text-slate-800 tracking-tight mb-6 font-bold">
                    Tentang Vektorion
                  </h2>
                  <div className="space-y-4 text-slate-500 text-[12px] leading-relaxed">
                    <p>
                      Selamat datang di Vektorion, sistem manajemen eksklusif
                      mahasiswa Fisika Institut Teknologi Sumatera angkatan
                      2025. Platform ini hadir sebagai pusat koordinasi
                      administrasi yang memadukan transparansi data, pengelolaan
                      keuangan yang akurat, serta dokumentasi perjalanan
                      akademis dalam satu wadah digital yang terintegrasi
                      sepenuhnya.
                    </p>
                    <p>
                      Kami berkomitmen untuk mendukung setiap langkah mahasiswa
                      melalui kemudahan akses informasi dan keamanan sistem yang
                      terpusat. Vektorion bukan sekadar alat administrasi,
                      melainkan ruang kolektif bagi seluruh sivitas Fisika 2025
                      untuk tumbuh bersama dalam tatanan organisasi yang modern
                      dan profesional.
                    </p>
                  </div>

                  <div className="mt-8 flex justify-start">
                    <a
                      href="https://www.instagram.com/vektorion.25"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-slate-400 hover:text-amber-500 transition-colors group"
                    >
                      <Instagram
                        size={18}
                        className="group-hover:scale-110 transition-transform"
                      />
                      <span className="text-[10px] font-medium">
                        @vektorion.25
                      </span>
                    </a>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* RIGHT: Gallery Section */}
          <div className="hidden lg:flex flex-col bg-white p-12 relative overflow-hidden">
            {!aboutTextureLoaded ? (
              <div className="flex flex-col h-full justify-center space-y-4 animate-pulse">
                <div className="h-4 w-32 bg-slate-200/80 rounded-sm mb-1" />
                <div className="h-3 w-4/5 bg-slate-200/80 rounded-sm mb-4" />
                <div className="grid grid-cols-2 gap-3 h-[300px]">
                  <div className="space-y-3 flex flex-col h-full">
                    <div className="flex-1 bg-slate-200/80 rounded-sm" />
                    <div className="flex-1 bg-slate-200/80 rounded-sm" />
                  </div>
                  <div className="h-full bg-slate-200/80 rounded-sm" />
                </div>
              </div>
            ) : (
              <>
                <div
                  className="absolute inset-0 opacity-90 pointer-events-none"
                  style={{
                    backgroundImage: `url("https://res.cloudinary.com/dew39kqhy/image/upload/v1778787225/ChatGPT_Image_15_Mei_2026_02.31.58_mbscj2.png")`,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                  }}
                />

                {/* Top Navigation: Back */}
                <div className="absolute top-8 right-12 z-20">
                  <button
                    onClick={() => setShowGallery(false)}
                    className="text-[10px] font-bold text-slate-400 hover:text-amber-500 transition-colors uppercase tracking-widest flex items-center gap-2 group"
                  >
                    <ChevronLeft
                      size={14}
                      className="group-hover:-translate-x-1 transition-transform"
                    />{" "}
                    Back
                  </button>
                </div>

                <div className="flex flex-col h-full justify-center relative z-10">
                  <h2 className="text-2xl text-slate-800 tracking-tight mb-2 font-bold">
                    Galeri Momen
                  </h2>
                  <p className="text-slate-400 text-[10px] mb-6 leading-relaxed">
                    Dokumentasi perjalanan fisika 2025 yang merangkum setiap
                    detik kebersamaan, mulai dari kegiatan perkuliahan hingga
                    momen santai di luar kampus.
                  </p>

                  <div className="grid grid-cols-2 gap-3 h-[300px] min-h-0">
                    {/* Left Stack: 2 Landscape Images */}
                    <div className="space-y-3 flex flex-col min-h-0">
                      <div className="flex-1 bg-slate-100 rounded-sm overflow-hidden border border-slate-200 relative h-1/2">
                        <img
                          src={
                            galleryImages[0] ||
                            "https://images.unsplash.com/photo-1524178232363-1fb2b075b655?q=80&w=300"
                          }
                          className="absolute inset-0 w-full h-full object-cover grayscale-[20%] hover:grayscale-0 transition-all"
                          alt="Moment 1"
                        />
                      </div>
                      <div className="flex-1 bg-slate-100 rounded-sm overflow-hidden border border-slate-200 relative h-1/2">
                        <img
                          src={
                            galleryImages[1] ||
                            "https://images.unsplash.com/photo-1517486808906-6ca8b3f04846?q=80&w=300"
                          }
                          className="absolute inset-0 w-full h-full object-cover grayscale-[20%] hover:grayscale-0 transition-all"
                          alt="Moment 2"
                        />
                      </div>
                    </div>
                    {/* Right: 1 Portrait Image */}
                    <div className="h-full min-h-0 relative bg-slate-100 rounded-sm overflow-hidden border border-slate-200">
                      <img
                        src={
                          galleryImages[2] ||
                          "https://images.unsplash.com/photo-1523050853064-96ef8b335dc4?q=80&w=300"
                        }
                        className="absolute inset-0 w-full h-full object-cover grayscale-[20%] hover:grayscale-0 transition-all"
                        alt="Moment 3"
                      />
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* SLIDING LAYER: Login Form overlay */}
          <div
            className={cn(
              "h-full w-full bg-[#f59e0b] z-30 flex flex-col justify-center transition-transform duration-300",
              "lg:absolute lg:top-0 lg:right-0 lg:w-1/2 lg:shadow-[-10px_0_30px_rgba(0,0,0,0.05)] lg:border-l lg:border-amber-400/30",
              isDesktop && showGallery
                ? "lg:-translate-x-full"
                : "lg:translate-x-0",
            )}
          >
            {/* Toggle Arrow - REMOVED as requested */}

            {!portalTextureLoaded ? (
              <div className="p-8 md:p-10 relative z-10 w-full animate-pulse flex flex-col items-center">
                {/* Logo & title skeleton */}
                <div className="w-20 h-20 bg-white/20 rounded-sm mb-4" />
                <div className="h-5 w-28 bg-white/25 rounded-sm mb-3" />
                <div className="h-3 w-16 bg-white/10 rounded-sm mb-8" />

                {/* Form skeleton */}
                <div className="w-full max-w-xs space-y-5">
                  <div className="space-y-2">
                    <div className="h-3 w-12 bg-white/20 rounded-sm" />
                    <div className="h-10 w-full bg-white/20 rounded-sm" />
                  </div>
                  <div className="space-y-2">
                    <div className="h-3 w-16 bg-white/20 rounded-sm" />
                    <div className="h-10 w-full bg-white/20 rounded-sm" />
                  </div>
                  <div className="h-3.5 w-40 bg-white/20 rounded-sm my-4" />
                  <div className="h-11 w-full bg-white/35 rounded-sm" />
                  <div className="h-3 w-24 bg-white/20 rounded-sm self-center mx-auto mt-4" />
                  <div className="h-6 w-16 bg-white/20 rounded-full mx-auto mt-2" />
                </div>
              </div>
            ) : (
              <>
                {/* Hexagon Pattern Texture Overlay -> Changed to requested Background Image */}
                <div
                  className="absolute inset-0 opacity-100 pointer-events-none"
                  style={{
                    backgroundImage: `url("https://res.cloudinary.com/dew39kqhy/image/upload/v1778785380/ChatGPT_Image_15_Mei_2026_02.02.32_rssgyk.png")`,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                    backgroundRepeat: "no-repeat",
                    opacity: 1,
                  }}
                />

                <div className="p-8 md:p-10 relative z-10 w-full">
                  <div className="flex flex-col items-center text-center mb-8">
                    <Link to="/home" className="mb-4">
                      <img
                        src={LOGO_URL}
                        alt="Logo"
                        className="w-20 h-20 object-contain drop-shadow-md"
                      />
                    </Link>
                    <h1 className="text-3xl font-bold tracking-tighter leading-none uppercase">
                      <span className="text-slate-900">Vektor</span>
                      <span className="text-amber-500">Ion</span>
                    </h1>
                    <div className="w-12 h-1 bg-amber-500/20 mt-2" />
                    <p className="text-slate-900 text-[10px] tracking-widest mt-4 font-bold">
                      PORTAL <span className="text-amber-600">ACCESS</span>
                    </p>
                  </div>

                  <form onSubmit={handleLogin} className="space-y-5">
                    {/* Identity Search/Selection */}
                    <div className="space-y-1 relative">
                      <label className="text-[10px] text-slate-900 tracking-wider pl-1 font-black uppercase">
                        Nama
                      </label>
                      <div className="relative">
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
                          <img
                            src="https://cdn-icons-png.flaticon.com/128/1077/1077063.png"
                            alt="User"
                            className="w-4 h-4"
                            style={{
                              filter: "brightness(0) saturate(100%) invert(0%)",
                            }}
                          />
                        </div>
                        <input
                          type="text"
                          placeholder="Masukkan nama anda..."
                          value={searchTerm}
                          maxLength={50}
                          onBlur={() => {
                            setTimeout(() => {
                              setIsSearching(false);
                            }, 200);
                          }}
                          onChange={(e) => {
                            const val = e.target.value;
                            // Block weird symbols manually in input
                            const sanitized = val.replace(
                              /[!$%^&*()_+|~=`{}[\]:";'<>?,/]/g,
                              "",
                            );
                            setSearchTerm(sanitized);
                            setIsSearching(true);
                            if (selectedMember) setSelectedMember(null);
                            if (error) {
                              setError("");
                              setUserError(false);
                              setPasswordError(false);
                            }
                          }}
                          onFocus={() => setIsSearching(true)}
                          className={cn(
                            "w-full bg-white/50 border rounded-md py-3 pl-10 pr-10 text-[11px] focus:outline-none transition-all placeholder:text-slate-400 text-slate-900 shadow-sm",
                            userError
                              ? "border-red-500 ring-4 ring-red-500/10 text-slate-900"
                              : "border-slate-300 focus:ring-4 focus:ring-amber-500/10 focus:border-amber-500",
                          )}
                        />
                        {selectedMember && !isSearching && (
                          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-amber-600">
                            <Check size={16} />
                          </div>
                        )}
                        {userError && error && (
                          <div className="absolute -bottom-3.5 left-1">
                            <p className="text-[8px] text-red-600 leading-none whitespace-nowrap font-bold drop-shadow-sm">
                              {error}
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Autocomplete Dropdown */}
                      {isSearching &&
                        searchTerm.length > 0 &&
                        filteredMembers.length > 0 && (
                          <div className="absolute z-50 left-0 right-0 top-full mt-1 bg-white border border-slate-200 shadow-2xl rounded-md overflow-hidden">
                            {filteredMembers.map((member) => (
                              <button
                                key={member.nim}
                                type="button"
                                onMouseDown={(e) => {
                                  e.preventDefault();
                                  handleMemberSelect(member);
                                }}
                                className="w-full px-4 py-3 text-left hover:bg-amber-50 flex items-center justify-between border-b border-slate-50 last:border-0 transition-colors group"
                              >
                                <div className="flex flex-col">
                                  <span
                                    className={cn(
                                      "text-[10px] font-bold group-hover:text-amber-700",
                                      memberStatuses[member.nim] === "red" ||
                                        member.nim === "125110001" ||
                                        member.nim === "125110014"
                                        ? "text-red-500"
                                        : "text-slate-900",
                                    )}
                                  >
                                    {member.name}
                                  </span>
                                  <span className="text-[9px] font-medium text-slate-400">
                                    {member.nim}
                                  </span>
                                </div>
                                <ChevronRight
                                  size={14}
                                  className="text-amber-500"
                                />
                              </button>
                            ))}
                          </div>
                        )}
                    </div>

                    {/* Password Field */}
                    <div className="space-y-1">
                      <label className="text-[10px] text-slate-900 tracking-wider pl-1 font-black uppercase">
                        Kata Sandi
                      </label>
                      <div className="relative">
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
                          <img
                            src="https://cdn-icons-png.flaticon.com/128/142/142149.png"
                            alt="Lock"
                            className="w-4 h-4"
                            style={{
                              filter: "brightness(0) saturate(100%) invert(0%)",
                            }}
                          />
                        </div>
                        <input
                          type={showPassword ? "text" : "password"}
                          placeholder="••••••••"
                          value={password}
                          maxLength={50}
                          onChange={(e) => {
                            setPassword(e.target.value);
                            if (error) {
                              setError("");
                              setPasswordError(false);
                            }
                          }}
                          className={cn(
                            "w-full bg-white/50 border rounded-md py-3 pl-10 pr-10 text-[11px] focus:outline-none transition-all text-slate-900 placeholder:text-slate-400 shadow-sm",
                            passwordError
                              ? "border-red-500 ring-4 ring-red-500/10 text-slate-900"
                              : "border-slate-300 focus:ring-4 focus:ring-amber-500/10 focus:border-amber-500",
                          )}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-amber-600 transition-colors"
                        >
                          {showPassword ? (
                            <EyeOff size={16} />
                          ) : (
                            <Eye size={16} />
                          )}
                        </button>
                        {passwordError && error && (
                          <div className="absolute -bottom-3.5 left-1">
                            <p className="text-[8px] text-red-600 leading-none whitespace-nowrap font-bold drop-shadow-sm">
                              {error}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Policy Agreement */}
                    <div className="py-1 flex items-center gap-2">
                      <div
                        className={cn(
                          "w-4 h-4 rounded-sm border flex items-center justify-center transition-all cursor-pointer",
                          policyAccepted
                            ? "bg-amber-500 border-amber-600"
                            : "bg-white/50 border-slate-300",
                        )}
                        onClick={() => setPolicyAccepted(!policyAccepted)}
                      >
                        {policyAccepted && (
                          <Check size={10} className="text-white" />
                        )}
                      </div>
                      <p className="text-[9px] text-slate-900 tracking-tight font-bold">
                        Saya menyetujui{" "}
                        <button
                          type="button"
                          onClick={() => setShowPolicyModal(true)}
                          className="text-amber-600 hover:underline font-black"
                        >
                          Kebijakan Layanan
                        </button>
                      </p>
                    </div>

                    <button
                      type="submit"
                      disabled={loading || !canSubmit}
                      className="w-full py-3.5 bg-slate-900 text-white rounded-md font-bold tracking-widest text-[11px] flex items-center justify-center gap-2 hover:bg-slate-800 transition-all active:scale-[0.98] disabled:opacity-30 disabled:cursor-not-allowed shadow-xl shadow-black/20 uppercase"
                    >
                      {loading ? (
                        <Loader2
                          size={16}
                          className="animate-spin text-amber-500"
                        />
                      ) : (
                        <span className="flex items-center gap-2">
                          MASUK{" "}
                          <ArrowRight size={14} className="text-amber-500" />
                        </span>
                      )}
                    </button>

                    <div className="flex flex-col items-center gap-3 pt-2">
                      <div className="text-[9px] text-slate-900 tracking-tight font-black flex items-center gap-1 cursor-default">
                        <span>Lupa kata sandi?</span>
                        <a
                          href={`https://wa.me/6288291298977?text=${encodeURIComponent(
                            `Halo Admin Vektorion, saya lupa kata sandi akun saya.\n\n` +
                              `Nama: ${selectedMember?.name || searchTerm || "-"}\n` +
                              `NIM: ${selectedMember?.nim || "-"}\n\n` +
                              `Mohon bantuannya untuk memulihkan akses akun saya. Terima kasih.`,
                          )}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-amber-600 underline hover:text-amber-700 transition-colors"
                        >
                          Hubungi admin
                        </a>
                      </div>

                      <Link
                        to="/home"
                        className="px-6 py-2 border border-slate-900 text-slate-900 text-[9px] font-black tracking-widest rounded-full hover:bg-amber-500 hover:text-white hover:border-amber-500 transition-all active:scale-95 flex items-center gap-2 mt-2"
                      >
                        KEMBALI
                      </Link>
                    </div>
                  </form>
                </div>
              </>
            )}
          </div>
        </div>

        <div className="text-center mt-6">
          <p className="text-[10px] text-slate-900 font-black tracking-wider uppercase">
            <span className="text-slate-900">
              Physics Institute of Technology
            </span>{" "}
            <span className="text-amber-600">Sumatra</span>
          </p>
        </div>
      </div>

      {/* Policy Modal Overlay */}
      {showPolicyModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
          {/* Modal Background matching Page Background */}
          <div
            className="absolute inset-0 bg-cover bg-center bg-no-repeat"
            style={{
              backgroundImage:
                'url("https://res.cloudinary.com/dew39kqhy/image/upload/v1778784294/WhatsApp_Image_2026-05-15_at_01.43.30_slqxwy.jpg")',
            }}
          >
            <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-md" />
          </div>

          <div className="bg-white w-full max-w-sm rounded-xl overflow-hidden shadow-2xl relative z-10">
            <div className="p-8 flex flex-col items-center">
              <img
                src={LOGO_URL}
                alt="Logo"
                className="w-16 h-16 object-contain mb-4"
              />
              <h2 className="text-sm font-bold text-slate-900 tracking-tight mb-8">
                Kebijakan Vektorion
              </h2>

              <div className="w-full max-h-[250px] overflow-y-auto pr-2 text-slate-600 text-[10px] leading-relaxed text-justify space-y-4 mb-8 custom-scrollbar">
                <p>
                  Vektorion System 2.0 dirancang sebagai platform manajemen data
                  dan layanan bagi mahasiswa Fisika ITERA angkatan 2025. Dengan
                  menggunakan sistem ini, pengguna sepakat untuk menjaga
                  kerahasiaan data pribadi serta akses akun masing-masing.
                </p>
                <p>
                  Aktivitas di dalam sistem akan terekam guna memastikan
                  keamanan dan transparansi. Segala bentuk penyalahgunaan sistem
                  yang merugikan pihak lain atau melanggar integritas data dapat
                  diproses lebih lanjut sesuai dengan ketentuan yang berlaku.
                </p>
                <p>
                  Setiap data transaksi keuangan yang tercatat bersifat final
                  dan valid untuk kepentingan angkatan. Pengguna diharapkan
                  melakukan pengisian data dengan benar dan jujur demi
                  ketertiban administrasi.
                </p>
                <p>
                  Pihak pengelola berkomitmen penuh dalam melindungi privasi
                  data pengguna. Perubahan kebijakan dapat dilakukan
                  sewaktu-waktu tanpa pemberitahuan sebelumnya dan akan tetap
                  mengutamakan keamanan seluruh pengguna sistem.
                </p>
              </div>

              <button
                onClick={() => setShowPolicyModal(false)}
                className="w-full py-3.5 bg-slate-900 text-white rounded-md font-bold tracking-wide text-[10px] hover:bg-slate-800 transition-all active:scale-[0.98]"
              >
                Mengerti
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
