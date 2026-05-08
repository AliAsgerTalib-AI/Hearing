/**
 * useContraindicationScreening Hook
 *
 * Manages screening logic for medical contraindications
 * Evaluates user responses against clinical safety criteria
 */

import { useState, useCallback } from 'react';
import {
  Contraindication,
  ScreeningResponse,
  ContraindicationResult,
  CONTRAINDICATIONS,
  getAbsoluteContraindications
} from '../types/contraindications';

export const useContraindicationScreening = () => {
  const [responses, setResponses] = useState<ScreeningResponse>({});
  const [result, setResult] = useState<ContraindicationResult | null>(null);

  /**
   * Evaluate contraindications based on screening responses
   */
  const evaluateContraindications = useCallback(
    (screeningAnswers: ScreeningResponse): ContraindicationResult => {
      const identified: Contraindication[] = [];
      const requiresApproval: Contraindication[] = [];
      const modifications: string[] = [];

      // ABSOLUTE CONTRAINDICATIONS - Any one of these blocks testing
      if (screeningAnswers.suddenHearingLoss) {
        identified.push(CONTRAINDICATIONS.SSNHL);
      }

      if (screeningAnswers.earDrainageActive) {
        identified.push(CONTRAINDICATIONS.EAR_DISCHARGE);
      }

      if (screeningAnswers.earPain) {
        identified.push(CONTRAINDICATIONS.EAR_DISCHARGE);
      }

      // Vertigo: critical if acute (past 2 days), caution if chronic
      if (screeningAnswers.dizzinessVertigo) {
        if (screeningAnswers.dizzinessRecent) {
          identified.push(CONTRAINDICATIONS.ACUTE_VERTIGO);
        } else {
          // Chronic vertigo - relative contraindication
          modifications.push(
            '⚠️ Chronic dizziness detected. Testing safe if symptoms stable. Defer if experiencing active episode.'
          );
        }
      }

      // Recent ear surgery: requires surgeon clearance
      if (screeningAnswers.recentEarSurgery) {
        if (!screeningAnswers.hasSurgeonClearance) {
          requiresApproval.push(CONTRAINDICATIONS.POST_SURGICAL);
        } else {
          // Has clearance - proceed but note
          modifications.push('Post-surgical patient with surgeon clearance. Proceed with caution.');
        }
      }

      // TM perforation
      if (screeningAnswers.eardArmPerforation) {
        identified.push(CONTRAINDICATIONS.TM_PERFORATION);
      }

      // Retrocochlear pathology
      if (screeningAnswers.retrocochlearDiagnosis) {
        requiresApproval.push(CONTRAINDICATIONS.RETROCOCHLEAR);
      }

      // RELATIVE CONTRAINDICATIONS - Apply modifications
      if (screeningAnswers.meniersDiagnosis) {
        if (screeningAnswers.meniereCurrentAttack) {
          // Active attack = defer testing
          modifications.push(
            '❌ Meniere\'s disease with active symptoms. Defer testing 48+ hours after attack resolves.'
          );
        } else {
          // Stable Meniere's = proceed with monitoring
          modifications.push(
            '⚠️ Meniere\'s disease detected. Safe to test during remission. Stop if dizziness occurs.'
          );
        }
      }

      if (screeningAnswers.chronicDrainageHistory) {
        modifications.push(
          '⚠️ Chronic drainage history. Use bone-conduction headphones only. Keep ear dry.'
        );
      }

      if (screeningAnswers.otosclerosis) {
        modifications.push(
          '⚠️ Otosclerosis detected. Testing at lower maximum volume to avoid over-stimulation.'
        );
      }

      if (screeningAnswers.ototoxicMeds) {
        modifications.push(
          '⚠️ Ototoxic medication use. Baseline before treatment recommended. Monthly monitoring suggested.'
        );
      }

      if (screeningAnswers.recentHeadTrauma) {
        modifications.push(
          '⚠️ Recent head trauma. Medical clearance required before proceeding. Defer until post-concussion symptoms resolve.'
        );
      }

      if (screeningAnswers.significantAsymmetry) {
        modifications.push(
          '⚠️ Significant one-sided hearing loss reported. Imaging (MRI) may be needed to rule out acoustic neuroma. Consult ENT.'
        );
      }

      if (screeningAnswers.profoundHearingLoss) {
        modifications.push(
          '⚠️ Profound hearing loss reported. Testing accuracy may be limited. Consider hearing aid assessment first.'
        );
      }

      if (screeningAnswers.cognitiveImpairment) {
        modifications.push(
          '⚠️ Cognitive impairment reported. Caregiver assistance required. Supervised testing only.'
        );
      }

      if (screeningAnswers.severeAnxiety) {
        modifications.push(
          '⚠️ Severe anxiety reported. Test in comfortable environment. Have support person present. Consider shorter sessions.'
        );
      }

      const canProceed = identified.length === 0 && requiresApproval.length === 0;

      return {
        identified,
        requiresApproval,
        canProceed,
        modifications
      };
    },
    []
  );

  /**
   * Record screening responses and evaluate
   */
  const recordResponses = useCallback(
    (newResponses: ScreeningResponse) => {
      setResponses(newResponses);
      const result = evaluateContraindications(newResponses);
      setResult(result);
    },
    [evaluateContraindications]
  );

  /**
   * Reset screening
   */
  const resetScreening = useCallback(() => {
    setResponses({});
    setResult(null);
  }, []);

  return {
    responses,
    result,
    recordResponses,
    resetScreening,
    evaluateContraindications
  };
};

/**
 * Utility function: Check if user can proceed with testing
 */
export function canProceedWithTesting(responses: ScreeningResponse): boolean {
  // Check absolute contraindications
  if (
    responses.suddenHearingLoss ||
    responses.earDrainageActive ||
    responses.earPain ||
    responses.eardArmPerforation ||
    responses.retrocochlearDiagnosis
  ) {
    return false;
  }

  // Recent acute vertigo blocks testing
  if (responses.dizzinessVertigo && responses.dizzinessRecent) {
    return false;
  }

  // Recent surgery without clearance blocks testing
  if (responses.recentEarSurgery && !responses.hasSurgeonClearance) {
    return false;
  }

  return true;
}

/**
 * Get severity-weighted message for user
 */
export function getSeverityMessage(result: ContraindicationResult): string {
  if (result.identified.length > 0) {
    const criticalCount = result.identified.filter(c => c.severity === 'critical').length;
    const highCount = result.identified.filter(c => c.severity === 'high').length;

    if (criticalCount > 0) {
      return `🛑 CRITICAL: ${criticalCount} serious condition(s) detected. Do NOT proceed. See medical provider immediately.`;
    } else if (highCount > 0) {
      return `⚠️ HIGH RISK: ${highCount} contraindication(s) detected. Do NOT test until cleared by physician.`;
    }
  }

  if (result.requiresApproval.length > 0) {
    return `📋 MEDICAL APPROVAL NEEDED: ${result.requiresApproval.length} condition(s) require physician clearance.`;
  }

  if (result.modifications.length > 0) {
    return `⚠️ CAUTION: Special precautions needed. Review modifications before proceeding.`;
  }

  return '✅ No contraindications detected. Safe to proceed.';
}
