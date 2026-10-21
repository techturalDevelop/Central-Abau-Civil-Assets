import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { PriorityModelWeights, UserRole } from '../types';
import {
  Sliders,
  User,
  Wifi,
  WifiOff,
  RefreshCw,
  Database,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Download,
  Key,
  Shield,
  Compass,
} from 'lucide-react';
import { DEFAULT_WEIGHTS } from '../data/initialData';

export const SettingsView: React.FC = () => {
  const {
    priorityWeights,
    updateWeights,
    currentUserRole,
    setCurrentUserRole,
    isOffline,
    isSimulatedOffline,
    toggleOfflineSimulation,
    syncQueue,
    syncQueueNow,
    clearSyncQueue,
    resetDemoData,
    exportDataAsJson,
    assets,
  } = useApp();

  // Local weights state
  const [weights, setWeights] = useState<PriorityModelWeights>(priorityWeights);
  const [weightsSaved, setWeightsSaved] = useState(false);
  const [syncStatusMsg, setSyncStatusMsg] = useState<string | null>(null);

  const handleSaveWeights = (e: React.FormEvent) => {
    e.preventDefault();
    updateWeights(weights);
    setWeightsSaved(true);
    setTimeout(() => setWeightsSaved(false), 3000);
  };

  const handleResetWeights = () => {
    setWeights(DEFAULT_WEIGHTS);
    updateWeights(DEFAULT_WEIGHTS);
    setWeightsSaved(true);
    setTimeout(() => setWeightsSaved(false), 3000);
  };

  const handleSyncNow = async () => {
    setSyncStatusMsg('Synchronizing pending field records...');
    const result = await syncQueueNow();
    if (result.success) {
      setSyncStatusMsg(`Successfully synchronized ${result.count} offline records to the central registry.`);
    } else {
      setSyncStatusMsg('Sync aborted: device is currently offline.');
    }
    setTimeout(() => setSyncStatusMsg(null), 4000);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-4xl mx-auto">
      {/* Top Header */}
      <div className="border-b border-slate-800 pb-5">
        <span className="text-[11px] font-mono tracking-wider uppercase px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
          System Configuration & Preferences
        </span>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white mt-1">
          Settings & Prioritisation Model
        </h1>
        <p className="text-sm text-slate-400 mt-0.5">
          Fine-tune the multi-factor scoring formula, manage offline sync queues, and switch user authority roles.
        </p>
      </div>

      {/* USER ROLE SWITCHER */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4 text-xs">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
            <User className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">Active User Profile & Authority Role</h3>
            <p className="text-slate-400 text-[11px]">Controls permissions for engineering overrides and defect sign-offs</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
          {(
            [
              'Provincial Works Administrator',
              'Rigo District Engineer',
              'Abau District Engineer',
              'Field Technical Inspector',
            ] as UserRole[]
          ).map(role => (
            <div
              key={role}
              onClick={() => setCurrentUserRole(role)}
              className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                currentUserRole === role
                  ? 'bg-amber-500/10 border-amber-500 text-white shadow-md'
                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-bold">{role}</span>
                {currentUserRole === role && (
                  <CheckCircle2 className="w-4 h-4 text-amber-500" />
                )}
              </div>
              <span className="text-[10px] text-slate-500 block mt-1">
                {role.includes('Administrator')
                  ? 'Full administrative privileges, weight adjustments & approvals'
                  : role.includes('Engineer')
                  ? 'District-level engineering overrides and defect sign-offs'
                  : 'Field data capture, condition scoring & defect reporting'}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* OFFLINE RESILIENCE & FIELD SYNC MANAGER */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4 text-xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={`p-2 rounded-xl ${isOffline ? 'bg-amber-500/10 text-amber-400' : 'bg-emerald-500/10 text-emerald-400'}`}>
              {isOffline ? <WifiOff className="w-5 h-5" /> : <Wifi className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Remote Field Mode & Offline Sync</h3>
              <p className="text-slate-400 text-[11px]">
                Support field inspections in remote areas without cellular coverage along the Magi Highway
              </p>
            </div>
          </div>

          <button
            onClick={() => toggleOfflineSimulation()}
            className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-all ${
              isSimulatedOffline
                ? 'bg-amber-500 text-slate-950'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-750'
            }`}
          >
            {isSimulatedOffline ? 'Simulating Offline Mode' : 'Simulate Offline Mode'}
          </button>
        </div>

        <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <span className="text-slate-300 font-semibold block">
              Pending Sync Queue: <b>{syncQueue.length} records staged locally</b>
            </span>
            <span className="text-[11px] text-slate-500">
              {syncQueue.length > 0
                ? 'Changes will automatically synchronize when network connectivity is restored.'
                : 'All local field inspections and defect reports are currently in sync.'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {syncQueue.length > 0 && (
              <button
                onClick={clearSyncQueue}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-rose-900/40 text-slate-300 hover:text-rose-400 text-xs transition-colors"
              >
                Clear Queue
              </button>
            )}
            <button
              onClick={handleSyncNow}
              disabled={isOffline || syncQueue.length === 0}
              className={`px-4 py-2 rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-md ${
                isOffline || syncQueue.length === 0
                  ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                  : 'bg-amber-500 hover:bg-amber-400 text-slate-950'
              }`}
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Sync Now</span>
            </button>
          </div>
        </div>

        {syncStatusMsg && (
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-700 text-amber-300 text-xs">
            {syncStatusMsg}
          </div>
        )}
      </div>

      {/* PRIORITISATION SCORING FORMULA WEIGHTS */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-5 text-xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Priority Scoring Model Weights</h3>
              <p className="text-slate-400 text-[11px]">
                Configurable multi-criteria decision formula for infrastructure capital programming
              </p>
            </div>
          </div>

          <button
            onClick={handleResetWeights}
            className="text-xs text-slate-400 hover:text-white flex items-center gap-1 font-medium"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Restore Defaults</span>
          </button>
        </div>

        <form onSubmit={handleSaveWeights} className="space-y-4">
          <div className="space-y-4 bg-slate-950 p-4 rounded-xl border border-slate-800">
            {/* Factor 1: Condition Deficit */}
            <div>
              <div className="flex justify-between text-slate-300 mb-1 font-semibold">
                <span>1. Condition Deficit Factor (Structural Degradation)</span>
                <span className="font-mono text-amber-400">{Math.round(weights.conditionDeficitWeight * 100)}%</span>
              </div>
              <input
                type="range"
                min="0.05"
                max="0.5"
                step="0.05"
                value={weights.conditionDeficitWeight}
                onChange={e => setWeights({ ...weights, conditionDeficitWeight: parseFloat(e.target.value) })}
                className="w-full accent-amber-500 cursor-pointer"
              />
              <span className="text-[10px] text-slate-500">Derived from 100 - Condition Score (Poor/Critical assets get highest rating).</span>
            </div>

            {/* Factor 2: Defect Severity */}
            <div>
              <div className="flex justify-between text-slate-300 mb-1 font-semibold">
                <span>2. Active Defect Severity (Scour, Siltation, Cracks)</span>
                <span className="font-mono text-amber-400">{Math.round(weights.defectSeverityWeight * 100)}%</span>
              </div>
              <input
                type="range"
                min="0.05"
                max="0.5"
                step="0.05"
                value={weights.defectSeverityWeight}
                onChange={e => setWeights({ ...weights, defectSeverityWeight: parseFloat(e.target.value) })}
                className="w-full accent-amber-500 cursor-pointer"
              />
              <span className="text-[10px] text-slate-500">Urgency based on acute defects recorded in inspections.</span>
            </div>

            {/* Factor 3: Safety Risk */}
            <div>
              <div className="flex justify-between text-slate-300 mb-1 font-semibold">
                <span>3. Public Safety & Structural Hazard Risk</span>
                <span className="font-mono text-amber-400">{Math.round(weights.safetyRiskWeight * 100)}%</span>
              </div>
              <input
                type="range"
                min="0.05"
                max="0.5"
                step="0.05"
                value={weights.safetyRiskWeight}
                onChange={e => setWeights({ ...weights, safetyRiskWeight: parseFloat(e.target.value) })}
                className="w-full accent-amber-500 cursor-pointer"
              />
              <span className="text-[10px] text-slate-500">Risk of vehicle rollover, structural collapse, or washout.</span>
            </div>

            {/* Factor 4: Route Importance */}
            <div>
              <div className="flex justify-between text-slate-300 mb-1 font-semibold">
                <span>4. Arterial Hierarchy & Economic Importance</span>
                <span className="font-mono text-amber-400">{Math.round(weights.infrastructureImportanceWeight * 100)}%</span>
              </div>
              <input
                type="range"
                min="0.05"
                max="0.5"
                step="0.05"
                value={weights.infrastructureImportanceWeight}
                onChange={e => setWeights({ ...weights, infrastructureImportanceWeight: parseFloat(e.target.value) })}
                className="w-full accent-amber-500 cursor-pointer"
              />
              <span className="text-[10px] text-slate-500">National arterial (Magi Highway) vs district trunk vs rural feeder.</span>
            </div>

            {/* Factor 5: Service Disruption */}
            <div>
              <div className="flex justify-between text-slate-300 mb-1 font-semibold">
                <span>5. Community Isolation & Service Disruption Impact</span>
                <span className="font-mono text-amber-400">{Math.round(weights.serviceDisruptionWeight * 100)}%</span>
              </div>
              <input
                type="range"
                min="0.05"
                max="0.5"
                step="0.05"
                value={weights.serviceDisruptionWeight}
                onChange={e => setWeights({ ...weights, serviceDisruptionWeight: parseFloat(e.target.value) })}
                className="w-full accent-amber-500 cursor-pointer"
              />
              <span className="text-[10px] text-slate-500">Degree to which failure cuts off health clinics, schools, and markets.</span>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            {weightsSaved ? (
              <span className="text-emerald-400 font-bold flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" />
                <span>Priority model weights updated across all assets.</span>
              </span>
            ) : (
              <span className="text-slate-500 text-[11px]">
                Adjusting weights immediately recalculates priorities for all assets without an active override.
              </span>
            )}

            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold shadow-lg"
            >
              Apply Scoring Formula
            </button>
          </div>
        </form>
      </div>

      {/* DATA MANAGEMENT & RESET */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4 text-xs">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400">
            <Database className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">Data Management & Reset</h3>
            <p className="text-slate-400 text-[11px]">Local storage backup, export and demo state reset</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 pt-2">
          <button
            onClick={exportDataAsJson}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-200 font-semibold flex items-center gap-2 border border-slate-700"
          >
            <Download className="w-4 h-4 text-amber-400" />
            <span>Export Complete Dataset (JSON)</span>
          </button>

          <button
            onClick={() => {
              if (window.confirm('Reset all assets, inspections, and defects back to the demonstration baseline?')) {
                resetDemoData();
              }
            }}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-rose-900/40 text-slate-300 hover:text-rose-400 font-semibold flex items-center gap-2 border border-slate-700"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Reset to Baseline Demo Data</span>
          </button>
        </div>
      </div>
    </div>
  );
};
