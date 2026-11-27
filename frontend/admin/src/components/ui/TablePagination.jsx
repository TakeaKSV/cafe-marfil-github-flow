import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

/**
 * Paginación reutilizable con estética Café Marfil para tablas y catálogos del panel Admin.
 */
export const TablePagination = ({
  page,
  totalItems,
  pageSize,
  onPageChange,
  itemLabel = 'registros'
}) => {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  if (totalItems <= pageSize) return null;

  const safePage = Math.min(Math.max(1, page), totalPages);
  const start = (safePage - 1) * pageSize + 1;
  const end = Math.min(totalItems, safePage * pageSize);

  const pages = [];
  for (let p = 1; p <= totalPages; p += 1) {
    if (p === 1 || p === totalPages || Math.abs(p - safePage) <= 1) {
      pages.push(p);
    } else if (pages[pages.length - 1] !== '...') {
      pages.push('...');
    }
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 bg-[#FCF9F6] border-t border-[#1F1410]/8 text-xs font-mono">
      <span className="text-[#1F1410]/60">
        Mostrando <strong className="text-[#1F1410]">{start}–{end}</strong> de{' '}
        <strong className="text-[#1F1410]">{totalItems}</strong> {itemLabel}
      </span>

      <div className="flex items-center gap-1">
        <button
          type="button"
          disabled={safePage <= 1}
          onClick={() => onPageChange(safePage - 1)}
          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-full border border-[#1F1410]/12 bg-white text-[#1F1410] hover:border-[#E12927] hover:text-[#E12927] disabled:opacity-35 disabled:cursor-not-allowed cursor-pointer transition-colors"
          aria-label="Página anterior"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Anterior</span>
        </button>

        {pages.map((p, idx) =>
          p === '...' ? (
            <span key={`dots-${idx}`} className="px-1.5 text-[#1F1410]/40">
              …
            </span>
          ) : (
            <button
              key={p}
              type="button"
              onClick={() => onPageChange(p)}
              aria-current={p === safePage ? 'page' : undefined}
              className={`min-w-7 h-7 px-2 rounded-full font-bold transition-all cursor-pointer ${
                p === safePage
                  ? 'bg-[#E12927] text-white shadow-xs'
                  : 'bg-white border border-[#1F1410]/12 text-[#1F1410]/75 hover:border-[#E12927] hover:text-[#E12927]'
              }`}
            >
              {p}
            </button>
          )
        )}

        <button
          type="button"
          disabled={safePage >= totalPages}
          onClick={() => onPageChange(safePage + 1)}
          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-full border border-[#1F1410]/12 bg-white text-[#1F1410] hover:border-[#E12927] hover:text-[#E12927] disabled:opacity-35 disabled:cursor-not-allowed cursor-pointer transition-colors"
          aria-label="Página siguiente"
        >
          <span className="hidden sm:inline">Siguiente</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
