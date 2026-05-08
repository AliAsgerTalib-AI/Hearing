import React from 'react';
import { motion } from 'motion/react';
import { Headphones, Smartphone, Ear, Speaker, Info } from 'lucide-react';
import { Card, Button } from './ui/basic';

export type DeviceType = 'earbuds' | 'iem' | 'headphones' | 'speakers';

interface DeviceCalibrationProps {
  onSelect: (device: DeviceType, noiseCancelling: boolean) => void;
}

export const DeviceCalibration = ({ onSelect }: DeviceCalibrationProps) => {
  const [selected, setSelected] = React.useState<DeviceType | null>(null);
  const [nc, setNc] = React.useState(false);

  const devices = [
    { id: 'earbuds' as DeviceType, label: 'Earbuds', icon: <Ear />, sub: 'Standard in-ear' },
    { id: 'iem' as DeviceType, label: 'Pro IEMs', icon: <Ear />, sub: 'High-seal studio monitors' },
    { id: 'headphones' as DeviceType, label: 'Headphones', icon: <Headphones />, sub: 'Over-ear style' },
    { id: 'speakers' as DeviceType, label: 'Phone Speakers', icon: <Speaker />, sub: 'Not Recommended', warning: true },
  ];

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8"
    >
      <div className="text-center space-y-3">
        <h2 className="text-2xl font-serif">Setup Audio Device</h2>
        <p className="text-accent-sage text-sm">For clinical accuracy, pure-tone audiometry requires specialized calibration.</p>
      </div>

      <div className="grid gap-3">
        {devices.map((device) => (
          <button
            key={device.id}
            onClick={() => setSelected(device.id)}
            className={`flex items-center gap-4 p-5 rounded-3xl border-2 text-left transition-all ${
              selected === device.id 
                ? 'border-accent-teal bg-teal-50/30' 
                : 'border-slate-100 bg-white hover:border-slate-200'
            }`}
          >
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${selected === device.id ? 'bg-accent-teal text-white' : 'bg-slate-50 text-slate-400'}`}>
              {device.icon}
            </div>
            <div className="flex-1">
              <div className="font-semibold">{device.label}</div>
              <div className={`text-xs ${device.warning ? 'text-amber-600' : 'text-accent-sage'}`}>{device.sub}</div>
            </div>
          </button>
        ))}
      </div>

      {selected && selected !== 'speakers' && (
        <div className="space-y-3">
          <Card className="flex items-center justify-between p-4 bg-slate-50 border-none">
            <div className="flex items-center gap-3">
              <Info size={18} className="text-accent-sage" />
              <span className="text-sm font-medium">Noise Cancelling Active?</span>
            </div>
            <button 
              onClick={() => setNc(!nc)}
              className={`w-12 h-6 rounded-full transition-colors relative ${nc ? 'bg-accent-teal' : 'bg-slate-200'}`}
            >
              <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${nc ? 'translate-x-6' : ''}`} />
            </button>
          </Card>
          
          <div className="bg-amber-50/50 p-4 rounded-2xl flex gap-3 text-[11px] text-amber-700 leading-tight">
            <Smartphone size={16} className="shrink-0" />
            <span>If you hear a background hiss in your earbuds, set your phone volume to 75% and allow the app to control the testing floor.</span>
          </div>
        </div>
      )}

      <div className="flex flex-col gap-3">
        <Button
          disabled={!selected}
          onClick={() => onSelect(selected!, nc)}
          className="w-full"
        >
          Confirm Settings
        </Button>
        <Button
          onClick={() => onSelect('headphones', false)}
          variant="secondary"
          className="w-full"
        >
          Skip & Use Defaults
        </Button>
      </div>
    </motion.div>
  );
};
