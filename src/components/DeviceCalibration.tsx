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
      <div className="text-center space-y-4">
        <h2 className="text-3xl font-serif">Setup Audio Device</h2>
        <p className="text-accent-sage text-base">For clinical accuracy, pure-tone audiometry requires specialized calibration.</p>
      </div>

      <div className="grid gap-4">
        {devices.map((device) => (
          <button
            key={device.id}
            onClick={() => setSelected(device.id)}
            className={`flex items-center gap-5 p-6 rounded-3xl border-2 text-left transition-all ${
              selected === device.id
                ? 'border-accent-teal bg-teal-50/30'
                : 'border-slate-100 bg-white hover:border-slate-200'
            }`}
          >
            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-2xl ${selected === device.id ? 'bg-accent-teal text-white' : 'bg-slate-50 text-slate-400'}`}>
              {device.icon}
            </div>
            <div className="flex-1">
              <div className="font-semibold text-lg">{device.label}</div>
              <div className={`text-sm ${device.warning ? 'text-amber-600' : 'text-accent-sage'}`}>{device.sub}</div>
            </div>
          </button>
        ))}
      </div>

      {selected && selected !== 'speakers' && (
        <div className="space-y-4">
          <Card className="flex items-center justify-between p-5 bg-slate-50 border-none">
            <div className="flex items-center gap-3">
              <Info size={24} className="text-accent-sage" />
              <span className="text-base font-medium">Noise Cancelling Active?</span>
            </div>
            <button
              onClick={() => setNc(!nc)}
              className={`w-14 h-8 rounded-full transition-colors relative ${nc ? 'bg-accent-teal' : 'bg-slate-200'}`}
            >
              <div className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full transition-transform ${nc ? 'translate-x-6' : ''}`} />
            </button>
          </Card>

          <div className="bg-amber-50/50 p-5 rounded-2xl flex gap-3 text-base text-amber-700 leading-relaxed">
            <Smartphone size={20} className="shrink-0 flex-shrink-0" />
            <span>If you hear a background hiss in your earbuds, set your phone volume to 75% and allow the app to control the testing floor.</span>
          </div>
        </div>
      )}

      <div className="flex flex-col gap-4">
        <Button
          disabled={!selected}
          onClick={() => onSelect(selected!, nc)}
          className="w-full h-16 text-lg"
        >
          Confirm Settings
        </Button>
        <Button
          onClick={() => onSelect('headphones', false)}
          variant="secondary"
          className="w-full h-16 text-lg"
        >
          Skip & Use Defaults
        </Button>
      </div>
    </motion.div>
  );
};
