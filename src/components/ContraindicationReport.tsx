import React from 'react';
import { motion } from 'motion/react';
import { AlertTriangle, ShieldCheck, XCircle, FileText, ChevronDown } from 'lucide-react';
import { Card } from './ui/basic';
import {
  getAbsoluteContraindications,
  getRelativeContraindications,
  Contraindication
} from '../types/contraindications';

interface ContraindicationReportProps {
  showRelative?: boolean;
  expandAll?: boolean;
}

export const ContraindicationReport: React.FC<ContraindicationReportProps> = ({
  showRelative = true,
  expandAll = false
}) => {
  const absoluteContras = getAbsoluteContraindications();
  const relativeContras = getRelativeContraindications();

  const [expandedItems, setExpandedItems] = React.useState<Set<string>>(
    new Set(expandAll ? [...absoluteContras, ...relativeContras].map(c => c.id) : [])
  );

  const toggleExpanded = (id: string) => {
    const newSet = new Set(expandedItems);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setExpandedItems(newSet);
  };

  const ContraindicationCard = ({ item }: { item: Contraindication }) => {
    const isExpanded = expandedItems.has(item.id);
    const severityColors = {
      critical: { bg: 'bg-red-50', border: 'border-red-100', icon: 'bg-red-100 text-red-600', label: 'CRITICAL' },
      high: { bg: 'bg-amber-50', border: 'border-amber-100', icon: 'bg-amber-100 text-amber-600', label: 'HIGH' },
      medium: { bg: 'bg-yellow-50', border: 'border-yellow-100', icon: 'bg-yellow-100 text-yellow-600', label: 'CAUTION' },
      low: { bg: 'bg-blue-50', border: 'border-blue-100', icon: 'bg-blue-100 text-blue-600', label: 'INFO' }
    };

    const colors = severityColors[item.severity];

    return (
      <motion.div key={item.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <Card
          className={`p-4 cursor-pointer transition-all ${colors.bg} ${colors.border} flex gap-4`}
          onClick={() => toggleExpanded(item.id)}
        >
          <div className={`shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${colors.icon}`}>
            <AlertTriangle size={18} />
          </div>
          <div className="flex-1 space-y-1">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold text-sm">{item.title}</h4>
              <div className="flex items-center gap-2">
                <span className="text-[9px] font-bold uppercase px-2 py-1 bg-white/50 rounded text-slate-600">
                  {colors.label}
                </span>
                <ChevronDown
                  size={16}
                  className={`transition-transform ${isExpanded ? 'rotate-180' : ''} text-slate-400`}
                />
              </div>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">{item.description}</p>

            {isExpanded && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="pt-3 mt-3 border-t border-slate-200 space-y-2 text-[11px]"
              >
                {item.modificationStrategy && (
                  <div>
                    <p className="font-semibold text-slate-700">📋 Modification Strategy:</p>
                    <p className="text-slate-600 mt-1">{item.modificationStrategy}</p>
                  </div>
                )}
                <div>
                  <p className="font-semibold text-slate-700">🏥 Referral Protocol:</p>
                  <p className="text-slate-600 mt-1">{item.referralProtocol}</p>
                </div>
                <div>
                  <p className="font-semibold text-slate-700">✅ Guidance:</p>
                  <p className="text-slate-600 mt-1">{item.guidance}</p>
                </div>
              </motion.div>
            )}
          </div>
        </Card>
      </motion.div>
    );
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
        <div className="p-2 bg-amber-50 text-amber-600 rounded-lg">
          <FileText size={20} />
        </div>
        <div>
          <h3 className="font-serif text-xl">Medical Safety Screening</h3>
          <p className="text-[10px] uppercase font-bold tracking-widest text-accent-sage">
            Contraindications to hearing assessment
          </p>
        </div>
      </div>

      {/* Absolute Contraindications Section */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 px-2">
          <div className="w-2 h-2 rounded-full bg-red-600" />
          <h4 className="text-sm font-semibold text-slate-700">
            DO NOT TEST IF (Absolute Contraindications)
          </h4>
        </div>
        <div className="space-y-2">
          {absoluteContras.map(c => (
            <ContraindicationCard key={c.id} item={c} />
          ))}
        </div>
      </div>

      {/* Relative Contraindications Section */}
      {showRelative && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 px-2">
            <div className="w-2 h-2 rounded-full bg-amber-600" />
            <h4 className="text-sm font-semibold text-slate-700">
              TEST WITH CAUTION (Relative Contraindications)
            </h4>
          </div>
          <div className="space-y-2">
            {relativeContras.map(c => (
              <ContraindicationCard key={c.id} item={c} />
            ))}
          </div>
        </div>
      )}

      <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100 flex gap-3 text-emerald-800 text-xs items-center">
        <ShieldCheck size={20} className="shrink-0" />
        <p>
          If none of the absolute contraindications apply, you may proceed. Always consult a licensed Audiologist
          for formal diagnosis. This is a screening tool, not a diagnostic device.
        </p>
      </div>
    </motion.div>
  );
};
