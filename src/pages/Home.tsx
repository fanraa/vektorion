import React, { useRef, useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { 
  Users, 
  Wallet, 
  Calendar, 
  Clock,
  ArrowRight,
  Image as ImageIcon,
  Info as InfoIcon,
  FlaskConical,
  Bell,
  Loader2,
  CheckCircle2,
  AlertCircle,
  User,
  Zap,
  Send
} from 'lucide-react';
import { cn } from '../lib/utils';
import { MEMBERS_DATA } from '../data/members';
import { db, auth, handleFirestoreError, OperationType } from '../lib/firebase';
import { collection, query, orderBy, limit, onSnapshot, addDoc, serverTimestamp, doc, getDoc } from 'firebase/firestore';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { MaintenanceGuard } from '../components/MaintenanceGuard';
import { motion, AnimatePresence } from 'motion/react';
import { HomeSkeleton } from '../components/ui/Skeleton';

import { OptimizedImage } from '../components/ui/OptimizedImage';

const DEFAULT_HERO_IMG = "https://res.cloudinary.com/dew39kqhy/image/upload/v1778154506/IMG-20260426-WA0044_vacsll.jpg";
const DEFAULT_AGENDA_IMG = "https://res.cloudinary.com/dew39kqhy/image/upload/v1778154506/IMG-20260426-WA0044_vacsll.jpg";
const DEFAULT_FOOTER_IMG = "https://res.cloudinary.com/dew39kqhy/image/upload/v1778154506/IMG-20260426-WA0044_vacsll.jpg";
const CONTACT_IMG = "https://res.cloudinary.com/dew39kqhy/image/upload/v1778700411/ChatGPT_Image_14_Mei_2026_02.26.25_nx3u4o.png";

const DEFAULT_GALLERY_IMAGES = [
  "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?auto=format&fit=crop&q=80&w=600",
  "https://images.unsplash.com/photo-1532187863486-abf9d39d99c5?auto=format&fit=crop&q=80&w=600",
  "https://images.unsplash.com/photo-1507413245164-6160d8298b31?auto=format&fit=crop&q=80&w=600",
  "https://images.unsplash.com/photo-1517048676732-d65bc937f952?auto=format&fit=crop&q=80&w=600",
  "https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&q=80&w=600",
];

// Special pools of sentences for Interstitial sections
const TEXT_POOL_1 = [
  "Setiap langkah yang kita ambil adalah bagian dari arah yang sedang kita tuju bersama, menciptakan ritme dalam koordinasi yang harmonis untuk mencapai hasil yang lebih bermakna.",
  "Arah yang selaras membawa kita melampaui batas individualitas, menyatukan visi dalam setiap derap langkah yang nyata.",
  "Sinkronisasi tujuan adalah kunci utama dalam membangun fondasi yang kokoh untuk masa depan kita bersama.",
  "Dalam kebersamaan, setiap tantangan menjadi peluang untuk membuktikan bahwa satu arah adalah kekuatan yang tak terhentikan.",
  "Membangun momentum melalui kolaborasi yang tulus akan membawa kita pada pencapaian yang melampaui ekspektasi.",
  "Energi kolektif kita adalah pendorong utama yang mengubah imajinasi menjadi realitas yang berkelanjutan.",
  "Keselarasan dalam bertindak mencerminkan kedewasaan visi yang kita pegang teguh bersama.",
  "Setiap kontribusi sekecil apapun adalah bagian dari resultan besar yang kita bentuk hari ini.",
  "Kekuatan sebuah angkatan terletak pada kemampuan kita untuk saling melengkapi dalam satu tujuan.",
  "Melalui kebersamaan, kita mendefinisikan ulang apa yang mungkin dicapai melalui satu koordinasi."
];

const TEXT_POOL_2 = [
  "Momen-momen kecil yang kita lalui seringkali menjadi bukti nyata dari sebuah perjalanan panjang, menyimpan pesan tersurat dalam setiap tawa dan kerja keras yang telah kita dedikasikan.",
  "Setiap detik yang kita habiskan bersama adalah goresan sejarah yang akan kita kenang sebagai masa-masa paling produktif.",
  "Keberhasilan bukan hanya tentang tujuan akhir, tapi tentang cerita-cerita yang kita bangun di sepanjang jalan.",
  "Dokumentasi ini adalah jendela menuju kenangan, pengingat akan semangat yang pernah kita nyalakan bersama.",
  "Jejak yang kita tinggalkan hari ini akan menjadi inspirasi bagi mereka yang akan datang setelah kita.",
  "Mensyukuri setiap perjumpaan dan proses adalah cara terbaik untuk menghormati waktu yang telah kita lalui.",
  "Setiap foto menyimpan ribuan kata yang menceritakan perjuangan dan kegembiraan kita.",
  "Dalam setiap aksi nyata, terdapat dedikasi yang tak terlihat namun terasa kuat di hati.",
  "Kenangan adalah pengikat yang membuat persaudaraan kita tetap kuat seiring berjalannya waktu.",
  "Mari kita hargai setiap langkah, karena di situlah makna sejati dari sebuah keluarga angkatan berada."
];

const TEXT_POOL_3 = [
  "Suara dan aspirasi adalah energi yang menggerakkan kita untuk terus berkembang, karena kolaborasi sejati dimulai dari sebuah komunikasi yang terbuka dan saling mendukung satu sama lain.",
  "Setiap masukan adalah benih pertumbuhan yang akan memperkuat ikatan kita dalam menghadapi dinamika masa depan.",
  "Keterbukaan hati dan pikiran membuka pintu bagi inovasi yang tak terbatas dalam lingkungan kita.",
  "Sinergi tercipta saat setiap suara diberi ruang untuk dihargai dan setiap ide diberi kesempatan untuk tumbuh.",
  "Mari terus menjaga dialog yang konstruktif demi kemajuan yang bisa dirasakan oleh seluruh elemen angkatan.",
  "Aspirasi anda adalah peta jalan bagi kami untuk melayani dengan lebih baik dan transparan.",
  "Bersama kita membangun budaya apresiasi di mana setiap kontribusi positif mendapatkan tempatnya.",
  "Komunikasi yang efektif adalah jembatan yang menghubungkan mimpi-mimpi kita menjadi aksi nyata.",
  "Jangan ragu untuk berbagi, karena setiap kata anda memiliki potensi untuk membawa perubahan.",
  "Kekuatan kita ada pada kejujuran dalam berbagi dan kerendahan hati dalam mendengarkan."
];

// Global lock to ensure only one TypewriterText types at a time
let globalTypingLock = false;

// Special component for typing animation with layout stability
const TypewriterText = ({ textPool }: { textPool: string[] }) => {
  const [textIndex, setTextIndex] = useState(0);
  const [displayedText, setDisplayedText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [canReset, setCanReset] = useState(true);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const cooldownRef = useRef<NodeJS.Timeout | null>(null);

  const startTyping = (bypassLock = false) => {
    // Only start if not already typing AND (NO ONE ELSE in the world is typing OR we bypass)
    if (isTyping || (!bypassLock && globalTypingLock)) return;
    
    if (!bypassLock) globalTypingLock = true;
    setIsTyping(true);
    setDisplayedText("");
    
    // Pick current text from pool and wrap in quotes
    const rawText = textPool[textIndex];
    const currentText = `"${rawText}"`;
    let currentIdx = 0;
    
    if (timerRef.current) clearInterval(timerRef.current);
    
    timerRef.current = setInterval(() => {
      if (currentIdx < currentText.length) {
        setDisplayedText(currentText.slice(0, currentIdx + 1));
        currentIdx++;
      } else {
        if (timerRef.current) clearInterval(timerRef.current);
        setIsTyping(false);
        if (!bypassLock) globalTypingLock = false;
        // Cycle to next text for next time
        setTextIndex((prev) => (prev + 1) % textPool.length);
      }
    }, 25); // Slightly faster for better feel
  };

  useEffect(() => {
    // Always type on initial load, ignoring the global lock
    const timeout = setTimeout(() => {
      startTyping(true);
    }, 1000);

    return () => {
      clearTimeout(timeout);
      if (timerRef.current) clearInterval(timerRef.current);
      if (cooldownRef.current) clearTimeout(cooldownRef.current);
      if (isTyping) globalTypingLock = false;
    };
  }, []);

  const handleMouseEnter = () => {
    if (!isTyping && !globalTypingLock && canReset) {
      setCanReset(false);
      startTyping();
      
      // Cooldown to prevent spamming
      cooldownRef.current = setTimeout(() => {
        setCanReset(true);
      }, 5000); 
    }
  };

  // Find longest text in pool for layout stability, including quotes
  const longestText = useMemo(() => {
    const longest = textPool.reduce((a, b) => a.length > b.length ? a : b);
    return `"${longest}"`;
  }, [textPool]);

  return (
    <div 
      className="relative cursor-default py-2"
      onMouseEnter={handleMouseEnter}
    >
      {/* Invisible text block to preserve layout height and width based on the longest pool item */}
      <p className="text-[11px] md:text-[12px] leading-relaxed text-center max-w-2xl mx-auto font-medium opacity-0 select-none px-4">
        {longestText}
      </p>
      
      {/* Visible typing text */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none px-4">
        <p className="text-slate-400 text-[11px] md:text-[12px] leading-relaxed text-center max-w-2xl mx-auto font-medium opacity-80">
          {displayedText}
          {isTyping && <span className="inline-block w-0.5 h-3 ml-1 bg-amber-500/50 animate-pulse align-middle" />}
        </p>
      </div>
    </div>
  );
};

export default function Home() {
  const aboutRef = useRef<HTMLDivElement>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [galleryImages, setGalleryImages] = useState<string[]>([]);
  const [loadingGallery, setLoadingGallery] = useState(true);
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [activeShine, setActiveShine] = useState<number | null>(null);
  const [lastShineTime, setLastShineTime] = useState<number>(0);

  // Separate indices for each gallery slot to allow staggered/random rotation
  const [slotIndices, setSlotIndices] = useState([0, 1, 2]);

  // Background configurations
  const [heroBg, setHeroBg] = useState(DEFAULT_HERO_IMG);
  const [agendaBg, setAgendaBg] = useState(DEFAULT_AGENDA_IMG);
  const [footerBg, setFooterBg] = useState(DEFAULT_FOOTER_IMG);

  // Slideshow states
  const [bgConfig, setBgConfig] = useState<any>({
    heroSlideshow: false, heroInterval: 5,
    agendaSlideshow: false, agendaInterval: 5,
    footerSlideshow: false, footerInterval: 5,
  });
  const [bgAssets, setBgAssets] = useState<string[]>([]);
  const [heroIndex, setHeroIndex] = useState(0);
  const [agendaIndex, setAgendaIndex] = useState(0);
  const [footerIndex, setFooterIndex] = useState(0);

  // Combine library assets with current background for slideshow
  const heroSlides = useMemo(() => {
    if (bgAssets.length === 0) return [heroBg];
    const list = [...bgAssets];
    if (heroBg && !list.includes(heroBg)) {
      list.unshift(heroBg);
    }
    return list;
  }, [bgAssets, heroBg]);

  const agendaSlides = useMemo(() => {
    if (bgAssets.length === 0) return [agendaBg];
    const list = [...bgAssets];
    if (agendaBg && !list.includes(agendaBg)) {
      list.unshift(agendaBg);
    }
    return list;
  }, [bgAssets, agendaBg]);

  const footerSlides = useMemo(() => {
    if (bgAssets.length === 0) return [footerBg];
    const list = [...bgAssets];
    if (footerBg && !list.includes(footerBg)) {
      list.unshift(footerBg);
    }
    return list;
  }, [bgAssets, footerBg]);

  // Form states
  const [email, setEmail] = useState('');
  const [emailTouched, setEmailTouched] = useState(false);
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notification, setNotification] = useState<{ status: 'success' | 'error' | 'sending', message: string } | null>(null);
  const [agendas, setAgendas] = useState<any[]>([]);
  const [pageReady, setPageReady] = useState(false);

  const [texture1Loaded, setTexture1Loaded] = useState(false);
  const [texture2Loaded, setTexture2Loaded] = useState(false);

  // States for PWA install capability
  const [deferredPrompt, setDeferredPrompt] = useState<any>((window as any).deferredPWAEvent || null);
  const [isInstallable, setIsInstallable] = useState(!!(window as any).deferredPWAEvent);

  useEffect(() => {
    const handleReady = () => {
      setDeferredPrompt((window as any).deferredPWAEvent);
      setIsInstallable(true);
    };

    window.addEventListener('pwa-installable-ready', handleReady);
    return () => {
      window.removeEventListener('pwa-installable-ready', handleReady);
    };
  }, []);

  useEffect(() => {
    const img1 = new Image();
    img1.src = "https://res.cloudinary.com/dew39kqhy/image/upload/v1778790033/ChatGPT_Image_15_Mei_2026_03.20.20_wybfj7.png";
    img1.onload = () => setTexture1Loaded(true);
    if (img1.complete) setTexture1Loaded(true);

    const img2 = new Image();
    img2.src = "https://res.cloudinary.com/dew39kqhy/image/upload/v1778841510/ChatGPT_Image_15_Mei_2026_17.37.07_obhnjw.png";
    img2.onload = () => setTexture2Loaded(true);
    if (img2.complete) setTexture2Loaded(true);
  }, []);

  useEffect(() => {
    // Tracking loading for different parts
    let agendaLoaded = false;
    let configLoaded = false;
    let galleryLoaded = false;

    const checkReady = () => {
      if (agendaLoaded && configLoaded && galleryLoaded) {
        setPageReady(true);
      }
    };

    // Load from cache first for instant UI
    const cachedAgendas = localStorage.getItem('cache_home_agendas');
    const cachedConfig = localStorage.getItem('cache_home_config');
    const cachedGallery = localStorage.getItem('cache_home_gallery');

    if (cachedAgendas) setAgendas(JSON.parse(cachedAgendas));
    if (cachedConfig) {
      const data = JSON.parse(cachedConfig);
      if (data.heroBg) setHeroBg(data.heroBg);
      if (data.agendaBg) setAgendaBg(data.agendaBg);
      if (data.footerBg) setFooterBg(data.footerBg);
      setBgConfig({
          heroSlideshow: data.heroSlideshow || false,
          heroInterval: data.heroInterval || 5,
          agendaSlideshow: data.agendaSlideshow || false,
          agendaInterval: data.agendaInterval || 5,
          footerSlideshow: data.footerSlideshow || false,
          footerInterval: data.footerInterval || 5,
      });
    }
    if (cachedGallery) {
      setGalleryImages(JSON.parse(cachedGallery));
      setLoadingGallery(false);
    }

    // Fetch latest agendas from Firestore
    const q = query(collection(db, 'agendas'), orderBy('createdAt', 'desc'), limit(5));
    const unsubscribeAgendas = onSnapshot(q, (snapshot) => {
      const realItems = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      const SYSTEM_AGENDAS = [
        { 
          id: 'fallback-1', 
          date: '30 April 2026', 
          title: 'Pembayaran Kas Angkatan', 
          location: 'Portal Vektorion',
          time: '23:59 WIB',
          status: 'Upcoming'
        },
        { 
          id: 'fallback-2', 
          date: '02 Mei 2026', 
          title: 'Pra-Kaderisasi Hima Fisika ITERA', 
          location: 'Institut Teknologi Sumatera',
          time: '08:00 WIB',
          status: 'Urgent'
        }
      ];

      // Combine real items with system agendas
      // We want to show up to 3 items total
      let combined = [...realItems];
      
      for (const sa of SYSTEM_AGENDAS) {
        if (combined.length >= 3) break;
        if (!combined.some((item: any) => item.title && item.title.toLowerCase().includes(sa.title.toLowerCase()))) {
          combined.push(sa);
        }
      }
      
      // Keep only 3
      combined = combined.slice(0, 3);
      
      setAgendas(combined);
      localStorage.setItem('cache_home_agendas', JSON.stringify(combined));
      agendaLoaded = true;
      checkReady();
    }, (error) => {
      console.warn("Home agenda sync failed:", error);
      const fallback = [
        { 
          id: 'fallback-1', 
          date: '30 April 2026', 
          title: 'Pembayaran Kas Angkatan', 
          location: 'Portal Vektorion',
          time: '23:59 WIB',
          status: 'Upcoming'
        },
        { 
          id: 'fallback-2', 
          date: '02 Mei 2026', 
          title: 'Pra-Kaderisasi Hima Fisika ITERA', 
          location: 'Institut Teknologi Sumatera',
          time: '08:00 WIB',
          status: 'Urgent'
        },
        {
          id: 'fallback-3',
          date: '10 Mei 2026',
          title: 'Update Info Vektorion',
          location: 'Portal',
          time: 'WIB'
        }
      ];
      setAgendas(fallback);
      agendaLoaded = true;
      checkReady();
    });

    // Home background config
    const unsubscribeConfig = onSnapshot(doc(db, 'appConfig', 'homeBackgrounds'), (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        if (data.heroBg) setHeroBg(data.heroBg);
        if (data.agendaBg) setAgendaBg(data.agendaBg);
        if (data.footerBg) setFooterBg(data.footerBg);

        const newConfig = {
          heroSlideshow: data.heroSlideshow || false,
          heroInterval: data.heroInterval || 5,
          agendaSlideshow: data.agendaSlideshow || false,
          agendaInterval: data.agendaInterval || 5,
          footerSlideshow: data.footerSlideshow || false,
          footerInterval: data.footerInterval || 5,
        };
        setBgConfig(newConfig);
        localStorage.setItem('cache_home_config', JSON.stringify(data));
      }
      configLoaded = true;
      checkReady();
    }, (error) => {
      console.warn("Home background config sync failed:", error);
      configLoaded = true;
      checkReady();
    });

    // Gallery
    const qGallery = query(collection(db, "gallery"), orderBy("createdAt", "desc"), limit(12));
    const unsubscribeGallery = onSnapshot(qGallery, (snapshot) => {
      const urls = snapshot.docs.map(doc => doc.data().url).filter(Boolean);
      if (urls.length > 0) {
        setGalleryImages(urls);
        localStorage.setItem('cache_home_gallery', JSON.stringify(urls));
      } else {
        setGalleryImages(DEFAULT_GALLERY_IMAGES);
      }
      setLoadingGallery(false);
      galleryLoaded = true;
      checkReady();
    }, (error) => {
      console.warn("Home gallery sync failed:", error);
      setGalleryImages(DEFAULT_GALLERY_IMAGES);
      setLoadingGallery(false);
      galleryLoaded = true;
      checkReady();
    });

    // Assets listener
    const unsubscribeAssets = onSnapshot(collection(db, 'backgroundAssets'), (snapshot) => {
      const urls = snapshot.docs.map(doc => doc.data().url);
      setBgAssets(urls);
    }, (error) => {
      console.warn("Home background assets sync failed:", error);
    });

    return () => {
      unsubscribeAgendas();
      unsubscribeConfig();
      unsubscribeGallery();
      unsubscribeAssets();
    };
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  // Removed old duplicate useEffects for sync

  // Slideshow Logic
  useEffect(() => {
    if (!bgConfig.heroSlideshow || heroSlides.length <= 1) return;
    const timer = setInterval(() => {
      setHeroIndex(prev => (prev + 1) % heroSlides.length);
    }, bgConfig.heroInterval * 1000);
    return () => clearInterval(timer);
  }, [bgConfig.heroSlideshow, bgConfig.heroInterval, heroSlides.length]);

  useEffect(() => {
    if (!bgConfig.agendaSlideshow || agendaSlides.length <= 1) return;
    const timer = setInterval(() => {
      setAgendaIndex(prev => (prev + 1) % agendaSlides.length);
    }, bgConfig.agendaInterval * 1000);
    return () => clearInterval(timer);
  }, [bgConfig.agendaSlideshow, bgConfig.agendaInterval, agendaSlides.length]);

  useEffect(() => {
    if (!bgConfig.footerSlideshow || footerSlides.length <= 1) return;
    const timer = setInterval(() => {
      setFooterIndex(prev => (prev + 1) % footerSlides.length);
    }, bgConfig.footerInterval * 1000);
    return () => clearInterval(timer);
  }, [bgConfig.footerSlideshow, bgConfig.footerInterval, footerSlides.length]);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Individual rotation for each slot with different timings
  useEffect(() => {
    if (galleryImages.length < 4) return;

    // Fixed interval of 8s as requested
    const ROTATION_INTERVAL = 8000;

    // Slot 1 rotation
    const t1 = setInterval(() => {
      setSlotIndices(prev => {
        const next = [...prev];
        let nextIdx = Math.floor(Math.random() * galleryImages.length);
        while (nextIdx === next[1] || nextIdx === next[2]) {
          nextIdx = Math.floor(Math.random() * galleryImages.length);
        }
        next[0] = nextIdx;
        return next;
      });
    }, ROTATION_INTERVAL);

    // Slot 2 rotation (offset by 2.5s)
    let t2: NodeJS.Timeout;
    const startT2 = setTimeout(() => {
      t2 = setInterval(() => {
        setSlotIndices(prev => {
          const next = [...prev];
          let nextIdx = Math.floor(Math.random() * galleryImages.length);
          while (nextIdx === next[0] || nextIdx === next[2]) {
            nextIdx = Math.floor(Math.random() * galleryImages.length);
          }
          next[1] = nextIdx;
          return next;
        });
      }, ROTATION_INTERVAL);
    }, 2500);

    // Slot 3 rotation (offset by 5s)
    let t3: NodeJS.Timeout;
    const startT3 = setTimeout(() => {
      t3 = setInterval(() => {
        setSlotIndices(prev => {
          const next = [...prev];
          let nextIdx = Math.floor(Math.random() * galleryImages.length);
          while (nextIdx === next[0] || nextIdx === next[1]) {
            nextIdx = Math.floor(Math.random() * galleryImages.length);
          }
          next[2] = nextIdx;
          return next;
        });
      }, ROTATION_INTERVAL);
    }, 5000);

    return () => {
      clearInterval(t1);
      clearTimeout(startT2);
      if (t2) clearInterval(t2);
      clearTimeout(startT3);
      if (t3) clearInterval(t3);
    };
  }, [galleryImages]);

  const events = [
    { id: 1, day: '30', month: 'April', year: '2026', title: 'Pembayaran Kas', location: 'Sistem', status: 'Active' },
    { id: 2, day: '02', month: 'Mei', year: '2026', title: 'Pra-Kaderisasi', location: 'Embung B', status: 'Active' },
  ];

  const currentGallery = useMemo(() => {
    if (galleryImages.length === 0) return [];
    
    return [
      galleryImages[slotIndices[0] % galleryImages.length],
      galleryImages[slotIndices[1] % galleryImages.length],
      galleryImages[slotIndices[2] % galleryImages.length],
    ].filter(Boolean);
  }, [galleryImages, slotIndices]);

  const handleShine = (idx: number) => {
    const now = Date.now();
    if (now - lastShineTime < 2000) return; // 2 second cooldown
    
    setActiveShine(idx);
    setLastShineTime(now);
    
    setTimeout(() => {
      setActiveShine(null);
    }, 1000);
  };

  const handleEmailChange = (val: string) => {
    // Menghapus semua spasi dan membatasi panjang
    const noSpaces = val.replace(/\s/g, '').toLowerCase();
    setEmail(noSpaces.substring(0, 50));
    if (emailTouched) setEmailTouched(false);
  };

  const validateEmail = (email: string) => {
    return /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email);
  };

  const isEmailInputValid = email.length === 0 || validateEmail(email);
  const showErrorStyle = emailTouched && !isEmailInputValid && email.length > 0;

  const handleSubmitMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !message.trim() || isSubmitting) return;

    if (!validateEmail(email)) {
      setNotification({ status: 'error', message: 'FORMAT EMAIL SALAH!' });
      setTimeout(() => setNotification(null), 3000);
      return;
    }

    setIsSubmitting(true);
    setNotification({ status: 'sending', message: 'MENGIRIM PESAN...' });

    try {
      await addDoc(collection(db, "messages"), {
        email: email.trim(),
        message: message.trim(),
        targetRecipient: "irfanrizkiaditricreator@gmail.com",
        userId: user?.uid || null,
        userEmail: user?.email || null,
        createdAt: serverTimestamp()
      });
      
      setNotification({ status: 'success', message: 'PESAN TERKIRIM!' });
      setMessage('');
      setEmail('');
      setEmailTouched(false);

      setTimeout(() => setNotification(null), 4000);
    } catch (err) {
      console.error(err);
      setNotification({ status: 'error', message: 'GAGAL MENGIRIM PESAN' });
      setTimeout(() => setNotification(null), 4000);
    } finally {
      setIsSubmitting(false);
    }
  };

  const scrollToAbout = () => {
    aboutRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  if (!pageReady) {
    return (
      <MaintenanceGuard menuId="home">
        <HomeSkeleton />
      </MaintenanceGuard>
    );
  }

  return (
    <MaintenanceGuard menuId="home">
      <div className="flex flex-col min-h-screen bg-slate-50">
{/* Hero Section - Full Page */}
<section className="relative h-screen flex items-end justify-center pb-24 md:pb-32 overflow-hidden bg-slate-50">
  <AnimatePresence>
    <motion.div 
      key={bgConfig.heroSlideshow ? heroSlides[heroIndex] : heroBg}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 1.5, ease: "easeInOut" }}
      className={cn(
        "absolute inset-y-0 z-0",
        isMobile ? "animate-slow-pan -left-[25%] w-[150%]" : "inset-0"
      )}
      style={{ 
        backgroundImage: `url(${bgConfig.heroSlideshow ? heroSlides[heroIndex] : heroBg})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center'
      }}
    />
  </AnimatePresence>

  {/* Smoother Overlay Gradients */}
  <div className="absolute inset-0 bg-slate-900/30 z-10" />

  <div className="absolute inset-x-0 bottom-0 h-56 bg-gradient-to-b from-transparent via-slate-50/10 to-slate-50 z-20" />

  <div className="container mx-auto px-4 relative z-30 text-center">
    <div 
      className="max-w-4xl mx-auto flex flex-col items-center"
    >
      <h1 className="relative text-4xl md:text-6xl lg:text-7xl font-bold text-white drop-shadow-lg tracking-tighter leading-none mb-4 group text-center">
        <span className="relative z-10">
          VEKTOR<span className="text-amber-500">ION</span>
        </span>
      </h1>
      
      <p className="text-white drop-shadow-md text-xs md:text-[13px] font-medium max-w-xl leading-relaxed mb-8">
        Website Resmi Mahasiswa Fisika Angkatan 2025<br />
        Institut Teknologi Sumatera.
      </p>

      <div className="flex flex-wrap items-center justify-center gap-3">
        <Link to="/struktur" 
          className="relative px-6 py-3 bg-amber-500 text-white font-bold text-[10px] tracking-wide hover:brightness-110 transition-all shadow-xl shadow-amber-500/10 active:scale-95 overflow-hidden group/btn flex items-center gap-2 rounded-sm"
          style={{
            backgroundImage: `url("https://res.cloudinary.com/dew39kqhy/image/upload/v1778844203/ChatGPT_Image_15_Mei_2026_18.22.55_znq6au.png")`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            opacity: 1
          }}
        >
          <img 
            src="https://cdn-icons-png.flaticon.com/128/4871/4871527.png" 
            className="w-3.5 h-3.5 transition-all group-hover/btn:scale-110" 
            style={{ filter: 'brightness(0) invert(1)' }}
            alt="Struktur"
          />
          <span className="relative z-10">Struktur Pengurus</span>

          <div 
            className="absolute top-0 h-full w-[200%] bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-[45deg]"
            style={{ animation: 'shimmer 8s infinite linear', left: '-200%' }}
          />
        </Link>

        <button 
          onClick={scrollToAbout}
          className="px-6 py-3 bg-transparent border border-white/60 text-white font-bold text-[10px] tracking-wide hover:bg-white hover:text-slate-900 transition-all active:scale-95 cursor-pointer backdrop-blur-sm"
        >
          Learn More
        </button>
      </div>
    </div>
  </div>
</section>

      {/* About & Quick Nav Section */}
      <section ref={aboutRef} className="py-32 bg-slate-50">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto flex flex-col items-center">
            <div className="text-center space-y-4 mb-10 flex flex-col items-center">
              <div
                className="w-20 md:w-28 mb-2"
              >
                <OptimizedImage 
                  src="https://res.cloudinary.com/dew39kqhy/image/upload/v1778155257/BackgroundEraser_20260507_190027268_bc5p07.png" 
                  alt="Vektorion Logo" 
                  className="object-contain"
                  fallbackClassName="bg-transparent"
                />
              </div>
              <div className="space-y-2">
                <h2 className="text-3xl font-bold text-slate-900 tracking-tighter">Tentang Vektorion</h2>
                <div className="w-16 h-1 bg-amber-500 mx-auto" />
              </div>
            </div>
            
            <p className="text-slate-500 text-sm md:text-base leading-relaxed font-medium mb-16 max-w-4xl mx-auto text-justify [text-align-last:center] md:[text-align-last:justify]">
              VEKTORION merupakan nama yang berasal dari gabungan konsep “vektor” dan akhiran “-ion” dalam fisika. Vektor melambangkan besaran yang memiliki arah dan nilai, sementara “ion” merepresentasikan partikel yang aktif dan dinamis dalam suatu sistem. Secara filosofis, VEKTORION menggambarkan setiap individu dalam angkatan sebagai “vektor” yang memiliki potensi dan tujuan masing-masing, namun tetap bergerak dalam satu arah yang selaras. Ketika seluruh vektor tersebut bersatu, terbentuklah resultan yang kuat, mencerminkan kekompakan, kolaborasi, dan kekuatan kolektif angkatan. Nama ini menegaskan bahwa setiap langkah yang diambil memiliki arah yang jelas dan kontribusi nyata, sehingga bersama-sama mampu menciptakan perubahan dan pencapaian yang bermakna.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                { label: 'Kotak Aspirasi', desc: 'Sampaikan kritik, saran, atau keluh kesah secara anonim untuk pengurus.', path: '/aspirasi', icon: "https://cdn-icons-png.flaticon.com/128/17887/17887167.png" },
                { label: 'Galeri Momen', desc: 'Kumpulan dokumentasi perjalanan dan memori bersama angkatan.', path: '/galeri', icon: "https://cdn-icons-png.flaticon.com/128/13051/13051386.png" },
                { label: 'Info Terkini', desc: 'Informasi dan warta terbaru seputar kegiatan akademik angkatan.', path: '/info', icon: "https://cdn-icons-png.flaticon.com/128/9479/9479228.png" },
              ].map((item, idx) => {
                return (
                  <Link 
                    key={idx} 
                    to={item.path} 
                    className="group p-8 border-2 border-slate-100 hover:border-amber-500 transition-all text-center flex flex-col items-center relative overflow-hidden bg-white rounded-md min-h-[220px] justify-center"
                  >
                    {!texture1Loaded ? (
                      <div className="flex flex-col items-center w-full animate-pulse">
                        <div className="w-10 h-10 bg-slate-200/85 rounded-sm mb-6" />
                        <div className="h-4 w-28 bg-slate-200/85 rounded-sm mb-3" />
                        <div className="h-3 w-40 bg-slate-100/90 rounded-sm mb-1.5" />
                        <div className="h-3 w-32 bg-slate-100/90 rounded-sm" />
                      </div>
                    ) : (
                      <>
                        {/* Background Texture Card */}
                        <div className="absolute inset-0 opacity-[0.90] pointer-events-none transition-all duration-700" 
                             style={{ 
                               backgroundImage: `url("https://res.cloudinary.com/dew39kqhy/image/upload/v1778790033/ChatGPT_Image_15_Mei_2026_03.20.20_wybfj7.png")`,
                               backgroundSize: 'cover',
                               backgroundPosition: 'center',
                             }} 
                        />
                        
                        <div className="relative z-10 flex flex-col items-center">
                          <div className="mb-6">
                            <img 
                              src={item.icon} 
                              className="w-10 h-10 opacity-90" 
                              style={{ filter: 'brightness(0) saturate(100%) invert(70%) sepia(87%) saturate(583%) hue-rotate(352deg) brightness(98%) contrast(98%)' }}
                              alt={item.label}
                            />
                          </div>
                          <h3 className="text-[13px] font-bold text-slate-900 mb-3">{item.label}</h3>
                          <p className="text-[10px] text-slate-400 font-medium leading-relaxed max-w-[200px]">{item.desc}</p>
                        </div>
                      </>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Interstitial 1 */}
      <div className="container mx-auto px-4 py-8">
        <TypewriterText textPool={TEXT_POOL_1} />
      </div>

      {/* Agenda Section - Horizontal Navigation Style */}
      <section className="py-24 bg-slate-50 relative overflow-hidden group/agenda">
        {/* Background Visual for Agenda */}
        <div className="absolute inset-0 z-0">
          <div key={bgConfig.agendaSlideshow ? agendaSlides[agendaIndex] : agendaBg} className="w-full h-full">
            <OptimizedImage 
              src={bgConfig.agendaSlideshow ? agendaSlides[agendaIndex] : agendaBg} 
              className="w-full h-full object-cover grayscale opacity-[0.03] transition-opacity duration-1000 group-hover/agenda:opacity-[0.06]" 
              alt="Agenda Background"
              fallbackClassName="w-full h-full bg-slate-100"
            />
          </div>
          <div className="absolute inset-0 bg-gradient-to-b from-slate-50 via-transparent to-slate-50" />
        </div>

        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-5xl mx-auto">
            <div className="flex items-center gap-4 mb-16">
              <h2 className="text-2xl font-black text-slate-900 tracking-tighter shrink-0 flex items-center gap-3">
                <img 
                  src="https://cdn-icons-png.flaticon.com/128/14490/14490440.png" 
                  className="w-6 h-6" 
                  style={{ filter: 'brightness(0) saturate(100%) invert(70%) sepia(87%) saturate(583%) hue-rotate(352deg) brightness(98%) contrast(98%)' }}
                  alt="Agenda"
                />
                Agenda
              </h2>
              <div className="h-[2px] flex-1 bg-slate-100" />
            </div>

            <div className="relative">
              <div className={cn(
                "grid gap-4 md:gap-8 grid-cols-1",
                agendas.length === 1 ? "max-w-sm mx-auto" : 
                agendas.length === 2 ? "sm:grid-cols-2 max-w-3xl mx-auto" : 
                "sm:grid-cols-2 lg:grid-cols-3"
              )}>
                {agendas.length > 0 ? (
                  agendas.map((event, idx) => (
                    <div 
                      key={event.id}
                      className={cn(
                        "w-full h-full",
                        idx === 2 && agendas.length === 3 && "hidden lg:block" // Third item hidden on mobile/tablet
                      )}
                    >
                      <Link to={`/agenda?id=${event.id}`} className="block relative overflow-hidden bg-white border border-slate-100 p-5 md:p-6 pb-7 md:pb-8 rounded-md hover:border-amber-500 hover:shadow-2xl hover:shadow-amber-500/10 transition-all group h-full min-h-[140px] flex flex-col justify-between">
                        {!texture2Loaded ? (
                          <div className="flex flex-col w-full h-full animate-pulse justify-between">
                            <div>
                              {/* Date label skeleton */}
                              <div className="h-3 w-16 bg-slate-200/80 rounded-sm mb-4" />
                              <div className="flex flex-col sm:flex-row items-start gap-3 sm:gap-5">
                                {/* Day placeholder */}
                                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-slate-200/80 rounded-sm" />
                                <div className="flex-1 space-y-2 pt-1 min-w-0 w-full">
                                  {/* Title placeholder */}
                                  <div className="h-3.5 w-full bg-slate-200/80 rounded-sm" />
                                  <div className="h-2.5 w-1/2 bg-slate-100/90 rounded-sm" />
                                  </div>
                              </div>
                            </div>
                            {/* Location skeleton */}
                            <div className="flex justify-end mt-4">
                              <div className="h-2 w-12 bg-slate-100/90 rounded-sm" />
                            </div>
                          </div>
                        ) : (
                          <>
                            {/* Background Texture Card */}
                            <div className="absolute inset-0 opacity-[0.95] pointer-events-none transition-opacity" 
                                 style={{ 
                                   backgroundImage: `url("https://res.cloudinary.com/dew39kqhy/image/upload/v1778841510/ChatGPT_Image_15_Mei_2026_17.37.07_obhnjw.png")`,
                                   backgroundSize: 'cover',
                                   backgroundPosition: 'center',
                                 }} 
                            />
                            
                            <div className="relative z-10 flex flex-col h-full">
                              <div className="flex flex-row items-center gap-3.5 sm:gap-5">
                                {/* Date Badge - Persis menu agenda */}
                                <div className="flex flex-col items-center justify-center bg-white/60 backdrop-blur-sm shadow-sm group-hover:bg-amber-50/80 transition-colors w-16 h-16 md:w-20 md:h-20 shrink-0 rounded-md border border-slate-100/50 mt-1">
                                  <span className="text-xl md:text-xl font-bold text-slate-800 leading-none">
                                    {event.date?.split(' ')[0]}
                                  </span>
                                  <span className="text-[9px] md:text-[10px] font-bold text-slate-500 mt-0.5 uppercase">
                                    {event.date?.split(' ')[1]}
                                  </span>
                                  <span className="text-[7px] md:text-[8px] font-medium text-slate-400 mt-0.5">
                                    {event.date?.split(' ')[2] || '2026'}
                                  </span>
                                </div>

                                <div className="min-w-0 w-full">
                                  <h4 className="text-[12px] md:text-sm font-bold text-slate-900 tracking-tight mb-2 font-sans line-clamp-2 leading-tight uppercase break-words overflow-wrap-anywhere">
                                    {event.title}
                                  </h4>
                                  <div className="flex items-center gap-1.5 text-[9px] text-slate-400 font-bold uppercase tracking-wider">
                                    <Clock size={9} />
                                    <span>{event.time || 'TBA'}</span>
                                  </div>
                                </div>
                              </div>
                            </div>

                            <div className="absolute bottom-3 right-4 text-[8px] text-slate-800/30 font-bold tracking-widest uppercase z-20">
                              {event.location}
                            </div>
                          </>
                        )}
                      </Link>
                    </div>
                  ))
                ) : (
                  <>
                    <div 
                      className="w-full"
                    >
                      <div className="block relative overflow-hidden bg-slate-100 border border-slate-200 p-6 rounded-sm animate-pulse h-40">
                        <div className="h-4 w-24 bg-slate-200 mb-4 rounded" />
                        <div className="flex gap-4">
                          <div className="h-10 w-10 bg-slate-200 rounded" />
                          <div className="flex-1 space-y-2">
                            <div className="h-3 w-full bg-slate-200 rounded" />
                            <div className="h-3 w-2/3 bg-slate-200 rounded" />
                          </div>
                        </div>
                      </div>
                    </div>
                    <div 
                      className="w-full"
                    >
                      <div className="block relative overflow-hidden bg-slate-100 border border-slate-200 p-6 rounded-sm animate-pulse h-40">
                        <div className="h-4 w-24 bg-slate-200 mb-4 rounded" />
                        <div className="flex gap-4">
                          <div className="h-10 w-10 bg-slate-200 rounded" />
                          <div className="flex-1 space-y-2">
                            <div className="h-3 w-full bg-slate-200 rounded" />
                            <div className="h-3 w-2/3 bg-slate-200 rounded" />
                          </div>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>

            <div className="mt-16 text-center">
              <Link to="/agenda" className="text-[11px] font-medium text-slate-400 tracking-wide hover:text-amber-600 transition-colors">
                Lihat seluruh agenda
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Interstitial 2 */}
      <div className="container mx-auto px-4 py-8">
        <TypewriterText textPool={TEXT_POOL_2} />
      </div>

      {/* Gallery Preview Section */}
      <section className="py-20 bg-slate-50 relative overflow-hidden group/momen">
        {/* Background Visual for Gallery */}
        <div className="absolute inset-0 z-0">
          <div key={galleryImages[slotIndices[0] % galleryImages.length] || 'default-bg'} className="w-full h-full">
            <OptimizedImage 
              src={galleryImages[slotIndices[0] % galleryImages.length] || galleryImages[0]} 
              className="w-full h-full object-cover grayscale opacity-5" 
              alt="Gallery Background"
              fallbackClassName="w-full h-full bg-slate-100"
            />
          </div>
          <div className="absolute inset-0 bg-gradient-to-b from-slate-50 via-transparent to-slate-50" />
        </div>

        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-5xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <img 
                    src="https://cdn-icons-png.flaticon.com/128/13051/13051386.png" 
                    className="w-5 h-5" 
                    style={{ filter: 'brightness(0) saturate(100%) invert(70%) sepia(87%) saturate(583%) hue-rotate(352deg) brightness(98%) contrast(98%)' }}
                    alt="Momen"
                  />
                  <h2 className="text-lg md:text-xl font-black text-slate-900 tracking-tighter">
                    Momen <span className="text-amber-500">Angkatan</span>
                  </h2>
                </div>
                <p className="text-[10px] md:text-[11px] text-slate-400 font-medium max-w-sm leading-relaxed">
                  Kumpulan potret jejak kebersamaan dan aksi nyata Fisika 2025 di setiap langkah perjalanannya.
                </p>
              </div>
              <Link to="/galeri" className="group flex items-center gap-2 text-slate-400 hover:text-slate-900 transition-colors">
                <span className="text-[9px] font-bold tracking-widest">Lihat Galeri</span>
                <ArrowRight size={12} className="group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>

            <div className="grid grid-cols-2 gap-3 md:gap-4 max-w-4xl mx-auto">
              {loadingGallery ? (
                Array(4).fill(0).map((_, idx) => (
                  <div key={idx} className={cn(
                    "animate-pulse bg-slate-200/50 rounded-lg",
                    idx === 0 ? "col-span-2 aspect-[21/9] md:aspect-[21/7]" : "col-span-1 aspect-[4/3]"
                  )} />
                ))
              ) : currentGallery.length > 0 ? (
                currentGallery.map((src, idx) => (
                  <div
                    key={`slot-container-${idx}`}
                    onClick={() => handleShine(idx)}
                    onMouseEnter={() => handleShine(idx)}
                    className={cn(
                      "bg-slate-100 relative group cursor-pointer overflow-hidden rounded-lg shadow-sm border border-slate-200",
                      idx === 0 ? "col-span-2 aspect-[21/9] md:aspect-[21/7]" : "col-span-1 aspect-[4/3]"
                    )}
                  >
                    <div 
                      key={src}
                      className="absolute inset-0 w-full h-full"
                    >
                      <OptimizedImage 
                        src={src} 
                        alt={`Preview ${idx + 1}`} 
                        className="w-full h-full object-cover scale-110"
                        fallbackClassName="w-full h-full"
                      />
                    </div>
                    
                    {/* Shine Effect */}
                    {activeShine === idx && (
                      <div 
                        className="absolute inset-0 z-10 w-[50%] h-full bg-gradient-to-r from-transparent via-white/40 to-transparent -skew-x-[35deg] pointer-events-none"
                        style={{ animation: 'shimmer 0.8s ease-in-out', left: '150%' }}
                      />
                    )}

                    <div className="absolute inset-0 bg-slate-900/0 group-hover:bg-slate-900/5 transition-colors duration-300" />
                  </div>
                ))
              ) : (
                <div className="col-span-full text-center py-20 bg-white border border-dashed border-slate-200 rounded-xl">
                  <ImageIcon size={24} className="mx-auto text-slate-200 mb-3" />
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-300">Belum ada foto galeri</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Interstitial 3 */}
      <div className="container mx-auto px-4 py-8">
        <TypewriterText textPool={TEXT_POOL_3} />
      </div>

      {/* Contact Message Section */}
      <section className="py-24 bg-slate-50">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <div className="flex flex-col md:flex-row bg-white border border-slate-100 rounded-md overflow-hidden shadow-2xl shadow-slate-200/50">
              {/* Left Side: Image/Visual */}
              <div className="hidden md:block w-[40%] relative overflow-hidden">
                <div className="absolute inset-0">
                  <OptimizedImage 
                    src={CONTACT_IMG} 
                    className="w-full h-full object-cover" 
                    alt="Contact"
                    fallbackClassName="bg-slate-100 w-full h-full"
                  />
                </div>
              </div>

              {/* Right Side: Form */}
              <div className="flex-1 p-8 md:p-12 relative overflow-hidden bg-slate-50/20 flex flex-col items-center justify-center">
                {/* Decorative Hexagon Pattern */}
                <div className="absolute inset-0 opacity-[0.03] pointer-events-none scale-150 rotate-12">
                   <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
                    <defs>
                      <pattern id="hexagons" width="50" height="43.4" patternUnits="userSpaceOnUse" patternTransform="scale(1.5)">
                        <path d="M25 0 L50 14.4 L50 43.4 L25 57.8 L0 43.4 L0 14.4 Z" fill="none" stroke="currentColor" strokeWidth="1" />
                      </pattern>
                    </defs>
                    <rect width="100%" height="100%" fill="url(#hexagons)" />
                  </svg>
                </div>

                <div className="relative z-10 w-full max-w-md mx-auto md:max-w-none text-center md:text-left">
                  <div className="mb-8">
                    <h2 className="text-2xl font-bold text-slate-900 tracking-tight mb-1">Kirim Pesan</h2>
                    <p className="text-slate-400 text-[11px] font-medium leading-relaxed">Sampaikan aspirasimu kepada kami.</p>
                  </div>

                  <form onSubmit={handleSubmitMessage} className="space-y-4">
                    <div className="grid grid-cols-1 gap-4">
                      <div className="space-y-2 text-left">
                        <label className="text-[9px] font-medium text-slate-400 tracking-widest">
                          Email Aktif
                        </label>
                        <div className="relative group">
                          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-amber-500 transition-colors">
                            <User size={14} />
                          </div>
                          <input 
                            type="email"
                            value={email}
                            onChange={(e) => handleEmailChange(e.target.value)}
                            onBlur={() => setEmailTouched(true)}
                            placeholder="Email..."
                            className={cn(
                              "w-full bg-white border rounded-sm py-2.5 px-11 text-xs font-bold transition-all shadow-sm",
                              showErrorStyle 
                                ? "border-red-500 focus:ring-red-500/20 focus:border-red-500 text-slate-900" 
                                : "border-slate-200 text-slate-900 focus:outline-none focus:ring-1 focus:ring-amber-500/20 focus:border-amber-500"
                            )}
                          />
                        </div>
                        {/* Error message with absolute positioning to prevent shifting content */}
                        <div className="h-0 relative">
                          {showErrorStyle && (
                            <p className="absolute top-1 left-0 text-[10px] text-red-500 leading-tight whitespace-nowrap">
                              format email tidak valid
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="space-y-2 text-left pt-2">
                        <div className="flex justify-between items-end mb-1">
                          <label className="text-[9px] font-medium text-slate-400 tracking-widest">Isi Pesan</label>
                          <span className={cn(
                            "text-[8px] font-medium",
                            message.length > 180 ? "text-amber-600" : "text-slate-300"
                          )}>{message.length}/200</span>
                        </div>
                        <textarea 
                          value={message}
                          onChange={(e) => setMessage(e.target.value)}
                          maxLength={200}
                          placeholder="Tulis aspirasi atau pesan semangatmu di sini..."
                          rows={4}
                          className="w-full bg-white border border-slate-200 rounded-sm p-4 text-xs font-bold text-slate-900 focus:outline-none focus:ring-1 focus:ring-amber-500/20 focus:border-amber-500 transition-all resize-none placeholder:text-slate-300 shadow-sm"
                        />
                      </div>
                    </div>

                    <div className="pt-2 flex justify-between items-center">
                      <button 
                        type="submit"
                        disabled={!email.trim() || !message.trim() || isSubmitting || !validateEmail(email)}
                        className={cn(
                          "px-10 py-3 rounded-sm text-[10px] font-black uppercase tracking-[0.2em] transition-all flex items-center gap-2",
                          (!email.trim() || !message.trim() || isSubmitting || !validateEmail(email))
                            ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                            : "bg-slate-900 text-white hover:bg-amber-500 active:scale-95"
                        )}
                      >
                        {isSubmitting ? (
                          <>
                            <div className="w-3 h-3 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                            Mengirim...
                          </>
                        ) : (
                          <>
                            <Send size={12} />
                            Kirim
                          </>
                        )}
                      </button>

                      {/* Instagram Link at bottom right */}
                      <a 
                        href="https://www.instagram.com/vektorion.25?igsh=MTB1YzhpdGt4dXppMQ==" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="p-2 transition-all hover:scale-110 active:scale-90"
                      >
                        <img 
                          src="https://cdn-icons-png.flaticon.com/128/174/174855.png" 
                          alt="Instagram" 
                          className="w-5 h-5 object-contain"
                        />
                      </a>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

       {/* Footer Visual Section */}
      <section className="relative h-64 md:h-96 overflow-hidden">
        <div className="absolute inset-0 z-0">
          <AnimatePresence>
            <motion.div 
              key={bgConfig.footerSlideshow ? footerSlides[footerIndex] : footerBg} 
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.2 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.5, ease: "easeInOut" }}
              className="absolute inset-0 w-full h-full"
            >
              <OptimizedImage 
                src={bgConfig.footerSlideshow ? footerSlides[footerIndex] : footerBg} 
                className="w-full h-full object-cover grayscale-[30%]" 
                alt="Bottom Visual"
                fallbackClassName="w-full h-full bg-slate-100"
              />
            </motion.div>
          </AnimatePresence>
        </div>
        <div className="absolute inset-0 bg-gradient-to-b from-slate-50 via-transparent to-slate-50 z-10" />
        <div className="absolute inset-0 bg-slate-900/[0.02] z-0" />
      </section>

      {/* Global Notifications */}
      {notification && (
        <div
          className="fixed bottom-20 left-1/2 -translate-x-1/2 z-[100] w-auto px-4"
        >
          <div className={cn(
            "px-4 py-2 rounded-sm shadow-xl border flex items-center gap-2.5 backdrop-blur-md bg-white/95 transition-all duration-500",
            notification.status === 'error' ? "border-red-200 text-slate-800" : "border-slate-200 text-slate-800"
          )}>
            {notification.status === 'sending' ? (
              <Loader2 size={12} className="animate-spin text-amber-500" />
            ) : notification.status === 'success' ? (
              <CheckCircle2 size={14} className="text-emerald-500" />
            ) : (
              <AlertCircle size={14} className="text-red-500" />
            )}
            <p className="text-[8px] font-black uppercase tracking-[0.2em] leading-none whitespace-nowrap">
              {notification.message}
            </p>
          </div>
        </div>
      )}

      {/* Banner PWA dihapus sesuai permintaan */}
      </div>
    </MaintenanceGuard>
  );
}
