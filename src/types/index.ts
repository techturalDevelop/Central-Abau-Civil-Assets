export type AssetType = 'road' | 'bridge' | 'culvert' | 'drainage' | 'causeway';

export type District = 'Abau' | 'Rigo';

export type AbauLLG = 'Aroma LLG' | 'Kupiano LLG' | 'Cloudy Bay LLG' | 'Amazon Bay LLG';

export interface AbauVillage {
  id: number;
  name: string;
  lat: number;
  lng: number;
  llg: AbauLLG;
}

export type ConditionRating = 'Good' | 'Fair' | 'Poor' | 'Critical';

export type RiskLevel = 'Low' | 'Medium' | 'High' | 'Extreme';

export type MaintenancePriority = 'Low' | 'Medium' | 'High' | 'Critical';

export type DefectSeverity = 'Minor' | 'Moderate' | 'Severe' | 'Critical';

export type DefectStatus = 'Open' | 'Assigned' | 'In Progress' | 'Resolved' | 'Verified';

export type AssetStatus = 'Operational' | 'Restricted Load' | 'Under Repair' | 'Closed/Impassable' | 'Archived';

export interface PriorityFactors {
  conditionDeficit: number; // 0-100 (100 = worst condition)
  defectSeverity: number;   // 0-100
  safetyRisk: number;       // 0-100
  infrastructureImportance: number; // 0-100 (e.g. Magi Highway arterial = 95)
  serviceDisruption: number; // 0-100 (isolates villages/clinics)
}

export interface PriorityOverride {
  originalPriority: MaintenancePriority;
  overriddenPriority: MaintenancePriority;
  overrideReason: string;
  overriddenBy: string;
  timestamp: string;
}

export interface TechnicalSpecs {
  lengthMeters?: number;
  spanMeters?: number;
  widthMeters?: number;
  surfaceType?: string; // 'Bituminous Seal', 'Unsealed Gravel', 'Reinforced Concrete', 'Steel Truss', 'Timber Deck', 'Corrugated Steel'
  designTonnage?: number;
  yearBuilt?: number;
  yearRehabilitated?: number;
  culvertDiameterMm?: number;
  numberOfBarrels?: number;
  drainageCapacityM3s?: number;
  abutmentType?: string;
}

export interface AssetDocument {
  id: string;
  title: string;
  type: string;
  date: string;
  size: string;
  category: 'Inspection Report' | 'Engineering Drawing' | 'Contract' | 'Site Photo';
}

export interface MaintenanceLog {
  id: string;
  date: string;
  type: string;
  contractor: string;
  costKina: number;
  description: string;
  verifiedBy: string;
}

export interface Asset {
  id: string; // e.g. CP-RIG-BRG-001
  code: string;
  name: string;
  type: AssetType;
  province: 'Central Province';
  district: District;
  llg: string; // e.g. 'Rigo Central', 'Aroma Coast'
  locationDescription: string;
  coordinates: [number, number]; // [lat, lng]
  alignmentPolyline?: [number, number][]; // For roads
  description: string;
  technicalSpecs: TechnicalSpecs;
  conditionClassification: ConditionRating;
  conditionScore: number; // 0-100 (100 = perfect, <40 = Critical)
  riskClassification: RiskLevel;
  maintenancePriority: MaintenancePriority;
  recommendedAction: string;
  priorityScore: number; // Calculated 0-100
  priorityFactors: PriorityFactors;
  priorityOverride?: PriorityOverride;
  replacementValueKina: number;
  lastInspectionDate: string;
  nextInspectionDate: string;
  inspectionFrequencyMonths: number;
  status: AssetStatus;
  photos: string[];
  documents: AssetDocument[];
  maintenanceHistory: MaintenanceLog[];
  defectsCount: number;
  isDemoRecord: boolean;
}

export interface ElementInspection {
  substructure: number; // 0-100
  superstructure: number; // 0-100
  deckSurface: number; // 0-100
  waterwayDrainage: number; // 0-100
  safetyBarriers: number; // 0-100
}

export interface Inspection {
  id: string;
  assetId: string;
  assetName: string;
  assetType: AssetType;
  district: District;
  llg: string;
  date: string;
  inspectorName: string;
  inspectorBadge: string;
  overallScore: number;
  rating: ConditionRating;
  elementScores: ElementInspection;
  weather: 'Sunny / Dry' | 'Heavy Rain / Monsoon' | 'Flooding High Water' | 'Overcast';
  notes: string;
  recommendedAction: string;
  urgency: MaintenancePriority;
  photos: string[];
  isSynced: boolean;
  syncedAt?: string;
  isDemoRecord?: boolean;
}

export interface Defect {
  id: string;
  assetId: string;
  assetName: string;
  assetType: AssetType;
  district: District;
  llg: string;
  defectType:
    | 'Pothole & Rutting Cluster'
    | 'Bridge Abutment Scour'
    | 'Structural Concrete Spalling'
    | 'Timber Deck Rot'
    | 'Culvert Siltation & Blockage'
    | 'Guardrail Impact Damage'
    | 'Embankment Landslip'
    | 'Roadside Drainage Overtopping';
  severity: DefectSeverity;
  status: DefectStatus;
  chainageOrLocation: string;
  coordinates?: [number, number];
  description: string;
  reportedDate: string;
  targetCompletionDate: string;
  recommendedAction: string;
  estimatedCostKina: number;
  assignedTeam?: string;
  photos: string[];
  isSynced: boolean;
  syncedAt?: string;
  verifiedBy?: string;
  verificationNotes?: string;
}

export interface SyncQueueItem {
  id: string;
  entityType: 'inspection' | 'defect' | 'asset';
  action: 'create' | 'update' | 'override';
  timestamp: string;
  summary: string;
  data: any;
  retryCount: number;
}

export interface PriorityModelWeights {
  conditionDeficitWeight: number; // default 0.25
  defectSeverityWeight: number;   // default 0.25
  safetyRiskWeight: number;       // default 0.20
  infrastructureImportanceWeight: number; // default 0.15
  serviceDisruptionWeight: number; // default 0.15
}

export type UserRole =
  | 'Provincial Works Administrator'
  | 'Rigo District Engineer'
  | 'Abau District Engineer'
  | 'Field Technical Inspector'
  | 'Abau Disaster Relief Coordinator';

export type CoreModule = 'infrastructure' | 'el_nino';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface ToastNotification {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  timestamp: number;
}

export * from './elnino';
