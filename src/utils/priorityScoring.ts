import { Asset, MaintenancePriority, PriorityFactors, PriorityModelWeights } from '../types';

/**
 * Calculates a 0-100 priority score based on weighted factors:
 * - Condition Deficit (100 - conditionScore)
 * - Defect Severity (scaled 0-100)
 * - Safety Risk (scaled 0-100)
 * - Infrastructure Importance (arterial route vs minor link)
 * - Service Disruption (isolation risk to communities, clinics, schools)
 */
export function calculatePriorityScore(
  factors: PriorityFactors,
  weights: PriorityModelWeights
): { score: number; calculatedPriority: MaintenancePriority } {
  const totalWeight =
    weights.conditionDeficitWeight +
    weights.defectSeverityWeight +
    weights.safetyRiskWeight +
    weights.infrastructureImportanceWeight +
    weights.serviceDisruptionWeight;

  const rawScore =
    factors.conditionDeficit * weights.conditionDeficitWeight +
    factors.defectSeverity * weights.defectSeverityWeight +
    factors.safetyRisk * weights.safetyRiskWeight +
    factors.infrastructureImportance * weights.infrastructureImportanceWeight +
    factors.serviceDisruption * weights.serviceDisruptionWeight;

  const normalizedScore = totalWeight > 0 ? Math.round((rawScore / totalWeight) * 10) / 10 : 0;

  let calculatedPriority: MaintenancePriority = 'Low';
  if (normalizedScore >= 75) {
    calculatedPriority = 'Critical';
  } else if (normalizedScore >= 60) {
    calculatedPriority = 'High';
  } else if (normalizedScore >= 40) {
    calculatedPriority = 'Medium';
  } else {
    calculatedPriority = 'Low';
  }

  return {
    score: normalizedScore,
    calculatedPriority,
  };
}

/**
 * Derives default factor values for a new or updated asset based on condition and defects.
 */
export function deriveFactorsForAsset(
  conditionScore: number,
  assetType: string,
  district: string,
  defectsCount: number
): PriorityFactors {
  const conditionDeficit = Math.max(0, 100 - conditionScore);
  
  // Arterials like Magi Highway have higher baseline importance
  const infrastructureImportance = assetType === 'road' ? 90 : assetType === 'bridge' ? 95 : 70;
  
  // Defect severity factor
  const defectSeverity = Math.min(100, Math.round(defectsCount * 35 + conditionDeficit * 0.4));
  
  // Safety risk increases drastically if condition is bad
  const safetyRisk = conditionScore < 40 ? 88 : conditionScore < 60 ? 60 : 25;
  
  // Service disruption factor (bridges cutting off district = 90+)
  const serviceDisruption = assetType === 'bridge' ? 90 : district === 'Abau' ? 80 : 70;

  return {
    conditionDeficit,
    defectSeverity,
    safetyRisk,
    infrastructureImportance,
    serviceDisruption,
  };
}
