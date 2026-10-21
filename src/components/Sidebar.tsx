import React from 'react';
import { useApp } from '../context/AppContext';
import {
  LayoutDashboard,
  Compass,
  FileSpreadsheet,
  ClipboardCheck,
  AlertTriangle,
  Wrench,
  FileText,
  Sliders,
  ChevronRight,
  ShieldAlert,
  MapPin,
  ExternalLink,
  Sun,
  Layers,
  ArrowLeftRight,
  Wifi,
  WifiOff,
  RefreshCw,
} from 'lucide-react';

interface SidebarProps {
  isMobileOpen: boolean;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isMobileOpen, onCloseMobile }) => {
  const {
    activeTab,
    setActiveTab,
    assets,
    defects,
    inspections,
    districtFilter,
    setDistrictFilter,
    coreModule,
    setCoreModule,
    setIsModuleSelectModalOpen,
    isOffline,
    toggleOfflineSimulation,
    syncQueue,
    setIsSyncDrawerOpen,
  } = useApp();

  const openDefectsCount = defects.filter(
    d => d.status === 'Open' || d.status === 'Assigned' || d.status === 'In Progress'
  ).length;

  const criticalAssetsCount = assets.filter(
    a => a.conditionClassification === 'Critical'
  ).length;

  const navItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
      badge: undefined,
    },
    {
      id: 'map',
      label: 'GIS Map',
      icon: Compass,
      badge: 'Live',
      badgeColor: 'bg-emerald-500/20 text-emerald-400',
    },
    {
      id: 'register',
      label: 'Asset Register',
      icon: FileSpreadsheet,
      badge: String(assets.length),
      badgeColor: 'bg-slate-800 text-slate-300',
    },
    {
      id: 'inspections',
      label: 'Inspections',
      icon: ClipboardCheck,
      badge: String(inspections.length),
      badgeColor: 'bg-slate-800 text-slate-300',
    },
    {
      id: 'defects',
      label: 'Defect Register',
      icon: AlertTriangle,
      badge: openDefectsCount > 0 ? String(openDefectsCount) : undefined,
      badgeColor: 'bg-rose-500/20 text-rose-400 border border-rose-500/30',
    },
    {
      id: 'maintenance',
      label: 'Maintenance',
      icon: Wrench,
      badge: criticalAssetsCount > 0 ? `${criticalAssetsCount} Crit` : undefined,
      badgeColor: 'bg-amber-500/20 text-amber-400',
    },
    {
      id: 'reports',
      label: 'Reports',
      icon: FileText,
      badge: undefined,
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: Sliders,
      badge: undefined,
    },
  ] as const;

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 z-40 bg-slate-950/80 backdrop-blur-sm md:hidden"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed md:sticky top-16 left-0 z-40 h-[calc(100vh-4rem)] w-64 bg-slate-950 border-r border-slate-800/80 flex flex-col justify-between transition-transform duration-300 ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        <div className="p-4 space-y-5 overflow-y-auto">
          {/* Active Platform Module Card */}
          <div className={`p-3.5 rounded-2xl border transition-all ${
            coreModule === 'el_nino'
              ? 'bg-rose-950/40 border-rose-500/40 shadow-lg shadow-rose-950/30'
              : 'bg-slate-900 border-slate-800'
          }`}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] uppercase font-mono font-bold tracking-wider text-slate-400">
                Active Core Module
              </span>
              <button
                onClick={() => setIsModuleSelectModalOpen(true)}
                className="text-[10px] text-amber-400 hover:underline flex items-center gap-1 cursor-pointer"
                title="Switch platform module"
              >
                <ArrowLeftRight className="w-3 h-3" />
                <span>Switch</span>
              </button>
            </div>

            <div className="flex items-center gap-2.5">
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                coreModule === 'el_nino'
                  ? 'bg-rose-500 text-white shadow'
                  : 'bg-amber-500 text-slate-950 shadow'
              }`}>
                {coreModule === 'el_nino' ? <Sun className="w-4 h-4" /> : <Layers className="w-4 h-4" />}
              </div>
              <div className="min-w-0">
                <div className="font-bold text-xs text-white truncate">
                  {coreModule === 'el_nino' ? 'El Niño Relief Program' : 'Digital Infrastructure'}
                </div>
                <div className="text-[10px] text-slate-400 truncate">
                  {coreModule === 'el_nino' ? 'Abau Emergency Drought' : 'Central Province Assets'}
                </div>
              </div>
            </div>

            <button
              onClick={() => {
                setCoreModule(coreModule === 'infrastructure' ? 'el_nino' : 'infrastructure');
                setActiveTab('dashboard');
              }}
              className={`w-full mt-3 py-1.5 px-2.5 rounded-xl text-[11px] font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                coreModule === 'infrastructure'
                  ? 'bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30'
                  : 'bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30'
              }`}
            >
              <span>Switch to {coreModule === 'infrastructure' ? 'El Niño Relief' : 'Infrastructure'}</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Quick District Scope Selector */}
          <div className="p-3 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
              Operational District Scope
            </span>
            <div className="grid grid-cols-2 gap-1.5 text-xs font-semibold">
              <button
                onClick={() => setDistrictFilter('Rigo')}
                className={`py-1.5 px-2 rounded-lg text-center transition-all ${
                  districtFilter === 'Rigo'
                    ? 'bg-amber-500 text-slate-950 font-bold'
                    : 'bg-slate-950 text-slate-300 hover:text-white'
                }`}
              >
                Rigo District
              </button>
              <button
                onClick={() => setDistrictFilter('Abau')}
                className={`py-1.5 px-2 rounded-lg text-center transition-all ${
                  districtFilter === 'Abau'
                    ? 'bg-amber-500 text-slate-950 font-bold'
                    : 'bg-slate-950 text-slate-300 hover:text-white'
                }`}
              >
                Abau District
              </button>
            </div>
            {districtFilter !== 'All' && (
              <button
                onClick={() => setDistrictFilter('All')}
                className="w-full text-[10px] text-amber-400 hover:underline text-center block pt-1"
              >
                Reset to All Central Province
              </button>
            )}
          </div>

          {/* Navigation Items */}
          <nav className="space-y-1">
            <span className="text-[10px] uppercase font-bold text-slate-500 px-3 tracking-wider block mb-2">
              Management Modules
            </span>

            {navItems.map(item => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id as any);
                    onCloseMobile();
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all group ${
                    isActive
                      ? 'bg-amber-500 text-slate-950 shadow-md font-bold'
                      : 'text-slate-400 hover:text-white hover:bg-slate-900'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon
                      className={`w-4 h-4 transition-transform group-hover:scale-110 ${
                        isActive ? 'text-slate-950' : 'text-slate-400 group-hover:text-amber-400'
                      }`}
                    />
                    <span>{item.label}</span>
                  </div>

                  {item.badge && (
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-bold ${
                        isActive ? 'bg-slate-950 text-amber-400' : item.badgeColor
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Field Network & Synchronization Panel (Relocated from Header) */}
        <div className="p-3 border-t border-slate-800/80 bg-slate-950/95 space-y-2">
          <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-slate-400 px-1">
            <span>Field Synchronization</span>
            <span className="font-mono text-slate-500">PNG Cloud</span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {/* Online / Offline Network Toggle */}
            <button
              onClick={() => toggleOfflineSimulation()}
              className={`p-2 rounded-xl border text-xs font-medium flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
                isOffline
                  ? 'bg-amber-950/40 border-amber-700/60 text-amber-400 hover:bg-amber-950/60'
                  : 'bg-emerald-950/30 border-emerald-800/50 text-emerald-400 hover:bg-emerald-950/50'
              }`}
              title="Click to toggle Field Simulation (Online vs Remote Offline Mode)"
            >
              <div className="flex items-center gap-1.5">
                {isOffline ? (
                  <WifiOff className="w-3.5 h-3.5 text-amber-400" />
                ) : (
                  <Wifi className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                )}
                <span className="font-bold text-[11px]">{isOffline ? 'Offline' : 'Online Sync'}</span>
              </div>
              <span className="text-[9px] text-slate-400">
                {isOffline ? 'Local Storage' : 'Connected'}
              </span>
            </button>

            {/* Sync Queue Drawer Trigger */}
            <button
              onClick={() => setIsSyncDrawerOpen(true)}
              className={`p-2 rounded-xl border text-xs font-semibold flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
                syncQueue.length > 0
                  ? 'bg-amber-500/15 border-amber-500/50 text-amber-400 hover:bg-amber-500/25'
                  : 'bg-slate-900/90 border-slate-800 text-slate-300 hover:border-slate-700 hover:text-white'
              }`}
              title="Inspect Pending Offline Changes in Sync Queue"
            >
              <div className="flex items-center gap-1.5">
                <RefreshCw className={`w-3.5 h-3.5 ${syncQueue.length > 0 ? 'animate-spin text-amber-400' : 'text-slate-400'}`} />
                <span className="font-bold text-[11px]">Sync Queue</span>
              </div>
              <div className="flex items-center gap-1">
                <span className={`text-[10px] font-mono font-bold px-1.5 py-0.2 rounded-full ${
                  syncQueue.length > 0 ? 'bg-amber-500 text-slate-950' : 'bg-slate-800 text-slate-400'
                }`}>
                  {syncQueue.length}
                </span>
                <span className="text-[9px] text-slate-500">
                  {syncQueue.length === 1 ? 'item' : 'items'}
                </span>
              </div>
            </button>
          </div>
        </div>

        {/* Official Footer Banner */}
        <div className="p-3.5 border-t border-slate-800/80 bg-slate-950/80">
          <div className="text-[11px] text-slate-400 space-y-0.5">
            <div className="flex items-center gap-1.5 font-bold text-slate-300">
              <span className="w-2 h-2 rounded-full bg-amber-400"></span>
              <span>Central Province Works</span>
            </div>
            <p className="text-[10px] text-slate-500 leading-snug">
              Strategic GIS & Asset Register System &bull; PNG Government
            </p>
          </div>
        </div>
      </aside>
    </>
  );
};
