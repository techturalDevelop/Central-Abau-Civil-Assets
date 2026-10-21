import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import {
  Asset,
  AssetType,
  ConditionRating,
  District,
  MaintenancePriority,
  AssetStatus,
  RiskLevel,
} from '../types';
import {
  Search,
  Plus,
  Filter,
  Download,
  Eye,
  Edit2,
  Archive,
  Compass,
  MapPin,
  FileText,
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  X,
  ExternalLink,
  ShieldAlert,
  Calendar,
  Layers,
  ArrowUpDown,
  LayoutGrid,
  List,
} from 'lucide-react';

export const AssetRegister: React.FC = () => {
  const {
    assets,
    filteredAssets,
    addAsset,
    updateAsset,
    archiveAsset,
    selectedAssetId,
    setSelectedAssetId,
    setActiveTab,
    searchQuery,
    setSearchQuery,
    districtFilter,
    setDistrictFilter,
    assetTypeFilter,
    setAssetTypeFilter,
    conditionFilter,
    setConditionFilter,
    priorityFilter,
    setPriorityFilter,
    exportDataAsJson,
    defects,
    inspections,
    setIsPdfStudioOpen,
    showFrozenRigo,
    setShowFrozenRigo,
  } = useApp();

  // Local UI State
  const [showArchived, setShowArchived] = useState(false);
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');
  const [sortField, setSortField] = useState<keyof Asset>('id');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);

  // New Asset Form State
  const [formError, setFormError] = useState<string | null>(null);
  const [formData, setFormData] = useState<{
    id: string;
    code: string;
    name: string;
    type: AssetType;
    district: District;
    llg: string;
    locationDescription: string;
    latitude: string;
    longitude: string;
    description: string;
    surfaceType: string;
    spanMeters: string;
    lengthMeters: string;
    widthMeters: string;
    designTonnage: string;
    yearBuilt: string;
    conditionScore: number;
    replacementValueKina: string;
    recommendedAction: string;
    status: AssetStatus;
  }>({
    id: '',
    code: '',
    name: '',
    type: 'road',
    district: 'Abau',
    llg: 'Aroma LLG',
    locationDescription: '',
    latitude: '-10.1334',
    longitude: '148.0172',
    description: '',
    surfaceType: 'Bituminous Seal',
    spanMeters: '',
    lengthMeters: '',
    widthMeters: '',
    designTonnage: '',
    yearBuilt: '2016',
    conditionScore: 70,
    replacementValueKina: '2500000',
    recommendedAction: 'Routine condition monitoring and periodic drainage clearing',
    status: 'Operational',
  });

  // LLG Options based on district
  const llgOptions: Record<District, string[]> = {
    Rigo: ['Rigo Central', 'Rigo Coastal', 'Rigo Inland'],
    Abau: ['Aroma LLG', 'Kupiano LLG', 'Cloudy Bay LLG', 'Amazon Bay LLG'],
  };

  // Sort Assets
  const sortedAssets = useMemo(() => {
    let list = filteredAssets;
    if (!showArchived) {
      list = list.filter(a => a.status !== 'Archived');
    }

    return [...list].sort((a, b) => {
      let valA: any = a[sortField];
      let valB: any = b[sortField];

      if (typeof valA === 'string') {
        const cmp = valA.localeCompare(String(valB));
        return sortDirection === 'asc' ? cmp : -cmp;
      }
      if (typeof valA === 'number') {
        return sortDirection === 'asc' ? valA - valB : valB - valA;
      }
      return 0;
    });
  }, [filteredAssets, showArchived, sortField, sortDirection]);

  const handleSort = (field: keyof Asset) => {
    if (sortField === field) {
      setSortDirection(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Handle GPS Auto-detect
  const handleAutoGPS = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        pos => {
          setFormData(prev => ({
            ...prev,
            latitude: pos.coords.latitude.toFixed(6),
            longitude: pos.coords.longitude.toFixed(6),
          }));
        },
        err => {
          // Fallback to Central Province default
          setFormData(prev => ({
            ...prev,
            latitude: '-9.825000',
            longitude: '147.585000',
          }));
        }
      );
    }
  };

  // Condition classification mapping
  const getConditionClassification = (score: number): ConditionRating => {
    if (score >= 70) return 'Good';
    if (score >= 50) return 'Fair';
    if (score >= 35) return 'Poor';
    return 'Critical';
  };

  // Risk level mapping
  const getRiskLevel = (score: number): RiskLevel => {
    if (score < 35) return 'Extreme';
    if (score < 50) return 'High';
    if (score < 70) return 'Medium';
    return 'Low';
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    // Validate ID
    const cleanId = formData.id.trim().toUpperCase();
    if (!cleanId) {
      setFormError('Asset ID is required (e.g. CP-RIG-RD-015).');
      return;
    }
    if (!formData.name.trim()) {
      setFormError('Asset Name is required.');
      return;
    }

    const lat = parseFloat(formData.latitude);
    const lng = parseFloat(formData.longitude);
    if (isNaN(lat) || isNaN(lng)) {
      setFormError('Valid Latitude and Longitude coordinates are required.');
      return;
    }

    const condClass = getConditionClassification(formData.conditionScore);
    const risk = getRiskLevel(formData.conditionScore);

    const newAssetRecord: Asset = {
      id: cleanId,
      code: formData.code.trim() || cleanId,
      name: formData.name.trim(),
      type: formData.type,
      province: 'Central Province',
      district: formData.district,
      llg: formData.llg,
      locationDescription: formData.locationDescription.trim() || 'Central Province road link',
      coordinates: [lat, lng],
      description: formData.description.trim() || 'Recorded infrastructure asset',
      technicalSpecs: {
        surfaceType: formData.surfaceType,
        spanMeters: formData.spanMeters ? parseFloat(formData.spanMeters) : undefined,
        lengthMeters: formData.lengthMeters ? parseFloat(formData.lengthMeters) : undefined,
        widthMeters: formData.widthMeters ? parseFloat(formData.widthMeters) : undefined,
        designTonnage: formData.designTonnage ? parseFloat(formData.designTonnage) : undefined,
        yearBuilt: formData.yearBuilt ? parseInt(formData.yearBuilt, 10) : undefined,
      },
      conditionClassification: condClass,
      conditionScore: formData.conditionScore,
      riskClassification: risk,
      maintenancePriority: condClass === 'Critical' ? 'Critical' : condClass === 'Poor' ? 'High' : condClass === 'Fair' ? 'Medium' : 'Low',
      recommendedAction: formData.recommendedAction,
      priorityScore: Math.round(100 - formData.conditionScore * 0.7),
      priorityFactors: {
        conditionDeficit: 100 - formData.conditionScore,
        defectSeverity: condClass === 'Critical' ? 80 : 30,
        safetyRisk: condClass === 'Critical' ? 85 : 30,
        infrastructureImportance: 80,
        serviceDisruption: 75,
      },
      replacementValueKina: parseFloat(formData.replacementValueKina) || 1000000,
      lastInspectionDate: new Date().toISOString().split('T')[0],
      nextInspectionDate: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      inspectionFrequencyMonths: 6,
      status: formData.status,
      photos: [
        formData.type === 'bridge'
          ? 'https://images.unsplash.com/photo-1545558014-8692077e9b5c?auto=format&fit=crop&w=800&q=80'
          : formData.type === 'culvert'
          ? 'https://images.unsplash.com/photo-1584467735871-8e85353a8413?auto=format&fit=crop&w=800&q=80'
          : 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&w=800&q=80',
      ],
      documents: [],
      maintenanceHistory: [],
      defectsCount: 0,
      isDemoRecord: true,
    };

    const res = addAsset(newAssetRecord);
    if (!res.success) {
      setFormError(res.error || 'Failed to add asset.');
      return;
    }

    setIsCreateModalOpen(false);
  };

  // Export to CSV
  const exportToCSV = () => {
    const headers = [
      'Asset ID',
      'Name',
      'Type',
      'District',
      'LLG',
      'Condition Classification',
      'Condition Score',
      'Priority',
      'Priority Score',
      'Status',
      'Replacement Value (PGK)',
      'Last Inspection',
      'Latitude',
      'Longitude',
    ];

    const rows = sortedAssets.map(a => [
      `"${a.id}"`,
      `"${a.name.replace(/"/g, '""')}"`,
      a.type,
      a.district,
      `"${a.llg}"`,
      a.conditionClassification,
      a.conditionScore,
      a.maintenancePriority,
      a.priorityScore,
      a.status,
      a.replacementValueKina,
      a.lastInspectionDate,
      a.coordinates[0],
      a.coordinates[1],
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `central-province-asset-register-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono tracking-wider uppercase px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
              Infrastructure Asset Register
            </span>
            <span className="text-[11px] text-slate-400">Rigo & Abau Districts</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white mt-1 tracking-tight">
            Central Province Asset Inventory
          </h1>
          <p className="text-sm text-slate-400 mt-1 max-w-2xl">
            Authoritative register of roads, bridges, culverts, causeways, and drainage networks with structural characteristics and lifecycle tracking.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => {
              setFormData({
                id: `CP-${districtFilter === 'Abau' ? 'ABU' : 'RIG'}-${assetTypeFilter !== 'All' ? assetTypeFilter.toUpperCase().slice(0, 3) : 'RD'}-${String(assets.length + 1).padStart(3, '0')}`,
                code: '',
                name: '',
                type: assetTypeFilter !== 'All' ? assetTypeFilter : 'road',
                district: districtFilter !== 'All' ? districtFilter : 'Rigo',
                llg: districtFilter === 'Abau' ? 'Aroma Coast' : 'Rigo Central',
                locationDescription: '',
                latitude: '-9.825000',
                longitude: '147.585000',
                description: '',
                surfaceType: 'Bituminous Seal',
                spanMeters: '',
                lengthMeters: '',
                widthMeters: '',
                designTonnage: '',
                yearBuilt: '2016',
                conditionScore: 65,
                replacementValueKina: '2500000',
                recommendedAction: 'Routine condition monitoring',
                status: 'Operational',
              });
              setFormError(null);
              setIsCreateModalOpen(true);
            }}
            className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold flex items-center gap-2 shadow-lg transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Create Asset Record</span>
          </button>

          <button
            onClick={() => setIsPdfStudioOpen(true)}
            className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold flex items-center gap-2 shadow-lg transition-all cursor-pointer"
            title="Review & Save Asset Register as PDF"
          >
            <Eye className="w-4 h-4" />
            <span>Save as PDF</span>
          </button>

          <button
            onClick={exportToCSV}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 flex items-center gap-2 transition-colors cursor-pointer"
            title="Download CSV Spreadsheet"
          >
            <Download className="w-4 h-4 text-amber-400" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={exportDataAsJson}
            className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 flex items-center gap-2 transition-colors cursor-pointer"
            title="Export Full JSON Schema"
          >
            <FileText className="w-4 h-4 text-slate-400" />
            <span>JSON</span>
          </button>
        </div>
      </div>

      {/* Rigo Freeze Alert Banner */}
      <div className="bg-slate-900/90 border border-slate-800 px-4 py-2.5 rounded-2xl flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-2 text-slate-300">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span className="font-bold text-white">Target District: Abau</span>
          <span className="text-slate-500">|</span>
          <span className="text-slate-400">Rigo records frozen/archived. Focusing on Aroma, Kupiano, Cloudy Bay & Amazon Bay.</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowFrozenRigo(!showFrozenRigo)}
            className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-[11px] font-medium transition-colors cursor-pointer"
          >
            {showFrozenRigo ? 'Hide Frozen Rigo Records' : 'Show Frozen Rigo (Archived)'}
          </button>
        </div>
      </div>

      {/* Control Bar: Search & Filter options */}
      <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-2xl space-y-3 shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Search Field */}
          <div className="relative flex-1 min-w-[260px]">
            <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Search by ID, asset name, LLG, location..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-amber-500"
            />
          </div>

          {/* Quick Filters */}
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={districtFilter}
              onChange={e => setDistrictFilter(e.target.value as any)}
              className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-amber-500 font-medium"
            >
              <option value="Abau">Abau District (Active Focus)</option>
              <option value="All">All Districts (Include Frozen Rigo)</option>
              <option value="Rigo">Rigo District (Frozen)</option>
            </select>

            <select
              value={assetTypeFilter}
              onChange={e => setAssetTypeFilter(e.target.value as any)}
              className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-amber-500"
            >
              <option value="All">All Types</option>
              <option value="road">Roads</option>
              <option value="bridge">Bridges</option>
              <option value="culvert">Culverts</option>
              <option value="drainage">Drainage</option>
              <option value="causeway">Causeways</option>
            </select>

            <select
              value={conditionFilter}
              onChange={e => setConditionFilter(e.target.value as any)}
              className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-amber-500"
            >
              <option value="All">All Conditions</option>
              <option value="Good">Good</option>
              <option value="Fair">Fair</option>
              <option value="Poor">Poor</option>
              <option value="Critical">Critical</option>
            </select>

            <label className="flex items-center gap-2 text-xs text-slate-400 pl-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={showArchived}
                onChange={e => setShowArchived(e.target.checked)}
                className="rounded border-slate-700 text-amber-500 focus:ring-amber-500 h-4 w-4"
              />
              <span>Show Archived</span>
            </label>
          </div>
        </div>

        {/* Results Count & View Mode indicator */}
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400 pt-2 border-t border-slate-800/80">
          <div className="flex items-center gap-2">
            <span>
              Showing <b>{sortedAssets.length}</b> registered infrastructure assets
            </span>
            <span className="text-slate-600">|</span>
            <span className="text-[11px] text-amber-400/90 font-medium">
              Official surveyed photo archives mapped
            </span>
          </div>

          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setViewMode('cards')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'cards'
                  ? 'bg-amber-500 text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
              title="Display Visual Asset Register Cards with Photographic Evidence"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Asset Cards</span>
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'table'
                  ? 'bg-amber-500 text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
              title="Display Dense Tabular Register"
            >
              <List className="w-3.5 h-3.5" />
              <span>Table View</span>
            </button>
          </div>
        </div>
      </div>

      {/* ASSET REGISTER CARDS VIEW */}
      {viewMode === 'cards' ? (
        <div className="space-y-4">
          {sortedAssets.length === 0 ? (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center text-slate-500">
              No infrastructure assets found matching current criteria.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4.5">
              {sortedAssets.map(asset => {
                const isSelected = selectedAssetId === asset.id;
                const hasPhoto = asset.photos && asset.photos.length > 0;
                const conditionPillColor =
                  asset.conditionClassification === 'Good'
                    ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                    : asset.conditionClassification === 'Fair'
                    ? 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                    : asset.conditionClassification === 'Poor'
                    ? 'bg-orange-500/20 text-orange-400 border-orange-500/30'
                    : 'bg-rose-500/20 text-rose-400 border-rose-500/30 animate-pulse';

                return (
                  <div
                    key={asset.id}
                    className={`bg-slate-900/90 border rounded-2xl overflow-hidden transition-all duration-200 flex flex-col group hover:shadow-2xl hover:-translate-y-0.5 ${
                      isSelected
                        ? 'border-amber-500 ring-2 ring-amber-500/30 shadow-amber-500/10'
                        : 'border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    {/* Photographic Asset Card Header */}
                    <div className="relative h-44 w-full bg-slate-950 overflow-hidden">
                      {hasPhoto ? (
                        <img
                          src={asset.photos[0]}
                          alt={asset.name}
                          loading="lazy"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          onError={(e) => {
                            // Fallback if image network error
                            (e.target as HTMLImageElement).src =
                              'https://images.unsplash.com/photo-1545558014-8692077e9b5c?auto=format&fit=crop&w=800&q=80';
                          }}
                        />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center bg-slate-950 text-slate-600 gap-2">
                          <Layers className="w-8 h-8 opacity-40" />
                          <span className="text-[10px] uppercase font-mono">No Photo Surveyed</span>
                        </div>
                      )}

                      {/* Top Badges Overlay */}
                      <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between gap-1.5 pointer-events-none">
                        <span className="font-mono font-black text-xs px-2.5 py-1 rounded-lg bg-slate-950/90 text-amber-400 border border-amber-500/40 shadow-lg backdrop-blur-md">
                          {asset.id}
                        </span>

                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold border backdrop-blur-md shadow-md ${conditionPillColor}`}
                        >
                          {asset.conditionClassification} ({asset.conditionScore})
                        </span>
                      </div>

                      {/* Bottom Banner Overlay */}
                      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-950 via-slate-950/70 to-transparent p-3 pt-6 flex items-end justify-between">
                        <div className="flex items-center gap-1.5">
                          <span className="text-base">
                            {asset.type === 'bridge'
                              ? '🌉'
                              : asset.type === 'road'
                              ? '🛣️'
                              : asset.type === 'culvert'
                              ? '⭕'
                              : asset.type === 'drainage'
                              ? '💧'
                              : '🌊'}
                          </span>
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-300">
                            {asset.type}
                          </span>
                        </div>

                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-900/90 text-slate-300 border border-slate-800">
                          {asset.status}
                        </span>
                      </div>
                    </div>

                    {/* Card Content */}
                    <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                      <div>
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <span className="text-[10px] font-mono text-amber-400/80 font-bold">
                            {asset.code}
                          </span>
                          <span className="text-[10px] text-slate-400 font-medium">
                            {asset.llg}
                          </span>
                        </div>

                        <h4
                          className="font-bold text-sm text-white group-hover:text-amber-400 transition-colors line-clamp-2 leading-tight"
                          title={asset.name}
                        >
                          {asset.name}
                        </h4>

                        <div className="text-[11px] text-slate-400 flex items-start gap-1 mt-1.5 line-clamp-2">
                          <MapPin className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                          <span>{asset.locationDescription}</span>
                        </div>
                      </div>

                      {/* Technical Specs Tags */}
                      <div className="bg-slate-950/80 p-2.5 rounded-xl border border-slate-800/80 grid grid-cols-2 gap-2 text-[10px]">
                        <div>
                          <span className="text-slate-500 block">Surface / Material</span>
                          <span className="text-slate-200 font-semibold truncate block">
                            {asset.technicalSpecs.surfaceType || 'Standard'}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-500 block">Dimension</span>
                          <span className="text-slate-200 font-semibold truncate block">
                            {asset.technicalSpecs.spanMeters
                              ? `${asset.technicalSpecs.spanMeters}m Span`
                              : asset.technicalSpecs.lengthMeters
                              ? `${(asset.technicalSpecs.lengthMeters / 1000).toFixed(1)} km`
                              : 'Site Standard'}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-500 block">Design Tonnage</span>
                          <span className="text-slate-200 font-semibold">
                            {asset.technicalSpecs.designTonnage || 30} Tonnes
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-500 block">Priority Score</span>
                          <span className="text-amber-400 font-bold">
                            {asset.priorityScore} ({asset.maintenancePriority})
                          </span>
                        </div>
                      </div>

                      {/* Card Footer Actions */}
                      <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between gap-1.5">
                        <button
                          onClick={() => {
                            setSelectedAsset(asset);
                            setIsDetailModalOpen(true);
                          }}
                          className="flex-1 py-1.5 px-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white text-[11px] font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5 text-amber-400" />
                          <span>View Card</span>
                        </button>

                        <button
                          onClick={() => {
                            setSelectedAssetId(asset.id);
                            setActiveTab('map');
                          }}
                          className="py-1.5 px-2.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 text-[11px] font-bold flex items-center gap-1 transition-colors cursor-pointer"
                          title="Locate on GIS Map"
                        >
                          <Compass className="w-3.5 h-3.5" />
                          <span>GIS Map</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        /* Dense Tabular View */
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950 text-slate-400 uppercase font-bold text-[10px] tracking-wider border-b border-slate-800">
                <tr>
                  <th
                    onClick={() => handleSort('id')}
                    className="px-4 py-3 cursor-pointer hover:text-white"
                  >
                    <div className="flex items-center gap-1">
                      <span>Asset ID</span>
                      <ArrowUpDown className="w-3 h-3 text-slate-500" />
                    </div>
                  </th>
                  <th
                    onClick={() => handleSort('name')}
                    className="px-4 py-3 cursor-pointer hover:text-white"
                  >
                    <div className="flex items-center gap-1">
                      <span>Name & Location</span>
                      <ArrowUpDown className="w-3 h-3 text-slate-500" />
                    </div>
                  </th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">District / LLG</th>
                  <th
                    onClick={() => handleSort('conditionScore')}
                    className="px-4 py-3 cursor-pointer hover:text-white"
                  >
                    <div className="flex items-center gap-1">
                      <span>Condition</span>
                      <ArrowUpDown className="w-3 h-3 text-slate-500" />
                    </div>
                  </th>
                  <th
                    onClick={() => handleSort('priorityScore')}
                    className="px-4 py-3 cursor-pointer hover:text-white"
                  >
                    <div className="flex items-center gap-1">
                      <span>Priority</span>
                      <ArrowUpDown className="w-3 h-3 text-slate-500" />
                    </div>
                  </th>
                  <th className="px-4 py-3">Defects</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {sortedAssets.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-6 py-12 text-center text-slate-500">
                      No infrastructure assets found matching current criteria.
                    </td>
                  </tr>
                ) : (
                  sortedAssets.map(asset => {
                    return (
                      <tr
                        key={asset.id}
                        className="hover:bg-slate-800/40 transition-colors group"
                      >
                        {/* Asset ID */}
                        <td className="px-4 py-3.5 whitespace-nowrap">
                          <span className="font-mono font-bold text-amber-400 bg-slate-950 px-2 py-1 rounded border border-slate-800">
                            {asset.id}
                          </span>
                        </td>

                        {/* Name & Location */}
                        <td className="px-4 py-3.5 max-w-xs">
                          <div className="font-bold text-white group-hover:text-amber-400 transition-colors">
                            {asset.name}
                          </div>
                          <div className="text-[11px] text-slate-400 truncate flex items-center gap-1 mt-0.5">
                            <MapPin className="w-3 h-3 text-amber-500 shrink-0" />
                            <span>{asset.locationDescription}</span>
                          </div>
                        </td>

                        {/* Type */}
                        <td className="px-4 py-3.5 whitespace-nowrap">
                          <span className="capitalize text-slate-300 flex items-center gap-1.5 font-medium">
                            <span>
                              {asset.type === 'bridge'
                                ? '🌉'
                                : asset.type === 'road'
                                ? '🛣️'
                                : asset.type === 'culvert'
                                ? '⭕'
                                : asset.type === 'drainage'
                                ? '💧'
                                : '🌊'}
                            </span>
                            <span>{asset.type}</span>
                          </span>
                        </td>

                        {/* District / LLG */}
                        <td className="px-4 py-3.5 whitespace-nowrap">
                          <div className="font-semibold text-slate-200">{asset.district}</div>
                          <div className="text-[10px] text-slate-400">{asset.llg}</div>
                        </td>

                        {/* Condition */}
                        <td className="px-4 py-3.5 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full font-bold text-[11px] ${
                              asset.conditionClassification === 'Good'
                                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                : asset.conditionClassification === 'Fair'
                                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                                : asset.conditionClassification === 'Poor'
                                ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30'
                                : 'bg-rose-500/20 text-rose-400 border border-rose-500/30 animate-pulse'
                            }`}
                          >
                            <span>{asset.conditionClassification}</span>
                            <span className="font-mono text-[10px]">({asset.conditionScore})</span>
                          </span>
                        </td>

                        {/* Priority */}
                        <td className="px-4 py-3.5 whitespace-nowrap">
                          <div className="flex items-center gap-1.5">
                            <span
                              className={`font-semibold ${
                                asset.maintenancePriority === 'Critical'
                                  ? 'text-rose-400 font-bold'
                                  : asset.maintenancePriority === 'High'
                                  ? 'text-orange-400'
                                  : asset.maintenancePriority === 'Medium'
                                  ? 'text-amber-400'
                                  : 'text-slate-400'
                              }`}
                            >
                              {asset.maintenancePriority}
                            </span>
                            <span className="font-mono text-[10px] text-slate-500">
                              ({asset.priorityScore})
                            </span>
                            {asset.priorityOverride && (
                              <span className="text-[10px] text-amber-400" title="Engineering Override">
                                ⚠️
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Defects */}
                        <td className="px-4 py-3.5 whitespace-nowrap">
                          {asset.defectsCount > 0 ? (
                            <span className="px-2 py-0.5 rounded-md bg-rose-500/10 text-rose-400 border border-rose-500/30 font-bold text-[10px]">
                              {asset.defectsCount} open
                            </span>
                          ) : (
                            <span className="text-slate-500 text-[11px]">None</span>
                          )}
                        </td>

                        {/* Status */}
                        <td className="px-4 py-3.5 whitespace-nowrap">
                          <span
                            className={`text-[10px] px-2 py-0.5 rounded font-medium ${
                              asset.status === 'Operational'
                                ? 'bg-slate-800 text-slate-300'
                                : asset.status === 'Restricted Load'
                                ? 'bg-amber-900/30 text-amber-300 border border-amber-800/40'
                                : asset.status === 'Under Repair'
                                ? 'bg-blue-900/30 text-blue-300 border border-blue-800/40'
                                : asset.status === 'Archived'
                                ? 'bg-slate-900 text-slate-500 line-through'
                                : 'bg-rose-900/30 text-rose-300'
                            }`}
                          >
                            {asset.status}
                          </span>
                        </td>

                        {/* Actions */}
                        <td className="px-4 py-3.5 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => {
                                setSelectedAsset(asset);
                                setIsDetailModalOpen(true);
                              }}
                              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                              title="View Asset Details"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>

                            <button
                              onClick={() => {
                                setSelectedAssetId(asset.id);
                                setActiveTab('map');
                              }}
                              className="p-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/20 transition-colors"
                              title="Locate on Interactive GIS Map"
                            >
                              <Compass className="w-3.5 h-3.5" />
                            </button>

                            {asset.status !== 'Archived' && (
                              <button
                                onClick={() => {
                                  if (window.confirm(`Archive asset ${asset.id} (${asset.name})?`)) {
                                    archiveAsset(asset.id);
                                  }
                                }}
                                className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-900/30 text-slate-400 hover:text-rose-400 transition-colors"
                                title="Archive Asset"
                              >
                                <Archive className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* CREATE ASSET MODAL */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-[1000] bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-4 my-8">
            <div className="flex items-start justify-between border-b border-slate-800 pb-3">
              <div>
                <span className="text-[10px] font-mono font-bold text-amber-400 uppercase tracking-wider">
                  New Infrastructure Registration
                </span>
                <h3 className="text-lg font-bold text-white">Add Infrastructure Asset</h3>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="text-slate-400 hover:text-white text-lg font-bold"
              >
                &times;
              </button>
            </div>

            {formError && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleCreateSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Asset ID <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. CP-RIG-BRG-015"
                    value={formData.id}
                    onChange={e => setFormData({ ...formData, id: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 uppercase font-mono focus:outline-none focus:border-amber-500"
                  />
                  <span className="text-[10px] text-slate-500">Must be unique across Central Province</span>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Asset Code / Local Ref
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. KW-09"
                    value={formData.code}
                    onChange={e => setFormData({ ...formData, code: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Asset Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Kemp Welch River Overflow Culvert No. 4"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Asset Type</label>
                  <select
                    value={formData.type}
                    onChange={e => setFormData({ ...formData, type: e.target.value as any })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-amber-500"
                  >
                    <option value="road">Road</option>
                    <option value="bridge">Bridge</option>
                    <option value="culvert">Culvert</option>
                    <option value="drainage">Drainage</option>
                    <option value="causeway">Causeway</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">District</label>
                  <select
                    value={formData.district}
                    onChange={e => {
                      const newDist = e.target.value as District;
                      setFormData({
                        ...formData,
                        district: newDist,
                        llg: llgOptions[newDist][0],
                      });
                    }}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-amber-500"
                  >
                    <option value="Rigo">Rigo District</option>
                    <option value="Abau">Abau District</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">LLG</label>
                  <select
                    value={formData.llg}
                    onChange={e => setFormData({ ...formData, llg: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-amber-500"
                  >
                    {llgOptions[formData.district].map(llg => (
                      <option key={llg} value={llg}>{llg}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Location & GPS */}
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-300 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-amber-500" />
                    Spatial Coordinates & Station Location
                  </span>
                  <button
                    type="button"
                    onClick={handleAutoGPS}
                    className="px-2.5 py-1 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 text-[11px] font-semibold"
                  >
                    Detect Current GPS
                  </button>
                </div>

                <div>
                  <label className="block text-slate-400 text-[11px] mb-1">Location / Chainage / Milestone</label>
                  <input
                    type="text"
                    placeholder="e.g. Magi Highway Km 78.4 near Kalo turnoff"
                    value={formData.locationDescription}
                    onChange={e => setFormData({ ...formData, locationDescription: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-slate-200 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-400 text-[11px] mb-1">Latitude</label>
                    <input
                      type="text"
                      required
                      value={formData.latitude}
                      onChange={e => setFormData({ ...formData, latitude: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-slate-200 font-mono focus:outline-none focus:border-amber-500"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 text-[11px] mb-1">Longitude</label>
                    <input
                      type="text"
                      required
                      value={formData.longitude}
                      onChange={e => setFormData({ ...formData, longitude: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-slate-200 font-mono focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>
              </div>

              {/* Technical Characteristics */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Surface / Structure</label>
                  <input
                    type="text"
                    value={formData.surfaceType}
                    onChange={e => setFormData({ ...formData, surfaceType: e.target.value })}
                    placeholder="Bituminous / Steel / Concrete"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Length / Span (m)</label>
                  <input
                    type="number"
                    value={formData.spanMeters}
                    onChange={e => setFormData({ ...formData, spanMeters: e.target.value })}
                    placeholder="e.g. 45"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Replacement Value (PGK)</label>
                  <input
                    type="number"
                    value={formData.replacementValueKina}
                    onChange={e => setFormData({ ...formData, replacementValueKina: e.target.value })}
                    placeholder="2500000"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              {/* Condition Score Slider */}
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-slate-300 font-semibold">
                    Baseline Condition Score: <span className="text-amber-400 font-mono">{formData.conditionScore} / 100</span>
                  </label>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      formData.conditionScore >= 70
                        ? 'bg-emerald-500/20 text-emerald-400'
                        : formData.conditionScore >= 50
                        ? 'bg-amber-500/20 text-amber-400'
                        : formData.conditionScore >= 35
                        ? 'bg-orange-500/20 text-orange-400'
                        : 'bg-rose-500/20 text-rose-400'
                    }`}
                  >
                    {getConditionClassification(formData.conditionScore)} Condition
                  </span>
                </div>
                <input
                  type="range"
                  min="5"
                  max="100"
                  value={formData.conditionScore}
                  onChange={e => setFormData({ ...formData, conditionScore: parseInt(e.target.value, 10) })}
                  className="w-full accent-amber-500 cursor-pointer"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-lg transition-colors"
                >
                  Save Asset Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* VIEW DETAIL MODAL */}
      {isDetailModalOpen && selectedAsset && (
        <div className="fixed inset-0 z-[1000] bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-3xl w-full p-6 shadow-2xl space-y-5 my-8">
            <div className="flex items-start justify-between border-b border-slate-800 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-slate-950 text-amber-400 border border-slate-800">
                    {selectedAsset.id}
                  </span>
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                      selectedAsset.conditionClassification === 'Good'
                        ? 'bg-emerald-500/20 text-emerald-400'
                        : selectedAsset.conditionClassification === 'Fair'
                        ? 'bg-amber-500/20 text-amber-400'
                        : selectedAsset.conditionClassification === 'Poor'
                        ? 'bg-orange-500/20 text-orange-400'
                        : 'bg-rose-500/20 text-rose-400'
                    }`}
                  >
                    {selectedAsset.conditionClassification} ({selectedAsset.conditionScore}/100)
                  </span>
                </div>
                <h2 className="text-xl font-bold text-white mt-1.5">{selectedAsset.name}</h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  {selectedAsset.province} &bull; {selectedAsset.district} District &bull; {selectedAsset.llg}
                </p>
              </div>
              <button
                onClick={() => setIsDetailModalOpen(false)}
                className="text-slate-400 hover:text-white text-xl font-bold"
              >
                &times;
              </button>
            </div>

            {/* Photos & Main Info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {selectedAsset.photos && selectedAsset.photos.length > 0 && (
                <div className="rounded-xl overflow-hidden border border-slate-800 relative group bg-slate-950">
                  <img
                    src={selectedAsset.photos[0]}
                    alt={selectedAsset.name}
                    className="w-full h-52 object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src =
                        'https://images.unsplash.com/photo-1545558014-8692077e9b5c?auto=format&fit=crop&w=800&q=80';
                    }}
                  />
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-950/90 to-transparent p-2.5 text-[10px] text-amber-400 font-mono flex items-center justify-between">
                    <span>Surveyed Field Photographic Evidence</span>
                    <a
                      href={selectedAsset.photos[0]}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline text-amber-300 hover:text-white font-sans font-bold"
                    >
                      Open Full Image ↗
                    </a>
                  </div>
                </div>
              )}
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2 text-xs">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Location & Spatial
                </span>
                <p className="text-slate-300">{selectedAsset.locationDescription}</p>
                <div className="pt-2 border-t border-slate-800 flex justify-between">
                  <span className="text-slate-500">Coordinates:</span>
                  <span className="font-mono text-slate-200">
                    {selectedAsset.coordinates[0]}, {selectedAsset.coordinates[1]}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Last Inspection:</span>
                  <span className="text-slate-200">{selectedAsset.lastInspectionDate}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Replacement Cost:</span>
                  <span className="font-mono text-amber-400">
                    PGK {selectedAsset.replacementValueKina.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            {/* Technical Characteristics */}
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2 text-xs">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Engineering Characteristics
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <div className="bg-slate-900 p-2 rounded-lg border border-slate-800">
                  <span className="text-slate-500 text-[10px] block">Surface / Type</span>
                  <span className="font-semibold text-slate-200">{selectedAsset.technicalSpecs.surfaceType || 'Standard'}</span>
                </div>
                <div className="bg-slate-900 p-2 rounded-lg border border-slate-800">
                  <span className="text-slate-500 text-[10px] block">Span / Length</span>
                  <span className="font-semibold text-slate-200">
                    {selectedAsset.technicalSpecs.spanMeters || selectedAsset.technicalSpecs.lengthMeters || '-'} m
                  </span>
                </div>
                <div className="bg-slate-900 p-2 rounded-lg border border-slate-800">
                  <span className="text-slate-500 text-[10px] block">Design Load</span>
                  <span className="font-semibold text-slate-200">{selectedAsset.technicalSpecs.designTonnage || '-'} Tonnes</span>
                </div>
                <div className="bg-slate-900 p-2 rounded-lg border border-slate-800">
                  <span className="text-slate-500 text-[10px] block">Year Constructed</span>
                  <span className="font-semibold text-slate-200">{selectedAsset.technicalSpecs.yearBuilt || '-'}</span>
                </div>
              </div>
            </div>

            {/* Recommended Action */}
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Recommended Maintenance Action
              </span>
              <p className="text-slate-200 font-medium">{selectedAsset.recommendedAction}</p>
            </div>

            {/* Footer Actions */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-800 text-xs">
              <button
                onClick={() => {
                  setSelectedAssetId(selectedAsset.id);
                  setIsDetailModalOpen(false);
                  setActiveTab('map');
                }}
                className="px-4 py-2 rounded-xl bg-amber-500 text-slate-950 font-bold flex items-center gap-1.5"
              >
                <Compass className="w-4 h-4" />
                <span>Show On GIS Map</span>
              </button>

              <button
                onClick={() => setIsDetailModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-300 font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
