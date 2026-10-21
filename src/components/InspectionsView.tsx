import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  Inspection,
  ConditionRating,
  MaintenancePriority,
  ElementInspection,
} from '../types';
import {
  ClipboardCheck,
  Plus,
  Search,
  Calendar,
  User,
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  CloudRain,
  Sun,
  Camera,
  MapPin,
  ExternalLink,
  Info,
  Clock,
  Sparkles,
  Layers,
} from 'lucide-react';

export const InspectionsView: React.FC = () => {
  const {
    inspections,
    assets,
    addInspection,
    setSelectedAssetId,
    setActiveTab,
    selectedAssetId,
    isOffline,
    currentUserRole,
  } = useApp();

  const [isRecordModalOpen, setIsRecordModalOpen] = useState(false);
  const [selectedAssetForInsp, setSelectedAssetForInsp] = useState<string>(
    selectedAssetId || (assets[0]?.id ?? '')
  );

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRating, setFilterRating] = useState<'All' | ConditionRating>('All');

  // Inspection Form State
  const [inspectorName, setInspectorName] = useState('Eng. Tau Kora');
  const [inspectorBadge, setInspectorBadge] = useState('CP-ENG-042');
  const [inspectionDate, setInspectionDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [weather, setWeather] = useState<
    'Sunny / Dry' | 'Heavy Rain / Monsoon' | 'Flooding High Water' | 'Overcast'
  >('Sunny / Dry');
  const [notes, setNotes] = useState('');
  const [recommendedAction, setRecommendedAction] = useState('');
  const [urgency, setUrgency] = useState<MaintenancePriority>('Medium');

  // Element Scores (0 - 100)
  const [elementScores, setElementScores] = useState<ElementInspection>({
    substructure: 70,
    superstructure: 75,
    deckSurface: 70,
    waterwayDrainage: 65,
    safetyBarriers: 80,
  });

  // Calculate overall weighted score
  const overallCalculatedScore = Math.round(
    elementScores.substructure * 0.25 +
      elementScores.superstructure * 0.25 +
      elementScores.deckSurface * 0.2 +
      elementScores.waterwayDrainage * 0.2 +
      elementScores.safetyBarriers * 0.1
  );

  const getConditionRating = (score: number): ConditionRating => {
    if (score >= 70) return 'Good';
    if (score >= 50) return 'Fair';
    if (score >= 35) return 'Poor';
    return 'Critical';
  };

  const handleCreateInspection = (e: React.FormEvent) => {
    e.preventDefault();
    const asset = assets.find(a => a.id === selectedAssetForInsp);
    if (!asset) return;

    const rating = getConditionRating(overallCalculatedScore);

    addInspection({
      assetId: asset.id,
      assetName: asset.name,
      assetType: asset.type,
      district: asset.district,
      llg: asset.llg,
      date: inspectionDate,
      inspectorName,
      inspectorBadge,
      overallScore: overallCalculatedScore,
      rating,
      elementScores,
      weather,
      notes: notes.trim() || 'Visual routine inspection conducted as per Central Province Works criteria.',
      recommendedAction:
        recommendedAction.trim() ||
        (rating === 'Critical'
          ? 'Immediate structural stabilization and emergency traffic load restriction.'
          : rating === 'Poor'
          ? 'Priority defect remediation in next quarterly works program.'
          : 'Routine scheduled maintenance.'),
      urgency,
      photos: [
        asset.photos[0] ||
          'https://images.unsplash.com/photo-1545558014-8692077e9b5c?auto=format&fit=crop&w=800&q=80',
      ],
    });

    setIsRecordModalOpen(false);
  };

  // Filtered Inspections
  const filteredInspections = inspections.filter(insp => {
    if (filterRating !== 'All' && insp.rating !== filterRating) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        insp.assetName.toLowerCase().includes(q) ||
        insp.assetId.toLowerCase().includes(q) ||
        insp.inspectorName.toLowerCase().includes(q) ||
        insp.notes.toLowerCase().includes(q)
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
            <span className="text-[11px] font-mono tracking-wider uppercase px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
              Condition Assessment
            </span>
            <span className="text-[11px] text-slate-400">Field Engineering Audits</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white mt-1 tracking-tight">
            Infrastructure Condition Inspections
          </h1>
          <p className="text-sm text-slate-400 mt-1 max-w-2xl">
            Record physical structural element assessments across Rigo and Abau. Updates asset health index and recalculates maintenance priorities.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => {
              if (selectedAssetId) setSelectedAssetForInsp(selectedAssetId);
              setIsRecordModalOpen(true);
            }}
            className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold flex items-center gap-2 shadow-lg transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Record Field Inspection</span>
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-2xl flex flex-wrap items-center justify-between gap-3 shadow-xl">
        <div className="relative flex-1 min-w-[260px]">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search inspections by asset, inspector, notes..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-amber-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={filterRating}
            onChange={e => setFilterRating(e.target.value as any)}
            className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-amber-500"
          >
            <option value="All">All Ratings</option>
            <option value="Good">Good</option>
            <option value="Fair">Fair</option>
            <option value="Poor">Poor</option>
            <option value="Critical">Critical</option>
          </select>
        </div>
      </div>

      {/* Inspections Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredInspections.map(insp => {
          return (
            <div
              key={insp.id}
              className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4 hover:border-slate-700 transition-all flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="font-mono text-[10px] text-amber-400 font-bold px-2 py-0.5 rounded bg-slate-950 border border-slate-800">
                      {insp.id}
                    </span>
                    <h3 className="font-bold text-white text-sm mt-1.5 leading-snug">
                      {insp.assetName}
                    </h3>
                    <p className="text-slate-400 text-xs flex items-center gap-1 mt-0.5">
                      <MapPin className="w-3 h-3 text-amber-500" />
                      {insp.district} District &bull; {insp.llg}
                    </p>
                  </div>
                  <div className="text-right">
                    <span
                      className={`text-xs px-2.5 py-1 rounded-full font-bold ${
                        insp.rating === 'Good'
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : insp.rating === 'Fair'
                          ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                          : insp.rating === 'Poor'
                          ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30'
                          : 'bg-rose-500/20 text-rose-400 border border-rose-500/30 animate-pulse'
                      }`}
                    >
                      {insp.rating} ({insp.overallScore}/100)
                    </span>
                    <span className="text-[10px] text-slate-500 block mt-1">
                      {insp.date}
                    </span>
                  </div>
                </div>

                {/* Element Breakdown Bars */}
                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800/80 space-y-1.5 text-[11px]">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                    Element Condition Scores
                  </span>
                  <div className="flex justify-between text-slate-400">
                    <span>Substructure / Abutment:</span>
                    <span className="font-mono text-slate-200">{insp.elementScores.substructure}%</span>
                  </div>
                  <div className="w-full bg-slate-800 h-1 rounded-full overflow-hidden">
                    <div className="bg-amber-500 h-full" style={{ width: `${insp.elementScores.substructure}%` }} />
                  </div>

                  <div className="flex justify-between text-slate-400 pt-1">
                    <span>Superstructure / Truss / Barrel:</span>
                    <span className="font-mono text-slate-200">{insp.elementScores.superstructure}%</span>
                  </div>
                  <div className="w-full bg-slate-800 h-1 rounded-full overflow-hidden">
                    <div className="bg-amber-500 h-full" style={{ width: `${insp.elementScores.superstructure}%` }} />
                  </div>

                  <div className="flex justify-between text-slate-400 pt-1">
                    <span>Deck / Running Surface:</span>
                    <span className="font-mono text-slate-200">{insp.elementScores.deckSurface}%</span>
                  </div>
                  <div className="w-full bg-slate-800 h-1 rounded-full overflow-hidden">
                    <div className="bg-amber-500 h-full" style={{ width: `${insp.elementScores.deckSurface}%` }} />
                  </div>
                </div>

                {/* Notes */}
                <p className="text-xs text-slate-300 bg-slate-950/60 p-3 rounded-xl border border-slate-800/80 leading-relaxed italic">
                  "{insp.notes}"
                </p>

                <div className="text-xs text-slate-400 space-y-1">
                  <div className="flex justify-between">
                    <span>Inspector:</span>
                    <span className="text-slate-200 font-medium">
                      {insp.inspectorName} ({insp.inspectorBadge})
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Weather:</span>
                    <span className="text-slate-200">{insp.weather}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Sync Status:</span>
                    <span className={`font-semibold ${insp.isSynced ? 'text-emerald-400' : 'text-amber-400'}`}>
                      {insp.isSynced ? 'Synced to Provincial Registry' : 'Stored in Local Offline Queue'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Card Footer */}
              <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
                <span className="font-semibold text-rose-400 text-[11px]">
                  Priority: {insp.urgency}
                </span>
                <button
                  onClick={() => {
                    setSelectedAssetId(insp.assetId);
                    setActiveTab('map');
                  }}
                  className="text-amber-400 hover:text-amber-300 font-semibold flex items-center gap-1"
                >
                  <span>View Asset on GIS</span>
                  <span>&rarr;</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* RECORD INSPECTION MODAL */}
      {isRecordModalOpen && (
        <div className="fixed inset-0 z-[1000] bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-4 my-8">
            <div className="flex items-start justify-between border-b border-slate-800 pb-3">
              <div>
                <span className="text-[10px] font-mono font-bold text-amber-400 uppercase tracking-wider">
                  Field Structural Audit Form
                </span>
                <h3 className="text-lg font-bold text-white">Record Condition Inspection</h3>
              </div>
              <button
                onClick={() => setIsRecordModalOpen(false)}
                className="text-slate-400 hover:text-white text-lg font-bold"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleCreateInspection} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Select Target Asset</label>
                <select
                  value={selectedAssetForInsp}
                  onChange={e => setSelectedAssetForInsp(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-amber-500 font-semibold"
                >
                  {assets.map(a => (
                    <option key={a.id} value={a.id}>
                      {a.id} — {a.name} ({a.district})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Inspector Name</label>
                  <input
                    type="text"
                    required
                    value={inspectorName}
                    onChange={e => setInspectorName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Badge ID</label>
                  <input
                    type="text"
                    required
                    value={inspectorBadge}
                    onChange={e => setInspectorBadge(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Inspection Date</label>
                  <input
                    type="date"
                    required
                    value={inspectionDate}
                    onChange={e => setInspectionDate(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Weather & River Condition</label>
                <select
                  value={weather}
                  onChange={e => setWeather(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-amber-500"
                >
                  <option value="Sunny / Dry">Sunny / Dry</option>
                  <option value="Overcast">Overcast</option>
                  <option value="Heavy Rain / Monsoon">Heavy Rain / Monsoon</option>
                  <option value="Flooding High Water">Flooding High Water</option>
                </select>
              </div>

              {/* Element Condition Sliders */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-200 uppercase tracking-wider text-[11px]">
                    Structural Element Scores (0 - 100)
                  </span>
                  <span className="text-amber-400 font-mono font-bold">
                    Composite Score: {overallCalculatedScore} / 100 ({getConditionRating(overallCalculatedScore)})
                  </span>
                </div>

                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-slate-300 mb-1">
                      <span>Substructure / Abutment & Pier Foundations (25%)</span>
                      <span className="font-mono text-amber-400">{elementScores.substructure}%</span>
                    </div>
                    <input
                      type="range"
                      min="10"
                      max="100"
                      value={elementScores.substructure}
                      onChange={e => setElementScores({ ...elementScores, substructure: parseInt(e.target.value, 10) })}
                      className="w-full accent-amber-500 cursor-pointer"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between text-slate-300 mb-1">
                      <span>Superstructure / Main Girders & Truss Panels (25%)</span>
                      <span className="font-mono text-amber-400">{elementScores.superstructure}%</span>
                    </div>
                    <input
                      type="range"
                      min="10"
                      max="100"
                      value={elementScores.superstructure}
                      onChange={e => setElementScores({ ...elementScores, superstructure: parseInt(e.target.value, 10) })}
                      className="w-full accent-amber-500 cursor-pointer"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between text-slate-300 mb-1">
                      <span>Deck / Pavement Running Surface (20%)</span>
                      <span className="font-mono text-amber-400">{elementScores.deckSurface}%</span>
                    </div>
                    <input
                      type="range"
                      min="10"
                      max="100"
                      value={elementScores.deckSurface}
                      onChange={e => setElementScores({ ...elementScores, deckSurface: parseInt(e.target.value, 10) })}
                      className="w-full accent-amber-500 cursor-pointer"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between text-slate-300 mb-1">
                      <span>Waterway Hydraulics & Drainage Siltation (20%)</span>
                      <span className="font-mono text-amber-400">{elementScores.waterwayDrainage}%</span>
                    </div>
                    <input
                      type="range"
                      min="10"
                      max="100"
                      value={elementScores.waterwayDrainage}
                      onChange={e => setElementScores({ ...elementScores, waterwayDrainage: parseInt(e.target.value, 10) })}
                      className="w-full accent-amber-500 cursor-pointer"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between text-slate-300 mb-1">
                      <span>Safety Barriers & Road Signage (10%)</span>
                      <span className="font-mono text-amber-400">{elementScores.safetyBarriers}%</span>
                    </div>
                    <input
                      type="range"
                      min="10"
                      max="100"
                      value={elementScores.safetyBarriers}
                      onChange={e => setElementScores({ ...elementScores, safetyBarriers: parseInt(e.target.value, 10) })}
                      className="w-full accent-amber-500 cursor-pointer"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Field Observations & Defect Notes</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Detail visible defects, scour depth, crack patterns, or traffic hazards..."
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-200 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Recommended Engineering Action</label>
                <input
                  type="text"
                  placeholder="e.g. Rip-rap scour armor placement / Deck timber plank replacement"
                  value={recommendedAction}
                  onChange={e => setRecommendedAction(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsRecordModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-lg transition-colors"
                >
                  Submit Inspection Report {isOffline && '(Offline Sync)'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
