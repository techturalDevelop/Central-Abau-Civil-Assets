import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  Defect,
  DefectSeverity,
  DefectStatus,
} from '../types';
import {
  AlertTriangle,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  Wrench,
  MapPin,
  Camera,
  ExternalLink,
  ShieldAlert,
  UserCheck,
} from 'lucide-react';

export const DefectsView: React.FC = () => {
  const {
    defects,
    assets,
    addDefect,
    updateDefectStatus,
    setSelectedAssetId,
    setActiveTab,
    selectedAssetId,
    isOffline,
    currentUserRole,
    notifyToast,
  } = useApp();

  const [isLogModalOpen, setIsLogModalOpen] = useState(false);
  const [activeStatusTab, setActiveStatusTab] = useState<'All' | DefectStatus>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [severityFilter, setSeverityFilter] = useState<'All' | DefectSeverity>('All');

  // Verify modal state
  const [verifyingDefect, setVerifyingDefect] = useState<Defect | null>(null);
  const [verificationNotes, setVerificationNotes] = useState('');

  // Form State
  const [targetAssetId, setTargetAssetId] = useState<string>(
    selectedAssetId || (assets[0]?.id ?? '')
  );
  const [defectType, setDefectType] = useState<Defect['defectType']>(
    'Pothole & Rutting Cluster'
  );
  const [severity, setSeverity] = useState<DefectSeverity>('Severe');
  const [locationDescription, setLocationDescription] = useState('');
  const [description, setDescription] = useState('');
  const [recommendedAction, setRecommendedAction] = useState('');
  const [estimatedCostKina, setEstimatedCostKina] = useState('35000');
  const [assignedTeam, setAssignedTeam] = useState('Central Provincial Works Unit');

  const handleCreateDefect = (e: React.FormEvent) => {
    e.preventDefault();
    const asset = assets.find(a => a.id === targetAssetId);
    if (!asset) return;

    const newDef = addDefect({
      assetId: asset.id,
      assetName: asset.name,
      assetType: asset.type,
      district: asset.district,
      llg: asset.llg,
      defectType,
      severity,
      status: 'Open',
      chainageOrLocation: locationDescription.trim() || asset.locationDescription,
      coordinates: asset.coordinates,
      description: description.trim() || 'Defect noted during routine visual reconnaissance.',
      reportedDate: new Date().toISOString().split('T')[0],
      targetCompletionDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      recommendedAction: recommendedAction.trim() || 'Remediate as per Department of Works guidelines.',
      estimatedCostKina: parseFloat(estimatedCostKina) || 25000,
      assignedTeam,
      photos: [
        asset.photos[0] ||
          'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&w=800&q=80',
      ],
    });

    notifyToast(
      'warning',
      'Defect Incident Logged',
      `${defectType} reported for ${asset.name}. Staged in register.`
    );

    setIsLogModalOpen(false);
  };

  const handleVerifySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!verifyingDefect) return;

    updateDefectStatus(verifyingDefect.id, 'Verified', verificationNotes);
    notifyToast(
      'success',
      'Defect Verified & Certified',
      `Defect ${verifyingDefect.id} signed off by ${currentUserRole}.`
    );
    setVerifyingDefect(null);
    setVerificationNotes('');
  };

  const filteredDefects = defects.filter(d => {
    if (activeStatusTab !== 'All' && d.status !== activeStatusTab) return false;
    if (severityFilter !== 'All' && d.severity !== severityFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        d.assetName.toLowerCase().includes(q) ||
        d.defectType.toLowerCase().includes(q) ||
        d.description.toLowerCase().includes(q) ||
        d.chainageOrLocation.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const statusCounts = {
    All: defects.length,
    Open: defects.filter(d => d.status === 'Open').length,
    Assigned: defects.filter(d => d.status === 'Assigned').length,
    'In Progress': defects.filter(d => d.status === 'In Progress').length,
    Resolved: defects.filter(d => d.status === 'Resolved').length,
    Verified: defects.filter(d => d.status === 'Verified').length,
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono tracking-wider uppercase px-2 py-0.5 rounded bg-rose-500/10 text-rose-400 border border-rose-500/20">
              Defect Management Lifecycle
            </span>
            <span className="text-[11px] text-slate-400">Rigo & Abau Network</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white mt-1 tracking-tight">
            Infrastructure Defect Registry
          </h1>
          <p className="text-sm text-slate-400 mt-1 max-w-2xl">
            Track and verify road washouts, bridge abutment scour, timber rot, culvert siltation, and guardrail damage.
          </p>
        </div>

        <button
          onClick={() => {
            if (selectedAssetId) setTargetAssetId(selectedAssetId);
            setIsLogModalOpen(true);
          }}
          className="px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold flex items-center gap-2 shadow-lg transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Report New Defect</span>
        </button>
      </div>

      {/* Status Workflow Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-800 pb-3">
        {(['All', 'Open', 'Assigned', 'In Progress', 'Resolved', 'Verified'] as const).map(
          status => (
            <button
              key={status}
              onClick={() => setActiveStatusTab(status)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all ${
                activeStatusTab === status
                  ? 'bg-amber-500 text-slate-950 shadow-md'
                  : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              <span>{status}</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                  activeStatusTab === status ? 'bg-slate-950 text-amber-400' : 'bg-slate-800 text-slate-400'
                }`}
              >
                {statusCounts[status]}
              </span>
            </button>
          )
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-2xl flex flex-wrap items-center justify-between gap-3 shadow-xl">
        <div className="relative flex-1 min-w-[260px]">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search defects by asset, defect type, description..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-amber-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={severityFilter}
            onChange={e => setSeverityFilter(e.target.value as any)}
            className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-amber-500 font-medium"
          >
            <option value="All">All Severities</option>
            <option value="Critical">Critical</option>
            <option value="Severe">Severe</option>
            <option value="Moderate">Moderate</option>
            <option value="Minor">Minor</option>
          </select>
        </div>
      </div>

      {/* Defects List */}
      <div className="space-y-3">
        {filteredDefects.length === 0 ? (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center text-slate-500 text-xs">
            No defects found in this view.
          </div>
        ) : (
          filteredDefects.map(defect => {
            return (
              <div
                key={defect.id}
                className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl hover:border-slate-700 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs"
              >
                <div className="space-y-2 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-[10px] font-bold text-amber-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                      {defect.id}
                    </span>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                        defect.severity === 'Critical'
                          ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                          : defect.severity === 'Severe'
                          ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30'
                          : defect.severity === 'Moderate'
                          ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                          : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                      }`}
                    >
                      {defect.severity} Severity
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-semibold">
                      Status: {defect.status}
                    </span>
                    <span className="text-slate-400 text-[11px]">&bull; {defect.district} District</span>
                  </div>

                  <h3 className="font-bold text-white text-sm">
                    {defect.defectType} — {defect.assetName}
                  </h3>

                  <p className="text-slate-300 leading-relaxed max-w-3xl">
                    {defect.description}
                  </p>

                  <div className="flex flex-wrap items-center gap-4 text-[11px] text-slate-400 pt-1">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-amber-500" />
                      {defect.chainageOrLocation}
                    </span>
                    <span>Reported: <b>{defect.reportedDate}</b></span>
                    <span>Target: <b>{defect.targetCompletionDate}</b></span>
                    <span>
                      Est. Cost: <b className="text-amber-400 font-mono">PGK {defect.estimatedCostKina.toLocaleString()}</b>
                    </span>
                    {defect.assignedTeam && (
                      <span>Assigned: <b>{defect.assignedTeam}</b></span>
                    )}
                  </div>

                  {defect.verificationNotes && (
                    <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-[11px]">
                      <b>Verified by {defect.verifiedBy}:</b> {defect.verificationNotes}
                    </div>
                  )}
                </div>

                {/* Defect Action Buttons */}
                <div className="flex flex-wrap md:flex-col items-end gap-2 shrink-0">
                  {/* Status Transition buttons */}
                  {defect.status === 'Open' && (
                    <button
                      onClick={() => updateDefectStatus(defect.id, 'Assigned')}
                      className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold"
                    >
                      Assign to Crew
                    </button>
                  )}
                  {defect.status === 'Assigned' && (
                    <button
                      onClick={() => updateDefectStatus(defect.id, 'In Progress')}
                      className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold"
                    >
                      Start Repair Work
                    </button>
                  )}
                  {defect.status === 'In Progress' && (
                    <button
                      onClick={() => updateDefectStatus(defect.id, 'Resolved')}
                      className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold"
                    >
                      Mark Resolved
                    </button>
                  )}
                  {defect.status === 'Resolved' && (
                    <button
                      onClick={() => setVerifyingDefect(defect)}
                      className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold flex items-center gap-1"
                    >
                      <UserCheck className="w-3.5 h-3.5" />
                      <span>Engineer Sign-off</span>
                    </button>
                  )}

                  <button
                    onClick={() => {
                      setSelectedAssetId(defect.assetId);
                      setActiveTab('map');
                    }}
                    className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-400 text-xs font-semibold flex items-center gap-1"
                  >
                    <span>View on GIS</span>
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* REPORT DEFECT MODAL */}
      {isLogModalOpen && (
        <div className="fixed inset-0 z-[1000] bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-4 my-8">
            <div className="flex items-start justify-between border-b border-slate-800 pb-3">
              <div>
                <span className="text-[10px] font-mono font-bold text-rose-400 uppercase tracking-wider">
                  Field Incident & Damage Report
                </span>
                <h3 className="text-lg font-bold text-white">Log Infrastructure Defect</h3>
              </div>
              <button
                onClick={() => setIsLogModalOpen(false)}
                className="text-slate-400 hover:text-white text-lg font-bold"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleCreateDefect} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Target Asset</label>
                <select
                  value={targetAssetId}
                  onChange={e => setTargetAssetId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 font-semibold focus:outline-none focus:border-amber-500"
                >
                  {assets.map(a => (
                    <option key={a.id} value={a.id}>
                      {a.id} — {a.name} ({a.district})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Defect Classification</label>
                  <select
                    value={defectType}
                    onChange={e => setDefectType(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-amber-500"
                  >
                    <option value="Pothole & Rutting Cluster">Pothole & Rutting Cluster</option>
                    <option value="Bridge Abutment Scour">Bridge Abutment Scour</option>
                    <option value="Structural Concrete Spalling">Structural Concrete Spalling</option>
                    <option value="Timber Deck Rot">Timber Deck Rot</option>
                    <option value="Culvert Siltation & Blockage">Culvert Siltation & Blockage</option>
                    <option value="Guardrail Impact Damage">Guardrail Impact Damage</option>
                    <option value="Embankment Landslip">Embankment Landslip</option>
                    <option value="Roadside Drainage Overtopping">Roadside Drainage Overtopping</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Severity Rating</label>
                  <select
                    value={severity}
                    onChange={e => setSeverity(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-amber-500"
                  >
                    <option value="Critical">Critical (Structural Imminent Failure)</option>
                    <option value="Severe">Severe (Major Hazard / Impeded Flow)</option>
                    <option value="Moderate">Moderate (Progressive Degradation)</option>
                    <option value="Minor">Minor (Cosmetic / Early Wear)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Exact Location / Chainage</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Km 74.2 near Saroa Junction, south abutment"
                  value={locationDescription}
                  onChange={e => setLocationDescription(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Defect Description & Physical Symptoms</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Detail visible scour depth, missing timber planks, cracked concrete, or silt accumulation..."
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-200 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Estimated Remediation Cost (PGK)</label>
                  <input
                    type="number"
                    value={estimatedCostKina}
                    onChange={e => setEstimatedCostKina(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Assigned Maintenance Works Team</label>
                  <input
                    type="text"
                    value={assignedTeam}
                    onChange={e => setAssignedTeam(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsLogModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-lg transition-colors"
                >
                  Submit Defect Report {isOffline && '(Offline Queue)'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* VERIFY DEFECT MODAL */}
      {verifyingDefect && (
        <div className="fixed inset-0 z-[1000] bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-start justify-between border-b border-slate-800 pb-3">
              <div>
                <span className="text-[10px] font-mono font-bold text-amber-400 uppercase tracking-wider">
                  Quality Assurance Sign-Off
                </span>
                <h3 className="text-lg font-bold text-white">Verify Defect Remediation</h3>
              </div>
              <button
                onClick={() => setVerifyingDefect(null)}
                className="text-slate-400 hover:text-white text-lg font-bold"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleVerifySubmit} className="space-y-4 text-xs">
              <p className="text-slate-300">
                You are verifying the remediation of defect <b>{verifyingDefect.id}</b> ({verifyingDefect.defectType}) on <b>{verifyingDefect.assetName}</b>.
              </p>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Engineering Verification Notes & Quality Sign-Off
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="Record on-site post-repair compaction, structural alignment, or hydraulic clearance..."
                  value={verificationNotes}
                  onChange={e => setVerificationNotes(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-200 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setVerifyingDefect(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold"
                >
                  Certify & Mark Verified
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
