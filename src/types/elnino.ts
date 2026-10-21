import { AbauLLG } from './index';

export type DroughtCategory =
  | 'Normal / Watch'
  | 'Moderate Drought Alert'
  | 'Severe Agricultural Deficit'
  | 'Extreme Water Crisis'
  | 'Catastrophic Drought Emergency';

export interface ElNinoLlgStatus {
  llg: AbauLLG;
  droughtCategory: DroughtCategory;
  droughtLevel: number; // 1 to 5
  populationAffected: number;
  waterAccessPercentage: number;
  foodInsecurityLevel: 'Moderate' | 'High' | 'Severe' | 'Critical';
  malnutritionCases: number;
  keyRisks: string[];
  activeReliefTeams: number;
  priorityNeed: string;
  waterPointsOperational: number;
  waterPointsTotal: number;
}

export type WaterPointType =
  | 'Deep Aquifer Borehole'
  | 'Rainwater Catchment'
  | 'Gravity Feed Intake'
  | 'Solar Desalination Point'
  | 'Emergency Water Carting Depot'
  | 'Hand Dug Well';

export type WaterPointStatus =
  | 'Operational'
  | 'Critical Depletion'
  | 'Saline Contaminated'
  | 'Dried Up'
  | 'Emergency Rationing';

export interface WaterPoint {
  id: string;
  name: string;
  village: string;
  llg: AbauLLG;
  coordinates: [number, number];
  type: WaterPointType;
  status: WaterPointStatus;
  dailyYieldLiters: number;
  storageCapacityLiters: number;
  householdsServed: number;
  lastInspected: string;
  rehabilitationRequired: string;
  estimatedCostKina: number;
}

export type AidCategory =
  | 'Emergency Rice, Flour & Cooking Oil Rations'
  | 'Water Purification Bladders & Jerrycans'
  | 'Drought-Resistant Kaukau & Seedlings'
  | 'Clinical Oral Rehydration Salts & Plumpy Nut';

export type AidShipmentStatus =
  | 'Scheduled'
  | 'In Transit via Magi Highway'
  | 'Staged at Kupiano Relief Depot'
  | 'Coastal Barge in Transit'
  | 'Distributed & Certified';

export interface ReliefAidShipment {
  id: string;
  convoyCode: string;
  llg: AbauLLG;
  destinationVillages: string[];
  aidCategory: AidCategory;
  quantityDescription: string;
  beneficiaryHouseholds: number;
  transportMethod: 'Magi Highway Truck Convoy' | 'Coastal Barge (Kupiano - Magarida)' | 'Banana Dinghy Sea Transit';
  dispatchDate: string;
  status: AidShipmentStatus;
  leadOfficer: string;
  coordinates: [number, number];
}

export interface HealthEmergencyIncident {
  id: string;
  facility: string;
  llg: AbauLLG;
  condition:
    | 'Severe Acute Malnutrition'
    | 'Severe Dehydration Shock'
    | 'Waterborne Diarrheal Outbreak'
    | 'Respiratory Dust Illness';
  casesCount: number;
  urgency: 'Immediate Evacuation' | 'Emergency Medical Squad Dispatched' | 'Stabilized On-Site';
  date: string;
  notes: string;
}

export interface FieldReliefRequest {
  id: string;
  llg: AbauLLG;
  village: string;
  requesterName: string;
  requesterRole: 'Ward Councillor' | 'Village Elder' | 'Community Health Worker' | 'Field Relief Officer';
  urgency: 'Critical Emergency (Under 24h)' | 'High Priority' | 'Routine Relief Cycle';
  requestType:
    | 'Emergency Water Trucking'
    | 'Immediate Food Ration Pack'
    | 'Medical Rehydration Unit'
    | 'Borehole Solar Pump Failure'
    | 'Seedling Relief Kit';
  affectedPeople: number;
  details: string;
  timestamp: string;
  status: 'Pending DDA Review' | 'Relief Dispatched' | 'Completed';
  coordinates?: [number, number];
  isSynced: boolean;
}

export interface ElNinoBudgetSummary {
  totalBudgetKina: number;
  disbursedKina: number;
  committedKina: number;
  contingencyRemainingKina: number;
  donorPartners: string[];
}
