import React from 'react';
import { useApp } from '../context/AppContext';
import {
  Plus,
  Shield,
  Layers,
  Menu,
  X,
  Sun,
  ArrowLeftRight,
} from 'lucide-react';

interface NavbarProps {
  onToggleMobileMenu: () => void;
  isMobileMenuOpen: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  onToggleMobileMenu,
  isMobileMenuOpen,
}) => {
  const {
    setIsQuickCaptureOpen,
    currentUserRole,
    setActiveTab,
    coreModule,
    setCoreModule,
    setIsModuleSelectModalOpen,
  } = useApp();

  return (
    <header className="sticky top-0 z-40 bg-slate-950/95 backdrop-blur-md border-b border-slate-800 text-white">
      <div className="px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        {/* Left: Brand & Province Seal */}
        <div className="flex items-center gap-3">
          <button
            onClick={onToggleMobileMenu}
            className="md:hidden p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white"
            aria-label="Toggle navigation menu"
          >
            {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          <div
            onClick={() => setActiveTab('dashboard')}
            className="flex items-center gap-3 cursor-pointer group"
          >
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center shadow-lg font-black text-slate-950 text-base border transition-transform group-hover:scale-105 ${
                coreModule === 'el_nino'
                  ? 'bg-gradient-to-br from-rose-500 to-rose-700 shadow-rose-500/20 border-rose-400/40 text-white'
                  : 'bg-gradient-to-br from-amber-500 to-amber-700 shadow-amber-500/20 border-amber-400/40'
              }`}
            >
              {coreModule === 'el_nino' ? <Sun className="w-5 h-5" /> : 'CP'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-sm sm:text-base tracking-tight text-white group-hover:text-amber-400 transition-colors">
                  Central Province
                </span>
                {coreModule === 'el_nino' ? (
                  <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30 font-semibold hidden sm:inline flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-pulse" />
                    El Niño Relief Active
                  </span>
                ) : (
                  <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-semibold hidden sm:inline">
                    Abau Focus &bull; Rigo Frozen
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-400 font-medium hidden sm:block">
                {coreModule === 'el_nino'
                  ? 'Abau District El Niño Drought & Water Emergency Platform'
                  : 'Digital Infrastructure & Asset Management Platform'}
              </p>
            </div>
          </div>
        </div>

        {/* Center: Core Module Quick Switcher */}
        <div className="hidden md:flex items-center bg-slate-900/90 border border-slate-800 p-1 rounded-xl shadow-inner gap-1">
          <button
            onClick={() => {
              setCoreModule('infrastructure');
              setActiveTab('dashboard');
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              coreModule === 'infrastructure'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Infrastructure Platform</span>
          </button>

          <button
            onClick={() => {
              setCoreModule('el_nino');
              setActiveTab('dashboard');
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              coreModule === 'el_nino'
                ? 'bg-rose-500 text-white shadow-md shadow-rose-500/20'
                : 'text-slate-400 hover:text-rose-400'
            }`}
          >
            <Sun className="w-3.5 h-3.5" />
            <span>El Niño Relief Project</span>
            {coreModule !== 'el_nino' && (
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping" />
            )}
          </button>

          <button
            onClick={() => setIsModuleSelectModalOpen(true)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors ml-0.5 cursor-pointer"
            title="Open Full Module Selection Portal"
          >
            <ArrowLeftRight className="w-3.5 h-3.5 text-amber-400" />
          </button>
        </div>

        {/* Right: Field Capture & Role Badge */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Quick GPS Capture Button */}
          <button
            onClick={() => setIsQuickCaptureOpen(true)}
            className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold flex items-center gap-1.5 shadow-md transition-all whitespace-nowrap cursor-pointer"
            title="Record New Infrastructure / Defect GPS Point"
          >
            <Plus className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Quick GPS Log</span>
            <span className="sm:hidden">Log</span>
          </button>

          {/* User Role Pill */}
          <div
            onClick={() => setActiveTab('settings')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300 cursor-pointer hover:border-slate-700 hover:text-white transition-colors"
            title="Switch User Role in Settings"
          >
            <Shield className="w-3.5 h-3.5 text-amber-400" />
            <span className="truncate max-w-[140px] font-medium hidden sm:inline">{currentUserRole}</span>
          </div>
        </div>
      </div>
    </header>
  );
};
