import React from 'react';

export function SkeletonBlock({ className = '' }) {
  return <div aria-hidden="true" className={`marfil-skeleton rounded-xl ${className}`} />;
}

export function SkeletonCard() {
  return (
    <div className="bg-white rounded-2xl border border-[#1F1410]/8 p-5 space-y-3 shadow-2xs">
      <div className="flex items-center justify-between gap-3">
        <SkeletonBlock className="h-5 w-24 rounded-full" />
        <SkeletonBlock className="h-5 w-16 rounded-full" />
      </div>
      <SkeletonBlock className="h-6 w-3/4" />
      <SkeletonBlock className="h-4 w-full" />
      <SkeletonBlock className="h-4 w-2/3" />
      <div className="pt-3 border-t border-[#1F1410]/8 flex justify-between items-center">
        <SkeletonBlock className="h-4 w-24" />
        <SkeletonBlock className="h-8 w-28 rounded-full" />
      </div>
    </div>
  );
}

export function SkeletonTable({ filas = 5 }) {
  return (
    <div aria-busy="true" aria-label="Cargando registros" className="divide-y divide-[#1F1410]/8 p-4 space-y-3">
      {Array.from({ length: filas }).map((_, idx) => (
        <div key={idx} className="pt-3 first:pt-0 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 flex-1">
            <SkeletonBlock className="w-9 h-9 rounded-full shrink-0" />
            <div className="space-y-1.5 flex-1 max-w-xs">
              <SkeletonBlock className="h-4 w-3/4" />
              <SkeletonBlock className="h-3 w-1/2" />
            </div>
          </div>
          <SkeletonBlock className="h-5 w-20 hidden sm:block" />
          <SkeletonBlock className="h-6 w-24 rounded-full" />
          <SkeletonBlock className="h-7 w-16 rounded-lg" />
        </div>
      ))}
    </div>
  );
}

export function SkeletonDashboard() {
  return (
    <div aria-busy="true" aria-label="Cargando panel" className="space-y-5 p-2">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-white rounded-2xl border border-[#1F1410]/8 p-4 space-y-2.5">
            <SkeletonBlock className="h-3 w-24" />
            <SkeletonBlock className="h-8 w-20" />
            <SkeletonBlock className="h-3 w-32" />
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <div className="lg:col-span-8 bg-white rounded-2xl border border-[#1F1410]/8 p-5 space-y-4">
          <SkeletonBlock className="h-5 w-48" />
          <SkeletonBlock className="h-44 w-full" />
        </div>
        <div className="lg:col-span-4 bg-white rounded-2xl border border-[#1F1410]/8 p-5 space-y-4">
          <SkeletonBlock className="h-5 w-36" />
          <SkeletonBlock className="h-44 w-full rounded-full max-w-[180px] mx-auto" />
        </div>
      </div>
    </div>
  );
}
