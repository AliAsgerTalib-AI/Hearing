import { EnvironmentId } from '../../types/scenarios';

export interface MapZone {
  id: string;
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

export const MAP_DEFINITIONS: Record<EnvironmentId, { width: number; height: number; zones: MapZone[] }> = {
  restaurant: {
    width: 30,
    height: 20,
    zones: [
      { id: 'entrance', name: 'Entrance', x: 2, y: 8, width: 4, height: 4 },
      { id: 'bar', name: 'Bar', x: 8, y: 2, width: 6, height: 3 },
      { id: 'tables-left', name: 'Tables (Left)', x: 2, y: 13, width: 8, height: 6 },
      { id: 'tables-right', name: 'Tables (Right)', x: 15, y: 13, width: 8, height: 6 },
      { id: 'kitchen', name: 'Kitchen', x: 20, y: 2, width: 8, height: 5 },
    ],
  },
  airport: {
    width: 50,
    height: 28,
    zones: [
      { id: 'check-in', name: 'Check-In', x: 2, y: 2, width: 12, height: 8 },
      { id: 'security', name: 'Security', x: 18, y: 2, width: 10, height: 8 },
      { id: 'gates-a', name: 'Gates A-B', x: 35, y: 2, width: 12, height: 8 },
      { id: 'gates-b', name: 'Gates C-D', x: 35, y: 14, width: 12, height: 8 },
      { id: 'food-court', name: 'Food Court', x: 18, y: 14, width: 12, height: 8 },
    ],
  },
  subway: {
    width: 10,
    height: 60,
    zones: [
      { id: 'platform-north', name: 'North Platform', x: 1, y: 2, width: 8, height: 10 },
      { id: 'platform-south', name: 'South Platform', x: 1, y: 48, width: 8, height: 10 },
      { id: 'turnstiles', name: 'Turnstiles', x: 2, y: 20, width: 6, height: 6 },
      { id: 'exit', name: 'Exit', x: 2, y: 30, width: 6, height: 6 },
      { id: 'waiting-area', name: 'Waiting', x: 0.5, y: 38, width: 4, height: 6 },
    ],
  },
  concert_hall: {
    width: 60,
    height: 80,
    zones: [
      { id: 'stage', name: 'Stage', x: 20, y: 5, width: 20, height: 8 },
      { id: 'main-floor', name: 'Main Floor', x: 10, y: 18, width: 40, height: 35 },
      { id: 'balcony-left', name: 'Balcony Left', x: 2, y: 18, width: 6, height: 20 },
      { id: 'balcony-right', name: 'Balcony Right', x: 52, y: 18, width: 6, height: 20 },
      { id: 'entrance', name: 'Entrance', x: 25, y: 60, width: 10, height: 5 },
    ],
  },
  times_square: {
    width: 40,
    height: 30,
    zones: [
      { id: 'street-north', name: 'Street North', x: 2, y: 2, width: 36, height: 6 },
      { id: 'street-south', name: 'Street South', x: 2, y: 22, width: 36, height: 6 },
      { id: 'shops-left', name: 'Shops Left', x: 2, y: 10, width: 8, height: 10 },
      { id: 'shops-right', name: 'Shops Right', x: 30, y: 10, width: 8, height: 10 },
      { id: 'plaza', name: 'Central Plaza', x: 15, y: 10, width: 10, height: 10 },
    ],
  },
};
