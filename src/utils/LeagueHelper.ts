export interface LeagueInfo {
  id: string;
  name: string;
  minKp: number;
  maxKp: number;
  icon: string;
  vectorIcon: string;
  color: string;
  glowColor: string;
  badgeBg: [string, string];
  tierTitle: string;
}

export const LEAGUES: LeagueInfo[] = [
  { 
    id: 'amateur',
    name: 'Amatör Küme', 
    minKp: 0, 
    maxKp: 500, 
    icon: '🛡️', 
    vectorIcon: 'shield-outline',
    color: '#94A3B8',
    glowColor: 'rgba(148, 163, 184, 0.5)',
    badgeBg: ['#334155', '#0F172A'],
    tierTitle: 'AMATÖR'
  },
  { 
    id: 'league3',
    name: '3. Lig', 
    minKp: 501, 
    maxKp: 1500, 
    icon: '🥉', 
    vectorIcon: 'shield-sharp',
    color: '#CD7F32',
    glowColor: 'rgba(205, 127, 50, 0.6)',
    badgeBg: ['#78350F', '#1F2937'],
    tierTitle: 'BRONZ'
  },
  { 
    id: 'league2',
    name: '2. Lig', 
    minKp: 1501, 
    maxKp: 3000, 
    icon: '🥈', 
    vectorIcon: 'ribbon',
    color: '#38BDF8',
    glowColor: 'rgba(56, 189, 248, 0.6)',
    badgeBg: ['#0284C7', '#0F172A'],
    tierTitle: 'GÜMÜŞ'
  },
  { 
    id: 'league1',
    name: '1. Lig', 
    minKp: 3001, 
    maxKp: 5000, 
    icon: '🥇', 
    vectorIcon: 'medal',
    color: '#F59E0B',
    glowColor: 'rgba(245, 158, 11, 0.7)',
    badgeBg: ['#B45309', '#451A03'],
    tierTitle: 'ALTIN'
  },
  { 
    id: 'super',
    name: 'Süper Lig', 
    minKp: 5001, 
    maxKp: 8000, 
    icon: '🏆', 
    vectorIcon: 'trophy',
    color: '#10B981',
    glowColor: 'rgba(16, 185, 129, 0.8)',
    badgeBg: ['#047857', '#022C22'],
    tierTitle: 'SÜPER'
  },
  { 
    id: 'champions',
    name: 'Şampiyonlar Ligi', 
    minKp: 8001, 
    maxKp: Infinity, 
    icon: '👑', 
    vectorIcon: 'star',
    color: '#EC4899',
    glowColor: 'rgba(236, 72, 153, 0.9)',
    badgeBg: ['#BE185D', '#4C0519'],
    tierTitle: 'EFSANE'
  }
];

export function getLeagueForKp(kp: number): LeagueInfo {
  return LEAGUES.find(l => kp >= l.minKp && kp <= l.maxKp) || LEAGUES[0];
}
