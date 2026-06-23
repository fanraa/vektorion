import React, { useState, useEffect, useRef } from 'react';
import imageCompression from 'browser-image-compression';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Image as ImageIcon, 
  Calendar, 
  X, 
  Check,
  Camera, 
  Upload, 
  Plus, 
  Loader2,
  CheckCircle2,
  AlertCircle,
  Info,
  Trash2,
  Share2,
  FileCode,
  Download,
  Maximize2
} from 'lucide-react';
import Cropper from 'react-easy-crop';
import { cn } from '../lib/utils';
import { db } from '../lib/firebase';
import { 
  collection, 
  addDoc, 
  onSnapshot, 
  query, 
  orderBy, 
  serverTimestamp,
  doc,
  deleteDoc,
  getDocFromServer
} from 'firebase/firestore';
import { auth } from '../lib/firebase';
import { useAuth } from '../lib/AuthContext';
import { useNavbar } from '../lib/NavbarContext';
import { Helmet } from 'react-helmet-async';
import { useNavigate } from 'react-router-dom';
import { MaintenanceGuard } from '../components/MaintenanceGuard';

import { OptimizedImage } from '../components/ui/OptimizedImage';

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

interface GalleryItem {
  id: string;
  url: string;
  title: string;
  category: string;
  date: string;
  fullTime?: string;
  description: string;
  uploadedBy?: string;
  createdAt?: any;
  size?: string;
  userId?: string;
  uploadedByPhoto?: string;
}

function ContributorInfo({ userId, fallbackName, fallbackPhoto, size = "sm" }: { userId?: string, fallbackName?: string, fallbackPhoto?: string, size?: "sm" | "md" }) {
  const [contributor, setContributor] = useState<{ fullName: string, photoURL: string | null } | null>(null);

  useEffect(() => {
    if (!userId) return;
    const profileRef = doc(db, 'users', userId);
    const unsubscribe = onSnapshot(profileRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setContributor({
          fullName: data.fullName || data.name || fallbackName || 'User Vektorion',
          photoURL: data.photoURL || null
        });
      } else {
        setContributor({
          fullName: fallbackName || 'User Vektorion',
          photoURL: fallbackPhoto || null
        });
      }
    }, (error) => {
      console.warn("ContributorInfo permission error (likely guest):", error);
      setContributor({
        fullName: fallbackName || 'User Vektorion',
        photoURL: fallbackPhoto || null
      });
    });
    return () => unsubscribe();
  }, [userId, fallbackName, fallbackPhoto]);

  const displayName = contributor?.fullName || fallbackName || 'User Vektorion';
  const displayPhoto = contributor?.photoURL || fallbackPhoto;

  if (size === "md") {
    return (
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 border-2 border-white shadow-sm rounded-full flex items-center justify-center overflow-hidden bg-slate-100">
           {displayPhoto ? (
             <img src={displayPhoto} alt="" className="w-full h-full object-cover" />
           ) : (
             <span className="text-[10px] text-slate-400 font-bold">{displayName[0]}</span>
           )}
        </div>
        <div>
          <p className="text-[11px] font-bold text-slate-900 leading-none">
            {displayName}
          </p>
          <p className="text-[8px] font-medium text-slate-500 mt-1">Kontributor momen</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1.5">
       {displayPhoto ? (
         <img src={displayPhoto} alt="" className="w-3.5 h-3.5 rounded-full object-cover ring-1 ring-slate-100" />
       ) : (
         <div className="w-3.5 h-3.5 bg-slate-900 rounded-full flex items-center justify-center text-[7px] text-white font-black">
            {displayName[0]}
         </div>
       )}
       <p className="text-[8px] font-bold text-slate-900 truncate">
         {displayName}
       </p>
    </div>
  );
}

const DEFAULT_HERO = "https://images.unsplash.com/photo-1627740231411-28516b7b8070?auto=format&fit=crop&q=80&w=2000";
const LOGO_URL = "/favicon.ico";

function GalleryCard({ img, idx, user, profile, onSelect, onDelete, density, onRendered, activeMenuId, onActiveMenuChange }: { 
  img: GalleryItem, 
  idx: number, 
  user: any, 
  profile: any,
  onSelect: (img: GalleryItem) => void,
  onDelete: (id: string) => Promise<void>,
  density: 'normal' | 'compact',
  onRendered?: () => void,
  activeMenuId: string | null,
  onActiveMenuChange: (id: string | null) => void,
  key?: string | number
}) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const renderedSent = useRef(false);

  const isActive = activeMenuId === img.id;

  useEffect(() => {
    if (isLoaded && onRendered && !renderedSent.current) {
      onRendered();
      renderedSent.current = true;
    }
  }, [isLoaded, onRendered]);

  // Handle click outside to reset confirmation
  useEffect(() => {
    if (!isActive && isConfirmingDelete) {
      setIsConfirmingDelete(false);
    }
  }, [isActive, isConfirmingDelete]);

  // Helper functions used inside Card
  const handleShare = async (e: React.MouseEvent, img: GalleryItem) => {
    e.stopPropagation();
    const slugify = (text: string) => {
      return text
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, '')
        .replace(/[\s_]+/g, '-')
        .replace(/^-+|-+$/g, '');
    };
    const slug = slugify(img.title || 'momen');
    const shareUrl = `${window.location.origin}${window.location.pathname}?id=${img.id}&title=${encodeURIComponent(slug)}`;
    const shareText = `Lihat momen "${img.title}" di Galeri Vektorion!`;
    if (navigator.share) {
      try {
        await navigator.share({ title: 'Galeri Vektorion', text: shareText, url: shareUrl });
      } catch (err) {}
    } else {
      const waUrl = `https://wa.me/?text=${encodeURIComponent(shareText + " " + shareUrl)}`;
      window.open(waUrl, '_blank');
    }
  };

  const handleDownload = async (e: React.MouseEvent, img: GalleryItem) => {
    e.stopPropagation();
    try {
      const response = await fetch(img.url);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${img.title.toLowerCase().replace(/\s+/g, '_')}_vektorion.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {}
  };

  const handleSelect = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelect(img);
  };

  const handleDeleteTrigger = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsConfirmingDelete(true);
    if (!isActive) onActiveMenuChange(img.id); // Ensure caption is shown
  };

  const handleCancelDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsConfirmingDelete(false);
  };

  const handleFinalDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsDeleting(true);
    try {
      await onDelete(img.id);
    } catch (err) {
      setIsDeleting(false);
      setIsConfirmingDelete(false);
    }
  };

  return (
    <div
      onClick={() => onActiveMenuChange(isActive ? null : img.id)}
      className="group relative overflow-hidden rounded-lg shadow-md cursor-pointer bg-slate-50 break-inside-avoid border border-slate-100"
    >
      <div className="relative overflow-hidden">
        <OptimizedImage 
          src={img.url} 
          alt={img.title}
          className={cn(
            "w-full h-auto",
            isActive ? "scale-100" : "group-hover:scale-100"
          )}
          fallbackClassName={cn(
             "w-full bg-slate-100",
             idx % 3 === 0 ? "aspect-[3/4]" : idx % 2 === 0 ? "aspect-[4/5]" : "aspect-[2/3]"
          )}
          onLoad={() => {
            setIsLoaded(true);
          }}
        />
      </div>
      
      {/* Remove dark gradient to keep white caption clean */}
      
      <div className={cn(
        "absolute top-2 right-2 flex gap-1.5 transition-all duration-300 z-30",
        isActive ? "translate-y-0 opacity-100 pointer-events-auto" : "translate-y-2 opacity-0 pointer-events-none group-hover:translate-y-0 group-hover:opacity-100 group-hover:pointer-events-auto"
      )}>
        {user?.uid === img.userId && !isConfirmingDelete && (
          <button onClick={handleDeleteTrigger} className="p-1.5 text-white hover:text-red-500 transition-all drop-shadow-lg cursor-pointer"><Trash2 size={16} /></button>
        )}
        {!isConfirmingDelete && (
          <>
            <button onClick={(e) => handleDownload(e, img)} className="p-1.5 text-white hover:text-amber-500 transition-all drop-shadow-lg cursor-pointer"><Download size={16} /></button>
            <button onClick={(e) => handleShare(e, img)} className="p-1.5 text-white hover:text-amber-500 transition-all drop-shadow-lg cursor-pointer"><Share2 size={16} /></button>
            <button onClick={handleSelect} className="p-1.5 text-white hover:text-amber-500 transition-all drop-shadow-lg cursor-pointer"><Info size={16} /></button>
          </>
        )}
      </div>

      <div className={cn(
        "absolute bottom-0 left-0 right-0 transition-all duration-300 flex z-20",
        isActive ? "translate-y-0 opacity-100 pointer-events-auto" : "translate-y-2 opacity-0 pointer-events-none group-hover:translate-y-0 group-hover:opacity-100 group-hover:pointer-events-auto"
      )}>
        <div className={cn(
          "relative w-full border-t border-slate-100 overflow-hidden bg-white",
          density === 'compact' ? "px-2 py-0.5" : "px-3 py-1"
        )}>
          {/* Background Image Layer */}
          <div 
            className="absolute inset-0 z-0 opacity-90 pointer-events-none"
            style={{ 
              backgroundImage: 'url(https://images.pexels.com/photos/20818860/pexels-photo-20818860.jpeg)',
              backgroundSize: 'cover',
              backgroundPosition: 'center'
            }}
          />
          
          <div className="relative z-10">
            {isConfirmingDelete ? (
              <div className="flex items-center justify-between gap-1 overflow-hidden">
                <span className="text-[7px] font-bold text-slate-800 tracking-widest whitespace-nowrap">HAPUS?</span>
                <div className="flex gap-1">
                  <button 
                    onClick={handleFinalDelete} 
                    disabled={isDeleting}
                    className="p-1 px-2 bg-red-500 text-white rounded-sm hover:bg-red-600 transition-colors"
                  >
                    {isDeleting ? <Loader2 size={10} className="animate-spin" /> : <Check size={10} />}
                  </button>
                  <button 
                    onClick={handleCancelDelete}
                    disabled={isDeleting}
                    className="p-1 px-2 bg-slate-950/10 text-slate-600 rounded-sm hover:bg-slate-950/20 transition-colors"
                  >
                    <X size={10} />
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between gap-2 overflow-hidden">
                 <div className="flex-1 min-w-0">
                    <h3 className={cn(
                      "text-slate-900 font-bold text-[9px] tracking-tight truncate leading-tight",
                      density === 'compact' && "text-[8px]"
                    )}>{img.title}</h3>
                    <div className={cn(
                      "flex items-center gap-1 text-slate-500 text-[6px] font-medium tracking-widest",
                      density === 'compact' && "text-[5.5px]"
                    )}>
                      <img 
                        src="https://cdn-icons-png.flaticon.com/128/785/785915.png" 
                        alt="" 
                        className={cn(
                          "w-1.5 h-1.5",
                        )} 
                        style={{ filter: "brightness(0) saturate(100%) invert(71%) sepia(61%) saturate(1805%) hue-rotate(360deg) brightness(101%) contrast(106%)" }}
                      />
                      {img.date}
                    </div>
                 </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Helper for cropping and compression using canvas with modern WebP compression
const getCroppedImg = (
  imageSrc: string, 
  pixelCrop: { x: number, y: number, width: number, height: number } | null,
  maxWidth: number = 1600,
  quality: number = 0.75
): Promise<string> => {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.src = imageSrc;
    image.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      if (!ctx) return reject('No ctx');

      const { width, height, x, y } = pixelCrop || { width: image.width, height: image.height, x: 0, y: 0 };

      // Set target dimensions
      let targetWidth = width;
      let targetHeight = height;

      if (targetWidth > maxWidth) {
        targetHeight = (maxWidth / targetWidth) * targetHeight;
        targetWidth = maxWidth;
      }

      canvas.width = targetWidth;
      canvas.height = targetHeight;

      ctx.drawImage(
        image,
        x, y, width, height,
        0, 0, targetWidth, targetHeight
      );

      try {
        // Dynamic detection for canvas export format webp support
        const webpDataUrl = canvas.toDataURL('image/webp', quality);
        if (webpDataUrl.startsWith('data:image/webp')) {
          resolve(webpDataUrl);
        } else {
          resolve(canvas.toDataURL('image/jpeg', quality));
        }
      } catch (err) {
        resolve(canvas.toDataURL('image/jpeg', quality));
      }
    };
    image.onerror = reject;
  });
};

import { GaleriSkeleton, ImageSkeleton } from '../components/ui/Skeleton';

export default function Galeri() {
  const { user, profile } = useAuth();
  const { setNavbarVisible } = useNavbar();
  const navigate = useNavigate();
  const [images, setImages] = useState<GalleryItem[]>([]);
  const [loadedCount, setLoadedCount] = useState(0);
  const [localDensity, setLocalDensity] = useState<'normal' | 'compact'>(() => {
    // Get from localStorage on initial load
    return (localStorage.getItem('vektorion_gallery_density') as 'normal' | 'compact') || 'normal';
  });

  const density = localDensity;

  const toggleDensity = (newDensity: 'normal' | 'compact') => {
    setLocalDensity(newDensity);
    localStorage.setItem('vektorion_gallery_density', newDensity);
  };
  const [selectedImage, setSelectedImage] = useState<GalleryItem | null>(null);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [heroImage, setHeroImage] = useState(DEFAULT_HERO);
  const [loading, setLoading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const [activeImageId, setActiveImageId] = useState<string | null>(null);
  
  // Rotating indices for "Moment" grid slots
  const [gridIndices, setGridIndices] = useState([0, 1, 2]);

  // Camera state
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');
  const videoRef = useRef<HTMLVideoElement>(null);

  // Upload state
  const [isUploadFormOpen, setIsUploadFormOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [generatingAi, setGeneratingAi] = useState(false);
  const [backgroundUpload, setBackgroundUpload] = useState<{ status: 'uploading' | 'success' | 'error', message: string } | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [formErrors, setFormErrors] = useState({ title: false });
  const [selectedRatio, setSelectedRatio] = useState<string>('original');
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);

  const [newImage, setNewImage] = useState({
    title: "",
    description: "",
    file: null as File | null,
    preview: "",
    size: ""
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Camera effect to attach stream when video element is ready
  useEffect(() => {
    if (isCameraActive && cameraStream && videoRef.current) {
      videoRef.current.srcObject = cameraStream;
    }
  }, [isCameraActive, cameraStream]);

  const startCamera = async (mode = facingMode) => {
    try {
      // Stop existing stream if any
      if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop());
      }
      
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: mode,
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        } 
      });
      setCameraStream(stream);
      setIsCameraActive(true);
    } catch (err) {
      console.error("Error accessing camera:", err);
      setUploadError("Gagal mengakses kamera. Pastikan izin diberikan.");
    }
  };

  const toggleCamera = () => {
    const newMode = facingMode === 'user' ? 'environment' : 'user';
    setFacingMode(newMode);
    if (isCameraActive) {
      startCamera(newMode);
    }
  };

  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
    }
    setIsCameraActive(false);
  };

  const capturePhoto = () => {
    if (!videoRef.current) return;

    const canvas = document.createElement('canvas');
    const video = videoRef.current;
    
    // Use the actual video dimensions for quality
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    canvas.toBlob((blob) => {
      if (blob) {
        const file = new File([blob], `camera_capture_${Date.now()}.jpg`, { type: 'image/jpeg' });
        handleFileChange(file);
        stopCamera();
      }
    }, 'image/jpeg', 0.9);
  };

  // Fetch images from Firestore
  useEffect(() => {
    // Validate Connection to Firestore
    const testConnection = async () => {
      try {
        await getDocFromServer(doc(db, 'test', 'connection'));
      } catch (error) {
        if(error instanceof Error && error.message.includes('the client is offline')) {
          console.error("Please check your Firebase configuration.");
        }
      }
    };
    testConnection();

    const q = query(collection(db, "gallery"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const items = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as GalleryItem[];
      
      setImages(items);
      setLoading(false);

      if (items.length > 0 && heroImage === DEFAULT_HERO) {
        const randomIndex = Math.floor(Math.random() * items.length);
        setHeroImage(items[randomIndex].url);
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, "gallery");
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const initialUrlCheckDone = useRef(false);

  // Auto-select image if ID is provided in URL query parameters on initial load
  useEffect(() => {
    if (images.length > 0 && !initialUrlCheckDone.current) {
      const params = new URLSearchParams(window.location.search);
      const urlId = params.get('id');
      if (urlId) {
        const matchedImg = images.find(img => img.id === urlId);
        if (matchedImg) {
          setSelectedImage(matchedImg);
        }
      }
      initialUrlCheckDone.current = true;
    }
  }, [images]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!selectedImage || images.length === 0) return;
      
      const currentIndex = images.findIndex(img => img.id === selectedImage.id);
      if (currentIndex === -1) return;

      if (e.key === 'ArrowRight') {
        const nextIndex = (currentIndex + 1) % images.length;
        setSelectedImage(images[nextIndex]);
      } else if (e.key === 'ArrowLeft') {
        const prevIndex = (currentIndex - 1 + images.length) % images.length;
        setSelectedImage(images[prevIndex]);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedImage, images]);

  // Sync selectedImage with URL query parameters
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlId = params.get('id');
    
    if (selectedImage) {
      if (urlId !== selectedImage.id) {
        const slugify = (text: string) => {
          return text
            .toLowerCase()
            .trim()
            .replace(/[^\w\s-]/g, '')
            .replace(/[\s_]+/g, '-')
            .replace(/^-+|-+$/g, '');
        };
        const slug = slugify(selectedImage.title || 'momen');
        navigate(`/galeri?id=${selectedImage.id}&title=${encodeURIComponent(slug)}`, { replace: true });
      }
    } else {
      if (urlId) {
        navigate('/galeri', { replace: true });
      }
    }
  }, [selectedImage, navigate]);

  // Hero slideshow for Gallery page
  useEffect(() => {
    if (images.length <= 1) return;
    
    const interval = setInterval(() => {
      setHeroImage(prev => {
        const currentIndex = images.findIndex(img => img.url === prev);
        const nextIndex = (currentIndex + 1) % images.length;
        return images[nextIndex].url;
      });
    }, 15000); // Change hero every 15 seconds
    
    return () => clearInterval(interval);
  }, [images]);

  // Rotasi untuk Grid "Moment" setiap 5 detik (staggered)
  useEffect(() => {
    if (images.length < 4) return;

    const GRID_INTERVAL = 5000;

    const t1 = setInterval(() => {
      setGridIndices(prev => {
        const next = [...prev];
        let ni = Math.floor(Math.random() * images.length);
        while (ni === next[1] || ni === next[2]) ni = Math.floor(Math.random() * images.length);
        next[0] = ni;
        return next;
      });
    }, GRID_INTERVAL);

    let t2: NodeJS.Timeout;
    const startT2 = setTimeout(() => {
      t2 = setInterval(() => {
        setGridIndices(prev => {
          const next = [...prev];
          let ni = Math.floor(Math.random() * images.length);
          while (ni === next[0] || ni === next[2]) ni = Math.floor(Math.random() * images.length);
          next[1] = ni;
          return next;
        });
      }, GRID_INTERVAL);
    }, 1500);

    let t3: NodeJS.Timeout;
    const startT3 = setTimeout(() => {
      t3 = setInterval(() => {
        setGridIndices(prev => {
          const next = [...prev];
          let ni = Math.floor(Math.random() * images.length);
          while (ni === next[0] || ni === next[1]) ni = Math.floor(Math.random() * images.length);
          next[2] = ni;
          return next;
        });
      }, GRID_INTERVAL);
    }, 3000);

    return () => {
      clearInterval(t1);
      clearTimeout(startT2);
      if (t2) clearInterval(t2);
      clearTimeout(startT3);
      if (t3) clearInterval(t3);
    };
  }, [images]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement> | File) => {
    const file = e instanceof File ? e : e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      setUploadError("Ukuran file maksimal adalah 10MB");
      return;
    }

    try {
      setUploadError(null);
      const sizeMBValue = file.size / (1024 * 1024);
      const sizeMB = sizeMBValue.toFixed(2) + " MB";
      const preview = URL.createObjectURL(file);
      setNewImage(prev => ({ ...prev, file, preview, size: sizeMB }));
      
      // Auto-generate AI caption and title
      generateAiCaption(file);
    } catch (err) {
      setUploadError("Gagal memproses file");
    }
  };

  const generateAiCaption = async (file: File) => {
    setGeneratingAi(true);
    
    // Fallback: 15 second timeout to stop "blur/loading" state if AI is too slow
    const timeoutId = setTimeout(() => {
      setGeneratingAi(false);
    }, 15000);

    try {
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve) => {
        reader.onload = () => {
          const base64 = (reader.result as string).split(',')[1];
          resolve(base64);
        };
        reader.readAsDataURL(file);
      });

      const base64Data = await base64Promise;
      
      const response = await fetch("/api/ai/generate-caption", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: base64Data, mimeType: file.type }),
      });

      if (!response.ok) throw new Error("Gagal membuat caption AI");
      const result = await response.json();
      
      if (result && (result.title || result.description)) {
        setNewImage(prev => ({
          ...prev,
          title: result.title?.substring(0, 40) || prev.title,
          description: result.description?.substring(0, 100) || prev.description
        }));
      }
    } catch (err) {
      console.error("AI Generation Error:", err);
    } finally {
      clearTimeout(timeoutId);
      setGeneratingAi(false);
    }
  };

  const onCropComplete = (_: any, croppedAreaPixels: any) => {
    setCroppedAreaPixels(croppedAreaPixels);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFileChange(file);
  };

  const handleUpload = async () => {
    if (!newImage.title.trim()) {
      setFormErrors({ title: true });
      setUploadError("Judul momen tidak boleh kosong!");
      return;
    }

    if (!newImage.file) {
      setUploadError("Pilih foto terlebih dahulu");
      return;
    }

    // Double check size limit
    if (newImage.file.size > 10 * 1024 * 1024) {
      setUploadError("Berkas asli terlalu besar (Max 10MB sebelum kompresi)");
      return;
    }

    setUploading(true);
    setUploadError(null);
    setFormErrors({ title: false });
    setUploadProgress(10);

    // Close modal immediately as requested by Fanra
    setIsUploadFormOpen(false);
    setBackgroundUpload({ status: 'uploading', message: 'SEDANG MENGUPLOAD MOMEN...' });

    // Capture necessary state for background processing
    const capturedImageFile = newImage.file;
    const capturedRatio = selectedRatio;
    const capturedCroppedArea = croppedAreaPixels;
    const capturedTitle = newImage.title.trim();
    const capturedDescription = newImage.description;
    const capturedProfileName = profile?.fullName || profile?.name || user?.displayName || user?.email?.split('@')[0] || 'Anggota Vektorion';
    const capturedProfilePhoto = profile?.photoURL || user?.photoURL || null;

    try {
      setUploadProgress(40);
      
      // Use browser-image-compression for more robust processing into high performance WebP format
      const compressionOptions = {
        maxSizeMB: 0.5,
        maxWidthOrHeight: 1600,
        useWebWorker: true,
        fileType: 'image/webp' as any
      };

      const compressedFile = await imageCompression(capturedImageFile!, compressionOptions);
      
      let finalDataUrl = "";
      if (capturedRatio === 'original') {
        const reader = new FileReader();
        const promise = new Promise<string>((resolve) => {
          reader.readAsDataURL(compressedFile);
          reader.onload = (e) => resolve(e.target?.result as string);
        });
        finalDataUrl = await promise;
      } else {
        // For cropping, we still use the preview but we can compress the result as webp
        const croppedBase64 = await getCroppedImg(newImage.preview, capturedCroppedArea, 1600, 0.75);
        finalDataUrl = croppedBase64;
      }
      
      setUploadProgress(80);

      const base64PrefixLength = finalDataUrl.indexOf('base64,') + 7;
      const stringLength = finalDataUrl.length - (base64PrefixLength > 6 ? base64PrefixLength : 0);
      const sizeInBytes = 4 * Math.ceil(stringLength / 3) * 0.5624896334383812;
      const compressedSizeMBValue = sizeInBytes / (1024 * 1024);
      
      const payload = {
        title: capturedTitle || "Momen Vektorion",
        category: "MOMEN",
        description: capturedDescription,
        url: finalDataUrl,
        size: compressedSizeMBValue.toFixed(2) + " MB",
        date: new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }),
        fullTime: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        createdAt: serverTimestamp(),
        uploadedBy: capturedProfileName,
        uploadedByPhoto: capturedProfilePhoto,
        userEmail: user?.email,
        userId: user?.uid,
        aspectRatio: capturedRatio,
        isTemp: true // Add temporary flag for filtering during upload
      };

      await addDoc(collection(db, "gallery"), payload);
      
      setUploadProgress(100);
      setBackgroundUpload({ status: 'success', message: 'BERHASIL TERUPLOAD!' });
      
      // Delay disabling uploading state slightly to ensure smooth transition from notification
      setTimeout(() => {
        setUploading(false);
      }, 500);
      
      // Clear notification after 2.5 seconds
      setTimeout(() => {
        setBackgroundUpload(null);
      }, 2500);

      resetUploadForm();
    } catch (err: any) {
      console.error(err);
      setBackgroundUpload({ status: 'error', message: 'GAGAL MENGUPLOAD FOTO.' });
      setUploading(false); // Enable for errors immediately
      setTimeout(() => {
        setBackgroundUpload(null);
      }, 4000);
    }
  };

  // Lock body scroll when modal is open and hide navbar
  useEffect(() => {
    if (selectedImage || deleteConfirmId || isUploadFormOpen) {
      document.body.style.overflow = 'hidden';
      setNavbarVisible(false);
    } else {
      document.body.style.overflow = 'unset';
      setNavbarVisible(true);
    }
    return () => {
      document.body.style.overflow = 'unset';
      setNavbarVisible(true);
    };
  }, [selectedImage, deleteConfirmId, isUploadFormOpen, setNavbarVisible]);

  const handleShare = async (e: React.MouseEvent, img: GalleryItem) => {
    e.stopPropagation();
    const slugify = (text: string) => {
      return text
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, '')
        .replace(/[\s_]+/g, '-')
        .replace(/^-+|-+$/g, '');
    };
    const slug = slugify(img.title || 'momen');
    const shareUrl = `${window.location.origin}${window.location.pathname}?id=${img.id}&title=${encodeURIComponent(slug)}`;
    const shareText = `Lihat momen "${img.title}" di Galeri Vektorion!`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Galeri Vektorion',
          text: shareText,
          url: shareUrl,
        });
      } catch (err) {
        console.log("Error sharing:", err);
      }
    } else {
      // Fallback
      const waUrl = `https://wa.me/?text=${encodeURIComponent(shareText + " " + shareUrl)}`;
      window.open(waUrl, '_blank');
    }
  };

  const handleDownload = async (e: React.MouseEvent, img: GalleryItem) => {
    e.stopPropagation();
    try {
      const response = await fetch(img.url);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${img.title.toLowerCase().replace(/\s+/g, '_')}_vektorion.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Gagal mendownload:", err);
    }
  };

  const handleDelete = async (id: string) => {
    setDeleting(true);
    try {
      // Small delay for better UX
      await new Promise(resolve => setTimeout(resolve, 500));
      await deleteDoc(doc(db, "gallery", id));
      
      if (selectedImage?.id === id) setSelectedImage(null);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `gallery/${id}`);
    } finally {
      setDeleting(false);
    }
  };

  const resetUploadForm = () => {
    stopCamera();
    setNewImage({
      title: "",
      description: "",
      file: null,
      preview: "",
      size: ""
    });
    setFormErrors({ title: false });
    setUploadSuccess(false);
    setUploadError(null);
    setUploadProgress(0);
    setSelectedRatio('original');
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setCroppedAreaPixels(null);
  };

  const ratios = [
    { label: 'Asli', value: 'original' },
    { label: '1:1', value: '1:1' },
    { label: '4:3', value: '4:3' },
    { label: '16:9', value: '16:9' },
  ];

  // Hide navbar when modals are open
  useEffect(() => {
    if (isUploadFormOpen || !!selectedImage || !!deleteConfirmId) {
      setNavbarVisible(false);
      document.body.style.overflow = 'hidden';
    } else {
      setNavbarVisible(true);
      document.body.style.overflow = 'auto';
    }
    return () => {
      setNavbarVisible(true);
      document.body.style.overflow = 'auto';
    };
  }, [isUploadFormOpen, selectedImage, deleteConfirmId, setNavbarVisible]);

  const idsInView = images.filter(img => {
    // If we are currently uploading, hide the temporary image that just appeared in Firestore
    // to avoid double appearance or premature appearance.
    if (uploading && img.userId === user?.uid && (img as any).isTemp) return false;
    return true;
  });

  const totalToLoad = idsInView.length;

  if (loading) return <GaleriSkeleton />;

  return (
    <MaintenanceGuard menuId="galeri">
      <div className="bg-slate-50 min-h-screen relative overflow-hidden">
      <Helmet>
        <title>{selectedImage ? `${selectedImage.title} | Galeri Vektorion` : "Galeri Momen | Vektorion"}</title>
        <meta name="description" content={selectedImage?.description || "Koleksi momen berharga Angkatan Fisika 2025 Vektorion."} />
        {selectedImage && (
          <>
            <meta property="og:title" content={selectedImage.title} />
            <meta property="og:description" content={selectedImage.description} />
            <meta property="og:image" content={selectedImage.url} />
            <meta property="og:type" content="article" />
          </>
        )}
      </Helmet>
      {/* Hero Header */}
      <div className="relative min-h-[420px] flex flex-col overflow-hidden">
        <div className="absolute inset-0">
            <img 
              src={heroImage} 
              alt="Gallery Background" 
              className="w-full h-full object-cover absolute inset-0"
              referrerPolicy="no-referrer"
            />
          <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-slate-900/60 to-slate-50 z-10" />
        </div>

        <div className="relative z-10 container mx-auto px-6 h-full flex flex-col justify-center pt-24 pb-12">
          <div className="space-y-4 mb-auto">
            <div className="space-y-0">
              <h1 className="text-4xl md:text-6xl font-black text-white tracking-tighter leading-[0.85]">
                Galeri
              </h1>
              <h1 className="text-4xl md:text-6xl font-black text-amber-500 tracking-tighter leading-[0.85]">
                Angkatan
              </h1>
            </div>
            <p className="max-w-md text-white/70 text-sm font-medium leading-relaxed">
              Kumpulan momen berharga dari berbagai kegiatan dan kebersamaan angkatan Fisika 2025.
            </p>
          </div>
          
          <div className="space-y-2 w-full mt-12 md:mt-24">
            <div className="flex justify-between items-end px-1">
              <div />
              <span className="text-[9px] font-black text-white/30 tracking-[0.2em] font-mono leading-none">
                {loadedCount}/{totalToLoad}
              </span>
            </div>
            <div className="flex flex-row items-center gap-3 w-full">
              {user ? (
                <button 
                  onClick={() => setIsUploadFormOpen(!isUploadFormOpen)}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-3 px-6 py-1 rounded-md font-bold text-[9px] tracking-wide transition-all shadow-xl active:scale-95 border border-white/10 h-[30px]",
                    isUploadFormOpen ? "bg-slate-900 text-white" : "bg-white text-slate-900 hover:bg-amber-500 hover:text-white"
                  )}
                >
                  {isUploadFormOpen ? <X size={12} /> : <Plus size={12} />}
                  {isUploadFormOpen ? "BATALKAN" : "UPLOAD MOMEN"}
                </button>
              ) : (
                <div className="flex-1 flex justify-center items-center h-[30px]">
                  <p className="text-[9px] font-bold text-white/50 tracking-wide">Lihat arsip momen</p>
                </div>
              )}

              <div className="flex bg-white/10 backdrop-blur-md p-0.5 rounded-md border border-white/5 shadow-2xl shrink-0 h-[30px] items-center">
                <button
                  onClick={() => toggleDensity('normal')}
                  className={cn(
                    "px-3 py-1 rounded-sm transition-all relative overflow-hidden h-full flex items-center",
                    density === 'normal' ? "bg-white shadow-lg" : "text-white/40 hover:text-white"
                  )}
                >
                  <img 
                    src="https://cdn-icons-png.flaticon.com/128/7005/7005653.png" 
                    alt="Normal" 
                    className={cn(
                      "w-2.5 h-2.5 transition-all",
                      density === 'normal' ? "brightness-0" : "brightness-0 invert opacity-40"
                    )}
                  />
                </button>
                <button
                  onClick={() => toggleDensity('compact')}
                  className={cn(
                    "px-2.5 py-1 rounded-sm transition-all relative overflow-hidden h-full flex items-center",
                    density === 'compact' ? "bg-white shadow-lg" : "text-white/40 hover:text-white"
                  )}
                >
                  <img 
                    src="https://cdn-icons-png.flaticon.com/128/10386/10386963.png" 
                    alt="Compact" 
                    className={cn(
                      "w-2.5 h-2.5 transition-all",
                      density === 'compact' ? "brightness-0" : "brightness-0 invert opacity-40"
                    )}
                  />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 pt-2 pb-24 relative z-20">
        <div className="max-w-[1400px] mx-auto min-h-[400px]">
          {loading ? (
            <div className={cn(
              "gap-5 columns-1 md:columns-2 lg:columns-3 xl:columns-4"
            )}>
              {Array(6).fill(0).map((_, i) => (
                <div key={i} className="mb-5 animate-pulse bg-slate-200/50 rounded-xl w-full h-[300px]" />
              ))}
            </div>
          ) : images.length > 0 ? (
            <div className={cn(
              "gap-5 space-y-5 transition-all duration-500",
              density === 'compact' 
                ? "columns-2 sm:columns-3 lg:columns-4 xl:columns-6" 
                : "columns-1 md:columns-2 lg:columns-3 xl:columns-4"
            )}>
              {idsInView.map((img, idx) => {
                return (
                  <GalleryCard 
                    key={img.id} 
                    img={img} 
                    idx={idx} 
                    user={user} 
                    profile={profile} 
                    onSelect={setSelectedImage}
                    onDelete={handleDelete}
                    density={density}
                    onRendered={() => setLoadedCount(prev => prev + 1)}
                    activeMenuId={activeMenuId}
                    onActiveMenuChange={setActiveMenuId}
                  />
                );
              })}
            </div>
          ) : false ? (
             <div className="columns-1 md:columns-2 lg:columns-3 xl:columns-4 gap-5 space-y-5">
              {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                <div key={i} className="relative rounded-lg overflow-hidden bg-slate-100/50 break-inside-avoid border border-slate-50 shadow-sm animate-pulse">
                  <div 
                    className={cn(
                      "w-full bg-slate-100",
                      i % 3 === 0 ? "aspect-[3/4]" : i % 2 === 0 ? "aspect-[4/5]" : "aspect-[2/3]"
                    )}
                  />
                  <div className="p-4 space-y-2">
                    <div className="h-2.5 w-3/4 bg-slate-100 rounded-full" />
                    <div className="h-1.5 w-1/2 bg-slate-50 rounded-full" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-40 animate-in fade-in duration-1000">
              <img 
                src="https://cdn-icons-gif.flaticon.com/11629/11629830.gif" 
                alt="Loading..." 
                className="w-12 h-12 opacity-80"
              />
            </div>
          )}
        </div>

        {/* Gallery Upload Modal */}
        <AnimatePresence>
          {isUploadFormOpen && (
            <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
              />
              <motion.div 
                initial={{ y: 50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 50, opacity: 0 }}
                className="relative w-full max-w-lg bg-slate-50 rounded-md shadow-2xl overflow-hidden max-h-[95vh] flex flex-col"
              >
                {/* Header Profile Info di Modal */}
                <div className="p-4 border-b border-slate-100/50 flex items-center justify-between bg-white/60 backdrop-blur-md">
                  <ContributorInfo 
                    userId={user?.uid} 
                    fallbackName={profile?.fullName || user?.displayName} 
                    fallbackPhoto={profile?.photoURL || user?.photoURL}
                    size="md"
                  />
                  <button 
                    onClick={() => !uploading && setIsUploadFormOpen(false)}
                    className="p-2 text-slate-400 hover:text-red-500 transition-colors"
                  >
                    <X size={20} />
                  </button>
                </div>

                <div className="overflow-y-auto p-6 space-y-6 bg-white/40 backdrop-blur-sm">
                  {/* Aspect Ratio Selection */}
                  {!isCameraActive && newImage.preview && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                         <p className="text-[10px] font-medium text-slate-900 tracking-widest flex items-center gap-2">
                           Atur presisi foto
                         </p>
                         <div className="flex gap-1">
                           {ratios.map(r => (
                             <button
                               key={r.value}
                               onClick={() => setSelectedRatio(r.value)}
                               className={cn(
                                 "px-3 py-1 text-[8px] font-bold uppercase tracking-widest rounded-sm transition-all",
                                 selectedRatio === r.value ? "bg-slate-900 text-white shadow-lg" : "bg-white/80 text-slate-400 hover:bg-slate-100"
                               )}
                             >
                               {r.label}
                             </button>
                           ))}
                         </div>
                      </div>
                    </div>
                  )}

                  {/* Photo Dropzone / Preview */}
                  <div className="relative group">
                    {!isCameraActive ? (
                      <div 
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                        onClick={() => !newImage.preview && fileInputRef.current?.click()}
                        className={cn(
                          "relative aspect-square md:aspect-video rounded-md border-2 border-dashed transition-all flex flex-col items-center justify-center gap-4 overflow-hidden shadow-inner",
                          isDragging ? "border-amber-500 bg-amber-50/30" : 
                          newImage.preview ? "border-transparent" : "border-slate-200/50 bg-white/50 hover:bg-white/80 cursor-pointer"
                        )}
                        style={!newImage.preview ? {
                          backgroundImage: `url("https://res.cloudinary.com/dew39kqhy/image/upload/v1778841510/ChatGPT_Image_15_Mei_2026_17.37.07_obhnjw.png")`,
                          backgroundSize: 'cover',
                          backgroundPosition: 'center'
                        } : {}}
                      >
                        {newImage.preview ? (
                          <>
                            {selectedRatio === 'original' ? (
                               <img 
                                 src={newImage.preview} 
                                 alt="Preview" 
                                 className="w-full h-full object-contain"
                               />
                            ) : (
                              <div className="absolute inset-0">
                                <Cropper
                                  image={newImage.preview}
                                  crop={crop}
                                  zoom={zoom}
                                  aspect={selectedRatio === '1:1' ? 1 : selectedRatio === '4:3' ? 4/3 : 16/9}
                                  onCropChange={setCrop}
                                  onCropComplete={onCropComplete}
                                  onZoomChange={setZoom}
                                  showGrid={false}
                                />
                              </div>
                            )}
                            
                            {generatingAi && (
                               <div className="absolute inset-0 bg-white/60 backdrop-blur-md z-20 flex flex-col items-center justify-center">
                                  <Loader2 size={32} className="animate-spin text-slate-800" />
                               </div>
                            )}

                            {!generatingAi && (
                              <div className="absolute top-3 right-3 z-30 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setNewImage(p => ({ ...p, preview: "", file: null }));
                                    setUploadError(null);
                                  }}
                                  className="w-8 h-8 bg-white/90 backdrop-blur-md text-red-500 rounded-full shadow-md flex items-center justify-center hover:bg-red-500 hover:text-white transition-all active:scale-90"
                                  title="Ganti Foto"
                                >
                                  <X size={14} />
                                </button>
                              </div>
                            )}
                          </>
                        ) : (
                          <>
                            <div className="w-10 h-10 bg-white rounded-md shadow-sm border border-slate-100 flex items-center justify-center text-amber-500">
                              <Plus size={20} />
                            </div>
                            <div className="text-center">
                              <p className="text-[10px] font-medium text-slate-800 uppercase tracking-widest mb-1">Seret Foto Ke Sini</p>
                              <p className="text-[8px] font-normal text-slate-400 tracking-widest">Atau klik untuk pilih dari galeri</p>
                            </div>
                          </>
                        )}
                      </div>
                    ) : (
                      <div className="relative aspect-square md:aspect-video rounded-md bg-black overflow-hidden border-2 border-white/20 shadow-2xl">
                        <video 
                          ref={videoRef} 
                          autoPlay 
                          playsInline 
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute bottom-6 left-0 right-0 flex items-center justify-center gap-6 z-20">
                          <button 
                            onClick={stopCamera}
                            className="p-2.5 bg-black/40 backdrop-blur-md text-white rounded-full border border-white/20 hover:bg-red-500 transition-all shadow-xl active:scale-90"
                          >
                            <X size={16} />
                          </button>
                          <button 
                            onClick={capturePhoto}
                            className="w-14 h-14 bg-white rounded-full flex items-center justify-center border-4 border-black/10 shadow-2xl active:scale-95 transition-transform"
                          >
                            <div className="w-10 h-10 bg-white border-2 border-slate-900 rounded-full" />
                          </button>
                          <button 
                            onClick={toggleCamera}
                            className="p-2.5 bg-black/40 backdrop-blur-md text-white rounded-full border border-white/20 hover:bg-slate-900 transition-all shadow-xl active:scale-90"
                          >
                            <Camera size={16} />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Camera Toggle Button */}
                  {!newImage.preview && !isCameraActive && (
                    <div className="flex justify-center">
                      <button 
                        onClick={() => startCamera()}
                        className="text-[9px] font-medium text-slate-500 hover:text-slate-900 uppercase tracking-widest flex items-center gap-2 transition-colors py-1"
                      >
                        <Camera size={14} /> Ambil foto langsung
                      </button>
                    </div>
                  )}

                  {/* Form Fields */}
                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                         <p className="text-[10px] font-medium text-slate-400 tracking-widest">Judul momen</p>
                         <span className="text-[8px] font-medium text-amber-500/80 tracking-widest leading-none">Maks 3 kata</span>
                      </div>
                      <input 
                        type="text" 
                        placeholder="Berikan judul..."
                        value={newImage.title}
                        onChange={(e) => {
                          setNewImage({ ...newImage, title: e.target.value });
                          if (e.target.value.trim()) setFormErrors(p => ({ ...p, title: false }));
                        }}
                        className={cn(
                          "w-full px-4 h-11 bg-white/60 backdrop-blur-md border rounded-sm text-slate-900 text-sm font-bold placeholder:text-slate-300 focus:outline-none transition-all",
                          formErrors.title ? "border-red-500 focus:ring-red-500/10" : "border-slate-100 focus:border-amber-500/50 focus:ring-4 focus:ring-amber-500/5"
                        )}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <p className="text-[10px] font-medium text-slate-400 tracking-widest">Deskripsi (opsional)</p>
                        <span className="text-[8px] font-medium text-slate-400 tracking-widest">{newImage.description.length}/100</span>
                      </div>
                      <textarea 
                        placeholder="Ceritakan sedikit tentang foto ini..."
                        value={newImage.description}
                        onChange={(e) => e.target.value.length <= 100 && setNewImage({ ...newImage, description: e.target.value })}
                        className="w-full p-4 bg-white/60 backdrop-blur-md border border-slate-100 rounded-sm text-slate-900 text-xs font-medium placeholder:text-slate-300 focus:outline-none focus:border-amber-500/50 focus:ring-4 focus:ring-amber-500/5 transition-all resize-none h-20"
                      />
                    </div>
                  </div>

                  {uploadError && (
                    <motion.div 
                      initial={{ opacity: 0, x: -10 }} 
                      animate={{ opacity: 1, x: 0 }}
                      className="p-3 bg-red-50/80 backdrop-blur-sm border border-red-100 rounded-sm flex items-center gap-2"
                    >
                      <AlertCircle className="text-red-500" size={14} />
                      <p className="text-[9px] font-medium text-red-600 tracking-wide">{uploadError}</p>
                    </motion.div>
                  )}
                </div>

                <div className="p-6 bg-white/60 backdrop-blur-md border-t border-slate-100/50">
                  <button 
                    disabled={uploading || !newImage.file || generatingAi}
                    onClick={handleUpload}
                    className="w-full py-4 text-white rounded-sm font-bold text-[10px] uppercase tracking-[0.4em] flex items-center justify-center gap-3 transition-all active:scale-[0.98] shadow-xl disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden group"
                    style={{ 
                      backgroundImage: `url("https://res.cloudinary.com/dew39kqhy/image/upload/v1778844203/ChatGPT_Image_15_Mei_2026_18.22.55_znq6au.png")`,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center'
                    }}
                  >
                    <div className="absolute inset-0 bg-slate-900/40 group-hover:bg-slate-900/20 transition-colors" />
                    <span className="relative z-10 flex items-center gap-3">
                      {uploading ? (
                        <>
                          <Loader2 size={16} className="animate-spin text-amber-500" />
                          Upload Momen
                        </>
                      ) : (
                        "Upload Momen"
                      )}
                    </span>
                  </button>
                  <p className="text-center mt-3 text-[7px] font-medium text-slate-400 tracking-[0.2em] relative z-10">Foto akan dipublikasikan ke seluruh anggota vektorion</p>
                </div>
              </motion.div>
              <input 
                type="file" 
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/*"
                className="hidden"
              />
            </div>
          )}
        </AnimatePresence>

        {/* Image Detail Modal */}
        <AnimatePresence>
          {selectedImage && (
            <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-white/40 backdrop-blur-xl"
                onClick={() => setSelectedImage(null)}
              />
              <motion.div 
                key={selectedImage.id}
                drag="x"
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={0.4}
                onDragEnd={(_e, info) => {
                  const swipeThreshold = 60;
                  if (info.offset.x > swipeThreshold) {
                    const currentIndex = images.findIndex(img => img.id === selectedImage.id);
                    if (currentIndex > -1) {
                      const prevIndex = (currentIndex - 1 + images.length) % images.length;
                      setSelectedImage(images[prevIndex]);
                    }
                  } else if (info.offset.x < -swipeThreshold) {
                    const currentIndex = images.findIndex(img => img.id === selectedImage.id);
                    if (currentIndex > -1) {
                      const nextIndex = (currentIndex + 1) % images.length;
                      setSelectedImage(images[nextIndex]);
                    }
                  }
                }}
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                transition={{ type: "spring", bounce: 0, duration: 0.3 }}
                className="relative max-w-[340px] md:max-w-4xl w-full bg-white rounded-lg overflow-hidden shadow-2xl flex flex-col md:flex-row m-auto aspect-square md:aspect-auto md:h-[65vh] max-h-[90vh] ring-1 ring-white/10"
                onClick={e => e.stopPropagation()}
              >
                {/* Image Section (Top on mobile, Left on desktop) */}
                <div className="h-1/2 md:h-full md:flex-1 bg-slate-100 relative overflow-hidden group/detail">
                  <img 
                    src={selectedImage.url} 
                    alt={selectedImage.title}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />
                  
                  {/* Action Icons - Positioned properly at top right */}
                  <div className="absolute top-3 right-3 md:top-4 md:right-4 flex gap-2 z-10">
                     <button 
                       onClick={(e) => handleShare(e, selectedImage)}
                       className="p-2 bg-black/20 hover:bg-black/40 backdrop-blur-md text-white rounded-full transition-all hover:scale-110 shadow-lg"
                       title="Bagikan"
                     >
                        <Share2 size={16} />
                     </button>
                     <button 
                       onClick={(e) => handleDownload(e, selectedImage)}
                       className="p-2 bg-black/20 hover:bg-black/40 backdrop-blur-md text-white rounded-full transition-all hover:scale-110 shadow-lg"
                       title="Download"
                     >
                        <Download size={16} />
                     </button>
                     <button 
                       onClick={() => setSelectedImage(null)}
                       className="p-2 bg-black/20 hover:bg-red-500/80 backdrop-blur-md text-white rounded-full transition-all hover:scale-110 shadow-lg"
                     >
                        <X size={16} />
                     </button>
                  </div>
                </div>

                {/* Info Section (Bottom on mobile, Right on desktop) */}
                <div className="h-1/2 md:h-full p-5 md:p-8 flex flex-col justify-between bg-white md:w-[360px] lg:w-[420px] shrink-0 overflow-y-auto">
                  <div className="space-y-2 md:space-y-4">
                    <h2 className="text-sm md:text-xl font-black text-slate-900 uppercase tracking-tight leading-none whitespace-normal">
                      {selectedImage.title}
                    </h2>
                    {selectedImage.description && (
                       <p className="text-slate-500 text-[9px] md:text-xs font-medium leading-relaxed">
                        {selectedImage.description}
                       </p>
                    )}
                  </div>

                  <div className="space-y-4 pt-4 mt-6 border-t border-slate-100">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1 md:space-y-2">
                        <p className="text-[6px] md:text-[8px] font-black text-slate-300 uppercase tracking-widest">Kontributor</p>
                        <ContributorInfo 
                          userId={selectedImage.userId} 
                          fallbackName={selectedImage.uploadedBy} 
                          fallbackPhoto={selectedImage.uploadedByPhoto}
                          size="sm"
                        />
                      </div>

                      <div className="space-y-1 md:space-y-2">
                        <p className="text-[6px] md:text-[8px] font-black text-slate-300 uppercase tracking-widest">Presisi Waktu</p>
                        <div className="flex items-center gap-1 text-slate-900">
                           <img 
                             src="https://cdn-icons-png.flaticon.com/128/785/785915.png" 
                             alt="" 
                             className="w-2.5 h-2.5 md:w-3.5 md:h-3.5 object-contain brightness-0 saturate-100 invert-[71%] sepia-[85%] saturate-[1637%] hue-rotate-[352deg] brightness-[98%] contrast-[98%]" 
                           />
                           <p className="text-[8px] md:text-[10px] font-bold uppercase truncate">
                             {selectedImage.createdAt?.toDate 
                               ? selectedImage.createdAt.toDate().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) 
                               : selectedImage.date}
                           </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Background Upload Notification - As requested by Fanra */}
        <AnimatePresence>
          {backgroundUpload && (
            <motion.div
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 20, opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed bottom-20 left-1/2 -translate-x-1/2 z-[100] w-auto px-4"
            >
              <div className={cn(
                "px-4 py-2 rounded-sm shadow-xl border flex items-center gap-2.5 backdrop-blur-md bg-white/95 transition-all duration-500",
                backgroundUpload.status === 'error' ? "border-red-200 text-slate-800" : "border-slate-200 text-slate-800"
              )}>
                {backgroundUpload.status === 'uploading' ? (
                  <Loader2 size={12} className="animate-spin text-amber-500" />
                ) : backgroundUpload.status === 'success' ? (
                  <CheckCircle2 size={14} className="text-emerald-500" />
                ) : (
                  <AlertCircle size={14} className="text-red-500" />
                )}
                <p className="text-[8px] font-black uppercase tracking-[0.2em] leading-none whitespace-nowrap">
                  {backgroundUpload.message}
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  </MaintenanceGuard>
);
}
