import React from 'react';
import { useApp } from '../context/AppContext';
import {
  Layers,
  Sun,
  ShieldAlert,
  ArrowRight,
  CheckCircle2,
  Droplets,
  Truck,
  Activity,
  FileSpreadsheet,
  X,
  Sparkles,
} from 'lucide-react';

interface ModuleSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ModuleSelectionModal: React.FC<ModuleSelectionModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { coreModule, setCoreModule, setActiveTab } = useApp();

  if (!isOpen) return null;

  const handleSelectModule = (mod: 'infrastructure' | 'el_nino') => {
    setCoreModule(mod);
    setActiveTab('dashboard');
    sessionStorage.setItem('cp_module_prompt_seen', 'true');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header Ribbon */}
        <div className="relative px-6 py-6 sm:px-8 sm:py-7 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 border-b border-slate-800 flex items-start justify-between">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold tracking-wider uppercase bg-amber-500/10 text-amber-400 border border-amber-500/30">
                Central Province Government &bull; Abau District
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                Active Portal
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2.5">
              Select Platform Command Module
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 max-w-xl">
              Choose between Central Province&apos;s Digital Infrastructure Asset Management system or the active El Niño Drought & Water Emergency Relief Command for Abau District.
            </p>
          </div>

          <button
            onClick={() => {
              sessionStorage.setItem('cp_module_prompt_seen', 'true');
              onClose();
            }}
            className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
            title="Close dialog and proceed with current selection"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modules Grid */}
        <div className="p-6 sm:p-8 overflow-y-auto grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-950/40">
          {/* Module 1: Digital Infrastructure Platform */}
          <div
            onClick={() => handleSelectModule('infrastructure')}
            className={`group relative rounded-2xl p-6 sm:p-7 border-2 cursor-pointer transition-all duration-200 flex flex-col justify-between ${
              coreModule === 'infrastructure'
                ? 'bg-amber-500/5 border-amber-500 shadow-xl shadow-amber-500/10 ring-1 ring-amber-500/30'
                : 'bg-slate-900/70 border-slate-800 hover:border-amber-500/50 hover:bg-slate-800/60'
            }`}
          >
            {coreModule === 'infrastructure' && (
              <div className="absolute top-4 right-4 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500 text-slate-950 font-bold text-[11px] shadow">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Currently Active</span>
              </div>
            )}

            <div>
              <div className="w-13 h-13 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center mb-5 group-hover:scale-105 transition-transform">
                <Layers className="w-7 h-7" />
              </div>

              <div className="flex items-center gap-2 mb-1.5">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-amber-400">
                  Core Module 01
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-medium">
                  Technical Asset System
                </span>
              </div>

              <h3 className="text-lg sm:text-xl font-bold text-white mb-2 group-hover:text-amber-400 transition-colors">
                Digital Infrastructure Platform
              </h3>

              <p className="text-xs text-slate-400 leading-relaxed mb-6">
                Provincial engineering registry for roads, bridges, wharves, and culverts across Abau District corridors (Magi Highway, Kupiano, Cloudy Bay, Amazon Bay). Features GIS surveillance, defect ledger, risk scoring matrix, and multi-page A4 PDF technical export.
              </p>

              {/* Highlights */}
              <div className="space-y-2.5 mb-6 text-xs text-slate-300 font-medium border-t border-slate-800/80 pt-4">
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                  <span>24 Classified Assets (Roads, Bridges, Wharves)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                  <span>Interactive GIS Corridor & Defect Surveillance</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                  <span>Multi-criteria Priority Scoring & Engineering Overrides</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                  <span>Abau District Focus with Frozen Rigo Archive</span>
                </div>
              </div>
            </div>

            <button
              onClick={(e) => {
                e.stopPropagation();
                handleSelectModule('infrastructure');
              }}
              className={`w-full py-3 px-4 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer ${
                coreModule === 'infrastructure'
                  ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-lg shadow-amber-500/20'
                  : 'bg-slate-800 hover:bg-slate-700 text-white group-hover:bg-amber-500 group-hover:text-slate-950'
              }`}
            >
              <span>Access Infrastructure Platform</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {/* Module 2: El Niño Relief Program Platform */}
          <div
            onClick={() => handleSelectModule('el_nino')}
            className={`group relative rounded-2xl p-6 sm:p-7 border-2 cursor-pointer transition-all duration-200 flex flex-col justify-between ${
              coreModule === 'el_nino'
                ? 'bg-rose-500/5 border-rose-500 shadow-xl shadow-rose-500/10 ring-1 ring-rose-500/30'
                : 'bg-slate-900/70 border-slate-800 hover:border-rose-500/50 hover:bg-slate-800/60'
            }`}
          >
            {coreModule === 'el_nino' ? (
              <div className="absolute top-4 right-4 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-500 text-white font-bold text-[11px] shadow">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Currently Active</span>
              </div>
            ) : (
              <div className="absolute top-4 right-4 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-500/20 text-rose-300 font-bold text-[10px] border border-rose-500/30 animate-pulse">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                <span>Disaster Response</span>
              </div>
            )}

            <div>
              <div className="w-13 h-13 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 flex items-center justify-center mb-5 group-hover:scale-105 transition-transform">
                <Sun className="w-7 h-7" />
              </div>

              <div className="flex items-center gap-2 mb-1.5">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-rose-400">
                  Core Module 02
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-rose-950/60 text-rose-300 font-semibold border border-rose-800/40">
                  Emergency Relief Operation
                </span>
              </div>

              <h3 className="text-lg sm:text-xl font-bold text-white mb-2 group-hover:text-rose-400 transition-colors">
                El Niño Relief Program Platform
              </h3>

              <p className="text-xs text-slate-400 leading-relaxed mb-6">
                Active emergency drought monitoring and humanitarian assistance command for Abau District. Manages village water points, deep aquifer boreholes, food ration convoys via Magi Highway & sea barges, malnutrition tracking, and urgent field relief dispatches.
              </p>

              {/* Highlights */}
              <div className="space-y-2.5 mb-6 text-xs text-slate-300 font-medium border-t border-slate-800/80 pt-4">
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                  <span>84,600 Affected Population (Aroma, Kupiano, Cloudy, Amazon Bay)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                  <span>Borehole, Desalination & Emergency Water Trucking Logistics</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                  <span>Food Rations & Seedling Aid Distribution Tracking</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                  <span>Severe Acute Malnutrition (SAM) & Health Clinic Incident Log</span>
                </div>
              </div>
            </div>

            <button
              onClick={(e) => {
                e.stopPropagation();
                handleSelectModule('el_nino');
              }}
              className={`w-full py-3 px-4 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer ${
                coreModule === 'el_nino'
                  ? 'bg-rose-500 hover:bg-rose-400 text-white shadow-lg shadow-rose-500/20'
                  : 'bg-slate-800 hover:bg-slate-700 text-white group-hover:bg-rose-500 group-hover:text-white'
              }`}
            >
              <span>Access El Niño Relief Program</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Footer info & session preference */}
        <div className="px-6 py-4 bg-slate-900 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400">
          <div className="flex items-center gap-2 text-[11px]">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>You can toggle between both core modules anytime via the top navigation switcher.</span>
          </div>

          <button
            onClick={() => {
              sessionStorage.setItem('cp_module_prompt_seen', 'true');
              onClose();
            }}
            className="text-xs text-slate-400 hover:text-white underline cursor-pointer"
          >
            Continue to active platform &rarr;
          </button>
        </div>
      </div>
    </div>
  );
};
