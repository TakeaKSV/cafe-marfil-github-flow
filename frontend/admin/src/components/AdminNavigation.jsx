import React from 'react';
import { 
  BarChart3, 
  LayoutGrid, 
  CalendarDays, 
  QrCode, 
  UtensilsCrossed, 
  Tag, 
  Dice5, 
  Users
} from 'lucide-react';
import { playSound } from '../utils/audioFeedback';

export const AdminNavigation = ({ activeTab, onSelectTab, soundEnabled, badges = {} }) => {
  const tabs = [
    { 
      id: 'dashboard', 
      label: 'Analítica & BI', 
      icon: BarChart3,
      badge: null
    },
    { 
      id: 'floorplan', 
      label: 'Host & Mesas en Vivo', 
      icon: LayoutGrid,
      badge: badges.mesasOcupadas ? `${badges.mesasOcupadas} ocup.` : null,
      badgeColor: 'bg-[#E12927] text-white'
    },
    { 
      id: 'reservations', 
      label: 'Reservas & Check-in', 
      icon: CalendarDays,
      badge: badges.reservasHoy ? `${badges.reservasHoy}` : null,
      badgeColor: 'bg-[#1F1410] text-white'
    },
    { 
      id: 'scanner', 
      label: 'Scanner QR & Caja', 
      icon: QrCode,
      badge: 'POS',
      badgeColor: 'bg-[#FCEAE9] text-[#E12927] border border-[#E12927]/30'
    },
    { 
      id: 'menu', 
      label: 'Cocina & Catálogo', 
      icon: UtensilsCrossed,
      badge: badges.agotados ? `${badges.agotados} agot.` : null,
      badgeColor: 'bg-amber-600 text-white'
    },
    { 
      id: 'promotions', 
      label: 'Promociones & Cupones', 
      icon: Tag,
      badge: null
    },
    { 
      id: 'ludoteca', 
      label: 'Ludoteca (+60 Juegos)', 
      icon: Dice5,
      badge: badges.juegosEnMesa ? `${badges.juegosEnMesa} en uso` : null,
      badgeColor: 'bg-[#1F1410] text-white'
    },
    { 
      id: 'staff', 
      label: 'Personal & Aforos', 
      icon: Users,
      badge: null
    }
  ];

  return (
    <div className="bg-white border-b border-[#1F1410]/10 overflow-x-auto scrollbar-none sticky top-20 z-30 shadow-2xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <nav className="flex space-x-1 sm:space-x-2 py-2.5 min-w-max">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                onClick={() => {
                  if (soundEnabled && !isActive) playSound('toggle');
                  onSelectTab(tab.id);
                }}
                className={`flex items-center gap-2 px-3.5 py-2 text-xs sm:text-sm font-semibold rounded-md transition-all cursor-pointer whitespace-nowrap ${
                  isActive
                    ? 'bg-[#1F1410] text-white shadow-xs'
                    : 'text-[#1F1410]/70 hover:text-[#1F1410] hover:bg-[#FAF7F5]'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-[#E12927]' : 'text-[#1F1410]/60'}`} />
                <span>{tab.label}</span>
                {tab.badge && (
                  <span className={`px-1.5 py-0.2 text-[10px] font-mono font-bold rounded-xs ${tab.badgeColor}`}>
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>
    </div>
  );
};
