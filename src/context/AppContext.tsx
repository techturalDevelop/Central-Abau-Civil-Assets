import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  Asset,
  AssetType,
  ConditionRating,
  Defect,
  DefectStatus,
  District,
  Inspection,
  MaintenancePriority,
  PriorityModelWeights,
  SyncQueueItem,
  UserRole,
  CoreModule,
  ElNinoLlgStatus,
  WaterPoint,
  WaterPointStatus,
  ReliefAidShipment,
  AidShipmentStatus,
  HealthEmergencyIncident,
  FieldReliefRequest,
  ElNinoBudgetSummary,
  ToastNotification,
  ToastType,
} from '../types';
import {
  DEFAULT_WEIGHTS,
  INITIAL_ASSETS,
  INITIAL_DEFECTS,
  INITIAL_INSPECTIONS,
} from '../data/initialData';
import {
  ABAU_EL_NINO_LLG_STATUSES,
  INITIAL_WATER_POINTS,
  INITIAL_RELIEF_SHIPMENTS,
  INITIAL_HEALTH_INCIDENTS,
  INITIAL_FIELD_RELIEF_REQUESTS,
  INITIAL_EL_NINO_BUDGET,
} from '../data/elNinoData';
import { calculatePriorityScore, deriveFactorsForAsset } from '../utils/priorityScoring';

interface AppContextType {
  // Core Platform Modules (Digital Infrastructure vs El Niño Relief Program)
  coreModule: CoreModule;
  setCoreModule: (module: CoreModule) => void;
  isModuleSelectModalOpen: boolean;
  setIsModuleSelectModalOpen: (open: boolean) => void;

  // Navigation & UI
  activeTab: 'dashboard' | 'map' | 'register' | 'inspections' | 'defects' | 'maintenance' | 'reports' | 'settings';
  setActiveTab: (tab: 'dashboard' | 'map' | 'register' | 'inspections' | 'defects' | 'maintenance' | 'reports' | 'settings') => void;
  selectedAssetId: string | null;
  setSelectedAssetId: (id: string | null) => void;
  viewingAsset: Asset | null;
  
  // Filter States
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  districtFilter: 'All' | District;
  setDistrictFilter: (d: 'All' | District) => void;
  showFrozenRigo: boolean;
  setShowFrozenRigo: (show: boolean) => void;
  llgFilter: string;
  setLlgFilter: (llg: string) => void;
  assetTypeFilter: 'All' | AssetType;
  setAssetTypeFilter: (t: 'All' | AssetType) => void;
  conditionFilter: 'All' | ConditionRating;
  setConditionFilter: (c: 'All' | ConditionRating) => void;
  priorityFilter: 'All' | MaintenancePriority;
  setPriorityFilter: (p: 'All' | MaintenancePriority) => void;

  // Data
  assets: Asset[];
  defects: Defect[];
  inspections: Inspection[];
  syncQueue: SyncQueueItem[];
  filteredAssets: Asset[];
  
  // Priority Model & Role
  priorityWeights: PriorityModelWeights;
  updateWeights: (weights: PriorityModelWeights) => void;
  currentUserRole: UserRole;
  setCurrentUserRole: (role: UserRole) => void;

  // Offline & Sync
  isOffline: boolean;
  toggleOfflineSimulation: (simulateOffline?: boolean) => void;
  isSimulatedOffline: boolean;
  syncQueueNow: () => Promise<{ success: boolean; count: number }>;
  clearSyncQueue: () => void;

  // Actions
  addAsset: (asset: Asset) => { success: boolean; error?: string };
  updateAsset: (asset: Asset) => { success: boolean; error?: string };
  archiveAsset: (assetId: string) => void;
  addInspection: (inspection: Omit<Inspection, 'id' | 'isSynced' | 'syncedAt'>) => Inspection;
  addDefect: (defect: Omit<Defect, 'id' | 'isSynced' | 'syncedAt'>) => Defect;
  updateDefectStatus: (defectId: string, status: DefectStatus, verifierNotes?: string) => void;
  overridePriority: (
    assetId: string,
    overriddenPriority: MaintenancePriority,
    overrideReason: string
  ) => void;
  resetDemoData: () => void;
  exportDataAsJson: () => void;
  isQuickCaptureOpen: boolean;
  setIsQuickCaptureOpen: (open: boolean) => void;
  isSyncDrawerOpen: boolean;
  setIsSyncDrawerOpen: (open: boolean) => void;
  isPdfStudioOpen: boolean;
  setIsPdfStudioOpen: (open: boolean) => void;

  // Toast Notifications
  toasts: ToastNotification[];
  notifyToast: (type: ToastType, title: string, message?: string) => void;
  removeToast: (id: string) => void;

  // El Niño Relief Program State & Handlers (Abau District)
  elNinoLlgStatuses: Record<string, ElNinoLlgStatus>;
  waterPoints: WaterPoint[];
  updateWaterPointStatus: (id: string, status: WaterPointStatus, rehabilitationRequired?: string) => void;
  reliefShipments: ReliefAidShipment[];
  updateShipmentStatus: (id: string, status: AidShipmentStatus) => void;
  healthIncidents: HealthEmergencyIncident[];
  fieldRequests: FieldReliefRequest[];
  addFieldRequest: (req: Omit<FieldReliefRequest, 'id' | 'timestamp' | 'status' | 'isSynced'>) => FieldReliefRequest;
  updateFieldRequestStatus: (id: string, status: 'Pending DDA Review' | 'Relief Dispatched' | 'Completed') => void;
  elNinoBudget: ElNinoBudgetSummary;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const STORAGE_KEYS = {
  ASSETS: 'cp_assets_v4_abau',
  DEFECTS: 'cp_defects_v4_abau',
  INSPECTIONS: 'cp_inspections_v4_abau',
  SYNC_QUEUE: 'cp_sync_queue_v4',
  WEIGHTS: 'cp_weights_v4',
  ROLE: 'cp_user_role_v4',
  CORE_MODULE: 'cp_core_module_v1',
  WATER_POINTS: 'cp_water_points_v1',
  RELIEF_SHIPMENTS: 'cp_relief_shipments_v1',
  FIELD_REQUESTS: 'cp_field_requests_v1',
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Core Platform Module: 'infrastructure' or 'el_nino'
  const [coreModule, setCoreModuleState] = useState<CoreModule>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.CORE_MODULE);
    return (saved as CoreModule) || 'infrastructure';
  });

  const setCoreModule = (mod: CoreModule) => {
    setCoreModuleState(mod);
    localStorage.setItem(STORAGE_KEYS.CORE_MODULE, mod);
  };

  // Module Selection Modal (prompted on main dashboard access or manually triggered)
  const [isModuleSelectModalOpen, setIsModuleSelectModalOpen] = useState<boolean>(() => {
    return !sessionStorage.getItem('cp_module_prompt_seen');
  });

  const [activeTab, setActiveTab] = useState<'dashboard' | 'map' | 'register' | 'inspections' | 'defects' | 'maintenance' | 'reports' | 'settings'>('dashboard');
  const [selectedAssetId, setSelectedAssetId] = useState<string | null>(null);

  // Filters - Focus strictly on Abau District as requested
  const [districtFilter, setDistrictFilter] = useState<'All' | District>('Abau');
  const [showFrozenRigo, setShowFrozenRigo] = useState<boolean>(false);
  const [llgFilter, setLlgFilter] = useState<string>('All');
  const [assetTypeFilter, setAssetTypeFilter] = useState<'All' | AssetType>('All');
  const [conditionFilter, setConditionFilter] = useState<'All' | ConditionRating>('All');
  const [priorityFilter, setPriorityFilter] = useState<'All' | MaintenancePriority>('All');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals & Panels
  const [isQuickCaptureOpen, setIsQuickCaptureOpen] = useState(false);
  const [isSyncDrawerOpen, setIsSyncDrawerOpen] = useState(false);
  const [isPdfStudioOpen, setIsPdfStudioOpen] = useState(false);

  // Offline Simulation & Native Network status
  const [isNativeOnline, setIsNativeOnline] = useState(navigator.onLine);
  const [isSimulatedOffline, setIsSimulatedOffline] = useState(false);
  const isOffline = !isNativeOnline || isSimulatedOffline;

  // El Niño Relief State (Abau District)
  const [elNinoLlgStatuses] = useState<Record<string, ElNinoLlgStatus>>(ABAU_EL_NINO_LLG_STATUSES);

  const [waterPoints, setWaterPoints] = useState<WaterPoint[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.WATER_POINTS);
    return saved ? JSON.parse(saved) : INITIAL_WATER_POINTS;
  });

  const [reliefShipments, setReliefShipments] = useState<ReliefAidShipment[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.RELIEF_SHIPMENTS);
    return saved ? JSON.parse(saved) : INITIAL_RELIEF_SHIPMENTS;
  });

  const [healthIncidents] = useState<HealthEmergencyIncident[]>(INITIAL_HEALTH_INCIDENTS);

  const [fieldRequests, setFieldRequests] = useState<FieldReliefRequest[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.FIELD_REQUESTS);
    return saved ? JSON.parse(saved) : INITIAL_FIELD_RELIEF_REQUESTS;
  });

  const [elNinoBudget] = useState<ElNinoBudgetSummary>(INITIAL_EL_NINO_BUDGET);

  // Core Data loaded from localStorage or initialized with updated asset photo URLs
  const [assets, setAssets] = useState<Asset[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.ASSETS);
    if (!saved) return INITIAL_ASSETS;
    try {
      const parsed: Asset[] = JSON.parse(saved);
      // Ensure latest official surveyed photo URLs are synced
      return parsed.map(a => {
        const init = INITIAL_ASSETS.find(i => i.id === a.id);
        if (init && init.photos && init.photos.length > 0) {
          if (!a.photos || a.photos.length === 0 || a.photos[0].includes('unsplash.com')) {
            return { ...a, photos: init.photos };
          }
        }
        return a;
      });
    } catch {
      return INITIAL_ASSETS;
    }
  });

  const [defects, setDefects] = useState<Defect[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.DEFECTS);
    return saved ? JSON.parse(saved) : INITIAL_DEFECTS;
  });

  const [inspections, setInspections] = useState<Inspection[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.INSPECTIONS);
    return saved ? JSON.parse(saved) : INITIAL_INSPECTIONS;
  });

  const [syncQueue, setSyncQueue] = useState<SyncQueueItem[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.SYNC_QUEUE);
    return saved ? JSON.parse(saved) : [];
  });

  const [priorityWeights, setPriorityWeights] = useState<PriorityModelWeights>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.WEIGHTS);
    return saved ? JSON.parse(saved) : DEFAULT_WEIGHTS;
  });

  const [currentUserRole, setCurrentUserRole] = useState<UserRole>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.ROLE);
    return (saved as UserRole) || 'Chief District Engineer';
  });

  // In-App Toast Notification State
  const [toasts, setToasts] = useState<ToastNotification[]>([]);

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  const notifyToast = (type: ToastType, title: string, message?: string) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
    const newToast: ToastNotification = { id, type, title, message, timestamp: Date.now() };
    setToasts(prev => [newToast, ...prev].slice(0, 5));
    // Auto remove after 4.5 seconds
    setTimeout(() => {
      removeToast(id);
    }, 4500);
  };

  // Track online status changes
  useEffect(() => {
    const handleOnline = () => setIsNativeOnline(true);
    const handleOffline = () => setIsNativeOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Save to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.ASSETS, JSON.stringify(assets));
  }, [assets]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.DEFECTS, JSON.stringify(defects));
  }, [defects]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.INSPECTIONS, JSON.stringify(inspections));
  }, [inspections]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.SYNC_QUEUE, JSON.stringify(syncQueue));
  }, [syncQueue]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.WEIGHTS, JSON.stringify(priorityWeights));
  }, [priorityWeights]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.ROLE, currentUserRole);
  }, [currentUserRole]);

  const toggleOfflineSimulation = (forceOffline?: boolean) => {
    setIsSimulatedOffline(prev => (forceOffline !== undefined ? forceOffline : !prev));
  };

  const updateWeights = (weights: PriorityModelWeights) => {
    setPriorityWeights(weights);
    // Recalculate priority scores for all non-overridden assets
    setAssets(prev =>
      prev.map(asset => {
        if (asset.priorityOverride) return asset;
        const { score, calculatedPriority } = calculatePriorityScore(asset.priorityFactors, weights);
        return {
          ...asset,
          priorityScore: score,
          maintenancePriority: calculatedPriority,
        };
      })
    );
  };

  // Add Asset with duplicate check
  const addAsset = (asset: Asset): { success: boolean; error?: string } => {
    const exists = assets.some(a => a.id.toLowerCase() === asset.id.toLowerCase().trim());
    if (exists) {
      return { success: false, error: `Asset ID "${asset.id}" already exists in Central Province register.` };
    }

    const factors = asset.priorityFactors || deriveFactorsForAsset(asset.conditionScore, asset.type, asset.district, 0);
    const { score, calculatedPriority } = calculatePriorityScore(factors, priorityWeights);

    const newAsset: Asset = {
      ...asset,
      priorityFactors: factors,
      priorityScore: score,
      maintenancePriority: calculatedPriority,
      isDemoRecord: true,
    };

    setAssets(prev => [newAsset, ...prev]);

    if (isOffline) {
      const queueItem: SyncQueueItem = {
        id: `SYNC-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        entityType: 'asset',
        action: 'create',
        timestamp: new Date().toISOString(),
        summary: `Created asset ${asset.id} (${asset.name})`,
        data: newAsset,
        retryCount: 0,
      };
      setSyncQueue(prev => [queueItem, ...prev]);
    }

    return { success: true };
  };

  const updateAsset = (updatedAsset: Asset): { success: boolean; error?: string } => {
    setAssets(prev =>
      prev.map(a => (a.id === updatedAsset.id ? updatedAsset : a))
    );

    if (isOffline) {
      const queueItem: SyncQueueItem = {
        id: `SYNC-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        entityType: 'asset',
        action: 'update',
        timestamp: new Date().toISOString(),
        summary: `Updated asset ${updatedAsset.id}`,
        data: updatedAsset,
        retryCount: 0,
      };
      setSyncQueue(prev => [queueItem, ...prev]);
    }

    return { success: true };
  };

  const archiveAsset = (assetId: string) => {
    setAssets(prev =>
      prev.map(a => (a.id === assetId ? { ...a, status: 'Archived' } : a))
    );
  };

  const addInspection = (
    inspectionData: Omit<Inspection, 'id' | 'isSynced' | 'syncedAt'>
  ): Inspection => {
    const newId = `INSP-${new Date().getFullYear()}-${String(inspections.length + 101).padStart(3, '0')}`;
    const newInspection: Inspection = {
      ...inspectionData,
      id: newId,
      isSynced: !isOffline,
      syncedAt: !isOffline ? new Date().toISOString() : undefined,
      isDemoRecord: true,
    };

    setInspections(prev => [newInspection, ...prev]);

    // Update the asset condition score, last inspection date, and recalculate priority
    setAssets(prev =>
      prev.map(a => {
        if (a.id !== newInspection.assetId) return a;
        const conditionScore = newInspection.overallScore;
        const conditionClassification = newInspection.rating;
        const factors = deriveFactorsForAsset(conditionScore, a.type, a.district, a.defectsCount);
        const { score, calculatedPriority } = calculatePriorityScore(factors, priorityWeights);

        return {
          ...a,
          conditionScore,
          conditionClassification,
          lastInspectionDate: newInspection.date,
          priorityFactors: factors,
          priorityScore: a.priorityOverride ? a.priorityScore : score,
          maintenancePriority: a.priorityOverride ? a.maintenancePriority : calculatedPriority,
        };
      })
    );

    if (isOffline) {
      const queueItem: SyncQueueItem = {
        id: `SYNC-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        entityType: 'inspection',
        action: 'create',
        timestamp: new Date().toISOString(),
        summary: `Inspection for ${newInspection.assetName} (${newInspection.rating})`,
        data: newInspection,
        retryCount: 0,
      };
      setSyncQueue(prev => [queueItem, ...prev]);
    }

    return newInspection;
  };

  const addDefect = (
    defectData: Omit<Defect, 'id' | 'isSynced' | 'syncedAt'>
  ): Defect => {
    const newId = `DEF-${new Date().getFullYear()}-${String(defects.length + 101).padStart(3, '0')}`;
    const newDefect: Defect = {
      ...defectData,
      id: newId,
      isSynced: !isOffline,
      syncedAt: !isOffline ? new Date().toISOString() : undefined,
    };

    setDefects(prev => [newDefect, ...prev]);

    // Increment defects count on asset & re-evaluate priority factors
    setAssets(prev =>
      prev.map(a => {
        if (a.id !== newDefect.assetId) return a;
        const newDefectsCount = a.defectsCount + 1;
        const factors = deriveFactorsForAsset(a.conditionScore, a.type, a.district, newDefectsCount);
        const { score, calculatedPriority } = calculatePriorityScore(factors, priorityWeights);

        return {
          ...a,
          defectsCount: newDefectsCount,
          priorityFactors: factors,
          priorityScore: a.priorityOverride ? a.priorityScore : score,
          maintenancePriority: a.priorityOverride ? a.maintenancePriority : calculatedPriority,
        };
      })
    );

    if (isOffline) {
      const queueItem: SyncQueueItem = {
        id: `SYNC-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        entityType: 'defect',
        action: 'create',
        timestamp: new Date().toISOString(),
        summary: `Reported defect "${newDefect.defectType}" on ${newDefect.assetName}`,
        data: newDefect,
        retryCount: 0,
      };
      setSyncQueue(prev => [queueItem, ...prev]);
    }

    return newDefect;
  };

  const updateDefectStatus = (
    defectId: string,
    status: DefectStatus,
    verifierNotes?: string
  ) => {
    setDefects(prev =>
      prev.map(d =>
        d.id === defectId
          ? {
              ...d,
              status,
              verificationNotes: verifierNotes || d.verificationNotes,
              verifiedBy: status === 'Verified' ? currentUserRole : d.verifiedBy,
            }
          : d
      )
    );
  };

  const overridePriority = (
    assetId: string,
    overriddenPriority: MaintenancePriority,
    overrideReason: string
  ) => {
    setAssets(prev =>
      prev.map(a => {
        if (a.id !== assetId) return a;
        return {
          ...a,
          maintenancePriority: overriddenPriority,
          priorityOverride: {
            originalPriority: a.maintenancePriority,
            overriddenPriority,
            overrideReason,
            overriddenBy: currentUserRole,
            timestamp: new Date().toISOString(),
          },
        };
      })
    );

    if (isOffline) {
      const queueItem: SyncQueueItem = {
        id: `SYNC-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        entityType: 'asset',
        action: 'override',
        timestamp: new Date().toISOString(),
        summary: `Engineering override priority for ${assetId} to ${overriddenPriority}`,
        data: { assetId, overriddenPriority, overrideReason },
        retryCount: 0,
      };
      setSyncQueue(prev => [queueItem, ...prev]);
    }
  };

  const syncQueueNow = async (): Promise<{ success: boolean; count: number }> => {
    if (isOffline) {
      return { success: false, count: 0 };
    }
    const count = syncQueue.length;
    // Mark inspections & defects in local state as synced
    setInspections(prev => prev.map(i => ({ ...i, isSynced: true, syncedAt: new Date().toISOString() })));
    setDefects(prev => prev.map(d => ({ ...d, isSynced: true, syncedAt: new Date().toISOString() })));
    setSyncQueue([]);
    return { success: true, count };
  };

  // Save El Nino state updates to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.WATER_POINTS, JSON.stringify(waterPoints));
  }, [waterPoints]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.RELIEF_SHIPMENTS, JSON.stringify(reliefShipments));
  }, [reliefShipments]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.FIELD_REQUESTS, JSON.stringify(fieldRequests));
  }, [fieldRequests]);

  const updateWaterPointStatus = (id: string, status: WaterPointStatus, rehabilitationRequired?: string) => {
    setWaterPoints(prev =>
      prev.map(wp =>
        wp.id === id
          ? {
              ...wp,
              status,
              ...(rehabilitationRequired ? { rehabilitationRequired } : {}),
              lastInspected: new Date().toISOString().split('T')[0],
            }
          : wp
      )
    );
  };

  const updateShipmentStatus = (id: string, status: AidShipmentStatus) => {
    setReliefShipments(prev =>
      prev.map(s => (s.id === id ? { ...s, status } : s))
    );
  };

  const addFieldRequest = (req: Omit<FieldReliefRequest, 'id' | 'timestamp' | 'status' | 'isSynced'>) => {
    const newReq: FieldReliefRequest = {
      ...req,
      id: `REQ-ELN-${Math.floor(100 + Math.random() * 900)}`,
      timestamp: new Date().toISOString(),
      status: 'Pending DDA Review',
      isSynced: !isOffline,
    };
    setFieldRequests(prev => [newReq, ...prev]);
    return newReq;
  };

  const updateFieldRequestStatus = (id: string, status: 'Pending DDA Review' | 'Relief Dispatched' | 'Completed') => {
    setFieldRequests(prev =>
      prev.map(r => (r.id === id ? { ...r, status } : r))
    );
  };

  const clearSyncQueue = () => {
    setSyncQueue([]);
  };

  const resetDemoData = () => {
    setAssets(INITIAL_ASSETS);
    setDefects(INITIAL_DEFECTS);
    setInspections(INITIAL_INSPECTIONS);
    setWaterPoints(INITIAL_WATER_POINTS);
    setReliefShipments(INITIAL_RELIEF_SHIPMENTS);
    setFieldRequests(INITIAL_FIELD_RELIEF_REQUESTS);
    setSyncQueue([]);
    setPriorityWeights(DEFAULT_WEIGHTS);
    localStorage.clear();
  };

  const exportDataAsJson = () => {
    const exportBundle = {
      application: 'Central Province Infrastructure & Asset Management Platform',
      jurisdiction: 'Central Province Government, Papua New Guinea',
      districts: ['Rigo', 'Abau'],
      exportTimestamp: new Date().toISOString(),
      disclaimer: 'Demonstration and strategic planning dataset. Not certified as final engineering construction specifications.',
      assets,
      defects,
      inspections,
      priorityWeights,
    };

    const blob = new Blob([JSON.stringify(exportBundle, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `central-province-infrastructure-export-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Filtered Assets computation
  const filteredAssets = assets.filter(asset => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const match =
        asset.name.toLowerCase().includes(q) ||
        asset.id.toLowerCase().includes(q) ||
        asset.code.toLowerCase().includes(q) ||
        asset.locationDescription.toLowerCase().includes(q) ||
        asset.llg.toLowerCase().includes(q);
      if (!match) return false;
    }

    // Freeze / Hide Rigo records unless explicitly enabled
    if (asset.district === 'Rigo') {
      if (!showFrozenRigo && districtFilter !== 'Rigo') {
        return false;
      }
    }

    if (districtFilter !== 'All' && asset.district !== districtFilter) {
      return false;
    }

    if (llgFilter !== 'All' && asset.llg !== llgFilter) {
      return false;
    }

    if (assetTypeFilter !== 'All' && asset.type !== assetTypeFilter) {
      return false;
    }

    if (conditionFilter !== 'All' && asset.conditionClassification !== conditionFilter) {
      return false;
    }

    if (priorityFilter !== 'All' && asset.maintenancePriority !== priorityFilter) {
      return false;
    }

    return true;
  });

  const viewingAsset = assets.find(a => a.id === selectedAssetId) || null;

  return (
    <AppContext.Provider
      value={{
        activeTab,
        setActiveTab,
        selectedAssetId,
        setSelectedAssetId,
        viewingAsset,
        searchQuery,
        setSearchQuery,
        districtFilter,
        setDistrictFilter,
        showFrozenRigo,
        setShowFrozenRigo,
        llgFilter,
        setLlgFilter,
        assetTypeFilter,
        setAssetTypeFilter,
        conditionFilter,
        setConditionFilter,
        priorityFilter,
        setPriorityFilter,
        assets,
        defects,
        inspections,
        syncQueue,
        filteredAssets,
        priorityWeights,
        updateWeights,
        currentUserRole,
        setCurrentUserRole,
        isOffline,
        toggleOfflineSimulation,
        isSimulatedOffline,
        syncQueueNow,
        clearSyncQueue,
        addAsset,
        updateAsset,
        archiveAsset,
        addInspection,
        addDefect,
        updateDefectStatus,
        overridePriority,
        resetDemoData,
        exportDataAsJson,
        isQuickCaptureOpen,
        setIsQuickCaptureOpen,
        isSyncDrawerOpen,
        setIsSyncDrawerOpen,
        isPdfStudioOpen,
        setIsPdfStudioOpen,
        toasts,
        notifyToast,
        removeToast,
        coreModule,
        setCoreModule,
        isModuleSelectModalOpen,
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
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
