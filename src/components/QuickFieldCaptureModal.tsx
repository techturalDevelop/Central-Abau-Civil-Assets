import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import {
  MapPin,
  Camera,
  AlertTriangle,
  ClipboardCheck,
  CheckCircle2,
  X,
  Compass,
  WifiOff,
  Navigation,
  RefreshCw,
  Edit2,
} from 'lucide-react';
import { ConditionRating, DefectSeverity } from '../types';
import { ABAU_VILLAGES } from '../data/abauVillages';

export const QuickFieldCaptureModal: React.FC = () => {
  const {
    isQuickCaptureOpen,
    setIsQuickCaptureOpen,
    assets,
    addInspection,
    addDefect,
    isOffline,
    notifyToast,
  } = useApp();

  const [captureType, setCaptureType] = useState<'inspection' | 'defect'>('inspection');
  const [selectedAssetId, setSelectedAssetId] = useState<string>(assets[0]?.id || '');

  // GPS & Location States
  const [currentGps, setCurrentGps] = useState<{ lat: string; lng: string }>({
    lat: '-10.1580',
    lng: '148.6420',
  });
  const [gpsStatus, setGpsStatus] = useState<'locating' | 'locked' | 'fallback' | 'manual'>('locating');
  const [isManualGpsMode, setIsManualGpsMode] = useState(false);
  const [selectedWaypointId, setSelectedWaypointId] = useState<string>('');

  // Inspection quick fields
  const [conditionScore, setConditionScore] = useState<number>(55);
  const [quickNotes, setQuickNotes] = useState('');

  // Defect quick fields
  const [defectType, setDefectType] = useState<any>('Pothole & Rutting Cluster');
  const [severity, setSeverity] = useState<DefectSeverity>('Severe');

  const [submittedMessage, setSubmittedMessage] = useState<string | null>(null);

  // Attempt GPS acquisition when opened
  useEffect(() => {
    if (!isQuickCaptureOpen) return;

    acquireGps();
  }, [isQuickCaptureOpen]);

  const acquireGps = () => {
    setGpsStatus('locating');
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        pos => {
          setCurrentGps({
            lat: pos.coords.latitude.toFixed(6),
            lng: pos.coords.longitude.toFixed(6),
          });
          setGpsStatus('locked');
          setIsManualGpsMode(false);
        },
        _err => {
          // If geolocation fails or is denied (e.g. in remote bush/offline), use target asset coordinates
          const defaultAsset = assets.find(a => a.id === selectedAssetId) || assets[0];
          if (defaultAsset && defaultAsset.coordinates) {
            setCurrentGps({
              lat: defaultAsset.coordinates[0].toFixed(6),
              lng: defaultAsset.coordinates[1].toFixed(6),
            });
          }
          setGpsStatus('fallback');
        },
        { enableHighAccuracy: true, timeout: 6000 }
      );
    } else {
      setGpsStatus('fallback');
    }
  };

  // Handler for snapping to known Abau village / locality
  const handleWaypointSelect = (villageIdStr: string) => {
    setSelectedWaypointId(villageIdStr);
    if (!villageIdStr) return;
    const village = ABAU_VILLAGES.find(v => v.id.toString() === villageIdStr);
    if (village) {
      setCurrentGps({
        lat: village.lat.toFixed(6),
        lng: village.lng.toFixed(6),
      });
      setGpsStatus('manual');
      notifyToast(
        'info',
        'Coordinates Snapped',
        `Position snapped to ${village.name} (${village.llg}).`
      );
    }
  };

  if (!isQuickCaptureOpen) return null;

  const targetAsset = assets.find(a => a.id === selectedAssetId) || assets[0];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetAsset) return;

    if (captureType === 'inspection') {
      const rating: ConditionRating =
        conditionScore >= 70
          ? 'Good'
          : conditionScore >= 50
          ? 'Fair'
          : conditionScore >= 35
          ? 'Poor'
          : 'Critical';

      addInspection({
        assetId: targetAsset.id,
        assetName: targetAsset.name,
        assetType: targetAsset.type,
        district: targetAsset.district,
        llg: targetAsset.llg,
        date: new Date().toISOString().split('T')[0],
        inspectorName: 'Field Mobile Inspector',
        inspectorBadge: 'CP-FIELD-MOB',
        overallScore: conditionScore,
        rating,
        elementScores: {
          substructure: conditionScore,
          superstructure: conditionScore,
          deckSurface: conditionScore,
          waterwayDrainage: conditionScore,
          safetyBarriers: conditionScore,
        },
        weather: 'Sunny / Dry',
        notes: quickNotes.trim() || 'Rapid GPS mobile reconnaissance entry.',
        recommendedAction: 'Verify during routine maintenance program.',
        urgency: rating === 'Critical' ? 'Critical' : rating === 'Poor' ? 'High' : 'Medium',
        photos: targetAsset.photos || [],
      });

      const msg = `Inspection for ${targetAsset.id} recorded (${isOffline ? 'Offline Queue' : 'Central Registry'}).`;
      setSubmittedMessage(msg);
      notifyToast('success', 'Inspection Saved', msg);
    } else {
      addDefect({
        assetId: targetAsset.id,
        assetName: targetAsset.name,
        assetType: targetAsset.type,
        district: targetAsset.district,
        llg: targetAsset.llg,
        defectType,
        severity,
        status: 'Open',
        chainageOrLocation: `GPS: ${currentGps.lat}, ${currentGps.lng} near ${targetAsset.name}`,
        coordinates: [parseFloat(currentGps.lat), parseFloat(currentGps.lng)],
        description: quickNotes.trim() || `Field reported ${defectType} from mobile patrol.`,
        reportedDate: new Date().toISOString().split('T')[0],
        targetCompletionDate: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        recommendedAction: 'Immediate site clearing / patching.',
        estimatedCostKina: severity === 'Critical' ? 120000 : 35000,
        photos: targetAsset.photos || [],
      });

      const msg = `Defect ${defectType} logged on ${targetAsset.id}.`;
      setSubmittedMessage(msg);
      notifyToast('warning', 'Defect Logged', msg);
    }

    setTimeout(() => {
      setSubmittedMessage(null);
      setIsQuickCaptureOpen(false);
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-[1100] bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-start justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Mobile Field Capture</h3>
              <p className="text-[11px] text-slate-400">GPS & offline-ready corridor reconnaissance</p>
            </div>
          </div>
          <button
            onClick={() => setIsQuickCaptureOpen(false)}
            className="text-slate-400 hover:text-white text-xl font-bold p-1 cursor-pointer"
            aria-label="Close modal"
          >
            &times;
          </button>
        </div>

        {submittedMessage ? (
          <div className="p-8 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-bold text-white">{submittedMessage}</h4>
            <p className="text-xs text-slate-400">
              {isOffline ? 'Record stored in local offline queue.' : 'Record synchronized with Central Province registry.'}
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            {/* GPS & Spatial Status Section */}
            <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span
                    className={`w-2.5 h-2.5 rounded-full ${
                      gpsStatus === 'locked'
                        ? 'bg-emerald-500 animate-pulse'
                        : gpsStatus === 'locating'
                        ? 'bg-amber-400 animate-ping'
                        : 'bg-blue-400'
                    }`}
                  />
                  <span className="text-slate-200 font-mono text-[11px] font-bold">
                    {currentGps.lat}°, {currentGps.lng}°
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  <span
                    className={`text-[9.5px] px-2 py-0.5 rounded font-mono font-bold uppercase ${
                      gpsStatus === 'locked'
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : gpsStatus === 'locating'
                        ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                        : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                    }`}
                  >
                    {gpsStatus === 'locked'
                      ? 'GPS Locked'
                      : gpsStatus === 'locating'
                      ? 'Locating...'
                      : gpsStatus === 'manual'
                      ? 'Snapped Coords'
                      : 'Fallback Coords'}
                  </span>

                  <button
                    type="button"
                    onClick={acquireGps}
                    className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
                    title="Retry GPS acquisition"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Waypoint Snap & Manual Fallback Bar */}
              <div className="pt-2 border-t border-slate-800/80 flex flex-col sm:flex-row gap-2">
                <div className="flex-1">
                  <label className="text-[10px] text-slate-400 block mb-0.5">
                    Snap Coordinates to Known Locality:
                  </label>
                  <select
                    value={selectedWaypointId}
                    onChange={e => handleWaypointSelect(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2 py-1 text-slate-200 text-xs focus:outline-none focus:border-amber-500"
                  >
                    <option value="">-- Choose Abau Village / Locality --</option>
                    {ABAU_VILLAGES.slice(0, 35).map(v => (
                      <option key={v.id} value={v.id.toString()}>
                        {v.name} ({v.llg})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="sm:w-auto flex items-end">
                  <button
                    type="button"
                    onClick={() => setIsManualGpsMode(prev => !prev)}
                    className="w-full px-2.5 py-1 text-[11px] rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <Edit2 className="w-3 h-3 text-amber-400" />
                    <span>{isManualGpsMode ? 'Hide Manual' : 'Manual Coords'}</span>
                  </button>
                </div>
              </div>

              {/* Manual Input Fields when toggled */}
              {isManualGpsMode && (
                <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-800/60">
                  <div>
                    <label className="text-[10px] text-slate-400 block mb-0.5">Latitude (WGS84)</label>
                    <input
                      type="text"
                      value={currentGps.lat}
                      onChange={e => {
                        setCurrentGps(prev => ({ ...prev, lat: e.target.value }));
                        setGpsStatus('manual');
                      }}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-slate-200 font-mono text-xs focus:outline-none focus:border-amber-500"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400 block mb-0.5">Longitude (WGS84)</label>
                    <input
                      type="text"
                      value={currentGps.lng}
                      onChange={e => {
                        setCurrentGps(prev => ({ ...prev, lng: e.target.value }));
                        setGpsStatus('manual');
                      }}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-slate-200 font-mono text-xs focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Mode Toggle: Inspection vs Defect */}
            <div className="grid grid-cols-2 gap-2 bg-slate-950 p-1 rounded-xl border border-slate-800 font-semibold">
              <button
                type="button"
                onClick={() => setCaptureType('inspection')}
                className={`py-2 rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  captureType === 'inspection'
                    ? 'bg-amber-500 text-slate-950 font-bold shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <ClipboardCheck className="w-4 h-4" />
                <span>Log Inspection</span>
              </button>
              <button
                type="button"
                onClick={() => setCaptureType('defect')}
                className={`py-2 rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  captureType === 'defect'
                    ? 'bg-rose-600 text-white font-bold shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <AlertTriangle className="w-4 h-4" />
                <span>Report Defect</span>
              </button>
            </div>

            {/* Target Asset Selector */}
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Target Asset Location</label>
              <select
                value={selectedAssetId}
                onChange={e => {
                  setSelectedAssetId(e.target.value);
                  const chosen = assets.find(a => a.id === e.target.value);
                  if (chosen && chosen.coordinates && gpsStatus !== 'locked') {
                    setCurrentGps({
                      lat: chosen.coordinates[0].toFixed(6),
                      lng: chosen.coordinates[1].toFixed(6),
                    });
                  }
                }}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-amber-500 font-semibold"
              >
                {assets.map(a => (
                  <option key={a.id} value={a.id}>
                    {a.id} — {a.name} ({a.llg || a.district})
                  </option>
                ))}
              </select>
            </div>

            {/* Capture Type Details */}
            {captureType === 'inspection' ? (
              <div className="space-y-3 bg-slate-950 p-3.5 rounded-xl border border-slate-800">
                <div className="flex items-center justify-between">
                  <span className="text-slate-300 font-semibold">Condition Score:</span>
                  <span
                    className={`font-mono font-bold px-2 py-0.5 rounded text-xs ${
                      conditionScore >= 70
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : conditionScore >= 50
                        ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                        : conditionScore >= 35
                        ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30'
                        : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                    }`}
                  >
                    {conditionScore} / 100 &bull;{' '}
                    {conditionScore >= 70
                      ? 'Good'
                      : conditionScore >= 50
                      ? 'Fair'
                      : conditionScore >= 35
                      ? 'Poor'
                      : 'Critical'}
                  </span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="100"
                  value={conditionScore}
                  onChange={e => setConditionScore(parseInt(e.target.value, 10))}
                  className="w-full accent-amber-500 cursor-pointer"
                />
              </div>
            ) : (
              <div className="space-y-3 bg-slate-950 p-3.5 rounded-xl border border-slate-800">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Defect Type</label>
                  <select
                    value={defectType}
                    onChange={e => setDefectType(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-amber-500"
                  >
                    <option value="Pothole & Rutting Cluster">Potholes / Pavement Failure</option>
                    <option value="Bridge Abutment Scour">Bridge Foundation Scour</option>
                    <option value="Culvert Siltation & Blockage">Blocked / Silted Culvert</option>
                    <option value="Embankment Landslip">Embankment Landslip</option>
                    <option value="Timber Deck Rot">Timber Deck Rot</option>
                    <option value="Guardrail Impact Damage">Guardrail Damage</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Severity Rating</label>
                  <select
                    value={severity}
                    onChange={e => setSeverity(e.target.value as any)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-amber-500 font-bold"
                  >
                    <option value="Critical">Critical (Imminent Washout / Road Severed)</option>
                    <option value="Severe">Severe (Major Hazard to PMVs & Logistics)</option>
                    <option value="Moderate">Moderate (Progressive Deterioration)</option>
                    <option value="Minor">Minor (Routine Defect)</option>
                  </select>
                </div>
              </div>
            )}

            <div>
              <label className="block text-slate-300 font-semibold mb-1">Field Observation Note</label>
              <textarea
                rows={2}
                required
                placeholder="Observed damage, impassable depth, timber plank breakage..."
                value={quickNotes}
                onChange={e => setQuickNotes(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-200 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setIsQuickCaptureOpen(false)}
                className="px-3.5 py-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold shadow-lg cursor-pointer"
              >
                Save {isOffline ? 'Offline' : 'to Registry'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
