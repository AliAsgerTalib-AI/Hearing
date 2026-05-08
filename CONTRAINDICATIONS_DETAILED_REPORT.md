# Longevity Hearing: Detailed Contraindications Report
**Clinical Safety Assessment & Implementation Guide**

**Date:** 2026-05-07  
**Prepared By:** Clinical Audiology & ENT Specialist Review  
**Version:** 1.0  
**Status:** Active Implementation Document

---

## TABLE OF CONTENTS

1. [Executive Summary](#executive-summary)
2. [Absolute Contraindications](#absolute-contraindications)
3. [Relative Contraindications](#relative-contraindications)
4. [Screening Questionnaire](#screening-questionnaire)
5. [Pre-Test Safety Checklist](#pre-test-safety-checklist)
6. [Implementation Code Samples](#implementation-code-samples)
7. [User Communication Templates](#user-communication-templates)

---

## EXECUTIVE SUMMARY

This report establishes clinical safety criteria for the Longevity Hearing application. Users must be screened for contraindications **BEFORE** initiating hearing assessments or auditory training.

### Current Status of ContraindicationReport Component
✅ **4 Conditions Covered:**
1. Sudden Hearing Loss (SSNHL)
2. Active Ear Discharge
3. Unilateral Tinnitus
4. Dizziness/Vertigo

❌ **Missing 7 Critical Conditions** (see Section 2)

### Implementation Priority
- **Phase 1 (Immediate):** Add missing absolute contraindications
- **Phase 2 (Week 2):** Implement screening questionnaire with conditional logic
- **Phase 3 (Month 1):** Add relative contraindications with warnings
- **Phase 4 (Month 2):** Integrate referral pathways

---

## ABSOLUTE CONTRAINDICATIONS

**Definition:** Conditions where app use is medically unsafe. User must not proceed with testing or training under any circumstances.

### 1. SUDDEN SENSORINEURAL HEARING LOSS (SSNHL)

#### Clinical Definition
- Hearing loss ≥30 dB at 3 consecutive frequencies
- Onset within 72 hours (acute) or gradually over 3 weeks (subacute)
- Typically unilateral
- Without clear cause (idiopathic in 90% of cases)

#### Why It's Contraindicated
1. **Medical Emergency:** SSNHL requires urgent intervention
   - Treatment window: 2-4 weeks from onset
   - Steroid therapy most effective if started early
   - Delay reduces chances of spontaneous recovery

2. **Misdiagnosis Risk:** Testing doesn't address underlying cause
   - Could be viral cochleitis
   - Could be retrocochlear (acoustic neuroma)
   - Could be autoimmune inner ear disease
   - Training may worsen if cause is progressive lesion

3. **Patient Safety:** Stress/effort during testing could worsen outcome

#### Screening Questions
- "Have you noticed a sudden drop in hearing in the past 3 weeks?"
- "Did your hearing change over hours/days vs. gradually over months?"
- "Is the loss in just one ear?"

#### Referral Protocol
```
IF suspected SSNHL:
├─ IMMEDIATE: Refer to ER or ENT (same day)
├─ Imaging: MRI with IAC (internal auditory canal) protocol
├─ Testing: Exclude retrocochlear pathology
├─ Treatment: Consider steroid therapy (most effective in first 2 weeks)
├─ Follow-up: Audiology in 2-4 weeks after treatment
└─ DEFER app use: Until cause identified and treatment initiated
```

#### Recommended UI Implementation
```tsx
<AlertBox severity="critical" title="Urgent Medical Evaluation Needed">
  <p>You've reported a sudden drop in hearing. This requires immediate evaluation by an ENT specialist.</p>
  
  <SeverityIndicators>
    <Icon name="alert-triangle" color="red" /> EMERGENCY
  </SeverityIndicators>
  
  <NextSteps>
    <p><strong>Do not proceed with hearing assessment.</strong></p>
    <ul>
      <li>Go to nearest Emergency Room, OR</li>
      <li>Call ENT on-call (emergency number provided in referral list)</li>
      <li>Mention: "Sudden hearing loss" to expedite</li>
    </ul>
  </NextSteps>
  
  <Timeline>
    <p>Treatment is most effective if started within <strong>2 weeks</strong> of onset.</p>
  </Timeline>
</AlertBox>
```

---

### 2. ACTIVE EAR DISCHARGE

#### Clinical Definition
- Drainage from ear canal
- May be clear, purulent (yellow/green), bloody, or serous
- Associated with pain, odor, or hearing loss
- Fresh onset or ongoing

#### Types & Associated Conditions
| Discharge Type | Likely Cause | Severity |
|---|---|---|
| Purulent (thick, yellow/green) | Acute otitis media, otitis externa | 🔴 High |
| Bloody or sanguinous | Trauma, TM perforation, cholesteatoma | 🔴 Critical |
| Clear/serous | Otitis media with effusion, post-surgery | 🟡 Medium |
| Waxy buildup | Cerumen impaction, not true "discharge" | 🟢 Low |

#### Why It's Contraindicated
1. **Infection Risk:** Sound pressure in infected ear can
   - Increase pain
   - Promote infection spread to middle ear/mastoid
   - Worsen suppuration (pus formation)

2. **Structural Damage:** May indicate
   - Tympanic membrane (TM) perforation (contraindicated for sound testing)
   - Ossicular chain damage
   - Cholesteatoma (requires surgery, not audio testing)

3. **Diagnostic Uncertainty:** Discharge indicates need for otoscopy/imaging before audio assessment

#### Screening Questions
- "Do you have any drainage, discharge, or fluid coming from your ear(s)?"
- "Any ear pain, odor, or pus?"
- "Any recent ear surgery or ear injury?"

#### Referral Protocol
```
IF active ear discharge:
├─ Determine if related to:
│  ├─ Acute otitis media → ENT eval + antibiotic therapy
│  ├─ Otitis externa → ENT + topical treatment
│  ├─ TM perforation → ENT assessment (may heal spontaneously)
│  ├─ Cholesteatoma → ENT/Otologic surgery referral
│  └─ Post-surgical → Follow up with operating surgeon
├─ Otoscopic exam: Visualize TM
├─ Audiometry: Defer until discharge resolves
└─ DEFER app use: Minimum 2 weeks after discharge stops, or after medical clearance
```

#### Recommended UI Implementation
```tsx
<AlertBox severity="high" title="Ear Drainage Detected">
  <p>You've reported drainage or fluid from your ear. This needs medical evaluation before hearing testing.</p>
  
  <SeverityIndicators>
    <Icon name="alert-circle" color="amber" /> HIGH RISK
  </SeverityIndicators>
  
  <Explanation>
    <p>Discharge usually indicates an infection or injury that requires healing before we can safely test your hearing.</p>
  </Explanation>
  
  <NextSteps>
    <p>Please see an ENT specialist to:</p>
    <ul>
      <li>Examine your ear with a microscope</li>
      <li>Determine if there's an infection or eardrum damage</li>
      <li>Start appropriate treatment</li>
    </ul>
  </NextSteps>
  
  <Timeline>
    <p>Hearing testing can resume <strong>2+ weeks after discharge stops</strong>, with medical clearance.</p>
  </Timeline>
</AlertBox>
```

---

### 3. SEVERE UNILATERAL TINNITUS

#### Clinical Definition
- Ringing, buzzing, roaring, or hissing in ONE ear only
- Persistent (>3 months) or bothersome
- Not attributable to external sound source

#### Why It's Contraindicated
1. **Retrocochlear Pathology Indicator:**
   - Unilateral tinnitus has ~5-10% risk of acoustic neuroma
   - Other retrocochlear causes: meningioma, MS, vascular malformation
   - Must rule out with imaging before audio testing

2. **Testing May Confound Diagnosis:**
   - Pure-tone testing measures peripheral hearing
   - Doesn't address underlying neurologic pathology
   - Training may mask symptoms, delaying diagnosis

3. **Risk of Worsening:**
   - Sound stimulation might worsen tinnitus in retrocochlear cases
   - Could accelerate underlying pathology

#### Screening Questions
- "Do you have ringing, buzzing, roaring, or noise in your ear(s) that isn't from outside?"
- "Is it in both ears or just one?"
- "How long have you had it? Is it getting worse?"
- "Have you had an MRI or imaging to check for acoustic neuroma?"

#### Referral Protocol
```
IF unilateral tinnitus:
├─ Obtain audiogram (to assess hearing profile)
├─ Imaging: MRI with IAC protocol to exclude acoustic neuroma
├─ Neurotology consult if imaging abnormal
├─ If imaging normal:
│  ├─ Consider tinnitus causes: noise exposure, ototoxicity, vascular
│  ├─ Treat underlying cause if identified
│  └─ Then proceed with auditory training (may help manage tinnitus)
└─ DEFER app use: Until imaging obtained and pathology excluded
```

#### Recommended UI Implementation
```tsx
<AlertBox severity="high" title="Unilateral Tinnitus Detected">
  <p>You've reported ringing or noise in one ear. This requires imaging to rule out serious causes.</p>
  
  <SeverityIndicators>
    <Icon name="alert-circle" color="amber" /> NEEDS INVESTIGATION
  </SeverityIndicators>
  
  <Explanation>
    <p>One-sided tinnitus can occasionally indicate a nerve tumor or vascular problem that needs to be ruled out with imaging (MRI).</p>
  </Explanation>
  
  <NextSteps>
    <ol>
      <li>Schedule MRI with your ENT or neurology specialist</li>
      <li>Ask for "IAC protocol" (internal auditory canal imaging)</li>
      <li>Get imaging results reviewed by your doctor</li>
      <li>Once cleared medically, you can use this app</li>
    </ol>
  </NextSteps>
  
  <Timeline>
    <p>Most tinnitus cases (90%+) are benign, but imaging provides peace of mind. Can usually be completed within 1-2 weeks.</p>
  </Timeline>
</AlertBox>
```

---

### 4. SEVERE DIZZINESS OR VERTIGO

#### Clinical Definition
- Room spinning sensation (vertigo) or lightheadedness (dizziness)
- Associated with hearing loss or ear fullness
- Recurrent, especially triggered by head movements
- Interferes with balance or causes falls

#### Associated Serious Conditions
| Condition | Key Features | Severity |
|---|---|---|
| **Meniere's Disease** | Episodic vertigo + hearing loss + tinnitus + aural fullness | 🟡 Medium (relative, not absolute) |
| **Vestibular Neuritis** | Acute vertigo, no hearing loss | 🔴 High (defer during acute phase) |
| **BPPV (Benign Paroxysmal Positional Vertigo)** | Vertigo with head movement, brief duration | 🟢 Low (usually safe after treatment) |
| **Acoustic Neuroma** | Unilateral hearing loss + unilateral tinnitus + vertigo | 🔴 Critical (retrocochlear) |
| **Central Vertigo (Brainstem/Cerebellum)** | Associated neurologic signs (ataxia, nystagmus) | 🔴 Critical |

#### Why It's Contraindicated
1. **Fall Risk:** Testing in quiet room with head phone placement increases fall risk
   - If user falls → potential head trauma → neuro emergency

2. **Diagnostic Uncertainty:** Vertigo + hearing loss = complex differential diagnosis
   - May be retrocochlear pathology (requires imaging)
   - May be active Meniere's attack (needs medical management first)
   - May be acute vestibular neuritis (needs time to recover)

3. **Symptom Provocation:** Sound stimulation can trigger vertigo in vestibular disorders

#### Screening Questions
- "Do you experience dizziness or a spinning sensation (vertigo)?"
- "When did this start? Is it constant or comes and goes?"
- "Does it happen with specific head movements or position changes?"
- "Have you fallen or had near-falls due to dizziness?"
- "Have you been diagnosed with Meniere's disease or BPPV?"

#### Referral Protocol
```
IF dizziness/vertigo:
├─ Severity assessment:
│  ├─ ACUTE (started within 48h): Refer to ER/neurology for stroke rule-out
│  └─ CHRONIC (weeks/months): Schedule neurotology/vestibular specialist
├─ Diagnostic workup:
│  ├─ Vestibular testing (Dix-Hallpike maneuver, caloric test)
│  ├─ Audiometry (check for hearing loss component)
│  ├─ Imaging if retrocochlear suspected (MRI IAC)
│  └─ Video nystagmography (VNG) to characterize nystagmus
├─ Treatment:
│  ├─ If BPPV: Canalith repositioning (Epley maneuver)
│  ├─ If Meniere's: Diuretics, vestibular rehabilitation, lifestyle modification
│  ├─ If vestibular neuritis: Vestibular rehab therapy
│  └─ If central: Neurologic investigation
└─ DEFER app use: Until acute phase resolved or specialist cleared for testing
```

#### Recommended UI Implementation
```tsx
<AlertBox severity="high" title="Dizziness/Vertigo Detected">
  <p>You've reported dizziness or spinning sensations. These require evaluation before hearing testing.</p>
  
  <SeverityIndicators>
    <Icon name="alert-circle" color="amber" /> NEEDS MEDICAL CLEARANCE
  </SeverityIndicators>
  
  <ConditionalLogic>
    {dizzinessStartedInPastDays(2) && (
      <Subsection>
        <p><strong>⚠️ If this started in the past 2 days:</strong></p>
        <p>Go to the ER to rule out stroke or other neurologic emergency.</p>
      </Subsection>
    )}
    
    {dizzinessChronicButUntreated && (
      <Subsection>
        <p><strong>If this has been ongoing for weeks:</strong></p>
        <p>See a vestibular specialist or otolaryngologist for diagnosis.</p>
        <p>Common causes (usually not serious):</p>
        <ul>
          <li>BPPV (easily treated with repositioning)</li>
          <li>Meniere's Disease (manageable with treatment)</li>
          <li>Vestibular inflammation (improves with time + therapy)</li>
        </ul>
      </Subsection>
    )}
  </ConditionalLogic>
  
  <Timeline>
    <p>Once the underlying cause is treated and you're cleared by your doctor, you can use this app safely.</p>
  </Timeline>
</AlertBox>
```

---

### 5. RECENT EAR SURGERY (NEW - CRITICAL GAP)

#### Clinical Definition
- Any otologic procedure within past 6 weeks
- Includes: tympanoplasty, ossiculoplasty, stapes surgery, mastoidectomy, tube placement
- Includes endoscopic and microscopic approaches

#### Why It's Contraindicated
1. **Healing Period:** Structures need time to stabilize
   - Tympanic membrane graft needs 3-6 weeks to integrate
   - Ossicular chain reconstruction needs immobilization
   - Mastoid bone needs inflammatory response to subside

2. **Infection Risk:** Fresh surgical site is contamination risk
   - Sound pressure + microphone = potential infection pathway
   - Earpieces/headphones contact surgical dressing/sutures

3. **Results Invalid:** Testing during healing phase won't reflect final hearing outcome
   - Fluid/swelling in middle ear affects threshold measurements
   - Results misleading for long-term comparison

#### Screening Questions
- "Have you had any ear surgery or tube placement in the past 2 months?"
- "What type of surgery? (tubes, eardrum repair, bone surgery, etc.)"
- "Who was your surgeon? Can we contact for clearance?"

#### Referral Protocol & Timeline
```
Post-Operative Clearance Timeline:

PE Tubes (Tympanostomy):
└─ 2 weeks: Can test hearing if tubes functioning properly
└─ 6 weeks: Routine follow-up, usually clear for testing

Tympanoplasty (TM Graft):
└─ 3 weeks: Initial healing, avoid water/sound pressure testing
└─ 6 weeks: Graft typically incorporated, can do audiometry
└─ 12 weeks: Full healing, reliable baseline results

Ossiculoplasty (bone reconstruction):
└─ 6-8 weeks: Healing period, avoid acoustic testing
└─ 8-12 weeks: Sufficient stability for testing

Stapes Surgery (TORP/PORP placement):
└─ 2-3 weeks: Initial healing with packing
└─ 3-6 weeks: Packing removed, early healing
└─ 6 weeks: Can do audiometry
└─ 12 weeks: Results stabilized

Mastoidectomy/Cortical Mastoidectomy:
└─ 2-4 weeks: Discharge, inflammation phase
└─ 6-8 weeks: Safe for audio testing
└─ 8-12 weeks: Full healing

PROTOCOL:
├─ Obtain surgical summary from provider
├─ Calculate time since surgery
├─ If <6 weeks: ASK for provider clearance in writing
├─ If >6 weeks: Safe to proceed with testing (document surgery type)
└─ Use post-op baseline (not pre-op baseline) for comparison
```

#### Recommended UI Implementation
```tsx
<AlertBox severity="high" title="Recent Ear Surgery Detected">
  <p>You've had ear surgery recently. We need clearance from your surgeon before testing.</p>
  
  <SeverityIndicators>
    <Icon name="alert-circle" color="amber" /> REQUIRES SURGEON APPROVAL
  </SeverityIndicators>
  
  <Timeline>
    <p>Most ear surgeries need <strong>4-6 weeks</strong> to heal before hearing testing.</p>
  </Timeline>
  
  <NextSteps>
    <ol>
      <li>Contact your surgeon's office</li>
      <li>Ask: "Can the patient do a hearing test? (non-clinical web app)"</li>
      <li>Ask: "When is safe to resume normal audio use?"</li>
      <li>Have them reply via email confirming clearance</li>
    </ol>
  </NextSteps>
  
  <NoteToUser>
    <p>We want to make sure your ear has fully healed before you use this app. This protects your surgical outcome!</p>
  </NoteToUser>
</AlertBox>
```

---

### 6. TYMPANIC MEMBRANE PERFORATION (NEW - CRITICAL GAP)

#### Clinical Definition
- Hole or tear in eardrum
- May be acute (traumatic) or chronic (long-standing)
- Associated with conductive hearing loss
- May have drainage if infected

#### Why It's Contraindicated
1. **Pressure Transmission:** Sound goes directly to middle ear
   - Bypasses natural eardrum filtering
   - Direct pressure on ossicular chain/round window
   - Can cause discomfort or worsening of perforation

2. **Infection Risk:** Headphone/earpiece contact increases infection risk
   - Perforated eardrum = pathway for bacteria
   - Otitis media secondary infection risk

3. **Results Invalid:** Perforated TM changes acoustic impedance
   - Hearing thresholds artificially elevated (air-bone gap)
   - Results not comparable to normal population
   - True bone conduction should be tested if assessing unmasked thresholds

#### Screening Questions
- "Has a doctor told you that your eardrum is perforated (has a hole)?"
- "Any recent ear injury or trauma?"
- "Have you had water/debris in your ear causing pain?"
- "Any hearing loss that changed suddenly after head/ear trauma?"

#### Referral Protocol
```
IF TM perforation:
├─ Assess perforation status:
│  ├─ Small (<10% area): Usually heals spontaneously in 6-12 weeks
│  ├─ Large (>30% area): Often requires tympanoplasty (surgical repair)
│  └─ Marginal/infected: May require cleaning + topical antibiotics
├─ Audiometric testing:
│  ├─ Can do bone conduction (test sensorineural component)
│  ├─ Air conduction testing deferred until healed
│  └─ Document pre-healing status for comparison
├─ Healing support:
│  ├─ Keep ear dry (no water entry)
│  ├─ Avoid sound pressure devices (headphones, hearing aids)
│  └─ May use bone-conduction or insert-type headphones if necessary
└─ DEFER web app use: Until perforation healed or tympanoplasty completed (6-12 weeks)
```

#### Recommended UI Implementation
```tsx
<AlertBox severity="high" title="Eardrum Perforation Detected">
  <p>You've reported a hole in your eardrum. This needs to heal before hearing testing.</p>
  
  <SeverityIndicators>
    <Icon name="alert-circle" color="amber" /> CONTRAINDICATED
  </SeverityIndicators>
  
  <Explanation>
    <p>A perforated eardrum means sound travels directly into the middle ear space. Headphones/earpieces could:</p>
    <ul>
      <li>Increase infection risk</li>
      <li>Cause discomfort</li>
      <li>Worsen the perforation</li>
    </ul>
  </Explanation>
  
  <Timeline>
    <p><strong>Small perforations:</strong> Heal on their own in 4-12 weeks (with ear kept dry)</p>
    <p><strong>Large perforations:</strong> May require surgery (eardrum grafting) - ask your ENT</p>
  </Timeline>
  
  <NextSteps>
    <p>Once your eardrum is healed, you'll get clearance from your ENT, and you can come back to use this app.</p>
  </NextSteps>
</AlertBox>
```

---

### 7. KNOWN RETROCOCHLEAR PATHOLOGY (NEW - CRITICAL GAP)

#### Clinical Definition
- Diagnosed acoustic neuroma (vestibular schwannoma)
- Other intracranial mass affecting auditory nerve
- Confirmed on imaging (MRI)
- May be monitored (growing slowly) or scheduled for surgery

#### Why It's Contraindicated
1. **Central vs. Peripheral Issue:** Auditory training targets peripheral (cochlear) processing
   - Doesn't address auditory nerve compression
   - Won't help if hearing loss is from nerve damage, not cochlear damage

2. **Symptom Masking Risk:** Training may mask worsening neural dysfunction
   - Could delay detection of tumor growth
   - Could interfere with surgical planning

3. **Neuroplasticity Concerns:** Auditory training assumes intact neural pathways
   - Mass effect from tumor disrupts signal transmission
   - Central auditory processing may be impaired even if peripheral hearing normal

#### Screening Questions
- "Have you been diagnosed with an acoustic neuroma or brain tumor affecting your hearing?"
- "Has imaging shown any mass in your inner ear or auditory nerve?"
- "Are you being monitored by neurosurgery or neuro-otology?"

#### Referral Protocol
```
IF retrocochlear pathology:
├─ Confirm diagnosis and imaging findings
├─ Determine management plan:
│  ├─ If "watch and wait": Periodic imaging (MRI) monitoring protocol
│  ├─ If surgery planned: Timing and surgical approach
│  └─ If radiosurgery planned: Stereotactic protocol details
├─ Determine candidacy for auditory training:
│  ├─ Neuro-otologist assessment: Is training beneficial or harmful?
│  ├─ Consider if post-operative (after tumor removal)
│  ├─ May be beneficial for contralateral ear if intact
│  └─ May be beneficial post-hearing aid fitting
├─ Document: Can patient safely use audio training?
└─ DEFER app use: Unless cleared by neuro-otology specialist
```

#### Recommended UI Implementation
```tsx
<AlertBox severity="critical" title="Retrocochlear Pathology Requires Specialist Clearance">
  <p>You've reported a diagnosed nerve tumor or similar condition. Your specialist needs to approve this app.</p>
  
  <SeverityIndicators>
    <Icon name="alert-triangle" color="red" /> REQUIRES SPECIALIST APPROVAL
  </SeverityIndicators>
  
  <Explanation>
    <p>Auditory training exercises work on the hearing nerve and brain. If you have a diagnosed nerve condition, your neuro-otologist or neurosurgeon needs to confirm it's safe for you to use this app.</p>
  </Explanation>
  
  <NextSteps>
    <ol>
      <li>Contact your treating neuro-otologist or neurosurgeon</li>
      <li>Ask: "Is it safe for the patient to use an auditory training app?"</li>
      <li>Have them reply with written clearance</li>
    </ol>
  </NextSteps>
  
  <SafetyNote>
    <p>We take your neurologic health very seriously. This app is not right for everyone, and a specialist needs to give the all-clear.</p>
  </SafetyNote>
</AlertBox>
```

---

## RELATIVE CONTRAINDICATIONS

**Definition:** Conditions requiring modification or caution. Testing/training may proceed WITH special precautions or under medical supervision.

### 8. MENIERE'S DISEASE (RELATIVE)

#### Clinical Definition
- Episodic vertigo (20 min - 2 hours)
- Fluctuating hearing loss
- Tinnitus and/or aural fullness
- Typically unilateral, diagnosis requires 2 attacks + audiometric evidence

#### Why Relative (Not Absolute)
- **Not an emergency** (unlike sudden hearing loss)
- **Managed condition** (diuretics, lifestyle modification)
- **Training can help** (post-acute phase, vestibular compensation)
- **But must avoid acute attacks** (vertigo triggered by sound/stress)

#### Screening & Precautions
```typescript
IF diagnose meniere's disease:
├─ DURING ACUTE ATTACK (active vertigo):
│  └─ DEFER testing completely (wait 48+ hours after last vertigo)
├─ BETWEEN ATTACKS (stable):
│  ├─ Safe to do baseline hearing testing
│  ├─ Document: "Tested during Meniere's remission"
│  ├─ Can do auditory training with monitoring
│  └─ Caution: Avoid stress/caffeine 24h before
├─ LONG-TERM MONITORING:
│  ├─ Quarterly testing to track fluctuating thresholds
│  ├─ Monitor high frequencies (Meniere's affects low to mid)
│  └─ Correlate with vertigo episodes
└─ CONTRAINDICATE TRAINING IF:
   ├─ Acute attacks become more frequent
   ├─ Hearing drops significantly during attack
   └─ Training triggers episodes (individual sensitivity)
```

#### Recommended UI Implementation
```tsx
<WarningBox severity="medium" title="Meniere's Disease Detected - Special Precautions">
  <p>You have Meniere's disease. We can still test your hearing, but with some precautions.</p>
  
  <SafePeriods>
    <p><strong>When it's safe:</strong></p>
    <ul>
      <li>When you're NOT having vertigo symptoms</li>
      <li>At least 48 hours after your last dizzy spell</li>
      <li>When you're feeling stable and well</li>
    </ul>
  </SafePeriods>
  
  <PreTestChecklist>
    <Checkbox label="I have not had vertigo symptoms in the past 48 hours" required />
    <Checkbox label="I am feeling stable and well today" required />
    <Checkbox label="I have not had excessive caffeine/sodium today" required />
  </PreTestChecklist>
  
  <TrainingModifications>
    <p>If you proceed with auditory training, please:</p>
    <ul>
      <li>Do exercises during remission periods only</li>
      <li>Stop immediately if you feel dizzy</li>
      <li>Report any new or worsening vertigo to your ENT</li>
      <li>Avoid distracting environments (concentrate on training, not environment)</li>
    </ul>
  </TrainingModifications>
  
  <MonitoringSchedule>
    <p>Test your hearing monthly to track the natural fluctuations of Meniere's.</p>
  </MonitoringSchedule>
</WarningBox>
```

---

### 9. CHRONIC SUPPURATIVE OTITIS MEDIA (CSOM) (NEW)

#### Clinical Definition
- Chronic ear drainage (>6 weeks)
- Usually from central TM perforation
- Associated with chronic infection
- May progress to cholesteatoma (bone-eroding infection)

#### Why Relative (Not Absolute)
- **Not immediately life-threatening** (unlike SSNHL)
- **Draining is therapeutic** (better than collecting pus)
- **Hearing testing possible** (with precautions)
- **But requires ongoing medical management**

#### Screening & Precautions
```
IF CSOM:
├─ Determine stage:
│  ├─ Simple CSOM: Central perforation, minimal drainage
│  └─ Complicated CSOM: Possible cholesteatoma, bone erosion
├─ Medical management:
│  ├─ Ototopical antibiotics (fluoroquinolones preferred)
│  ├─ Ear cleaning/debridement as needed
│  ├─ Monitor for complications (facial nerve, semicircular canal fistula)
│  └─ Consider tympanoplasty when ready
├─ Hearing assessment:
│  ├─ Can do bone-conduction testing (assess cochlear function)
│  ├─ Air-conduction testing limited (TM perforation distorts results)
│  └─ Baseline useful for surgical planning
├─ Precautions during app use:
│  ├─ Use only bone-conduction headphones or insert earpieces
│  ├─ Avoid external pressure on TM
│  ├─ Keep ear dry (no water/moisture)
│  └─ Stop if discharge increases or pain worsens
└─ Target: Ear drying + tympanoplasty, then resume normal testing
```

#### Recommended UI Implementation
```tsx
<WarningBox severity="medium" title="Chronic Ear Drainage - Precautions Required">
  <p>You have chronic drainage from your ear. You can use this app, but with special care.</p>
  
  <ModifiedProtocol>
    <p><strong>How to use this app safely:</strong></p>
    <ul>
      <li>Use bone-conduction headphones (not traditional earbuds)</li>
      <li>Keep your ear as dry as possible</li>
      <li>Avoid inserting anything deep into the ear canal</li>
      <li>If drainage increases, stop using the app</li>
    </ul>
  </ModifiedProtocol>
  
  <MedicalContext>
    <p>Your ENT doctor should know you're using this app. Your hearing assessment can help with treatment planning and surgery decision-making.</p>
  </MedicalContext>
</WarningBox>
```

---

### 10. OTOSCLEROSIS (NEW)

#### Clinical Definition
- Abnormal bone growth in middle ear (stapes fixation)
- Progressive conductive hearing loss
- Genetic condition, may be bilateral
- Treatable with stapes surgery (stapedectomy)

#### Why Relative (Not Absolute)
- **Stable disease** (not emergency)
- **Slowly progressive** (testing won't cause rapid worsening)
- **Training may help** (addresses sensorineural component if present)
- **But avoid over-stimulation** (unclear if sound aggravates condition)

#### Screening & Precautions
```
IF otosclerosis:
├─ Document:
│  ├─ Audiometric pattern (conductive loss, elevated bone thresholds)
│  ├─ Carhart notch at 2000 Hz (classic sign)
│  └─ Whether already planned for surgery
├─ Testing considerations:
│  ├─ Can do baseline/follow-up audiometry
│  ├─ Document bone conduction (assess cochlear reserve)
│  ├─ Useful for surgical decision-making
│  └─ Document device type (results vary by testing method)
├─ Training precautions:
│  ├─ Avoid excessive high-frequency stimulation
│  ├─ Moderate volume levels (don't push to maximum)
│  ├─ Monitor for symptoms (increasing hearing loss, tinnitus onset)
│  └─ Some evidence suggests hearing aid use may slow progression
└─ Surgery planning:
   ├─ Pre-operative baseline audiometry essential
   ├─ Post-operative testing at 6 weeks (post-op improvement curves)
   └─ Training benefits if significant cochlear reserve remains
```

#### Recommended UI Implementation
```tsx
<WarningBox severity="low-medium" title="Otosclerosis - Modified Testing">
  <p>You have otosclerosis. You can use this app, but we suggest moderate volumes.</p>
  
  <Explanation>
    <p>Your hearing loss is from bone fixation in your middle ear. This app tests by putting tones in your ear at gradually higher volumes. We'll use moderate levels to avoid over-stimulation.</p>
  </Explanation>
  
  <TestingModification>
    <p><strong>We will:</strong></p>
    <ul>
      <li>Test at lower maximum volume than normal</li>
      <li>Spend extra time on bone-conduction assessment</li>
      <li>Document your baseline for surgery planning (if pursued)</li>
    </ul>
  </TestingModification>
  
  <SurgeryPlanning>
    <p>If you're considering stapedectomy surgery, this baseline hearing test will be valuable for your surgeon to compare against post-operative results.</p>
  </SurgeryPlanning>
</WarningBox>
```

---

### 11-17. ADDITIONAL RELATIVE CONTRAINDICATIONS (ABBREVIATED)

#### 11. OTOTOXIC MEDICATION USE
- **Condition:** Currently taking aminoglycosides, cisplatin, high-dose NSAIDs
- **Precaution:** Baseline before medication; monitor monthly during treatment
- **Modification:** Lower maximum test volume to avoid cumulative damage

#### 12. RECENT HEAD TRAUMA
- **Condition:** Head/ear injury in past 8 weeks
- **Precaution:** Delay testing until post-concussion symptoms resolved
- **Modification:** Get medical clearance; watch for escalating symptoms

#### 13. UNILATERAL ASYMMETRIC HEARING LOSS (>20dB at single frequency)
- **Condition:** Sudden asymmetry suggests retrocochlear pathology
- **Precaution:** Obtain MRI IAC protocol before training
- **Modification:** Safe after imaging rules out acoustic neuroma

#### 14. SIGNIFICANT CONDUCTIVE LOSS
- **Condition:** Air-bone gap >30dB suggests ossicular problem
- **Precaution:** May indicate fixation (otosclerosis) or discontinuity
- **Modification:** Audio training won't help; refer for surgical evaluation

#### 15. PROFOUND HEARING LOSS (>80dB both ears)
- **Condition:** Severe-to-profound, may be pre-lingual or post-lingual
- **Precaution:** App assumes adequate residual hearing for training benefit
- **Modification:** Hearing aid user? Proceed if aided thresholds better

#### 16. COGNITIVE/LANGUAGE IMPAIRMENT
- **Condition:** Dementia, developmental disability, language disorder
- **Precaution:** Can't follow app instructions accurately
- **Modification:** Require caregiver assistance and supervision

#### 17. SEVERE ANXIETY/CLAUSTROPHOBIA
- **Condition:** Panic attacks triggered by enclosed spaces or headphone pressure
- **Precaution:** Testing in quiet room with earpieces might trigger episode
- **Modification:** Require anxiolytic or behavioral support; test in familiar environment

---

## SCREENING QUESTIONNAIRE

### Smart Form with Conditional Logic

```typescript
interface ScreeningResponse {
  // Absolute contraindication screening
  suddenHearingLoss: boolean;
  onsetTimeline?: 'past72h' | 'pastWeek' | 'past3weeks' | 'gradual';
  
  earDrainageActive: boolean;
  earPain: boolean;
  
  unilateralTinnitus: boolean;
  tinnitusUnilateral?: boolean;
  tinnitusStatus?: 'recent' | 'chronic' | 'worsening';
  
  dizzinessVertigo: boolean;
  dizzinessFrequency?: 'constant' | 'episodic' | 'rare';
  dizzinessRecent?: boolean;
  
  recentEarSurgery: boolean;
  surgeryType?: string;
  surgeryDate?: string;
  
  eardArmPerforation: boolean;
  
  retrocochlearDiagnosis: boolean;
  
  // Relative contraindication screening
  meniersDiagnosis: boolean;
  meniereCurrentAttack?: boolean;
  
  chronicDrainageHistory: boolean;
  otosclerosis: boolean;
  ototoxicMeds: boolean;
  recentHeadTrauma: boolean;
  significantAsymmetry: boolean;
  profoundHearingLoss: boolean;
  cognitiveImpairment: boolean;
  severeAnxiety: boolean;
  
  // Safety modifications
  usesHearingAid: boolean;
  usesHearingAidInBothEars?: boolean;
  
  // Medical clearance
  hasSurgeonClearance?: boolean;
  clearanceDate?: string;
}
```

### Recommended Questionnaire Structure

**Stage 1: Absolute Red Flags (Gating - must all be "No" to proceed)**

```
1. "Have you experienced a sudden drop in hearing within the past 3 weeks?"
   [YES → STOP, refer to ER/ENT] [NO → continue]

2. "Do you have any drainage, discharge, or fluid coming from your ear(s) right now?"
   [YES → STOP, refer to ENT] [NO → continue]

3. "Do you have severe dizziness or a spinning sensation that makes it hard to stand or sit safely?"
   [YES → if past 2 days: STOP, go to ER] [if chronic: continue with caution] [NO → continue]

4. "Have you had any ear surgery in the past 8 weeks?"
   [YES → ask: Do you have written clearance from your surgeon to test your hearing?]
   [NO → continue]

5. "Has a doctor told you that you have a hole in your eardrum?"
   [YES → STOP, defer until healed] [NO → continue]

6. "Do you have a diagnosed acoustic neuroma, brain tumor, or mass affecting your hearing nerve?"
   [YES → STOP, need neuro-otologist clearance] [NO → continue]
```

**Stage 2: Relative Cautions (Collect for modifier logic)**

```
7. "Have you been diagnosed with Meniere's disease?"
   [YES → ask: "Are you experiencing vertigo symptoms right now?"]
   [If YES: recommend deferring 48 hours] [If NO: can proceed with precautions]

8. "Do you have chronic ear drainage that lasts weeks/months?"
   [YES → recommend bone-conduction headphones] [NO → continue]

9. "Have you been diagnosed with otosclerosis?"
   [YES → note: will use lower test volumes] [NO → continue]

10. "Are you currently taking antibiotics (especially gentamicin/tobramycin), chemotherapy drugs, or very high-dose pain medications?"
    [YES → baseline before treatment; monitor monthly] [NO → continue]

11. "Have you had a head injury or concussion in the past 8 weeks?"
    [YES → defer until post-concussion symptoms resolved] [NO → continue]

12. "Do you have a very different hearing level between your two ears (one much worse than the other)?"
    [YES → note: may need imaging to rule out nerve tumor] [NO → continue]

13. "Do you have severe cognitive impairment, dementia, or significant language difficulties?"
    [YES → require caregiver; supervised testing only] [NO → continue]

14. "Do you experience severe anxiety or panic attacks, especially with headphones or enclosed spaces?"
    [YES → note: test in safe, familiar environment; have support person present]
    [NO → continue]
```

**Stage 3: Informed Consent**

```
"I understand that:
- This is an educational/information tool, not a medical device
- It should not replace professional audiology testing
- I am responsible for my safety during testing
- I will stop immediately if I experience pain, dizziness, or other concerning symptoms
- I will consult with my healthcare provider about results and any concerning findings"

[CHECKBOX - must check to proceed]
```

---

## PRE-TEST SAFETY CHECKLIST

**Display before each testing session:**

```tsx
<SafetyChecklist>
  <Instruction>
    Before starting your hearing test, please confirm:
  </Instruction>
  
  <ChecklistItem>
    <Checkbox required />
    <Label>I am in a safe, comfortable location where I can sit safely</Label>
  </ChecklistItem>
  
  <ChecklistItem>
    <Checkbox required />
    <Label>I am not currently experiencing dizziness, vertigo, or balance problems</Label>
  </ChecklistItem>
  
  <ChecklistItem>
    <Checkbox required />
    <Label>I do not have ear pain or new discharge from my ear(s)</Label>
  </ChecklistItem>
  
  <ChecklistItem>
    <Checkbox required />
    <Label>My earpiece/headphones are clean and comfortable</Label>
  </ChecklistItem>
  
  <ChecklistItem>
    <Checkbox required />
    <Label>I can stop at any time by closing this window</Label>
  </ChecklistItem>
  
  <ConditionalCheckbox show={menieresDiagnosis}>
    <Checkbox required />
    <Label>I have not had vertigo symptoms in the past 48 hours</Label>
  </ConditionalCheckbox>
  
  <ConditionalCheckbox show={recentSurgery}>
    <Checkbox required />
    <Label>I have written clearance from my surgeon to do this test</Label>
    <Text>Clearance date: {surgeryDate}</Text>
  </ConditionalCheckbox>
  
  <Button primary onClick={startTest}>I Confirm - Start Hearing Test</Button>
  <Button secondary onClick={goBack}>Not Right Now</Button>
</SafetyChecklist>
```

---

## IMPLEMENTATION CODE SAMPLES

### 1. Contraindication Data Structure

```typescript
// src/types/contraindications.ts

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
  modificationStrategy?: string; // For relative contraindications
  tags: string[]; // For grouping: 'infection', 'surgery', 'neurologic', etc.
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
  // ... more contraindications
};

export interface ScreeningResponse {
  [key: string]: boolean | string | undefined;
}

export interface ContraindicationResult {
  identified: Contraindication[];
  canProceed: boolean;
  requiresApproval: Contraindication[];
  modifications: string[];
}
```

### 2. Screening Logic Hook

```typescript
// src/hooks/useContraindicationScreening.ts

import { useState, useCallback } from 'react';
import { Contraindication, ScreeningResponse, ContraindicationResult, CONTRAINDICATIONS } from '../types/contraindications';

export const useContraindicationScreening = () => {
  const [responses, setResponses] = useState<ScreeningResponse>({});
  const [result, setResult] = useState<ContraindicationResult | null>(null);

  const evaluateContraindications = useCallback((screeningAnswers: ScreeningResponse): ContraindicationResult => {
    const identified: Contraindication[] = [];
    const requiresApproval: Contraindication[] = [];
    const modifications: string[] = [];

    // Absolute contraindications (any one blocks testing)
    if (screeningAnswers.suddenHearingLoss) {
      identified.push(CONTRAINDICATIONS.SSNHL);
    }
    
    if (screeningAnswers.earDrainageActive) {
      identified.push(CONTRAINDICATIONS.EAR_DISCHARGE);
    }
    
    if (screeningAnswers.dizzinessVertigo && screeningAnswers.dizzinessRecent) {
      identified.push(CONTRAINDICATIONS.ACUTE_VERTIGO);
    }
    
    if (screeningAnswers.recentEarSurgery && !screeningAnswers.hasSurgeonClearance) {
      requiresApproval.push(CONTRAINDICATIONS.POST_SURGICAL);
    }
    
    if (screeningAnswers.eardArmPerforation) {
      identified.push(CONTRAINDICATIONS.TM_PERFORATION);
    }
    
    if (screeningAnswers.retrocochlearDiagnosis) {
      requiresApproval.push(CONTRAINDICATIONS.RETROCOCHLEAR);
    }

    // Relative contraindications (apply modifications)
    if (screeningAnswers.meniersDiagnosis) {
      if (screeningAnswers.meniereCurrentAttack) {
        identified.push(CONTRAINDICATIONS.MENIERES_ACTIVE);
      } else {
        modifications.push('Test during Meniere\'s remission only. Avoid 48h post-attack.');
      }
    }
    
    if (screeningAnswers.chronicDrainageHistory) {
      modifications.push('Use bone-conduction headphones. Keep ear dry.');
    }
    
    if (screeningAnswers.otosclerosis) {
      modifications.push('Testing at lower maximum volume to avoid over-stimulation.');
    }
    
    if (screeningAnswers.ototoxicMeds) {
      modifications.push('Baseline testing before medication; monthly monitoring recommended.');
    }
    
    if (screeningAnswers.recentHeadTrauma) {
      modifications.push('Defer testing until post-concussion symptoms resolved.');
    }

    const canProceed = identified.length === 0 && requiresApproval.length === 0;

    return {
      identified,
      requiresApproval,
      canProceed,
      modifications
    };
  }, []);

  const recordResponses = useCallback((newResponses: ScreeningResponse) => {
    setResponses(newResponses);
    const result = evaluateContraindications(newResponses);
    setResult(result);
  }, [evaluateContraindications]);

  return {
    responses,
    result,
    recordResponses,
    evaluateContraindications
  };
};
```

### 3. Screening Component (Revised ContraindicationReport)

```typescript
// src/components/ContraindicationScreening.tsx

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AlertTriangle, ShieldCheck, XCircle, CheckCircle } from 'lucide-react';
import { Card, Button } from './ui/basic';
import { useContraindicationScreening } from '../hooks/useContraindicationScreening';
import { ScreeningResponse } from '../types/contraindications';

interface ContraindicationScreeningProps {
  onScreeningComplete: (canProceed: boolean) => void;
}

export const ContraindicationScreening: React.FC<ContraindicationScreeningProps> = ({ onScreeningComplete }) => {
  const { result, recordResponses } = useContraindicationScreening();
  const [currentStep, setCurrentStep] = useState(0);

  const absoluteRedFlags = [
    {
      key: 'suddenHearingLoss',
      question: 'Have you noticed a sudden drop in hearing within the past 3 weeks?',
      detail: 'This is a medical emergency requiring urgent ENT evaluation.'
    },
    {
      key: 'earDrainageActive',
      question: 'Do you have any drainage or discharge from your ear(s) right now?',
      detail: 'Active infection requires medical treatment before testing.'
    },
    {
      key: 'dizzinessVertigo',
      question: 'Are you experiencing severe dizziness or a spinning sensation?',
      detail: 'This could indicate a balance disorder requiring evaluation.'
    },
    // ... more red flags
  ];

  const relativeFlags = [
    {
      key: 'meniersDiagnosis',
      question: 'Have you been diagnosed with Meniere\'s disease?',
      detail: 'Testing is safe during remission periods (no current vertigo).',
      conditional: 'meniereCurrentAttack'
    },
    // ... more relative flags
  ];

  const handleResponse = (responses: ScreeningResponse) => {
    recordResponses(responses);
    if (result?.canProceed) {
      onScreeningComplete(true);
    }
  };

  if (!result) {
    return <div>Loading screening questionnaire...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
        <div className="p-2 bg-red-50 text-red-600 rounded-lg">
          <AlertTriangle size={20} />
        </div>
        <div>
          <h3 className="font-serif text-xl">Safety Screening</h3>
          <p className="text-[10px] uppercase font-bold tracking-widest text-accent-sage">Before we start</p>
        </div>
      </div>

      {/* Absolute Red Flags */}
      {absoluteRedFlags.map((flag, idx) => (
        <div key={flag.key} className="space-y-2">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="radio"
              name={flag.key}
              value="yes"
              onChange={() => handleResponse({ ...result, [flag.key]: true })}
              className="w-4 h-4"
            />
            <span className="text-sm font-medium">{flag.question}</span>
          </label>
          <label className="flex items-center gap-3 cursor-pointer ml-7">
            <input
              type="radio"
              name={flag.key}
              value="no"
              onChange={() => handleResponse({ ...result, [flag.key]: false })}
              className="w-4 h-4"
            />
            <span className="text-sm">No</span>
          </label>
          {result?.[flag.key] === true && (
            <Card className="bg-red-50 border-red-100 p-4 text-red-800 text-sm">
              <p className="font-semibold mb-2">⚠️ Cannot proceed</p>
              <p>{flag.detail}</p>
            </Card>
          )}
        </div>
      ))}

      {/* Show progress */}
      {result.identified.length > 0 && (
        <Card className="bg-red-50 border-red-200 p-4">
          <div className="flex gap-2">
            <XCircle className="text-red-600 flex-shrink-0" size={20} />
            <div>
              <p className="font-semibold text-red-800">We found {result.identified.length} concern(s)</p>
              <p className="text-sm text-red-700 mt-1">
                You'll need to address these before using this app.
              </p>
            </div>
          </div>
        </Card>
      )}

      {result.canProceed && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <Card className="bg-emerald-50 border-emerald-200 p-4">
            <div className="flex gap-2">
              <CheckCircle className="text-emerald-600 flex-shrink-0" size={20} />
              <div>
                <p className="font-semibold text-emerald-800">Screening complete</p>
                <p className="text-sm text-emerald-700 mt-1">
                  No absolute contraindications detected. {result.modifications.length > 0 && 'But we have some precautions to follow.'}
                </p>
              </div>
            </div>

            {result.modifications.length > 0 && (
              <div className="mt-4 pt-4 border-t border-emerald-200">
                <p className="font-semibold text-sm text-emerald-800 mb-2">Modifications for you:</p>
                <ul className="space-y-1">
                  {result.modifications.map((mod, idx) => (
                    <li key={idx} className="text-sm text-emerald-700">• {mod}</li>
                  ))}
                </ul>
              </div>
            )}

            <Button className="w-full mt-4" onClick={() => onScreeningComplete(true)}>
              Start Hearing Assessment
            </Button>
          </Card>
        </motion.div>
      )}
    </div>
  );
};
```

---

## USER COMMUNICATION TEMPLATES

### Email Template: Referral Communication

```
Subject: Longevity Hearing App - Need for Medical Evaluation

Dear [User],

You just completed a health screening with Longevity Hearing and we identified something that requires professional medical evaluation before you can proceed.

**What we found:** [Contraindication identified]

**What this means:** [Plain-language explanation of medical significance]

**Next steps:**
1. Schedule an appointment with [recommended specialist: ENT, neurologist, etc.]
2. Share these findings with your doctor: [technical details]
3. Ask your doctor: [specific question to ask]
4. Once cleared, you can return to use Longevity Hearing

**Resources:**
- Find an ENT specialist: [link to AAOHNS directory]
- Medical information: [link to educational resource]
- Frequently asked questions: [link to FAQ]

If you have any questions, please contact our clinical support team at [email/phone].

Best regards,
Longevity Hearing Clinical Team
```

### In-App Message: Absolute Contraindication Detected

```
🛑 STOP - Medical Evaluation Needed

You've reported a condition that requires professional medical evaluation before we can safely proceed.

**[Contraindication]: [Brief description]**

Your safety is our top priority. This app works best for people with stable hearing conditions. Your reported symptom suggests you need medical attention first.

RECOMMENDED ACTION:
→ Contact an ENT specialist (or ER if urgent)
→ Tell them what you reported: [specific symptom]
→ Get medical evaluation and treatment
→ Return to this app once cleared by your doctor

[BUTTON: Find ENT Near Me] [BUTTON: Emergency Room Info]
```

### Post-Test Message: Concerning Findings

```
⚠️ Note About Your Results

Your hearing test shows some findings that may warrant discussion with your doctor:

**Finding:** [e.g., "Sudden change in hearing at 4000 Hz"]
**What it might mean:** [e.g., "Could indicate high-frequency hearing loss"]
**Next step:** Share these results with your ENT or primary care doctor

This app is for general hearing health awareness, not diagnosis. A licensed audiologist or physician should evaluate any new or concerning changes.

[BUTTON: Download Results to Share with Doctor]
[BUTTON: Find an Audiologist Near Me]
```

---

## SUMMARY & RECOMMENDATIONS

### Current Implementation Status
✅ **ContraindicationReport component exists** with 4 items  
❌ **Missing 7 critical absolute contraindications**  
❌ **Missing relative contraindication logic**  
❌ **No screening questionnaire integration**  
❌ **No referral pathway system**  

### Priority Implementation Plan

**Week 1:**
1. Expand contraindication database (14 total conditions)
2. Create screening questionnaire with conditional logic
3. Integrate into HearingTest component (pre-test gate)

**Week 2:**
1. Add referral pathway system
2. Create communication templates
3. Add pre-test safety checklist

**Week 3:**
1. User testing with actual users
2. Refinement based on feedback
3. Medical review by clinical advisors

**Month 2:**
1. Integration with external referral directories
2. Specialist communication automation
3. Patient education resource library

---

**Report Status:** READY FOR IMPLEMENTATION  
**Next Review:** After initial implementation feedback  
**Clinical Review:** Recommended by licensed ENT/Audiologist before deployment
