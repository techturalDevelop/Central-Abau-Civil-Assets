import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  X,
  RefreshCw,
  Trash2,
  CheckCircle2,
  Wifi,
  WifiOff,
  Clock,
  ClipboardCheck,
  AlertTriangle,
  FileSpreadsheet,
} from 'lucide-react';

export const SyncQueueDrawer: React.FC = () => {
  const {
    isSyncDrawerOpen,
    setIsSyncDrawerOpen,
    syncQueue,
    syncQueueNow,
    clearSyncQueue,
    isOffline,
  } = useApp();

  const [isSyncing, setIsSyncing] = useState(false);
  const [syncFeedback, setSyncFeedback] = useState<string | null>(null);

  if (!isSyncDrawerOpen) return null;

  const handleSync = async () => {
    setIsSyncing(true);
    const result = await syncQueueNow();
    setIsSyncing(false);
    if (result.success) {
      setSyncFeedback(`Successfully synchronized ${result.count} records!`);
      setTimeout(() => setSyncFeedback(null), 3500);
    }
  };

  return (
    <div className="fixed inset-0 z-[1200] overflow-hidden">
      {/* Backdrop */}
      <div
        onClick={() => setIsSyncDrawerOpen(false)}
        className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm transition-opacity"
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-slate-900 border-l border-slate-800 shadow-2xl flex flex-col justify-between">
          {/* Header */}
          <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
                <RefreshCw className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Offline Field Sync Queue</h3>
                <p className="text-[11px] text-slate-400">
                  {syncQueue.length} records staged in local storage
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsSyncDrawerOpen(false)}
              className="text-slate-400 hover:text-white text-xl font-bold p-1"
            >
              &times;
            </button>
          </div>

          {/* Network Status Banner */}
          <div className="p-4 border-b border-slate-800/80 bg-slate-950/60">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                {isOffline ? (
                  <>
                    <WifiOff className="w-4 h-4 text-amber-400" />
                    <span className="font-semibold text-amber-400">Field Mode Active (Offline)</span>
                  </>
                ) : (
                  <>
                    <Wifi className="w-4 h-4 text-emerald-400" />
                    <span className="font-semibold text-emerald-400">Network Connected</span>
                  </>
                )}
              </div>
              <span className="text-[10px] text-slate-500">
                {isOffline ? 'Sync pauses until connected' : 'Ready for upload'}
              </span>
            </div>
            {syncFeedback && (
              <div className="mt-2.5 p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                <span>{syncFeedback}</span>
              </div>
            )}
          </div>

          {/* Queue Items List */}
          <div className="flex-1 overflow-y-auto p-5 space-y-3">
            {syncQueue.length === 0 ? (
              <div className="h-64 flex flex-col items-center justify-center text-center text-slate-500 text-xs">
                <CheckCircle2 className="w-10 h-10 text-emerald-500/40 mb-2" />
                <p className="font-semibold text-slate-300">All Changes Synced</p>
                <p className="text-[11px] text-slate-500 max-w-xs mt-1">
                  All field assessments and defects logged on this device have been committed to the central registry.
                </p>
              </div>
            ) : (
              syncQueue.map((item, idx) => (
                <div
                  key={item.id}
                  className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-xs space-y-2 hover:border-slate-700 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[10px] text-amber-400 uppercase font-bold px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800">
                      #{idx + 1} &bull; {item.entityType}
                    </span>
                    <span className="text-[10px] text-slate-500 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="font-bold text-slate-200">{item.summary}</p>
                  <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-800/80">
                    <span>Action: <b className="text-slate-300 uppercase">{item.action}</b></span>
                    <span>Status: <b className="text-amber-400">Pending Upload</b></span>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer Actions */}
          <div className="p-5 border-t border-slate-800 bg-slate-950 space-y-2 text-xs">
            <button
              onClick={handleSync}
              disabled={isOffline || syncQueue.length === 0 || isSyncing}
              className={`w-full py-2.5 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg transition-all ${
                isOffline || syncQueue.length === 0 || isSyncing
                  ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                  : 'bg-amber-500 hover:bg-amber-400 text-slate-950'
              }`}
            >
              <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>{isSyncing ? 'Uploading Changes...' : 'Sync All Pending Records'}</span>
            </button>

            {syncQueue.length > 0 && (
              <button
                onClick={clearSyncQueue}
                className="w-full py-2 rounded-xl bg-slate-900 hover:bg-rose-950/40 text-slate-400 hover:text-rose-400 font-semibold flex items-center justify-center gap-1.5 transition-colors border border-slate-800"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Discard Staged Queue</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
