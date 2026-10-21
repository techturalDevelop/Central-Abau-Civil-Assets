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
} from 'lucide-react';
import { ConditionRating, DefectSeverity } from '../types';

export const QuickFieldCaptureModal: React.FC = () => {
  const {
    isQuickCaptureOpen,
    setIsQuickCaptureOpen,
    assets,
    addInspection,
    addDefect,
    isOffline,
  } = useApp();

  const [captureType, setCaptureType] = useState<'inspection' | 'defect'>('inspection');
  const [selectedAssetId, setSelectedAssetId] = useState<string>(assets[0]?.id || '');
  const [currentGps, setCurrentGps] = useState<{ lat: string; lng: string }>({
    lat: '-9.8250',
    lng: '147.5850',
  });
  const [gpsStatus, setGpsStatus] = useState<'locating' | 'locked' | 'fallback'>('locating');

  // Inspection quick fields
  const [conditionScore, setConditionScore] = useState<number>(55);
  const [quickNotes, setQuickNotes] = useState('');

  // Defect quick fields
  const [defectType, setDefectType] = useState<any>('Pothole & Rutting Cluster');
  const [severity, setSeverity] = useState<DefectSeverity>('Severe');

  const [submittedMessage, setSubmittedMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!isQuickCaptureOpen) return;

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        pos => {
          setCurrentGps({
            lat: pos.coords.latitude.toFixed(6),
            lng: pos.coords.longitude.toFixed(6),
          });
          setGpsStatus('locked');
        },
        err => {
          setGpsStatus('fallback');
        },
        { enableHighAccuracy: true, timeout: 5000 }
      );
    } else {
      setGpsStatus('fallback');
    }
  }, [isQuickCaptureOpen]);

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

      setSubmittedMessage(`Field inspection saved locally! Staged for sync.`);
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

      setSubmittedMessage(`Defect report saved! Staged for sync.`);
    }

    setTimeout(() => {
      setSubmittedMessage(null);
      setIsQuickCaptureOpen(false);
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-[1100] bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
        <div className="flex items-start justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Mobile Field Capture</h3>
              <p className="text-[11px] text-slate-400">GPS-enabled rapid patrol reconnaissance</p>
            </div>
          </div>
          <button
            onClick={() => setIsQuickCaptureOpen(false)}
            className="text-slate-400 hover:text-white text-xl font-bold"
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
              {isOffline ? 'Record stored in local offline queue.' : 'Record sent to Central Province registry.'}
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            {/* GPS Status Box */}
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-slate-300 font-mono text-[11px]">
                  {currentGps.lat}°, {currentGps.lng}°
                </span>
              </div>
              <span className="text-[10px] text-amber-400 font-semibold uppercase">
                {gpsStatus === 'locked' ? 'GPS Locked' : 'Central GPS'}
              </span>
            </div>

            {/* Mode Toggle: Inspection vs Defect */}
            <div className="grid grid-cols-2 gap-2 bg-slate-950 p-1 rounded-xl border border-slate-800 font-semibold">
              <button
                type="button"
                onClick={() => setCaptureType('inspection')}
                className={`py-2 rounded-lg transition-all ${
                  captureType === 'inspection'
                    ? 'bg-amber-500 text-slate-950'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Log Inspection
              </button>
              <button
                type="button"
                onClick={() => setCaptureType('defect')}
                className={`py-2 rounded-lg transition-all ${
                  captureType === 'defect'
                    ? 'bg-rose-600 text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Report Defect
              </button>
            </div>

            {/* Target Asset Selector */}
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Target Asset Location</label>
              <select
                value={selectedAssetId}
                onChange={e => setSelectedAssetId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-amber-500 font-semibold"
              >
                {assets.map(a => (
                  <option key={a.id} value={a.id}>
                    {a.id} — {a.name} ({a.district})
                  </option>
                ))}
              </select>
            </div>

            {/* Capture Type Details */}
            {captureType === 'inspection' ? (
              <div className="space-y-3 bg-slate-950 p-3.5 rounded-xl border border-slate-800">
                <div className="flex items-center justify-between">
                  <span className="text-slate-300 font-semibold">Condition Score:</span>
                  <span className="text-amber-400 font-mono font-bold">{conditionScore} / 100</span>
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
                  <label className="block text-slate-300 font-semibold mb-1">Severity</label>
                  <select
                    value={severity}
                    onChange={e => setSeverity(e.target.value as any)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-amber-500 font-bold"
                  >
                    <option value="Critical">Critical (Imminent Washout / Bridge Closed)</option>
                    <option value="Severe">Severe (Major Hazard to PMVs)</option>
                    <option value="Moderate">Moderate (Progressive Damage)</option>
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
                placeholder="Observed damage, impassable depth, or timber plank breakage..."
                value={quickNotes}
                onChange={e => setQuickNotes(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-200 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setIsQuickCaptureOpen(false)}
                className="px-3.5 py-2 rounded-xl bg-slate-800 text-slate-300 font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold shadow-lg"
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
