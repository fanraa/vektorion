import React from "react";
import { cn } from "../../lib/utils";

interface SkeletonProps {
  className?: string;
  key?: React.Key;
}

export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={cn(
        "skeleton animate-pulse",
        className || "rounded-md"
      )}
    />
  );
}

export function HomeSkeleton() {
  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      {/* Hero Skeleton - Full Page */}
      <section className="relative h-screen flex items-end justify-center pb-24 md:pb-32 overflow-hidden bg-slate-200">
        <div className="container mx-auto px-4 relative z-30 text-center">
          <div className="max-w-4xl mx-auto flex flex-col items-center">
            <Skeleton className="h-16 md:h-24 w-64 md:w-96 mb-4 bg-slate-300/50" />
            <Skeleton className="h-4 w-48 md:w-64 mb-8 bg-slate-300/50" />
            <div className="flex flex-wrap items-center justify-center gap-3">
              <Skeleton className="h-12 w-40 bg-slate-300/50" />
              <Skeleton className="h-12 w-32 bg-slate-300/50" />
            </div>
          </div>
        </div>
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-slate-50/5 to-slate-50 z-20" />
      </section>

      {/* About Skeleton */}
      <section className="py-32 bg-slate-50">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto flex flex-col items-center">
            <Skeleton className="w-24 h-24 mb-10 rounded-full" />
            <Skeleton className="h-10 w-64 mb-4" />
            <Skeleton className="h-1 w-16 mb-16" />
            <div className="space-y-4 w-full mb-16">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6 mx-auto" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-48 w-full" />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Agenda/Gallery Sections Skeletons */}
      <section className="py-24 bg-slate-100">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <div className="flex items-center gap-4 mb-16">
              <Skeleton className="h-8 w-32" />
              <Skeleton className="h-1 flex-1" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 justify-items-center">
              <Skeleton className="h-32 w-full max-w-xs" />
              <Skeleton className="h-32 w-full max-w-xs" />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export function SkeletonPage({ children }: { children: React.ReactNode }) {
  return (
    <div className="w-full max-w-7xl mx-auto p-4 space-y-6 pt-32">
      {children}
    </div>
  );
}

export function StrukturSkeleton() {
  return (
    <SkeletonPage>
      <div className="text-center space-y-4 mb-24">
        <Skeleton className="h-10 w-64 mx-auto" />
        <Skeleton className="h-4 w-48 mx-auto" />
      </div>
      <div className="flex flex-col items-center space-y-12">
        <Skeleton className="w-24 h-24 rounded-full" />
        <Skeleton className="w-24 h-24 rounded-full" />
        <div className="flex gap-12">
          <Skeleton className="w-24 h-24 rounded-full" />
          <Skeleton className="w-24 h-24 rounded-full" />
        </div>
      </div>
      <div className="pt-32 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-8">
        {[...Array(12)].map((_, i) => (
          <div key={i} className="flex flex-col items-center space-y-3">
            <Skeleton className="w-16 h-16 rounded-full" />
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-3 w-24" />
          </div>
        ))}
      </div>
    </SkeletonPage>
  );
}

export function KasSkeleton() {
  return (
    <SkeletonPage>
      <div className="flex flex-col md:flex-row gap-6">
        <Skeleton className="h-64 flex-1 rounded-xl" />
        <Skeleton className="h-64 flex-1 rounded-xl" />
      </div>
      <div className="space-y-4 pt-8">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-xl" />
          ))}
        </div>
      </div>
    </SkeletonPage>
  );
}

export function AgendaSkeleton() {
  return (
    <SkeletonPage>
      <div className="space-y-4 mb-12">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-4 w-72" />
      </div>
      <div className="space-y-4">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-40 rounded-xl" />
        ))}
      </div>
    </SkeletonPage>
  );
}

export function GaleriSkeleton() {
  return (
    <SkeletonPage>
      <div className="flex justify-between items-center mb-8">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-10 w-32" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[...Array(6)].map((_, i) => (
          <Skeleton key={i} className="h-64 rounded-xl shadow-sm" />
        ))}
      </div>
    </SkeletonPage>
  );
}

export function InfoSkeleton() {
  return (
    <SkeletonPage>
      <div className="max-w-3xl mx-auto space-y-8">
        <Skeleton className="h-12 w-64" />
        {[...Array(3)].map((_, i) => (
          <div key={i} className="space-y-4">
            <Skeleton className="h-64 rounded-xl" />
            <div className="space-y-2">
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
            </div>
          </div>
        ))}
      </div>
    </SkeletonPage>
  );
}

export function LoginSkeleton() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8 bg-white p-8 rounded-xl shadow-lg border border-slate-100">
        <div className="flex flex-col items-center space-y-4">
          <Skeleton className="w-16 h-16 rounded-full" />
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-64" />
        </div>
        <div className="space-y-6">
          <div className="space-y-2">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-12 w-full rounded-md" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-12 w-full rounded-md" />
          </div>
          <Skeleton className="h-12 w-full rounded-md" />
        </div>
      </div>
    </div>
  );
}

export function ProfileSkeleton() {
  return (
    <div className="pt-32 pb-20 bg-slate-50 min-h-screen">
      <div className="container mx-auto px-4 max-w-lg space-y-12">
        <div className="flex flex-col items-center space-y-6">
          <Skeleton className="w-32 h-32 md:w-36 md:h-36 rounded-full" />
          <div className="space-y-3 flex flex-col items-center">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
        <div className="space-y-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-20 w-full rounded-md" />
          ))}
        </div>
      </div>
    </div>
  );
}

export function ImageSkeleton({ className }: { className?: string }) {
  return <Skeleton className={cn("w-full h-full min-h-[200px]", className)} />;
}
