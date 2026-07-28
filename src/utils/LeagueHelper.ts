export interface LeagueInfo {
  name: string;
  minKp: number;
  maxKp: number;
  icon: string;
  color: string;
}

export const LEAGUES: LeagueInfo[] = [
  { name: 'Amatör Küme', minKp: 0, maxKp: 500, icon: '🎒', color: '#B3B3B3' },
  { name: '3. Lig', minKp: 501, maxKp: 1500, icon: '🥉', color: '#CD7F32' },
  { name: '2. Lig', minKp: 1501, maxKp: 3000, icon: '🥈', color: '#C0C0C0' },
  { name: '1. Lig', minKp: 3001, maxKp: 5000, icon: '🥇', color: '#FFD700' },
  { name: 'Süper Lig', minKp: 5001, maxKp: 8000, icon: '🏆', color: '#1DB954' },
  { name: 'Şampiyonlar Ligi', minKp: 8001, maxKp: Infinity, icon: '🌟', color: '#8E44AD' }
];

export function getLeagueForKp(kp: number): LeagueInfo {
  return LEAGUES.find(l => kp >= l.minKp && kp <= l.maxKp) || LEAGUES[0];
}
