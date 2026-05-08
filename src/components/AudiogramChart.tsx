import React from 'react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  ReferenceArea,
  Dot
} from 'recharts';

interface TestResult {
  side: 'left' | 'right' | 'both';
  freq: number;
  db: number;
}

interface AudiogramChartProps {
  results: TestResult[];
}

const CATEGORIES = [
  { label: 'Normal', min: -10, max: 20, color: '#f0fdfa' },
  { label: 'Mild', min: 20, max: 40, color: '#fffbeb' },
  { label: 'Moderate', min: 40, max: 60, color: '#fff7ed' },
  { label: 'Severe', min: 60, max: 80, color: '#fef2f2' },
  { label: 'Profound', min: 80, max: 100, color: '#450a0a05' },
];

export const AudiogramChart: React.FC<AudiogramChartProps> = ({ results }) => {
  // Sort frequencies for the line chart to connect correctly
  const freqSet = new Set(results.map(r => r.freq));
  const sortedFrequencies: number[] = Array.from(freqSet).sort((a, b) => (a as number) - (b as number)) as number[];
  
  const chartData = sortedFrequencies.map((freq) => {
    const leftRes = results.find(r => r.freq === freq && r.side === 'left');
    const rightRes = results.find(r => r.freq === freq && r.side === 'right');
    const bothRes = results.find(r => r.freq === freq && r.side === 'both');
    
    return {
      freq,
      freqLabel: freq >= 1000 ? `${(freq as number) / 1000}k` : freq.toString(),
      left: leftRes?.db,
      right: rightRes?.db,
      both: bothRes?.db,
    };
  });

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-slate-100 shadow-xl rounded-xl text-[10px]">
          <p className="font-bold mb-1">{label} Hz</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} style={{ color: entry.color }} className="font-medium">
              {entry.name}: {entry.value} dB HL
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-3">
      {/* Chart Legend */}
      <div className="flex flex-wrap gap-4 px-4 text-xs">
        <div className="flex items-center gap-2">
          <div className="w-3 h-0.5 bg-blue-500 rounded-full" />
          <span className="font-medium">Left Ear (X)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-0.5 bg-red-500 rounded-full" />
          <span className="font-medium">Right Ear (O)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-0.5 bg-teal-500 rounded-full border-b border-dashed" />
          <span className="font-medium">Both Ears</span>
        </div>
      </div>

      {/* Chart Container */}
      <div className="w-full h-[320px] font-sans">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={chartData}
          margin={{ top: 10, right: 30, left: -20, bottom: 20 }}
        >
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
          
          {/* Background Zones */}
          {CATEGORIES.map((cat, i) => {
            const RefArea = ReferenceArea as any;
            return (
              <RefArea 
                key={`cat-${i}`}
                y1={cat.min} 
                y2={cat.max} 
                fill={cat.color} 
                fillOpacity={1}
                stroke="none"
              />
            );
          })}

          <XAxis 
            dataKey="freqLabel" 
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 10, fontWeight: 500, fill: '#94a3b8' }}
            label={{ value: 'Frequency (Hz)', position: 'bottom', offset: 0, fontSize: 10, fill: '#64748b' }}
          />
          
          <YAxis 
            domain={[-10, 90]} 
            reversed 
            ticks={[-10, 0, 20, 40, 60, 80, 90]}
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 10, fontWeight: 500, fill: '#94a3b8' }}
            label={{ value: 'Hearing Level (dB)', angle: -90, position: 'left', offset: -10, fontSize: 10, fill: '#64748b' }}
          />
          
          <Tooltip content={<CustomTooltip />} />
          
          <Line 
            name="Left Ear (X)" 
            type="monotone" 
            dataKey="left" 
            stroke="#3b82f6" 
            strokeWidth={2}
            dot={{ r: 4, stroke: '#3b82f6', strokeWidth: 2, fill: '#fff' }}
            activeDot={{ r: 6 }}
            connectNulls
          />
          
          <Line 
            name="Right Ear (O)" 
            type="monotone" 
            dataKey="right" 
            stroke="#ef4444" 
            strokeWidth={2}
            dot={{ r: 4, stroke: '#ef4444', strokeWidth: 2, fill: '#fff' }}
            activeDot={{ r: 6 }}
            connectNulls
          />

          <Line 
            name="Both Ears" 
            type="monotone" 
            dataKey="both" 
            stroke="#0d9488" 
            strokeWidth={2}
            strokeDasharray="5 5"
            dot={{ r: 4, stroke: '#0d9488', strokeWidth: 2, fill: '#fff' }}
            activeDot={{ r: 6 }}
            connectNulls
          />
        </LineChart>
      </ResponsiveContainer>
      </div>
    </div>
  );
};
