import React from 'react';
import { motion } from 'motion/react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { Card } from './ui/basic';
import { analyzeProgression, buildTrendChartData } from '../lib/temporalProgression';
import { HearingHistoryEntry } from '../types/index';

interface ProgressionPanelProps {
  history: HearingHistoryEntry[];
}

export const ProgressionPanel: React.FC<ProgressionPanelProps> = ({ history }) => {
  if (history.length < 2) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center py-12 px-6 bg-slate-50/50 rounded-3xl border border-slate-100 border-dashed"
      >
        <p className="text-xs text-slate-400 font-medium italic">
          Complete your second assessment to see trends and temporal changes in your hearing profile.
        </p>
      </motion.div>
    );
  }

  const progression = analyzeProgression(history);
  const trendData = buildTrendChartData(history);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-slate-100 shadow-xl rounded-xl text-[10px]">
          <p className="font-bold mb-1">{payload[0].payload.dateLabel}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} style={{ color: entry.color }} className="font-medium">
              {entry.name}: {entry.value} dB
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      <Card className="p-0 overflow-hidden">
        <div className="p-4 bg-slate-50/50 border-b border-slate-100">
          <h4 className="font-bold text-[10px] uppercase tracking-widest text-accent-sage">
            Hearing Progression Analysis
          </h4>
        </div>
        <div className="w-full h-[240px] p-4">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={trendData}
              margin={{ top: 10, right: 30, left: -20, bottom: 20 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis
                dataKey="dateLabel"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 10, fontWeight: 500, fill: '#94a3b8' }}
              />
              <YAxis
                domain={[0, 80]}
                reversed
                ticks={[0, 20, 40, 60, 80]}
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 10, fontWeight: 500, fill: '#94a3b8' }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Line
                name="Left Ear"
                type="monotone"
                dataKey="avgLeft"
                stroke="#3b82f6"
                strokeWidth={2}
                dot={{ r: 3, fill: '#3b82f6' }}
                connectNulls
              />
              <Line
                name="Right Ear"
                type="monotone"
                dataKey="avgRight"
                stroke="#ef4444"
                strokeWidth={2}
                dot={{ r: 3, fill: '#ef4444' }}
                connectNulls
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Significant Deltas Badge Row */}
      {progression.significantDeltas.length > 0 && (
        <Card className="p-4 space-y-3">
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-700">
            Notable Changes
          </p>
          <div className="flex flex-wrap gap-2">
            {progression.significantDeltas.map((delta, i) => {
              const isImproved = delta.delta < -5;
              const isWorsened = delta.delta > 5;
              const color = isImproved ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                           isWorsened ? 'bg-red-50 text-red-700 border-red-200' :
                           'bg-amber-50 text-amber-700 border-amber-200';

              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className={`px-3 py-2 rounded-lg border text-xs font-medium ${color}`}
                >
                  {delta.freq} Hz {delta.side}: {delta.delta > 0 ? '+' : ''}{delta.delta} dB
                </motion.div>
              );
            })}
          </div>
        </Card>
      )}

      {/* Trend Summary */}
      <Card className="p-4 space-y-2 bg-slate-50/30">
        <div className="flex items-center gap-2">
          {progression.trendSlopeLeft && progression.trendSlopeLeft > 0.1 ? (
            <TrendingUp size={14} className="text-red-500" />
          ) : (
            <TrendingDown size={14} className="text-emerald-500" />
          )}
          <p className="text-xs font-medium text-slate-700">
            {progression.overallInterpretation}
          </p>
        </div>
      </Card>
    </motion.div>
  );
};
