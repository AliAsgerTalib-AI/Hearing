import React from 'react';
import { motion } from 'motion/react';
import { AlertTriangle, ShieldCheck, XCircle, FileText } from 'lucide-react';
import { Card } from './ui/basic';

export const ContraindicationReport = () => {
  const contraindications = [
    {
      title: "Sudden Hearing Loss",
      description: "Any sudden decrease in hearing (within 72 hours) is a medical emergency. Seek ENT consultation immediately.",
      severity: "critical"
    },
    {
      title: "Active Ear Discharge",
      description: "Drainage, fluid, or blood from the ear canal requires immediate medical assessment.",
      severity: "high"
    },
    {
      title: "Unilateral Tinnitus",
      description: "Persistent ringing or buzzing in only one ear should be evaluated for potential neurological causes.",
      severity: "medium"
    },
    {
      title: "Dizziness or Vertigo",
      description: "Balance issues associated with hearing changes may indicate inner ear pathologies like Meniere's Disease.",
      severity: "high"
    }
  ];

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
        <div className="p-2 bg-amber-50 text-amber-600 rounded-lg">
          <FileText size={20} />
        </div>
        <div>
          <h3 className="font-serif text-xl">Contraindication Safety Report</h3>
          <p className="text-[10px] uppercase font-bold tracking-widest text-accent-sage">Psychoacoustic Red Flags</p>
        </div>
      </div>

      <div className="grid gap-3">
        {contraindications.map((c, i) => (
          <div key={i}>
            <Card className={`p-4 flex gap-4 ${c.severity === 'critical' ? 'bg-red-50 border-red-100' : 'bg-white'}`}>
              <div className={`shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
                c.severity === 'critical' ? 'bg-red-100 text-red-600' : 
                c.severity === 'high' ? 'bg-amber-100 text-amber-600' : 
                'bg-blue-100 text-blue-600'
              }`}>
                <AlertTriangle size={18} />
              </div>
              <div className="space-y-1">
                <h4 className="font-semibold text-sm">{c.title}</h4>
                <p className="text-xs text-slate-500 leading-relaxed">{c.description}</p>
              </div>
            </Card>
          </div>
        ))}
      </div>

      <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100 flex gap-3 text-emerald-800 text-xs items-center">
        <ShieldCheck size={20} className="shrink-0" />
        <p>If none of these red flags are present, you may proceed with neuroplasticity training, but always consult a licensed Audiologist for diagnosis.</p>
      </div>
    </motion.div>
  );
};
