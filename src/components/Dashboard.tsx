import React, { useMemo } from 'react';
import { useApp } from '../context/AppContext';
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Compass,
  FileText,
  Filter,
  Layers,
  MapPin,
  Plus,
  RefreshCw,
  Search,
  ShieldAlert,
  Sliders,
  TrendingDown,
  TrendingUp,
  Wrench,
  Sun,
} from 'lucide-react';
import { Asset, ConditionRating, District } from '../types';
import { ElNinoDashboard } from './ElNinoDashboard';

export const Dashboard: React.FC = () => {
  const {
    coreModule,
    assets,
    defects,
    inspections,
    filteredAssets,
    districtFilter,
    setDistrictFilter,
    assetTypeFilter,
    setAssetTypeFilter,
    conditionFilter,
    setConditionFilter,
    searchQuery,
    setSearchQuery,
    setActiveTab,
    setSelectedAssetId,
    setIsQuickCaptureOpen,
    isOffline,
    showFrozenRigo,
    setShowFrozenRigo,
    setIsPdfStudioOpen,
  } = useApp();

  // Stats calculation
  const stats = useMemo(() => {
    const totalAssets = filteredAssets.length;
    const poorOrCritical = filteredAssets.filter(
      a => a.conditionClassification === 'Poor' || a.conditionClassification === 'Critical'
    ).length;
    const criticalAssets = filteredAssets.filter(a => a.conditionClassification === 'Critical').length;
    const openDefects = defects.filter(d => d.status === 'Open' || d.status === 'Assigned' || d.status === 'In Progress').length;
    const highPriorityMaintenance = filteredAssets.filter(
      a => a.maintenancePriority === 'High' || a.maintenancePriority === 'Critical'
    ).length;
    const totalValueKina = filteredAssets.reduce((sum, a) => sum + (a.replacementValueKina || 0), 0);
    const avgConditionScore = totalAssets > 0
      ? Math.round(filteredAssets.reduce((sum, a) => sum + a.conditionScore, 0) / totalAssets)
      : 0;

    return {
      totalAssets,
      poorOrCritical,
      criticalAssets,
      openDefects,
      highPriorityMaintenance,
      totalValueKina,
      avgConditionScore,
    };
  }, [filteredAssets, defects]);

  // 4-LLG Breakdown for Abau District
  const llgStats = useMemo(() => {
    const aromaAssets = assets.filter(a => a.llg === 'Aroma LLG');
    const kupianoAssets = assets.filter(a => a.llg === 'Kupiano LLG');
    const cloudyBayAssets = assets.filter(a => a.llg === 'Cloudy Bay LLG');
    const amazonBayAssets = assets.filter(a => a.llg === 'Amazon Bay LLG');

    const calcLlg = (list: Asset[], llgName: string) => {
      const avg = list.length > 0
        ? Math.round(list.reduce((acc, a) => acc + a.conditionScore, 0) / list.length)
        : 0;
      const critical = list.filter(a => a.conditionClassification === 'Critical' || a.conditionClassification === 'Poor').length;
      const llgDefects = defects.filter(d => d.llg === llgName && d.status !== 'Resolved' && d.status !== 'Verified').length;
      return { total: list.length, avg, critical, defects: llgDefects };
    };

    return {
      aroma: calcLlg(aromaAssets, 'Aroma LLG'),
      kupiano: calcLlg(kupianoAssets, 'Kupiano LLG'),
      cloudyBay: calcLlg(cloudyBayAssets, 'Cloudy Bay LLG'),
      amazonBay: calcLlg(amazonBayAssets, 'Amazon Bay LLG'),
    };
  }, [assets, defects]);

  // Condition breakdown
  const conditionBreakdown = useMemo(() => {
    const counts: Record<ConditionRating, number> = { Good: 0, Fair: 0, Poor: 0, Critical: 0 };
    filteredAssets.forEach(a => {
      counts[a.conditionClassification] = (counts[a.conditionClassification] || 0) + 1;
    });
    return counts;
  }, [filteredAssets]);

  // Asset type breakdown
  const typeCounts = useMemo(() => {
    const counts = { road: 0, bridge: 0, culvert: 0, drainage: 0, causeway: 0 };
    filteredAssets.forEach(a => {
      counts[a.type] = (counts[a.type] || 0) + 1;
    });
    return counts;
  }, [filteredAssets]);

  // Top urgent assets
  const urgentAssets = useMemo(() => {
    return [...filteredAssets]
      .sort((a, b) => b.priorityScore - a.priorityScore)
      .slice(0, 4);
  }, [filteredAssets]);

  // If user selected El Niño Relief Program module, render ElNinoDashboard
  if (coreModule === 'el_nino') {
    return <ElNinoDashboard />;
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Top Welcome & Context Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono tracking-wider uppercase px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
              Central Province Government
            </span>
            <span className="text-[11px] text-slate-400">Works & Infrastructure Directorate</span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold uppercase">
              Abau Focus Active
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white mt-1 tracking-tight">
            Abau District Digital Infrastructure Platform
          </h1>
          <p className="text-sm text-slate-400 mt-1 max-w-2xl">
            Targeted GIS asset registers, multi-factor maintenance prioritisation, and structural defect monitoring for <b>Aroma</b>, <b>Kupiano</b>, <b>Cloudy Bay</b>, and <b>Amazon Bay</b> LLGs.
          </p>
        </div>

        {/* Header Actions */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Direct Review & Save as PDF Trigger */}
          <button
            onClick={() => setIsPdfStudioOpen(true)}
            className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold flex items-center gap-2 shadow-lg transition-all cursor-pointer"
          >
            <FileText className="w-4 h-4" />
            <span>Review & Save as PDF</span>
          </button>

          <button
            onClick={() => setIsQuickCaptureOpen(true)}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 flex items-center gap-2 transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4 text-amber-400" />
            <span>Field GPS Capture</span>
          </button>

          <button
            onClick={() => setActiveTab('map')}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 flex items-center gap-2 transition-colors cursor-pointer"
          >
            <Compass className="w-4 h-4 text-amber-400" />
            <span>GIS Map</span>
          </button>
        </div>
      </div>

      {/* Rigo Frozen Notice & Abau Focus Directive Banner */}
      <div className="p-3.5 rounded-2xl bg-gradient-to-r from-blue-950/40 via-slate-900 to-slate-900 border border-blue-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-blue-500/20 text-blue-300 font-bold border border-blue-400/30">
            ❄️ FROZEN
          </div>
          <div>
            <h4 className="font-bold text-white flex items-center gap-2">
              <span>Rigo District Dataset Frozen & Archived</span>
              <span className="text-[10px] px-2 py-0.2 rounded bg-amber-500/20 text-amber-400 font-mono">Provincial Directive</span>
            </h4>
            <p className="text-[11px] text-slate-400">
              Active operations and engineering capital allocations are focused 100% on Abau District corridors (Magi Highway, Aroma Coast, Kupiano Port, and Magarida).
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowFrozenRigo(!showFrozenRigo)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
              showFrozenRigo
                ? 'bg-blue-600/30 border-blue-400 text-blue-200'
                : 'bg-slate-800/80 border-slate-700 text-slate-400 hover:text-white'
            }`}
          >
            {showFrozenRigo ? 'Hide Frozen Rigo Archive' : 'Inspect Frozen Rigo Archive'}
          </button>
        </div>
      </div>

      {/* Global Filter Bar */}
      <div className="bg-slate-900/90 border border-slate-800 p-3 rounded-2xl flex flex-wrap items-center justify-between gap-3 shadow-xl">
        <div className="flex flex-wrap items-center gap-2">
          {/* District Scope Filter */}
          <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs font-semibold">
            <button
              onClick={() => setDistrictFilter('Abau')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                districtFilter === 'Abau'
                  ? 'bg-amber-500 text-slate-950 shadow-sm font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Abau District (Active Focus)
            </button>
            {showFrozenRigo && (
              <button
                onClick={() => setDistrictFilter('Rigo')}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  districtFilter === 'Rigo'
                    ? 'bg-blue-600 text-white shadow-sm font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                ❄️ Rigo District (Frozen Archive)
              </button>
            )}
            <button
              onClick={() => setDistrictFilter('All')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                districtFilter === 'All'
                  ? 'bg-amber-500 text-slate-950 shadow-sm font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              All Provincial Assets
            </button>
          </div>

          {/* Asset Type Selector */}
          <select
            value={assetTypeFilter}
            onChange={e => setAssetTypeFilter(e.target.value as any)}
            className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-amber-500"
          >
            <option value="All">All Asset Types</option>
            <option value="road">Roads (Corridors)</option>
            <option value="bridge">Bridges (River Crossings)</option>
            <option value="culvert">Culverts (Drainage Pipes)</option>
            <option value="drainage">Drainage Channels</option>
            <option value="causeway">Causeways / Drifts</option>
          </select>

          {/* Condition Selector */}
          <select
            value={conditionFilter}
            onChange={e => setConditionFilter(e.target.value as any)}
            className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-amber-500"
          >
            <option value="All">All Conditions</option>
            <option value="Good">Good (70-100)</option>
            <option value="Fair">Fair (50-69)</option>
            <option value="Poor">Poor (35-49)</option>
            <option value="Critical">Critical (&lt;35)</option>
          </select>
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search assets, IDs, or LLG..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-amber-500"
          />
        </div>
      </div>

      {/* KPI Stat Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Assets */}
        <div
          onClick={() => setActiveTab('register')}
          className="bg-slate-900 border border-slate-800/80 hover:border-slate-700 p-5 rounded-2xl cursor-pointer transition-all hover:translate-y-[-2px] shadow-lg group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Registered Assets</span>
            <div className="p-2 rounded-xl bg-slate-800 text-amber-400 group-hover:bg-amber-500 group-hover:text-slate-950 transition-colors">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-white tracking-tight">{stats.totalAssets}</span>
            <span className="text-xs text-slate-400">infrastructure assets</span>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
            <span>Aroma & Kupiano: {llgStats.aroma.total + llgStats.kupiano.total}</span>
            <span>&bull;</span>
            <span>Cloudy & Amazon: {llgStats.cloudyBay.total + llgStats.amazonBay.total}</span>
          </div>
        </div>

        {/* Card 2: Assets in Poor/Critical */}
        <div
          onClick={() => {
            setConditionFilter('Poor');
            setActiveTab('register');
          }}
          className="bg-slate-900 border border-slate-800/80 hover:border-rose-500/40 p-5 rounded-2xl cursor-pointer transition-all hover:translate-y-[-2px] shadow-lg group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Deficient / Critical</span>
            <div className="p-2 rounded-xl bg-rose-500/10 text-rose-400 group-hover:bg-rose-600 group-hover:text-white transition-colors">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-rose-400 tracking-tight">{stats.poorOrCritical}</span>
            <span className="text-xs text-rose-300/80">({stats.criticalAssets} critical failures)</span>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-rose-400/80">
            <span>Requires urgent repair</span>
            <span className="font-semibold">{Math.round((stats.poorOrCritical / (stats.totalAssets || 1)) * 100)}% of network</span>
          </div>
        </div>

        {/* Card 3: Open Defects */}
        <div
          onClick={() => setActiveTab('defects')}
          className="bg-slate-900 border border-slate-800/80 hover:border-amber-500/40 p-5 rounded-2xl cursor-pointer transition-all hover:translate-y-[-2px] shadow-lg group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Open Defect Reports</span>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 group-hover:bg-amber-500 group-hover:text-slate-950 transition-colors">
              <ShieldAlert className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-amber-400 tracking-tight">{stats.openDefects}</span>
            <span className="text-xs text-slate-400">unresolved defects</span>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
            <span>Aroma: {llgStats.aroma.defects}</span>
            <span>&bull;</span>
            <span>Cloudy: {llgStats.cloudyBay.defects}</span>
            <span>&bull;</span>
            <span>Amazon: {llgStats.amazonBay.defects}</span>
          </div>
        </div>

        {/* Card 4: High Priority Maintenance & Network Replacement Value */}
        <div
          onClick={() => setActiveTab('maintenance')}
          className="bg-slate-900 border border-slate-800/80 hover:border-blue-500/40 p-5 rounded-2xl cursor-pointer transition-all hover:translate-y-[-2px] shadow-lg group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">High Maintenance Priority</span>
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400 group-hover:bg-blue-600 group-hover:text-white transition-colors">
              <Wrench className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-blue-400 tracking-tight">{stats.highPriorityMaintenance}</span>
            <span className="text-xs text-slate-400">immediate works</span>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
            <span>Asset Book Value</span>
            <span className="font-mono text-amber-400 font-semibold">
              PGK {(stats.totalValueKina / 1000000).toFixed(1)}M
            </span>
          </div>
        </div>
      </div>

      {/* District Comparison & Condition Distributions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Abau 4-LLG Scorecard */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <span>Abau District Local Level Government (LLG) Scorecard</span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-mono">
                  4 Operational LLGs
                </span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Targeted asset management, condition ratings, and defect tracking across Abau District
              </p>
            </div>
            <button
              onClick={() => setIsPdfStudioOpen(true)}
              className="text-xs text-amber-400 hover:text-amber-300 font-medium flex items-center gap-1 cursor-pointer"
            >
              <span>Export PDF Report</span>
              <span>&rarr;</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* 1. Aroma LLG Card */}
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-mono font-bold text-amber-400">LLG 1</span>
                  <h3 className="text-sm font-bold text-white">Aroma LLG</h3>
                </div>
                <span className="text-xs font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                  Maopa / Pelagai
                </span>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400">Infrastructure Health Index:</span>
                  <span className="font-bold text-amber-400 font-mono">{llgStats.aroma.avg} / 100</span>
                </div>
                <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-amber-500 h-full rounded-full"
                    style={{ width: `${llgStats.aroma.avg}%` }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 pt-1 text-center text-xs">
                <div className="bg-slate-900 p-2 rounded-lg border border-slate-800/80">
                  <span className="text-slate-400 block text-[10px]">Assets</span>
                  <span className="font-bold text-white">{llgStats.aroma.total}</span>
                </div>
                <div className="bg-slate-900 p-2 rounded-lg border border-slate-800/80">
                  <span className="text-slate-400 block text-[10px]">Critical</span>
                  <span className="font-bold text-rose-400">{llgStats.aroma.critical}</span>
                </div>
                <div className="bg-slate-900 p-2 rounded-lg border border-slate-800/80">
                  <span className="text-slate-400 block text-[10px]">Defects</span>
                  <span className="font-bold text-amber-400">{llgStats.aroma.defects}</span>
                </div>
              </div>

              <div className="text-[11px] text-slate-400 pt-1 border-t border-slate-800/80 flex items-center justify-between">
                <span>Maopa, Pelagai, Kinikalana, Wapagai</span>
                <button
                  onClick={() => {
                    setDistrictFilter('Abau');
                    setActiveTab('map');
                  }}
                  className="text-amber-400 hover:underline font-medium cursor-pointer"
                >
                  View on GIS
                </button>
              </div>
            </div>

            {/* 2. Kupiano LLG Card */}
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-mono font-bold text-amber-400">LLG 2</span>
                  <h3 className="text-sm font-bold text-white">Kupiano LLG (District HQ)</h3>
                </div>
                <span className="text-xs font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                  Station & Port
                </span>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400">Infrastructure Health Index:</span>
                  <span className="font-bold text-emerald-400 font-mono">{llgStats.kupiano.avg} / 100</span>
                </div>
                <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-emerald-500 h-full rounded-full"
                    style={{ width: `${llgStats.kupiano.avg}%` }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 pt-1 text-center text-xs">
                <div className="bg-slate-900 p-2 rounded-lg border border-slate-800/80">
                  <span className="text-slate-400 block text-[10px]">Assets</span>
                  <span className="font-bold text-white">{llgStats.kupiano.total}</span>
                </div>
                <div className="bg-slate-900 p-2 rounded-lg border border-slate-800/80">
                  <span className="text-slate-400 block text-[10px]">Critical</span>
                  <span className="font-bold text-rose-400">{llgStats.kupiano.critical}</span>
                </div>
                <div className="bg-slate-900 p-2 rounded-lg border border-slate-800/80">
                  <span className="text-slate-400 block text-[10px]">Defects</span>
                  <span className="font-bold text-amber-400">{llgStats.kupiano.defects}</span>
                </div>
              </div>

              <div className="text-[11px] text-slate-400 pt-1 border-t border-slate-800/80 flex items-center justify-between">
                <span>Kupiano Station, Vilirupu, Wharf</span>
                <button
                  onClick={() => {
                    setDistrictFilter('Abau');
                    setActiveTab('map');
                  }}
                  className="text-amber-400 hover:underline font-medium cursor-pointer"
                >
                  View on GIS
                </button>
              </div>
            </div>

            {/* 3. Cloudy Bay LLG Card */}
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-mono font-bold text-amber-400">LLG 3</span>
                  <h3 className="text-sm font-bold text-white">Cloudy Bay LLG</h3>
                </div>
                <span className="text-xs font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                  Cape Rodney / Amau
                </span>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400">Infrastructure Health Index:</span>
                  <span className="font-bold text-rose-400 font-mono">{llgStats.cloudyBay.avg} / 100</span>
                </div>
                <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-rose-500 h-full rounded-full"
                    style={{ width: `${llgStats.cloudyBay.avg}%` }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 pt-1 text-center text-xs">
                <div className="bg-slate-900 p-2 rounded-lg border border-slate-800/80">
                  <span className="text-slate-400 block text-[10px]">Assets</span>
                  <span className="font-bold text-white">{llgStats.cloudyBay.total}</span>
                </div>
                <div className="bg-slate-900 p-2 rounded-lg border border-slate-800/80">
                  <span className="text-slate-400 block text-[10px]">Critical</span>
                  <span className="font-bold text-rose-400">{llgStats.cloudyBay.critical}</span>
                </div>
                <div className="bg-slate-900 p-2 rounded-lg border border-slate-800/80">
                  <span className="text-slate-400 block text-[10px]">Defects</span>
                  <span className="font-bold text-amber-400">{llgStats.cloudyBay.defects}</span>
                </div>
              </div>

              <div className="text-[11px] text-slate-400 pt-1 border-t border-slate-800/80 flex items-center justify-between">
                <span>Amau, Bomguina, Merani, Badubadu</span>
                <button
                  onClick={() => {
                    setDistrictFilter('Abau');
                    setActiveTab('map');
                  }}
                  className="text-amber-400 hover:underline font-medium cursor-pointer"
                >
                  View on GIS
                </button>
              </div>
            </div>

            {/* 4. Amazon Bay LLG Card */}
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-mono font-bold text-amber-400">LLG 4</span>
                  <h3 className="text-sm font-bold text-white">Amazon Bay LLG</h3>
                </div>
                <span className="text-xs font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                  Magarida Centre
                </span>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400">Infrastructure Health Index:</span>
                  <span className="font-bold text-amber-400 font-mono">{llgStats.amazonBay.avg} / 100</span>
                </div>
                <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-amber-500 h-full rounded-full"
                    style={{ width: `${llgStats.amazonBay.avg}%` }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 pt-1 text-center text-xs">
                <div className="bg-slate-900 p-2 rounded-lg border border-slate-800/80">
                  <span className="text-slate-400 block text-[10px]">Assets</span>
                  <span className="font-bold text-white">{llgStats.amazonBay.total}</span>
                </div>
                <div className="bg-slate-900 p-2 rounded-lg border border-slate-800/80">
                  <span className="text-slate-400 block text-[10px]">Critical</span>
                  <span className="font-bold text-rose-400">{llgStats.amazonBay.critical}</span>
                </div>
                <div className="bg-slate-900 p-2 rounded-lg border border-slate-800/80">
                  <span className="text-slate-400 block text-[10px]">Defects</span>
                  <span className="font-bold text-amber-400">{llgStats.amazonBay.defects}</span>
                </div>
              </div>

              <div className="text-[11px] text-slate-400 pt-1 border-t border-slate-800/80 flex items-center justify-between">
                <span>Magarida, Nunumai, Selai, Laua</span>
                <button
                  onClick={() => {
                    setDistrictFilter('Abau');
                    setActiveTab('map');
                  }}
                  className="text-amber-400 hover:underline font-medium cursor-pointer"
                >
                  View on GIS
                </button>
              </div>
            </div>
          </div>

          {/* Condition Distribution Meter */}
          <div className="pt-2 border-t border-slate-800/80 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-300">Overall Condition Distribution ({filteredAssets.length} Assets)</span>
              <span className="text-slate-400">Target: 80% Good / Fair by 2027</span>
            </div>
            {/* Multi-segment progress bar */}
            <div className="w-full h-3 rounded-full bg-slate-800 overflow-hidden flex">
              <div
                className="bg-emerald-500 h-full transition-all"
                style={{ width: `${(conditionBreakdown.Good / (filteredAssets.length || 1)) * 100}%` }}
                title={`Good: ${conditionBreakdown.Good}`}
              />
              <div
                className="bg-amber-500 h-full transition-all"
                style={{ width: `${(conditionBreakdown.Fair / (filteredAssets.length || 1)) * 100}%` }}
                title={`Fair: ${conditionBreakdown.Fair}`}
              />
              <div
                className="bg-orange-500 h-full transition-all"
                style={{ width: `${(conditionBreakdown.Poor / (filteredAssets.length || 1)) * 100}%` }}
                title={`Poor: ${conditionBreakdown.Poor}`}
              />
              <div
                className="bg-rose-600 h-full transition-all"
                style={{ width: `${(conditionBreakdown.Critical / (filteredAssets.length || 1)) * 100}%` }}
                title={`Critical: ${conditionBreakdown.Critical}`}
              />
            </div>

            <div className="grid grid-cols-4 gap-2 text-xs text-slate-400 pt-1 text-center">
              <div className="flex items-center justify-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                <span>Good: <b>{conditionBreakdown.Good}</b></span>
              </div>
              <div className="flex items-center justify-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                <span>Fair: <b>{conditionBreakdown.Fair}</b></span>
              </div>
              <div className="flex items-center justify-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-orange-500"></span>
                <span>Poor: <b>{conditionBreakdown.Poor}</b></span>
              </div>
              <div className="flex items-center justify-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-rose-600"></span>
                <span>Critical: <b>{conditionBreakdown.Critical}</b></span>
              </div>
            </div>
          </div>
        </div>

        {/* Asset Inventory Types Breakdown */}
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl space-y-4">
          <div>
            <h2 className="text-base font-bold text-white">Asset Categories</h2>
            <p className="text-xs text-slate-400 mt-0.5">Distribution by physical asset class</p>
          </div>

          <div className="space-y-3">
            {[
              { type: 'road', name: 'Roads & Corridors', count: typeCounts.road, icon: '🛣️', color: 'bg-blue-500' },
              { type: 'bridge', name: 'Bridges & River Crossings', count: typeCounts.bridge, icon: '🌉', color: 'bg-purple-500' },
              { type: 'culvert', name: 'Box & Pipe Culverts', count: typeCounts.culvert, icon: '⭕', color: 'bg-amber-500' },
              { type: 'drainage', name: 'Drainage Channels', count: typeCounts.drainage, icon: '💧', color: 'bg-cyan-500' },
              { type: 'causeway', name: 'Causeways / Drifts', count: typeCounts.causeway, icon: '🌊', color: 'bg-emerald-500' },
            ].map(item => (
              <div
                key={item.type}
                onClick={() => {
                  setAssetTypeFilter(item.type as any);
                  setActiveTab('register');
                }}
                className="p-2.5 rounded-xl bg-slate-950 border border-slate-800/80 hover:border-slate-700 cursor-pointer flex items-center justify-between transition-colors text-xs"
              >
                <div className="flex items-center gap-2.5">
                  <span className="text-lg">{item.icon}</span>
                  <div>
                    <span className="font-semibold text-slate-200 block">{item.name}</span>
                    <span className="text-[10px] text-slate-500">
                      {Math.round((item.count / (filteredAssets.length || 1)) * 100)}% of filtered
                    </span>
                  </div>
                </div>
                <span className="font-mono font-bold text-white px-2 py-1 bg-slate-900 rounded-lg border border-slate-800">
                  {item.count}
                </span>
              </div>
            ))}
          </div>

          <div className="pt-2 border-t border-slate-800/80">
            <button
              onClick={() => setActiveTab('register')}
              className="w-full py-2 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-200 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
            >
              <FileText className="w-3.5 h-3.5 text-amber-500" />
              <span>Open Asset Register</span>
            </button>
          </div>
        </div>
      </div>

      {/* Critical Infrastructure Watchlist & Recent Inspections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Urgent Action Priority Queue */}
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-500" />
                <span>Priority Action Watchlist</span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Assets with highest calculated priority scores requiring engineering intervention
              </p>
            </div>
            <button
              onClick={() => setActiveTab('maintenance')}
              className="text-xs text-amber-400 hover:text-amber-300 font-medium"
            >
              View Prioritisation Model &rarr;
            </button>
          </div>

          <div className="space-y-2.5">
            {urgentAssets.map(asset => (
              <div
                key={asset.id}
                className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 hover:border-slate-700 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[10px] text-amber-400 font-bold px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800">
                      {asset.id}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        asset.conditionClassification === 'Critical'
                          ? 'bg-rose-500/20 text-rose-400'
                          : 'bg-orange-500/20 text-orange-400'
                      }`}
                    >
                      {asset.conditionClassification} ({asset.conditionScore}/100)
                    </span>
                    <span className="text-slate-400 text-[11px]">&bull; {asset.district}</span>
                  </div>
                  <h4 className="font-bold text-slate-200">{asset.name}</h4>
                  <p className="text-[11px] text-slate-400 line-clamp-1">{asset.recommendedAction}</p>
                </div>

                <div className="flex items-center gap-2 sm:self-center">
                  <div className="text-right sm:mr-1">
                    <span className="text-[10px] text-slate-400 block">Priority Score</span>
                    <span className="text-sm font-extrabold text-rose-400 font-mono">
                      {asset.priorityScore}
                    </span>
                  </div>
                  <button
                    onClick={() => {
                      setSelectedAssetId(asset.id);
                      setActiveTab('map');
                    }}
                    className="px-2.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-[11px] transition-colors whitespace-nowrap"
                  >
                    Locate on GIS
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Inspections & Field Logs */}
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-500" />
                <span>Recent Field Inspections</span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">Latest physical audit reports logged by field engineers</p>
            </div>
            <button
              onClick={() => setActiveTab('inspections')}
              className="text-xs text-amber-400 hover:text-amber-300 font-medium"
            >
              Inspection Logs &rarr;
            </button>
          </div>

          <div className="space-y-2.5">
            {inspections.slice(0, 3).map(insp => (
              <div
                key={insp.id}
                className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-xs space-y-2"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] font-mono text-slate-400">{insp.id} &bull; {insp.date}</span>
                    <h4 className="font-bold text-slate-200 text-xs mt-0.5">{insp.assetName}</h4>
                    <p className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                      <span>Inspector: <b>{insp.inspectorName}</b></span>
                      <span>({insp.inspectorBadge})</span>
                    </p>
                  </div>
                  <div className="text-right">
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                        insp.rating === 'Good'
                          ? 'bg-emerald-500/20 text-emerald-400'
                          : insp.rating === 'Fair'
                          ? 'bg-amber-500/20 text-amber-400'
                          : insp.rating === 'Poor'
                          ? 'bg-orange-500/20 text-orange-400'
                          : 'bg-rose-500/20 text-rose-400'
                      }`}
                    >
                      {insp.rating} ({insp.overallScore}/100)
                    </span>
                    <span className="text-[10px] text-slate-500 block mt-0.5">
                      Weather: {insp.weather}
                    </span>
                  </div>
                </div>

                <p className="text-[11px] text-slate-300 bg-slate-900/80 p-2 rounded-lg border border-slate-800/80 leading-relaxed">
                  "{insp.notes}"
                </p>

                <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1">
                  <span>Rec: {insp.recommendedAction}</span>
                  <button
                    onClick={() => {
                      setSelectedAssetId(insp.assetId);
                      setActiveTab('map');
                    }}
                    className="text-amber-400 hover:underline font-semibold"
                  >
                    View Asset
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Official Central Province Planning Notice */}
      <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-4 flex items-center justify-between text-xs text-slate-400">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
          <span>
            <b>Official Demonstration Planning Environment:</b> Demonstration records for strategic infrastructure prioritization across Rigo and Abau.
          </span>
        </div>
        <span className="hidden sm:inline text-[11px] text-slate-500 font-mono">
          Central Provincial Government &bull; Konedobu / Kwikila / Kupiano
        </span>
      </div>
    </div>
  );
};
