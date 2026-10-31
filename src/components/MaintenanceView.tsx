import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Asset, MaintenancePriority } from '../types';
import {
  Wrench,
  ShieldAlert,
  AlertTriangle,
  Sliders,
  CheckCircle2,
  Edit3,
  Search,
  Filter,
  DollarSign,
  Compass,
  FileText,
  Info,
  Clock,
  ArrowRight,
} from 'lucide-react';

export const MaintenanceView: React.FC = () => {
  const {
    filteredAssets,
    priorityWeights,
    overridePriority,
    currentUserRole,
    setSelectedAssetId,
    setActiveTab,
    notifyToast,
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [priorityFilter, setPriorityFilter] = useState<'All' | MaintenancePriority>('All');

  // Override Modal
  const [overrideAsset, setOverrideAsset] = useState<Asset | null>(null);
  const [targetPriority, setTargetPriority] = useState<MaintenancePriority>('Critical');
  const [overrideReason, setOverrideReason] = useState('');

  const handleOverrideSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!overrideAsset) return;

    if (!overrideReason.trim()) {
      notifyToast(
        'error',
        'Justification Required',
        'A formal engineering justification is mandatory to execute a priority override.'
      );
      return;
    }

    overridePriority(overrideAsset.id, targetPriority, overrideReason.trim());
    notifyToast(
      'success',
      'Priority Overridden',
      `Asset ${overrideAsset.id} set to ${targetPriority} priority.`
    );
    setOverrideAsset(null);
    setOverrideReason('');
  };

  const sortedPriorities = [...filteredAssets].sort((a, b) => b.priorityScore - a.priorityScore);

  const displayedAssets = sortedPriorities.filter(asset => {
    if (priorityFilter !== 'All' && asset.maintenancePriority !== priorityFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        asset.name.toLowerCase().includes(q) ||
        asset.id.toLowerCase().includes(q) ||
        asset.district.toLowerCase().includes(q) ||
        asset.recommendedAction.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono tracking-wider uppercase px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
              Prioritisation & Capital Allocation
            </span>
            <span className="text-[11px] text-slate-400">Multi-Criteria Decision Engine</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white mt-1 tracking-tight">
            Maintenance Priorities & Capital Works Planning
          </h1>
          <p className="text-sm text-slate-400 mt-1 max-w-2xl">
            Multi-factor scoring algorithm evaluates structural condition deficit, defect severity, safety risk, arterial importance, and community service disruption.
          </p>
        </div>

        <button
          onClick={() => setActiveTab('settings')}
          className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 flex items-center gap-2 transition-colors self-start md:self-auto"
        >
          <Sliders className="w-4 h-4 text-amber-400" />
          <span>Configure Model Weights</span>
        </button>
      </div>

      {/* Prominent Legal / Engineering Disclaimer */}
      <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs space-y-1">
        <div className="flex items-center gap-2 font-bold">
          <Info className="w-4 h-4 shrink-0" />
          <span>Planning Decision-Support Model Notice:</span>
        </div>
        <p className="text-[11px] text-amber-200/90 leading-relaxed">
          Automated priority rankings and factor contributions provide strategic decision support for the Central Province Works Directorate. Automated scores do not constitute certified structural engineering design approvals. Formal structural calculations and safety sign-offs must precede physical construction contracts.
        </p>
      </div>

      {/* Active Weights Summary Pill */}
      <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl shadow-xl flex flex-wrap items-center justify-between gap-4 text-xs">
        <span className="font-bold text-slate-300">Active Mathematical Weightings:</span>
        <div className="flex flex-wrap items-center gap-3 font-mono text-[11px]">
          <span className="bg-slate-950 px-2 py-1 rounded border border-slate-800 text-slate-300">
            Condition Deficit: <b className="text-amber-400">{Math.round(priorityWeights.conditionDeficitWeight * 100)}%</b>
          </span>
          <span className="bg-slate-950 px-2 py-1 rounded border border-slate-800 text-slate-300">
            Defect Severity: <b className="text-amber-400">{Math.round(priorityWeights.defectSeverityWeight * 100)}%</b>
          </span>
          <span className="bg-slate-950 px-2 py-1 rounded border border-slate-800 text-slate-300">
            Safety Hazard: <b className="text-amber-400">{Math.round(priorityWeights.safetyRiskWeight * 100)}%</b>
          </span>
          <span className="bg-slate-950 px-2 py-1 rounded border border-slate-800 text-slate-300">
            Route Importance: <b className="text-amber-400">{Math.round(priorityWeights.infrastructureImportanceWeight * 100)}%</b>
          </span>
          <span className="bg-slate-950 px-2 py-1 rounded border border-slate-800 text-slate-300">
            Service Disruption: <b className="text-amber-400">{Math.round(priorityWeights.serviceDisruptionWeight * 100)}%</b>
          </span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-2xl flex flex-wrap items-center justify-between gap-3 shadow-xl">
        <div className="relative flex-1 min-w-[260px]">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search prioritized assets..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-amber-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={priorityFilter}
            onChange={e => setPriorityFilter(e.target.value as any)}
            className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-amber-500 font-medium"
          >
            <option value="All">All Priority Bands</option>
            <option value="Critical">Critical Priority</option>
            <option value="High">High Priority</option>
            <option value="Medium">Medium Priority</option>
            <option value="Low">Low Priority</option>
          </select>
        </div>
      </div>

      {/* Prioritized Assets Cards */}
      <div className="space-y-4">
        {displayedAssets.map((asset, index) => {
          return (
            <div
              key={asset.id}
              className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4 hover:border-slate-700 transition-all text-xs"
            >
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                <div className="space-y-1.5 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-[10px] font-bold text-amber-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                      RANK #{index + 1}
                    </span>
                    <span className="font-mono text-[10px] text-slate-400 font-bold px-2 py-0.5 rounded bg-slate-950 border border-slate-800">
                      {asset.id}
                    </span>
                    <span
                      className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold ${
                        asset.maintenancePriority === 'Critical'
                          ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30 animate-pulse'
                          : asset.maintenancePriority === 'High'
                          ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30'
                          : asset.maintenancePriority === 'Medium'
                          ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                          : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      }`}
                    >
                      {asset.maintenancePriority} Priority
                    </span>
                    <span className="text-slate-400 text-[11px]">&bull; {asset.district} District ({asset.llg})</span>
                  </div>

                  <h3 className="font-bold text-white text-base mt-1">
                    {asset.name}
                  </h3>
                  <p className="text-slate-400 text-[11px]">{asset.locationDescription}</p>

                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 text-slate-300 space-y-1 mt-2">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                      Recommended Engineering Intervention:
                    </span>
                    <p className="font-medium text-slate-200">{asset.recommendedAction}</p>
                  </div>

                  {asset.priorityOverride && (
                    <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[11px] space-y-1">
                      <div className="font-bold flex items-center gap-1.5">
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                        <span>Engineering Override Applied</span>
                      </div>
                      <p><b>Recorded Reason:</b> {asset.priorityOverride.overrideReason}</p>
                      <p className="text-[10px] text-amber-400/80">
                        Authorized by: {asset.priorityOverride.overriddenBy} on {new Date(asset.priorityOverride.timestamp).toLocaleDateString()}
                      </p>
                    </div>
                  )}
                </div>

                {/* Score & Factors Display */}
                <div className="w-full md:w-80 bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3 shrink-0">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                    <span className="text-slate-400 text-xs font-semibold">Priority Index Score</span>
                    <span className="text-xl font-extrabold text-amber-400 font-mono">
                      {asset.priorityScore} <span className="text-xs text-slate-500">/ 100</span>
                    </span>
                  </div>

                  {/* Factor Breakdown Bars */}
                  <div className="space-y-2 text-[10px]">
                    <div>
                      <div className="flex justify-between text-slate-400 mb-0.5">
                        <span>Condition Deficit</span>
                        <span className="font-mono text-slate-200">{asset.priorityFactors.conditionDeficit}/100</span>
                      </div>
                      <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                        <div className="bg-orange-500 h-full" style={{ width: `${asset.priorityFactors.conditionDeficit}%` }} />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-slate-400 mb-0.5">
                        <span>Defect Severity</span>
                        <span className="font-mono text-slate-200">{asset.priorityFactors.defectSeverity}/100</span>
                      </div>
                      <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                        <div className="bg-rose-500 h-full" style={{ width: `${asset.priorityFactors.defectSeverity}%` }} />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-slate-400 mb-0.5">
                        <span>Safety Risk</span>
                        <span className="font-mono text-slate-200">{asset.priorityFactors.safetyRisk}/100</span>
                      </div>
                      <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                        <div className="bg-red-600 h-full" style={{ width: `${asset.priorityFactors.safetyRisk}%` }} />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-slate-400 mb-0.5">
                        <span>Infrastructure Importance</span>
                        <span className="font-mono text-slate-200">{asset.priorityFactors.infrastructureImportance}/100</span>
                      </div>
                      <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                        <div className="bg-amber-500 h-full" style={{ width: `${asset.priorityFactors.infrastructureImportance}%` }} />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-slate-400 mb-0.5">
                        <span>Service Disruption / Community Isolation</span>
                        <span className="font-mono text-slate-200">{asset.priorityFactors.serviceDisruption}/100</span>
                      </div>
                      <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                        <div className="bg-purple-500 h-full" style={{ width: `${asset.priorityFactors.serviceDisruption}%` }} />
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="pt-2 border-t border-slate-800 flex items-center justify-between gap-2">
                    <button
                      onClick={() => {
                        setOverrideAsset(asset);
                        setTargetPriority(asset.maintenancePriority === 'Critical' ? 'High' : 'Critical');
                      }}
                      className="text-xs text-amber-400 hover:text-amber-300 font-semibold flex items-center gap-1"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Override Priority</span>
                    </button>
                    <button
                      onClick={() => {
                        setSelectedAssetId(asset.id);
                        setActiveTab('map');
                      }}
                      className="text-xs text-slate-300 hover:text-white font-semibold flex items-center gap-1"
                    >
                      <Compass className="w-3.5 h-3.5" />
                      <span>Locate</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* OVERRIDE MODAL */}
      {overrideAsset && (
        <div className="fixed inset-0 z-[1000] bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-start justify-between border-b border-slate-800 pb-3">
              <div>
                <span className="text-[10px] font-mono font-bold text-amber-400 uppercase tracking-wider">
                  Engineering Governance & Audit
                </span>
                <h3 className="text-lg font-bold text-white">Override Maintenance Priority</h3>
              </div>
              <button
                onClick={() => setOverrideAsset(null)}
                className="text-slate-400 hover:text-white text-lg font-bold"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleOverrideSubmit} className="space-y-4 text-xs">
              <p className="text-slate-300 leading-relaxed">
                You are proposing a discretionary override for <b>{overrideAsset.id}</b> ({overrideAsset.name}).
                Calculated score: <span className="text-amber-400 font-mono font-bold">{overrideAsset.priorityScore}/100</span> ({overrideAsset.maintenancePriority}).
              </p>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Target Priority Level</label>
                <select
                  value={targetPriority}
                  onChange={e => setTargetPriority(e.target.value as MaintenancePriority)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 font-bold focus:outline-none focus:border-amber-500"
                >
                  <option value="Critical">Critical (Immediate Procurement Required)</option>
                  <option value="High">High (Include in Current Works Cycle)</option>
                  <option value="Medium">Medium (Scheduled Next Period)</option>
                  <option value="Low">Low (Routine Monitoring)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Mandatory Engineering Justification / Rationale <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="e.g. Critical access for rural health clinic ambulance; major agricultural harvest haulage route; school transit safety hazard..."
                  value={overrideReason}
                  onChange={e => setOverrideReason(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-200 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-[11px] text-slate-400">
                <span>Recorded Author: <b>{currentUserRole}</b> &bull; Stamped with UTC Timestamp in Provincial Audit Log</span>
              </div>

              <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setOverrideAsset(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold"
                >
                  Record Official Override
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
