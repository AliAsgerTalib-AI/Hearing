/**
 * Clinical contraindications and safety screening types
 * Based on ENT/Audiology clinical standards
 */

export type ContraindicationSeverity = 'critical' | 'high' | 'medium' | 'low';
export type ContraindicationType = 'absolute' | 'relative';

export interface Contraindication {
  id: string;
  title: string;
  description: string;
  severity: ContraindicationSeverity;
  type: ContraindicationType;
  screeningQuestion: string;
  guidance: string;
  referralProtocol: string;
  modificationStrategy?: string;
  tags: string[];
}

export interface ScreeningResponse {
  // Absolute contraindications
  suddenHearingLoss?: boolean;
  suddenHearingLossTimeline?: 'past72h' | 'pastWeek' | 'past3weeks' | 'gradual';

  earDrainageActive?: boolean;
  earPain?: boolean;

  dizzinessVertigo?: boolean;
  dizzinessRecent?: boolean;

  recentEarSurgery?: boolean;
  surgeryType?: string;
  surgeryDate?: string;
  hasSurgeonClearance?: boolean;

  eardArmPerforation?: boolean;

  retrocochlearDiagnosis?: boolean;

  // Relative contraindications
  meniersDiagnosis?: boolean;
  meniereCurrentAttack?: boolean;

  chronicDrainageHistory?: boolean;
  otosclerosis?: boolean;
  ototoxicMeds?: boolean;
  recentHeadTrauma?: boolean;
  significantAsymmetry?: boolean;
  profoundHearingLoss?: boolean;
  cognitiveImpairment?: boolean;
  severeAnxiety?: boolean;

  // Safety modifications
  usesHearingAid?: boolean;
  usesHearingAidInBothEars?: boolean;
}

export interface ContraindicationResult {
  identified: Contraindication[];
  canProceed: boolean;
  requiresApproval: Contraindication[];
  modifications: string[];
}

export const CONTRAINDICATIONS: Record<string, Contraindication> = {
  SSNHL: {
    id: 'ssnhl',
    title: 'Sudden Sensorineural Hearing Loss',
    description: 'Any sudden decrease in hearing (within 72 hours) is a medical emergency.',
    severity: 'critical',
    type: 'absolute',
    screeningQuestion: 'Have you noticed a sudden drop in hearing in the past 3 weeks?',
    guidance: 'Seek ENT consultation immediately. SSNHL requires urgent treatment within 2-4 weeks.',
    referralProtocol: 'ER → ENT evaluation → MRI IAC → Steroid therapy → Audiology follow-up',
    tags: ['emergency', 'retrocochlear-screening', 'time-sensitive']
  },

  EAR_DISCHARGE: {
    id: 'ear_discharge',
    title: 'Active Ear Discharge',
    description: 'Drainage, fluid, or blood from the ear canal requires immediate medical assessment.',
    severity: 'high',
    type: 'absolute',
    screeningQuestion: 'Do you have any drainage, discharge, or fluid from your ear(s) right now?',
    guidance: 'Active infection requires medical treatment before testing.',
    referralProtocol: 'ENT evaluation → Otoscopic exam → Culture if needed → Antibiotic/topical therapy',
    tags: ['infection', 'contagion-risk']
  },

  UNILATERAL_TINNITUS: {
    id: 'unilateral_tinnitus',
    title: 'Severe Unilateral Tinnitus',
    description: 'Persistent ringing or buzzing in only one ear should be evaluated for potential neurological causes.',
    severity: 'high',
    type: 'absolute',
    screeningQuestion: 'Do you have ringing, buzzing, or noise in just one ear that isn\'t from outside?',
    guidance: 'One-sided tinnitus can indicate a nerve tumor or other serious condition requiring imaging.',
    referralProtocol: 'ENT evaluation → MRI with IAC protocol → Neurology if imaging abnormal',
    tags: ['neurologic', 'retrocochlear-screening']
  },

  ACUTE_VERTIGO: {
    id: 'acute_vertigo',
    title: 'Acute Dizziness or Vertigo',
    description: 'Balance issues associated with hearing changes may indicate inner ear pathologies.',
    severity: 'high',
    type: 'absolute',
    screeningQuestion: 'Are you experiencing severe dizziness or a spinning sensation that makes it hard to stand?',
    guidance: 'Acute vertigo + hearing loss can indicate Meniere\'s disease or other serious conditions.',
    referralProtocol: 'If recent: ER to rule out stroke → Neurology assessment',
    modificationStrategy: 'Defer testing 48+ hours after vertigo episode resolves',
    tags: ['vestibular', 'neurologic']
  },

  POST_SURGICAL: {
    id: 'post_surgical',
    title: 'Recent Ear Surgery',
    description: 'Any otologic procedure within past 8 weeks requires healing time before audio testing.',
    severity: 'high',
    type: 'absolute',
    screeningQuestion: 'Have you had any ear surgery or tube placement in the past 2 months?',
    guidance: 'Surgical sites need time to heal. Testing too early could damage surgical reconstruction.',
    referralProtocol: 'Obtain written surgeon clearance → Confirm healing timeline for procedure type',
    tags: ['surgical', 'healing-required']
  },

  TM_PERFORATION: {
    id: 'tm_perforation',
    title: 'Tympanic Membrane Perforation',
    description: 'A hole in the eardrum means sound travels directly to the middle ear, creating risks.',
    severity: 'high',
    type: 'absolute',
    screeningQuestion: 'Has a doctor told you that you have a hole in your eardrum?',
    guidance: 'Perforated TM requires special precautions; sound pressure can cause infection/pain.',
    referralProtocol: 'ENT assessment → Monitor for healing (6-12 weeks) → Consider tympanoplasty if needed',
    modificationStrategy: 'Bone-conduction testing only; avoid headphone pressure',
    tags: ['structural-damage']
  },

  RETROCOCHLEAR: {
    id: 'retrocochlear',
    title: 'Known Retrocochlear Pathology',
    description: 'Diagnosed acoustic neuroma or other nerve/brain lesion affecting hearing.',
    severity: 'critical',
    type: 'absolute',
    screeningQuestion: 'Have you been diagnosed with an acoustic neuroma or brain tumor affecting your hearing?',
    guidance: 'Central auditory training cannot address nerve compression; specialist clearance required.',
    referralProtocol: 'Neuro-otology specialist assessment → Confirm training safety → Possible post-operative training',
    tags: ['neurologic', 'central']
  },

  // Relative contraindications
  MENIERES: {
    id: 'menieres',
    title: 'Meniere\'s Disease',
    description: 'Episodic vertigo requiring caution; testing safe during remission periods.',
    severity: 'medium',
    type: 'relative',
    screeningQuestion: 'Have you been diagnosed with Meniere\'s disease?',
    guidance: 'Test only during remission (no current vertigo symptoms).',
    referralProtocol: 'ENT management → Diuretics, vestibular rehab → Test 48+ hours post-attack',
    modificationStrategy: 'Assess remission status before testing; monitor for symptom triggers',
    tags: ['vestibular', 'manageable']
  },

  CHRONIC_DRAINAGE: {
    id: 'chronic_drainage',
    title: 'Chronic Ear Drainage',
    description: 'Long-term drainage requires special precautions and modified testing approach.',
    severity: 'medium',
    type: 'relative',
    screeningQuestion: 'Do you have chronic ear drainage that lasts weeks or months?',
    guidance: 'Use bone-conduction headphones; keep ear dry during testing.',
    referralProtocol: 'ENT management → Ototopical antibiotics → Consider tympanoplasty',
    modificationStrategy: 'Bone-conduction testing only; avoid external pressure',
    tags: ['infection-chronic']
  },

  OTOSCLEROSIS: {
    id: 'otosclerosis',
    title: 'Otosclerosis',
    description: 'Progressive bone fixation in middle ear; avoid over-stimulation.',
    severity: 'low',
    type: 'relative',
    screeningQuestion: 'Have you been diagnosed with otosclerosis?',
    guidance: 'Test at moderate volumes; can be useful for surgery planning.',
    referralProtocol: 'ENT management → Possible stapedectomy candidate',
    modificationStrategy: 'Test at lower maximum volume; document pre-op baseline',
    tags: ['progressive']
  },

  OTOTOXIC_MEDS: {
    id: 'ototoxic_meds',
    title: 'Ototoxic Medication Use',
    description: 'Certain antibiotics, chemotherapy, or high-dose NSAIDs require monitoring.',
    severity: 'low',
    type: 'relative',
    screeningQuestion: 'Are you taking aminoglycosides, chemotherapy, or very high-dose pain medications?',
    guidance: 'Baseline testing before medication; monthly monitoring during treatment.',
    referralProtocol: 'Monitor hearing closely; coordinate with prescribing physician',
    modificationStrategy: 'Lower maximum test volume; monthly baseline comparisons',
    tags: ['medication-related']
  },

  HEAD_TRAUMA: {
    id: 'head_trauma',
    title: 'Recent Head Trauma',
    description: 'Concussion or head injury requires medical clearance before testing.',
    severity: 'medium',
    type: 'relative',
    screeningQuestion: 'Have you had a head injury or concussion in the past 8 weeks?',
    guidance: 'Defer until post-concussion symptoms resolve; get medical clearance.',
    referralProtocol: 'Primary care or neurology clearance → Monitor for post-concussion syndrome',
    modificationStrategy: 'Defer testing until medically cleared',
    tags: ['neurologic', 'clearance-required']
  },

  COGNITIVE_IMPAIRMENT: {
    id: 'cognitive_impairment',
    title: 'Significant Cognitive Impairment',
    description: 'Dementia or language disorders may affect test reliability.',
    severity: 'low',
    type: 'relative',
    screeningQuestion: 'Do you have dementia, cognitive impairment, or significant language difficulties?',
    guidance: 'Require caregiver assistance; supervised testing only.',
    referralProtocol: 'Involve healthcare proxy or caregiver in test administration',
    modificationStrategy: 'Caregiver-assisted testing; consider longer duration',
    tags: ['cognitive']
  },

  ANXIETY_DISORDER: {
    id: 'anxiety_disorder',
    title: 'Severe Anxiety or Claustrophobia',
    description: 'Panic attacks triggered by enclosed spaces or tight headphones.',
    severity: 'low',
    type: 'relative',
    screeningQuestion: 'Do you experience severe anxiety or panic attacks with headphones or enclosed spaces?',
    guidance: 'Test in safe, familiar environment; have support person present.',
    referralProtocol: 'Consider anxiolytic support; behavioral coping strategies',
    modificationStrategy: 'Test in comfortable setting; break into shorter sessions',
    tags: ['mental-health']
  }
};

export function getContraindicationsByType(type: ContraindicationType): Contraindication[] {
  return Object.values(CONTRAINDICATIONS).filter(c => c.type === type);
}

export function getAbsoluteContraindications(): Contraindication[] {
  return getContraindicationsByType('absolute');
}

export function getRelativeContraindications(): Contraindication[] {
  return getContraindicationsByType('relative');
}
