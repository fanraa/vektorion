import React, { useState, useEffect } from 'react';
import { cn } from '../../lib/utils';
import { Skeleton } from './Skeleton';

interface OptimizedImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  fallbackClassName?: string;
}

export const OptimizedImage: React.FC<OptimizedImageProps> = ({ 
  src, 
  alt, 
  className, 
  fallbackClassName,
  ...props 
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!src) return;
    
    // Reset state when src changes
    setIsLoaded(false);
    setError(false);

    const img = new Image();
    img.src = src;
    img.onload = () => setIsLoaded(true);
    img.onerror = () => setError(true);
  }, [src]);

  return (
    <div className={cn("relative overflow-hidden w-full h-full", !isLoaded && fallbackClassName)}>
      {!isLoaded && !error && (
        <div className="absolute inset-0 z-10">
          <Skeleton className="w-full h-full rounded-none" />
        </div>
      )}
      
      {error ? (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-100 text-slate-400 text-xs">
          Gagal memuat
        </div>
      ) : (
        <img
          src={src}
          alt={alt}
          className={cn(
            "transition-opacity duration-700 w-full h-full object-cover",
            isLoaded ? "opacity-100" : "opacity-0",
            className
          )}
          loading="lazy"
          referrerPolicy="no-referrer"
          {...props}
        />
      )}
    </div>
  );
};
