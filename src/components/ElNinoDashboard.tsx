import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import {
  Sun,
  Droplets,
  Truck,
  HeartPulse,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Plus,
  Filter,
  FileText,
  Printer,
  Compass,
  ArrowRight,
  ShieldAlert,
  Layers,
  MapPin,
  RefreshCw,
  Search,
  Users,
  Anchor,
  Activity,
  DollarSign,
  ChevronRight,
  Info,
  X,
} from 'lucide-react';
import {
  AbauLLG,
  WaterPoint,
  WaterPointStatus,
  ReliefAidShipment,
  AidShipmentStatus,
  HealthEmergencyIncident,
  FieldReliefRequest,
} from '../types';

export const ElNinoDashboard: React.FC = () => {
  const {
    coreModule,
    setCoreModule,
    setIsModuleSelectModalOpen,
    elNinoLlgStatuses,
    waterPoints,
    updateWaterPointStatus,
    reliefShipments,
    updateShipmentStatus,
    healthIncidents,
    fieldRequests,
    addFieldRequest,
    updateFieldRequestStatus,
    elNinoBudget,
    isOffline,
  } = useApp();

  // Selected sub-tab
  const [activeSubTab, setActiveSubTab] = useState<
    'overview' | 'water' | 'convoys' | 'health' | 'requests' | 'budget'
  >('overview');

  // Filters
  const [selectedLlg, setSelectedLlg] = useState<'All' | AbauLLG>('All');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [isNewRequestModalOpen, setIsNewRequestModalOpen] = useState(false);
  const [editingWaterPoint, setEditingWaterPoint] = useState<WaterPoint | null>(null);
  const [newWpStatus, setNewWpStatus] = useState<WaterPointStatus>('Operational');
  const [newWpNotes, setNewWpNotes] = useState('');

  // Form State for New Field Relief Request
  const [formData, setFormData] = useState({
    llg: 'Aroma LLG' as AbauLLG,
    village: 'Maopa',
    requesterName: '',
    requesterRole: 'Ward Councillor' as FieldReliefRequest['requesterRole'],
    urgency: 'Critical Emergency (Under 24h)' as FieldReliefRequest['urgency'],
    requestType: 'Emergency Water Trucking' as FieldReliefRequest['requestType'],
    affectedPeople: 450,
    details: '',
  });

  // Calculate high level KPIs
  const kpis = useMemo(() => {
    const llgList = Object.values(elNinoLlgStatuses);
    const totalAffectedPopulation = llgList.reduce((acc, l) => acc + l.populationAffected, 0);
    const avgWaterAccess = Math.round(
      llgList.reduce((acc, l) => acc + l.waterAccessPercentage, 0) / llgList.length
    );
    const totalMalnutrition = llgList.reduce((acc, l) => acc + l.malnutritionCases, 0);
    const operationalWaterPoints = waterPoints.filter(wp => wp.status === 'Operational').length;
    const criticalWaterPoints = waterPoints.filter(
      wp => wp.status === 'Critical Depletion' || wp.status === 'Dried Up' || wp.status === 'Saline Contaminated'
    ).length;
    const activeConvoys = reliefShipments.filter(
      s => s.status === 'In Transit via Magi Highway' || s.status === 'Coastal Barge in Transit' || s.status === 'Staged at Kupiano Relief Depot'
    ).length;
    const pendingRequests = fieldRequests.filter(r => r.status === 'Pending DDA Review').length;

    return {
      totalAffectedPopulation,
      avgWaterAccess,
      waterDeficit: 100 - avgWaterAccess,
      totalMalnutrition,
      totalWaterPoints: waterPoints.length,
      operationalWaterPoints,
      criticalWaterPoints,
      activeConvoys,
      pendingRequests,
    };
  }, [elNinoLlgStatuses, waterPoints, reliefShipments, fieldRequests]);

  // Filtered Water Points
  const filteredWaterPoints = useMemo(() => {
    return waterPoints.filter(wp => {
      if (selectedLlg !== 'All' && wp.llg !== selectedLlg) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          wp.name.toLowerCase().includes(q) ||
          wp.village.toLowerCase().includes(q) ||
          wp.type.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [waterPoints, selectedLlg, searchQuery]);

  // Filtered Shipments
  const filteredShipments = useMemo(() => {
    return reliefShipments.filter(s => {
      if (selectedLlg !== 'All' && s.llg !== selectedLlg) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          s.convoyCode.toLowerCase().includes(q) ||
          s.destinationVillages.some(v => v.toLowerCase().includes(q)) ||
          s.aidCategory.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [reliefShipments, selectedLlg, searchQuery]);

  // Filtered Requests
  const filteredRequests = useMemo(() => {
    return fieldRequests.filter(r => {
      if (selectedLlg !== 'All' && r.llg !== selectedLlg) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          r.village.toLowerCase().includes(q) ||
          r.requesterName.toLowerCase().includes(q) ||
          r.requestType.toLowerCase().includes(q) ||
          r.details.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [fieldRequests, selectedLlg, searchQuery]);

  // Handle Submit New Relief Request
  const handleCreateRequest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.requesterName || !formData.details) return;

    addFieldRequest({
      llg: formData.llg,
      village: formData.village,
      requesterName: formData.requesterName,
      requesterRole: formData.requesterRole,
      urgency: formData.urgency,
      requestType: formData.requestType,
      affectedPeople: Number(formData.affectedPeople) || 100,
      details: formData.details,
    });

    setIsNewRequestModalOpen(false);
    setFormData({
      llg: 'Aroma LLG',
      village: 'Maopa',
      requesterName: '',
      requesterRole: 'Ward Councillor',
      urgency: 'Critical Emergency (Under 24h)',
      requestType: 'Emergency Water Trucking',
      affectedPeople: 450,
      details: '',
    });
  };

  // Handle Update Water Point Status
  const handleSaveWaterPointStatus = () => {
    if (!editingWaterPoint) return;
    updateWaterPointStatus(editingWaterPoint.id, newWpStatus, newWpNotes || editingWaterPoint.rehabilitationRequired);
    setEditingWaterPoint(null);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Top Emergency Operation Banner */}
      <div className="relative rounded-3xl bg-gradient-to-br from-rose-950 via-slate-900 to-slate-950 border border-rose-500/40 p-6 sm:p-8 shadow-2xl overflow-hidden">
        {/* Glow / Background accents */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-rose-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
        <div className="absolute bottom-0 left-1/3 w-64 h-64 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="px-3 py-1 rounded-full text-xs font-mono font-bold tracking-wider uppercase bg-rose-500 text-white shadow-lg shadow-rose-500/20 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-white animate-ping" />
                Active Disaster Command
              </span>
              <span className="px-2.5 py-1 rounded-full text-xs font-mono font-semibold bg-rose-500/20 text-rose-300 border border-rose-500/40">
                Abau District Emergency Response
              </span>
              <span className="px-2.5 py-1 rounded-full text-xs font-mono text-slate-300 bg-slate-800/80 border border-slate-700">
                Central Province Government &bull; Abau DDA
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white tracking-tight">
              El Niño Relief Program Platform
            </h1>

            <p className="text-xs sm:text-sm text-slate-300 max-w-3xl leading-relaxed">
              Real-time drought monitoring and emergency relief coordination across <strong>Aroma LLG, Kupiano LLG, Cloudy Bay LLG</strong>, and <strong>Amazon Bay LLG</strong>. Coordinating borehole logistics, water trucking, coastal barge aid, staple food distributions, and clinical malnutrition intervention.
            </p>
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap sm:flex-nowrap items-center gap-3 self-start lg:self-center shrink-0">
            <button
              onClick={() => setIsNewRequestModalOpen(true)}
              className="px-4 py-2.5 rounded-xl bg-rose-500 hover:bg-rose-400 text-white font-bold text-xs sm:text-sm flex items-center gap-2 shadow-xl shadow-rose-500/30 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Lodge Field Relief Request</span>
            </button>

            <button
              onClick={() => window.print()}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold text-xs sm:text-sm flex items-center gap-2 transition-all cursor-pointer"
              title="Print official El Niño Situation Report"
            >
              <Printer className="w-4 h-4 text-slate-300" />
              <span>Print SitRep</span>
            </button>

            <button
              onClick={() => setIsModuleSelectModalOpen(true)}
              className="px-3.5 py-2.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 font-semibold text-xs sm:text-sm flex items-center gap-1.5 transition-all cursor-pointer"
              title="Switch to Digital Infrastructure Platform"
            >
              <Layers className="w-4 h-4" />
              <span className="hidden sm:inline">Switch Module</span>
            </button>
          </div>
        </div>
      </div>

      {/* Primary KPI Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        {/* Metric 1 */}
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Affected Population</span>
            <Users className="w-4 h-4 text-rose-400" />
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-black text-white">
              {kpis.totalAffectedPopulation.toLocaleString()}
            </div>
            <div className="text-[10px] text-rose-400 font-medium mt-0.5">
              Across 4 Abau LLGs
            </div>
          </div>
        </div>

        {/* Metric 2 */}
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Water Deficit</span>
            <Droplets className="w-4 h-4 text-amber-400" />
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-black text-amber-400">
              {kpis.waterDeficit}%
            </div>
            <div className="text-[10px] text-slate-400 font-medium mt-0.5">
              Avg {kpis.avgWaterAccess}% access only
            </div>
          </div>
        </div>

        {/* Metric 3 */}
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Water Points</span>
            <AlertTriangle className="w-4 h-4 text-amber-500" />
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-black text-white">
              {kpis.criticalWaterPoints} <span className="text-xs text-rose-400 font-normal">/ {kpis.totalWaterPoints} depleted</span>
            </div>
            <div className="text-[10px] text-emerald-400 font-medium mt-0.5">
              {kpis.operationalWaterPoints} operational
            </div>
          </div>
        </div>

        {/* Metric 4 */}
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Aid Convoys</span>
            <Truck className="w-4 h-4 text-blue-400" />
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-black text-white">
              {kpis.activeConvoys}
            </div>
            <div className="text-[10px] text-blue-400 font-medium mt-0.5">
              Highway trucks &amp; sea barge
            </div>
          </div>
        </div>

        {/* Metric 5 */}
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Malnutrition SAM</span>
            <HeartPulse className="w-4 h-4 text-rose-400" />
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-black text-rose-400">
              {kpis.totalMalnutrition}
            </div>
            <div className="text-[10px] text-slate-400 font-medium mt-0.5">
              Under-5 clinical cases
            </div>
          </div>
        </div>

        {/* Metric 6 */}
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Relief Budget</span>
            <DollarSign className="w-4 h-4 text-emerald-400" />
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-black text-emerald-400">
              K2.85M
            </div>
            <div className="text-[10px] text-slate-400 font-medium mt-0.5">
              of K5.0M Disaster Fund
            </div>
          </div>
        </div>
      </div>

      {/* 4-LLG Drought Severity Cards */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
            <Sun className="w-4 h-4 text-rose-400" />
            <span>Abau District LLG Drought Severity Status</span>
          </h2>
          <span className="text-xs text-slate-400">
            Click an LLG card to filter dashboard data
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Object.entries(elNinoLlgStatuses).map(([llgName, status]) => {
            const isSelected = selectedLlg === llgName;
            const levelColor =
              status.droughtLevel >= 5
                ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                : status.droughtLevel === 4
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                : 'bg-yellow-500/20 text-yellow-300 border-yellow-500/40';

            return (
              <div
                key={llgName}
                onClick={() => setSelectedLlg(isSelected ? 'All' : (llgName as AbauLLG))}
                className={`p-5 rounded-2xl border cursor-pointer transition-all duration-200 flex flex-col justify-between ${
                  isSelected
                    ? 'bg-rose-950/40 border-rose-500 ring-2 ring-rose-500/30 shadow-lg'
                    : 'bg-slate-900 border-slate-800 hover:border-slate-700 hover:bg-slate-850'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div>
                      <h3 className="font-black text-base text-white tracking-tight">
                        {status.llg}
                      </h3>
                      <div className="text-[11px] text-slate-400 font-medium">
                        {status.populationAffected.toLocaleString()} people affected
                      </div>
                    </div>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border uppercase ${levelColor}`}>
                      Level {status.droughtLevel}/5
                    </span>
                  </div>

                  <div className="space-y-2 mb-4 text-xs">
                    <div>
                      <div className="flex justify-between text-[11px] mb-1">
                        <span className="text-slate-400">Water Access:</span>
                        <span className="font-bold text-amber-400">{status.waterAccessPercentage}%</span>
                      </div>
                      <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
                        <div
                          className="h-full bg-amber-500 rounded-full"
                          style={{ width: `${status.waterAccessPercentage}%` }}
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-[11px] pt-1">
                      <span className="text-slate-400">Food Insecurity:</span>
                      <span className="font-semibold text-rose-400">{status.foodInsecurityLevel}</span>
                    </div>

                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-400">SAM Child Cases:</span>
                      <span className="font-semibold text-white">{status.malnutritionCases} admissions</span>
                    </div>
                  </div>

                  <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800 text-[11px] text-slate-300">
                    <span className="font-bold text-amber-400 block mb-0.5">Priority Need:</span>
                    <span className="line-clamp-2">{status.priorityNeed}</span>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px]">
                  <span className="text-slate-400">
                    {status.activeReliefTeams} Relief Squads Active
                  </span>
                  <span className={`font-bold flex items-center gap-1 ${isSelected ? 'text-rose-400' : 'text-slate-400'}`}>
                    {isSelected ? 'Active Filter' : 'Filter View'} &rarr;
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Module Sub-tabs & Search Toolbar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3 flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Navigation Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 w-full md:w-auto">
          <button
            onClick={() => setActiveSubTab('overview')}
            className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeSubTab === 'overview'
                ? 'bg-rose-500 text-white shadow-md shadow-rose-500/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Compass className="w-3.5 h-3.5" />
            <span>Command Overview</span>
          </button>

          <button
            onClick={() => setActiveSubTab('water')}
            className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeSubTab === 'water'
                ? 'bg-rose-500 text-white shadow-md shadow-rose-500/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Droplets className="w-3.5 h-3.5" />
            <span>Water &amp; Boreholes</span>
            <span className="px-1.5 py-0.2 rounded-full bg-slate-950 text-[10px] font-mono">
              {waterPoints.length}
            </span>
          </button>

          <button
            onClick={() => setActiveSubTab('convoys')}
            className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeSubTab === 'convoys'
                ? 'bg-rose-500 text-white shadow-md shadow-rose-500/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Truck className="w-3.5 h-3.5" />
            <span>Aid Convoys &amp; Barges</span>
            <span className="px-1.5 py-0.2 rounded-full bg-slate-950 text-[10px] font-mono">
              {reliefShipments.length}
            </span>
          </button>

          <button
            onClick={() => setActiveSubTab('health')}
            className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeSubTab === 'health'
                ? 'bg-rose-500 text-white shadow-md shadow-rose-500/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <HeartPulse className="w-3.5 h-3.5" />
            <span>Health &amp; Malnutrition</span>
          </button>

          <button
            onClick={() => setActiveSubTab('requests')}
            className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeSubTab === 'requests'
                ? 'bg-rose-500 text-white shadow-md shadow-rose-500/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Field Relief Requests</span>
            {kpis.pendingRequests > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-rose-500 text-white text-[10px] font-bold font-mono">
                {kpis.pendingRequests}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveSubTab('budget')}
            className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeSubTab === 'budget'
                ? 'bg-rose-500 text-white shadow-md shadow-rose-500/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <DollarSign className="w-3.5 h-3.5" />
            <span>Disaster Fund &amp; Partners</span>
          </button>
        </div>

        {/* Search & LLG Scope Filter */}
        <div className="flex items-center gap-2 w-full md:w-auto">
          <div className="relative flex-1 md:w-56">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search villages, convoys..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-500"
            />
          </div>

          <select
            value={selectedLlg}
            onChange={(e) => setSelectedLlg(e.target.value as any)}
            className="px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-300 font-medium focus:outline-none focus:border-rose-500"
          >
            <option value="All">All Abau LLGs</option>
            <option value="Aroma LLG">Aroma LLG</option>
            <option value="Kupiano LLG">Kupiano LLG</option>
            <option value="Cloudy Bay LLG">Cloudy Bay LLG</option>
            <option value="Amazon Bay LLG">Amazon Bay LLG</option>
          </select>
        </div>
      </div>

      {/* SUB-VIEW 1: COMMAND OVERVIEW */}
      {activeSubTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left 2 Cols: Operations Feed & Immediate Water Actions */}
          <div className="lg:col-span-2 space-y-6">
            {/* Urgent Field Requests Alert Box */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center font-bold">
                    !
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-white">
                      Priority Field Relief Requests (Pending Response)
                    </h3>
                    <p className="text-xs text-slate-400">
                      Dispatched by Ward Councillors and Community Health Workers
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setActiveSubTab('requests')}
                  className="text-xs text-rose-400 font-semibold hover:underline"
                >
                  View All ({fieldRequests.length}) &rarr;
                </button>
              </div>

              <div className="space-y-3">
                {fieldRequests.slice(0, 3).map((req) => (
                  <div
                    key={req.id}
                    className="p-3.5 rounded-xl bg-slate-950 border border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-white">
                          {req.village} ({req.llg})
                        </span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-rose-500/20 text-rose-300 border border-rose-500/30">
                          {req.requestType}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {req.affectedPeople} persons
                        </span>
                      </div>
                      <p className="text-xs text-slate-300 leading-snug">
                        {req.details}
                      </p>
                      <div className="text-[10px] text-slate-500">
                        Lodged by {req.requesterName} &bull; {req.requesterRole}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-start sm:self-center shrink-0">
                      <span className={`px-2 py-1 rounded-lg text-[10px] font-semibold ${
                        req.status === 'Completed'
                          ? 'bg-emerald-500/20 text-emerald-300'
                          : req.status === 'Relief Dispatched'
                          ? 'bg-blue-500/20 text-blue-300'
                          : 'bg-amber-500/20 text-amber-300'
                      }`}>
                        {req.status}
                      </span>
                      {req.status === 'Pending DDA Review' && (
                        <button
                          onClick={() => updateFieldRequestStatus(req.id, 'Relief Dispatched')}
                          className="px-2.5 py-1 rounded-lg bg-rose-500 hover:bg-rose-400 text-white font-bold text-[10px] transition-all cursor-pointer"
                        >
                          Dispatch Aid
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Critical Water Depletions Table */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
                    <Droplets className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-white">
                      Critical Water Points Needing Emergency Rehabilitation
                    </h3>
                    <p className="text-xs text-slate-400">
                      Shallow wells, dried catchments &amp; solar pump overhauls
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setActiveSubTab('water')}
                  className="text-xs text-amber-400 font-semibold hover:underline"
                >
                  Manage Water Points &rarr;
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] font-mono border-b border-slate-800">
                    <tr>
                      <th className="py-2.5 px-3">Water Point &amp; Village</th>
                      <th className="py-2.5 px-3">Type</th>
                      <th className="py-2.5 px-3">Status</th>
                      <th className="py-2.5 px-3">Households</th>
                      <th className="py-2.5 px-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 text-slate-300">
                    {waterPoints.slice(0, 4).map((wp) => (
                      <tr key={wp.id} className="hover:bg-slate-850 transition-colors">
                        <td className="py-2.5 px-3">
                          <div className="font-bold text-white">{wp.name}</div>
                          <div className="text-[10px] text-slate-500">{wp.village} &bull; {wp.llg}</div>
                        </td>
                        <td className="py-2.5 px-3 text-slate-400">{wp.type}</td>
                        <td className="py-2.5 px-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                            wp.status === 'Operational'
                              ? 'bg-emerald-500/20 text-emerald-400'
                              : wp.status === 'Emergency Rationing'
                              ? 'bg-amber-500/20 text-amber-400'
                              : 'bg-rose-500/20 text-rose-400'
                          }`}>
                            {wp.status}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 font-mono">{wp.householdsServed} HH</td>
                        <td className="py-2.5 px-3 text-right">
                          <button
                            onClick={() => {
                              setEditingWaterPoint(wp);
                              setNewWpStatus(wp.status);
                              setNewWpNotes(wp.rehabilitationRequired);
                            }}
                            className="text-amber-400 hover:text-amber-300 font-semibold text-[11px]"
                          >
                            Update
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Right 1 Col: Active Convoys & Logistics Stream */}
          <div className="space-y-6">
            {/* Active Convoys Box */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-sm text-white flex items-center gap-2">
                  <Truck className="w-4 h-4 text-blue-400" />
                  <span>Aid Convoys &amp; Transport</span>
                </h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-500/20 text-blue-300">
                  {reliefShipments.length} Active Convoys
                </span>
              </div>

              <div className="space-y-3">
                {reliefShipments.map((s) => (
                  <div
                    key={s.id}
                    className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-white">
                        {s.convoyCode}
                      </span>
                      <span className="text-[10px] font-mono text-slate-400">
                        {s.dispatchDate}
                      </span>
                    </div>

                    <div className="text-[11px] text-amber-400 font-medium">
                      {s.aidCategory}
                    </div>

                    <div className="text-[10px] text-slate-400">
                      Destination: {s.destinationVillages.join(', ')} ({s.llg})
                    </div>

                    <div className="flex items-center justify-between pt-1 border-t border-slate-900 text-[10px]">
                      <span className="text-slate-400">{s.transportMethod}</span>
                      <span className={`px-2 py-0.5 rounded font-bold ${
                        s.status === 'Distributed & Certified'
                          ? 'bg-emerald-500/20 text-emerald-400'
                          : 'bg-blue-500/20 text-blue-400'
                      }`}>
                        {s.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Health Surveillance Summary Box */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-3">
              <h3 className="font-bold text-sm text-white flex items-center gap-2">
                <HeartPulse className="w-4 h-4 text-rose-400" />
                <span>Malnutrition &amp; Epidemic Alerts</span>
              </h3>

              <div className="space-y-2.5">
                {healthIncidents.map((h) => (
                  <div
                    key={h.id}
                    className="p-3 rounded-xl bg-slate-950 border border-slate-800/70 text-xs space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-rose-300">{h.condition}</span>
                      <span className="text-white font-mono font-bold">{h.casesCount} cases</span>
                    </div>
                    <div className="text-[11px] text-slate-400">
                      {h.facility} &bull; {h.llg}
                    </div>
                    <p className="text-[11px] text-slate-300 leading-snug">
                      {h.notes}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUB-VIEW 2: WATER POINTS & BOREHOLES */}
      {activeSubTab === 'water' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-white">
                Abau District Water Infrastructure &amp; Emergency Supply Points
              </h2>
              <p className="text-xs text-slate-400">
                Track status, yields, and rehabilitation actions for deep aquifer boreholes, rainwater tanks, and desalination points.
              </p>
            </div>
            <div className="text-xs text-slate-300 font-mono">
              Showing {filteredWaterPoints.length} of {waterPoints.length} Water Points
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredWaterPoints.map((wp) => (
              <div
                key={wp.id}
                className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm flex flex-col justify-between space-y-4"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <span className="text-[10px] font-mono text-slate-400">{wp.id}</span>
                      <h3 className="font-bold text-sm text-white">{wp.name}</h3>
                      <div className="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5">
                        <MapPin className="w-3.5 h-3.5 text-rose-400" />
                        <span>{wp.village}, {wp.llg}</span>
                      </div>
                    </div>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      wp.status === 'Operational'
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        : wp.status === 'Emergency Rationing'
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                    }`}>
                      {wp.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 my-3 p-3 rounded-xl bg-slate-950 border border-slate-800/80 text-xs">
                    <div>
                      <span className="text-slate-500 text-[10px] block">Daily Yield</span>
                      <span className="font-mono font-bold text-white">
                        {wp.dailyYieldLiters.toLocaleString()} L/day
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500 text-[10px] block">Storage Capacity</span>
                      <span className="font-mono font-bold text-white">
                        {wp.storageCapacityLiters.toLocaleString()} L
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500 text-[10px] block">Population</span>
                      <span className="font-mono font-bold text-amber-400">
                        {wp.householdsServed} Households
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500 text-[10px] block">Type</span>
                      <span className="font-medium text-slate-300 truncate block">
                        {wp.type}
                      </span>
                    </div>
                  </div>

                  <div className="text-xs text-slate-300">
                    <span className="text-[10px] font-semibold text-slate-400 block mb-1">
                      Rehabilitation / Response Action:
                    </span>
                    <p className="bg-slate-950/80 p-2.5 rounded-xl border border-slate-800/60 leading-snug">
                      {wp.rehabilitationRequired}
                    </p>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
                  <span className="text-slate-400 font-mono text-[11px]">
                    Est: K{wp.estimatedCostKina.toLocaleString()}
                  </span>
                  <button
                    onClick={() => {
                      setEditingWaterPoint(wp);
                      setNewWpStatus(wp.status);
                      setNewWpNotes(wp.rehabilitationRequired);
                    }}
                    className="px-3 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 font-bold transition-all cursor-pointer"
                  >
                    Update Water Status
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SUB-VIEW 3: AID CONVOYS & BARGES */}
      {activeSubTab === 'convoys' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-white">
                Relief Aid Convoys &amp; Maritime Transport (Abau District)
              </h2>
              <p className="text-xs text-slate-400">
                Tracking road dispatches via Magi Highway arterial and coastal sea barges to isolated maritime wards in Amazon Bay &amp; Cloudy Bay.
              </p>
            </div>
            <div className="text-xs text-slate-300 font-mono">
              {reliefShipments.length} Logged Shipments
            </div>
          </div>

          <div className="space-y-3">
            {filteredShipments.map((s) => (
              <div
                key={s.id}
                className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono font-bold text-sm text-white">
                      {s.convoyCode}
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-blue-500/20 text-blue-300 border border-blue-500/30">
                      {s.transportMethod}
                    </span>
                    <span className="text-xs text-slate-400">
                      Dispatched: {s.dispatchDate}
                    </span>
                  </div>

                  <h3 className="font-bold text-sm text-amber-400">
                    {s.aidCategory}
                  </h3>

                  <p className="text-xs text-slate-300 max-w-2xl">
                    <strong>Manifest:</strong> {s.quantityDescription}
                  </p>

                  <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400 pt-1">
                    <span>Target LLG: <strong className="text-white">{s.llg}</strong></span>
                    <span>Villages: <strong className="text-white">{s.destinationVillages.join(', ')}</strong></span>
                    <span>Beneficiaries: <strong className="text-emerald-400">{s.beneficiaryHouseholds.toLocaleString()} Families</strong></span>
                    <span>Officer: <strong className="text-slate-300">{s.leadOfficer}</strong></span>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 shrink-0">
                  <div className="text-right">
                    <span className="text-[10px] text-slate-500 block">Status</span>
                    <span className={`px-2.5 py-1 rounded-lg text-xs font-bold inline-block mt-0.5 ${
                      s.status === 'Distributed & Certified'
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        : s.status === 'Coastal Barge in Transit'
                        ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                        : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                    }`}>
                      {s.status}
                    </span>
                  </div>

                  {s.status !== 'Distributed & Certified' && (
                    <button
                      onClick={() => updateShipmentStatus(s.id, 'Distributed & Certified')}
                      className="px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition-all cursor-pointer shadow"
                    >
                      Certify Delivery
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SUB-VIEW 4: HEALTH & MALNUTRITION */}
      {activeSubTab === 'health' && (
        <div className="space-y-6">
          <div>
            <h2 className="text-base font-bold text-white">
              Health Post Admissions &amp; Malnutrition Surveillance
            </h2>
            <p className="text-xs text-slate-400">
              Monitoring Severe Acute Malnutrition (SAM), dehydration shock, and waterborne illnesses resulting from aquifer depletion.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {healthIncidents.map((h) => (
              <div
                key={h.id}
                className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm space-y-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-[10px] font-mono text-slate-500">{h.id} &bull; {h.date}</span>
                    <h3 className="font-bold text-base text-white">{h.facility}</h3>
                    <div className="text-xs text-slate-400">{h.llg}</div>
                  </div>
                  <span className={`px-2.5 py-1 rounded text-xs font-bold ${
                    h.urgency === 'Emergency Medical Squad Dispatched'
                      ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                      : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  }`}>
                    {h.urgency}
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 flex items-center justify-between text-xs">
                  <div>
                    <span className="text-slate-400 block text-[10px]">Condition Diagnosed</span>
                    <span className="font-bold text-rose-400">{h.condition}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-slate-400 block text-[10px]">Active Cases</span>
                    <span className="font-mono font-black text-lg text-white">{h.casesCount}</span>
                  </div>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed">
                  {h.notes}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SUB-VIEW 5: FIELD RELIEF REQUESTS */}
      {activeSubTab === 'requests' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-white">
                Ward Councillor &amp; Community Relief Requests
              </h2>
              <p className="text-xs text-slate-400">
                Urgent requests lodged directly from rural village wards for water carting, food packs, and medical intervention.
              </p>
            </div>
            <button
              onClick={() => setIsNewRequestModalOpen(true)}
              className="px-3.5 py-2 rounded-xl bg-rose-500 hover:bg-rose-400 text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow cursor-pointer self-start sm:self-center"
            >
              <Plus className="w-4 h-4" />
              <span>Lodge New Request</span>
            </button>
          </div>

          <div className="space-y-3">
            {filteredRequests.map((r) => (
              <div
                key={r.id}
                className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-xs text-slate-400">{r.id}</span>
                    <span className="font-bold text-sm text-white">
                      {r.village} ({r.llg})
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-rose-500/20 text-rose-300 border border-rose-500/30">
                      {r.requestType}
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-800 text-slate-300">
                      {r.urgency}
                    </span>
                  </div>

                  <p className="text-xs text-slate-300 max-w-3xl leading-relaxed">
                    {r.details}
                  </p>

                  <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400">
                    <span>Requester: <strong className="text-slate-200">{r.requesterName}</strong> ({r.requesterRole})</span>
                    <span>Affected: <strong className="text-amber-400">{r.affectedPeople} persons</strong></span>
                    <span>Lodged: <span className="font-mono text-slate-500">{new Date(r.timestamp).toLocaleDateString()}</span></span>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 shrink-0">
                  <select
                    value={r.status}
                    onChange={(e) => updateFieldRequestStatus(r.id, e.target.value as any)}
                    className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white font-bold focus:outline-none focus:border-rose-500"
                  >
                    <option value="Pending DDA Review">Pending DDA Review</option>
                    <option value="Relief Dispatched">Relief Dispatched</option>
                    <option value="Completed">Completed</option>
                  </select>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SUB-VIEW 6: DISASTER FUND & PARTNERS */}
      {activeSubTab === 'budget' && (
        <div className="space-y-6">
          <div>
            <h2 className="text-base font-bold text-white">
              El Niño Disaster Relief Contingency Fund &amp; Partner Allocations
            </h2>
            <p className="text-xs text-slate-400">
              Joint disaster financing governed by Central Province Government, Abau DDA, National Disaster Centre, and international relief partners.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800">
              <span className="text-xs text-slate-400 block mb-1">Total Emergency Fund</span>
              <div className="text-2xl font-black text-white font-mono">
                PGK {(elNinoBudget.totalBudgetKina / 1000000).toFixed(2)}M
              </div>
              <span className="text-[10px] text-slate-500 mt-1 block">Central Disaster Allocation</span>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800">
              <span className="text-xs text-slate-400 block mb-1">Disbursed for Relief</span>
              <div className="text-2xl font-black text-emerald-400 font-mono">
                PGK {(elNinoBudget.disbursedKina / 1000000).toFixed(2)}M
              </div>
              <span className="text-[10px] text-emerald-400/80 mt-1 block">57% deployed to date</span>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800">
              <span className="text-xs text-slate-400 block mb-1">Committed Procurement</span>
              <div className="text-2xl font-black text-amber-400 font-mono">
                PGK {(elNinoBudget.committedKina / 1000000).toFixed(2)}M
              </div>
              <span className="text-[10px] text-amber-400/80 mt-1 block">Boreholes &amp; Barge charter</span>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800">
              <span className="text-xs text-slate-400 block mb-1">Contingency Reserve</span>
              <div className="text-2xl font-black text-blue-400 font-mono">
                PGK {(elNinoBudget.contingencyRemainingKina / 1000).toFixed(0)}k
              </div>
              <span className="text-[10px] text-blue-400/80 mt-1 block">Remaining liquid reserve</span>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
            <h3 className="font-bold text-sm text-white">
              Institutional Disaster Relief Partners &amp; Agencies
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {elNinoBudget.donorPartners.map((partner, idx) => (
                <div
                  key={idx}
                  className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-xs flex items-center gap-3"
                >
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-bold">
                    ✓
                  </div>
                  <span className="font-semibold text-slate-200">{partner}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Modal: Lodge New Relief Request */}
      {isNewRequestModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-rose-400" />
                <h3 className="font-bold text-base text-white">
                  Lodge Emergency Field Relief Request
                </h3>
              </div>
              <button
                onClick={() => setIsNewRequestModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateRequest} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1 font-medium">LLG Scope</label>
                  <select
                    value={formData.llg}
                    onChange={(e) => setFormData({ ...formData, llg: e.target.value as AbauLLG })}
                    className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white"
                  >
                    <option value="Aroma LLG">Aroma LLG</option>
                    <option value="Kupiano LLG">Kupiano LLG</option>
                    <option value="Cloudy Bay LLG">Cloudy Bay LLG</option>
                    <option value="Amazon Bay LLG">Amazon Bay LLG</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 font-medium">Village / Location</label>
                  <input
                    type="text"
                    required
                    value={formData.village}
                    onChange={(e) => setFormData({ ...formData, village: e.target.value })}
                    placeholder="e.g. Mailu Island, Pelagai, Amau"
                    className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1 font-medium">Requester Name</label>
                  <input
                    type="text"
                    required
                    value={formData.requesterName}
                    onChange={(e) => setFormData({ ...formData, requesterName: e.target.value })}
                    placeholder="e.g. Councillor Tau Nou"
                    className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 font-medium">Official Role</label>
                  <select
                    value={formData.requesterRole}
                    onChange={(e) => setFormData({ ...formData, requesterRole: e.target.value as any })}
                    className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white"
                  >
                    <option value="Ward Councillor">Ward Councillor</option>
                    <option value="Village Elder">Village Elder</option>
                    <option value="Community Health Worker">Community Health Worker</option>
                    <option value="Field Relief Officer">Field Relief Officer</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1 font-medium">Request Type</label>
                  <select
                    value={formData.requestType}
                    onChange={(e) => setFormData({ ...formData, requestType: e.target.value as any })}
                    className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white"
                  >
                    <option value="Emergency Water Trucking">Emergency Water Trucking</option>
                    <option value="Immediate Food Ration Pack">Immediate Food Ration Pack</option>
                    <option value="Medical Rehydration Unit">Medical Rehydration Unit</option>
                    <option value="Borehole Solar Pump Failure">Borehole Solar Pump Failure</option>
                    <option value="Seedling Relief Kit">Seedling Relief Kit</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 font-medium">Affected People</label>
                  <input
                    type="number"
                    min="1"
                    value={formData.affectedPeople}
                    onChange={(e) => setFormData({ ...formData, affectedPeople: Number(e.target.value) })}
                    className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-medium">
                  Detailed Situation &amp; Needs
                </label>
                <textarea
                  required
                  rows={3}
                  value={formData.details}
                  onChange={(e) => setFormData({ ...formData, details: e.target.value })}
                  placeholder="Describe ground conditions, dry water wells, garden loss, or clinic stockouts..."
                  className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white leading-relaxed"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsNewRequestModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-rose-500 hover:bg-rose-400 text-white font-bold shadow"
                >
                  Submit Emergency Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Update Water Point Status */}
      {editingWaterPoint && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-base text-white">
                Update Water Point Status
              </h3>
              <button
                onClick={() => setEditingWaterPoint(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <span className="text-slate-400 block mb-0.5">Water Point</span>
                <span className="font-bold text-white text-sm">{editingWaterPoint.name}</span>
                <div className="text-[11px] text-slate-500">{editingWaterPoint.village} &bull; {editingWaterPoint.llg}</div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-medium">New Status</label>
                <select
                  value={newWpStatus}
                  onChange={(e) => setNewWpStatus(e.target.value as WaterPointStatus)}
                  className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white font-semibold"
                >
                  <option value="Operational">Operational</option>
                  <option value="Critical Depletion">Critical Depletion</option>
                  <option value="Saline Contaminated">Saline Contaminated</option>
                  <option value="Dried Up">Dried Up</option>
                  <option value="Emergency Rationing">Emergency Rationing</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-medium">
                  Rehabilitation / Action Required
                </label>
                <textarea
                  rows={3}
                  value={newWpNotes}
                  onChange={(e) => setNewWpNotes(e.target.value)}
                  className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingWaterPoint(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveWaterPointStatus}
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold"
                >
                  Save Status
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
