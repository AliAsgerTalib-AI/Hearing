import React from 'react';
import { motion } from 'motion/react';
import { EnvironmentId } from '../../types/scenarios';
import { Vector3 } from '../../lib/SpatialAudioEngine';
import { MAP_DEFINITIONS } from './mapDefinitions';

interface EnvironmentMapProps {
  environment: EnvironmentId;
  listenerPosition?: { x: number; y: number };
  audioSources?: Array<{ id: string; position: Vector3 }>;
  onZoneTap?: (zoneId: string, worldPos: Vector3) => void;
  highlightedZone?: string;
  interactiveMode?: 'free-roam' | 'navigation-answer' | 'display-only';
  isPlaying?: boolean;
}

export function EnvironmentMap({
  environment,
  listenerPosition = { x: 15, y: 10 },
  audioSources = [],
  onZoneTap,
  highlightedZone,
  interactiveMode = 'display-only',
  isPlaying = false,
}: EnvironmentMapProps) {
  const mapDef = MAP_DEFINITIONS[environment];
  const isInteractive = interactiveMode !== 'display-only' && onZoneTap;

  // Scale to SVG coordinates (400x280 viewBox)
  const svgWidth = 400;
  const svgHeight = 280;
  const scaleX = svgWidth / mapDef.width;
  const scaleY = svgHeight / mapDef.height;

  const worldToSvg = (x: number, y: number) => ({
    x: x * scaleX,
    y: y * scaleY,
  });

  const svgListenerPos = worldToSvg(listenerPosition.x, listenerPosition.y);

  return (
    <div className="flex flex-col items-center gap-2">
      <svg
        viewBox={`0 0 ${svgWidth} ${svgHeight}`}
        className={`w-full max-w-md border-2 border-slate-300 rounded-lg bg-slate-50 ${
          isInteractive ? 'cursor-pointer' : ''
        }`}
      >
        {/* Background */}
        <rect width={svgWidth} height={svgHeight} fill="#f1f5f9" />

        {/* Zones */}
        {mapDef.zones.map(zone => {
          const svgZone = worldToSvg(zone.x, zone.y);
          const svgWidth = zone.width * scaleX;
          const svgHeight = zone.height * scaleY;
          const isHighlighted = zone.id === highlightedZone;

          return (
            <motion.rect
              key={zone.id}
              x={svgZone.x}
              y={svgZone.y}
              width={svgWidth}
              height={svgHeight}
              fill={isHighlighted ? '#10b981' : '#e0f2fe'}
              stroke={isHighlighted ? '#059669' : '#0284c7'}
              strokeWidth={2}
              rx={4}
              className={isInteractive ? 'hover:opacity-70 transition-opacity' : ''}
              whileHover={isInteractive ? { fill: '#06b6d4' } : undefined}
              onClick={() => {
                if (isInteractive && onZoneTap) {
                  const worldX = zone.x + zone.width / 2;
                  const worldY = zone.y + zone.height / 2;
                  onZoneTap(zone.id, { x: worldX, y: 0, z: worldY });
                }
              }}
            />
          );
        })}

        {/* Zone labels */}
        {mapDef.zones.map(zone => {
          const svgZone = worldToSvg(zone.x, zone.y);
          const centerX = svgZone.x + (zone.width * scaleX) / 2;
          const centerY = svgZone.y + (zone.height * scaleY) / 2;

          return (
            <text
              key={`label-${zone.id}`}
              x={centerX}
              y={centerY}
              textAnchor="middle"
              dominantBaseline="middle"
              className="text-xs font-semibold fill-slate-700 pointer-events-none"
              fontSize="10"
            >
              {zone.name}
            </text>
          );
        })}

        {/* Audio source indicators */}
        {isPlaying &&
          audioSources.map(source => {
            const sourcePos = worldToSvg(source.position.x, source.position.z);
            return (
              <motion.circle
                key={source.id}
                cx={sourcePos.x}
                cy={sourcePos.y}
                r={6}
                fill="#f97316"
                opacity={0.7}
                animate={{ r: [6, 10, 6] }}
                transition={{ duration: 0.6, repeat: Infinity }}
              />
            );
          })}

        {/* Listener position (pulsing) */}
        <motion.circle
          cx={svgListenerPos.x}
          cy={svgListenerPos.y}
          r={5}
          fill="#14b8a6"
          animate={{ r: [5, 7.5, 5] }}
          transition={{ duration: 2, repeat: Infinity }}
        />
        <circle
          cx={svgListenerPos.x}
          cy={svgListenerPos.y}
          r={5}
          fill="none"
          stroke="#14b8a6"
          strokeWidth={1}
          opacity={0.5}
        />
      </svg>

      {/* Legend */}
      <div className="flex gap-4 text-xs text-slate-600 justify-center">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-full bg-teal-500" />
          <span>You</span>
        </div>
        {isPlaying && (
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-orange-500" />
            <span>Audio</span>
          </div>
        )}
      </div>
    </div>
  );
}
