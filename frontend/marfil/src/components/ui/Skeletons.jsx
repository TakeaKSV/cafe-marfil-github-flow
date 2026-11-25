import React from 'react';

export function SkeletonBlock({ className = '' }) {
  return <div aria-hidden="true" className={`marfil-skeleton rounded-xl ${className}`} />;
}

export function SkeletonMenuGrid({ cantidad = 6 }) {
  return (
    <div aria-busy="true" aria-label="Cargando carta" className="max-w-6xl mx-auto px-4 py-8 space-y-6">
      <div className="space-y-2 max-w-md">
        <SkeletonBlock className="h-4 w-32 rounded-full" />
        <SkeletonBlock className="h-9 w-72" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: cantidad }).map((_, i) => (
          <div key={i} className="bg-white rounded-2xl border-2 border-stone-200 overflow-hidden shadow-xs">
            <SkeletonBlock className="h-48 w-full rounded-none" />
            <div className="p-5 space-y-3">
              <div className="flex justify-between">
                <SkeletonBlock className="h-4 w-24 rounded-full" />
                <SkeletonBlock className="h-4 w-16 rounded-full" />
              </div>
              <SkeletonBlock className="h-6 w-3/4" />
              <SkeletonBlock className="h-4 w-full" />
              <SkeletonBlock className="h-4 w-2/3" />
              <div className="pt-3 border-t border-stone-200 flex justify-between items-center">
                <SkeletonBlock className="h-5 w-20" />
                <SkeletonBlock className="h-9 w-28 rounded-md" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function SkeletonList({ filas = 4 }) {
  return (
    <div aria-busy="true" aria-label="Cargando información" className="max-w-4xl mx-auto px-4 py-8 space-y-4">
      <SkeletonBlock className="h-8 w-56" />
      {Array.from({ length: filas }).map((_, i) => (
        <div key={i} className="bg-white rounded-xl border-2 border-stone-200 p-5 flex items-center justify-between gap-4">
          <div className="space-y-2 flex-1">
            <SkeletonBlock className="h-5 w-48" />
            <SkeletonBlock className="h-3.5 w-72 max-w-full" />
          </div>
          <SkeletonBlock className="h-9 w-28 rounded-md shrink-0" />
        </div>
      ))}
    </div>
  );
}
